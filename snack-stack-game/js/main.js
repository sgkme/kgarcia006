// Snack Stack \u2014 boot: load save, debug hooks, UI, input, loop, splash.
window.SS = window.SS || {};

// Deterministic debug hooks (CLAUDE.md: add debug hooks where appropriate). Toggle overlay in Settings.
SS.Debug = {
  overlay: false, freezeVertical: false, forceProfile: null, verbose: false,
  session() { return SS.Game.s; },
  spawn(kind, id) { const s = SS.Game.s; if (!s) return; if (kind === "hazard") s.spawnHazard(id); else if (kind === "bonus") s.spawnBonus(id); else s.spawnIngredient(id, "decoy"); },
  event(id) { const s = SS.Game.s; if (s) s.startEvent(id); },
  unlockAll() { const d = SS.Save.d; SS.DATA.chapters.forEach(c => { if (d.chapters_unlocked.indexOf(c.id) < 0) d.chapters_unlocked.push(c.id); }); SS.DATA.missions.forEach(m => { SS.Progress.missionState(m.id).cleared.normal = true; }); SS.DATA.chapters.forEach(c => { if (d.chapters_completed.indexOf(c.id) < 0) d.chapters_completed.push(c.id); }); SS.DATA.recipes.forEach(r => SS.Progress.unlockRecipe(r.id)); SS.Save.save(); SS.UI.refresh(); }
};

(function boot() {
  SS.Save.load();
  SS.Debug.overlay = !!SS.Save.d.settings.debug;
  if (SS.Save.d.settings.reduced_motion) document.body.classList.add("rm");
  const root = document.documentElement.style;
  SS.Reference.prepareStyle();
  root.setProperty("--menu-bg", "url(" + SS.Art.menuBg() + ")");
  root.setProperty("--ico-coin", "url(\"" + SS.Reference.url("coin") + "\")");
  root.setProperty("--ico-gem", "url(\"" + SS.Reference.url("gem") + "\")");
  SS.UI.init();
  SS.Game.initInput();
  SS.Game.initLoop();
  // first user gesture anywhere unlocks audio (browser autoplay rules)
  const unlock = () => { SS.Audio.unlock(); window.removeEventListener("pointerdown", unlock); };
  window.addEventListener("pointerdown", unlock);
  const go = () => Promise.all([SS.SVGArt ? SS.SVGArt.ready : null, SS.DishView.load(), SS.BG.homeLoad, SS.Reference.ready]).then(() => SS.UI.show("splash"));
  if (document.fonts && document.fonts.ready) Promise.race([Promise.all([document.fonts.load("64px 'Titan One'"), document.fonts.load("700 40px Fredoka"), document.fonts.load("700 40px Nunito")]), new Promise(r => setTimeout(r, 2000))]).then(go); else go();
})();
