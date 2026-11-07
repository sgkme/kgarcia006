// Snack Stack — dish view: the SVG layer that shows the dish, falling food and debris during play,
// plus inline SVG icons/thumbnails for menus. Art comes from assets/dish/sprites.svg (loaded once into the page).
// The session stays the source of truth; this file only mirrors it.
window.SS = window.SS || {};

SS.DishView = (function () {
  const NS = "http://www.w3.org/2000/svg", ING = () => SS.DISH.ing;
  const K = () => SS.DATA.KIT_SCALE, BASE_Y = 60;
  const mk = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs || {}) n.setAttribute(k, attrs[k]); if (parent) parent.append(n); return n; };
  let ready = null, svg, world, air, scene, sceneRoot, served = null, sess = null, sprites = {}, lastT = 0;

  // ---------------------------------------------------------------- loading
  function load() {
    if (ready) return ready;
    ready = SS.assetText("assets/dish/sprites.svg").then(t => {
      const box = document.createElement("div"); box.id = "dish-sprites"; box.setAttribute("aria-hidden", "true");
      box.style.cssText = "position:absolute;width:0;height:0;overflow:hidden"; box.innerHTML = t; document.body.prepend(box);
    }).catch(e => { console.error("dish sprites failed to load", e); });
    return ready;
  }

  // a scene's element set inside a parent group
  function sceneGroups(parent, defs) {
    const R = { "#animDefs": defs || mk("defs", {}, parent) };
    const stick = mk("g", { filter: "url(#dish-sticker)" }, parent);
    R["#dishRoot"] = mk("g", {}, stick);
    for (const k of ["baseBack", "backContents", "dish", "fronts", "baseFront"]) R["#" + k] = mk("g", {}, R["#dishRoot"]);
    R["#fx"] = mk("g", {}, parent); R["#falling"] = mk("g", {}, parent);
    return R;
  }

  // ---------------------------------------------------------------- gameplay layer
  function mount(stage, gameCanvas) {
    if (svg) return;
    svg = mk("svg", { id: "dishsvg", viewBox: "0 0 1080 1920", "aria-hidden": "true" });
    svg.style.cssText = "position:absolute;inset:0;width:1080px;height:1920px;pointer-events:none;display:none";
    gameCanvas.after(svg);
    const defs = mk("defs", {}, svg);
    world = mk("g", {}, svg);
    served = mk("g", {}, world);
    sceneRoot = sceneGroups(world, defs);
    air = mk("g", { filter: "url(#dish-sticker)" }, mk("g", { transform: `scale(${K()})` }, svg));
    scene = SS.DishScene(sceneRoot, {
      reduced: SS.Save.d.settings.reduced_motion, liquidSplash: true,
      popup: (text, x, y) => { if (sess) sess.popup(540 + x * K(), sess.plate.y + (y - BASE_Y) * K() - 60, text, "#ffd84a", 1.2, 1); },
      pressed: () => { if (sess) sess.onPressed(); },
      plateImage: () => { const id = SS.Save.d.cosmetics.plate; if (!id || id === "plate_default") return null; const p = SS.Art.plate(id); const k = K();
        return { href: SS.Art.plateURL(id), x: -p.ox / k, y: (-p.oy + 6) / k, w: p.canvas.width / k, h: p.canvas.height / k }; }
    });
  }
  function show(on) { if (svg) svg.style.display = on ? "block" : "none"; }
  function attach(s) {
    sess = s; show(true);
    for (const k in sprites) sprites[k].remove(); sprites = {}; served.replaceChildren();
    world.setAttribute("transform", `translate(540 ${s.plate.y}) scale(${K()}) translate(0 ${-BASE_Y})`);
    s.on("order", o => { scene.setDish(SS.DishPlan.forOrder(o)); });
    s.on("dish_place", e => { const r = scene.place(e.i, e.offset / K(), true, e.quality); e.busy = r.busy; e.pressing = r.pressing; });
    s.on("dish_rebuild", n => scene.jumpTo(n));
    s.on("dish_press", () => scene.press());
    s.on("dish_press_done", () => scene.pressDone());
    s.on("order_done", () => serve());
    if (s.order) scene.setDish(SS.DishPlan.forOrder(s.order));
  }
  function detach() { sess = null; show(false); if (scene) scene.reset(); for (const k in sprites) sprites[k].remove(); sprites = {}; if (served) served.replaceChildren(); }
  // the finished dish slides off to the customer while the next order starts
  function serve() {
    const copy = sceneRoot["#dishRoot"].parentNode.cloneNode(true); served.append(copy);
    const t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / 1100), e = k * k; copy.setAttribute("transform", `translate(${e * 1100} ${-e * 500}) scale(${1 - k * 0.35})`); copy.setAttribute("opacity", 1 - k); if (k < 1) requestAnimationFrame(step); else copy.remove(); };
    requestAnimationFrame(step);
  }
  // game lean in degrees (same model the canvas renderer used)
  function leanOf(s, t) {
    const st = s.stack, S = SS.DATA.balance.stability, B = SS.DATA.balance;
    let amp = 0; if (st.stability < S.critical_threshold) amp = 4.5; else if (st.stability < S.danger_threshold) amp = 3; else if (st.stability < S.wobbly_threshold) amp = 1.5; else if (st.stability < S.uneasy_threshold) amp = 0.5;
    if (SS.Save.d.settings.reduced_motion) amp *= 0.4;
    const lean = SS.U.clamp(st.balance / (B.plate.support_half_width * 0.6), -1, 1) * S.max_visual_lean_degrees;
    return (lean + Math.sin(t * 5) * amp) * (st.layers.length ? 1 : 0);
  }
  // falling form of an ingredient: [sprite id, sx, sy]
  const fallOf = id => (ING()[id] && ING()[id].fall) || [id, 1, 1];
  function update(s, dt) {
    if (!svg || !sess || s !== sess) return;
    lastT += dt;
    scene.tick(dt, (s.plate.x - 540) / K(), leanOf(s, lastT));
    // mirror ingredients in the air: falling, splatting on the counter, tumbling debris
    const seen = {}, k = K();
    const list = s.objects.filter(o => o.cat === "ingredient").concat(s.debris.filter(d => d.cat === "ingredient"));
    for (const o of list) {
      if (o.state === "dead" || o.state === "caught") continue;
      const key = (o.uid !== undefined ? "o" + o.uid : "d" + (o._dv || (o._dv = Math.random().toString(36).slice(2))));
      seen[key] = 1;
      let g = sprites[key];
      const [fid, sx, sy] = o.state === "falling" ? fallOf(o.id) : [o.id, 1, 1];
      if (!g) {
        g = sprites[key] = mk("g", {}, air);
        if (o.state === "falling" && o.id === s.requiredId) g._glow = mk("ellipse", { rx: Math.max(60, ((ING()[fid] || {}).w || 200) * 0.38), ry: 46, cy: -30, fill: "#ffffff", opacity: 0.35 }, g);
        g._inner = mk("g", {}, g); g._use = mk("use", { href: "#ing-" + fid }, g._inner); g._fid = fid;
      }
      if (g._fid !== fid) { g._use.setAttribute("href", "#ing-" + fid); g._fid = fid; if (g._glow) { g._glow.remove(); g._glow = null; } }
      if (g._glow) g._glow.setAttribute("opacity", (0.25 + 0.15 * Math.sin(lastT * 6)).toFixed(3));
      if (o.qd && !g._streak) g._streak = mk("rect", { x: -9, width: 18, rx: 9, y: -260, height: 200, fill: "#ffffff", opacity: 0.7 }, g);
      const cy = o.state === "falling" ? o.y + (o.contactHalf || 0) : o.y;
      g.setAttribute("transform", `translate(${(o.x / k).toFixed(1)} ${(cy / k).toFixed(1)})`);
      g._inner.setAttribute("transform", `rotate(${((o.rot || 0) * 180 / Math.PI).toFixed(2)}) scale(${sx * (o.qd ? 0.92 : 1)} ${sy * (o.qd ? 1.12 : 1)})`);
      g.setAttribute("opacity", (o.alpha === undefined ? 1 : o.alpha).toFixed(3));
      g.style.filter = o.tint ? "hue-rotate(80deg) saturate(1.4)" : "";
    }
    for (const key in sprites) if (!seen[key]) { sprites[key].remove(); delete sprites[key]; }
  }

  // ---------------------------------------------------------------- size helpers for the session
  // falling-object metrics in design px: width, height, contact offset (contact point below the object's centre)
  function fallMetrics(id) {
    const [fid, sx, sy] = fallOf(id), v = ING()[fid] || ING()[id], k = K();
    const [bx, by, bw, bh] = v.box;
    const contactHalf = Math.max(8, -(by + bh / 2) * k * sy);
    return { w: bw * k * sx, h: bh * k * sy, contactHalf, hitOff: 0 };
  }

  // ---------------------------------------------------------------- menu art (inline SVG that reuses the page's sprites)
  let offscreen = null; const thumbCache = {};
  function offScene() {
    if (offscreen) return offscreen;
    const host = mk("svg", { width: 10, height: 10 }); host.style.cssText = "position:absolute;left:-10000px;top:0;visibility:hidden";
    document.body.append(host);
    const R = sceneGroups(host);
    offscreen = { host, R, scene: SS.DishScene(R, { reduced: true }) };
    return offscreen;
  }
  function thumbHTML(src, size, attrs) {
    const isOrder = src && !Array.isArray(src) && typeof src === "object";
    const key = (isOrder ? src.recipe_id + "|" + src.seq.join(",") : Array.isArray(src) ? src.join(",") : src) + ":" + size;
    if (!thumbCache[key]) {
      const r = typeof src === "string" ? SS.DATA.recipe_by_id[src] : null;
      const d = r ? { base: r.base, seq: r.ingredient_sequence.map((id, i) => [id, r.cols[i]]), finish: r.finish, hot: null }
        : isOrder ? SS.DishPlan.forOrder(src)
        : { base: "plate", seq: (src || []).filter(id => ING()[id]).map(id => [id, null]) };
      const o = offScene();
      o.scene.setDish(d); o.scene.jumpTo(d.seq.length); o.scene.tick(0, 0, 0);
      const stick = o.R["#dishRoot"].parentNode, bb = stick.getBBox(), pad = 26;
      const vb = `${(bb.x - pad).toFixed(0)} ${(bb.y - pad).toFixed(0)} ${(bb.width + pad * 2).toFixed(0)} ${(bb.height + pad * 2).toFixed(0)}`;
      thumbCache[key] = { vb, inner: o.R["#animDefs"].outerHTML + stick.outerHTML };
      o.scene.reset();
    }
    const c = thumbCache[key];
    return `<svg class="dthumb" viewBox="${c.vb}" width="${size}" height="${size}" role="img" ${attrs || 'aria-hidden="true"'}>${c.inner}</svg>`;
  }
  function iconHTML(id, size, attrs) {
    const v = ING()[id]; if (!v) return "";
    const [x, y, w, h] = v.box, pad = 18, s = Math.max(w, h) + pad * 2, cx = x + w / 2, cy = y + h / 2;
    return `<svg class="dicon" viewBox="${(cx - s / 2).toFixed(0)} ${(cy - s / 2).toFixed(0)} ${s.toFixed(0)} ${s.toFixed(0)}" width="${size}" height="${size}" role="img" ${attrs || 'aria-hidden="true"'}><g filter="url(#dish-sticker)"><use href="#ing-${id}"/>${v.front_sprite ? `<use href="#ing-${v.front_sprite}"/>` : ""}</g></svg>`;
  }

  return { load, mount, attach, detach, update, show, fallMetrics, thumbHTML, iconHTML, get scene() { return scene; } };
})();
