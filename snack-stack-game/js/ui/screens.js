// Snack Stack \u2014 menu screens: Splash, Home, Mode Select, Story (chapter/mission list), Mission Briefing,
// Collection (recipes/ingredients/hazards/bonuses), Shop, Missions (daily/weekly/achievements), Settings.
window.SS = window.SS || {};
(function () {
  const UI = SS.UI, I = SS.Icons, U = SS.U, esc = SS.U.esc;
  const D = () => SS.Save.d;

  // ---------------- Splash ----------------
  UI.register("splash", {
    render() {
      return `${SS.Art.thumbHTML("cheeseburger", 520, 'class="hero-burger"')}
        <div class="logo">${I.rays}<span class="l1">SNACK</span><span class="l2">STACK</span></div>
        <div class="loadbar" aria-hidden="true"><i id="lb"></i></div>
        <button class="tapstart" data-act="go" style="background:none;border:0" id="tapstart" hidden>Tap to start</button>
        <div class="version">v2.0 browser build</div>`;
    },
    after(el) {
      let w = 0; const lb = el.querySelector("#lb");
      const iv = setInterval(() => { w = Math.min(100, w + 18); lb.style.width = w + "%"; if (w >= 100) { clearInterval(iv); el.querySelector(".loadbar").hidden = true; el.querySelector("#tapstart").hidden = false; } }, 90);
    },
    on(act) { if (act === "go") { SS.Audio.unlock(); UI.show("home"); } }
  });

  // ---------------- Home ----------------
  UI.register("home", {
    cls: "bg-truck",
    render() {
      const n = SS.Meta.claimableCount();
      return `${UI.topbar({ gear: true, level: true, chef: true })}<img class="home-chef" alt="" src="assets/icons/chef_wave.png">
        <div class="logo">${I.rays}<span class="l1">SNACK</span><span class="l2">STACK</span></div>
        <div class="home-btns">
          <button class="btn play yellow" data-act="play">${I.play}PLAY</button>
          <button class="btn blue" data-act="recipes">${I.book}RECIPES</button>
          <button class="btn green" data-act="shop">${I.cart}SHOP</button>
          <button class="btn purple" data-act="missions">${I.clip}MISSIONS${n ? `<span class="badge-dot">${n}</span>` : ""}</button>
        </div>`;
    },
    after() {
      if (SS.Meta.dailyRewardAvailable() && !UI._dailyShown) { UI._dailyShown = true; setTimeout(() => SS.Screens.dailyReward(), 350); }
    },
    on(act) {
      if (act === "play") UI.show("mode");
      if (act === "recipes") UI.show("recipes", { tab: "recipes" });
      if (act === "shop") UI.show("shop", { tab: "plates" });
      if (act === "missions") UI.show("missions", { tab: "daily" });
      if (act === "settings") UI.show("settings");
    }
  });

  // ---------------- Mode Select ----------------
  UI.register("mode", {
    cls: "bg-truck",
    render() {
      const d = D(), dc = SS.Meta.dailyChallenge(), dUn = SS.Meta.dailyUnlocked();
      const nm = SS.Progress.nextMission();
      return `${UI.backBtn()}<div class="banner">MODE SELECT</div>
      <div class="mode-list">
        <button class="modecard" style="background:#2f9bf0" data-act="classic"><div class="art"><img alt="" src="assets/icons/sand_happy.png"></div><div><h3>CLASSIC</h3><span class="tag">Timed score run</span></div>${d.best.classic ? `<span class="best">Best ${U.fmt(d.best.classic)}</span>` : ""}</button>
        <button class="modecard" style="background:#45c449" data-act="story"><div class="art"><img alt="" src="assets/icons/bun_cheer.png"></div><div><h3>STORY</h3><span class="tag">Chapter ${nm.chapter} \u00b7 Mission ${nm.number}</span></div></button>
        <button class="modecard" style="background:#f0473e" data-act="survival"><div class="art"><img alt="" src="assets/icons/sand_angry.png"></div><div><h3>SURVIVAL</h3><span class="tag">Endless waves, 3 hearts</span></div>${d.best.survival ? `<span class="best">Best ${U.fmt(d.best.survival)}</span>` : ""}</button>
        <button class="modecard ${dUn ? "" : "locked"}" style="background:#845ef7" data-act="daily"><div class="art"><img alt="" src="assets/icons/burger_yay.png"></div><div><h3 style="font-size:82px">DAILY</h3>${dUn ? `<span class="tag">${esc(dc.preset.name)}</span>` : `<div class="lockmsg">Clear Story 1-6 to unlock</div>`}</div>${dUn && dc.best ? `<span class="best">Today ${U.fmt(dc.best)}</span>` : ""}</button>
      </div>`;
    },
    on(act) {
      if (act === "back") UI.show("home");
      if (act === "story") UI.show("story", {});
      if (act === "classic" || act === "survival") SS.Screens.modeIntro(act);
      if (act === "daily") { if (!SS.Meta.dailyUnlocked()) return UI.modal(`<h2>LOCKED</h2><p>Finish Story Chapter 1 to unlock the Daily Challenge.</p><div class="btns"><button class="btn sm blue" data-act="close">OK</button></div>`); SS.Screens.modeIntro("daily"); }
    }
  });

  // ---------------- Story: chapter + mission list ----------------
  UI.register("story", {
    cls: "bg-truck",
    render(p) {
      const P = SS.Progress;
      if (!p.chapter) p.chapter = SS.Progress.nextMission().chapter;
      const ch = SS.DATA.chapters[p.chapter - 1], prog = P.chapterProgress(ch.id), unlocked = P.chapterUnlocked(ch.id);
      const ms = SS.DATA.missions.filter(m => m.chapter_id === ch.id);
      const cur = ms.find(m => !P.isCleared(m.id) && P.isMissionUnlocked(m));
      const rows = ms.map(m => {
        const open = P.isMissionUnlocked(m), st = P.missionState(m.id), stars = ["normal", "hard", "extreme"].filter(k => st.cleared[k]).length;
        const title = open ? esc(m.title) : (m.number === 6 && !P.isMissionUnlocked(SS.DATA.missions[m.index - 1]) ? "???" : esc(m.title));
        const rid = m.order_pool_id ? SS.DATA.order_pools[m.order_pool_id][0] : m.recipe_id, goal = SS.Campaign.objectivesFor(m, "normal")[0].label;
        const stat = stars ? `<span class="mstat done">${I.check}<span>Done</span></span>` : cur === m ? `<span class="mstat cur">${I.play}<span>Play</span></span>` : open ? `<span class="mstat cur">${I.play}<span>Play</span></span>` : `<span class="mstat lock">${I.lock}<span>Locked</span></span>`;
        return `<button class="mrow ${open ? "" : "locked"} ${cur === m ? "current" : ""}" data-act="mission" data-arg="${m.id}" aria-label="Mission ${m.number} ${title}${open ? "" : " locked"}">
          <span class="micon">${SS.Art.thumbHTML(rid, 120, `style="${open ? "" : "filter:grayscale(1) opacity(.55)"}"`)}</span>
          <div class="info"><span class="mnum">Mission ${m.number}</span><div class="mt">${title}</div><div class="msub">${open ? esc(goal) : "Clear Mission " + (m.number - 1) + " to unlock"}</div>${stars ? UI.starRow(stars) : ""}</div>
          ${stat}</button>`;
      }).join("");
      // Special Orders: optional twists that open once the chapter is finished (own screen, one chapter per page)
      const sps = (SS.DATA.specials || []).filter(m => m.chapter_id === ch.id), spOpen = sps.length && P.isMissionUnlocked(sps[0]);
      const spBtn = sps.length ? `<button class="mrow special ${spOpen ? "" : "locked"}" data-act="specials" aria-label="Special Orders${spOpen ? "" : " locked"}">
          <span class="micon sp-star">\u2605</span>
          <div class="info"><span class="mnum">Optional</span><div class="mt">Special Orders</div><div class="msub">${spOpen ? `${sps.filter(m => P.isCleared(m.id)).length} of ${sps.length} cleared` : "Finish this chapter to unlock " + sps.length + " twists"}</div></div>
          ${spOpen ? `<span class="mstat cur">${I.play}<span>Open</span></span>` : `<span class="mstat lock">${I.lock}<span>Locked</span></span>`}</button>` : "";
      return `${UI.backBtn()}<div class="banner small">ORDER CHALLENGE</div>
        <div class="chapter-bar"><button class="chev" data-act="prev" ${p.chapter <= 1 ? "disabled" : ""} aria-label="Previous chapter">\u2039</button>
          ${SS.Art.thumbHTML(ch.icon, 120)}<div class="ttl">Chapter ${ch.number}: ${esc(ch.title)}<small>${unlocked ? `${prog.done}/${prog.total} cleared \u00b7 with ${SS.DATA.narrator.name}` : "Locked: finish the previous chapter"}</small></div>
          <button class="chev" data-act="next" ${p.chapter >= SS.DATA.chapters.length ? "disabled" : ""} aria-label="Next chapter">\u203a</button></div>
        <div class="mission-list">${rows}${spBtn}</div>
        ${cur ? `<button class="btn play story-play wide" data-act="mission" data-arg="${cur.id}">PLAY</button>` : ""}`;
    },
    after(el, p) {
      const ch = SS.DATA.chapters[p.chapter - 1];
      if (SS.Progress.chapterUnlocked(ch.id) && !D().story_seen["intro_" + ch.id]) { D().story_seen["intro_" + ch.id] = true; SS.Save.save(); SS.Screens.storyCard(ch, "intro"); }
    },
    on(act, arg) {
      const p = UI.params;
      if (act === "back") UI.show("mode");
      if (act === "prev") { p.chapter = Math.max(1, p.chapter - 1); UI.refresh(); }
      if (act === "next") { p.chapter = Math.min(SS.DATA.chapters.length, p.chapter + 1); UI.refresh(); }
      if (act === "specials") {
        const ch = SS.DATA.chapters[p.chapter - 1];
        if (D().chapters_completed.indexOf(ch.id) < 0) return UI.modal(`<h2>LOCKED</h2><p>Finish Chapter ${ch.number} to open its Special Orders.</p><div class="btns"><button class="btn sm blue" data-act="close">OK</button></div>`);
        return UI.show("specials", { chapter: p.chapter });
      }
      if (act === "mission") {
        const m = SS.DATA.mission_by_id[arg];
        if (!SS.Progress.isMissionUnlocked(m)) return UI.modal(`<h2>LOCKED</h2><p>${SS.Progress.chapterUnlocked(m.chapter_id) ? "Clear the previous mission first." : "Finish the previous chapter to open this one."}</p><div class="btns"><button class="btn sm blue" data-act="close">OK</button></div>`);
        // midpoint micro-choice before mission 4 (Story Bible \u00a77)
        const choice = SS.DATA.story_choices[m.chapter_id];
        if (m.number === 4 && choice && !D().story_choices[m.chapter_id]) return SS.Screens.storyChoice(m, () => UI.show("mission", { id: m.id }));
        UI.show("mission", { id: m.id });
      }
    }
  });

  // ---------------- Special Orders (one chapter per page, no scrolling) ----------------
  UI.register("specials", {
    cls: "bg-truck",
    render(p) {
      const P = SS.Progress, done = D().chapters_completed;
      const open = SS.DATA.chapters.filter(c => done.indexOf(c.id) >= 0).map(c => c.number);
      if (!p.chapter || open.indexOf(p.chapter) < 0) p.chapter = open.length ? open[open.length - 1] : 1;
      const ch = SS.DATA.chapters[p.chapter - 1], k = open.indexOf(p.chapter);
      const sps = SS.DATA.specials.filter(m => m.chapter === ch.number), cleared = sps.filter(m => P.isCleared(m.id)).length;
      const tiles = sps.map(m => {
        const st = P.missionState(m.id), stars = ["normal", "hard", "extreme"].filter(x => st.cleared[x]).length, rid = SS.DATA.order_pools[m.order_pool_id][0];
        return `<button class="sptile ${stars ? "done" : ""}" data-act="mission" data-arg="${m.id}" aria-label="${esc(m.title)}${stars ? ", cleared" : ""}">
          ${SS.Art.thumbHTML(rid, 96)}<span class="nm">${esc(m.title)}</span><span class="tw">${esc(SS.Screens.twistOf(m, true))}</span>
          <span class="st">${stars ? "\u2605".repeat(stars) + "\u2606".repeat(3 - stars) : "+" + m.rewards.coins + " coins"}</span></button>`;
      }).join("");
      return `${UI.backBtn()}<div class="banner small">SPECIAL ORDERS</div>
        <div class="gpager"><button class="gp" data-act="pg" data-arg="${k - 1}" ${k <= 0 ? "disabled" : ""} aria-label="Previous chapter">\u25C0</button>
          <div class="gname">Chapter ${ch.number}: ${esc(ch.title)}<small>${cleared} / ${sps.length} cleared \u00b7 ${SS.Progress.specialsCleared()} / ${SS.DATA.specials.length} total</small></div>
          <button class="gp" data-act="pg" data-arg="${k + 1}" ${k >= open.length - 1 ? "disabled" : ""} aria-label="Next chapter">\u25B6</button></div>
        <div class="spgrid">${tiles}</div>`;
    },
    on(act, arg) {
      const p = UI.params;
      if (act === "back") UI.show("story", { chapter: p.chapter });
      if (act === "pg") { const done = D().chapters_completed, open = SS.DATA.chapters.filter(c => done.indexOf(c.id) >= 0).map(c => c.number); if (open[+arg]) { p.chapter = open[+arg]; UI.refresh(); } }
      if (act === "mission") UI.show("mission", { id: arg });
    }
  });

  // ---------------- Mission briefing (Preview stage of discovery) ----------------
  UI.register("mission", {
    cls: "bg-truck",
    render(p) {
      const m = SS.DATA.mission_by_id[p.id], ch = SS.DATA.chapters[m.chapter - 1], cu = SS.DATA.customers[ch.customer];
      if (!p.diff) p.diff = "normal";
      const objs = SS.Campaign.objectivesFor(m, p.diff), st = SS.Progress.missionState(m.id);
      const pool = m.order_pool_id ? SS.DATA.order_pools[m.order_pool_id] : [m.recipe_id];
      const recipe = SS.DATA.recipe_by_id[pool[0]];
      const patch = SS.Campaign.choicePatch(m);
      const news = m.new_hazards.map(id => ({ id, d: SS.DATA.hazard_by_id[id], hz: true })).concat(m.new_bonuses.map(id => ({ id, d: SS.DATA.bonus_by_id[id], hz: false })));
      const time = Math.round(SS.Campaign.timeLimit(m) * SS.DATA.difficulty_profiles.find(x => x.id === p.diff).objective_scaling.time_mult);
      const diffs = SS.DATA.difficulty_profiles.map(d => { const ok = SS.Progress.difficultyUnlocked(d.id); return `<button data-act="diff" data-arg="${d.id}" data-d="${d.id}" class="${p.diff === d.id ? "on" : ""} ${ok ? "" : "locked"}" aria-pressed="${p.diff === d.id}">${d.display_name}${st.cleared[d.id] ? " \u2605" : ""}</button>`; }).join("");
      const dnote = { normal: "The story as intended. Generous timing and recovery.", hard: "Faster food, more decoys and hazards, tighter goals. \u00d71.35 Coins.", extreme: "Everything you've learned, at once. \u00d71.75 Coins." }[p.diff];
      return `${UI.backBtn()}
      <div class="brief">
        ${SS.Screens.chefLine(m.story_line)}
        <div class="panel">
          <div class="sub">Chapter ${m.chapter} \u00b7 ${m.special ? "Special Order" : "Mission " + m.number}</div>${m.special ? `<div class="twist">\u2605 ${esc(SS.Screens.twistOf(m))}</div>` : ""}
          <h2>${esc(m.title)}</h2>
          <div class="recipe-line" style="margin-top:18px">${SS.Art.thumbHTML(recipe.id, 200)}<div>
            <div style="font-family:var(--font-display);font-size:48px">${m.order_pool_id ? (m.special && m.groups.length === 1 ? esc(m.groups[0]) + ": " : m.special ? m.groups.length + " menus: " : "Mixed menu: ") + pool.length + " recipes" : esc(recipe.display_name)}</div>
            <div class="ing-strip">${recipe.ingredient_sequence.map(i => `${SS.Art.iconHTML(i, 74, `role="img" aria-label="${esc(SS.DATA.ingredient_by_id[i].display_name)}"`)}`).join("")}</div>
          </div></div>
        </div>
        <div class="panel"><ul class="goals">${objs.map(o => `<li><span class="box"></span>${esc(o.label)}</li>`).join("")}${patch && patch.bonus_objective ? `<li class="bonus"><span class="box"></span>${esc(patch.bonus_objective.label)} (+${patch.bonus_objective.coins})</li>` : ""}${patch && patch.note ? `<li class="bonus"><span class="box">!</span>${esc(patch.note)}</li>` : ""}</ul>
          <div class="meta-row" style="margin-top:18px"><span>\u23f1 ${U.fmtTime(time)}</span><span>${UI.coin()} ${m.rewards.coins}${st.first_clear ? " (claimed)" : ""}</span><span>XP ${m.rewards.xp}</span>${st.best_score ? `<span>Best ${U.fmt(st.best_score)}</span>` : ""}</div></div>
        ${news.length ? `<div class="panel"><div class="sub" style="margin-bottom:14px">NEW IN THIS MISSION</div><div class="newrow">${news.map(n => `<span class="newchip ${n.hz ? "hz" : "bn"}"><img alt="" src="${SS.Art.iconURL(n.id, 76)}">${esc(n.d.display_name)} <em>${n.hz ? "AVOID" : "CATCH"}</em></span>`).join("")}</div></div>` : ""}
        <div class="panel"><div class="diffsel" role="group" aria-label="Difficulty">${diffs}</div><div class="diffnote">${dnote}</div></div>
        <button class="btn play" data-act="start" style="align-self:center;width:640px;margin-top:10px">START</button>
      </div>`;
    },
    on(act, arg) {
      const p = UI.params, m = SS.DATA.mission_by_id[p.id];
      if (act === "back") UI.show(m.special ? "specials" : "story", { chapter: m.chapter });
      if (act === "diff") { if (!SS.Progress.difficultyUnlocked(arg)) return UI.modal(`<h2>LOCKED</h2><p>Finish Chapter 1 on any difficulty to unlock Extreme.</p><div class="btns"><button class="btn sm blue" data-act="close">OK</button></div>`); p.diff = arg; UI.refresh(); }
      if (act === "start") SS.Game.start({ mode: "story", mission: m, difficulty: p.diff, tutorial: !D().tutorial_done && m.id === "ch01_m01" });
    }
  });

  // ---------------- Collection ----------------
  UI.register("recipes", {
    cls: "bg-truck",
    render(p) {
      const tab = p.tab || "recipes", d = D();
      const tabs = [["recipes", "Recipes"], ["ingredients", "Food"], ["hazards", "Hazards"], ["bonuses", "Bonuses"]].map(([k, l]) => `<button class="${tab === k ? "on" : ""}" data-act="tab" data-arg="${k}">${l}</button>`).join("");
      let body = "";
      // Recipes and Food are paged by menu group (one chapter's worth per page) so each page fits the screen without scrolling.
      const G = SS.DATA.GROUP_ORDER, gi = ((p.g | 0) % G.length + G.length) % G.length, grp = G[gi];
      const pager = `<div class="gpager"><button class="gp" data-act="gpage" data-arg="${gi - 1}" aria-label="Previous group">${SS.Icons.arrow_left}</button><div class="gname">${esc(grp)}<small>${gi + 1} / ${G.length}</small></div><button class="gp" data-act="gpage" data-arg="${gi + 1}" aria-label="Next group">${SS.Icons.arrow_right}</button></div>`;
      if (tab === "recipes") {
        body = SS.DATA.recipes.filter(r => r.group === grp).map(r => { const un = d.recipes_unlocked.indexOf(r.id) >= 0; return `<button class="card ${un ? "" : "locked"}" data-act="recipe" data-arg="${r.id}">${SS.Art.thumbHTML(r.id, 170, 'class="th dthumb"')}<span class="nm">${un ? esc(r.display_name) : "???"}</span>${un && d.recipes_served[r.id] ? `<span class="ds">Served ${d.recipes_served[r.id]}</span>` : `<span class="ds">${un ? "New!" : "Chapter " + r.intro_chapter}</span>`}</button>`; }).join("");
        body = `<div class="grid g4">${body}</div>`;
      } else if (tab === "ingredients") {
        const known = {}; d.recipes_unlocked.forEach(r => SS.DATA.recipe_by_id[r].ingredient_sequence.forEach(i => known[i] = 1));
        const first = {}; SS.DATA.recipes.forEach(r => r.ingredient_sequence.forEach(i => { if (!first[i]) first[i] = r.group; }));
        const nm = i => i.display_name.replace(/\s*\((\d+\/\d+|half)\)$/i, ""), shown = {};
        body = SS.DATA.ingredients.filter(i => first[i.id] === grp && !shown[nm(i)] && (shown[nm(i)] = 1)).map(i => `<div class="card ${known[i.id] ? "" : "locked"}">${SS.Art.iconHTML(i.id, 110, 'class="th dicon"')}<span class="nm">${known[i.id] ? esc(nm(i)) : "???"}</span></div>`).join("");
        body = `<div class="grid g6">${body}</div>`;
      } else {
        const list = tab === "hazards" ? SS.DATA.hazards : SS.DATA.bonuses;
        body = list.map(h => { const k = d.discovered[h.id]; return `<button class="card ${k ? "" : "locked"}" data-act="obj" data-arg="${h.id}"><img class="th" alt="" src="${SS.Art.iconURL(h.id, 220)}"><span class="nm">${k ? esc(h.display_name) : "???"}</span><span class="ds">${k ? (tab === "hazards" ? "Avoid" : "Catch") : "Undiscovered"}</span></button>`; }).join("");
      }
      if (tab !== "recipes" && tab !== "ingredients") body = `<div class="grid">${body}</div>`;
      return `${UI.backBtn()}<div class="banner small">COLLECTION</div><div class="tabs" role="tablist">${tabs}</div>${tab === "recipes" || tab === "ingredients" ? pager : ""}<div class="scroll${tab === "recipes" || tab === "ingredients" ? " paged" : ""}">${body}</div>`;
    },
    on(act, arg) {
      if (act === "back") UI.show("home");
      if (act === "tab") { UI.params.tab = arg; UI.refresh(); }
      if (act === "gpage") { UI.params.g = +arg; UI.refresh(); }
      if (act === "recipe") {
        const r = SS.DATA.recipe_by_id[arg], un = D().recipes_unlocked.indexOf(arg) >= 0;
        if (un && D().recipes_viewed.indexOf(arg) < 0) { D().recipes_viewed.push(arg); SS.Save.bump("recipes_viewed", 1); SS.Save.save(); }
        const how = SS.DATA.missions.find(m => m.first_clear_recipes.indexOf(arg) >= 0);
        UI.modal(`<h2 class="yel" style="font-size:80px">${un ? esc(r.display_name) : "???"}</h2>
          <div style="display:grid;place-items:center">${SS.Art.thumbHTML(arg, 340, `style="${un ? "" : "filter:brightness(0) opacity(.25)"}"`)}</div>
          ${un ? `<p style="font-weight:700">Bottom to top</p><div class="ing-strip" style="justify-content:center">${r.ingredient_sequence.map(i => `${SS.Art.iconHTML(i, 74, `role="img" aria-label="${esc(SS.DATA.ingredient_by_id[i].display_name)}"`)}`).join("")}</div><p>${r.ingredient_sequence.length} layers \u00b7 ${esc(r.group)}${r.tags.indexOf("hot_food") >= 0 ? " \u00b7 served hot" : ""}${r.tags.indexOf("frozen") >= 0 ? " \u00b7 frozen" : ""}</p>` : `<p>Unlocks in Chapter ${r.intro_chapter}${how ? " (" + esc(how.title) + ")" : ""}.</p>`}
          <div class="btns"><button class="btn sm blue" data-act="close">CLOSE</button></div>`);
      }
      if (act === "obj") {
        const h = SS.DATA.hazard_by_id[arg] || SS.DATA.bonus_by_id[arg], k = D().discovered[arg], hz = !!SS.DATA.hazard_by_id[arg];
        UI.modal(`<div class="disc-art"><img alt="" src="${SS.Art.iconURL(arg, 250)}" style="${k ? "" : "filter:brightness(0) opacity(.25)"}"></div><span class="disc-tag ${hz ? "hz" : "bn"}">${hz ? "HAZARD" : "BONUS"}</span><h2 style="font-size:72px">${k ? esc(h.display_name) : "???"}</h2><p>${k ? esc(h.teach) : "Keep playing Story to discover this."}</p><div class="btns"><button class="btn sm blue" data-act="close">CLOSE</button></div>`);
      }
    }
  });

  // ---------------- Shop ----------------
  UI.register("shop", {
    cls: "bg-truck",
    render(p) {
      const tab = p.tab || "plates", d = D();
      const list = tab === "plates" ? SS.DATA.plates : SS.DATA.kitchens;
      const slot = tab === "plates" ? "plate" : "kitchen";
      const cards = list.map(it => {
        const owned = SS.Progress.owns(it.id), eq = d.cosmetics[slot] === it.id;
        const img = tab === "plates" ? SS.Art.plateURL(it.id) : SS.Art.kitchenURL(it.id, 220);
        let action;
        if (owned) action = eq ? `<span class="owned">Equipped</span>` : `<span class="btn xs blue" style="pointer-events:none">EQUIP</span>`;
        else if (it.grant_only) action = `<span class="ds">Story reward: Chapter ${parseInt(it.grant_only.slice(-2), 10)}</span>`;
        else if (it.price_coins === 0 && !it.price_tickets) action = `<span class="owned">Free · Equip</span>`;
        else action = `<span class="price">${it.price_tickets ? `<span class="ticket"></span>${it.price_tickets}` : `${UI.coin()}${U.fmt(it.price_coins)}`}</span>`;
        return `<button class="card ${tab === "kitchens" ? "kit" : ""}" data-act="item" data-arg="${it.id}">${eq ? `<span class="equipped">ON</span>` : ""}<img class="th" alt="" src="${img}" style="${tab === "plates" ? "object-fit:contain;height:120px;margin:50px 0" : ""}"><span class="nm">${esc(it.display_name)}</span>${action}</button>`;
      }).join("");
      return `${UI.topbar({})}${UI.backBtn()}<div class="banner small" style="margin-top:170px">SHOP</div>
        <div class="tabs"><button class="${tab === "plates" ? "on" : ""}" data-act="tab" data-arg="plates">Plates</button><button class="${tab === "kitchens" ? "on" : ""}" data-act="tab" data-arg="kitchens">Kitchens</button></div>
        <div class="scroll"><div class="grid">${cards}</div></div>
        <div class="foot-note">Cosmetic only. Nothing in the shop affects gameplay.</div>`;
    },
    on(act, arg) {
      if (act === "back") return UI.show("home");
      if (act === "tab") { UI.params.tab = arg; return UI.refresh(); }
      if (act === "item") {
        const it = SS.DATA.plates.find(x => x.id === arg) || SS.DATA.kitchens.find(x => x.id === arg);
        const slot = arg.startsWith("plate_") ? "plate" : "kitchen";
        if (SS.Progress.owns(arg)) { D().cosmetics[slot] = arg; SS.Save.bump("equips", 1); SS.Save.save(); SS.Audio.play("coin"); return UI.refresh(); }
        if (it.grant_only) return UI.modal(`<h2 style="font-size:72px">${esc(it.display_name)}</h2><p>${esc(it.description)}</p><p>Earned by finishing Story Chapter ${parseInt(it.grant_only.slice(-2), 10)}. It can't be bought.</p><div class="btns"><button class="btn sm blue" data-act="close">OK</button></div>`);
        if (it.price_coins === 0 && !it.price_tickets) { if (SS.Economy.buy(it)) { D().cosmetics[slot] = arg; SS.Save.save(); SS.Audio.play("coin"); UI.refresh(); } return; }
        const price = it.price_tickets ? `${it.price_tickets} Tickets` : `${U.fmt(it.price_coins)} Coins`;
        if (!SS.Economy.canAfford(it)) return UI.modal(`<h2 style="font-size:72px">${esc(it.display_name)}</h2><p>${esc(it.description)}</p><p>You need ${price}. ${it.price_tickets ? "Tickets come from chapter finales and achievements." : "Coins come from every run, missions and daily rewards."}</p><div class="btns"><button class="btn sm blue" data-act="close">OK</button></div>`);
        UI.confirm("BUY?", `${esc(it.display_name)} for ${price}?`, "BUY", "CANCEL", () => { if (SS.Economy.buy(it)) { D().cosmetics[slot] = arg; SS.Save.save(); SS.Audio.play("coin"); UI.refresh(); } });
      }
    }
  });

  // ---------------- Missions (daily / weekly / achievements) ----------------
  UI.register("missions", {
    cls: "bg-truck",
    render(p) {
      SS.Meta.ensureMissions(); const tab = p.tab || "daily", d = D();
      let rows = "";
      if (tab === "daily" || tab === "weekly") {
        const w = tab === "daily" ? d.daily : d.weekly;
        rows = w.missions.map((m, i) => { const pr = SS.Meta.missionProgress(m, w), done = pr >= m.target; return `<div class="mrow2 ${m.claimed ? "done" : ""}"><div class="t">${esc(m.label)}<small>${UI.coin()} ${m.coins} \u00b7 ${tab === "daily" ? 20 : 60} XP</small><div class="pbar"><i style="width:${Math.round(pr / m.target * 100)}%"></i><span>${U.fmt(pr)} / ${U.fmt(m.target)}</span></div></div>${m.claimed ? `<span class="owned">Claimed</span>` : `<button class="btn xs ${done ? "" : "white"}" data-act="claim" data-arg="${tab}:${i}" ${done ? "" : "disabled"}>${done ? "CLAIM" : "\u2026"}</button>`}</div>`; }).join("");
        if (tab === "daily") rows += `<div style="text-align:center;margin-top:20px"><button class="btn xs white" data-act="reroll" ${d.daily.rerolls >= 1 ? "disabled" : ""}>${d.daily.rerolls >= 1 ? "Reroll used today" : "Free reroll"}</button></div>`;
      } else {
        const list = SS.DATA.achievements.slice().sort((a, b) => { const ca = d.achievements_claimed[a.id] ? 2 : SS.Meta.achievementProgress(a) >= a.target ? 0 : 1, cb = d.achievements_claimed[b.id] ? 2 : SS.Meta.achievementProgress(b) >= b.target ? 0 : 1; return ca - cb; });
        rows = list.map(a => { const pr = SS.Meta.achievementProgress(a), done = pr >= a.target, cl = d.achievements_claimed[a.id]; return `<div class="mrow2 ${cl ? "done" : ""}"><div class="t">${esc(a.name)}<small>${esc(a.desc)} \u00b7 ${UI.coin()} ${a.coins}${a.tickets ? ` + ${a.tickets} Tickets` : ""}</small><div class="pbar"><i style="width:${Math.round(pr / a.target * 100)}%"></i><span>${U.fmt(pr)} / ${U.fmt(a.target)}</span></div></div>${cl ? `<span class="owned">Done</span>` : `<button class="btn xs ${done ? "" : "white"}" data-act="ach" data-arg="${a.id}" ${done ? "" : "disabled"}>${done ? "CLAIM" : "\u2026"}</button>`}</div>`; }).join("");
      }
      return `${UI.topbar({})}${UI.backBtn()}<div class="banner small" style="margin-top:170px">MISSIONS</div>
        <div class="tabs">${[["daily", "Daily"], ["weekly", "Weekly"], ["achievements", "Trophies"]].map(([k, l]) => `<button class="${tab === k ? "on" : ""}" data-act="tab" data-arg="${k}">${l}</button>`).join("")}</div>
        <div class="scroll"><div class="mlist">${rows}</div></div>`;
    },
    on(act, arg) {
      if (act === "back") return UI.show("home");
      if (act === "tab") { UI.params.tab = arg; return UI.refresh(); }
      if (act === "reroll") { SS.Meta.rerollDaily(); return UI.refresh(); }
      if (act === "claim") { const [k, i] = arg.split(":"); const r = SS.Meta.claimMission(k, +i); if (r) { SS.Audio.play("coin"); SS.Screens.levelUps(r.levelUps); } return UI.refresh(); }
      if (act === "ach") { const a = SS.DATA.achievements.find(x => x.id === arg); if (SS.Meta.claimAchievement(a)) SS.Audio.play("coin"); return UI.refresh(); }
    }
  });

  // ---------------- Settings ----------------
  UI.register("settings", {
    cls: "bg-truck",
    render() {
      const s = D().settings;
      const tg = (k, label, sub) => `<div class="set-row"><div>${label}${sub ? `<small>${sub}</small>` : ""}</div><button class="toggle ${s[k] ? "on" : ""}" data-act="tog" data-arg="${k}" role="switch" aria-checked="${!!s[k]}" aria-label="${esc(label.replace(/<[^>]*>/g, '').trim())}"></button></div>`;
      return `${UI.backBtn()}<div class="banner small">SETTINGS</div>
        <div class="scroll"><div class="mlist">
          ${tg("music", SS.Icons.music + " Music")}${tg("sfx", (s.sfx ? SS.Icons.sound_on : SS.Icons.sound_off) + " Sound effects")}${tg("haptics", "Vibration", "On phones that support it")}
          <div class="set-row"><div>Plate control<small>${s.control === "drag" ? "Drag anywhere: the plate moves with your finger" : "Direct: the plate jumps under your finger"}</small></div><div class="seg"><button class="${s.control === "drag" ? "on" : ""}" data-act="ctl" data-arg="drag">Drag</button><button class="${s.control === "direct" ? "on" : ""}" data-act="ctl" data-arg="direct">Direct</button></div></div>
          ${tg("assist", "Assist mode", "Food falls 15% slower and the Perfect zone is wider. Off in the Daily Challenge.")}
          ${tg("show_guides", "Drop guide", "Dashed line under the next ingredient")}
          ${tg("reduced_motion", "Reduce motion", "Less shaking and fewer particles")}
          ${tg("debug", "Debug overlay", "Predicted paths, reach range, live numbers")}
          <div class="set-row"><div>${SS.Icons.help} How to play</div><button class="btn xs blue" data-act="howto">OPEN</button></div>
          <div class="set-row"><div>${SS.Icons.fullscreen} Fullscreen</div><button class="btn xs blue" data-act="fullscreen">${document.fullscreenElement ? "EXIT" : "OPEN"}</button></div>
          <div class="set-row"><div>Reset progress<small>Erases this browser's save</small></div><button class="btn xs red" data-act="reset">RESET</button></div>
          <div class="set-row" style="font-size:32px;font-weight:600"><div>Snack Stack browser build v2.0<small>Save schema v${D().schema_version}${SS.Save.memoryOnly ? " \u00b7 storage unavailable: progress lasts this session only" : ""}</small></div></div>
        </div></div>`;
    },
    on(act, arg) {
      const s = D().settings;
      if (act === "back") return UI.show(UI.params.from || "home");
      if (act === "tog") { s[arg] = !s[arg]; if (arg === "music") { s.music ? SS.Audio.startMusic() : SS.Audio.stopMusic(); } if (arg === "debug") SS.Debug.overlay = s.debug; if (arg === "reduced_motion") document.body.classList.toggle("rm", s.reduced_motion); SS.Save.save(); return UI.refresh(); }
      if (act === "ctl") { s.control = arg; SS.Save.save(); return UI.refresh(); }
      if (act === "howto") return SS.Screens.howTo();
      if (act === "fullscreen") {
        const operation = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
        Promise.resolve(operation).then(() => UI.refresh()).catch(() => UI.modal(`<h2>FULLSCREEN</h2><p>Your browser is keeping the game in this window.</p><div class="btns"><button class="btn sm" data-act="close">OK</button></div>`));
        return;
      }
      if (act === "reset") return UI.confirm("RESET?", "All progress, coins and cosmetics in this browser will be erased.", "ERASE", "KEEP", () => { SS.Save.reset(); UI._dailyShown = false; UI.show("home"); });
    }
  });

  // ---------------- shared popups ----------------
  SS.Screens = {
    howTo(done) {
      const ov = UI.modal(`<h2 class="yel" style="font-size:80px">HOW TO PLAY</h2>
        <ol class="howto" style="margin:0;padding-left:50px">
          <li><b>Drag</b> left and right anywhere to move the plate.</li>
          <li>Catch ingredients in the order on the ticket, <b>bottom to top</b>. The next one glows.</li>
          <li>Food drifts and weaves as it falls. Get under it.</li>
          <li><b>Tap</b> a falling ingredient to <b>Quick Drop</b> it. It speeds down but doesn't steer, so line up first.</li>
          <li>Center each layer on the stack for <b>Perfect</b>. Sloppy layers make the stack wobble and can topple.</li>
          <li>Let wrong food fall past. <b>Avoid</b> anything with a red warning sign. <b>Catch</b> sparkly bonuses.</li>
        </ol>
        <p style="font-size:34px">Keyboard: \u2190 \u2192 move, Space quick-drops, P pauses.</p>
        <div class="btns"><button class="btn sm" data-act="close">GOT IT</button></div>`, act => { UI.close(ov); done && done(); });
    },
    dailyReward() {
      const r = D().daily_reward, rec = SS.DATA.daily_rewards[(r.next_day - 1) % 7];
      const days = SS.DATA.daily_rewards.map(x => `<div style="flex:1;text-align:center;padding:10px 4px;border:5px solid var(--ink);border-radius:18px;background:${x.day === rec.day ? "var(--yellow)" : x.day < rec.day ? "#d3f9d8" : "#fff"};font-weight:700;font-size:28px">Day ${x.day}<br><span style="font-family:var(--font-display);font-size:34px">${x.coins}</span></div>`).join("");
      const ov = UI.modal(`<h2 class="yel">DAILY REWARD</h2><div style="display:flex;gap:8px">${days}</div><p>Day ${rec.day}: <b>${rec.coins} Coins</b>${rec.xp ? ` + ${rec.xp} XP` : ""}</p>
        <div class="btns"><button class="btn sm" data-act="claim">CLAIM</button><button class="btn xs purple" data-act="double">WATCH AD: DOUBLE (DEMO)</button></div><p style="font-size:30px;color:var(--ink-soft)">Missing a day never resets your progress.</p>`,
        act => { const res = SS.Meta.claimDailyReward(act === "double"); UI.close(ov); if (res) { SS.Audio.play("coin"); SS.Screens.levelUps(res.levelUps); if (UI.current === "home") UI.refresh(); } });
    },
    levelUps(ups) {
      (ups || []).forEach(L => UI.enqueue(done => { SS.Audio.play("levelup"); const ov = UI.modal(`<h2 class="yel">LEVEL ${L.level}!</h2><p>You reached level ${L.level}.</p><div class="reward-row"><span>${UI.coin()} +${L.coins}</span></div>${L.badge ? `<p>New badge: Level ${L.level}</p>` : ""}<div class="btns"><button class="btn sm" data-act="ok">NICE</button></div>`, () => { UI.close(ov); done(); }); }));
    },
    // Chef Pepper narrates: chef pose pops up from the top of a speech bubble. lines: ["pose|text", ...]
    chefLine(line) { const [pose, text] = SS.Screens.splitLine(line); return `<div class="chefsay"><img class="chefpop" alt="" src="assets/icons/chef_${pose}.png"><div class="sayb"><b>${esc(SS.DATA.narrator.name)}</b>${esc(text)}</div></div>`; },
    // one-line description of a Special Order's twist
    twistOf(m, short) {
      const r = m.rules || {}, out = [], H = SS.DATA.hazard_by_id, M = SS.DATA.modifiers;
      if (r.no_guides) out.push("No drop line");
      if (r.hazards_only) out.push("Only " + r.hazards_only.map(h => H[h].display_name).join(", ") + (r.hazard_mult >= 1.5 ? ", and lots of it" : ""));
      else if (r.hazard_mult >= 1.5) out.push("Double hazards");
      if (r.force_modifier) out.push({ "MOD-MYSTERY": "Mystery tickets", "MOD-SWAP": "A swap on every order", "MOD-RUSH": "Rush on every order", "MOD-SLIP": "Slippery stacks", "MOD-CLEAN": "No mistakes allowed", "MOD-EXTRA": "Extra of something on every order", "MOD-TALL": "Tall orders" }[r.force_modifier] || (M[r.force_modifier] && M[r.force_modifier].name));
      if (r.tier_bonus) out.push("Faster food");
      if (r.time_mult && r.time_mult < 1) out.push("Shorter clock");
      if (r.precision_mult && r.precision_mult < 1) out.push("Smaller Perfect window");
      if (m.groups.length > 1 && (!short || !out.length)) out.push(m.groups.length >= 12 ? "Every dish on the menu" : "Mixed menu: " + m.groups.join(" + "));
      const ob = m.objectives.find(o => ["quick_presses", "quick_drops", "stable_orders", "hazards_max", "collapses_max", "perfect_streak"].indexOf(o.type) >= 0);
      if (!out.length && ob) out.push(ob.label);
      return out.join(" \u00b7 ") || "Special challenge";
    },
    splitLine(line) { const k = String(line).indexOf("|"); return k > 0 ? [line.slice(0, k), line.slice(k + 1)] : ["calm", line]; },
    chefTalk(lines, done, opts) {
      opts = opts || {}; let i = 0;
      const ov = UI.modal("", null, { cls: "talk-ov" });
      const render = () => {
        const [pose, text] = SS.Screens.splitLine(lines[i]), last = i === lines.length - 1;
        ov.querySelector(".modal").innerHTML = `${opts.title ? `<div class="talk-kicker">${esc(opts.kicker || "")}</div><h2>${esc(opts.title)}</h2>` : ""}
          <div class="talk"><img class="chefpop big" alt="" src="assets/icons/chef_${pose}.png"><div class="sayb"><b>${esc(SS.DATA.narrator.name)}</b>${esc(text)}</div></div>
          ${opts.extra && last ? opts.extra : ""}
          <div class="talk-foot"><span class="dots">${lines.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</span><button class="btn sm ${last ? "" : "blue"}" data-act="next">${last ? (opts.done || "LET'S COOK") : "NEXT"}</button></div>`;
      };
      ov._handler = act => { if (act !== "next") return; if (i < lines.length - 1) { i++; render(); SS.Audio.play("click"); } else { UI.close(ov); done && done(); } };
      render(); return ov;
    },
    storyCard(ch, kind, done) {
      SS.Screens.chefTalk(kind === "intro" ? ch.intro : ch.outro, done, { kicker: "CHAPTER " + ch.number, title: ch.title, done: kind === "intro" ? "LET'S COOK" : "CONTINUE" });
    },
    storyChoice(m, done) {
      const c = SS.DATA.story_choices[m.chapter_id];
      const ov = UI.modal(`<h2 style="font-size:76px">YOUR CALL</h2>${SS.Screens.chefLine("thinking|" + c.prompt)}
        <div class="choice-btns"><button class="btn sm blue" data-act="a">${esc(c.a.label)}</button><button class="btn sm yellow" data-act="b">${esc(c.b.label)}</button></div><p style="font-size:32px;color:var(--ink-soft)">This only changes the next mission's twist. Nothing gets locked out.</p>`,
        act => { if (act !== "a" && act !== "b") return; D().story_choices[m.chapter_id] = act; SS.Save.save(); UI.close(ov); done && done(); });
    },
    modeIntro(mode) {
      const R = SS.DATA.mode_rules;
      let title, text, extra = "";
      if (mode === "classic") { title = "CLASSIC"; text = `Start with ${R.classic.start_time} seconds. Every finished order adds ${R.classic.order_time_bonus}s. Three mistakes and you're out. Food gets faster the longer you last.`; }
      if (mode === "survival") { title = "SURVIVAL"; text = `No timer. Three hearts. Waves get busier every few orders. Five clean orders in a row win a heart back.`; }
      if (mode === "daily") { const dc = SS.Meta.dailyChallenge(); title = "DAILY"; text = `<b>${esc(dc.preset.name)}</b>: ${esc(dc.preset.desc)}<br>Same rules and seed for everyone today.`; extra = dc.best ? `<p>Today's best: <b>${U.fmt(dc.best)}</b></p>` : `<p>First finish today: +150 Coins</p>`; }
      const ov = UI.modal(`<h2 class="yel">${title}</h2><p>${text}</p>${extra}
        <div class="diffsel" role="group" aria-label="Difficulty">${SS.DATA.difficulty_profiles.map(d => `<button data-act="d" data-arg="${d.id}" data-d="${d.id}" class="${d.id === "normal" ? "on" : ""} ${SS.Progress.difficultyUnlocked(d.id) ? "" : "locked"}">${d.display_name}</button>`).join("")}</div>
        <div class="btns row"><button class="btn sm white" data-act="cancel">BACK</button><button class="btn sm" data-act="go">START</button></div>`,
        (act, arg, el) => {
          if (act === "d") { if (!SS.Progress.difficultyUnlocked(arg)) return; ov.querySelectorAll(".diffsel button").forEach(b => b.classList.toggle("on", b === el)); ov._diff = arg; return; }
          UI.close(ov);
          if (act !== "go") return;
          const diff = ov._diff || "normal";
          if (mode === "daily") { const dc = SS.Meta.dailyChallenge(); SS.Game.start({ mode: "daily", preset: dc.preset, seed: dc.seed, difficulty: diff }); }
          else SS.Game.start({ mode, difficulty: diff, tutorial: !D().tutorial_done });
        });
    }
  };
})();
