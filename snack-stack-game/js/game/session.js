// Snack Stack \u2014 GameSession: Catch & Stack controller.
// Owns: plate control + gesture arbitration (drag vs Quick Drop tap), falling objects with motion profiles,
// spawn scheduler + reachability, stack/score, orders/modifiers, ChallengeDirector (hazards/events/bonuses),
// meal quality + Serve/Remake, DiscoveryManager hooks, mission/mode evaluation.
// Godot port map: see PORTING_NOTES.md (CatchStackController / FallingObject / SpawnScheduler / HazardDirector ...).
window.SS = window.SS || {};

SS.Session = class extends SS.Emitter {
  // opts: { mode: story|classic|survival|daily, mission, difficulty, seed, preset, tutorial }
  constructor(opts) {
    super();
    const B = this.B = SS.DATA.balance;
    this.opts = opts;
    this.mode = opts.mode;
    this.mission = opts.mission || null;
    this.diff = SS.DATA.difficulty_profiles.find(d => d.id === (opts.difficulty || "normal"));
    this.preset = opts.preset || null;
    this.seed = opts.seed || (Date.now() & 0xffffffff);
    this.rng = new SS.RNG(this.seed);
    this.stack = new SS.Stack(B);
    this.score = new SS.Score(B);
    this.plate = { x: 540, targetX: 540, vx: 0, y: B.plate.y };
    this.objects = []; this.fx = []; this.debris = []; this.served = null;
    this.uid = 1; this.simTime = 0; this.acc = 0;
    this.state = "ready"; this.blocked = null; this.ended = false;
    // Fair-play extras (v1.5): one opt-in revive per run, and an Assist mode the player turns on themselves.
    // Neither looks at who the player is; Daily uses the standard rules so its leaderboard stays comparable.
    this.revived = false; this.reviveReason = null; this.tutorial = !!opts.tutorial;
    this.assist = !!(SS.Save.d.settings && SS.Save.d.settings.assist) && opts.mode !== "daily" && !opts.tutorial;
    this.keys = { left: false, right: false };
    this.ptr = null;
    this.buffs = { slow: 0, wide: 0, hazardShield: 0, comboShield: 0 };
    this.events = { wind: null, steam: null, shake: null, slippery: null, moving: null };
    this.nearFall = null;
    this.mistakes = 0; this.ordersCompleted = 0; this.flawless = 0; this.runStats = { quick_drops: 0, recoveries: 0, near_fall_saves: 0, wrong: 0, misses: 0, collapses: 0, modified_orders: 0, by_category: {}, by_mod: {}, by_recipe: {}, stable_orders: 0, bonus_coins: 0, hazards_hit: 0, hazards_dodged: 0 };
    this.pendingSpawns = [];
    this.firstResultPending = {};
    this.hintStage = opts.tutorial ? 0 : -1;
    this.transition = 0;
    this.orderNumber = 0;
    this.setupMode();
  }

  // ---------------------------------------------------------------- setup
  setupMode() {
    const R = SS.DATA.mode_rules, P = SS.Progress;
    this.chapter = this.mission ? this.mission.chapter : P.highestChapter();
    this.hearts = null; this.timeLeft = null; this.timeLimit = null;
    if (this.mode === "story") {
      const m = this.mission, sc = this.diff.objective_scaling;
      this.timeLimit = Math.round(SS.Campaign.timeLimit(m) * sc.time_mult);
      this.timeLeft = this.timeLimit;
      this.objectives = SS.Campaign.objectivesFor(m, this.diff.id);
      const patch = SS.Campaign.choicePatch(m);
      this.forceModifier = patch && patch.force_modifier || null;
      this.bonusObjective = patch && patch.bonus_objective || null;
      this.recipePool = patch && patch.pool_override ? SS.DATA.order_pools[patch.pool_override] : (m.order_pool_id ? SS.DATA.order_pools[m.order_pool_id] : [m.recipe_id]);
      const intro = P.introducedUpTo(m);
      this.hazardsAvail = intro.hazards; this.bonusesAvail = intro.bonuses;
      this.newThisMission = m.new_hazards.concat(m.new_bonuses).filter(id => !SS.Save.d.discovered[id]);
      this.hazardRate = m.hazard_rate * this.diff.hazard_frequency_multiplier;
      this.modChance = m.chapter >= 2 ? Math.min(0.95, m.modifier_chance * this.diff.modifier_frequency_multiplier) : 0;
      this.baseTier = Math.min(5, m.tier + this.diff.tier_offset);
      // Special Orders: one twist per mission
      const ru = m.rules || {};
      if (ru.time_mult) { this.timeLimit = Math.round(this.timeLimit * ru.time_mult / 5) * 5; this.timeLeft = this.timeLimit; }
      if (ru.force_modifier && !this.forceModifier) this.forceModifier = ru.force_modifier;
      if (ru.mod_chance !== undefined) this.modChance = ru.mod_chance;
      if (ru.hazards_only) this.hazardsAvail = ru.hazards_only.slice();
      if (ru.hazard_mult) this.hazardRate *= ru.hazard_mult;
      if (ru.tier_bonus) this.baseTier = Math.min(5, this.baseTier + ru.tier_bonus);
      this.precisionMult = ru.precision_mult || 1;
      this.noGuides = !!ru.no_guides;
    } else {
      const unlocked = P.unlockedRecipes();
      this.recipePool = unlocked.length ? unlocked : ["classic_burger"];
      this.hazardsAvail = P.taughtHazards(); this.bonusesAvail = P.taughtBonuses();
      this.newThisMission = [];
      this.modChance = this.chapter >= 2 ? 0.4 * this.diff.modifier_frequency_multiplier : 0.12;
      this.hazardRate = this.hazardsAvail.length ? (1.2 + 0.25 * this.chapter) * this.diff.hazard_frequency_multiplier : 0;
      this.baseTier = Math.min(5, this.diff.tier_offset);
      if (this.mode === "classic") { this.timeLeft = R.classic.start_time; this.hearts = R.classic.hearts; }
      if (this.mode === "survival") { this.hearts = R.survival.hearts; }
      if (this.mode === "daily") {
        const p = this.preset; this.hearts = p.hearts || 3;
        this.timeLeft = p.no_timer ? null : (p.start_time || 75);
        this.forceModifier = p.force_modifier || null;
        if (p.modifier_chance !== undefined) this.modChance = p.modifier_chance;
        this.baseTier = Math.min(5, this.baseTier + (p.tier_bonus || 0));
      }
    }
    this.timeStart = this.timeLeft;
    this.decoyPool = SS.OrderBuilder.eligibleIngredients(SS.Progress.unlockedRecipes().concat(this.recipePool), Math.max(this.chapter, 1));
    this.tier = this.baseTier;
    this.spawnTimer = 0.6;
    this.hazardTimer = this.hazardRate > 0 ? this.nextHazardDelay() * 0.7 : Infinity;
    // Force first encounters early so new objects are taught before random generation expects a response.
    this.firstEncounterQueue = this.newThisMission.slice();
    this.firstEncounterTimer = 5.5;
    this.newOrder();
  }
  get tierDef() { return SS.DATA.spawn_tiers[this.tier]; }
  get precisionTol() { let t = this.diff.precision_tolerance_multiplier; if (this.buffs.wide > 0) t *= SS.DATA.bonus_by_id.wide_catch.value; if (this.preset && this.preset.precision_mult) t *= this.preset.precision_mult; if (this.precisionMult) t *= this.precisionMult; if (this.assist) t *= SS.Session.ASSIST.precision_mult; return t; }
  get supportTopY() {
    const p = this.order && this.order.plan;
    if (!p || !p.length) return this.plate.y - this.stack.height;
    if (this.orderIdx < p.length) return this.plate.y - SS.DishPlan.heightOf(p[this.orderIdx].catchY);
    const last = p[p.length - 1]; return this.plate.y - SS.DishPlan.heightOf(last.y - SS.DISH.ing[last.id].stack);
  }
  // design-px catch centre for the current step when the dish places it side by side
  get stepAnchor() { const p = this.order && this.order.plan, st = p && p[this.orderIdx]; return st && this.order.cols[this.orderIdx] != null ? st.x * SS.DATA.KIT_SCALE : null; }
  get requiredId() { return this.order ? this.order.seq[this.orderIdx] : null; }
  get timed() { return this.timeLeft !== null && this.timeLeft !== undefined; }

  newOrder(remakeSame) {
    if (!remakeSame) {
      const recipeId = this.pickRecipe();
      this.order = SS.OrderBuilder.build(recipeId, {
        rng: this.rng, chapter: this.chapter, modifierChance: this.modChance, forceModifier: this.forceModifier,
        allowChallengeOnly: this.mode === "daily" || this.forceModifier === "MOD-MYSTERY" || (this.mode === "story" && this.chapter >= 7 && this.diff.id !== "normal")
      });
      this.orderNumber++;
      this.order.number = this.orderNumber;
    }
    this.orderIdx = 0; this.meal = "fresh"; this.orderMistakes = 0; this.orderTime = 0;
    this.order.plan = SS.DishPlan.layout(SS.DishPlan.forOrder(this.order));
    this.stack.reset(); this.score.resetOrder(); this.nearFall = null; this.autoWait = 0; this.pressPending = false; this.completeWait = 0;
    const base = SS.DISH.ing[this.order.base || "plate"];
    if (base && this.order.base !== "plate") this.stack.supportHalf = this.stack.baseHalf = Math.max(60, base.w * SS.DATA.KIT_SCALE * 0.42); else this.stack.baseHalf = 0;
    this.emit("order", this.order);
  }
  pickRecipe() {
    const pool = this.recipePool;
    if (this.mode === "story" && pool.length > 1) { // walk the pool so every recipe appears
      const i = (this.orderNumber) % pool.length; return pool[i];
    }
    if (pool.length === 1) return pool[0];
    let r; let tries = 0;
    do { r = this.rng.pick(pool); tries++; } while (this.order && r === this.order.recipe_id && tries < 4);
    return r;
  }

  // ---------------------------------------------------------------- loop
  start() { this.state = "playing"; this.emit("hud"); if (this.hintStage === 0) this.hint("Drag to move the plate. Catch the " + this.ingName(this.requiredId) + " first!"); SS.Analytics.log("run_start", { mode: this.mode, mission: this.mission && this.mission.id, difficulty: this.diff.id, seed: this.seed }); }
  update(dtReal) {
    if (this.ended || this.state !== "playing" || this.blocked) return;
    this.acc += Math.min(dtReal, 0.1);
    const STEP = 1 / 120;
    while (this.acc >= STEP) { this.acc -= STEP; this.step(STEP); if (this.ended || this.blocked) { this.acc = 0; break; } }
  }
  step(dt) {
    this.simTime += dt;
    if (SS.Debug && SS.Debug.freezeVertical) { this.updatePlate(dt); return; }
    // timers (frozen whenever the sim is paused/blocked because step() doesn't run)
    if (this.timed && this.transition <= 0) { this.timeLeft -= dt; if (this.timeLeft <= 0) { this.timeLeft = 0; return this.end("time"); } }
    this.orderTime += dt;
    for (const k of ["slow", "wide"]) if (this.buffs[k] > 0) this.buffs[k] = Math.max(0, this.buffs[k] - dt);
    this.updateTier();
    this.updateEvents(dt);
    this.updatePlate(dt);
    if (this.nearFall) { this.nearFall.t -= dt; if (this.nearFall.t <= 0) this.collapse("timeout"); }
    if (this.transition > 0) { this.transition -= dt; if (this.transition <= 0) this.afterTransition(); }
    else if (this.completeWait > 0) { this.completeWait -= dt; if (this.completeWait <= 0) this.completeOrder(); }
    else if (this.autoWait > 0) { this.autoWait -= dt; this.updateDirector(dt); }
    else if (this.pressPending) { this.pressTime = (this.pressTime || 0) + dt; this.updateDirector(dt); }
    else if (this.order && this.requiredId && SS.DATA.ingredient_by_id[this.requiredId].auto) this.autoPlace();
    else { this.updateSpawner(dt); this.updateDirector(dt); }
    this.updateObjects(dt);
    this.updateFx(dt);
    if (this.mode === "story") this.checkStoryProgress();
  }
  updateTier() {
    let t = this.baseTier;
    if (this.mode === "classic" || (this.mode === "daily" && this.timed)) { const ts = SS.DATA.mode_rules.classic.tier_time_seconds; const el = this.simTime; for (let i = 0; i < ts.length; i++) if (el >= ts[i]) t = Math.max(t, Math.min(5, this.baseTier + i)); }
    if (this.mode === "survival" || (this.mode === "daily" && !this.timed)) { const to = SS.DATA.mode_rules.survival.tier_orders; for (let i = 0; i < to.length; i++) if (this.ordersCompleted >= to[i]) t = Math.max(t, Math.min(5, this.baseTier + i)); }
    if (t !== this.tier) { const up = t > this.tier; this.tier = t; if (up && this.mode !== "story") this.popup(540, 900, "SPEED UP!", "#ffd43b", 1.2, 1.3); }
  }

  // ---------------------------------------------------------------- plate & input
  updatePlate(dt) {
    const P = this.B.plate, p = this.plate;
    if (this.keys.left) p.targetX -= P.key_speed * dt;
    if (this.keys.right) p.targetX += P.key_speed * dt;
    if (this.events.moving && this.events.moving.phase === "active") { const e = this.events.moving; p.targetX += Math.sin(e.t * e.freq * Math.PI * 2 + e.phaseOff) * e.speed * dt; }
    p.targetX = SS.U.clamp(p.targetX, P.min_x, P.max_x);
    const prev = p.x;
    if (this.events.slippery && this.events.slippery.phase === "active") {
      const desired = (p.targetX - p.x) * 7;
      p.vx += (desired - p.vx) * (1 - Math.exp(-1.6 * dt));
      p.x += p.vx * dt;
      if (p.x < P.min_x || p.x > P.max_x) { p.x = SS.U.clamp(p.x, P.min_x, P.max_x); p.vx *= -0.3; }
    } else {
      p.x += (p.targetX - p.x) * (1 - Math.exp(-P.follow_strength * dt));
      p.vx = (p.x - prev) / Math.max(dt, 1e-4);
    }
  }
  pointerDown(x, y, pid, now) {
    if (this.ptr || this.ended) return;
    if (this.pressPending && this.state === "playing" && !this.blocked && this.tryPress()) return;
    const hit = this.hitTest(x, y);
    this.ptr = { pid, x0: x, y0: y, lastX: x, t0: now, hit, dragging: !hit };
    if (!hit && SS.Save.d.settings.control === "direct") this.plate.targetX = x;
  }
  pointerMove(x, y, pid) {
    const p = this.ptr; if (!p || p.pid !== pid) return;
    if (!p.dragging && Math.hypot(x - p.x0, y - p.y0) > this.B.quick_drop.drag_threshold_px) { p.dragging = true; p.hit = null; }
    if (p.dragging && this.state === "playing" && !this.blocked) {
      if (SS.Save.d.settings.control === "direct") this.plate.targetX = x; else this.plate.targetX += (x - p.lastX);
    }
    p.lastX = x;
  }
  pointerUp(x, y, pid, now) {
    const p = this.ptr; if (!p || p.pid !== pid) return;
    if (!p.dragging && p.hit && (now - p.t0) / 1000 <= this.B.quick_drop.tap_max_seconds) this.quickDrop(p.hit);
    this.ptr = null;
  }
  pointerCancel() { this.ptr = null; }
  hitTest(x, y) {
    const pad = this.B.quick_drop.hit_padding_px, minH = this.B.quick_drop.min_hit_half_h;
    let best = null, bestD = 1e9;
    for (const o of this.objects) {
      if (o.state !== "falling" || o.qd) continue;
      const hw = o.hitW / 2 + pad, hh = Math.max(o.hitH / 2 + pad, minH);
      const dx = Math.abs(x - o.x), dy = Math.abs(y - (o.y + (o.hitOff || 0)));
      if (dx <= hw && dy <= hh) { const d = dx * dx + dy * dy; if (d < bestD) { bestD = d; best = o; } }
    }
    return best;
  }
  quickDrop(o) {
    if (!o || o.state !== "falling" || o.qd || !this.B.quick_drop.enabled) return false;
    o.qd = true; o.qdT = 0; o.ampMult *= o.profile.quick_drop_amplitude_multiplier || 0.9;
    this.runStats.quick_drops++;
    this.emit("sfx", "whoosh");
    this.emit("haptic", 8);
    if (this.hintStage >= 0 && this.hintStage < 3) { this.hintStage = 3; this.hint("Quick Drop! It falls fast, but still lands where it is."); }
    SS.Analytics.log("quick_drop", { id: o.id, relation: o.relation, x: Math.round(o.x), y: Math.round(o.y) });
    return true;
  }
  quickDropNearest() { // keyboard convenience: required object first, else lowest
    let c = this.objects.filter(o => o.state === "falling" && !o.qd);
    if (!c.length) return;
    const req = c.filter(o => o.id === this.requiredId);
    c = (req.length ? req : c).sort((a, b) => b.y - a.y);
    this.quickDrop(c[0]);
  }

  // ---------------------------------------------------------------- spawning
  updateSpawner(dt) {
    const td = this.tierDef;
    let interval = td.spawn_interval;
    if (this.order.flags.rush) interval *= SS.DATA.modifier_rules.rush_spawn_interval_mult;
    this.spawnTimer -= dt * (this.buffs.slow > 0 ? SS.DATA.bonus_by_id.slow_time.value : 1);
    const falling = this.objects.filter(o => o.state === "falling");
    const reqActive = falling.some(o => o.id === this.requiredId && o.y < this.supportTopY - 60);
    if (!reqActive && this.spawnTimer > 0.55) this.spawnTimer = 0.55; // fairness: required item never waits long
    if (this.firstEncounterQueue.length) { this.firstEncounterTimer -= dt; }
    if (this.spawnTimer > 0) return;
    if (falling.length >= td.max_active + (this.pendingSpawns.length ? 1 : 0)) { this.spawnTimer = 0.15; return; }
    this.spawnTimer = interval * this.rng.range(0.85, 1.15);
    // forced spawns (first encounters, skill-earned bonuses)
    if (this.firstEncounterQueue.length && this.firstEncounterTimer <= 0) {
      const id = this.firstEncounterQueue.shift(); this.firstEncounterTimer = 7;
      if (SS.DATA.hazard_by_id[id] && SS.DATA.hazard_by_id[id].kind === "event") return this.startEvent(id);
      if (SS.DATA.hazard_by_id[id]) return this.spawnHazard(id);
      if (SS.DATA.bonus_by_id[id]) return this.spawnBonus(id);
    }
    if (this.pendingSpawns.length) { const s = this.pendingSpawns.shift(); return s.kind === "bonus" ? this.spawnBonus(s.id) : this.spawnHazard(s.id); }
    if (!this.requiredId) return;   // order fully placed and waiting to be served
    if (!reqActive) return this.spawnIngredient(this.requiredId, "required");
    // traffic: future / decoy / bonus
    const bonusChance = this.bonusesAvail.length ? 0.07 * this.diff.bonus_frequency_multiplier : 0;
    if (this.rng.chance(bonusChance)) { const b = this.pickBonus(); if (b) return this.spawnBonus(b); }
    const decoyChance = Math.min(0.85, td.decoy_chance * this.diff.decoy_frequency_multiplier + (this.preset && this.preset.decoy_bonus || 0));
    const remaining = this.order.seq.slice(this.orderIdx + 1).filter(i => i !== this.requiredId);
    const decoys = this.decoyPool.filter(i => this.order.seq.slice(this.orderIdx).indexOf(i) < 0);
    if (decoys.length && this.rng.chance(decoyChance)) return this.spawnIngredient(this.rng.pick(decoys), "decoy");
    if (remaining.length && this.rng.chance(0.75)) return this.spawnIngredient(this.rng.pick(remaining), "future");
    if (decoys.length && td.decoy_chance > 0) return this.spawnIngredient(this.rng.pick(decoys), "decoy");
    this.spawnTimer = 0.25; // nothing sensible to add; check again soon
  }
  pickProfile(forRequired) {
    const ch = this.mode === "story" ? this.chapter : Math.max(1, Math.min(12, this.chapter));
    let maxCh = ch + (this.diff.id === "extreme" ? 1 : 0);
    if (this.mode === "story" && this.mission.chapter === 1 && this.mission.number <= 2 && this.diff.id === "normal") maxCh = 1;
    const tier = this.tier;
    const eligible = SS.DATA.motion_profiles.filter(p => p.min_chapter <= maxCh && p.weight_by_tier[tier] > 0);
    let w = p => p.weight_by_tier[tier] * (forRequired && p.type === "late" ? 0.5 : 1);
    if (this.mode === "story" && this.mission.chapter === 1 && this.mission.number === 1) w = p => (p.id === "steady_intro" ? 3 : p.id === "straight" ? 1 : p.id === "gentle_sway" ? 0.6 : 0);
    if (SS.Debug && SS.Debug.forceProfile) return SS.DATA.motion_profiles.find(p => p.id === SS.Debug.forceProfile) || eligible[0];
    return this.rng.weighted(eligible, w);
  }
  baseFallSpeed(mult) { return this.B.spawn.base_fall_speed * this.tierDef.fall_speed_multiplier * this.diff.fall_speed_multiplier * (this.preset && this.preset.fall_mult || 1) * (this.assist ? SS.Session.ASSIST.fall_mult : 1) * (mult || 1); }
  makeObject(cat, id, def, relation, profile, w, h) {
    const S = this.B.spawn;
    const o = {
      uid: this.uid++, cat, id, def, relation, profile, state: "falling",
      x: 540, y: S.top_y, t: 0, vyBase: this.baseFallSpeed(cat === "hazard" ? 0.92 : cat === "bonus" ? 0.95 : 1),
      amp: (profile.amplitude_px || 0) * this.diff.horizontal_motion_multiplier, freq: profile.frequency_hz || 0,
      drift: (profile.drift_px_per_sec || 0) * this.diff.horizontal_motion_multiplier, dir: 1, phase: this.rng.range(0, Math.PI * 2),
      ampMult: 1, qd: false, qdT: 0, w, h, hitW: w, hitH: Math.max(h, 40), rot: 0, spin: this.rng.range(-0.6, 0.6), alpha: 0, vx: 0, vy: 0, life: 0
    };
    if (profile.type === "drift" && this.rng.chance(0.5)) o.dir = -1; // drift_left/right handled by sign; randomize mirror for variety
    o.contactHalf = 26;
    if (cat === "ingredient") { const m = SS.DishView.fallMetrics(id); o.w = o.hitW = Math.max(90, m.w); o.h = m.h; o.hitH = Math.max(m.h, 60); o.contactHalf = m.contactHalf; o.hitOff = 0; }
    return o;
  }
  chooseSpawnX(o, wantReach) {
    const S = this.B.spawn;
    let best = null;
    for (let i = 0; i < 8; i++) {
      const x = this.rng.range(S.left_x + 30, S.right_x - 30);
      const clash = this.objects.some(p => p.state === "falling" && p.y < S.top_y + 320 && Math.abs(p.x - x) < S.min_separation_x);
      if (!clash) { best = x; break; }
      if (best === null) best = x;
    }
    o.x = o.originX = best;
    if (wantReach) {
      for (let k = 0; k < 8; k++) {
        this.ensureReachable(o);
        if (!this.clashesWithOthers(o)) break;
        o.x = o.originX = this.rng.range(S.left_x + 30, S.right_x - 30);
      }
    } else this.avoidConflicts(o);
  }
  clashesWithOthers(o) {
    const pr = o.predicted || this.predict(o, o.x);
    return this.objects.some(p => {
      if (p.state !== "falling" || p === o || (p.cat === "ingredient" && p.id === this.requiredId) || p.cat === "bonus" || !p.predicted) return false;
      const pt = Math.max(0, p.predicted.T - p.t);
      return Math.abs(pr.T - pt) < 0.55 && Math.abs(pr.landX - p.predicted.landX) < this.stack.supportHalf + p.w * 0.5 + 70;
    });
  }
  // Traffic fairness: a non-required object must not land on the required item's catch spot at the same moment.
  avoidConflicts(o) {
    const S = this.B.spawn;
    const reqs = this.objects.filter(p => p.state === "falling" && p.id === this.requiredId && p.predicted);
    if (!reqs.length) { o.predicted = this.predict(o, o.x); return; }
    for (let k = 0; k < 8; k++) {
      const pr = this.predict(o, o.x);
      const clash = reqs.some(r => { const rt = Math.max(0, r.predicted.T - r.t); return Math.abs(pr.T - rt) < 0.55 && Math.abs(pr.landX - r.predicted.landX) < this.stack.supportHalf + o.w * 0.5 + 70; });
      o.predicted = pr;
      if (!clash) return;
      o.x = o.originX = this.rng.range(S.left_x + 30, S.right_x - 30);
    }
    o.predicted = this.predict(o, o.x);
  }
  // Predict landing X by integrating the same motion model (ignores wind & Quick Drop; deterministic).
  predict(o, x0) {
    const S = this.B.spawn, dt = 1 / 30;
    let x = x0, t = 0, dir = o.dir;
    const T = Math.max(0.1, (this.supportTopY - o.contactHalf - S.top_y) / o.vyBase);
    const pts = [[x, S.top_y]];
    let minX = x, maxX = x;
    while (t < T) {
      const dx = this.motionDelta(o, t, dt, { dir: v => { if (v !== undefined) dir = v; return dir; } }, T);
      x += dx; if (x < S.left_x) { x = S.left_x; dir = Math.abs(dir); } if (x > S.right_x) { x = S.right_x; dir = -Math.abs(dir); }
      t += dt; minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      pts.push([x, S.top_y + o.vyBase * t]);
    }
    return { landX: x, T, pts, minX, maxX };
  }
  ensureReachable(o) {
    const P = this.B.plate, S = this.B.spawn;
    for (let k = 0; k < 4; k++) {
      const pr = this.predict(o, o.x);
      const reach = P.assumed_player_speed * Math.max(0, pr.T - P.reaction_time) * S.fairness_margin;
      const dist = pr.landX - this.plate.x;
      o.predicted = pr; o.reach = reach;
      if (Math.abs(dist) <= reach) return;
      const shift = dist - SS.U.sign(dist) * reach * 0.85;
      const nx = SS.U.clamp(o.x - shift, S.left_x, S.right_x);
      if (Math.abs(nx - o.x) < 1) { o.profile = SS.DATA.motion_profiles.find(p => p.id === "steady_intro"); o.amp = o.profile.amplitude_px; o.drift = 0; o.freq = o.profile.frequency_hz; }
      o.x = o.originX = nx;
    }
    o.predicted = this.predict(o, o.x);
  }
  // Horizontal motion delta for one step (pure function of profile/time; wind added separately).
  motionDelta(o, t, dt, dirRef, T) {
    const pf = o.profile;
    switch (pf.type) {
      case "sine": return o.amp * (Math.sin(2 * Math.PI * o.freq * (t + dt) + o.phase) - Math.sin(2 * Math.PI * o.freq * t + o.phase));
      case "tri": { const tri = u => { const f = ((u % 1) + 1) % 1; return f < 0.5 ? 4 * f - 1 : 3 - 4 * f; }; const ph = o.phase / (2 * Math.PI); return o.amp * (tri(o.freq * (t + dt) + ph) - tri(o.freq * t + ph)); }
      case "drift": return o.drift * dirRef.dir() * dt;
      case "late": { const start = (T || 2.5) * (pf.late_start_ratio || 0.45); return t >= start ? o.drift * dirRef.dir() * dt : 0; }
      default: return 0;
    }
  }
  spawnIngredient(id, relation) {
    const def = SS.DATA.ingredient_by_id[id]; if (!def) return;
    const prof = this.pickProfile(relation === "required");
    const o = this.makeObject("ingredient", id, def, relation, prof, def.w, Math.max(def.h, 26));
    this.chooseSpawnX(o, relation === "required");
    this.objects.push(o);
    return o;
  }
  spawnHazard(id) {
    const def = SS.DATA.hazard_by_id[id];
    const prof = SS.DATA.motion_profiles.find(p => p.id === def.motion_profile) || SS.DATA.motion_profiles[1];
    const o = this.makeObject("hazard", id, def, null, prof, 110, 90);
    this.chooseSpawnX(o, false);
    // bias hazards toward the plate's lane so they matter, but keep them dodgeable
    o.x = o.originX = SS.U.clamp(SS.U.lerp(o.x, this.plate.x, 0.35), this.B.spawn.left_x, this.B.spawn.right_x);
    this.avoidConflicts(o);
    this.objects.push(o);
    this.discover(id, "hazard", o);
    return o;
  }
  spawnBonus(id) {
    const def = SS.DATA.bonus_by_id[id];
    const prof = SS.DATA.motion_profiles.find(p => p.id === "gentle_sway");
    const o = this.makeObject("bonus", id, def, null, prof, 104, 104);
    this.chooseSpawnX(o, true);
    this.objects.push(o);
    this.discover(id, "bonus", o);
    return o;
  }
  pickBonus() {
    let c = this.bonusesAvail.filter(b => !(SS.DATA.bonus_by_id[b].timed_only && !this.timed));
    if (!this.hazardsAvail.length) c = c.filter(b => b !== "hazard_shield");
    if (this.buffs.hazardShield) c = c.filter(b => b !== "hazard_shield");
    if (this.buffs.comboShield) c = c.filter(b => b !== "combo_shield");
    return c.length ? this.rng.pick(c) : null;
  }

  // ---------------------------------------------------------------- ChallengeDirector (hazards + events)
  nextHazardDelay() { return Math.max(3.5, 60 / Math.max(this.hazardRate, 0.01) * this.rng.range(0.7, 1.3)); }
  activeBudget() {
    let b = 0;
    for (const k in this.events) { const e = this.events[k]; if (e) b += e.def.budget_cost; }
    for (const o of this.objects) if (o.cat === "hazard" && o.state === "falling") b += o.def.budget_cost;
    return b;
  }
  updateDirector(dt) {
    if (!this.hazardsAvail.length || this.hazardRate <= 0) return;
    this.hazardTimer -= dt;
    if (this.hazardTimer > 0) return;
    this.hazardTimer = this.nextHazardDelay();
    const budgetMax = this.diff.challenge_budget_range[1];
    const used = this.activeBudget();
    const cands = this.hazardsAvail.filter(id => {
      const h = SS.DATA.hazard_by_id[id];
      if (!SS.Save.d.discovered[id] && this.firstEncounterQueue.indexOf(id) >= 0) return false; // wait for the teaching moment
      if (used + h.budget_cost > budgetMax) return false;
      if (h.requires_recipe_tags && !h.requires_recipe_tags.every(t => this.order.tags.indexOf(t) >= 0)) return false;
      if (h.kind === "event" && this.events[this.eventKey(id)]) return false;
      if (h.conflicts && h.conflicts.some(c => (c === "MOD-MYSTERY" && this.order.flags.mystery) || this.events[this.eventKey(c)])) return false;
      if (id === "grease_drop" && !this.stack.layers.length) return false;
      return true;
    });
    if (!cands.length) return;
    const id = this.rng.pick(cands);
    if (SS.DATA.hazard_by_id[id].kind === "event") this.startEvent(id); else this.pendingSpawns.push({ kind: "hazard", id });
  }
  eventKey(id) { return { gust_wind: "wind", steam_burst: "steam", counter_shake: "shake", slippery_counter: "slippery", moving_plate_event: "moving" }[id]; }
  startEvent(id) {
    const def = SS.DATA.hazard_by_id[id], key = this.eventKey(id);
    if (!key || this.events[key]) return;
    const tel = def.telegraph * this.diff.telegraph_duration_multiplier;
    const e = { id, def, phase: "telegraph", t: 0, tel, dur: def.duration, dir: this.rng.chance(0.5) ? 1 : -1, freq: 0.35, phase0: 0, speed: 260, phaseOff: this.rng.range(0, 6.28) };
    if (key === "steam") { e.y0 = this.rng.range(560, 900); e.h = 420; }
    this.events[key] = e;
    this.emit("sfx", key === "wind" ? "wind" : "warn");
    this.discover(id, "hazard", null);
  }
  updateEvents(dt) {
    for (const key in this.events) {
      const e = this.events[key]; if (!e) continue;
      e.t += dt;
      if (e.phase === "telegraph" && e.t >= e.tel) {
        e.phase = "active"; e.t = 0;
        if (key === "shake") this.applyShake(e);
        if (key === "slippery") this.plate.vx = 0;
        if (key === "moving") { e.phase = "active"; e.phase0 = this.rng.range(0, 6.28); }
      } else if (e.phase === "active" && e.t >= e.dur) {
        this.events[key] = null;
        this.reinforce(e.id, "end");
      }
    }
  }
  applyShake(e) {
    const st = this.stack;
    this.emit("sfx", "rumble"); this.emit("haptic", 40);
    if (!st.layers.length) return;
    const hit = (5 + st.layers.length * 1.3) * (st.stability < 60 ? 1.4 : 1) * (2 - this.diff.recovery_window_multiplier);
    st.stability = Math.max(0, st.stability - hit);
    st.nudge(this.rng.range(-14, 14));
    this.popup(this.plate.x, this.supportTopY - 90, "SHAKE! -" + Math.round(hit), "#ff922b", 1.0, 0.9);
    if (st.stability <= this.B.stability.critical_threshold && !this.nearFall) this.enterNearFall();
  }
  windForce() { const w = this.events.wind; if (!w || w.phase !== "active") return 0; const ramp = Math.min(1, w.t / 0.4) * Math.min(1, (w.dur - w.t) / 0.4); return w.dir * w.def.strength * this.diff.horizontal_motion_multiplier * ramp; }

  // ---------------------------------------------------------------- objects
  updateObjects(dt) {
    const S = this.B.spawn;
    const slow = this.buffs.slow > 0 ? SS.DATA.bonus_by_id.slow_time.value : 1;
    const wind = this.windForce();
    const supTop = this.supportTopY;
    for (const o of this.objects) {
      if (o.state === "falling") {
        o.alpha = Math.min(1, o.alpha + dt * 6);
        const qdm = o.qd ? 1 + (this.B.quick_drop.speed_multiplier - 1) * Math.min(1, (o.qdT += dt) / 0.06) : 1;
        const vy = o.vyBase * slow * qdm;
        const prevBottom = o.y + o.contactHalf;
        const ref = { dir: v => { if (v !== undefined) o.dir = v; return o.dir; } };
        const T = o.predicted ? o.predicted.T : 2.6;
        o.x += this.motionDelta(o, o.t, dt * slow, ref, T) * o.ampMult + wind * dt;
        if (o.x < S.left_x) { o.x = S.left_x; o.dir = Math.abs(o.dir); } if (o.x > S.right_x) { o.x = S.right_x; o.dir = -Math.abs(o.dir); }
        o.t += dt * slow;
        o.y += vy * dt;
        o.rot = Math.sin(o.t * 2.2 + o.phase) * 0.08 + (o.cat === "bug" ? Math.sin(o.t * 20) * 0.1 : 0);
        const bottom = o.y + o.contactHalf;
        if (prevBottom < supTop && bottom >= supTop) this.contact(o);
        if (o.state === "falling" && o.y > S.counter_y) this.landOnCounter(o);
      } else this.animateLoose(o, dt);
    }
    this.objects = this.objects.filter(o => o.state !== "dead");
    for (const d of this.debris) this.animateLoose(d, dt);
    this.debris = this.debris.filter(d => d.state !== "dead");
    for (const l of this.stack.layers) if (l.land_t < 1) l.land_t = Math.min(1, l.land_t + dt / 0.09);
    if (this.served) { this.served.t += dt; if (this.served.t > 1.2) this.served = null; }
  }
  animateLoose(o, dt) {
    o.life += dt;
    if (o.state === "bounce" || o.state === "tumble") { o.vy += 2200 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.spin * dt * 6; if (o.y > 2100 || o.life > 2.5) o.state = "dead"; }
    else if (o.state === "splat") { o.alpha = Math.max(0, 1 - o.life / 0.7); if (o.life > 0.7) o.state = "dead"; }
    else if (o.state === "collected") { o.y -= 300 * dt; o.alpha = Math.max(0, 1 - o.life / 0.4); o.scale = 1 + o.life * 1.5; if (o.life > 0.4) o.state = "dead"; }
    else if (o.state === "caught") o.state = "dead";
  }
  loosen(o, state, vx, vy) { o.state = state; o.vx = vx; o.vy = vy; o.life = 0; o.spin = this.rng.range(-1.5, 1.5); }
  landOnCounter(o) {
    o.state = "splat"; o.life = 0; o.y = this.B.spawn.counter_y;
    if (o.cat === "ingredient" && o.id === this.requiredId) {
      this.emit("teach", "miss");
      this.runStats.misses++; this.score.miss(this.useComboShield());
      this.popup(o.x, 1560, "MISSED!", "#ff6b6b", 1.0, 1);
      this.emit("sfx", "miss");
      this.mistake("miss");
    } else if (o.cat === "hazard") {
      this.runStats.hazards_dodged++; this.reinforce(o.id, "avoid");
    }
  }
  contact(o) {
    const localX = o.x - this.plate.x;
    const tol = this.precisionTol;
    if (o.cat === "ingredient") {
      const ev = this.stack.evaluate(o.def, localX, tol, this.stepAnchor);
      if (ev.normalized > this.B.quality_thresholds.tumble) return; // passes beside the stack
      if (o.id !== this.requiredId) {
        if (ev.normalized > 1.0) return;
        return this.wrongCatch(o);
      }
      if (ev.quality === "fall") return this.tumbleOff(o, ev);
      return this.place(o, ev);
    }
    const half = this.stack.supportHalf * tol + o.w * 0.35;
    if (Math.abs(localX - this.stack.supportCenter) > half) return;
    if (o.cat === "hazard") return this.hazardHit(o);
    if (o.cat === "bonus") return this.collectBonus(o);
  }
  place(o, ev) {
    const wasNear = !!this.nearFall;
    const prevTop = this.stack.layers[this.stack.layers.length - 1];
    const slipMult = this.order.flags.slip ? SS.DATA.modifier_rules.slip_stability_mult : 1;
    const res = this.stack.register(o.def, ev, wasNear, slipMult);
    o.state = "caught";
    const dp = { i: this.orderIdx, offset: res.layer.x - (ev.centre || 0), quality: ev.quality };
    this.emit("dish_place", dp);
    if (dp.pressing) { this.pressPending = true; this.pressTime = 0; this.hint("Tap anywhere to press it together!"); }
    res.layer.dropFrom = o.y - this.plate.y; // for landing tween
    const sc = this.score.placement(res, this.tierDef.score_multiplier, { onlyClean: this.preset && this.preset.score_only_clean, streakMult: this.preset && this.preset.streak_mult });
    const q = res.quality;
    const colors = { perfect: "#ffd43b", good: "#69db7c", messy: "#ffa94d", danger: "#ff6b6b" };
    const words = { perfect: "PERFECT!", good: "GOOD", messy: "MESSY", danger: "DANGER!" };
    const topY = this.supportTopY;
    this.popup(this.plate.x + res.layer.x, topY - 70, words[q], colors[q], q === "perfect" ? 1.35 : 1.05, 0.9);
    this.popup(this.plate.x + res.layer.x + 120, topY - 20, "+" + sc.points, "#ffffff", 0.75, 0.8);
    if (sc.streak_bonus) this.popup(540, 1050, "PERFECT x" + this.score.perfectStreak + "  +" + sc.streak_bonus, "#ffd43b", 1.1, 1.2);
    this.burst(this.plate.x + res.layer.x, topY, q === "perfect" ? 18 : 8, colors[q]);
    this.emit("sfx", "catch_" + q); this.emit("haptic", q === "perfect" ? 12 : q === "danger" ? 30 : 6);
    if (res.is_recovery) { this.runStats.recoveries++; this.popup(540, 980, "RECOVERY!", "#74c0fc", 1.1, 1.1); }
    if (res.near_fall_saved) { this.runStats.near_fall_saves++; this.nearFall = null; this.popup(540, 920, "SAVED IT!", "#69db7c", 1.4, 1.3); this.emit("sfx", "save"); }
    // meal damage: heavy Danger landing onto a delicate layer crushes it
    if (q === "danger" && prevTop && prevTop.def.tags.indexOf("delicate") >= 0 && o.def.balance_weight >= 1.0) this.damageMeal("crushed", "Crushed the " + prevTop.def.display_name + "!");
    if (this.hintStage === 0) { this.hintStage = 1; this.hint("Nice! The ticket shows what's next. Line it up with the stack."); }
    else if (this.hintStage === 1 && this.orderIdx >= 1) { this.hintStage = 2; this.hint("Tip: tap a falling ingredient to Quick Drop it."); }
    this.orderIdx++;
    // skill-earned bonus (Bible 13: skill -> temporary advantage)
    const ps = this.score.perfectStreak, sb = this.B.skill_bonus.perfect_streak_for_bonus;
    if (q === "perfect" && ps > 0 && ps % sb === 0) { const b = this.timed && this.bonusesAvail.indexOf("time_boost") >= 0 ? "time_boost" : (this.bonusesAvail.indexOf("score_star") >= 0 ? "score_star" : null); if (b) { this.pendingSpawns.push({ kind: "bonus", id: b }); this.spawnTimer = Math.min(this.spawnTimer, 0.4); } }
    if (this.orderIdx >= this.order.seq.length) {
      if (this.order.flags.perfectFinish) { this.order.perfectFinishMet = q === "perfect"; }
      if (!this.pressPending) { if (dp.busy) this.completeWait = dp.busy + 0.2; else this.completeOrder(); }
    } else if (res.fall_triggered) {
      this.collapse("near_fall");
    } else if (res.entered_near_fall) this.enterNearFall();
    this.emit("hud");
    SS.Analytics.log("placement", { q, n: +ev.normalized.toFixed(3), off: Math.round(ev.raw), stab: Math.round(res.stability_after), qd: o.qd });
  }
  // A step the kitchen does for you (a wrap folding closed): no catch, no score, the dish animates and play waits.
  autoPlace() {
    const def = SS.DATA.ingredient_by_id[this.requiredId];
    const ev = { raw: 0, eff: 1, normalized: 0, accuracy: 1, quality: "perfect", stability_before: this.stack.stability, balance_before: this.stack.balance, centre: this.stack.supportCenter, col: false };
    this.stack.register(def, ev, false, 1);
    const dp = { i: this.orderIdx, offset: 0, quality: "perfect" };
    this.emit("dish_place", dp);
    this.popup(this.plate.x, this.supportTopY - 90, def.display_name.toUpperCase() + "!", "#ffd43b", 1.0, 1.0);
    this.orderIdx++;
    this.autoWait = (dp.busy || 0.4) + 0.25;
    if (this.orderIdx >= this.order.seq.length) { this.autoWait = 0; this.completeWait = (dp.busy || 0.4) + 0.3; }
    this.emit("hud");
  }
  // tap anywhere while a press is pending
  tryPress() {
    if (!this.pressPending || this.pressing) return false;
    this.pressing = true; this.emit("dish_press");
    const quick = (this.pressTime || 0) <= 1.2, pts = quick ? 150 : 60;
    this.score.add(pts); this.popup(this.plate.x + 120, this.supportTopY - 40, "+" + pts, "#ffffff", 0.8, 0.8);
    if (quick) { this.popup(540, 1000, "QUICK PRESS!", "#ffd43b", 1.1, 1.0); this.runStats.quick_presses = (this.runStats.quick_presses || 0) + 1; }
    this.emit("sfx", "catch_perfect"); this.emit("haptic", 18);
    return true;
  }
  onPressed() {
    this.pressing = false; this.pressPending = false;
    this.emit("dish_press_done");
    if (this.orderIdx >= this.order.seq.length) this.completeWait = 0.45;
    this.emit("hud");
  }
  tumbleOff(o, ev) {
    this.emit("teach", "slip");
    this.loosen(o, "tumble", SS.U.sign(ev.raw) * 380, -260);
    this.runStats.misses++; this.score.miss(this.useComboShield());
    this.popup(o.x, this.supportTopY - 60, "SLIPPED OFF!", "#ff6b6b", 1.0, 1);
    this.emit("sfx", "miss"); this.emit("haptic", 25);
    if (this.nearFall) return this.collapse("near_fall");
    this.mistake("fall");
  }
  wrongCatch(o) {
    this.emit("teach", "wrong");
    this.loosen(o, "bounce", SS.U.sign(o.x - this.plate.x || 1) * 420, -720);
    this.runStats.wrong++;
    const shield = this.useComboShield();
    const pen = this.score.wrong(shield, this.mode === "survival" && false);
    this.popup(o.x, this.supportTopY - 70, "WRONG!", "#ff6b6b", 1.1, 1);
    this.popup(540, 1000, "Next: " + this.ingName(this.requiredId), "#ffffff", 0.85, 1.3);
    this.emit("sfx", "wrong"); this.emit("haptic", 35);
    if (this.hintStage >= 0 && this.hintStage < 4) { this.hintStage = 4; this.hint("Oops! Only catch what's next on the ticket. That cost a heart."); }
    this.mistake("wrong");
  }
  hazardHit(o) {
    const def = o.def;
    this.loosen(o, "bounce", SS.U.sign(o.x - this.plate.x || 1) * 300, -600);
    if (this.buffs.hazardShield > 0) {
      this.buffs.hazardShield--; this.popup(o.x, this.supportTopY - 60, "SHIELD BLOCKED!", "#74c0fc", 1.1, 1); this.emit("sfx", "shield"); this.reinforce(o.id, "avoid"); return;
    }
    this.runStats.hazards_hit++; this.emit("teach", "hit_" + o.id); if (this.mode === "story") this.checkStoryProgress();
    this.emit("sfx", "hazard"); this.emit("haptic", 45);
    const empty = !this.stack.layers.length;
    switch (o.id) {
      case "wrapper_trash": this.popup(o.x, this.supportTopY - 60, "TRASH!", "#ff6b6b", 1.1, 1); this.score.wrong(this.useComboShield()); this.mistake("trash"); break;
      case "grease_drop":
        if (empty) { this.startSlippery(2.5); this.popup(o.x, this.supportTopY - 60, "GREASY PLATE!", "#ffa94d", 1, 1); }
        else this.damageMeal(this.order.tags.indexOf("frozen") >= 0 ? "melted" : "messy", this.order.tags.indexOf("frozen") >= 0 ? "MELTED!" : "MESSY!");
        break;
      case "slime_blob":
        if (empty) { this.startSlippery(3); this.popup(o.x, this.supportTopY - 60, "SLIMY PLATE!", "#8ce99a", 1, 1); }
        else this.damageMeal("contaminated", "SLIMED!");
        break;
      case "bug": if (empty) this.popup(o.x, this.supportTopY - 60, "SHOO!", "#ffa94d", 1, 1); else this.damageMeal("contaminated", "BUGGED!"); break;
      case "ice_cube": if (empty || this.order.tags.indexOf("hot_food") < 0) this.popup(o.x, this.supportTopY - 60, "CLINK!", "#a5d8ff", 1, 1); else this.damageMeal("cold", "COLD!"); break;
    }
    this.reinforce(o.id, "hit");
  }
  startSlippery(dur) { if (this.events.slippery) return; this.events.slippery = { id: "grease_surface", def: { budget_cost: 0 }, phase: "active", t: 0, dur, tel: 0 }; }
  damageMeal(state, text) {
    const sev = id => SS.DATA.meal_quality_states.find(s => s.id === id).severity;
    if (sev(state) > sev(this.meal)) this.meal = state;
    this.popup(this.plate.x, this.supportTopY - 110, text, state === "contaminated" ? "#8ce99a" : state === "cold" ? "#a5d8ff" : "#ffa94d", 1.3, 1.3);
    if (state === "contaminated") { this.emit("teach", "ruined"); this.discardOrder("contaminated"); }
    this.emit("hud");
  }
  collectBonus(o) {
    o.state = "collected"; o.life = 0;
    const b = o.def;
    this.emit("sfx", "bonus"); this.emit("haptic", 10);
    switch (b.id) {
      case "score_star": this.score.add(b.value); break;
      case "time_boost": if (this.timed) this.timeLeft = Math.min(this.timeLeft + b.value, (this.timeLimit || 99) + 30); break;
      case "coin_burst": this.runStats.bonus_coins += b.value; break;
      case "slow_time": this.buffs.slow = b.duration; break;
      case "wide_catch": this.buffs.wide = b.duration; break;
      case "hazard_shield": this.buffs.hazardShield = 1; break;
      case "combo_shield": this.buffs.comboShield = 1; break;
    }
    this.popup(o.x, o.y - 40, b.reinforce, "#ffe066", 1.0, 1.1);
    this.burst(o.x, o.y, 14, "#ffe066");
    this.reinforce(o.id, "hit");
    this.emit("hud");
  }
  useComboShield() { if (this.buffs.comboShield > 0 && this.score.combo > 0) { this.buffs.comboShield = 0; this.popup(540, 1080, "COMBO SHIELDED", "#74c0fc", 0.9, 1); return true; } return false; }

  // ---------------------------------------------------------------- stability / collapse
  enterNearFall() {
    this.emit("teach", "nearfall");
    const w = this.B.stability.near_fall_window_s * this.diff.recovery_window_multiplier;
    this.nearFall = { t: w, max: w };
    this.popup(540, 940, "WOBBLY! SAVE IT!", "#ff6b6b", 1.3, 1.4);
    this.emit("sfx", "warn"); this.emit("haptic", 50);
  }
  collapse(reason) {
    this.emit("teach", "collapse");
    const removed = this.stack.collapseTop(this.B.stability.collapse_layers + (this.stack.layers.length > 6 ? 1 : 0));
    this.nearFall = null;
    const dir = this.stack.balance < 0 ? -1 : 1;
    removed.forEach((l, i) => this.debris.push({ cat: "ingredient", def: l.def, id: l.id, x: this.plate.x + l.x, y: this.plate.y - l.y - l.h / 2, rot: l.tilt * Math.PI / 180, state: "tumble", vx: dir * (260 + 60 * i), vy: -200 - 40 * i, spin: dir * (1 + i * 0.3), life: 0, alpha: 1, w: l.def.w, h: l.def.h }));
    this.orderIdx = Math.max(0, this.orderIdx - removed.length);
    this.pressPending = false; this.autoWait = 0;
    this.emit("dish_rebuild", this.orderIdx);
    this.runStats.collapses++;
    this.score.collapse();
    if (this.mode === "story") this.checkStoryProgress();
    this.popup(540, 940, "COLLAPSE!", "#ff6b6b", 1.5, 1.4);
    this.emit("sfx", "collapse"); this.emit("haptic", 80);
    this.mistake("collapse");
    this.emit("hud");
  }
  discardOrder(reason) {
    const removed = this.stack.dumpAll();
    removed.forEach((l, i) => this.debris.push({ cat: "ingredient", def: l.def, id: l.id, x: this.plate.x + l.x, y: this.plate.y - l.y - l.h / 2, rot: 0, state: "tumble", vx: (i % 2 ? 1 : -1) * (200 + 50 * i), vy: -300 - 30 * i, spin: 1.2, life: 0, alpha: 1, w: l.def.w, h: l.def.h, tint: reason === "contaminated" }));
    this.orderIdx = 0; this.meal = "fresh"; this.nearFall = null; this.score.resetOrder(); this.pressPending = false; this.autoWait = 0;
    this.emit("dish_rebuild", 0);
    if (reason === "contaminated") { this.popup(540, 990, "RUINED! REMAKE IT", "#ff6b6b", 1.2, 1.5); this.mistake("contaminated"); }
    this.emit("hud");
  }
  mistake(reason) {
    this.mistakes++; this.orderMistakes++;
    if (this.hearts !== null && this.mode !== "story") { this.hearts--; if (this.hearts <= 0) { this.hearts = 0; this.emit("hud"); return this.end("hearts"); } }
    SS.Analytics.log("mistake", { reason, total: this.mistakes });
    this.emit("hud");
    if (this.mode === "story") { const mm = this.objectives.find(o => o.type === "mistakes_max"); if (mm && this.mistakes > mm.target) this.end("mistakes"); }
  }

  // ---------------------------------------------------------------- orders
  completeOrder() {
    const mq = SS.DATA.meal_quality_states.find(s => s.id === this.meal);
    const res = this.score.finishOrder(this.stack.stability, this.tierDef.score_multiplier, mq.quality_penalty, mq.reward_multiplier);
    this.pendingOrderResult = res;
    if (this.meal !== "fresh" && mq.servable) {
      this.blocked = "serve";
      this.emit("serve_prompt", { meal: mq, grade: res.label, order: this.order });
      return;
    }
    this.finalizeServe();
  }
  resolveServe(choice) {
    if (this.blocked !== "serve") return;
    this.blocked = null;
    if (choice === "remake") {
      this.score.resetOrder();
      const removed = this.stack.dumpAll();
      removed.forEach((l, i) => this.debris.push({ cat: "ingredient", def: l.def, id: l.id, x: this.plate.x + l.x, y: this.plate.y - l.y - l.h / 2, rot: 0, state: "tumble", vx: (i % 2 ? 1 : -1) * 220, vy: -320, spin: 1, life: 0, alpha: 1, w: l.def.w, h: l.def.h }));
      this.popup(540, 990, "REMAKE!", "#74c0fc", 1.2, 1.1);
      this.newOrder(true);
      return;
    }
    this.finalizeServe();
  }
  finalizeServe() {
    const res = this.pendingOrderResult; this.pendingOrderResult = null;
    const MR = SS.DATA.modifier_rules, o = this.order;
    let extra = 0;
    const notes = [];
    if (o.modifiers.length) { extra += MR.modified_order_bonus; this.runStats.modified_orders++; o.modifiers.forEach(m => this.runStats.by_mod[m.family] = (this.runStats.by_mod[m.family] || 0) + 1); }
    if (o.flags.rush) { if (this.orderTime <= o.rush_limit) { extra += MR.rush_bonus_points; this.runStats.bonus_coins += MR.rush_bonus_coins; notes.push("Rush bonus!"); } else notes.push("Rush missed"); }
    if (o.flags.perfectFinish) { if (o.perfectFinishMet) { extra += MR.perfect_finish_bonus; notes.push("Perfect Finish!"); } else notes.push("Finish not perfect"); }
    if (o.flags.clean) { if (this.orderMistakes === 0) { extra += MR.clean_bonus; notes.push("Clean order!"); } else notes.push("Not clean"); }
    if (o.flags.slip) { extra += MR.slip_bonus; }
    res.bonus += extra;
    this.score.commitOrder(res);
    this.ordersCompleted++;
    const flawless = res.label === "FLAWLESS" && this.meal === "fresh";
    if (flawless) this.flawless++;
    if (res.stability >= 80) this.runStats.stable_orders++;
    this.runStats.by_category[o.category] = (this.runStats.by_category[o.category] || 0) + 1;
    this.runStats.by_recipe[o.recipe_id] = (this.runStats.by_recipe[o.recipe_id] || 0) + 1;
    // mode rewards
    if (this.mode === "classic" || (this.mode === "daily" && this.timed)) { const R = SS.DATA.mode_rules.classic; this.timeLeft = Math.min(R.max_time, this.timeLeft + R.order_time_bonus); this.popup(540, 860, "+" + R.order_time_bonus + "s", "#74c0fc", 1, 1); }
    if (this.mode === "survival") { this.cleanStreak = (this.orderMistakes === 0) ? (this.cleanStreak || 0) + 1 : 0; if (this.cleanStreak >= SS.DATA.mode_rules.survival.heart_regen_clean_orders && this.hearts < 3) { this.hearts++; this.cleanStreak = 0; this.popup(540, 820, "+1 HEART", "#ff8787", 1.1, 1.2); } }
    const cleanOrders = this.B.skill_bonus.clean_orders_for_shield;
    this.cleanOrderRun = this.orderMistakes === 0 ? (this.cleanOrderRun || 0) + 1 : 0;
    if (this.cleanOrderRun > 0 && this.cleanOrderRun % cleanOrders === 0 && this.hazardsAvail.length && this.bonusesAvail.indexOf("hazard_shield") >= 0) this.pendingSpawns.push({ kind: "bonus", id: "hazard_shield" });
    this.served = { layers: this.stack.layers.slice(), x: this.plate.x, t: 0, label: res.label };
    this.emit("order_done", { res, order: o, flawless, notes, meal: this.meal });
    this.emit("sfx", "order"); this.emit("haptic", 20);
    this.stack.reset();
    // clear the lane for a clean transition
    for (const ob of this.objects) if (ob.state === "falling") { ob.state = "splat"; ob.life = 0.3; }
    this.transition = 0.9;
    this.emit("hud");
    if (this.mode === "story") this.checkStoryProgress(true);
  }
  afterTransition() { if (!this.ended) { this.newOrder(); this.spawnTimer = 0.35; } }

  // ---------------------------------------------------------------- objectives / end
  objectiveValue(type) {
    switch (type) {
      case "complete_orders": return this.ordersCompleted;
      case "perfect_drops": return this.score.perfects;
      case "mistakes_max": return this.mistakes;
      case "combo_reach": return this.score.bestCombo;
      case "score_min": return this.score.score;
      case "time_remaining_min": return this.timeLeft || 0;
      case "flawless_orders": return this.flawless;
      case "perfect_streak": return this.score.bestPerfectStreak;
      case "hazards_max": return this.runStats.hazards_hit;
      case "collapses_max": return this.runStats.collapses;
      case "stable_orders": return this.runStats.stable_orders;
      case "quick_drops": return this.runStats.quick_drops;
      case "quick_presses": return this.runStats.quick_presses || 0;
      case "near_fall_saves": return this.runStats.near_fall_saves;
    }
    return 0;
  }
  objectiveMet(ob) {
    const v = this.objectiveValue(ob.type);
    if (SS.Session.MAX_TYPES.indexOf(ob.type) >= 0) return v <= ob.target;
    return v >= ob.target;
  }
  objectiveStatus() { return (this.objectives || []).map(ob => ({ ob, value: this.objectiveValue(ob.type), met: this.objectiveMet(ob) })); }
  checkStoryProgress() {
    if (this.ended || this.mode !== "story") return;
    const over = this.objectives.find(o => o.type !== "mistakes_max" && SS.Session.MAX_TYPES.indexOf(o.type) >= 0 && this.objectiveValue(o.type) > o.target);
    if (over) return this.end("limit");
    const accum = this.objectives.filter(o => SS.Session.MAX_TYPES.indexOf(o.type) < 0 && o.type !== "time_remaining_min");
    const tr = this.objectives.find(o => o.type === "time_remaining_min");
    if (tr && this.timeLeft < tr.target) return this.end("time_goal");
    if (accum.every(o => this.objectiveMet(o)) && this.transition <= 0.4) this.end("complete");
  }
  endVoluntary() { if (!this.ended) this.end("quit_voluntary"); }
  // Revive is offered only after a loss the game did not cause on purpose: running out of hearts, time or allowed mistakes.
  canRevive(reason) { return !this.revived && this.mode !== "daily" && !this.tutorial && ["hearts", "time", "mistakes"].includes(reason); }
  revive() {
    if (this.blocked !== "revive") return;
    const r = this.reviveReason; this.revived = true; this.runStats.revives = 1;
    if (r === "hearts") this.hearts = 1;
    if (r === "time") this.timeLeft = (this.timeLeft || 0) + SS.Session.REVIVE.time_bonus;
    if (r === "mistakes") this.mistakes = Math.max(0, this.mistakes - 1);
    // Clear whatever was mid-air so the player restarts on a calm screen.
    this.objects = this.objects.filter(o => o.state !== "falling");
    this.emit("hud");
    SS.Analytics.log("revive", { mode: this.mode, reason: r });
  }
  resumeAfterRevive() { if (this.blocked === "revive") { this.blocked = null; this.acc = 0; } }
  declineRevive() { if (this.blocked !== "revive") return; this.blocked = null; this.end(this.reviveReason, true); }
  end(reason, noOffer) {
    if (this.ended) return;
    if (!noOffer && this.canRevive(reason)) { this.blocked = "revive"; this.reviveReason = reason; this.emit("revive_offer", { reason }); return; }
    this.ended = true; this.state = "ended";
    let success = false;
    if (this.mode === "story") success = reason === "complete" && this.objectives.every(o => this.objectiveMet(o));
    else success = true;
    const result = {
      mode: this.mode, reason, success, mission: this.mission, difficulty: this.diff.id, preset: this.preset,
      score: this.score.score, orders: this.ordersCompleted, perfects: this.score.perfects, mistakes: this.mistakes,
      best_combo: this.score.bestCombo, best_perfect_streak: this.score.bestPerfectStreak, flawless: this.flawless,
      time_left: this.timeLeft, objectives: this.objectiveStatus(), bonus_objective: this.bonusObjective ? { ob: this.bonusObjective, met: this.objectiveMet(this.bonusObjective) } : null,
      stats: this.runStats, revived: this.revived, assist: this.assist, combo_bonus_points: this.score.comboBonusPoints, seed: this.seed, sim_time: this.simTime
    };
    SS.Analytics.log("run_end", { mode: this.mode, reason, success, score: result.score, orders: result.orders });
    this.emit("sfx", success ? "win" : "lose");
    this.emit("end", result);
  }

  // ---------------------------------------------------------------- discovery & feedback
  discover(id, kind, obj) {
    if (SS.Save.d.discovered[id]) return;
    SS.Save.d.discovered[id] = true; SS.Save.save();
    this.firstResultPending[id] = true;
    const fq = this.firstEncounterQueue.indexOf(id); if (fq >= 0) this.firstEncounterQueue.splice(fq, 1);
    this.blocked = "discovery";
    this.emit("discovery", { id, kind, def: SS.DATA.hazard_by_id[id] || SS.DATA.bonus_by_id[id], obj });
    SS.Analytics.log("discovery_first_encounter", { id });
  }
  ackDiscovery() { if (this.blocked === "discovery") this.blocked = null; }
  reinforce(id, how) {
    if (!this.firstResultPending[id]) return;
    delete this.firstResultPending[id];
    const h = SS.DATA.hazard_by_id[id], b = SS.DATA.bonus_by_id[id];
    const text = h ? (how === "avoid" ? h.reinforce_avoid : h.reinforce_hit) : b.reinforce;
    this.emit("toast", { text, kind: h ? "hazard" : "bonus", id });
  }
  hint(text) { this.emit("hint", text); }
  ingName(id) { const d = SS.DATA.ingredient_by_id[id]; return d ? d.display_name : "?"; }
  popup(x, y, text, color, scale, life) { if (this.fx.length > 40) this.fx.shift(); this.fx.push({ type: "text", x, y, text, color, scale: scale || 1, life: life || 1, t: 0 }); }
  burst(x, y, n, color) {
    if (SS.Save.d.settings.reduced_motion) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) { const a = this.rng.range(Math.PI * 1.05, Math.PI * 1.95); const s = this.rng.range(240, 620); this.fx.push({ type: "spark", x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, color, t: 0, life: this.rng.range(0.4, 0.8), r: this.rng.range(5, 11) }); }
  }
  updateFx(dt) {
    for (const f of this.fx) { f.t += dt; if (f.type === "spark") { f.vy += 1500 * dt; f.x += f.vx * dt; f.y += f.vy * dt; } else f.y -= 60 * dt; }
    this.fx = this.fx.filter(f => f.t < f.life);
  }
};

// ---------------- Campaign helpers ----------------
SS.Campaign = {
  avgLayers(m) {
    const pool = m.order_pool_id ? SS.DATA.order_pools[m.order_pool_id] : [m.recipe_id];
    let s = 0; pool.forEach(r => s += SS.DATA.recipe_by_id[r].ingredient_sequence.length); return s / pool.length;
  },
  timeLimit(m) {
    if (m.time_limit) return m.time_limit;
    const orders = m.objectives[0].target;
    const secPerLayer = [3.6, 3.3, 3.2, 3.2, 3.0, 3.0, 2.9, 2.9, 2.8, 2.8, 2.7, 2.7][m.chapter - 1] || 2.7;
    let t = orders * this.avgLayers(m) * secPerLayer + 18 + (m.chapter >= 3 ? orders * 2 : 0);
    const tr = m.objectives.find(o => o.type === "time_remaining_min"); if (tr) t += tr.target;
    return Math.ceil(t / 5) * 5;
  },
  objectivesFor(m, diffId) {
    const sc = SS.DATA.difficulty_profiles.find(d => d.id === diffId).objective_scaling;
    return m.objectives.map(o => {
      const c = Object.assign({}, o);
      if (o.type === "perfect_drops") { c.target = Math.ceil(o.target * sc.perfect_mult); c.label = `Make ${c.target} Perfect drops`; }
      if (o.type === "mistakes_max" && !o.strict) { c.target = Math.max(0, o.target + sc.mistakes_delta); c.label = c.target === 0 ? "Finish with 0 mistakes" : `Finish with ${c.target} or fewer mistakes`; }
      return c;
    });
  },
  choicePatch(m) {
    if (m.number !== 4) return null;
    const ch = SS.DATA.story_choices[m.chapter_id]; const pick = SS.Save.d.story_choices[m.chapter_id];
    if (!ch || !pick) return null; return ch[pick].patch;
  }
};

// Tunables for the fair-play extras. Same values for every player.
SS.Session.REVIVE = { time_bonus: 15 };
// objective types that are limits ("at most N"); going over one ends a story mission
SS.Session.MAX_TYPES = ["mistakes_max", "hazards_max", "collapses_max"];
SS.Session.ASSIST = { fall_mult: 0.85, precision_mult: 1.25 };
