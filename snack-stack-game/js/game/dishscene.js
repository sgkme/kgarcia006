// Snack Stack — dish scene: draws a dish being built and plays every landing behaviour.
// The engine below is lifted from stack-builder.html (the art kit) and wrapped so each scene is self-contained:
// the game session owns catching, grading and stability; the scene only shows the result.
// Coordinates are kit units (see SS.DishPlan); the owner positions the scene's root.
window.SS = window.SS || {};

SS.DishScene = function (R, hooks) {
  hooks = hooks || {};
  const ING = SS.DISH.ing, NS = 'http://www.w3.org/2000/svg', BASE_Y = SS.DishPlan.BASE_Y;
  const $ = s => R[s];
  const el = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.append(n); return n; };
  const reduced = !!hooks.reduced;
  const speed = () => 1;
  const easeOut = (q, k = 3) => 1 - Math.pow(1 - Math.min(1, Math.max(0, q)), k);
  let dish = { base: 'plate', seq: [] }, plan = [], placed = 0, layers = [], anims = [], queue = [], clock = 0;
  let plateX = 0, lean = 0, leanV = 0;

  function setBase() {
    const base = ING[dish.base];
    $('#baseBack').replaceChildren(); $('#baseFront').replaceChildren();
    if (dish.base === 'plate' && hooks.plateImage) { const pi = hooks.plateImage(); if (pi) { el('image', {href: pi.href, x: pi.x, y: pi.y + BASE_Y, width: pi.w, height: pi.h}, $('#baseBack')); return; } }
    el('use', {href: '#ing-' + dish.base, transform: `translate(0 ${BASE_Y})`}, $('#baseBack'));
    if (base.front_sprite) el('use', {href: '#ing-' + base.front_sprite, transform: `translate(0 ${BASE_Y})`}, $('#baseFront'));
  }

  // ---------------------------------------------------------------- placing a layer (after contact)
  function addLayer(i, animate, offset = 0) {
    const {id, x, y} = plan[i], info = ING[id];
    const parent = info.z === 'back' ? $('#backContents') : $('#dish');
    const g = el('g', {transform: `translate(${x + offset} ${y})`, 'data-ingredient': id}, parent);
    const a = el('g', {}, g);
    if (info.kind === 'pieces' && animate && !reduced) {
      for (const ch of document.getElementById('ing-' + id).children) el('g', {}, a).append(ch.cloneNode(true));
    } else el('use', {href: '#ing-' + id}, a);
    let fa = null;
    if (info.front_sprite) { const fg = el('g', {transform: `translate(${x + offset} ${y})`}, $('#fronts')); fa = el('g', {}, fg); el('use', {href: '#ing-' + info.front_sprite}, fa); }
    if (hooks.debugGuides && info.seat !== 'floor') {
      const guide = el('g', {class: 'guide'}, g);
      el('line', {x1: -info.w / 2 - 16, x2: info.w / 2 + 16, y1: -info.stack, y2: -info.stack, stroke: '#2f7fd1', 'stroke-width': 2.5, 'stroke-dasharray': '8 6'}, guide);
      el('circle', {r: 6, fill: '#d9402a', stroke: '#fff', 'stroke-width': 2}, guide);
      const t = el('text', {x: info.w / 2 + 22, y: -info.stack / 2 + 5, 'font-size': 15, 'font-weight': 800, fill: '#2f7fd1', 'font-family': 'Nunito, sans-serif'}, guide);
      t.textContent = `+${info.stack}`;
    }
    const L = {g, a, fa, id, info, i};
    if (info.kind === 'straw' && info.axis) {
      const lidL = layers.find(o => o.info.hole && !o.hidden);
      if (lidL) {
        const [hx, hy] = lidL.info.hole, holeY = plan[lidL.i].y + hy;              // hole in dish coords
        const [ax, slope] = info.axis, sxAt = ax + (y - holeY) * slope;            // where the straw crosses that height
        const dx = plan[lidL.i].x + hx - sxAt;
        g.setAttribute('transform', `translate(${x + offset + dx} ${y})`);
        const cid = 'strawclip' + i + '_' + Math.random().toString(36).slice(2, 7);
        const cp = el('clipPath', {id: cid}, $('#animDefs')); el('rect', {x: -400, y: -2000, width: 800, height: 2000 + (holeY - y)}, cp);
        const fg = el('g', {transform: `translate(${x + offset + dx} ${y})`, 'clip-path': `url(#${cid})`}, $('#fronts'));
        L.fa = el('g', {}, fg); el('use', {href: '#ing-' + id}, L.fa);
      }
    }
    if (plan[i].iceFirst && info.floor_scale) a.firstChild.setAttribute('transform', `scale(${info.floor_scale})`);
    if (info.smoosh) {                     // caught as a round scoop; the pressed slab waits hidden
      L.pos = [x + offset, y];
      a.firstChild.setAttribute('href', '#ing-' + info.smoosh.scoop);
      L.slab = el('g', {opacity: 0}, a); el('use', {href: '#ing-' + id}, L.slab);
    }
    if (info.on_scoop) {                   // topping on the scoop; turns into bits in the ice cream sides when pressed
      const pg = el('g', {transform: `translate(0 ${plan[i].iceY - y})`}, a);
      L.pressed = el('g', {opacity: 0}, pg); el('use', {href: '#ing-' + info.pressed_form}, L.pressed);
      L.scoopUse = a.firstChild; L.c = plan[i].iceY - y;
    }
    if (info.presses) {
      const soft = [...layers].reverse().find(o => o.info.smoosh && !o.done);
      if (soft) {
        soft.done = true;
        const press = {L, soft, drop: plan[i].drop, tops: layers.filter(o => o.info.on_scoop && !o.done)};
        press.tops.forEach(o => o.done = true);
        L.a.setAttribute('transform', `translate(0 ${-press.drop})`);
        if (animate && !reduced) { L.pressing = true; waitPress(press); }
        else applyPress(press, 1);
      }
    }
    if (info.seat === 'refill') {                       // top-up replaces the half-full liquid
      const prev = layers.find(o => o.id === info.replaces && !o.hidden);
      if (prev) { L.from = prev.info.stack / info.stack; if (animate && !reduced) queue.push({at: clock + .02, fn: () => { prev.hidden = true; prev.g.setAttribute('opacity', 0); }}); else { prev.hidden = true; prev.g.setAttribute('opacity', 0); } }
    }
    if (plan[i].iceFirst) L.iceFirst = true;
    if (info.kind === 'fill' && info.container) floatIce(plan[i].y - info.stack, animate && !reduced, L.from || 0, plan[i].y);
    if (info.mix_into) mixDrink(L, animate && !reduced);
    if (info.kind === 'close' && info.wrap_stages && animate && !reduced) { wrapSequence(L); }
    else if (info.kind === 'close') for (const o of layers) if (o.info.z !== 'back' && !o.hidden) hideLayer(o, animate);
    layers.push(L);
    if (animate && !reduced && !L.pressing) anims.push(arrive(L));
    return L;
  }
  // ---------------------------------------------------------------- ice cream sandwich: tap the top cookie to press
  let pressWait = null;
  function applyPress(P, e) {            // e: 0 = round scoop, 1 = pressed slab
    const {L, soft, drop, tops} = P, sc = soft.info.smoosh, H = soft.info.stack;
    const fx = 1.5, fy = H / sc.scoop_h;                                     // scoop -> slab proportions
    const wob = Math.sin(Math.PI * Math.min(1, e * 1.25)) * (1 - e) * .08;
    const sx = 1 + (fx - 1) * e + wob, sy = 1 + (fy - 1) * e - wob;
    const k = Math.min(1, Math.max(0, (e - .35) / .4));                    // crossfade scoop -> slab
    soft.a.firstChild.setAttribute('transform', `scale(${sx} ${sy})`); soft.a.firstChild.setAttribute('opacity', 1 - k);
    soft.slab.setAttribute('transform', `scale(${sx / fx} ${sy / fy})`); soft.slab.setAttribute('opacity', k);
    for (const o of tops) {
      o.scoopUse.setAttribute('transform', `translate(0 ${o.c}) scale(${sx} ${sy}) translate(0 ${-o.c})`); o.scoopUse.setAttribute('opacity', 1 - k);
      o.pressed.setAttribute('transform', `scale(${sx / fx} ${sy / fy})`); o.pressed.setAttribute('opacity', k);
    }
    L.a.setAttribute('transform', e >= 1 ? '' : `translate(0 ${-drop * (1 - e)})`);
  }
  function waitPress(P) {
    pressWait = P;
    const [px] = P.soft.pos, y = plan[P.L.i].y - P.drop - 90;
    const hint = el('g', {class: 'press-hint', transform: `translate(${plateX + px} ${y})`}, $('#fx'));
    el('rect', {x: -96, y: -26, width: 192, height: 40, rx: 20, fill: '#2b1d14', opacity: .85}, hint);
    const t = el('text', {y: 2, 'text-anchor': 'middle', 'font-size': 19, 'font-weight': 800, fill: '#fff', 'font-family': 'Nunito, sans-serif'}, hint);
    t.textContent = 'Tap to press!';
    P.hint = hint;
    P.pulse = {t: 0, dur: 1e9, update(p, tt) { const s = 1 + .06 * Math.sin(tt * 8); hint.setAttribute('transform', `translate(${plateX + px} ${y}) scale(${s})`); }};
    anims.push(P.pulse);
  }
  function doPress() {
    const P = pressWait; if (!P) return;
    pressWait = null; P.hint.remove(); P.pulse.dur = 0;
    const sp = speed();
    anims.push({t: 0, dur: .5 / sp, update(p) {
      applyPress(P, easeOut(p, 2.4));
      if (p >= 1) {
        applyPress(P, 1);
        const [px] = P.soft.pos; if (hooks.popup) hooks.popup('PRESSED!', plateX + px, plan[P.L.i].y);
        leanV += 20;
        if (hooks.pressed) hooks.pressed();
      }
    }});
  }

  // Two different liquids in one glass swirl together after the second lands
  // Ice dropped into the empty glass rises with the drink as it's poured and floats on top
  function floatIce(surface, animate, f0, y0) {
    for (const o of layers) if (o.iceFirst && !o.hidden) {
      $('#dish').appendChild(o.g);                       // stays in front of the liquid
      const [ix, iy] = o.g.getAttribute('transform').match(/-?[\d.]+/g).map(Number);
      const from = iy, to = Math.min(iy, surface), fs = o.info.floor_scale || 1, use = o.a.firstChild;
      const fit = yy => fs + (1 - fs) * Math.max(0, Math.min(1, (o.y0 - yy) / Math.max(1, o.y0 - o.top)));
      if (o.y0 == null) { o.y0 = iy; o.top = plan[o.i] ? Math.min(...plan.filter(q => ING[q.id].kind === 'fill').map(q => q.y - ING[q.id].stack)) : surface; }
      if (!animate) { o.g.setAttribute('transform', `translate(${ix} ${to})`); use.setAttribute('transform', `scale(${fit(to)})`); continue; }
      anims.push({t: 0, dur: .8 / speed(), update(p, t) {
        const lvl = y0 - (y0 - surface) * (f0 + (1 - f0) * easeOut(p, 2.2));        // follows the rising level
        const bob = p > .7 ? 4 * Math.sin((p - .7) * 30) * (1 - p) : 0;
        o.g.setAttribute('transform', `translate(${ix} ${Math.min(from, lvl) + bob})`);
        use.setAttribute('transform', `scale(${fit(Math.min(from, lvl))})`);           // widens with the glass as it rises
      }});
    }
  }
  function mixDrink(L, animate) {
    const floor = BASE_Y - ING[dish.base].stack, mixId = L.info.mix_into;
    const fills = () => layers.filter(o => o.info.kind === 'fill' && !o.hidden);
    const mg = el('g', {transform: `translate(0 ${floor})`, 'data-ingredient': mixId}, $('#dish'));
    $('#dish').insertBefore(mg, L.g.nextSibling);
    const ma = el('g', {}, mg); el('use', {href: '#ing-' + mixId}, ma);
    const finish = () => { for (const o of fills()) if (o !== L) { o.hidden = true; o.g.setAttribute('opacity', 0); } L.hidden = true; L.g.setAttribute('opacity', 0); mg.setAttribute('opacity', 1); };
    for (const o of layers) if (o.iceFirst) $('#dish').appendChild(o.g);      // ice stays in front of the mixed drink
    if (!animate) { queue.push({at: clock, fn: finish}); return; }
    mg.setAttribute('opacity', 0);
    const swirl = el('g', {transform: `translate(0 ${floor - 106})`, opacity: 0}, $('#fx'));
    for (let k = 0; k < 3; k++) el('path', {d: `M-70 ${-40 + k * 40} q35 -26 70 0 t70 0`, fill: 'none', stroke: '#fff', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: .6}, swirl);
    const start = .85 / speed();
    anims.push({t: -start, dur: 1.1 / speed(), update(p, t) {
      if (t < 0) return;
      const others = fills().filter(o => o !== L);
      mg.setAttribute('opacity', easeOut(p, 2));
      for (const o of [...others, L]) o.g.setAttribute('opacity', 1 - easeOut(p, 2));
      swirl.setAttribute('opacity', Math.sin(Math.PI * p));
      swirl.setAttribute('transform', `translate(${Math.sin(p * 9) * 16 + plateX} ${floor - 106}) scale(${1 - .3 * p} 1)`);
      if (p >= 1) { finish(); swirl.remove(); }
    }});
  }
  // Once the dish is complete (e.g. grilled cheese melting out of the sandwich)
  function finishDish(animate) {
    if (dish.hot) heat(dish.hot);
    const fin = dish.finish; if (!fin) return;
    const at = plan[fin.anchor_step];
    const g = el('g', {transform: `translate(${at.x} ${at.y})`, 'data-finish': fin.sprite}, $('#dish'));
    const a = el('g', {}, g); el('use', {href: '#ing-' + fin.sprite}, a);
    if (!animate || reduced) return;
    const L = {a, g};
    const c = clipRect(L, {x: -700, y: 20, width: 1400, height: 0});
    anims.push({t: -.35 / speed(), dur: 1.3 / speed(), update(p, t) { if (t < 0) return; c.rect.setAttribute('height', 140 * easeOut(p, 1.8)); if (p >= 1) c.done(); }});
  }
  // Very hot dishes: soft steam wisps rise and curl away; skillet dishes also sizzle (tiny spatters popping at the edges)
  function heat(kind) {
    const bb = $('#dish').getBBox(), cx = plateX + bb.x + bb.width / 2, top = bb.y + 10, half = Math.min(bb.width / 2, 200);
    const g = el('g', {'pointer-events': 'none'}, $('#fx'));
    const wisps = [-.55, 0, .55].map((u, k) => ({x: cx + u * half * .8, ph: k * .37, el: el('path', {fill: 'none', stroke: '#ffffff', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0}, g)}));
    let next = 0;
    const loop = {t: 0, dur: 1e9, update(p, t) {
      if (!g.isConnected) { loop.dur = 0; return; }
      const tt = t * speed();
      for (const w of wisps) {
        const q = ((tt * .45 + w.ph) % 1), rise = 30 + 90 * q, sway = 12 * Math.sin(tt * 2 + w.ph * 9);
        const y0 = top - rise, x0 = w.x + sway;
        w.el.setAttribute('d', `M${x0} ${y0 + 40} c${-14} ${-12} ${14} ${-22} 0 ${-34} s${-14} ${-22} 0 ${-34}`);
        w.el.setAttribute('opacity', (.55 * Math.sin(Math.PI * q)).toFixed(3));
        w.el.setAttribute('stroke-width', 10 - 5 * q);
      }
      if (kind === 'sizzle' && tt > next) {
        next = tt + .06;
        const a = Math.random() * Math.PI, sx = cx + Math.cos(a) * half * (.7 + Math.random() * .3) * (Math.random() < .5 ? -1 : 1), sy = bb.y + bb.height * (.45 + Math.random() * .3);
        const d = el('circle', {cx: sx, cy: sy, r: 2 + Math.random() * 2.5, fill: '#fff8dc', stroke: '#e0a030', 'stroke-width': 1.2}, g);
        const vx = (Math.random() - .5) * 40, vy = -30 - Math.random() * 30;
        anims.push({t: 0, dur: .32, update(q) { d.setAttribute('cx', sx + vx * q); d.setAttribute('cy', sy + vy * q + 60 * q * q); d.setAttribute('opacity', 1 - q); if (q >= 1) d.remove(); }});
      }
    }};
    anims.push(loop);
  }

  // Burrito wrap, drawn in 3D-ish tortilla space (X across, Z depth toward the viewer, H height; screen y = -5 + K*Z - H).
  // 1. filling presses down  2. left & right edges fold over the filling ends - they rest ON the food, so they bulge
  // 3. the front edge is pulled up and over the filling  4. the whole package rolls/tightens into the wrapped burrito.
  // The flat tortilla loses each part the moment that part starts folding, so no full circle stays behind.
  let wrapN = 0;
  function wrapSequence(L) {
    const sp = speed(), K = .25;
    const under = layers.filter(o => o.info.z !== 'back' && !o.hidden), base = under[0];
    const [tx, ty] = L.g.getAttribute('transform').match(/-?[\d.]+/g).map(Number);
    const [bx, by] = base.g.getAttribute('transform').match(/-?[\d.]+/g).map(Number);
    const R = base.info.w / 2, h = Math.round(R * .66), Zb = R * .3, n = ++wrapN, defs = $('#animDefs');
    const OUTC = '#5a3a12', FILL_H = 34, FILL_Z = 175, FILL_X = R * .78;
    L.g.setAttribute('opacity', 0);
    if (L.info.fry_from) L.a.firstChild.setAttribute('href', '#ing-' + L.info.fry_from);     // rolls up as a plain burrito, then fries
    const fills = under.slice(1).map(o => ({o, tr: o.g.getAttribute('transform')}));
    const press = q => { for (const {o, tr} of fills) { const [fx, fy] = tr.match(/-?[\d.]+/g).map(Number); o.g.setAttribute('transform', `translate(${fx} ${by + (fy - by) * (1 - .55 * q)}) scale(1 ${1 - .3 * q})`); } };
    L.busy = 2.1 + (L.info.fry_from ? 1.7 : 0);
    // everything of the package goes in one group so it can roll into the burrito at the end
    const pkg = el('g', {}, $('#dish'));
    for (const o of under) pkg.append(o.g);
    const cp = el('clipPath', {id: `wr${n}b`}, defs), baseClip = el('rect', {x: -R - 20, y: -300, width: 2 * R + 40, height: 600}, cp);
    base.a.setAttribute('clip-path', `url(#wr${n}b)`);
    const grad = el('linearGradient', {id: `wr${n}g`, x1: 0, y1: 0, x2: 0, y2: 1}, defs);
    el('stop', {offset: 0, 'stop-color': '#fff8e2'}, grad); el('stop', {offset: .55, 'stop-color': '#f6e2b4'}, grad); el('stop', {offset: 1, 'stop-color': '#e6c88e'}, grad);
    const scr = (X, Z, H) => [bx + X * (1 - H * .0028), by - 5 + K * Z - H];   // raised parts lean in a little (camera above centre), so a standing flap isn't edge-on
    const smooth01 = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    // height of the pressed filling under a point: what a folded flap rests on (this is the bulge)
    const foodH = (X, Z, q) => FILL_H * q * Math.sqrt(Math.max(0, 1 - (Z / FILL_Z) ** 2)) * (1 - smooth01(FILL_X - 10, FILL_X + 25, Math.abs(X)));
    const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    const mkFlap = (boundary, inside) => {
      const g = el('g', {opacity: 0}, pkg);
      const body = el('path', {fill: `url(#wr${n}g)`, stroke: OUTC, 'stroke-width': 4.5, 'stroke-linejoin': 'round'}, g);
      const crease = el('path', {fill: 'none', stroke: '#fffaf0', 'stroke-width': 2.4, opacity: .75, 'stroke-linecap': 'round'}, g);
      const spots = []; for (let i = 0; i < 260 && spots.length < 9; i++) { const X = (rnd() * 2 - 1) * R, Z = (rnd() * 2 - 1) * R; if (inside(X, Z)) spots.push({X, Z, el: el('ellipse', {rx: 4 + rnd() * 5, ry: 2 + rnd() * 1.6, fill: '#e2b46a', opacity: .7}, g)}); }
      return {g, body, crease, spots, boundary};
    };
    const path = pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + 'Z';
    const lin = (a, b, k) => Array.from({length: k}, (_, i) => a + (b - a) * i / (k - 1));
    // side flap boundary (right side, mirrored for left): outer arc + hinge line X = h
    const al = Math.acos(h / R);
    const sideB = sg => [...lin(-al, al, 22).map(t => [sg * R * Math.cos(t), R * Math.sin(t)]), ...lin(1, -1, 10).map(u => [sg * h, u * R * Math.sin(al)])];
    const Lf = mkFlap(sideB(-1), (X, Z) => X < -h - 6 && X * X + Z * Z < (R - 8) ** 2);
    const Rf = mkFlap(sideB(1), (X, Z) => X > h + 6 && X * X + Z * Z < (R - 8) ** 2);
    const tb = Math.asin(Zb / R);
    const frontB = [...lin(Math.acos(h / R), Math.acos(-h / R), 26).map(t => [R * Math.cos(t), R * Math.sin(t)]), [-h, Zb], ...lin(-h, h, 10).map(x => [x, Zb])];
    const Bf = mkFlap(frontB, (X, Z) => Math.abs(X) < h - 8 && Z > Zb + 8 && X * X + Z * Z < (R - 8) ** 2);
    // fold a point: side flaps rotate about X = ±h, the front flap about Z = Zb; folded flaps drape over the food
    // world-space folds: return [X, Z, H]
    const sideW = (sg, q) => ([X, Z]) => { const a = Math.abs(X) - h, th = Math.PI * q, Xp = sg * (h + a * Math.cos(th));
      return [Xp, Z, Math.max(a * Math.sin(th), foodH(Xp, Z, 1) * smooth01(.55, 1, q) * Math.min(1, a / 30))]; };
    // front fold: everything in front of the hinge (the front flap AND the front corners of the folded sides) is pulled up and over
    const frontW = q => ([X, Z, H0 = 0]) => { const b = Z - Zb; if (b <= 0 || q <= 0) return [X, Z, H0];
      const th = Math.PI * q, Zp = Zb + b * Math.cos(th);
      const rest = foodH(X, Zp, 1) * smooth01(.5, 1, q) * Math.min(1, b / 26);
      return [X, Zp, Math.max(b * Math.sin(th) * .8 + H0 * (1 - q), rest + 14 * Math.sin(th) * (1 - q)) + H0 * q]; };
    const toScr = ([X, Z, H]) => scr(X, Z, H);
    const draw = (f, fn, on, q) => {
      f.g.setAttribute('opacity', on ? 1 : 0); if (!on) return;
      const pts = f.boundary.map(fn); f.body.setAttribute('d', path(pts));
      f.crease.setAttribute('d', q > .6 ? 'M' + pts.slice(-8, -2).map(p => (p[0]).toFixed(1) + ' ' + (p[1] - 6).toFixed(1)).join(' L') : '');
      for (const s of f.spots) { const [x, y] = fn([s.X, s.Z]); s.el.setAttribute('cx', x); s.el.setAttribute('cy', y); }
      f.body.style.filter = q > .5 ? 'brightness(.97)' : '';
    };
    const ease = q => q <= 0 ? 0 : q >= 1 ? 1 : q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
    const win = (t, a, b) => ease((t - a) / (b - a));
    const T = s => s / sp;
    const box = L.info.box;       // finished burrito bounds (sprite coords)
    let pb = null;
    anims.push({t: 0, dur: T(2.1), keep: true, update(p, t) {
      press(win(t, 0, T(.22)));
      const ql = win(t, T(.12), T(.52)), qr = win(t, T(.3), T(.7)), qf = win(t, T(.7), T(1.2));
      const onL = t >= T(.12), onR = t >= T(.3), onF = t >= T(.7);
      const x0 = onL ? -h : -R - 20, x1 = onR ? h : R + 20;
      baseClip.setAttribute('x', x0); baseClip.setAttribute('width', x1 - x0);
      baseClip.setAttribute('height', onF ? 300 - 5 + K * Zb : 600);
      const fw = frontW(qf);
      draw(Lf, pt => toScr(fw(sideW(-1, ql)(pt))), onL, ql); draw(Rf, pt => toScr(fw(sideW(1, qr)(pt))), onR, qr);
      draw(Bf, pt => toScr(fw(pt)), onF, qf);
      // roll: the package tightens into the burrito's shape while the finished burrito takes over
      const r = win(t, T(1.25), T(1.8));
      if (r > 0) {
        // measure both real shapes once, then meet in the middle: the package grows/settles to the burrito's size
        if (!pb) { const bs = [Lf, Rf, Bf].map(f => f.body.getBBox()), x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y));
          pb = {x: x0, y: y0, width: Math.max(...bs.map(b => b.x + b.width)) - x0, height: Math.max(...bs.map(b => b.y + b.height)) - y0}; setT(L, ''); const lb = L.a.getBBox(); pb.lx = lb.x; pb.ly = lb.y; pb.lw = lb.width; pb.lh = lb.height; }
        const cx0 = pb.x + pb.width / 2, cy0 = pb.y + pb.height / 2, lcx = pb.lx + pb.lw / 2, lcy = pb.ly + pb.lh / 2, cx1 = tx + lcx, cy1 = ty + lcy;
        const fx = pb.lw / pb.width, fy = pb.lh / pb.height;
        const sx = 1 + (fx - 1) * r, sy = 1 + (fy - 1) * r;
        pkg.setAttribute('transform', `translate(${cx0 + (cx1 - cx0) * r} ${cy0 + (cy1 - cy0) * r}) scale(${sx} ${sy}) translate(${-cx0} ${-cy0})`);
        const k = smooth01(.25, .7, r);
        pkg.setAttribute('opacity', 1 - k); L.g.setAttribute('opacity', k);
        const sq = .05 * Math.sin(Math.PI * smooth01(.75, 1, r));
        setT(L, `translate(${lcx} ${lcy}) scale(${sx / fx * (1 + sq)} ${sy / fy * (1 - sq)}) translate(${-lcx} ${-lcy})`);
      }
      if (p >= 1) {
        for (const o of under) { o.hidden = true; o.g.setAttribute('opacity', 0); $('#dish').insertBefore(o.g, pkg); }
        base.a.removeAttribute('clip-path'); pkg.remove(); cp.remove(); grad.remove();
        L.g.setAttribute('opacity', 1); setT(L, '');
        if (L.info.fry_from) fry(L, tx, ty);
      }
    }});
    L.pressing = true;
  }

  // Chimichanga: the wrapped burrito fries in a shallow pool of oil - bubbles along the edges,
  // the tortilla turns golden from the ends inward, then it lifts out crisp and settles.
  function fry(L, tx, ty) {
    const sp = speed(), defs = $('#animDefs'), id = 'fry' + Math.random().toString(36).slice(2);
    const bb = L.a.getBBox(), half = bb.width / 2 + 8, cx = bb.x + bb.width / 2;
    const pool = el('ellipse', {cx: tx + cx, cy: ty - 4, rx: 0, ry: 0, fill: '#f4b938', opacity: .6, stroke: '#c9861e', 'stroke-width': 4}, $('#dish'));
    $('#dish').insertBefore(pool, L.g);
    const cp = el('clipPath', {id}, defs), r1 = el('rect', {x: cx - half, y: -400, width: 0, height: 800}, cp), r2 = el('rect', {x: cx + half, y: -400, width: 0, height: 800}, cp);
    const crisp = el('use', {href: '#ing-' + L.id, 'clip-path': `url(#${id})`}, L.a);
    const bubbles = el('g', {}, $('#dish')); let next = 0;
    anims.push({t: 0, dur: 1.7 / sp, keep: true, update(p, t) {
      const tt = t * sp;
      const grow = easeOut(Math.min(1, tt / .25), 2), shrink = 1 - easeOut(Math.max(0, (tt - 1.3) / .3), 2);
      pool.setAttribute('rx', (half + 34) * grow * shrink); pool.setAttribute('ry', 30 * grow * shrink);
      // browning, from both ends toward the middle
      const b = easeOut(Math.max(0, Math.min(1, (tt - .2) / 1.0)), 1.6) * half;
      r1.setAttribute('width', b); r2.setAttribute('x', cx + half - b); r2.setAttribute('width', b);
      // sizzle: bubbles pop up along the bottom edge, the burrito trembles
      if (tt > .15 && tt < 1.35 && tt > next) { next = tt + .035;
        const bx = tx + cx + (Math.random() * 2 - 1) * half * .95, by0 = ty - 2 + Math.random() * 10, r = 3 + Math.random() * 5;
        const c = el('circle', {cx: bx, cy: by0, r, fill: '#fff6d8', stroke: '#c9861e', 'stroke-width': 1.6, opacity: .95}, bubbles);
        anims.push({t: 0, dur: .35 / sp, update(q) { c.setAttribute('cy', by0 - 18 * q); c.setAttribute('r', r * (1 + .4 * q)); c.setAttribute('opacity', .95 * (1 - q)); if (q >= 1) c.remove(); }}); }
      const jig = tt > .2 && tt < 1.3 ? 1.4 : 0;
      const lift = tt > 1.3 ? Math.sin(Math.PI * Math.min(1, (tt - 1.3) / .4)) : 0;
      setT(L, `translate(${(Math.random() - .5) * jig} ${(Math.random() - .5) * jig - 16 * lift})`);
      if (p >= 1) { L.a.firstChild.setAttribute('href', '#ing-' + L.id); crisp.remove(); cp.remove(); pool.remove(); bubbles.remove(); setT(L, ''); }
    }});
  }
  function hideLayer(o, animate) {
    o.hidden = true;
    if (!animate || reduced) { o.g.setAttribute('opacity', 0); if (o.fa) o.fa.setAttribute('opacity', 0); return; }
    anims.push({L: o, t: 0, dur: .3, update(p) { o.g.setAttribute('opacity', 1 - p); if (o.fa) o.fa.setAttribute('opacity', 1 - p); }, keep: true});
  }
  const setT = (L, tr) => { L.a.setAttribute('transform', tr); if (L.fa) L.fa.setAttribute('transform', tr); };
  function clipRect(L, attrs) {
    const cid = 'c' + Math.random().toString(36).slice(2);
    const cp = el('clipPath', {id: cid}, $('#animDefs')), rect = el('rect', attrs, cp);
    L.a.setAttribute('clip-path', `url(#${cid})`);
    return {rect, done() { L.a.removeAttribute('clip-path'); cp.remove(); }};
  }
  function splash(xw, yw, col, n = 7, r = 60) {
    for (let k = 0; k < n; k++) {
      const ang = Math.PI * (1.08 + .84 * k / (n - 1)), d = el('circle', {r: 7, fill: col, stroke: '#3a1f10', 'stroke-width': 2.5}, $('#fx'));
      anims.push({t: 0, dur: .42, update(p) {
        const e = easeOut(p, 2);
        d.setAttribute('cx', xw + Math.cos(ang) * r * e); d.setAttribute('cy', yw + Math.sin(ang) * r * .7 * e + 60 * p * p);
        d.setAttribute('r', 7 * (1 - p * .7)); d.setAttribute('opacity', 1 - p * p); if (p >= 1) d.remove();
      }});
    }
  }

  // What happens on contact — by what the item physically is
  function arrive(L) {
    const kind = L.info.kind, s = speed(), col = L.info.pour_color || '#c33';
    const snap = (amp, dur) => ({L, t: 0, dur: dur / s, update(p) {
      const w = Math.sin(Math.PI * Math.min(1, p * 1.7)) * (1 - p);
      setT(L, `scale(${1 + amp * .7 * w} ${1 - amp * w})`);
    }});
    switch (kind) {
      case 'fill': { const f0 = L.from || 0; return {L, t: 0, dur: .8 / s, update(p) { setT(L, `scale(1 ${Math.max(.001, f0 + (1 - f0) * easeOut(p, 2.2))})`); }}; }
      case 'sauce': case 'pour': return {L, t: 0, dur: .45 / s, update(p) { const e = easeOut(p); setT(L, `scale(${.3 + .7 * e} ${.12 + .88 * e})`); }};
      case 'coat': { const c = clipRect(L, {x: -700, y: -90, width: 1400, height: 0});
        return {L, t: 0, dur: .95 / s, update(p) { c.rect.setAttribute('height', 430 * easeOut(p, 2.2)); if (p >= 1) c.done(); }}; }
      case 'squeeze': { const bx = L.info.box, c = clipRect(L, {x: 0, y: -600, width: 0, height: 1200});
        return {L, t: 0, dur: .55 / s, update(p) { const e = easeOut(p, 2), half = Math.max(Math.abs(bx[0]), bx[0] + bx[2]) + 10;
          c.rect.setAttribute('x', -half * e); c.rect.setAttribute('width', 2 * half * e); if (p >= 1) c.done(); }}; }
      case 'sprinkle': return {L, t: 0, dur: .38 / s, update(p) { const e = easeOut(p, 2.5); setT(L, `translate(0 ${-14 * Math.sin(Math.PI * p)}) scale(${.42 + .58 * e} ${.62 + .38 * e})`); }};
      case 'pieces': {
        const kids = [...L.a.children], meta = kids.map((k, j) => {
          const bed = !!k.querySelector('[data-bed]');
          const bb = k.getBBox();
          return {k, bed, cx: bb.x + bb.width / 2, cy: bb.y + bb.height / 2, delay: bed ? 0 : (j / kids.length) * .32 + Math.random() * .06, h: 50 + Math.random() * 70, rot: (Math.random() - .5) * 120};
        });
        for (const m of meta) m.k.setAttribute('opacity', 0);
        return {L, t: 0, dur: .78 / s, update(p, t) {
          const tt = t * s;
          for (const m of meta) {
            if (m.bed) { m.k.setAttribute('opacity', Math.min(1, tt / .25)); continue; }
            const q = (tt - m.delay) / .26;
            if (q < 0) continue;
            m.k.setAttribute('opacity', 1);
            if (q < 1) m.k.setAttribute('transform', `translate(0 ${-m.h * (1 - q * q)}) rotate(${m.rot * (1 - q)} ${m.cx} ${m.cy})`);
            else { const b = Math.min(1, (q - 1) / .5); m.k.setAttribute('transform', `translate(0 ${-5 * Math.sin(Math.PI * b) * (1 - b)})`); }
          }
          if (p >= 1) for (const m of meta) { m.k.removeAttribute('transform'); m.k.setAttribute('opacity', 1); }
        }};
      }
      case 'float': return {L, t: 0, dur: .8 / s, update(p, t) { const q = t * s; setT(L, `translate(0 ${12 * Math.exp(-5 * q) * Math.sin(15 * q)})`); }};
      case 'melt': return {L, t: 0, dur: .55 / s, update(p) { const e = easeOut(p, 2); setT(L, `scale(${.9 + .1 * e} ${1.14 - .14 * e})`); }};
      case 'dollop': case 'pipe': return {L, t: 0, dur: .45 / s, update(p) { const w = Math.exp(-4 * p) * Math.cos(p * 6); setT(L, `scale(${1 + .13 * w} ${1 - .17 * w})`); }};
      case 'soft': return snap(.15, .4);
      case 'top': case 'close': return snap(.12, .38);
      case 'sheet': return snap(.05, .3);
      case 'scatter': return {L, t: 0, dur: .3 / s, update(p) { setT(L, `translate(0 ${-9 * Math.sin(Math.PI * p) * (1 - p)})`); }};
      case 'straw': return {L, t: 0, dur: .22 / s, update(p) { setT(L, `translate(0 ${-40 * (1 - easeOut(p))})`); }};
      default: return snap(.09, .3);
    }
  }


  // ---------------------------------------------------------------- scene API used by the game
  function reset() { for (const id of ['#backContents', '#dish', '#fronts', '#fx', '#animDefs']) $(id).replaceChildren(); pressWait = null; layers = []; anims = []; queue = []; placed = 0; lean = leanV = 0; }
  function setDish(d) { dish = d; plan = SS.DishPlan.layout(d); reset(); setBase(); return plan; }
  // place step i (after the game graded the catch). offset: visual sideways offset in kit units.
  function place(i, offset, animate, grade) {
    const anim = animate && !reduced;
    const L = addLayer(i, anim, offset || 0); placed = Math.max(placed, i + 1);
    const info = ING[plan[i].id];
    if (anim && hooks.liquidSplash && info.fall && info.fall[0] !== plan[i].id) splash(plateX + plan[i].x, plan[i].catchY, info.pour_color || '#c33', info.kind === 'fill' ? 6 : 5, info.kind === 'fill' ? 46 : 56);
    if (anim) leanV += (offset >= 0 ? 1 : -1) * (grade === 'perfect' ? 18 : grade === 'good' ? 40 : 70) * 0.5;
    if (placed === plan.length && !pressWait) finishDish(anim);
    return { busy: L.busy || 0, pressing: !!pressWait };
  }
  function jumpTo(n) { reset(); setBase(); for (let i = 0; i < n && i < plan.length; i++) { addLayer(i, false); placed++; } if (n >= plan.length && plan.length) finishDish(false); }
  function press() { if (pressWait) { doPress(); return true; } return false; }
  function pressDone() { if (placed === plan.length) finishDish(!reduced); }
  // advance animations; extraLean: the game's stability lean in degrees
  function tick(dt, px, extraLean) {
    clock += dt;
    while (queue.length && queue[0].at <= clock) queue.shift().fn();
    if (px !== undefined) plateX = px;
    leanV += (-lean * 90 - leanV * 9) * dt; lean += leanV * dt;
    $('#dishRoot').setAttribute('transform', `translate(${plateX} 0) rotate(${lean + (extraLean || 0)} 0 ${BASE_Y})`);
    const cur = anims; anims = [];
    const live = cur.filter(a => { a.t += dt; const p = Math.min(1, Math.max(0, a.t) / a.dur); a.update(p, a.t); if (p >= 1 && a.L && !a.keep) setT(a.L, ''); return p < 1; });
    anims = live.concat(anims);
  }
  return { setDish, place, jumpTo, reset, press, pressDone, tick, splash: (x, y, c) => splash(x, y, c), get plan() { return plan; }, get dish() { return dish; }, get pressWaiting() { return !!pressWait; }, get busy() { return anims.some(a => a.keep && a.dur < 1e8); } };
};
