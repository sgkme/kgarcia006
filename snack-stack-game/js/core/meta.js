// Snack Stack \u2014 Rewards + recurring missions + achievements + daily reward/challenge.
// Godot port: EconomyManager/MissionManager services; pure functions over SaveManager data.
window.SS = window.SS || {};

SS.Meta = {
  // ---------- run results -> rewards (Economy Bible \u00a75) ----------
  applyRun(r) {
    const d = SS.Save.d, E = SS.DATA.balance.economy, diff = SS.DATA.difficulty_profiles.find(x => x.id === r.difficulty);
    const out = { coins: 0, xp: 0, levelUps: [], firstClear: false, recipes: [], grants: null, chapterComplete: null, newBest: false, stars: 0, nextUnlocked: null, dailyFirst: false };
    const qualityBonus = Math.min(40, r.flawless * 10);
    let coins = SS.U.clamp(r.orders * E.coins_per_order + Math.floor(r.score / E.coins_score_divisor) + qualityBonus, E.coins_min, E.coins_max);
    if (r.orders === 0 && r.score < 200) coins = Math.min(coins, 5);
    coins = Math.round(coins * diff.reward_multiplier) + (r.stats.bonus_coins || 0);
    let xp = r.orders * E.xp_per_order + Math.floor(r.score / E.xp_score_divisor) + (r.success && r.mode === "story" ? 20 : 0);
    // stats
    const st = r.stats;
    SS.Save.bump("runs", 1); SS.Save.bump("orders", r.orders); SS.Save.bump("perfects", r.perfects);
    SS.Save.bump("flawless_orders", r.flawless); SS.Save.bump("score_total", r.score); SS.Save.bump("quick_drops", st.quick_drops);
    SS.Save.bump("recoveries", st.recoveries); SS.Save.bump("near_fall_saves", st.near_fall_saves); SS.Save.bump("modified_orders", st.modified_orders);
    SS.Save.bump("stable_orders", st.stable_orders);
    if (st.wrong === 0 && r.orders > 0) SS.Save.bump("clean_runs", 1);
    for (const c in st.by_category) SS.Save.bump("orders_" + c, st.by_category[c]);
    for (const m in st.by_mod) SS.Save.bump("mod_" + m, st.by_mod[m]);
    for (const rid in st.by_recipe) d.recipes_served[rid] = (d.recipes_served[rid] || 0) + st.by_recipe[rid];
    SS.Save.max("best_combo", r.best_combo); SS.Save.max("best_run_score", r.score); SS.Save.max("best_run_flawless", r.flawless);
    if (r.mode === "classic") SS.Save.bump("classic_runs", 1);
    if (r.mode === "survival") SS.Save.bump("survival_runs", 1);
    if (r.mode === "story") SS.Save.bump("story_runs", 1);
    // mode bests
    if (r.mode === "classic" || r.mode === "survival") { if (r.score > (d.best[r.mode] || 0)) { d.best[r.mode] = r.score; out.newBest = r.score > 0; } }
    if (r.mode === "daily") {
      const key = SS.U.todayKey(); const prev = d.best.daily[key];
      if (!prev) { out.dailyFirst = true; coins += 150; }
      if (!prev || r.score > prev) { d.best.daily = {}; d.best.daily[key] = r.score; out.newBest = !!prev; }
    }
    // story
    if (r.mode === "story" && r.mission) {
      const m = r.mission, ms = SS.Progress.missionState(m.id);
      ms.plays++; ms.best_score = Math.max(ms.best_score, r.score);
      if (r.success) {
        const wasCleared = SS.Progress.isCleared(m.id);
        ms.cleared[r.difficulty] = true;
        if (!ms.first_clear) {
          ms.first_clear = true; out.firstClear = true;
          coins += m.rewards.coins; xp += m.rewards.xp;
          m.first_clear_recipes.forEach(id => { if (SS.Progress.unlockRecipe(id)) out.recipes.push(id); });
          if (m.number === 6 && !m.special) out.chapterComplete = this.completeChapter(m.chapter_id, out);
          if (m.special) SS.Save.max("specials_cleared", SS.Progress.specialsCleared());
          else { const next = SS.DATA.missions[m.index + 1]; if (next && SS.Progress.isMissionUnlocked(next)) out.nextUnlocked = next; }
        }
        if (r.bonus_objective && r.bonus_objective.met) coins += r.bonus_objective.ob.coins || 0;
        if (!wasCleared) {}
      }
      out.stars = ["normal", "hard", "extreme"].filter(k => ms.cleared[k]).length;
    }
    SS.Economy.addCoins(coins); SS.Save.bump("coins_earned", coins);
    out.levelUps = SS.Economy.addXP(xp);
    out.coins = coins; out.xp = xp;
    SS.Progress.refreshCollectionStats();
    SS.Save.save();
    SS.Analytics.log("rewards_granted", { coins, xp, mode: r.mode });
    return out;
  },
  completeChapter(chId, out) {
    const d = SS.Save.d; if (d.chapters_completed.indexOf(chId) >= 0) return null;
    d.chapters_completed.push(chId);
    const ch = SS.DATA.chapters.find(c => c.id === chId), g = ch.finale_grants;
    const res = { chapter: ch, tickets: 0, cosmetics: [], recipes: [], nextChapter: null, hazards: [], bonuses: [] };
    if (!d.chapter_grants_claimed[chId]) {
      d.chapter_grants_claimed[chId] = true;
      SS.Economy.addTickets(g.tickets); res.tickets = g.tickets;
      (g.cosmetics || []).forEach(c => { if (SS.Progress.ownCosmetic(c)) res.cosmetics.push(c); });
      if (g.badge) d.badges.push(g.badge);
    }
    const next = SS.DATA.chapters[ch.number];
    if (next && d.chapters_unlocked.indexOf(next.id) < 0) {
      d.chapters_unlocked.push(next.id); res.nextChapter = next;
      (SS.DATA.chapter_open_recipes[next.id] || []).forEach(id => { if (SS.Progress.unlockRecipe(id)) res.recipes.push(id); });
      SS.DATA.missions.filter(m => m.chapter_id === next.id).forEach(m => { res.hazards.push(...m.new_hazards); res.bonuses.push(...m.new_bonuses); });
    }
    return res;
  },

  // ---------- daily / weekly missions ----------
  genSet(templates, n, seedKey, statsWindow) {
    const rng = new SS.RNG(SS.U.hashStr(seedKey));
    const ch = SS.Progress.highestChapter();
    const unlockedCats = {}; SS.Progress.unlockedRecipes().forEach(r => unlockedCats[SS.DATA.recipe_by_id[r].category] = 1);
    const ok = templates.filter(t => (!t.requires_category || unlockedCats[t.requires_category]) && (!t.requires_chapter || ch >= t.requires_chapter));
    const picked = [], usedStats = {};
    for (const t of rng.shuffle(ok)) { if (picked.length >= n) break; if (usedStats[t.stat]) continue; usedStats[t.stat] = 1; let v = rng.int(t.range[0], t.range[1]); if (t.round) v = Math.max(t.round, Math.round(v / t.round) * t.round); picked.push({ id: t.id, stat: t.stat, target: v, label: t.label.replace("{n}", v.toLocaleString("en-US")), coins: t.coins, claimed: false, max_type: !!t.max_type }); }
    return picked;
  },
  ensureMissions() {
    SS.Save.ensurePeriods(); const d = SS.Save.d;
    if (!d.daily.missions) d.daily.missions = this.genSet(SS.DATA.daily_templates, 3, "day:" + d.daily.date + ":" + d.daily.rerolls, d.daily.stats);
    if (!d.weekly.missions) d.weekly.missions = this.genSet(SS.DATA.weekly_templates, 3, "week:" + d.weekly.week, d.weekly.stats);
  },
  missionProgress(m, window) { return Math.min(m.target, window.stats[m.stat] || 0); },
  rerollDaily() { const d = SS.Save.d; if (d.daily.rerolls >= 1) return false; d.daily.rerolls++; const claimed = d.daily.missions.filter(m => m.claimed); d.daily.missions = claimed.concat(this.genSet(SS.DATA.daily_templates.filter(t => !claimed.some(c => c.id === t.id)), 3 - claimed.length, "day:" + d.daily.date + ":r" + d.daily.rerolls)); SS.Save.save(); return true; },
  claimMission(kind, idx) {
    const d = SS.Save.d, w = kind === "daily" ? d.daily : d.weekly, m = w.missions[idx];
    if (!m || m.claimed || this.missionProgress(m, w) < m.target) return null;
    m.claimed = true; SS.Economy.addCoins(m.coins); SS.Save.bump(kind === "daily" ? "daily_missions_claimed" : "weekly_missions_claimed", 1);
    const ups = SS.Economy.addXP(kind === "daily" ? 20 : 60); SS.Save.save();
    return { coins: m.coins, levelUps: ups };
  },
  achievementProgress(a) { return Math.min(a.target, SS.Save.d.stats[a.stat] || 0); },
  claimAchievement(a) {
    const d = SS.Save.d; if (d.achievements_claimed[a.id] || this.achievementProgress(a) < a.target) return null;
    d.achievements_claimed[a.id] = true; SS.Economy.addCoins(a.coins); if (a.tickets) SS.Economy.addTickets(a.tickets); SS.Save.save();
    return { coins: a.coins, tickets: a.tickets };
  },
  claimableCount() {
    this.ensureMissions(); const d = SS.Save.d; let n = 0;
    d.daily.missions.forEach(m => { if (!m.claimed && this.missionProgress(m, d.daily) >= m.target) n++; });
    d.weekly.missions.forEach(m => { if (!m.claimed && this.missionProgress(m, d.weekly) >= m.target) n++; });
    SS.DATA.achievements.forEach(a => { if (!d.achievements_claimed[a.id] && this.achievementProgress(a) >= a.target) n++; });
    return n;
  },

  // ---------- daily reward (Economy Bible \u00a76: missing a day never resets the cycle) ----------
  dailyRewardAvailable() { const r = SS.Save.d.daily_reward; return r.last_claim_date !== SS.U.todayKey(); },
  claimDailyReward(double) {
    const r = SS.Save.d.daily_reward; if (!this.dailyRewardAvailable()) return null;
    const rec = SS.DATA.daily_rewards[(r.next_day - 1) % 7];
    const coins = rec.coins * (double ? 2 : 1);
    SS.Economy.addCoins(coins); const ups = SS.Economy.addXP(rec.xp);
    r.last_claim_date = SS.U.todayKey(); r.next_day = r.next_day % 7 + 1; SS.Save.bump("daily_rewards_claimed", 1); SS.Save.save();
    return { coins, xp: rec.xp, day: rec.day, levelUps: ups };
  },

  // ---------- daily challenge ----------
  dailyChallenge() {
    const key = SS.U.todayKey(), h = SS.U.hashStr("daily:" + key);
    return { preset: SS.DATA.daily_presets[h % SS.DATA.daily_presets.length], seed: h, key, best: SS.Save.d.best.daily[key] || 0 };
  },
  dailyUnlocked() { return SS.Progress.isCleared(SS.DATA.mode_rules.daily.unlock_mission); }
};
