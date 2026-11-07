// Snack Stack \u2014 UI framework: screen router, modal helper, shared SVG icons, stage scaling.
// Godot port: ScreenRouter autoload + one scene per screen (Splash, Home, ModeSelect, OrderChallengeSelect, ...).
window.SS = window.SS || {};

SS.UI = {
  screens: {}, current: null, params: null, root: null, stage: null, scale: 1,
  init() {
    this.root = document.getElementById("ui"); this.stage = document.getElementById("stage");
    this.fit(); window.addEventListener("resize", () => this.fit());
    if (window.visualViewport) window.visualViewport.addEventListener("resize", () => this.fit());
    // delegated click handling: [data-act] elements call the active screen's action handler
    this.root.addEventListener("click", e => {
      const el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
      SS.Audio.play("click");
      const act = el.getAttribute("data-act"), arg = el.getAttribute("data-arg");
      const modal = el.closest(".overlay");
      if (modal && modal._handler) return modal._handler(act, arg, el);
      const scr = this.screens[this.current]; if (scr && scr.on) scr.on(act, arg, el);
    });
  },
  fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.min(vw / 1080, vh / 1920);
    this.scale = s;
    this.stage.style.transform = `translate(${-540 * s}px, ${-960 * s}px) scale(${s})`;
  },
  register(id, def) { this.screens[id] = def; },
  show(id, params) {
    const prev = this.screens[this.current]; if (prev && prev.leave) prev.leave();
    this.closeAll();
    this.current = id; this.params = params || {};
    let el = document.getElementById("scr-" + id);
    if (!el) { el = document.createElement("section"); el.id = "scr-" + id; el.className = "screen"; this.root.appendChild(el); }
    document.querySelectorAll(".screen.on").forEach(s => s.classList.remove("on"));
    const def = this.screens[id];
    if (def.cls) el.className = "screen " + def.cls;
    el.innerHTML = SS.assetHTML(def.render ? def.render(this.params) : "");
    el.classList.add("on");
    if (def.after) def.after(el, this.params);
    SS.Reference.decorate(el);
    document.getElementById("game").style.visibility = id === "game" ? "visible" : "hidden";
    document.getElementById("menubg").style.visibility = id === "game" ? "hidden" : "visible";
    SS.Analytics.log("screen_view", { id });
  },
  refresh() { if (this.current) { const el = document.getElementById("scr-" + this.current), def = this.screens[this.current]; const sc = el.querySelector(".scroll"); const top = sc ? sc.scrollTop : 0; el.innerHTML = SS.assetHTML(def.render(this.params)); if (def.after) def.after(el, this.params); SS.Reference.decorate(el); const sc2 = el.querySelector(".scroll"); if (sc2) sc2.scrollTop = top; } },
  // modal(html, handler) -> overlay element. handler(act, arg, el) returns nothing; call SS.UI.close(ov) to dismiss.
  modal(html, handler, opts) {
    const ov = document.createElement("div"); ov.className = "overlay" + (opts && opts.cls ? " " + opts.cls : "");
    ov.innerHTML = SS.assetHTML(`<div class="modal" role="dialog" aria-modal="true">${html}</div>`);
    ov._handler = handler || ((act) => { if (act === "close") this.close(ov); });
    this.root.appendChild(ov);
    SS.Reference.decorate(ov);
    const first = ov.querySelector("button.primary") || ov.querySelector("button"); if (first) setTimeout(() => first.focus({ preventScroll: true }), 30);
    return ov;
  },
  close(ov) { if (ov && ov.parentNode) ov.parentNode.removeChild(ov); },
  closeAll() { this.root.querySelectorAll(".overlay").forEach(o => o.remove()); },
  confirm(title, text, yes, no, onYes, onNo) {
    const ov = this.modal(`<h2>${title}</h2><p>${text}</p><div class="btns row"><button class="btn sm white" data-act="no">${no}</button><button class="btn sm red" data-act="yes">${yes}</button></div>`, (act) => { this.close(ov); if (act === "yes") onYes && onYes(); else onNo && onNo(); });
    return ov;
  },
  // queue of popups shown one after another (level ups, unlocks, chapter grants)
  queue: [], showing: false,
  enqueue(fn) { this.queue.push(fn); if (!this.showing) this.next(); },
  next() { const fn = this.queue.shift(); if (!fn) { this.showing = false; return; } this.showing = true; fn(() => this.next()); },

  // ---------- shared fragments ----------
  coin(n) { return `<span class="coin"></span>`; },
  topbar(opts) {
    const d = SS.Save.d, lp = SS.Economy.levelProgress();
    return `<div class="topbar">
      ${opts && opts.gear ? `<button class="iconbtn" data-act="settings" aria-label="Settings">${SS.Icons.gear}</button>` : ""}
      ${opts && opts.level ? `<div class="levelchip" title="Level ${lp.level}"><span class="lv">${lp.level}</span><span class="xpbar"><i style="width:${Math.round(lp.ratio * 100)}%"></i></span></div>` : ""}
      <span class="spacer"></span>
      <span class="pill" aria-label="${d.coins} coins">${this.coin()}<span id="tb-coins">${SS.U.fmt(d.coins)}</span></span>
      <span class="pill" aria-label="${d.tickets} tickets"><span class="ticket"></span><span id="tb-tickets">${SS.U.fmt(d.tickets)}</span></span>
    </div>`;
  },
  backBtn() { return `<button class="back" data-act="back" aria-label="Back">${SS.Icons.back}</button>`; },
  starRow(n) { let s = ""; for (let i = 0; i < 3; i++) s += i < n ? SS.Icons.starOn : SS.Icons.starOff; return `<span class="stars" aria-label="${n} of 3 stars">${s}</span>`; }
};

SS.Icons = {};
// Semantic icon names resolve to the redrawn SVG library and SVG compatibility aliases.
const ICON_FILE = { gear: "gear", back: "back", pause: "pause", clock: "stopwatch", heartOn: "heart", starOn: "star", starOff: "starOff", lock: "lock", check: "check", play: "play", book: "recipebook", cart: "shop", clip: "clipboard", home: "home", mistake: "close", trophy: "medal", flame: "flame", coinIco: "coin", gem: "gem", crown: "crown", xp: "xp", calendar: "calendar", sound: "sound", music: "music", sparkle: "sparkle", chefhat: "chefhat", refresh: "refresh", medal: "medal2", video: "video" };
for (const k in ICON_FILE) { const cls = k === 'starOff' ? 'off' : (k === "play" || k === "book" || k === "cart" || k === "clip") ? "bico" : ""; Object.defineProperty(SS.Icons, k, { get: () => SS.Reference.iconForKey(k,cls)||`<img class="ico ${cls}" alt="" draggable="false" src="${SS.assetURL('assets/icons/'+ICON_FILE[k]+'.png')}">` }); }
Object.defineProperty(SS.Icons, "heartOff", { get: () => SS.Reference.iconHTML('heart','off') });
for (const name of ['close','help','info','menu','fullscreen','sound_on','sound_off','arrow_left','arrow_right','arrow_up','arrow_down']) {
  Object.defineProperty(SS.Icons, name, { get: () => SS.Reference.iconHTML(name) });
}
SS.Icons.img = (name, cls) => SS.Reference.url(name)?SS.Reference.iconHTML(name,cls):`<img class="ico ${cls || ""}" alt="" draggable="false" src="${SS.assetURL('assets/icons/'+name+'.png')}">`;
Object.assign(SS.Icons, {
  rays: `<svg class="rays" viewBox="0 0 1000 500" preserveAspectRatio="none"><g stroke="#1d2b4a" stroke-width="22" stroke-linecap="round"><path d="M120 120 l60 50 M80 250 l80 0 M120 380 l60 -50 M880 120 l-60 50 M920 250 l-80 0 M880 380 l-60 -50"/></g><g stroke="#ffd43b" stroke-width="12" stroke-linecap="round"><path d="M120 120 l60 50 M80 250 l80 0 M120 380 l60 -50 M880 120 l-60 50 M920 250 l-80 0 M880 380 l-60 -50"/></g></svg>`
});
