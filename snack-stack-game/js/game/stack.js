// Snack Stack \u2014 StackController + ScoreController.
// Direct port of scripts/gameplay/catch_stack_stack_controller.gd and catch_stack_score_controller.gd
// (controlled snapping, balance, stability, near-fall, recovery, partial collapse; combo/streak/order grade).
// Coordinates: layer x is local to the plate center; y grows upward from the plate surface.
window.SS = window.SS || {};

SS.Stack = class {
  constructor(cfg) { this.cfg = cfg; this.reset(); }
  reset() {
    this.layers = [];
    this.supportCenter = 0;
    this.supportHalf = this.cfg.plate.support_half_width;
    this.height = 0; // total stack height above plate surface
    this.stability = this.cfg.stability.start;
    this.balance = 0;
  }
  qualityFor(n) {
    const q = this.cfg.quality_thresholds;
    if (n <= q.perfect) return "perfect"; if (n <= q.good) return "good"; if (n <= q.messy) return "messy"; if (n <= q.danger) return "danger"; return "fall";
  }
  // incomingLocalX: object x relative to plate center. tolMult: difficulty/wide-catch tolerance.
  // anchor: optional fixed catch centre for this step (side-by-side items); defaults to the top of the stack
  evaluate(def, incomingLocalX, tolMult, anchor) {
    const col = anchor !== undefined && anchor !== null;
    const centre = col ? anchor : this.supportCenter;
    const raw = incomingLocalX - centre;
    const incomingHalf = def.w * 0.46 * def.precision_multiplier * tolMult;
    const eff = Math.max(Math.min(incomingHalf, this.supportHalf * tolMult), 1);
    const n = SS.U.clamp(Math.abs(raw) / eff, 0, 2);
    return { raw, eff, normalized: n, accuracy: 1 - SS.U.clamp(n, 0, 1), quality: this.qualityFor(n), stability_before: this.stability, balance_before: this.balance, centre, col };
  }
  register(def, ev, wasNearFall, slipMult) {
    const s = this.cfg.stability, quality = ev.quality;
    const beforeBal = this.balance, beforeStab = this.stability, first = this.layers.length === 0;
    const centre = ev.centre !== undefined ? ev.centre : this.supportCenter;
    const correction = SS.U.clamp(-ev.raw * 0.08, -8, 8);
    const finalX = def.snap ? centre : (first && !ev.col ? 0 : (centre + ev.raw + correction));
    const tilt = this.tiltFor(quality, ev.raw, ev.normalized);
    const layer = { id: def.id, def, x: finalX, y: this.height, h: def.h, half: def.w * 0.45, weight: def.balance_weight, quality, tilt, slip: def.slip_risk, land_t: 0 };
    this.layers.push(layer);
    this.height += def.h;
    if (!ev.col && !def.snap) { this.supportCenter = finalX; this.supportHalf = Math.max(layer.half, 1); }
    else if (!ev.col && def.w * 0.45 > this.supportHalf) this.supportHalf = def.w * 0.45;
    this.recalcBalance();
    this.stability = this.stabilityAfter(quality, def, beforeStab, slipMult || 1);
    const recovery = this.isRecovery(beforeBal, this.balance, beforeStab);
    if (recovery) this.stability = Math.min(100, this.stability + this.cfg.recovery.stability_bonus);
    let saved = false, fall = false;
    if (wasNearFall) { if ((quality === "perfect" || quality === "good") && recovery && this.stability > s.critical_threshold) saved = true; else if ((quality === "perfect" || quality === "good") && this.stability > s.critical_threshold + 5) saved = true; else fall = true; }
    const entered = !wasNearFall && this.stability <= s.critical_threshold;
    return Object.assign({}, ev, { stability_after: this.stability, balance_after: this.balance, is_recovery: recovery, entered_near_fall: entered, near_fall_saved: saved, fall_triggered: fall, layer });
  }
  // Remove top `count` layers; returns removed layer records (for tumble animation).
  collapseTop(count) {
    if (!this.layers.length) return [];
    let n = SS.U.clamp(count, 1, this.layers.length);
    if (this.layers.length > 1) n = Math.min(n, this.layers.length - 1); // keep the base layer
    const removed = this.layers.splice(this.layers.length - n, n);
    this.rebuild(); this.recalcBalance();
    this.stability = Math.max(this.stability, this.cfg.stability.post_collapse_stability);
    return removed;
  }
  dumpAll() { const all = this.layers.slice(); this.reset(); return all; }
  nudge(amount) { // counter shake: displace top layers slightly
    const k = Math.min(3, this.layers.length);
    for (let i = this.layers.length - k; i < this.layers.length; i++) if (i > 0) this.layers[i].x += amount * (0.4 + 0.3 * (i - (this.layers.length - k)));
    if (this.layers.length) this.supportCenter = this.layers[this.layers.length - 1].x;
    this.recalcBalance();
  }
  tiltFor(q, raw, n) {
    let m = 0.8; if (q === "good") m = 3; else if (q === "messy") m = 6; else if (q === "danger") m = 10;
    return (raw < 0 ? -1 : 1) * m * SS.U.clamp(n / 0.8, 0.2, 1);
  }
  stabilityAfter(q, def, before, slipMult) {
    const s = this.cfg.stability; let d = s[q + "_delta"]; if (d === undefined) d = -20;
    const heightFactor = 1 + Math.max(this.layers.length - 1, 0) * 0.05;
    const slip = Math.max(def.slip_risk, 0.1);
    const balPenalty = Math.abs(this.balance) / Math.max(this.cfg.plate.support_half_width, 1) * 7.5;
    if (d < 0) d *= heightFactor * slip * slipMult;
    return SS.U.clamp(before + d - balPenalty, 0, 100);
  }
  recalcBalance() { if (!this.layers.length) { this.balance = 0; return; } let w = 0, t = 0; for (const l of this.layers) { w += l.x * l.weight; t += l.weight; } this.balance = w / Math.max(t, 0.001); }
  isRecovery(before, after, beforeStab) {
    if (beforeStab > this.cfg.stability.wobbly_threshold) return false;
    const b = Math.abs(before); if (b < 1) return false;
    return (b - Math.abs(after)) / b >= this.cfg.recovery.minimum_improvement_ratio;
  }
  rebuild() {
    if (!this.layers.length) { this.supportCenter = 0; this.supportHalf = this.cfg.plate.support_half_width; this.height = 0; return; }
    const top = this.layers[this.layers.length - 1];
    this.supportCenter = top.def.snap ? this.supportCenter : top.x; this.supportHalf = Math.max(top.half, this.baseHalf || 1);
    this.height = 0; for (const l of this.layers) { l.y = this.height; this.height += l.h; }
  }
  stabilityBand() { const s = this.cfg.stability, v = this.stability; if (v <= s.critical_threshold) return "critical"; if (v < s.danger_threshold) return "danger"; if (v < s.wobbly_threshold) return "wobbly"; if (v < s.uneasy_threshold) return "uneasy"; return "steady"; }
};

SS.Score = class {
  constructor(cfg) { this.cfg = cfg; this.resetRun(); }
  resetRun() { this.score = 0; this.combo = 0; this.mult = 1; this.perfectStreak = 0; this.bestPerfectStreak = 0; this.bestCombo = 0; this.perfects = 0; this.placements = 0; this.accSum = 0; this.comboBonusPoints = 0; this.resetOrder(); }
  resetOrder() { this.oAcc = []; this.oClean = 0; this.oMiss = 0; this.oWrong = 0; this.oCollapse = 0; }
  placement(res, tierMult, opts) {
    opts = opts || {};
    const q = res.quality; let base = this.cfg.base_points[q] || 0;
    if (opts.onlyClean && q !== "perfect" && q !== "good") base = 0;
    const prec = Math.round(res.accuracy * this.cfg.precision_bonus_max);
    let rec = 0; if (res.is_recovery) rec = this.cfg.recovery.bonus_points; if (res.near_fall_saved) rec += this.cfg.near_fall.save_bonus;
    if (q === "perfect" || q === "good") this.combo++; else if (q !== "messy") this.combo = 0;
    this.mult = this.comboMult(this.combo); this.bestCombo = Math.max(this.bestCombo, this.combo);
    let streak = 0;
    if (q === "perfect") { this.perfectStreak++; this.perfects++; this.bestPerfectStreak = Math.max(this.bestPerfectStreak, this.perfectStreak); streak = (this.cfg.perfect_streak_milestones[this.perfectStreak] || 0) * (opts.streakMult || 1); }
    else this.perfectStreak = 0;
    const raw = (base + prec + rec);
    const pts = Math.round(raw * this.mult * tierMult) + streak;
    this.comboBonusPoints += Math.max(0, Math.round(raw * (this.mult - 1) * tierMult));
    this.score += pts; this.placements++; this.accSum += res.accuracy; this.oAcc.push(res.accuracy);
    if (q === "perfect" || q === "good") this.oClean++;
    return { points: pts, combo: this.combo, mult: this.mult, streak_bonus: streak };
  }
  breakCombo() { this.combo = 0; this.mult = 1; this.perfectStreak = 0; }
  miss(shield) { this.oMiss++; if (!shield) this.breakCombo(); }
  wrong(shield, penalty) { this.oWrong++; if (!shield) this.breakCombo(); if (penalty) { const p = this.cfg.wrong_catch_endless_penalty; this.score = Math.max(0, this.score - p); return p; } return 0; }
  collapse() { this.oCollapse++; this.breakCombo(); }
  add(n) { this.score += Math.round(n); }
  finishOrder(stability, tierMult, mealPenalty, rewardMult) {
    const n = this.oAcc.length; let avg = 0; for (const v of this.oAcc) avg += v; if (n) avg /= n;
    const clean = this.oClean / Math.max(n, 1);
    let qs = avg * 45 + SS.U.clamp(stability / 100, 0, 1) * 30 + clean * 25;
    qs = Math.max(0, qs - (mealPenalty || 0));
    const label = this.label(qs);
    const qb = Math.round(qs * 3 * tierMult * (rewardMult === undefined ? 1 : rewardMult));
    const perfectOrder = n > 0 && this.oClean === n && this.oMiss === 0 && this.oWrong === 0 && this.oCollapse === 0 && stability >= this.cfg.perfect_order.minimum_stability && !mealPenalty;
    const pb = perfectOrder ? this.cfg.perfect_order.bonus_points : 0;
    const res = { label, quality_score: qs, bonus: qb + pb, perfect_order: perfectOrder, average_accuracy: avg, stability };
    return res;
  }
  commitOrder(res) { this.score += res.bonus; this.resetOrder(); }
  label(v) { const q = this.cfg.order_quality; if (v >= q.flawless) return "FLAWLESS"; if (v >= q.clean) return "CLEAN"; if (v >= q.solid) return "SOLID"; if (v >= q.rough) return "ROUGH"; return "SLOPPY"; }
  comboMult(c) { let out = 1; for (const t of this.cfg.combo.tiers) if (c >= t[0]) out = t[1]; return Math.min(out, this.cfg.combo.max_multiplier); }
};
