// Snack Stack \u2014 SaveManager + Progress/Economy services.
// Versioned, non-destructive migrations (CLAUDE.md coding rules). localStorage with in-memory fallback.
// Godot port: SaveManager autoload writing user://save.json; keep schema_version + migrate().
window.SS = window.SS || {};

SS.Save = (function () {
  const KEY = "snackstack_save";
  const SCHEMA = 2;
  let data = null;
  let memoryOnly = false;

  function fresh() {
    return {
      schema_version: SCHEMA, created: Date.now(), last_played: Date.now(),
      coins: 500, tickets: 0, xp: 0, level: 1,
      settings: { music: true, sfx: true, haptics: true, control: "drag", reduced_motion: false, debug: false, show_guides: true, assist: false },
      recipes_unlocked: (SS.DATA.chapter_open_recipes.chapter_01 || []).slice(), recipes_viewed: [], recipes_served: {},
      missions: {}, chapters_unlocked: ["chapter_01"], chapters_completed: [], chapter_grants_claimed: {},
      story_choices: {}, story_seen: {}, discovered: {},
      cosmetics: { owned: ["plate_default", "kitchen_default"], plate: "plate_default", kitchen: "kitchen_default" },
      stats: {}, best: { classic: 0, survival: 0, daily: {} },
      daily: null, weekly: null, daily_reward: { next_day: 1, last_claim_date: null },
      achievements_claimed: {}, tutorial_done: false, badges: [], fail_streak: 0
    };
  }

  // Migration chain. Legacy prototype saves may carry `gems`: convert to Tickets (CLAUDE.md: gems are migration-only).
  function migrate(d) {
    if (!d || typeof d !== "object") return fresh();
    const base = fresh();
    if (!d.schema_version) {
      if (typeof d.gems === "number") { d.tickets = (d.tickets || 0) + d.gems; delete d.gems; }
      d.schema_version = 1;
    }
    // v2: the menu became the 117-dish kit. Map old recipe ids, then re-grant unlocks from cleared missions.
    if (d.schema_version < 2) {
      const MAP = { classic_burger: "cheeseburger", veggie_burger: "veggie_burger", bacon_burger: "bacon_burger", chicken_deluxe: "chicken_burger", egg_cheese_toast: "breakfast_sandwich",
        breakfast_bagel: "breakfast_bagel", sausage_stack: "eggs_sausage", pancake_tower: "pancakes", breakfast_sampler: "eggs_bacon", blt_stack: "blt", club_stack: "club_sandwich",
        avocado_toast: "french_toast", chicken_toastie: "chicken_sandwich", sandwich_sampler: "sub_sandwich", ham_cheddar_melt: "ham_sandwich", chocolate_sundae: "sundae", strawberry_sundae: "sundae",
        waffle_berry_stack: "waffles", spicy_burger: "spicy_burger", fish_burger: "fish_burger", mega_stack: "double_burger", loaded_potato: "loaded_potato" };
      const map = arr => [...new Set((arr || []).map(id => MAP[id] || id).filter(id => SS.DATA.recipe_by_id[id]))];
      const served = {}; for (const k in (d.recipes_served || {})) { const n = MAP[k] || k; if (SS.DATA.recipe_by_id[n]) served[n] = (served[n] || 0) + d.recipes_served[k]; }
      d.recipes_served = served; d.recipes_viewed = map(d.recipes_viewed);
      const un = new Set(map(d.recipes_unlocked));
      (d.chapters_unlocked || ["chapter_01"]).forEach(c => (SS.DATA.chapter_open_recipes[c] || []).forEach(r => un.add(r)));
      for (const mid in (d.missions || {})) { const m = SS.DATA.mission_by_id[mid], st = d.missions[mid]; if (m && st && Object.keys(st.cleared || {}).some(k => st.cleared[k])) m.first_clear_recipes.forEach(r => un.add(r)); }
      d.recipes_unlocked = [...un];
      if (d.best && d.best.daily) d.best.daily = {};
      d.schema_version = 2;
    }
    // Fill any missing keys without overwriting existing values.
    for (const k in base) if (d[k] === undefined) d[k] = base[k];
    for (const k in base.settings) if (d.settings[k] === undefined) d.settings[k] = base.settings[k];
    for (const k in base.cosmetics) if (d.cosmetics[k] === undefined) d.cosmetics[k] = base.cosmetics[k];
    return d;
  }

  function load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      data = migrate(raw ? JSON.parse(raw) : null);
    } catch (e) { memoryOnly = true; data = fresh(); }
    return data;
  }
  function save() {
    if (!data) return;
    data.last_played = Date.now();
    if (memoryOnly) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { memoryOnly = true; }
  }
  function reset() { data = fresh(); save(); return data; }

  // ---- stats (lifetime + daily + weekly windows) ----
  function ensurePeriods() {
    const today = SS.U.todayKey(), week = SS.U.weekKey();
    if (!data.daily || data.daily.date !== today) { data.daily = { date: today, stats: {}, missions: null, rerolls: 0 }; }
    if (!data.weekly || data.weekly.week !== week) { data.weekly = { week, stats: {}, missions: null }; }
  }
  function bump(key, n) {
    if (!n) return; ensurePeriods();
    data.stats[key] = (data.stats[key] || 0) + n;
    data.daily.stats[key] = (data.daily.stats[key] || 0) + n;
    data.weekly.stats[key] = (data.weekly.stats[key] || 0) + n;
  }
  function max(key, v) {
    ensurePeriods();
    data.stats[key] = Math.max(data.stats[key] || 0, v);
    data.daily.stats[key] = Math.max(data.daily.stats[key] || 0, v);
    data.weekly.stats[key] = Math.max(data.weekly.stats[key] || 0, v);
  }

  return { load, save, reset, get d() { return data; }, bump, max, ensurePeriods, get memoryOnly() { return memoryOnly; } };
})();

// ---------------- Progress service (campaign unlocks, eligibility) ----------------
SS.Progress = {
  missionState(id) { const m = SS.Save.d.missions; return m[id] || (m[id] = { cleared: {}, best_score: 0, plays: 0, first_clear: false }); },
  isCleared(id, diff) { const s = SS.Save.d.missions[id]; if (!s) return false; return diff ? !!s.cleared[diff] : Object.keys(s.cleared).some(k => s.cleared[k]); },
  chapterUnlocked(chId) { return SS.Save.d.chapters_unlocked.indexOf(chId) >= 0; },
  isMissionUnlocked(m) {
    if (m.special) return SS.Save.d.chapters_completed.indexOf(m.chapter_id) >= 0;   // Special Orders open when the chapter is finished
    if (!this.chapterUnlocked(m.chapter_id)) return false;
    if (m.number === 1) return true;
    const prev = SS.DATA.missions[m.index - 1];
    return this.isCleared(prev.id);
  },
  specialsCleared() { return (SS.DATA.specials || []).filter(m => this.isCleared(m.id)).length; },
  highestChapter() { let h = 1; SS.Save.d.chapters_unlocked.forEach(c => { h = Math.max(h, parseInt(c.slice(-2), 10)); }); return h; },
  extremeUnlocked() { return SS.Save.d.chapters_completed.indexOf("chapter_01") >= 0; },
  difficultyUnlocked(id) { return id !== "extreme" || this.extremeUnlocked(); },
  chapterProgress(chId) { const ms = SS.DATA.missions.filter(m => m.chapter_id === chId); return { done: ms.filter(m => this.isCleared(m.id)).length, total: ms.length }; },
  nextMission() { for (const m of SS.DATA.missions) { if (!this.isCleared(m.id) && this.isMissionUnlocked(m)) return m; } return SS.DATA.missions[SS.DATA.missions.length - 1]; },
  unlockedRecipes() { return SS.Save.d.recipes_unlocked.filter(id => SS.DATA.recipe_by_id[id]); },
  // Hazards/bonuses the player has been taught (story intro mission reached). Replayable modes use only these.
  taughtHazards() { return SS.DATA.hazards.filter(h => SS.Save.d.discovered[h.id]).map(h => h.id); },
  taughtBonuses() { return SS.DATA.bonuses.filter(b => SS.Save.d.discovered[b.id]).map(b => b.id); },
  // Story: everything introduced in missions up to and including this one, in campaign order.
  introducedUpTo(mission) {
    const hz = [], bn = [];
    for (const m of SS.DATA.missions) { if (m.index > mission.index) break; hz.push(...m.new_hazards); bn.push(...m.new_bonuses); }
    return { hazards: hz, bonuses: bn };
  },
  unlockRecipe(id) { const d = SS.Save.d; if (d.recipes_unlocked.indexOf(id) < 0 && SS.DATA.recipe_by_id[id]) { d.recipes_unlocked.push(id); return true; } return false; },
  ownCosmetic(id) { const o = SS.Save.d.cosmetics.owned; if (o.indexOf(id) < 0) { o.push(id); return true; } return false; },
  owns(id) { return SS.Save.d.cosmetics.owned.indexOf(id) >= 0; },
  cosmeticCounts() { const o = SS.Save.d.cosmetics.owned; return { total: o.length, plates: o.filter(x => x.startsWith("plate_")).length, kitchens: o.filter(x => x.startsWith("kitchen_")).length }; },
  refreshCollectionStats() {
    const c = this.cosmeticCounts();
    SS.Save.max("cosmetics_owned", c.total); SS.Save.max("plates_owned", c.plates); SS.Save.max("kitchens_owned", c.kitchens);
    SS.Save.max("recipes_unlocked", SS.Save.d.recipes_unlocked.length);
    SS.Save.max("recipes_served", Object.keys(SS.Save.d.recipes_served).length);
    SS.Save.max("chapters_done", SS.Save.d.chapters_completed.length);
  }
};

// ---------------- Economy + levels ----------------
SS.Economy = {
  addCoins(n) { SS.Save.d.coins = Math.max(0, SS.Save.d.coins + Math.round(n)); },
  addTickets(n) { SS.Save.d.tickets = Math.max(0, SS.Save.d.tickets + Math.round(n)); },
  canAfford(item) { if (item.price_tickets) return SS.Save.d.tickets >= item.price_tickets; return SS.Save.d.coins >= (item.price_coins || 0); },
  buy(item) {
    if (!this.canAfford(item) || item.grant_only || SS.Progress.owns(item.id)) return false;
    if (item.price_tickets) SS.Save.d.tickets -= item.price_tickets; else SS.Save.d.coins -= (item.price_coins || 0);
    SS.Progress.ownCosmetic(item.id); SS.Progress.refreshCollectionStats(); SS.Analytics.log("shop_purchase", { id: item.id });
    SS.Save.save(); return true;
  },
  levelFor(xp) { let lv = 1; for (const L of SS.DATA.levels) if (xp >= L.xp) lv = L.level; return lv; },
  levelProgress() {
    const d = SS.Save.d, lv = this.levelFor(d.xp), cur = SS.DATA.levels[lv - 1], nxt = SS.DATA.levels[lv];
    if (!nxt) return { level: lv, ratio: 1, into: 0, need: 0, max: true };
    return { level: lv, ratio: (d.xp - cur.xp) / (nxt.xp - cur.xp), into: d.xp - cur.xp, need: nxt.xp - cur.xp };
  },
  // Returns array of level-up reward records.
  addXP(n) {
    const d = SS.Save.d, before = this.levelFor(d.xp);
    d.xp += Math.max(0, Math.round(n));
    const after = this.levelFor(d.xp), ups = [];
    for (let L = before + 1; L <= after; L++) { const rec = SS.DATA.levels[L - 1]; this.addCoins(rec.coins); if (rec.badge) d.badges.push("Level " + L); ups.push(rec); }
    d.level = after; return ups;
  }
};
