// Snack Stack \u2014 gameplay screen: HUD, input routing, pause, discovery cards, serve/remake prompt, results.
// SS.Game owns the active GameSession + render loop. Godot port: GameplayScreen scene + HUD CanvasLayer.
window.SS = window.SS || {};
(function () {
  const UI = SS.UI, I = SS.Icons, U = SS.U, esc = SS.U.esc;
  const D = () => SS.Save.d;
  const ING = id => SS.DATA.ingredient_by_id[id];

  // ---------------- Game controller ----------------
  const TEACH_LINES = {
    nearfall: "worried|Whoa, the stack is wobbling! Land the next layer near the centre to save it.",
    collapse: "surprised|Oops, the top fell off! Re-catch those layers and keep going.",
    wrong: "thinking|That wasn't next on the ticket. Wrong catches cost a heart, so let them fall.",
    slip: "worried|Too far off-centre, it slid right off! Get under it before it lands.",
    miss: "thinking|We missed one! It'll come round again. Keep your eye on the glowing ingredient.",
    ruined: "worried|Yuck, that meal is ruined. We have to start this one over.",
    "hit_wrapper_trash": "thinking|Trash isn't food! Dodge the wrappers.",
    "hit_slime_blob": "surprised|Slime! On an empty plate it just makes it slippery. On food, it ruins the meal.",
    "hit_bug": "worried|A bug landed on it! Dodge them, they zig-zag.",
    "hit_grease_drop": "worried|Hot grease makes food messy, and melts ice cream!",
    "hit_ice_cube": "thinking|Ice made that meal cold. You can still serve it, for less.",
    "mod_MOD-NO": "thinking|A customer request! \"No\" means that layer is left out. The ticket already shows it.",
    "mod_MOD-EXTRA": "stars|\"Extra\" means a second layer of that ingredient. Follow the ticket!",
    "mod_MOD-SWAP": "thinking|A swap! They want a different ingredient. The ticket shows the new one.",
    "mod_MOD-SAUCE": "calm|They asked for a sauce. It's added to the ticket.",
    "mod_MOD-TOPPING": "stars|An extra topping! It goes on before the top.",
    "mod_MOD-TALL": "fists|A Tall Order: extra layers. Keep it balanced!",
    "mod_MOD-PERFECT": "calm|Perfect Finish: land the last layer PERFECT for a bonus.",
    "mod_MOD-RUSH": "fists|Rush order! Finish before the little timer runs out for a tip.",
    "mod_MOD-DOUBLE": "stars|Double means two patties. Heavier stacks, careful!",
    "mod_MOD-CLEAN": "calm|No Mistakes request: build it without a single slip for a bonus.",
    "mod_MOD-LIGHT": "thinking|Light means one less cheese or sauce. Check the ticket.",
    "mod_MOD-SLIP": "worried|Slippery Stack: sloppy layers wobble even more.",
    "mod_MOD-MYSTERY": "surprised|Mystery Request! You only see the next layer."
  };
  SS.Game = {
    TEACH: TEACH_LINES,
    s: null, opts: null, renderer: null, last: 0, hintTimer: null, toastTimer: null, countdown: 0, paused: false,

    start(opts) {
      this.stop();
      this.opts = Object.assign({}, opts);
      const o = Object.assign({}, opts);
      if (o.mode !== "daily") o.seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
      UI.show("game");
      const s = this.s = new SS.Session(o);
      SS.DishView.attach(s);
      this.paused = false; this.resultsOpen = false;
      s.on("sfx", id => SS.Audio.play(id));
      s.on("haptic", ms => SS.Audio.haptic(ms));
      s.on("order", () => HUD.order());
      s.on("hud", () => HUD.update());
      s.on("hint", t => HUD.hint(t));
      s.on("teach", k => this.teach(k));
      s.on("order", o => { (o.modifiers || []).forEach(m => this.teach("mod_" + m.family)); if (!D().recipes_served[o.recipe_id] && s.mode === "story") this.teach("recipe_" + o.recipe_id, "stars|New recipe: " + o.name + "! Check the ticket, every layer in order."); });
      s.on("toast", t => HUD.toast(t));
      s.on("discovery", e => this.discovery(e));
      s.on("serve_prompt", e => this.servePrompt(e));
      s.on("order_done", e => HUD.orderDone(e));
      s.on("end", r => setTimeout(() => this.results(r), 750));
      s.on("revive_offer", e => setTimeout(() => this.reviveOffer(e), 450));
      HUD.build();
      if (o.tutorial) {
        this.countdown = 1e9;
        SS.Screens.chefTalk([
          "wave|Welcome to your first shift! I'll show you how the kitchen works.",
          "calm|Your goal: build each order on the ticket at the top, from the BOTTOM layer up to the top.",
          "fists|Drag left and right anywhere on the screen to move the plate. Catch the next ingredient as it falls.",
          "thinking|Line each layer up with the stack. Centred layers score PERFECT; sloppy ones make the stack wobble.",
          "worried|Let wrong food fall past you. Catching it, or missing the one you need, costs a heart. Lose too many and the mission fails.",
          "stars|Finish the goals shown under the ticket before the timer runs out. Tap a falling ingredient to drop it faster. Ready?"
        ], () => { this.countdown = 1.2; HUD.banner(this.introText(), 1.5); }, { kicker: "HOW TO PLAY", title: "Kitchen Basics", done: "START!" });
      } else { this.countdown = 1.6; HUD.banner(this.introText(), 1.5); }
      if (s.assist) setTimeout(() => HUD.toast("Assist mode is on"), 1700);
    },
    introText() {
      const s = this.s;
      if (s.mode === "story") return s.mission.special ? "SPECIAL ORDER" : "MISSION " + s.mission.chapter + "-" + s.mission.number;
      return { classic: "CLASSIC", survival: "SURVIVAL", daily: "DAILY" }[s.mode] || "READY";
    },
    stop() { this.s = null; SS.DishView.detach(); UI.closeAll(); clearTimeout(this.hintTimer); clearTimeout(this.toastTimer); },
    retry() { const o = this.opts; this.start(o); },
    pause() {
      const s = this.s; if (!s || s.ended || this.paused) return;
      this.paused = true; s.pointerCancel(); s.keys.left = s.keys.right = false;
      const set = D().settings;
      const ov = UI.modal(`<div class="pause-heading">${I.pause}<h2>Paused</h2><button class="pause-close" data-act="resume" aria-label="Resume game">${I.close}</button></div>
        <p class="pause-order"><b>${esc(s.order.name)}</b>${s.mode === 'story' ? 'Mission ' + s.mission.chapter + '-' + s.mission.number : esc(this.introText())} &middot; Your order is waiting</p>
        ${s.mode === "story" ? `<ul class="goals">${s.objectiveStatus().map(x => `<li class="${x.met ? "met" : ""}"><span class="box">${x.met ? I.check : ""}</span>${esc(x.ob.label)} <b style="margin-left:auto">${fmtObj(x)}</b></li>`).join("")}</ul>` : ""}
        <div class="pause-actions">
          <button class="pause-action primary" data-act="resume">Resume game</button>
          <div class="pause-secondary"><button class="pause-action" data-act="restart">${I.refresh}Restart</button><button class="pause-action" data-act="howto">${I.help}How to play</button></div>
        </div>
        <div class="pause-audio"><button class="pause-action" data-act="sfx" aria-pressed="${!!set.sfx}">${set.sfx ? I.sound_on : I.sound_off}<span>Sound<small>${set.sfx ? 'On' : 'Off'}</small></span></button><button class="pause-action" data-act="music" aria-pressed="${!!set.music}">${I.music}<span>Music<small>${set.music ? 'On' : 'Off'}</small></span></button></div>
        <button class="pause-exit" data-act="quit">${s.mode === "story" ? "Leave mission" : "End run"}</button>`, act => {
          if (act === "resume") { UI.close(ov); this.paused = false; }
          if (act === "restart") { UI.close(ov); this.retry(); }
          if (act === "sfx" || act === "music") { set[act] = !set[act]; if (act === "music") set.music ? SS.Audio.startMusic() : SS.Audio.stopMusic(); SS.Save.save(); UI.close(ov); this.paused = false; this.pause(); }
          if (act === "howto") SS.Screens.howTo();
          if (act === "quit") {
            const msg = s.mode === "story" ? "This attempt won't count as a clear." : "Your score so far still counts.";
            UI.confirm(s.mode === "story" ? "LEAVE?" : "END RUN?", msg, s.mode === "story" ? "LEAVE" : "END", "STAY", () => { UI.close(ov); this.paused = false; if (s.mode === "story") { this.stop(); UI.show("story", { chapter: s.mission.chapter }); } else s.endVoluntary(); });
          }
        });
      ov.classList.add("pause-ov");
    },

    // Chef Pepper pops in once per new situation, in every chapter and mode.
    teach(key, line) {
      const T = SS.Game.TEACH, d = D(); d.taught = d.taught || {};
      if (d.taught[key]) return; const l = line || T[key]; if (!l) return;
      d.taught[key] = 1; SS.Save.save(); HUD.hint(l);
    },
    // Discovery card: First Encounter stage (Bible 13 \u00a7Preview -> First Encounter -> Reinforcement).
    discovery(e) {
      const hz = !!SS.DATA.hazard_by_id[e.id];
      const ov = UI.modal(`${SS.Screens.chefLine((hz ? "surprised|Watch out, something new!" : "stars|Ooh, a bonus!"))}<span class="disc-tag ${hz ? "hz" : "bn"}">NEW ${hz ? "HAZARD" : "BONUS"}</span>
        <div class="disc-art"><img alt="" src="${SS.Art.iconURL(e.id, 250)}"></div>
        <h2 style="font-size:78px">${esc(e.def.display_name)}</h2>
        <p>${esc(e.def.teach)}</p>
        <div class="disc-resp ${hz ? "hz" : "bn"}">${hz ? (e.def.kind === "event" ? "GET READY!" : "AVOID IT!") : "CATCH IT!"}</div>
        <div class="btns"><button class="btn sm ${hz ? "red" : ""}" data-act="ok">GOT IT</button></div>`,
        () => { UI.close(ov); if (this.s) this.s.ackDiscovery(); });
    },

    // Degraded but servable meal: player chooses Serve (reduced reward) or Remake (Bible 13 meal quality).
    servePrompt(e) {
      const m = e.meal;
      const ov = UI.modal(`<h2 style="font-size:84px">${esc(m.name.toUpperCase())} ${esc(e.order.name.toUpperCase())}</h2>
        <div style="display:grid;place-items:center">${SS.Art.thumbHTML(e.order, 300)}</div>
        <div class="mealq"><span class="meal-${m.id}">${esc(e.grade)} \u00b7 ${esc(m.name.toUpperCase())}</span></div>
        <p>Serve it as is for <b>${Math.round(m.reward_multiplier * 100)}%</b> of the order bonus, or toss it and remake from scratch.</p>
        <div class="btns row"><button class="btn sm blue" data-act="remake">REMAKE</button><button class="btn sm" data-act="serve">SERVE</button></div>`,
        act => { if (act !== "serve" && act !== "remake") return; UI.close(ov); if (this.s) this.s.resolveServe(act); });
    },

    // Opt-in revive: offered once per run after a normal loss. The player decides; the score is never changed.
    reviveOffer(e) {
      const s = this.s; if (!s || s.blocked !== "revive") return;
      const what = { hearts: "+1 heart", time: "+" + SS.Session.REVIVE.time_bonus + " seconds", mistakes: "1 mistake forgiven" }[e.reason];
      const head = { hearts: "OUT OF HEARTS", time: "TIME'S UP!", mistakes: "TOO MANY MISTAKES" }[e.reason];
      const ov = UI.modal(`<img class="res-chef" alt="" src="assets/icons/chef_thinking.png"><h2 class="yel">${head}</h2>
        <div class="result-sub">Keep going?</div>
        <div class="revive-gift"><img alt="" src="assets/icons/video.png">${what}</div>
        <p>Watch a short ad to continue this run. You can do this once per run, and your score stays exactly as it is.</p>
        <div class="btns"><button class="btn sm" data-act="watch">WATCH AD</button><button class="btn sm white" data-act="skip">NO THANKS</button></div>`,
        act => {
          if (act === "skip") { UI.close(ov); if (this.s === s) s.declineRevive(); }
          if (act === "watch") { UI.close(ov); this.playAd(() => { if (this.s !== s) return; s.revive(); HUD.update(); HUD.banner("BACK IN!", 1.1); setTimeout(() => s.resumeAfterRevive(), 1100); }); }
        });
      ov.classList.add("revive-ov");
    },
    // Prototype stand-in for a rewarded video. The Godot build calls the ad SDK here and only rewards on a completed view.
    playAd(done) {
      let n = 3;
      const ov = UI.modal(`<div class="ad-box"><div class="ad-tag">AD</div><div class="ad-n" id="ad-n">${n}</div><p>Rewarded video placeholder.<br>The real game plays a short ad here.</p></div>`, () => {});
      ov.classList.add("ad-ov");
      const tick = setInterval(() => { n--; const el = ov.querySelector("#ad-n"); if (el) el.textContent = n; if (n <= 0) { clearInterval(tick); UI.close(ov); done(); } }, 1000);
    },

    results(r) {
      if (!this.s || this.s.ended !== true) return;
      this.resultsOpen = true;
      const out = SS.Meta.applyRun(r);
      if (this.opts.tutorial || r.orders > 0) { D().tutorial_done = true; SS.Save.save(); }
      if (r.mode === "story") { D().fail_streak = r.success ? 0 : (D().fail_streak || 0) + (r.reason === "quit_voluntary" ? 0 : 1); SS.Save.save(); }
      const offerAssist = r.mode === "story" && !r.success && D().fail_streak >= 3 && !D().settings.assist;
      const story = r.mode === "story";
      let title, sub;
      if (story) { title = r.success ? "ORDER UP!" : "NOT QUITE"; sub = r.success ? esc(r.mission.title) : failReason(r); }
      else { title = r.reason === "time" ? "TIME'S UP!" : r.reason === "hearts" ? "OUT OF HEARTS" : "RUN OVER"; sub = { classic: "Classic", survival: "Survival", daily: "Daily: " + esc(r.preset ? r.preset.name : "") }[r.mode]; }
      const objs = story ? `<ul class="goals">${r.objectives.map(x => `<li class="${x.met ? "met" : ""}"><span class="box">${x.met ? I.check : ""}</span>${esc(x.ob.label)}<b style="margin-left:auto">${fmtObj(x)}</b></li>`).join("")}${r.bonus_objective ? `<li class="bonus ${r.bonus_objective.met ? "met" : ""}"><span class="box">${r.bonus_objective.met ? I.check : ""}</span>${esc(r.bonus_objective.ob.label)}</li>` : ""}</ul>` : "";
      const unlocks = [];
      out.recipes.forEach(id => unlocks.push(`<div class="unlock">${SS.Art.thumbHTML(id, 160)}${esc(SS.DATA.recipe_by_id[id].display_name)}<br><small>New recipe</small></div>`));
      if (out.chapterComplete) out.chapterComplete.cosmetics.forEach(id => { const it = SS.DATA.plates.find(x => x.id === id) || SS.DATA.kitchens.find(x => x.id === id); unlocks.push(`<div class="unlock"><img alt="" src="${id.startsWith("plate_") ? SS.Art.plateURL(id) : SS.Art.kitchenURL(id, 160)}" style="object-fit:contain">${esc(it ? it.display_name : id)}<br><small>Cosmetic</small></div>`); });
      const next = story && r.success && out.nextUnlocked;
      const chef = r.success || r.mode !== "story" ? (r.score > 0 ? "chef_celebrate" : "chef_worried") : "chef_worried";
      const ov = UI.modal(`<img class="res-chef" alt="" src="assets/icons/${chef}.png"><h2 class="${r.success ? "yel" : ""}">${title}</h2>
        <div class="result-sub">${sub}</div>
        ${story && r.success ? `<div style="text-align:center">${UI.starRow(out.stars)}</div>` : ""}
        <div class="result-score">${U.fmt(r.score)}</div>
        ${out.newBest ? `<div class="result-sub" style="color:var(--green-d)">NEW BEST!</div>` : ""}
        ${objs}
        <div class="kv"><span>Orders served</span><b>${r.orders}</b><span>Perfect drops</span><b>${r.perfects}</b><span>Best combo</span><b>${r.best_combo}</b><span>Flawless orders</span><b>${r.flawless}</b><span>Mistakes</span><b>${r.mistakes}</b>${r.revived ? `<span>Revive used</span><b>Yes</b>` : ""}${r.assist ? `<span>Assist mode</span><b>On</b>` : ""}</div>
        ${offerAssist ? `<div class="assist-offer">${SS.Screens.chefLine("calm|This one is tough! Assist mode slows the food a little and widens the Perfect zone. You can switch it off any time in Settings.")}<button class="btn xs blue" data-act="assist">TURN ON ASSIST</button></div>` : ""}
        <div class="reward-row"><span>${UI.coin()} +${U.fmt(out.coins)}</span><span>XP +${U.fmt(out.xp)}</span>${out.chapterComplete && out.chapterComplete.tickets ? `<span><span class="ticket"></span> +${out.chapterComplete.tickets}</span>` : ""}</div>
        ${unlocks.length ? `<div class="unlock-list">${unlocks.join("")}</div>` : ""}
        <div class="btns">${next ? `<button class="btn sm" data-act="next">NEXT MISSION</button>` : ""}
          <div class="btns row" style="width:100%;margin:0"><button class="btn sm ${next ? "white" : "blue"}" data-act="retry">${story && r.success ? "REPLAY" : "RETRY"}</button><button class="btn sm white" data-act="menu">${story ? "MISSIONS" : "MENU"}</button></div></div>`,
        act => {
          if (act === "assist") { D().settings.assist = true; SS.Save.save(); const b = ov.querySelector("[data-act=assist]"); if (b) { b.textContent = "ASSIST IS ON"; b.disabled = true; } return; }
          if (act !== "next" && act !== "retry" && act !== "menu") return;
          UI.close(ov);
          const leave = () => {
            if (act === "retry") return this.retry();
            this.stop();
            if (act === "next") return UI.show("mission", { id: out.nextUnlocked.id });
            if (story) UI.show("story", { chapter: out.chapterComplete && out.chapterComplete.nextChapter ? out.chapterComplete.nextChapter.number : r.mission.chapter });
            else UI.show("mode");
          };
          if (out.chapterComplete) SS.Screens.storyCard(out.chapterComplete.chapter, "outro", leave); else leave();
        });
      ov.classList.add("results-ov");
      SS.Screens.levelUps(out.levelUps);
    }
  };

  function fmtObj(x) {
    const t = x.ob.type;
    if (t === "mistakes_max") return x.value + "/" + x.ob.target;
    if (t === "time_remaining_min") return U.fmtTime(x.value);
    return U.fmt(Math.min(x.value, x.ob.target)) + "/" + U.fmt(x.ob.target);
  }
  function failReason(r) {
    return { time: "Out of time", time_goal: "Not enough time left over", mistakes: "Too many mistakes", limit: "Went over a mission limit", quit_voluntary: "Left the mission" }[r.reason] || "Objectives not met";
  }

  // ---------------- HUD ----------------
  const HUD = SS.HUD = {
    el: null,
    build() {
      const el = this.el = document.getElementById("scr-game");
      el.innerHTML = `<div class="hud-top">
          <button class="hbox pause" data-act="pause" aria-label="Pause">${I.pause}</button>
          <div class="hbox timer" id="h-timer"></div>
          <div class="hbox combo" id="h-combo"><span class="v">x1</span><span class="k">COMBO</span></div>
          <div class="hbox score"><span class="k">Score</span><span class="v" id="h-score">0</span></div>
          <div class="hbox mist" id="h-mist"></div>
        </div>
        <div class="ticket-wrap" id="h-ticket"></div>
        <div class="goalbar" id="h-goals"></div>
        <div class="stab" aria-hidden="true"><i id="h-stab"></i></div><div class="stab-label">STACK</div>
        <div class="status-row" id="h-status"></div>
        <div id="h-hint"></div><div id="h-toast"></div><div id="h-banner" class="gbanner" hidden></div>`;
      this.order(); this.update();
    },
    order() {
      const s = SS.Game.s; if (!s || !this.el) return;
      const o = s.order, el = document.getElementById("h-ticket"); if (!el) return;
      const mods = o.modifiers.map(m => `<span class="mod" style="background:${(SS.DATA.modifiers[m.family] || {}).color || "#845ef7"}">${esc(m.label)}</span>`).join("");
      el.innerHTML = `<div class="oticket"><div class="row1"><span class="rname">${esc(o.name)}</span><span class="onum">#${o.number}</span>${o.flags.rush ? `<span class="onum" id="h-rush"></span>` : ""}<div class="mods">${mods}</div></div>
        <div class="chips" id="h-chips"></div></div>`;
      this.chips();
    },
    chips() {
      const s = SS.Game.s, el = document.getElementById("h-chips"); if (!s || !el) return;
      const o = s.order, idx = s.orderIdx;
      let h = `<span class="dir">BOTTOM</span>`;
      o.seq.forEach((id, i) => {
        const hidden = o.flags.mystery && i > idx + 1;
        const cls = i < idx ? "done" : i === idx ? "next" : "";
        h += hidden ? `<span class="chip mystery" aria-label="Hidden ingredient"><span>?</span></span>` : `<span class="chip ${cls}" title="${esc(ING(id).display_name)}">${SS.Art.iconHTML(id, 72, `role="img" aria-label="${esc(ING(id).display_name)}"`)}</span>`;
      });
      el.innerHTML = h;
      el.setAttribute("aria-label", "Next: " + s.ingName(s.requiredId));
    },
    update() {
      const s = SS.Game.s; if (!s || !this.el) return;
      this.chips();
      const sc = s.score;
      const cb = document.getElementById("h-combo"); cb.classList.toggle("hot", sc.mult > 1); cb.querySelector(".v").textContent = "x" + (sc.mult % 1 ? sc.mult.toFixed(2).replace(/0$/, "") : sc.mult); cb.querySelector(".v").style.fontSize = (sc.mult % 1 ? 50 : 64) + "px";
      const hs_ = document.getElementById("h-score"), st_ = U.fmt(sc.score); hs_.textContent = st_; hs_.style.fontSize = (st_.length > 9 ? 40 : st_.length > 7 ? 48 : 60) + "px";
      // right box: hearts (classic/survival/daily), mistakes vs limit (story), else orders
      const mb = document.getElementById("h-mist");
      if (s.hearts !== null && s.mode !== "story") {
        const max = s.mode === "daily" ? (s.preset.hearts || 3) : SS.DATA.mode_rules[s.mode].hearts;
        let hs = ""; for (let i = 0; i < Math.max(max, s.hearts); i++) hs += i < s.hearts ? I.heartOn : I.heartOff;
        mb.innerHTML = `<span class="k">Mistakes</span><span class="row">${I.mistake}<span class="v">${max - s.hearts}/${max}</span></span><span class="hearts">${hs}</span>`;
      } else if (s.mode === "story") {
        const mm = s.objectives.find(x => x.type === "mistakes_max");
        if (mm) { const lives = mm.target + 1, left = Math.max(0, lives - s.mistakes); let hs = ""; for (let i = 0; i < Math.min(lives, 4); i++) hs += i < left ? I.heartOn : I.heartOff; mb.innerHTML = `<span class="k">Hearts</span><span class="hearts big">${lives > 4 ? `<span class="v">${left}</span>${I.heartOn}` : hs}</span>`; }
        else mb.innerHTML = `<span class="k">Orders</span><span class="v">${s.ordersCompleted}</span>`;
      } else mb.innerHTML = `<span class="k">Orders</span><span class="v">${s.ordersCompleted}</span>`;
      // story goal pills
      const g = document.getElementById("h-goals");
      if (s.mode === "story") {
        g.innerHTML = s.objectiveStatus().filter(x => x.ob.type !== "mistakes_max").map(x => `<span class="gpill ${x.met ? "met" : ""}"><span class="box">${x.met ? I.check : ""}</span>${goalShort(x)}</span>`).join("");
      } else if (s.mode === "survival") g.innerHTML = `<span class="gpill">Wave ${s.tier - s.baseTier + 1}</span>`;
      else g.innerHTML = "";
      this.frame();
    },
    // per-frame cheap updates
    frame() {
      const s = SS.Game.s; if (!s || !this.el) return;
      const tm = document.getElementById("h-timer");
      if (s.timed) {
        const low = s.timeLeft <= 10;
        const txt = U.fmtTime(s.timeLeft);
        if (tm._t !== txt || tm._low !== low) { tm._t = txt; tm._low = low; tm.className = "hbox timer" + (low ? " low" : ""); tm.innerHTML = `${I.clock}<span class="v">${txt}</span>`; }
      } else if (tm._t !== "\u221e") { tm._t = "\u221e"; tm.className = "hbox timer"; tm.innerHTML = `<span class="k" style="font-size:34px">ORDER</span><span class="v" style="font-size:60px">${s.orderNumber}</span>`; }
      else if (tm._n !== s.orderNumber) { tm._n = s.orderNumber; tm.querySelector(".v").textContent = s.orderNumber; }
      const st = s.stack, B = SS.DATA.balance.stability, bar = document.getElementById("h-stab");
      const v = Math.round(st.stability);
      if (bar._v !== v) { bar._v = v; bar.style.height = v + "%"; bar.style.background = v <= B.critical_threshold ? "#f0473e" : v < B.danger_threshold ? "#ff6b6b" : v < B.wobbly_threshold ? "#ff922b" : v < B.uneasy_threshold ? "#ffd43b" : "#45c449"; }
      const rush = document.getElementById("h-rush");
      if (rush) { const left = Math.max(0, s.order.rush_limit - s.orderTime); rush.textContent = left > 0 ? "\u23f1 " + Math.ceil(left) + "s" : "late"; rush.style.color = left > 0 ? "var(--red)" : "var(--muted)"; }
      // status chips: meal state, near fall, buffs, active events
      const parts = [];
      if (s.meal !== "fresh") { const m = SS.DATA.meal_quality_states.find(x => x.id === s.meal); parts.push(`<span class="schip meal-${m.id}">${esc(m.name.toUpperCase())}</span>`); }
      if (s.nearFall) parts.push(`<span class="schip nf">SAVE IT! ${s.nearFall.t.toFixed(1)}s</span>`);
      const bf = (id, t, max) => { const d = SS.DATA.bonus_by_id[id]; parts.push(`<span class="schip"><img alt="" src="${SS.Art.iconURL(id, 56)}">${esc(d.display_name)}${max ? `<span class="bar"><i style="width:${Math.round(t / max * 100)}%"></i></span>` : ""}</span>`); };
      if (s.buffs.slow > 0) bf("slow_time", s.buffs.slow, SS.DATA.bonus_by_id.slow_time.duration);
      if (s.buffs.wide > 0) bf("wide_catch", s.buffs.wide, SS.DATA.bonus_by_id.wide_catch.duration);
      if (s.buffs.hazardShield > 0) bf("hazard_shield");
      if (s.buffs.comboShield > 0) bf("combo_shield");
      for (const k in s.events) { const e = s.events[k]; if (e && e.def.display_name) parts.push(`<span class="schip" style="background:#ffe3e3">${e.phase === "telegraph" ? "\u26a0 " : ""}${esc(e.def.display_name)}</span>`); }
      const html = parts.join("");
      const sr = document.getElementById("h-status"); if (sr._h !== html) { sr._h = html; sr.innerHTML = html; }
    },
    hint(text) {
      const el = document.getElementById("h-hint"); if (!el) return;
      const [pose, msg] = SS.Screens.splitLine(text);
      el.innerHTML = `<div class="hint chefhint"><img alt="" src="${SS.assetURL('assets/icons/chef_'+pose+'.png')}"><span>${esc(msg)}</span></div>`;
      clearTimeout(SS.Game.hintTimer); SS.Game.hintTimer = setTimeout(() => { el.innerHTML = ""; }, 4800);
    },
    toast(t) {
      const el = document.getElementById("h-toast"); if (!el) return;
      el.innerHTML = `<div class="toast ${t.kind}"><img alt="" src="${SS.Art.iconURL(t.id, 80)}">${esc(t.text)}</div>`;
      clearTimeout(SS.Game.toastTimer); SS.Game.toastTimer = setTimeout(() => { el.innerHTML = ""; }, 2400);
    },
    banner(text, secs) {
      const el = document.getElementById("h-banner"); if (!el) return;
      el.textContent = text; el.hidden = false; el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
      clearTimeout(this._bt); this._bt = setTimeout(() => { el.hidden = true; }, secs * 1000);
    },
    orderDone(e) {
      const color = { FLAWLESS: "#ffd43b", CLEAN: "#69db7c", SOLID: "#74c0fc", ROUGH: "#ffa94d", SLOPPY: "#ff8787" }[e.res.label] || "#fff";
      const s = SS.Game.s;
      s.popup(540, 760, e.res.label + (e.meal !== "fresh" ? " \u00b7 " + e.meal.toUpperCase() : ""), color, 1.5, 1.4);
      s.popup(540, 840, "ORDER +" + U.fmt(e.res.bonus), "#ffffff", 0.9, 1.3);
      e.notes.forEach((n, i) => s.popup(540, 910 + i * 60, n, "#ffe066", 0.75, 1.4));
    }
  };
  function goalShort(x) {
    const t = x.ob.type, v = fmtObj(x);
    const name = { complete_orders: "Orders", perfect_drops: "Perfects", combo_reach: "Combo", score_min: "Score", time_remaining_min: "Time left \u2265", flawless_orders: "Flawless", perfect_streak: "Perfect streak" }[t] || t;
    if (t === "time_remaining_min") return `${name} ${U.fmtTime(x.ob.target)}`;
    return `${name} ${v}`;
  }

  UI.register("game", {
    cls: "",
    render() { return ""; },
    on(act) { if (act === "pause") SS.Game.pause(); },
    leave() { }
  });

  // ---------------- loop ----------------
  // Cafe scenes sit behind menus and results; pausing keeps the gameplay scene visible.
  const SCENE_OF = { home: "anchor", mode: "level", story: "level", specials: "level", mission: "level", shop: "shop", recipes: "shop", settings: "settings", missions: "results" };
  let overScene = null;
  function setOverScene(k) {
    if (k === overScene) return; overScene = k;
    ["game", "gamefx", "dishsvg"].forEach(id => { const el = document.getElementById(id); if (el) el.style.visibility = k ? "hidden" : ""; });
    document.getElementById("menubg").style.visibility = k ? "visible" : "hidden";
  }
  function loop(now) {
    const dt = SS.Game.last ? Math.min(0.1, (now - SS.Game.last) / 1000) : 0;
    SS.Game.last = now;
    const g = SS.Game, s = g.s;
    if (UI.current && UI.current !== "game") { g.menuT = (g.menuT || 0) + (SS.Save.d.settings.reduced_motion ? 0 : dt); const mc = g.menuCtx || (g.menuCtx = document.getElementById("menubg").getContext("2d")); SS.BG.draw(mc, UI.current === "splash" ? "loading" : (SCENE_OF[UI.current] || "anchor"), g.menuT, { pan: UI.current === "splash" }); }
    if (UI.current === "game") {
      const k = SS.Game.resultsOpen ? "results" : null;
      setOverScene(k);
      if (k) { const mc = g.menuCtx || (g.menuCtx = document.getElementById("menubg").getContext("2d")); SS.BG.draw(mc, k, g.menuT || 0); }
    } else if (overScene) { ["gamefx", "dishsvg"].forEach(id => { const el = document.getElementById(id); if (el) el.style.visibility = ""; }); overScene = null; SS.Game.resultsOpen = false; }
    if (s && UI.current === "game") {
      if (g.countdown > 0 && !g.paused) { g.countdown -= dt; if (g.countdown <= 0) s.start(); }
      if (!g.paused && s.state === "playing") s.update(dt);
      const frozen = g.paused || s.blocked || s.state !== "playing";
      g.renderer.draw(s, frozen ? 0 : dt);
      SS.DishView.update(s, frozen ? 0 : dt);
      HUD.frame();
    }
    requestAnimationFrame(loop);
  }

  // ---------------- input ----------------
  function toDesign(e) {
    const r = document.getElementById("game").getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * 1080, y: (e.clientY - r.top) / r.height * 1920 };
  }
  function playable(e) {
    const s = SS.Game.s;
    if (!s || UI.current !== "game" || SS.Game.paused || UI.root.querySelector(".overlay")) return false;
    if (e && e.target && e.target.closest && e.target.closest("button, .overlay")) return false;
    return true;
  }
  SS.Game.initInput = function () {
    const stage = document.getElementById("stage");
    const active = {};
    stage.addEventListener("pointerdown", e => {
      if (!playable(e)) return;
      const p = toDesign(e); active[e.pointerId] = true;
      try { stage.setPointerCapture(e.pointerId); } catch (_) { }
      SS.Game.s.pointerDown(p.x, p.y, e.pointerId, performance.now());
      e.preventDefault();
    });
    stage.addEventListener("pointermove", e => { if (!active[e.pointerId] || !SS.Game.s) return; const p = toDesign(e); SS.Game.s.pointerMove(p.x, p.y, e.pointerId); });
    const up = e => { if (!active[e.pointerId]) return; delete active[e.pointerId]; if (!SS.Game.s) return; const p = toDesign(e); if (e.type === "pointercancel") SS.Game.s.pointerCancel(); else SS.Game.s.pointerUp(p.x, p.y, e.pointerId, performance.now()); };
    stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
    const keymap = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
    window.addEventListener("keydown", e => {
      const s = SS.Game.s; if (!s || UI.current !== "game") return;
      if (e.code === "KeyP" || e.code === "Escape") { if (!SS.Game.paused && !UI.root.querySelector(".overlay")) { SS.Game.pause(); e.preventDefault(); } return; }
      if (!playable()) return;
      if (keymap[e.code]) { s.keys[keymap[e.code]] = true; e.preventDefault(); }
      if (e.code === "Space") { if (!e.repeat) s.quickDropNearest(); e.preventDefault(); }
    });
    window.addEventListener("keyup", e => { const s = SS.Game.s; if (s && keymap[e.code]) s.keys[keymap[e.code]] = false; });
    // auto-pause when the tab is hidden or the window loses focus
    const away = () => { const s = SS.Game.s; if (s && UI.current === "game" && s.state === "playing" && !UI.root.querySelector(".overlay")) SS.Game.pause(); };
    document.addEventListener("visibilitychange", () => { if (document.hidden) away(); });
    window.addEventListener("blur", away);
  };
  SS.Game.initLoop = function () { const c = document.getElementById("game"); this.renderer = new SS.Renderer(c, document.getElementById("gamefx")); SS.DishView.mount(document.getElementById("stage"), c); requestAnimationFrame(loop); };
})();
