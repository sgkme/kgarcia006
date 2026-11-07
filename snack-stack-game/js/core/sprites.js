// Snack Stack \u2014 hand-drawn vector sprite library (canvas paths, no tracing).
// One-to-one flat 2D replicas of the 12 reference art sheets: solid fills, dark brown outline, small flat highlights.
// Every sprite draws inside a 200x200 box centred on (0,0). The white sticker rim is added by SS.Art at render time.
// Godot port: export each sprite to PNG with tools/export (gallery page) or redraw the same shapes as Polygon2D/SVG.
window.SS = window.SS || {};

SS.Sprites = (function () {
  const O = "#3b2314", LW = 7, NAVY = "#1d2b4a";
  const TAU = Math.PI * 2;
  // ---------- path + paint helpers ----------
  function E(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); }
  function RR(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function P(c, pts, closed) { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); if (closed !== false) c.closePath(); }
  // smooth closed curve through points (Catmull-Rom)
  function S(c, pts) { const n = pts.length; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 0; i < n; i++) { const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]; c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]); } c.closePath(); }
  function darker(hex, a) { const n = parseInt(hex.slice(1), 16); const f = v => Math.round(v * (1 - a)).toString(16).padStart(2, "0"); return "#" + f(n >> 16 & 255) + f(n >> 8 & 255) + f(n & 255); }
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // wobbly ellipse points
  function wob(x, y, rx, ry, n, amp, seed, rot) { const r = rng(seed), pts = []; const cr = Math.cos(rot || 0), sr = Math.sin(rot || 0); for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 1 + (r() - 0.5) * amp, px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k; pts.push([x + px * cr - py * sr, y + px * sr + py * cr]); } return pts; }
  // scalloped / frilly ring of points
  function frill(x, y, rx, ry, n, depth, rot) { const pts = []; const cr = Math.cos(rot || 0), sr = Math.sin(rot || 0); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU, k = i % 2 ? 1 - depth : 1; const px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k; pts.push([x + px * cr - py * sr, y + px * sr + py * cr]); } return pts; }
  // Outline-then-fill: every part is stroked thick first, then filled, so only the outer silhouette shows an outline.
  function part(c, list, lw) {
    c.save(); c.lineJoin = "round"; c.lineCap = "round"; c.strokeStyle = O; c.lineWidth = (lw || LW) * 2;
    for (const [f] of list) { f(); c.stroke(); }
    for (const [f, col] of list) { if (!col) continue; f(); c.fillStyle = col; c.fill(); }
    c.restore();
  }
  const fill = (c, col) => { c.fillStyle = col; c.fill(); };
  const strokeIt = (c, col, w) => { c.save(); c.lineJoin = "round"; c.lineCap = "round"; c.strokeStyle = col; c.lineWidth = w; c.stroke(); c.restore(); };
  function hl(c, x, y, rx, ry, rot, a) { c.save(); c.globalAlpha = a === undefined ? 0.55 : a; E(c, x, y, rx, ry, rot); fill(c, "#ffffff"); c.restore(); }
  function dots(c, n, seed, x, y, rx, ry, col, r0, r1) { const r = rng(seed); c.fillStyle = col; for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()); E(c, x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d, r0 + r() * (r1 - r0), (r0 + r() * (r1 - r0)) * 0.8, r() * 3); c.fill(); } }
  function lines(c, segs, col, w) { c.save(); c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; c.lineJoin = "round"; for (const s of segs) { c.beginPath(); s.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); } c.restore(); }
  function clipTo(c, f, body) { c.save(); f(); c.clip(); body(); c.restore(); }

  // ---------- shared generators ----------
  // Thick round slice seen from above: side band (darker) peeks out under the top face.
  function disc(c, o) {
    const rx = o.rx || 92, ry = o.ry || 70, t = o.t === undefined ? 12 : o.t, y = o.y || 0, x = o.x || 0, rot = o.rot || 0;
    const side = () => E(c, x, y + t / 2, rx, ry, rot), top = () => E(c, x, y - t / 2, rx, ry, rot);
    part(c, [[side, o.side], [top, o.top]], o.lw);
    return { x, y: y - t / 2, rx, ry, top };
  }
  function puddle(c, col, dark, o) { // glossy sauce puddle with splash drops (sheet 9 / 11)
    o = o || {}; const pts = o.pts || wob(0, 18, 96, 50, 16, 0.08, o.seed || 3);
    if (o.drops !== false) { const dr = o.dropsAt || [[46, -70, 8, 18, 0.3], [74, -62, 7, 12, 0.6], [86, -34, 6, 7, 0], [30, -46, 6, 8, 0]]; dr.forEach(([x, y, rx, ry, r]) => part(c, [[() => E(c, x, y, rx, ry, r), col]])); }
    part(c, [[() => S(c, pts), col]]);
    if (dark) { c.save(); S(c, pts); c.clip(); E(c, 0, 52, 110, 32); fill(c, dark); c.restore(); }
    hl(c, -40, 2, 38, 11, -0.1, 0.45); hl(c, 26, -12, 14, 6, -0.2, 0.6);
  }
  function splat(c, col, dark, seed) { // flat splat with satellite droplets (sheet 10)
    const pts = []; const r = rng(seed || 7); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, k = 0.75 + r() * 0.35 + (i % 4 === 0 ? 0.18 : 0); pts.push([Math.cos(a) * 80 * k, Math.sin(a) * 52 * k + 6]); }
    [[-82, -36, 9], [74, -44, 8], [-74, 52, 6], [86, 34, 7], [60, 60, 5]].forEach(([x, y, s]) => part(c, [[() => E(c, x, y, s, s * 0.85), col]]));
    part(c, [[() => S(c, pts), col]]);
    if (dark) { c.save(); S(c, pts); c.clip(); E(c, 0, 66, 120, 30); fill(c, dark); c.restore(); }
    hl(c, -26, -14, 26, 9, -0.2, 0.55); hl(c, 26, -20, 9, 4, 0, 0.7);
  }
  function drink(c, col, light, dark, seed) { // liquid splash with droplets (sheet 12)
    const pts = [[-90, 14], [-70, -10], [-36, -4], [-14, -26], [18, -14], [46, -30], [80, -10], [92, 16], [64, 40], [20, 36], [-24, 44], [-66, 40]];
    [[30, -62, 10], [52, -78, 7], [62, -48, 9], [-10, -56, 6], [80, -66, 5]].forEach(([x, y, s]) => part(c, [[() => E(c, x, y, s, s), col]]));
    part(c, [[() => S(c, pts), col]]);
    c.save(); S(c, pts); c.clip(); E(c, 0, 52, 120, 26); fill(c, dark); c.restore();
    if (light) { c.save(); S(c, pts); c.clip(); E(c, -40, -12, 44, 16, -0.1); fill(c, light); c.restore(); }
    hl(c, -30, 6, 26, 8, -0.1, 0.45); hl(c, 36, -6, 12, 5, 0, 0.6);
  }
  function drizzle(c, col, light, o) { // zig-zag sauce line (sheets 3/9/10/11)
    o = o || {}; const pts = o.pts || [[-82, -48], [-48, 46], [-14, -50], [18, 48], [50, -50], [84, 40]];
    const path = () => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; c.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); } c.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); };
    const w = o.w || 30;
    if (o.drops) o.drops.forEach(([x, y, s]) => part(c, [[() => E(c, x, y, s, s), col]]));
    c.save(); c.lineCap = "round"; c.lineJoin = "round";
    path(); c.strokeStyle = O; c.lineWidth = w + LW * 2; c.stroke();
    path(); c.strokeStyle = col; c.lineWidth = w; c.stroke();
    c.translate(-3, -4); path(); c.strokeStyle = light; c.lineWidth = w * 0.28; c.globalAlpha = 0.8; c.stroke();
    c.restore();
  }
  function swirl(c, cols, o) { // piped swirl: stacked rounded pillows + small curled tip
    o = o || {}; const tiers = o.tiers || 3, base = o.base || 94, step = o.step || 32;
    const T = []; for (let i = 0; i < tiers; i++) T.push({ w: base * (1 - i * 0.2), y: 48 - i * step, h: 36 - i * 3 });
    const top = T[T.length - 1], tipY = top.y - top.h - 6;
    const parts = T.map((t, i) => [() => E(c, 0, t.y, t.w, t.h), i === 0 && cols[1] ? cols[1] : cols[0]]);
    parts.push([() => { c.beginPath(); c.moveTo(-top.w * 0.55, top.y - 4); c.bezierCurveTo(-top.w * 0.55, tipY - 8, -6, tipY - 4, 8, tipY - 20); c.bezierCurveTo(20, tipY - 2, top.w * 0.6, tipY, top.w * 0.55, top.y - 4); c.closePath(); }, cols[0]]);
    part(c, parts);
    T.forEach((t, i) => { if (i) { E(c, 0, t.y, t.w - 1, t.h - 1); fill(c, cols[0]); } });
    c.save(); c.strokeStyle = cols[2]; c.lineWidth = 6; c.lineCap = "round";
    T.forEach(t => { c.beginPath(); c.ellipse(0, t.y + 2, t.w * 0.82, t.h * 0.7, 0, 0.12 * Math.PI, 0.88 * Math.PI); c.stroke(); });
    c.restore();
    hl(c, -base * 0.48, 40, 14, 7, -0.3, 0.8); hl(c, -top.w * 0.3, top.y - 10, 10, 6, -0.4, 0.75);
  }
  function mound(c, cols, o) { // smooth single dollop (meringue / cream dollop)
    o = o || {};
    part(c, [[() => { c.beginPath(); c.moveTo(-86, 46); c.bezierCurveTo(-92, 0, -40, -10, -10, -46); c.quadraticCurveTo(0, -66, 6, -48); c.bezierCurveTo(30, -10, 92, 0, 86, 46); c.quadraticCurveTo(0, 64, -86, 46); c.closePath(); }, cols[0]]]);
    c.save(); c.strokeStyle = cols[1]; c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(-50, 28); c.quadraticCurveTo(0, 10, 50, 26); c.stroke(); c.beginPath(); c.moveTo(-6, -36); c.quadraticCurveTo(12, -10, 40, 4); c.stroke(); c.restore();
    hl(c, -40, 10, 18, 8, -0.5, 0.7);
  }
  function cube(c, x, y, s, top, left, right, o) { // isometric cube (ice, sugar, gummy, jelly)
    o = o || {}; const h = s * 0.55, d = s * 0.95;
    const T = () => P(c, [[x, y - h], [x + s, y - h * 0.15 - h * 0.85 * 0], [x, y + h * 0.7], [x - s, y]].map((p, i) => i === 1 ? [x + s, y] : p));
    const top_ = () => P(c, [[x, y - h], [x + s, y - h * 0.1], [x, y + h * 0.8], [x - s, y - h * 0.1]]);
    const L = () => P(c, [[x - s, y - h * 0.1], [x, y + h * 0.8], [x, y + h * 0.8 + d], [x - s, y - h * 0.1 + d]]);
    const R = () => P(c, [[x + s, y - h * 0.1], [x, y + h * 0.8], [x, y + h * 0.8 + d], [x + s, y - h * 0.1 + d]]);
    part(c, [[L, left], [R, right], [top_, top]], o.lw);
    if (o.round) { /* gummies: soft corners handled by thick round joins */ }
    c.save(); c.strokeStyle = o.edge || "rgba(255,255,255,.7)"; c.lineWidth = 3; c.lineCap = "round";
    c.beginPath(); c.moveTo(x - s * 0.7, y - h * 0.05); c.lineTo(x - s * 0.1, y - h * 0.62); c.stroke(); c.restore();
    if (o.shine !== false) hl(c, x - s * 0.55, y + h * 0.9, s * 0.12, s * 0.28, 0, 0.6);
    void T;
  }
  function ball(c, x, y, r, col, dark, o) { part(c, [[() => E(c, x, y, r, r), col]]); if (dark) { c.save(); E(c, x, y, r, r); c.clip(); E(c, x + r * 0.35, y + r * 0.4, r * 0.9, r * 0.8); fill(c, dark); c.restore(); } hl(c, x - r * 0.35, y - r * 0.38, r * 0.28, r * 0.18, -0.6, (o && o.a) || 0.75); }
  function citrusRound(c, rind, pith, flesh, seg, o) { // lemon / lime / orange / grapefruit slice
    o = o || {}; const ry = o.ry || 88, t = o.t || 0;
    disc(c, { rx: 90, ry, t, side: rind, top: rind });
    E(c, 0, -t / 2, 78, ry - 12); fill(c, pith); E(c, 0, -t / 2, 70, ry - 20); fill(c, flesh);
    c.save(); c.strokeStyle = pith; c.lineWidth = 5; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; c.beginPath(); c.moveTo(0, -t / 2); c.lineTo(Math.cos(a) * 70, -t / 2 + Math.sin(a) * (ry - 20)); c.stroke(); } c.restore();
    c.save(); c.fillStyle = seg; for (let i = 0; i < 10; i++) { const a = (i + 0.5) / 10 * TAU; E(c, Math.cos(a) * 40, -t / 2 + Math.sin(a) * (ry - 20) * 0.57, 7, 3, a); c.fill(); } c.restore();
    E(c, 0, -t / 2, 9, 9 * (ry / 88)); fill(c, pith);
  }
  function citrusWedge(c, rind, pith, flesh, rot) { // half-moon wedge (sheet 8)
    c.save(); c.rotate(rot || -0.35); c.translate(0, -26); c.scale(1.08, 1.12);
    const outer = () => { c.beginPath(); c.moveTo(-90, 10); c.lineTo(90, 10); c.ellipse(0, 10, 90, 84, 0, 0, Math.PI, false); c.closePath(); };
    part(c, [[outer, rind]]);
    c.beginPath(); c.moveTo(-76, 10); c.lineTo(76, 10); c.ellipse(0, 10, 76, 70, 0, 0, Math.PI, false); c.closePath(); fill(c, pith);
    c.beginPath(); c.moveTo(-68, 6); c.lineTo(68, 6); c.ellipse(0, 6, 68, 62, 0, 0, Math.PI, false); c.closePath(); fill(c, flesh);
    c.save(); c.strokeStyle = pith; c.lineWidth = 5; for (let i = 1; i < 6; i++) { const a = i / 6 * Math.PI; c.beginPath(); c.moveTo(0, 8); c.lineTo(Math.cos(a) * 68, 8 + Math.sin(a) * 62); c.stroke(); } c.restore();
    c.beginPath(); c.moveTo(-92, 10); c.lineTo(92, 10); c.strokeStyle = "#fffbe6"; c.lineWidth = 8; c.stroke();
    c.restore();
  }
  function leaf(c, col, vein, o) { // single leaf with midrib (spinach / basil / mint); veins stay inside the leaf
    o = o || {}; c.save(); c.rotate(o.rot === undefined ? -0.7 : o.rot);
    const L = o.len || 92, W = o.w || 62;
    const halfW = t => Math.sin(t * Math.PI) * W * (1 - 0.18 * t);
    let pts = null;
    if (o.serrated) { pts = []; const N = 26; for (let i = 0; i <= N; i++) { const t = i / N; pts.push([-L + 2 * L * t, -halfW(t) * (i % 2 ? 0.9 : 1.03)]); } for (let i = N; i >= 0; i--) { const t = i / N; pts.push([-L + 2 * L * t, halfW(t) * (i % 2 ? 0.9 : 1.03)]); } }
    const shape = pts ? () => P(c, pts) : () => { c.beginPath(); c.moveTo(-L, 0); c.bezierCurveTo(-L * 0.4, -W * 1.25, L * 0.7, -W, L, 0); c.bezierCurveTo(L * 0.7, W, -L * 0.4, W * 1.25, -L, 0); c.closePath(); };
    const stem = o.stem ? () => RR(c, -L - 34, -5, 44, 10, 5) : null;
    part(c, (stem ? [[stem, vein]] : []).concat([[shape, col]]));
    c.save(); shape(); c.clip();
    if (o.dark) { c.beginPath(); c.rect(-L, 0, 2 * L, W * 1.4); fill(c, o.dark); }
    c.lineCap = "round"; c.strokeStyle = vein;
    c.lineWidth = 6; c.beginPath(); c.moveTo(-L + 4, 0); c.quadraticCurveTo(0, -3, L * 0.82, 0); c.stroke();
    c.lineWidth = 3.5; for (let i = 0; i < 5; i++) { const t = 0.16 + i * 0.15, x = -L + 2 * L * t, hw = halfW(t) * 0.72; [-1, 1].forEach(sg => { c.beginPath(); c.moveTo(x, sg * 1); c.quadraticCurveTo(x + L * 0.1, sg * hw * 0.5, x + L * 0.2, sg * hw); c.stroke(); }); }
    c.restore();
    c.restore();
  }

  function frillyLeaf(c, col, light, vein, o) { // ruffled lettuce leaf with a pale midrib
    o = o || {}; c.save(); c.rotate(o.rot === undefined ? -0.45 : o.rot);
    const pts = []; const N = 30; for (let i = 0; i < N; i++) { const a = i / N * TAU, ruf = i % 2 ? 0.88 : 1.0; const rx = 96 * (1 - 0.18 * Math.max(0, Math.cos(a))), ry = 70; pts.push([Math.cos(a) * rx * ruf, Math.sin(a) * ry * ruf]); }
    part(c, [[() => S(c, pts), col]]);
    c.save(); S(c, pts); c.clip(); E(c, 8, 10, 74, 46); fill(c, light); c.restore();
    c.save(); S(c, pts); c.clip(); lines(c, [[[-84, 6], [-30, 4], [76, -4]]], vein, 11);
    const vs = []; for (let i = -2; i <= 2; i++) { const x = i * 30; vs.push([[x - 10, 3], [x + 10, -44]], [[x - 10, 5], [x + 10, 46]]); } lines(c, vs, vein, 5); c.restore();
    c.restore();
  }
  function cheeseSquare(c, col, side, o) { // diamond slice with thickness
    o = o || {}; const s = o.s || 92, t = o.t || 10;
    const top = () => P(c, [[0, -s * 0.72], [s, 0 - 6], [0, s * 0.62], [-s, -6]]);
    const sd = () => P(c, [[-s, -6], [0, s * 0.62], [s, -6], [s, -6 + t], [0, s * 0.62 + t], [-s, -6 + t]]);
    part(c, [[sd, side], [top, col]]);
    if (o.holes) o.holes.forEach(([x, y, r]) => { E(c, x, y, r, r * 0.8); fill(c, O); E(c, x - r * 0.15, y - r * 0.2, r * 0.55, r * 0.35); fill(c, "rgba(255,255,255,.25)"); });
    if (o.flecks) dots(c, 26, 5, 0, -4, s * 0.55, s * 0.36, o.flecks, 2.5, 4);
    hl(c, -s * 0.38, -s * 0.18, s * 0.2, 6, -0.6, 0.45);
  }
  function breadSlice(c, crust, face, o) { // sandwich bread / toast (sheet 6)
    o = o || {};
    const outer = () => { c.beginPath(); c.moveTo(-74, 74); c.lineTo(-74, -30); c.bezierCurveTo(-110, -40, -96, -96, -40, -84); c.quadraticCurveTo(0, -100, 40, -84); c.bezierCurveTo(96, -96, 110, -40, 74, -30); c.lineTo(74, 74); c.quadraticCurveTo(74, 84, 64, 84); c.lineTo(-64, 84); c.quadraticCurveTo(-74, 84, -74, 74); c.closePath(); };
    part(c, [[outer, crust]]);
    c.save(); c.translate(0, -2); c.scale(0.84, 0.84); outer(); c.restore(); fill(c, face);
    if (o.grill) lines(c, [[[-46, 26], [20, -50]], [[-30, 52], [44, -30]], [[-6, 62], [56, 2]]], o.grill, 12);
    dots(c, 12, 9, 0, 0, 56, 60, o.speck || "rgba(200,140,70,.35)", 2, 3.5);
  }
  function ring(c, outer, inner, o) { // donut / bagel; glaze modelled on the reference: one piece, deep round drips, darker front band, recessed hole
    o = o || {}; const rx = o.rx || 92, ry = o.ry || 62, t = o.t || 34, ty = -t / 2;
    const body = () => { c.beginPath(); c.ellipse(0, ty, rx, ry, 0, Math.PI, 0); c.lineTo(rx, t / 2); c.ellipse(0, t / 2, rx, ry, 0, 0, Math.PI); c.closePath(); };
    part(c, [[body, o.side || outer]]);
    E(c, 0, ty, rx - 1, ry - 1); fill(c, outer);
    const hx = rx * 0.27, hy = ry * 0.25, hyc = ty - 4;
    if (o.glaze) {
      const g = o.glaze, gd = darker(g, 0.14), gdd = darker(g, 0.36);
      const drips = [[-0.78, 0.55], [-0.4, 0.85], [0, 1.0], [0.4, 0.75], [0.78, 0.6]];
      const dough = u => t / 2 + ry * Math.sqrt(Math.max(0, 1 - u * u)) - 8; // lowest y the glaze may reach at u
      const pieces = [() => E(c, 0, ty - 2, rx - 4, ry - 4)].concat(drips.map(([u, k]) => () => { const x = u * rx, w = 36 - Math.abs(u) * 8, y0 = ty, base = ty + ry * 0.46, y1 = base + (dough(u) - base) * k; RR(c, x - w / 2, y0, w, y1 - y0, w / 2); }));
      // scallops between drips (keeps the skirt connected)
      pieces.push(() => { c.beginPath(); c.ellipse(0, ty, rx - 4, ry * 0.5, 0, 0, Math.PI); c.closePath(); });
      c.save(); c.lineJoin = "round"; c.strokeStyle = O; c.lineWidth = LW * 2; pieces.forEach(f => { f(); c.stroke(); }); c.fillStyle = gd; pieces.forEach(f => { f(); c.fill(); }); c.restore();
      // lighter top face with a soft wavy lower edge
      c.save(); c.beginPath(); pieces.forEach(f => { f(); c.save(); c.restore(); }); c.restore();
      c.save(); c.beginPath(); c.moveTo(-rx + 8, ty); c.ellipse(0, ty - 2, rx - 10, ry - 10, 0, Math.PI, 0); for (let k = 0; k <= 40; k++) { const u = 1 - k / 20, x = u * (rx - 10); c.lineTo(x, ty + ry * 0.4 + Math.cos(u * Math.PI * 2.5) * 6); } c.closePath(); c.fillStyle = g; c.fill(); c.restore();
      // drip highlights + big gloss streak
      c.save(); c.globalAlpha = 0.55; c.strokeStyle = "#fff"; c.lineCap = "round"; c.lineWidth = 10; c.beginPath(); c.ellipse(0, ty - 2, rx - 22, ry - 18, 0, Math.PI * 1.08, Math.PI * 1.36); c.stroke(); c.lineWidth = 9; c.beginPath(); c.moveTo(-rx + 24, ty + 6); c.lineTo(-rx + 26, ty + 9); c.stroke(); c.restore();
      if (o.sprinkles) {
        const r = rng(o.seed || 4), pts = [];
        for (let tries = 0; tries < 900 && pts.length < 24; tries++) { // even scatter: keep a minimum gap between sprinkles
          const a = r() * TAU, d = 0.36 + Math.sqrt(r()) * 0.55, x = Math.cos(a) * (rx - 16) * d, y = ty - 2 + Math.sin(a) * (ry - 12) * d;
          if (Math.abs(x) < hx + 14 && Math.abs(y - hyc) < hy + 12) continue; if (y > ty + ry * 0.42) continue;
          if (pts.some(p => Math.hypot(p[0] - x, (p[1] - y) * 1.4) < 23)) continue; pts.push([x, y, r() * 3.14, i => 0]);
        }
        pts.forEach(([x, y, rot], i) => { c.save(); c.translate(x, y); c.rotate(rot);
          c.save(); c.translate(1.5, 3.5); RR(c, -10, -4, 20, 8, 4); c.fillStyle = "rgba(40,20,10,.28)"; c.fill(); c.restore();
          RR(c, -10, -4, 20, 8, 4); c.lineJoin = "round"; c.lineWidth = 3.5; c.strokeStyle = O; c.stroke(); c.fillStyle = o.sprinkles[i % o.sprinkles.length]; c.fill();
          RR(c, -6, -2.5, 8, 2.2, 1.1); c.fillStyle = "rgba(255,255,255,.75)"; c.fill(); c.restore(); });
      }
      // recessed hole: glaze-coloured inner wall rings
      E(c, 0, hyc, hx + 16, hy + 12); fill(c, gd); E(c, 0, hyc + 3, hx + 8, hy + 6); fill(c, gdd);
    } else {
      hl(c, -rx * 0.5, ty - ry * 0.35, rx * 0.2, 8, -0.4, 0.55);
      E(c, 0, hyc, hx + 14, hy + 10); fill(c, darker(outer, 0.1)); E(c, 0, hyc + 3, hx + 7, hy + 5); fill(c, darker(outer, 0.25));
    }
    // hole outline then punch through (see-through)
    E(c, 0, hyc + 4, hx, hy); c.lineWidth = LW * 1.6; c.strokeStyle = O; c.stroke();
    c.save(); c.globalCompositeOperation = "destination-out"; E(c, 0, hyc + 4, hx, hy); c.fill(); c.restore();
  }


  function cupBody(c, o) { // straight-sided cup in 3/4 view
    const tw = o.tw || 58, bw = o.bw || 40, top = o.top || -80, bot = o.bot || 86, ry = o.ry || 14;
    const body = () => { c.beginPath(); c.moveTo(-tw, top); c.lineTo(-bw, bot - 6); c.quadraticCurveTo(-bw, bot + ry * 0.6, 0, bot + ry * 0.6); c.quadraticCurveTo(bw, bot + ry * 0.6, bw, bot - 6); c.lineTo(tw, top); c.closePath(); };
    return { body, tw, bw, top, bot, ry };
  }
  function mug(c, col, dark, o) { // handle and body share one outline; clear mugs keep the drink visible
    o = o || {}; const clear = !!o.clear;
    const handle = () => { c.beginPath(); c.ellipse(58, 4, 36, 40, 0, -1.8, 1.8); }; // ends tuck under the body
    const body = o.bowl ? () => { c.beginPath(); c.moveTo(-70, -62); c.bezierCurveTo(-74, 40, -40, 82, 0, 82); c.bezierCurveTo(40, 82, 74, 40, 70, -62); c.closePath(); } : () => { c.beginPath(); c.moveTo(-66, -62); c.lineTo(-62, 54); c.quadraticCurveTo(-60, 82, -30, 82); c.lineTo(30, 82); c.quadraticCurveTo(60, 82, 62, 54); c.lineTo(66, -62); c.closePath(); };
    const rim = () => E(c, 0, -62, 66, 16);
    c.save(); c.lineCap = "round"; c.lineJoin = "round";
    handle(); c.strokeStyle = O; c.lineWidth = 22 + LW * 2; c.stroke();          // outline pass: handle + body + rim together
    c.lineWidth = LW * 2; body(); c.stroke(); rim(); c.stroke();
    handle(); c.strokeStyle = col; c.lineWidth = 22; c.stroke();                   // fills: handle covers the body outline where they join
    body(); c.fillStyle = col; c.fill(); rim(); c.fillStyle = o.rim || col; c.fill();
    c.restore();
    E(c, 0, -60, 56, 11); fill(c, o.inside || dark);
    if (FILL && clear) liquid(c, body, -56, 80, true);
    // side shade: solid on opaque mugs, a light tint on glass so the drink shows through
    c.save(); body(); c.clip(); c.globalAlpha = clear ? 0.18 : 1; c.beginPath(); c.rect(30, -70, 50, 160); fill(c, dark); c.globalAlpha = clear ? 0.06 : 0.18; c.beginPath(); c.rect(30, -70, 50, 160); fill(c, "#000"); c.restore();
    c.save(); c.globalAlpha = clear ? 0.28 : 0.45; RR(c, -50, -40, 10, 92, 5); fill(c, "#ffffff"); c.restore();
    // outline re-pass, skipping the handle joint so the join stays seamless
    c.save(); c.beginPath(); c.rect(-200, -200, 400, 400); c.rect(56, -36, 44, 80); c.clip("evenodd"); c.lineJoin = "round"; c.strokeStyle = O; c.lineWidth = LW * 2; body(); c.stroke(); rim(); c.stroke(); c.restore();
    E(c, 0, -60, 56, 11); fill(c, o.inside || dark);
    if (FILL && FILL.level >= 0.98) { E(c, 0, -59, 54, 10); fill(c, FILL.col || "#7a3a18"); hl(c, -24, -61, 10, 3, 0, 0.55); }
  }
  function plasticCup(c, o) {
    o = o || {}; const cb = cupBody(c, { tw: o.tw || 58, bw: o.bw || 40, top: o.top || -74, bot: o.bot || 88 });
    part(c, [[cb.body, o.col || "#d6e8f7"]]);
    const isClear = !o.col || o.col === "#d6e8f7";
    cb.dome = o.lid === "dome" && LID.on;
    if (LID.straw && isClear) strawSeg(c, cb, "in");
    if (o.stripes) { c.save(); cb.body(); c.clip(); for (let i = -4; i < 5; i++) { c.beginPath(); c.moveTo(i * 30 - 6, -80); c.lineTo(i * 22 - 4, 100); c.lineTo(i * 22 + 8, 100); c.lineTo(i * 30 + 10, -80); c.closePath(); fill(c, o.stripes); } c.restore(); }
    if (o.shade) { c.save(); cb.body(); c.clip(); c.beginPath(); c.rect(34, -70, 60, 170); fill(c, o.shade); c.restore(); }
    if (o.sleeve) { c.save(); cb.body(); c.clip(); c.beginPath(); c.rect(-90, -26, 180, 64); fill(c, o.sleeve); c.restore(); c.save(); cb.body(); c.clip(); lines(c, [[[-90, -26], [90, -26]], [[-90, 38], [90, 38]]], O, 6); c.restore(); }
    if (isClear) liquid(c, cb.body, cb.top + 6, cb.bot + 4);
    c.save(); c.globalAlpha = isClear ? 0.26 : 0.5; RR(c, -48, -40, 10, 100, 5); fill(c, "#fff"); c.restore();
    c.save(); c.lineJoin = "round"; c.strokeStyle = O; c.lineWidth = LW * 2; cb.body(); c.stroke(); c.restore();
    part(c, [[() => E(c, 0, cb.top, cb.tw + 6, 14), o.rim || "#eaf3fb"]]);
    E(c, 0, cb.top + 1, cb.tw - 6, 9); fill(c, o.inside || "#bfd7ee");
    if (FILL && FILL.level >= 0.98 && !o.lid && !(o.paperLid && LID.on && LID.drop >= 1)) { E(c, 0, cb.top + 2, cb.tw - 8, 8); fill(c, FILL.col); hl(c, -cb.tw * 0.35, cb.top, 8, 3, 0, 0.6); }
    const flatOn = o.lid === "flat" && LID.on, domeOn = o.lid === "dome" && LID.on;
    if (LID.straw && isClear && !flatOn && !domeOn) strawSeg(c, cb, "out");
    if (flatOn) { part(c, [[() => E(c, 0, cb.top - 6, cb.tw + 10, 18), "#e3eef8"]]); E(c, 0, cb.top - 10, 22, 6); fill(c, "#c3d8ec");
      if (LID.straw && isClear) strawSeg(c, cb, "flat"); else { E(c, 0, cb.top - 10, 10, 3); fill(c, "#a8c3de"); } }
    if (domeOn) {
      const dome = () => { c.beginPath(); c.ellipse(0, cb.top - 4, cb.tw + 6, 70, 0, Math.PI, 0); c.closePath(); };
      part(c, [[dome, "rgba(227,238,248,.5)"]]);
      part(c, [[() => E(c, 0, cb.top - 2, cb.tw + 10, 10), "#e3eef8"]]);
      if (LID.straw) {
        // straw rises out of the drink, over the rim band and up through the dome (seen through the clear plastic)
        strawSeg(c, cb, "lid");
        c.save(); dome(); c.clip(); dome(); c.fillStyle = "rgba(227,238,248,.35)"; c.fill(); c.restore();
        c.save(); c.beginPath(); c.ellipse(0, cb.top - 4, cb.tw + 6, 70, 0, Math.PI, 0); c.lineWidth = LW * 2; c.strokeStyle = O; c.stroke(); c.restore();
        strawSeg(c, cb, "top");
      }
      hl(c, -26, cb.top - 40, 12, 22, -0.5, 0.7); E(c, 0, cb.top - 70, 9, 4); fill(c, "#b8cfe6");
    }
    if (o.paperLid && LID.on) { const T = cb.top, w = cb.tw; c.save(); c.translate(0, -(1 - LID.drop) * 110); part(c, [[() => { c.beginPath(); c.moveTo(-w - 9, T - 30); c.lineTo(w + 9, T - 30); c.lineTo(w + 7, T + 4); c.quadraticCurveTo(0, T + 22, -w - 7, T + 4); c.closePath(); }, o.paperLid], [() => RR(c, -w + 6, T - 52, w * 2 - 12, 26, 9), o.paperLid]]); E(c, 0, T - 52, w - 14, 6); fill(c, "rgba(0,0,0,.22)"); c.save(); c.globalAlpha = 0.3; c.fillStyle = "#fff"; RR(c, -w + 2, T - 24, 22, 8, 4); c.fill(); c.restore(); c.restore(); }
  }

  // ---------- the sprites (sheet order, row by row) ----------
  // Liquid fill (glass filling animation): set by drawFilled(), read by cup/mug painters.
  let FILL = null; const LID = { on: true, straw: false, drop: 1 };
  function liquid(c, clip, top, bot, noOutline) {
    if (!FILL) return; const f = FILL, lv = Math.max(0, Math.min(1, f.level)), y = bot - (bot - top) * lv, t = f.t || 0;
    c.save(); clip(); c.clip();
    c.beginPath(); c.moveTo(-120, bot + 40); c.lineTo(-120, y); for (let x = -120; x <= 120; x += 8) c.lineTo(x, y + Math.sin(x * 0.06 + t * 5) * 4 * (lv > 0.02 && lv < 0.98 ? 1 : 0.3)); c.lineTo(120, bot + 40); c.closePath();
    c.fillStyle = f.col || "#7a3a18"; c.globalAlpha = f.alpha || 0.8; c.fill(); c.globalAlpha = 1;
    c.beginPath(); for (let x = -120; x <= 120; x += 8) { const yy = y + Math.sin(x * 0.06 + t * 5) * 4; x === -120 ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 5; c.stroke();
    c.fillStyle = "rgba(255,255,255,.55)"; for (let i = 0; i < 7; i++) { const bx = -30 + ((i * 37) % 60), by = bot - ((t * 60 + i * 41) % Math.max(1, bot - y)); if (by > y + 6) { c.beginPath(); c.arc(bx, by, 3 + (i % 3), 0, TAU); c.fill(); } }
    if (!noOutline) { clip(); c.lineWidth = LW * 2; c.strokeStyle = O; c.lineJoin = "round"; c.stroke(); }
    c.restore();
  }
  const R = {};
  // Sheet 1: cups & mugs
  R.mug_red = c => mug(c, "#e53b2c", "#b82718", { inside: "#9e1f12" });
  R.mug_blue = c => mug(c, "#8fc1ec", "#5f97cc", { inside: "#3f5f86" });
  R.mug_glass = c => { mug(c, "#d9e9f6", "#b8d2ea", { inside: "#c8dcef", bowl: true, clear: true }); };
  R.teacup_saucer = c => { part(c, [[() => E(c, 0, 56, 98, 30), "#f1e6d6"]]); E(c, 0, 52, 60, 14); fill(c, "#e3d3bd"); c.save(); c.translate(0, -6); c.scale(0.9, 0.82); mug(c, "#f7efe2", "#e0d1bb", { inside: "#cbb69a", bowl: true }); c.restore(); };
  R.coffee_cup_black_lid = c => plasticCup(c, { col: "#f3ead9", rim: "#f3ead9", sleeve: "#b5733a", paperLid: "#2f2f33", top: -46, inside: "#d9c4a0" });
  R.coffee_cup_white_lid = c => plasticCup(c, { col: "#f3ead9", rim: "#f3ead9", sleeve: "#a8642e", paperLid: "#f7f0e2", top: -46, inside: "#d9c4a0", shade: "rgba(0,0,0,0)" });
  R.plastic_cup = c => plasticCup(c, {});
  R.plastic_cup_dome = c => { c.translate(0, 14); plasticCup(c, { lid: "dome", top: -40 }); };
  R.dome_lid = c => { c.translate(0, 60); const w = 58; part(c, [[() => { c.beginPath(); c.ellipse(0, 0, w + 6, 70, 0, Math.PI, 0); c.closePath(); }, "#e3eef8"]]); hl(c, -26, -36, 12, 22, -0.5, 0.7); E(c, 0, -70, 9, 4); fill(c, "#b8cfe6"); part(c, [[() => E(c, 0, 2, w + 10, 10), "#e3eef8"]]); };
  R.flat_lid = c => { part(c, [[() => E(c, 0, 0, 70, 20), "#e3eef8"]]); E(c, 0, -4, 24, 7); fill(c, "#c3d8ec"); E(c, 0, -4, 11, 3); fill(c, "#a8c3de"); };
  R.plastic_cup_flat_lid = c => { plasticCup(c, { lid: "flat" }); };
  R.cup_striped = c => plasticCup(c, { col: "#ffffff", stripes: "#e53b2c", rim: "#ffffff", inside: "#f1e1d0" });
  R.cup_red = c => plasticCup(c, { col: "#e53b2c", rim: "#e53b2c", inside: "#a91f14", shade: "rgba(0,0,0,.15)" });
  R.cup_blue = c => plasticCup(c, { col: "#2f6fe0", rim: "#2f6fe0", inside: "#173f95", shade: "rgba(0,0,0,.15)" });
  R.glass_tumbler = c => { plasticCup(c, { tw: 62, bw: 54, col: "#d6e8f7" }); lines(c, [[[-30, -40], [-26, 74]], [[0, -42], [0, 76]], [[30, -40], [26, 74]]], "rgba(150,185,220,.6)", 4); };
  R.mason_jar_mug = c => { mug(c, "#d6e8f7", "#b4d0ea", { inside: "#c3d9ee", clear: true }); part(c, [[() => RR(c, -62, -80, 124, 24, 8), "#e3eef8"]]); lines(c, [[[-56, -72], [56, -72]], [[-56, -64], [56, -64]]], "rgba(150,185,220,.8)", 3); };
  R.wine_glass = c => { part(c, [[() => E(c, 0, 84, 50, 12), "#d6e8f7"], [() => RR(c, -6, 20, 12, 66, 5), "#d6e8f7"], [() => { c.beginPath(); c.moveTo(-60, -78); c.bezierCurveTo(-80, 10, -30, 30, 0, 30); c.bezierCurveTo(30, 30, 80, 10, 60, -78); c.closePath(); }, "#d6e8f7"]]); E(c, 0, -78, 56, 12); fill(c, "#bfd7ee"); hl(c, -40, -30, 8, 26, 0.2, 0.7); };

  // Sheet 2: savory fillings
  R.tortilla_round = c => { part(c, [[() => S(c, wob(0, 0, 94, 82, 12, 0.06, 2)), "#f6e3bd"]]); dots(c, 16, 21, 0, 0, 74, 62, "#e8bf7c", 4, 8); hl(c, -40, -40, 22, 8, -0.5, 0.45); };
  // Rolled wrap: tilted burrito, kraft-paper sleeve on the lower end, fillings peeking out of the open top.
  R.wrap_rolled = c => {
    c.rotate(-0.62);
    const body = () => RR(c, -92, -44, 172, 88, 44), mouth = () => E(c, 72, 0, 22, 42);
    part(c, [[body, "#f3dfb6"], [mouth, "#efd6a6"]]);
    // tortilla shading + fold seam, then the paper sleeve, all kept inside the body outline
    const sleeve = () => { c.beginPath(); c.moveTo(-110, -60); for (let i = 0; i <= 6; i++) c.lineTo(-28 + (i % 2) * 9, -50 + i * 100 / 6); c.lineTo(-110, 60); c.closePath(); };
    clipTo(c, body, () => {
      E(c, -10, 36, 110, 20); fill(c, "#e6c793"); dots(c, 10, 4, 10, -8, 56, 20, "#e2b56f", 3, 6); lines(c, [[[-10, -42], [14, -4], [-8, 42]]], "#dcb77b", 5);
      sleeve(); fill(c, "#fbf6ec");
      c.save(); sleeve(); c.clip(); c.fillStyle = "#e8372b"; for (let i = 0; i < 5; i++) c.fillRect(-98 + i * 16, -60, 5, 120); E(c, -60, 42, 80, 14); fill(c, "rgba(59,35,20,.14)"); c.restore();
      c.beginPath(); for (let i = 0; i <= 6; i++) { const x = -28 + (i % 2) * 9, y = -50 + i * 100 / 6; i ? c.lineTo(x, y) : c.moveTo(x, y); } strokeIt(c, O, 5);
    });
    // open end: inside shadow, then lettuce, chicken and tomato peeking out
    E(c, 72, 0, 15, 34); fill(c, "#8a5a2c");
    c.save(); c.translate(80, 0);
    part(c, [[() => S(c, frill(4, -14, 16, 18, 7, 0.28)), "#7cc243"]], 4);
    part(c, [[() => RR(c, -6, 2, 26, 12, 6), "#d99a52"]], 4);
    part(c, [[() => E(c, 6, 20, 13, 9), "#e8402f"]], 4); E(c, 6, 19, 6, 3); fill(c, "#ff8a6e");
    c.restore();
    hl(c, 20, -30, 28, 6, 0, 0.5);
  };
  R.chicken_strips = c => { [[-30, -34, -0.35], [6, 0, -0.35], [36, 36, -0.35]].forEach(([x, y, r]) => { c.save(); c.translate(x, y); c.rotate(r); part(c, [[() => RR(c, -72, -24, 144, 48, 24), "#f2c48a"]]); lines(c, [[[-34, -14], [-50, 14]], [[-6, -14], [-22, 14]], [[22, -14], [6, 14]], [[50, -14], [34, 14]]], "#c9783a", 8); hl(c, -40, -12, 16, 4, 0, 0.5); c.restore(); }); };
  R.ground_beef = c => { part(c, [[() => S(c, frill(0, 4, 92, 74, 16, 0.08)), "#8a4a24"]]); const r = rng(8); for (let i = 0; i < 40; i++) { const a = r() * TAU, d = Math.sqrt(r()); E(c, Math.cos(a) * 76 * d, 4 + Math.sin(a) * 60 * d, 10, 9); fill(c, i % 2 ? "#a35c2c" : "#743a1b"); } [[-30, -20, "#e8452f"], [20, -36, "#3fa34d"], [40, 10, "#e8452f"], [-10, 26, "#3fa34d"], [-50, 16, "#e8452f"], [56, -14, "#3fa34d"], [4, -4, "#e8452f"]].forEach(([x, y, col]) => { c.save(); c.translate(x, y); c.rotate(0.3); RR(c, -7, -7, 14, 14, 3); fill(c, col); c.restore(); }); };
  R.lettuce_leaf = c => { c.rotate(-0.2); const pts = frill(0, -6, 82, 84, 15, 0.1); part(c, [[() => S(c, pts), "#7cc243"]]); c.save(); S(c, pts); c.clip(); E(c, 14, 30, 60, 50, 0.2); fill(c, "#a7dc6a"); c.restore(); c.save(); S(c, pts); c.clip(); lines(c, [[[0, -70], [10, 0], [22, 76]]], "#d7f2a6", 12); lines(c, [[[6, -30], [-40, -46]], [[8, -6], [-48, 0]], [[12, 20], [-34, 40]], [[6, -30], [46, -48]], [[10, -4], [54, -4]], [[14, 22], [50, 36]]], "#d7f2a6", 5); c.restore(); };
  R.spinach_leaf = c => leaf(c, "#2e8a35", "#7bc96a", { rot: -0.75, len: 88, w: 64, dark: "#24702b", stem: true });
  R.tomato_slice = c => tomatoSlice(c);
  R.cucumber_slice = c => { part(c, [[() => E(c, 0, 0, 90, 82), "#2e8b2e"]]); E(c, 0, 0, 80, 72); fill(c, "#d9f2b4"); E(c, 0, 0, 74, 66); fill(c, "#c7ec97"); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2; c.save(); c.translate(Math.cos(a) * 26, Math.sin(a) * 24); c.rotate(a + Math.PI / 2); E(c, 0, 0, 9, 16); fill(c, "#9fd85e"); c.restore(); } };
  R.avocado_slice = c => avocadoSlice(c);
  R.pepper_ring_red = c => pepperRing(c, "#e53528", "#ff7a5c");
  R.pepper_ring_yellow = c => pepperRing(c, "#ffc21a", "#ffe27a");
  R.red_onion_slice = c => onionSlice(c);
  R.mushroom_slice = c => mushroomSlice(c);
  R.shredded_cheese = c => { const r = rng(12); for (let i = 0; i < 48; i++) { const an = r() * 6.283, d = Math.sqrt(r()); c.save(); c.translate(Math.cos(an) * 70 * d, Math.sin(an) * 54 * d); c.rotate(r() * Math.PI); part(c, [[() => RR(c, -34, -4, 68, 8, 4), i % 3 ? "#ffc533" : "#ffde70"]], 3.5); c.restore(); } };
  R.black_beans = c => { const r = rng(15); const pts = []; for (let i = 0; i < 26; i++) pts.push([(r() - 0.5) * 150, (r() - 0.5) * 120, r() * 3]); pts.sort((a, b) => a[1] - b[1]).forEach(([x, y, a]) => { part(c, [[() => E(c, x, y, 26, 17, a), "#3e2418"]], 4); hl(c, x - 8, y - 5, 9, 4, a, 0.35); }); };
  function tomatoSlice(c, o) {
    o = o || {}; const ry = o.ry || 80;
    disc(c, { rx: 92, ry, t: o.t || 12, side: "#c5231a", top: "#e8392e" });
    E(c, 0, -6, 76, ry - 14); fill(c, "#ff5a3e");
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU - Math.PI / 2; c.save(); c.translate(Math.cos(a) * 46, -6 + Math.sin(a) * (ry - 14) * 0.6); c.rotate(a); E(c, 0, 0, 20, 12); fill(c, "#e8392e"); c.fillStyle = "#ffcc33"; [-7, 0, 7].forEach(dx => { E(c, dx, 0, 3.5, 2.4); c.fill(); }); c.restore(); }
    E(c, 0, -6, 16, 12); fill(c, "#e8392e");
  }
  function crescent(c, skin, flesh, light, rot) { c.save(); c.rotate(rot); const outer = () => { c.beginPath(); c.moveTo(-96, 14); c.bezierCurveTo(-70, 100, 78, 84, 96, -66); c.bezierCurveTo(48, -46, -34, -28, -96, 14); c.closePath(); }; part(c, [[outer, skin]]); c.beginPath(); c.moveTo(-84, 12); c.bezierCurveTo(-60, 80, 64, 68, 86, -54); c.bezierCurveTo(42, -36, -30, -22, -84, 12); fill(c, flesh); if (light) { c.beginPath(); c.moveTo(-70, 8); c.bezierCurveTo(-46, 40, 40, 30, 72, -40); c.bezierCurveTo(34, -26, -26, -14, -70, 8); fill(c, light); } c.restore(); }
  function avocadoSlice(c) { crescent(c, "#3f8f22", "#b9de5a", "#e6f08e", -0.05); }
  function pepperRing(c, col, light) { const pts = []; for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, k = 0.86 + 0.14 * Math.abs(Math.cos(a * 2.5)); pts.push([Math.cos(a) * 92 * k, Math.sin(a) * 82 * k]); } const inner = []; for (let i = 0; i < 40; i++) { const a = i / 40 * TAU, k = 0.9 + 0.1 * Math.abs(Math.cos(a * 2.5)); inner.push([Math.cos(a) * 56 * k, Math.sin(a) * 46 * k]); } c.save(); S(c, pts); S(c, inner); c.restore(); c.save(); c.beginPath(); const path = (ps, rev) => { const p = rev ? ps.slice().reverse() : ps; const n = p.length; c.moveTo(p[0][0], p[0][1]); for (let i = 0; i < n; i++) { const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n]; c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]); } c.closePath(); }; path(pts); path(inner, true); c.lineWidth = LW * 2; c.strokeStyle = O; c.lineJoin = "round"; c.stroke(); c.fillStyle = col; c.fill("evenodd"); c.restore(); c.save(); c.beginPath(); const mid = pts.map(([x, y]) => [x * 0.82, y * 0.8]); S(c, mid); c.strokeStyle = light; c.lineWidth = 6; c.globalAlpha = 0.7; c.stroke(); c.restore(); }
  function onionSlice(c, o) { o = o || {}; disc(c, { rx: 92, ry: o.ry || 74, t: 12, side: "#9b1e7a", top: "#b52f92" }); [[78, "#f7d4ec"], [68, "#c94aa6"], [58, "#f7d4ec"], [48, "#c94aa6"], [38, "#f7d4ec"], [28, "#c94aa6"], [16, "#f7d4ec"]].forEach(([r, col]) => { E(c, 0, -6, r, r * ((o.ry || 74) / 92)); fill(c, col); }); }
  function mushroomSlice(c) { const cap = () => { c.beginPath(); c.moveTo(-88, -6); c.bezierCurveTo(-90, -80, 90, -80, 88, -6); c.quadraticCurveTo(60, 18, 26, 6); c.lineTo(30, 70); c.quadraticCurveTo(30, 90, 8, 90); c.lineTo(-8, 90); c.quadraticCurveTo(-30, 90, -30, 70); c.lineTo(-26, 6); c.quadraticCurveTo(-60, 18, -88, -6); c.closePath(); }; c.rotate(-0.25); part(c, [[cap, "#f4e6d0"]]); c.beginPath(); c.moveTo(-56, -4); c.quadraticCurveTo(-34, 14, -22, 0); c.quadraticCurveTo(-30, -18, -56, -4); fill(c, "#8a5a3a"); c.beginPath(); c.moveTo(56, -4); c.quadraticCurveTo(34, 14, 22, 0); c.quadraticCurveTo(30, -18, 56, -4); fill(c, "#8a5a3a"); hl(c, -30, -46, 26, 9, -0.2, 0.6); }

  // Sheet 3: snacks & dessert toppings
  R.fries = c => { const r = rng(31); const list = []; for (let i = 0; i < 20; i++) { const an = r() * 6.283, d = Math.sqrt(r()); list.push([Math.cos(an) * 58 * d, Math.sin(an) * 40 * d + (i < 10 ? -8 : 8), (r() - 0.5) * 1.4 + (i % 2 ? 0.6 : -0.6), 78 + r() * 34]); } list.forEach(([x, y, a, len]) => { c.save(); c.translate(x, y); c.rotate(a); part(c, [[() => RR(c, -len / 2, -13, len, 26, 6), "#f2a624"]], 6); RR(c, -len / 2 + 4, -11, len - 8, 12, 4); fill(c, "#ffd34d"); RR(c, -len / 2 + 6, -9, len * 0.35, 4, 2); fill(c, "#fff0a8"); c.restore(); }); };
  R.popcorn = c => { const r = rng(32); const ks = [[-52, 30, 30], [0, 40, 32], [52, 30, 30], [-30, -6, 31], [28, -8, 33], [-2, -42, 30], [-62, -26, 24], [62, -30, 24]]; ks.forEach(([x, y, s], k) => { const lobes = []; const n = 5 + (k % 2); for (let i = 0; i < n; i++) { const a = i / n * TAU + r(); lobes.push([x + Math.cos(a) * s * 0.42, y + Math.sin(a) * s * 0.36, s * (0.42 + r() * 0.14)]); } const f = () => { c.beginPath(); lobes.forEach(([lx, ly, lr]) => { c.moveTo(lx + lr, ly); c.arc(lx, ly, lr, 0, TAU); }); }; c.save(); c.lineJoin = "round"; f(); c.lineWidth = 12; c.strokeStyle = O; c.stroke(); f(); c.fillStyle = "#fffaf0"; c.fill(); c.save(); f(); c.clip(); E(c, x + 6, y + s * 0.5, s * 0.8, s * 0.3); fill(c, "#f1e2c2"); c.restore(); const hx = x + (k % 2 ? 6 : -8), hy = y + s * 0.18; c.save(); c.translate(hx, hy); c.rotate(k); c.beginPath(); c.moveTo(-7, -3); c.quadraticCurveTo(0, -9, 7, -3); c.quadraticCurveTo(0, 6, -7, -3); c.lineWidth = 3; c.strokeStyle = O; c.stroke(); c.fillStyle = "#e8a23a"; c.fill(); c.restore(); hl(c, x - s * 0.25, y - s * 0.25, s * 0.18, s * 0.11, -0.4, 0.9); c.restore(); }); };
  R.nuggets = c => { [[-44, -26, -0.35, 52, 38, 41], [44, -30, 0.25, 50, 36, 42], [-34, 32, 0.15, 54, 38, 43], [42, 34, -0.2, 48, 36, 44]].forEach(([x, y, a, w, h, seed]) => { c.save(); c.translate(x, y); c.rotate(a); const sh = () => S(c, wob(0, 0, w, h, 11, 0.28, seed)); part(c, [[sh, "#d98a2c"]]); c.save(); sh(); c.clip(); E(c, -4, -6, w * 0.82, h * 0.7); fill(c, "#f0aa48"); dots(c, 22, seed, -2, -4, w * 0.8, h * 0.7, "#ffd27a", 2.2, 4); dots(c, 14, seed + 50, 0, 0, w * 0.85, h * 0.8, "#b8661e", 1.8, 3.2); c.restore(); hl(c, -w * 0.35, -h * 0.4, w * 0.2, 5, -0.3, 0.5); c.restore(); }); };
  R.ice_cubes = c => iceCubes(c);
  R.lemon_slice = c => citrusRound(c, "#ffcc1f", "#fff6c4", "#ffe14d", "#ffc21a", { ry: 80, t: 8 });
  R.blue_jelly = c => jellyDisc(c, "#2e9ef0", "#1b78c9", "#9fd6ff");
  R.yellow_jelly = c => jellyDisc(c, "#fff08a", "#f2d44a", "#ffffff");
  R.pink_jelly = c => jellyDisc(c, "#f9b9cd", "#e996b0", "#ffe3ec", true);
  R.cookie_chunk = c => cookie(c);
  R.whipped_cream = c => swirl(c, ["#fffaf0", "#f6ead6", "#e9d8bd"]);
  R.caramel_drizzle = c => drizzle(c, "#d98a2b", "#ffd08a");
  R.chocolate_drizzle = c => drizzle(c, "#5a2a16", "#a2643c");
  R.cherry = c => cherry(c);
  R.sprinkles = c => sprinkles(c, 70);
  R.pretzel = c => pretzel(c);
  function iceCubes(c) { cube(c, 22, -46, 46, "#e6f4ff", "#bfe0fb", "#a7d2f6", { edge: "#ffffff" }); cube(c, -34, -2, 46, "#e6f4ff", "#bfe0fb", "#a7d2f6", { edge: "#ffffff" }); cube(c, 40, 14, 46, "#e6f4ff", "#bfe0fb", "#a7d2f6", { edge: "#ffffff" }); }
  function jellyDisc(c, col, dark, light, swirlIt) { disc(c, { rx: 92, ry: 66, t: 14, side: dark, top: col }); if (swirlIt) { lines(c, [[[-40, -6], [-10, -30], [24, -12], [0, 10], [30, 24]]], light, 10); } else { lines(c, [[[-60, 0], [-20, -20], [20, 0], [60, -18]]], light, 5); [[-30, -24, 8], [40, -26, 6], [10, 16, 9], [56, 10, 5], [-56, 14, 5]].forEach(([x, y, r]) => { E(c, x, y, r, r); c.strokeStyle = light; c.lineWidth = 3; c.stroke(); }); } hl(c, -46, -30, 20, 7, -0.3, 0.6); }
  function cookie(c, o) { o = o || {}; disc(c, { rx: 90, ry: 76, t: 12, side: "#b8763a", top: "#d9a066" }); dots(c, 14, 70, 0, -6, 72, 60, "#a8642c", 2, 4); [[-30, -26, 0.3], [30, 10, -0.4], [-20, 30, 0.6], [44, -34, 0.1]].forEach(([x, y, a]) => { c.save(); c.translate(x, y); c.rotate(a); part(c, [[() => RR(c, -14, -11, 28, 22, 5), "#5a2f17"]], 4); RR(c, -10, -9, 12, 6, 3); fill(c, "#7b4527"); c.restore(); }); }
  function cherry(c) { lines(c, [[[0, -10], [26, -60], [60, -86]]], O, 14); lines(c, [[[0, -10], [26, -60], [60, -86]]], "#5f8f2a", 7); part(c, [[() => { c.beginPath(); c.moveTo(0, -14); c.bezierCurveTo(-30, -40, -70, -10, -64, 30); c.bezierCurveTo(-58, 80, 58, 80, 64, 30); c.bezierCurveTo(70, -10, 30, -40, 0, -14); c.closePath(); }, "#e0242a"]]); c.save(); E(c, 20, 40, 46, 34); c.clip(); c.restore(); hl(c, -30, -2, 12, 18, 0.5, 0.75); part(c, [[() => E(c, 60, -88, 8, 8), "#8a5a2a"]], 4); }
  function sprinkles(c, seed) { const cols = ["#ff5a5a", "#ffd23a", "#4fc35a", "#3c8cf0", "#ff8ad0", "#ffffff", "#ff9a2e"]; const r = rng(seed); for (let i = 0; i < 18; i++) { c.save(); c.translate((r() - 0.5) * 150, (r() - 0.5) * 130); c.rotate(r() * Math.PI); part(c, [[() => RR(c, -26, -9, 52, 18, 9), cols[i % cols.length]]], 4); hl(c, -10, -3, 10, 3, 0, 0.6); c.restore(); } }
  function pretzel(c) { const p = () => { c.beginPath(); c.moveTo(-50, 60); c.bezierCurveTo(-100, 20, -100, -70, -40, -70); c.bezierCurveTo(10, -70, 30, 0, 40, 50); c.moveTo(50, 60); c.bezierCurveTo(100, 20, 100, -70, 40, -70); c.bezierCurveTo(-10, -70, -30, 0, -40, 50); c.moveTo(-60, 50); c.quadraticCurveTo(0, 90, 60, 50); }; c.save(); c.lineCap = "round"; c.lineJoin = "round"; p(); c.strokeStyle = O; c.lineWidth = 42; c.stroke(); p(); c.strokeStyle = "#c8742d"; c.lineWidth = 28; c.stroke(); p(); c.strokeStyle = "#e59a48"; c.lineWidth = 8; c.translate(-3, -4); c.stroke(); c.restore(); const r = rng(9); c.fillStyle = "#fff6e6"; for (let i = 0; i < 16; i++) { const a = r() * TAU; c.save(); c.translate(Math.cos(a) * 60 * Math.sqrt(r() + 0.2), Math.sin(a) * 60 * Math.sqrt(r() + 0.2)); c.rotate(a); RR(c, -4, -3, 8, 6, 2); c.fill(); c.restore(); } }

  // Sheet 4: sweets
  R.donut_plain = c => ring(c, "#f2b05a", null, { side: "#d98d34", hole: "#3b2314" });
  R.donut_chocolate = c => ring(c, "#f2b05a", null, { side: "#d98d34", glaze: "#6e2f17" });
  R.donut_pink = c => ring(c, "#f2b05a", null, { side: "#d98d34", glaze: "#ff8fb8" });
  R.donut_choc_sprinkles = c => ring(c, "#f2b05a", null, { side: "#d98d34", glaze: "#6e2f17", sprinkles: ["#ff5a5a", "#ffd23a", "#4fc35a", "#3c8cf0", "#ffffff", "#ff8ad0", "#ff9a2e"], seed: 5 });
  R.donut_pink_sprinkles = c => ring(c, "#f2b05a", null, { side: "#d98d34", glaze: "#ff8fb8", sprinkles: ["#ff5a5a", "#ffd23a", "#4fc35a", "#3c8cf0", "#ffffff", "#ff8ad0", "#ff9a2e"], seed: 6 });
  R.donut_vanilla_sprinkles = c => ring(c, "#f2b05a", null, { side: "#d98d34", glaze: "#fff3dc", sprinkles: ["#ff5a5a", "#ffd23a", "#4fc35a", "#3c8cf0", "#ffffff", "#ff8ad0", "#ff9a2e"], seed: 7 });
  R.donut_caramel = c => ring(c, "#f2b05a", null, { side: "#d98d34", glaze: "#e3982f" });
  R.donut_blue_sprinkles = c => ring(c, "#f2b05a", null, { side: "#d98d34", glaze: "#7cc8ff", sprinkles: ["#ff5a5a", "#ffd23a", "#4fc35a", "#3c8cf0", "#ffffff", "#ff8ad0", "#ff9a2e"], seed: 8 });
  R.donut_mint_choc = c => ring(c, "#7a4024", null, { side: "#5a2a16", glaze: "#9ee8c8", sprinkles: ["#5a2a16", "#7a4024"], seed: 9 });
  R.muffin = c => { const cup = () => { c.beginPath(); c.moveTo(-74, 0); c.lineTo(-56, 82); c.lineTo(56, 82); c.lineTo(74, 0); c.closePath(); }; part(c, [[cup, "#fbf3e2"], [() => S(c, [[-88, 6], [-84, -40], [-40, -74], [20, -78], [74, -52], [92, -6], [60, 14], [0, 18], [-60, 14]]), "#f5b84d"]]); c.save(); cup(); c.clip(); for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(i * 12, 10); c.lineTo(i * 9, 90); c.strokeStyle = "#e3d2b4"; c.lineWidth = 4; c.stroke(); } c.restore(); dots(c, 12, 44, 0, -36, 60, 26, "#e09a32", 2, 3.5); hl(c, -40, -46, 18, 8, -0.4, 0.55); };
  R.frosting_pink = c => swirl(c, ["#ff8fb8", "#ff8fb8", "#e05a88"]);
  R.frosting_vanilla = c => swirl(c, ["#fff4d6", "#fff4d6", "#e7cf92"]);
  R.strawberry = c => strawberry(c);
  R.blueberry = c => { ball(c, 0, 4, 80, "#3a49b8", "#2b3794"); part(c, [[() => P(c, [[0, -48], [8, -36], [22, -40], [14, -26], [24, -14], [8, -16], [0, -2], [-8, -16], [-24, -14], [-14, -26], [-22, -40], [-8, -36]]), "#1c2470"]], 3); };
  R.banana_slice = c => bananaSlice(c);
  R.kiwi_slice = c => kiwi(c);
  R.granola = c => { const r = rng(55); for (let i = 0; i < 16; i++) { const x = (r() - 0.5) * 140, y = (r() - 0.5) * 100; c.save(); c.translate(x, y); c.rotate(r() * 3); part(c, [[() => E(c, 0, 0, 22, 14), i % 4 === 0 ? "#b56a2e" : "#e9b45f"]], 4); lines(c, [[[-12, 0], [12, 0]]], "#c78a3c", 3); c.restore(); } part(c, [[() => E(c, 50, -20, 18, 16), "#8a1f3a"]], 4); hl(c, 44, -26, 5, 3, 0, 0.6); };
  R.meringue = c => mound(c, ["#fffaf0", "#eadbc2"]);
  R.whipped_cream_tall = c => swirl(c, ["#ffffff", "#f3ead9", "#e3d6c0"], { tiers: 4, base: 70 });
  R.sprinkles_2 = c => sprinkles(c, 71);
  R.chocolate_chips = c => chocChips(c, 72);
  function strawberry(c) { part(c, [[() => { c.beginPath(); c.moveTo(-4, 86); c.bezierCurveTo(-80, 50, -86, -40, -40, -54); c.quadraticCurveTo(0, -62, 40, -54); c.bezierCurveTo(86, -40, 80, 50, -4, 86); c.closePath(); }, "#e8322e"]]); c.save(); c.fillStyle = "#ffc94a"; const r = rng(3); for (let i = 0; i < 16; i++) { const x = (r() - 0.5) * 110, y = -30 + r() * 90; if (Math.abs(x) > 60 - y * 0.3) continue; E(c, x, y, 3.5, 5); c.fill(); } c.restore(); part(c, [[() => P(c, [[-56, -56], [-30, -60], [-40, -86], [-6, -66], [10, -96], [20, -66], [50, -80], [40, -54], [66, -46], [30, -40], [0, -48], [-30, -40]]), "#3fa34d"]], 5); hl(c, -40, -20, 10, 20, 0.3, 0.6); }
  function bananaSlice(c) { disc(c, { rx: 88, ry: 74, t: 14, side: "#f0d47a", top: "#fff3c4" }); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2; c.save(); c.translate(Math.cos(a) * 16, -7 + Math.sin(a) * 14); c.rotate(a + Math.PI / 2); E(c, 0, 0, 4, 12); fill(c, "#b58a3a"); c.restore(); } hl(c, -40, -36, 18, 6, -0.3, 0.6); }
  function kiwi(c) { disc(c, { rx: 88, ry: 78, t: 14, side: "#7a5223", top: "#8db92c" }); E(c, 0, -7, 78, 68); fill(c, "#9dcc33"); E(c, 0, -7, 30, 26); fill(c, "#f1f4c8"); c.fillStyle = "#2b1a10"; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; c.save(); c.translate(Math.cos(a) * 44, -7 + Math.sin(a) * 38); c.rotate(a); E(c, 0, 0, 6, 2.6); c.fill(); c.restore(); } lines(c, Array.from({ length: 18 }, (_, i) => { const a = (i + 0.5) / 18 * TAU; return [[Math.cos(a) * 32, -7 + Math.sin(a) * 28], [Math.cos(a) * 66, -7 + Math.sin(a) * 58]]; }), "rgba(255,255,255,.35)", 3); }
  function chocChips(c, seed) { const r = rng(seed); const list = []; for (let i = 0; i < 9; i++) list.push([(r() - 0.5) * 140, (r() - 0.5) * 110]); list.sort((a, b) => a[1] - b[1]).forEach(([x, y]) => { part(c, [[() => { c.beginPath(); c.moveTo(x - 26, y + 18); c.quadraticCurveTo(x - 20, y - 6, x, y - 26); c.quadraticCurveTo(x + 20, y - 6, x + 26, y + 18); c.quadraticCurveTo(x, y + 26, x - 26, y + 18); c.closePath(); }, "#5a2f1a"]], 5); hl(c, x - 6, y - 4, 4, 9, 0.4, 0.4); }); }

  // Sheet 5: breakfast
  R.english_muffin = c => { disc(c, { rx: 92, ry: 72, t: 16, side: "#e2b26a", top: "#f2cf8a" }); dots(c, 40, 80, 0, -8, 76, 60, "#d9a050", 3, 7); };
  R.flatbread_round = c => { disc(c, { rx: 92, ry: 72, t: 16, side: "#e8cfa0", top: "#f6e3bd" }); dots(c, 10, 81, 0, -8, 70, 54, "#e8c48a", 4, 7); };
  R.waffle = c => waffle(c);
  R.pancake = c => { disc(c, { rx: 92, ry: 72, t: 16, side: "#e8b46a", top: "#e9a85a" }); E(c, 0, -10, 80, 58); fill(c, "#efb466"); [[-30, -20], [24, 10], [40, -30], [-10, 26]].forEach(([x, y]) => { E(c, x, y, 7, 5); fill(c, "#ffd08a"); }); };
  R.croissant = c => croissant(c);
  R.fried_egg = c => friedEgg(c);
  R.scrambled_egg = c => { part(c, [[() => S(c, frill(0, 0, 92, 70, 12, 0.14)), "#ffd633"]]); const r = rng(5); for (let i = 0; i < 16; i++) { E(c, (r() - 0.5) * 130, (r() - 0.5) * 90, 14, 10, r() * 3); fill(c, i % 2 ? "#ffe772" : "#f7c21f"); } };
  R.bacon_strip = c => bacon(c);
  R.sausage_patty = c => { disc(c, { rx: 92, ry: 72, t: 16, side: "#5e2f1a", top: "#7a4026" }); lines(c, [[[-40, 30], [20, -44]], [[-10, 44], [50, -30]], [[22, 50], [70, -6]]], "#4e2414", 9); dots(c, 20, 6, 0, -8, 70, 56, "#8f5234", 2, 4); };
  R.hash_brown = c => { const sh = () => S(c, wob(0, 0, 92, 70, 18, 0.1, 19)); part(c, [[sh, "#e8962f"]]); c.save(); sh(); c.clip(); E(c, -4, -6, 80, 56); fill(c, "#f6b24a"); const r = rng(19); for (let i = 0; i < 70; i++) { const a = r() * TAU, d = Math.sqrt(r()), x = Math.cos(a) * 84 * d, y = Math.sin(a) * 62 * d, rot = r() * 3.14, len = 14 + r() * 16; c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); c.moveTo(-len / 2, 0); c.quadraticCurveTo(0, -4, len / 2, 1); c.lineCap = "round"; c.lineWidth = 5; c.strokeStyle = i % 3 === 0 ? "#c4701e" : i % 3 === 1 ? "#ffd27a" : "#e08a2a"; c.stroke(); c.restore(); } c.lineWidth = 12; c.strokeStyle = "rgba(170,90,20,.45)"; sh(); c.stroke(); c.restore(); hl(c, -36, -28, 22, 7, -0.3, 0.45); };
  R.cheese_square = c => cheeseSquare(c, "#ffc21a", "#e89a00");
  R.avocado_slice_2 = c => avocadoSlice(c);
  R.mushroom_2 = c => mushroomSlice(c);
  R.leaf_lettuce_2 = c => leaf(c, "#3f9a35", "#9bd66a", { rot: -0.6, len: 84, w: 66, serrated: true, dark: "#2f7f2a" });
  R.tomato_2 = c => tomatoSlice(c);
  function waffle(c) { disc(c, { rx: 92, ry: 74, t: 16, side: "#c9782e", top: "#e8963c" }); c.save(); E(c, 0, -8, 78, 60); c.clip(); for (let i = -4; i <= 4; i++) for (let j = -3; j <= 3; j++) { c.save(); c.translate(i * 28 + j * 4, -8 + j * 22 - i * 4); c.rotate(-0.15); RR(c, -10, -8, 20, 16, 4); fill(c, "#b9661f"); c.restore(); } c.restore(); E(c, 0, -8, 78, 60); c.strokeStyle = "#f2a64c"; c.lineWidth = 6; c.stroke(); }
  function croissant(c) { // one cloud-like silhouette, smooth fill, simple curved dividers between portions (sheets 5/6)
    c.scale(0.9, 0.9); c.translate(0, 14);
    const B = [[-90, 26, 20, 24, 0.35], [-72, -6, 28, 34, 0.8], [-40, -30, 36, 42, 1.18], [4, -40, 44, 46, 1.55], [46, -26, 36, 42, 1.92], [74, -2, 28, 34, 2.3], [90, 26, 20, 24, 2.75]];
    const union = () => { c.beginPath(); B.forEach(([x, y, rx, ry, a]) => { c.moveTo(x + Math.cos(a) * rx, y + Math.sin(a) * rx); c.ellipse(x, y, rx, ry, a, 0, TAU); }); };
    c.save(); c.lineJoin = "round"; union(); c.strokeStyle = O; c.lineWidth = LW * 2; c.stroke(); union(); c.fillStyle = "#f2a03a"; c.fill("nonzero"); c.restore();
    c.save(); union(); c.clip();
    // soft darker underside following the inner curve (one band, not per segment)
    c.beginPath(); c.moveTo(-120, 52); c.bezierCurveTo(-60, -4, 60, -4, 120, 52); c.lineWidth = 30; c.strokeStyle = "#e08a2e"; c.stroke();
    // one long highlight along the top of the arch
    c.beginPath(); c.moveTo(-70, -22); c.bezierCurveTo(-40, -62, 40, -66, 66, -34); c.lineWidth = 9; c.lineCap = "round"; c.strokeStyle = "#ffc76a"; c.globalAlpha = 0.8; c.stroke(); c.globalAlpha = 1;
    // divider lines: gentle curves from the inner edge to the outer edge between portions
    const ax = 0, ay = 46;
    for (let k = 0; k < B.length - 1; k++) {
      const mx = (B[k][0] + B[k + 1][0]) / 2, my = (B[k][1] + B[k + 1][1]) / 2;
      const ang = Math.atan2(my - ay, mx - ax), d = Math.hypot(mx - ax, my - ay), bow = (k < 3 ? -1 : 1) * 0.22;
      const p0 = [ax + Math.cos(ang) * (d - 40), ay + Math.sin(ang) * (d - 40)], p1 = [ax + Math.cos(ang) * (d + 44), ay + Math.sin(ang) * (d + 44)], m = [ax + Math.cos(ang + bow) * d, ay + Math.sin(ang + bow) * d];
      c.beginPath(); c.moveTo(p0[0], p0[1]); c.quadraticCurveTo(m[0], m[1], p1[0], p1[1]); c.lineWidth = 7; c.lineCap = "round"; c.strokeStyle = "#b8641c"; c.stroke();
    }
    c.restore();
  }



  function friedEgg(c) { part(c, [[() => S(c, wob(0, 4, 94, 76, 11, 0.22, 17)), "#fffaf0"]]); part(c, [[() => E(c, 2, -6, 40, 36), "#ffb81f"]]); E(c, 2, -6, 34, 30); fill(c, "#ffc933"); hl(c, -12, -20, 12, 7, -0.4, 0.8); }
  function bacon(c) { c.save(); c.rotate(-0.4); const N = 40, A = 12, f = x => Math.sin(x * 0.075) * A; const top = [], bot = []; for (let i = 0; i <= N; i++) { const x = -96 + 192 * i / N; top.push([x, -24 + f(x)]); bot.push([x, 24 + f(x)]); } const shape = () => { c.beginPath(); top.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); for (let i = N; i >= 0; i--) c.lineTo(bot[i][0], bot[i][1]); c.closePath(); }; part(c, [[shape, "#c8402a"]]); const band = (off, col, w) => { c.beginPath(); for (let i = 0; i <= N; i++) { const x = -92 + 184 * i / N; i ? c.lineTo(x, off + f(x)) : c.moveTo(x, off + f(x)); } c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; c.stroke(); }; c.save(); shape(); c.clip(); band(-8, "#f7a98d", 10); band(10, "#e86448", 6); band(-18, "#a52e1c", 4); c.restore(); c.restore(); }

  // Sheet 6: sandwich
  R.white_bread = c => breadSlice(c, "#d98d3c", "#fbecd2");
  R.toast_slice = c => breadSlice(c, "#d07a2c", "#f2c27a", { grill: "#e3a050", speck: "rgba(190,120,40,.4)" });
  R.sesame_roll = c => { c.rotate(-0.2); part(c, [[() => E(c, 0, 0, 94, 64), "#e89a3c"]]); E(c, -4, -6, 84, 54); fill(c, "#f2b052"); lines(c, [[[-50, 4], [50, -12]]], "#c46f24", 10); lines(c, [[[-46, -2], [46, -18]]], "#ffd08a", 4); dots(c, 24, 66, 0, -4, 70, 44, "#fff6dc", 3, 4.5); };
  R.pita_round = c => { part(c, [[() => S(c, wob(0, 0, 94, 76, 12, 0.05, 7)), "#f6e6c8"]]); dots(c, 14, 67, 0, 0, 74, 60, "#e8c48a", 3, 6); };
  R.croissant_2 = c => croissant(c);
  R.ham_slice = c => coldCut(c, "#f39aa8", "#e57585", "#ffd0d8");
  R.turkey_slice = c => coldCut(c, "#f2d8c2", "#dcb18c", "#fff1e4");
  R.bacon_2 = c => bacon(c);
  R.cheddar_square = c => cheeseSquare(c, "#ffbe1f", "#ef9a06");
  R.swiss_square = c => cheeseSquare(c, "#fff0b0", "#f0d27a", { holes: [[-40, -8, 12], [16, -34, 9], [34, 14, 13], [-8, 30, 8]] });
  R.lettuce_3 = c => frillyLeaf(c, "#7cc243", "#a7dc6a", "#d7f2a6");
  R.spinach_2 = c => leaf(c, "#2e8a35", "#7bc96a", { rot: -0.75, len: 88, w: 64, dark: "#24702b", stem: true });
  R.tomato_3 = c => tomatoSlice(c);
  R.cucumber_2 = c => cucumber(c);
  R.red_onion_2 = c => onionSlice(c);
  function coldCut(c, col, side, marble) { disc(c, { rx: 92, ry: 66, t: 16, side, top: col }); lines(c, [[[-60, -20], [-20, -30], [20, -14], [60, -26]], [[-56, 10], [-10, 0], [30, 14], [64, 2]], [[-30, 30], [10, 24], [40, 34]]], marble, 6); hl(c, -40, -36, 22, 6, -0.2, 0.45); }
  function cucumber(c) { disc(c, { rx: 92, ry: 76, t: 16, side: "#2e8b2e", top: "#2e8b2e" }); E(c, 0, -8, 82, 66); fill(c, "#d9f2b4"); E(c, 0, -8, 74, 58); fill(c, "#c7ec97"); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2; c.save(); c.translate(Math.cos(a) * 26, -8 + Math.sin(a) * 22); c.rotate(a + Math.PI / 2); E(c, 0, 0, 9, 15); fill(c, "#9fd85e"); c.restore(); } }

  // Sheet 7: burger
  R.top_bun = c => { disc(c, { rx: 92, ry: 74, t: 18, side: "#e08a2a", top: "#f2a33f" }); hl(c, -36, -46, 30, 10, -0.3, 0.45); [[-50, -30, 0.4], [-14, -52, -0.2], [26, -40, 0.3], [56, -18, -0.4], [-34, 0, -0.3], [8, -12, 0.5], [40, 14, 0.2], [-60, 18, 0.6], [-6, 26, -0.2], [22, 40, 0.4]].forEach(([x, y, a]) => { c.save(); c.translate(x, y); c.rotate(a); E(c, 0, 0, 8, 4.5); fill(c, "#fff3cf"); c.restore(); }); };
  R.bottom_bun = c => { disc(c, { rx: 92, ry: 72, t: 20, side: "#e08a2a", top: "#f2a33f" }); E(c, 0, -14, 82, 58); fill(c, "#f5ae4c"); hl(c, -40, -44, 24, 8, -0.3, 0.4); };
  R.beef_patty = c => { disc(c, { rx: 92, ry: 72, t: 18, side: "#4a2214", top: "#6b3420" }); lines(c, [[[-48, 34], [14, -48]], [[-18, 50], [46, -34]], [[16, 56], [72, -10]], [[-70, 10], [-26, -48]]], "#3e1c10", 10); dots(c, 26, 9, 0, -8, 72, 56, "#7c4229", 2, 4); };
  R.chicken_patty = c => { disc(c, { rx: 92, ry: 72, t: 18, side: "#d5913e", top: "#efb66c" }); dots(c, 30, 10, 0, -8, 74, 58, "#f9cf8e", 2, 4); lines(c, [[[-48, 34], [14, -48]], [[-18, 50], [46, -34]], [[16, 56], [72, -10]], [[-70, 10], [-26, -48]]], "#b4632a", 10); };
  R.veggie_patty = c => { disc(c, { rx: 92, ry: 72, t: 18, side: "#5c5b25", top: "#7a7a35" }); dots(c, 30, 11, 0, -8, 72, 56, "#5f8a2a", 3, 5); dots(c, 12, 12, 0, -8, 72, 56, "#f08a2a", 3, 5); dots(c, 10, 13, 0, -8, 72, 56, "#a7d15a", 3, 4); };
  R.american_cheese = c => cheeseSquare(c, "#ffc21a", "#e89a00");
  R.swiss_cheese = c => cheeseSquare(c, "#fff0b0", "#f0d27a", { holes: [[-40, -8, 12], [16, -34, 9], [34, 14, 13], [-8, 30, 8]] });
  R.lettuce = c => frillyLeaf(c, "#6fbb3a", "#9fd65c", "#d7f2a6", { rx: 94, ry: 70 });
  R.tomato = c => tomatoSlice(c, { ry: 72, t: 16 });
  R.onion = c => onionSlice(c, { ry: 70 });
  R.cucumber = c => cucumber(c);
  R.avocado = c => avocadoSlice(c);
  R.pickle = c => { disc(c, { rx: 90, ry: 74, t: 14, side: "#5f7f12", top: "#9ab526" }); c.save(); S(c, frill(0, -7, 90, 74, 18, 0.05)); c.strokeStyle = "#7a9a1a"; c.lineWidth = 6; c.stroke(); c.restore(); E(c, 0, -7, 70, 56); fill(c, "#b3cc3c"); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.save(); c.translate(Math.cos(a) * 30, -7 + Math.sin(a) * 24); c.rotate(a + Math.PI / 2); E(c, 0, 0, 7, 13); fill(c, "#f0ef9a"); c.restore(); } };
  R.jalapeno = c => { disc(c, { rx: 90, ry: 76, t: 14, side: "#1e6b1e", top: "#2f8a2a" }); E(c, 0, -7, 72, 60); fill(c, "#9fd65c"); E(c, 0, -7, 50, 42); fill(c, "#d7f0a0"); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; part(c, [[() => E(c, Math.cos(a) * 30, -7 + Math.sin(a) * 25, 10, 9), "#fffbe0"]], 3); } };
  R.ketchup = c => swirl(c, ["#e0241f", "#d01c17", "#a8150f"], { tiers: 2, base: 84, step: 32 });
  function sauceDollop(c, col, dark) { part(c, [[() => { c.beginPath(); c.moveTo(-90, 56); c.bezierCurveTo(-96, 10, -50, 4, -36, -14); c.bezierCurveTo(-34, -50, 0, -56, 6, -86); c.bezierCurveTo(30, -60, 40, -30, 36, -14); c.bezierCurveTo(60, 0, 96, 12, 90, 56); c.quadraticCurveTo(0, 82, -90, 56); c.closePath(); }, col]]); lines(c, [[[-60, 34], [0, 18], [60, 32]], [[-28, -6], [8, -14], [30, -4]]], dark, 6); hl(c, -40, 14, 18, 7, -0.4, 0.6); hl(c, -6, -50, 5, 12, -0.4, 0.7); }

  // Sheet 8: drink add-ins
  R.crushed_ice = c => { const r = rng(81); const list = []; for (let i = 0; i < 34; i++) list.push([(r() - 0.5) * 170, (r() - 0.3) * 110, 14 + r() * 14]); list.sort((a, b) => a[1] - b[1]).forEach(([x, y, s]) => { if (Math.abs(x) > 80 - y * 0.2) return; part(c, [[() => P(c, wob(x, y, s, s * 0.85, 6, 0.4, Math.floor(x * 7 + y))), "#cfe8fb"]], 3); hl(c, x - s * 0.3, y - s * 0.3, s * 0.3, s * 0.2, 0, 0.8); }); };
  R.ice_sphere = c => { ball(c, 0, 0, 88, "#cfe6f8", "#b2d3f0", { a: 0.9 }); lines(c, [[[-40, 20], [0, 50], [50, 10]], [[-20, -40], [30, -20]]], "rgba(255,255,255,.7)", 5); };
  R.coconut_flakes = c => { const r = rng(83); for (let i = 0; i < 12; i++) { c.save(); c.translate((r() - 0.5) * 130, (r() - 0.5) * 110); c.rotate(r() * 3); part(c, [[() => { c.beginPath(); c.moveTo(-40, 12); c.quadraticCurveTo(0, -26, 40, -8); c.quadraticCurveTo(4, 16, -40, 12); c.closePath(); }, "#fbf7ef"]], 4); lines(c, [[[-34, 10], [34, -6]]], "#8a5a3a", 4); c.restore(); } };
  R.pretzel_2 = c => pretzel(c);
  R.marshmallows = c => { [[-30, -30], [36, -26], [-40, 30], [26, 30]].forEach(([x, y]) => { part(c, [[() => RR(c, x - 34, y - 20, 68, 52, 18), "#fdf9f2"], [() => E(c, x, y - 20, 34, 14), "#ffffff"]]); hl(c, x - 14, y - 22, 12, 4, 0, 0.8); }); };
  R.gummy_cubes = c => { cube(c, 0, -46, 36, "#ff5a6a", "#e8323f", "#c41f2c"); cube(c, -48, -6, 36, "#ffe14a", "#f5c518", "#dba80e"); cube(c, 48, -6, 36, "#7dde5a", "#55c234", "#3fa024"); cube(c, 0, 26, 36, "#b45aff", "#9b34ec", "#7d1fd0"); };
  R.candy_balls = c => { [[-40, -40, "#e8322e", "#c41f1f"], [26, -34, "#ff9a1f", "#e47a06"], [-56, 16, "#ffc21a", "#e8a000"], [56, 20, "#ff9a1f", "#e47a06"], [-4, 30, "#e8322e", "#c41f1f"]].forEach(([x, y, col, d]) => ball(c, x, y, 34, col, d)); };
  R.green_jelly_cubes = c => { const g = ["#c8f0a8", "#a6e07c", "#8cd062"]; cube(c, -30, -40, 38, ...g); cube(c, 34, -36, 38, ...g); cube(c, -40, 14, 38, ...g); cube(c, 26, 18, 38, ...g); };
  R.boba_pearls = c => boba(c);
  R.lemon_wedge = c => citrusWedge(c, "#ffcc1f", "#fff6c4", "#ffe14d");
  R.lime_wedge = c => citrusWedge(c, "#4fae2a", "#e6f7b8", "#a6dc4a");
  R.orange_wedge = c => citrusWedge(c, "#ff8a1a", "#ffe9c4", "#ffa53d");
  R.rosemary = c => { c.rotate(-0.8); c.scale(1.12, 1.25); if (true) { lines(c, [[[-90, 0], [90, 0]]], O, 10); lines(c, [[[-90, 0], [90, 0]]], "#8a6a3a", 5); for (let i = -7; i <= 7; i++) [-1, 1].forEach(s => { c.save(); c.translate(i * 12 + 6, 0); c.rotate(s * 0.9); part(c, [[() => RR(c, -2.5, s > 0 ? 2 : -46, 5, 44, 2.5), i % 2 ? "#3f8f3a" : "#4fa548"]], 3); c.restore(); }); return; } lines(c, [[[-90, 0], [90, 0]]], O, 12); lines(c, [[[-90, 0], [90, 0]]], "#8a6a3a", 6); for (let i = -7; i <= 7; i++) { [-1, 1].forEach(s => { c.save(); c.translate(i * 12, 0); c.rotate(s * (0.7 - i * 0.02)); part(c, [[() => RR(c, -3, s > 0 ? 2 : -42, 7, 40, 3.5), "#3f8f3a"]], 3); c.restore(); }); } };
  R.mint_sprig = c => { c.scale(1.1, 1.1); c.translate(0, -14); part(c, [[() => RR(c, -4, -10, 8, 100, 4), "#4f9a3a"]], 4); leaf(c, "#3fae4a", "#8fdc7a", { rot: -2.2, len: 46, w: 32, serrated: true }); c.save(); c.translate(-46, 30); leaf(c, "#2f9a3e", "#8fdc7a", { rot: 0.4 + Math.PI, len: 44, w: 30, serrated: true }); c.restore(); c.save(); c.translate(46, 30); leaf(c, "#3fae4a", "#8fdc7a", { rot: -0.4, len: 44, w: 30, serrated: true }); c.restore(); };
  R.cherry_2 = c => cherry(c);
  function boba(c, seed) { const r = rng(seed || 90); const list = [[-36, -40], [20, -46], [-58, 4], [0, -6], [52, 0], [-26, 40], [30, 40]]; list.forEach(([x, y]) => ball(c, x + (r() - 0.5) * 6, y, 30, "#3a1e14", "#24120b", { a: 0.5 })); }

  // Sheet 9: sauces & toppings
  R.choc_sauce_dark = c => puddle(c, "#4a1f10", "#36150a");
  R.choc_sauce_milk = c => puddle(c, "#8a4a26", "#6b3418");
  R.choc_sauce_raspberry = c => puddle(c, "#6e2a24", "#541c18");
  R.caramel_sauce = c => puddle(c, "#d98a2b", "#b56c1a");
  R.peanut_sauce = c => puddle(c, "#ebc78f", "#d6a865");
  R.white_choc_sauce = c => puddle(c, "#fbf7ef", "#e9dfcf");
  R.whipped_cream_3 = c => swirl(c, ["#ffffff", "#f3ead9", "#e3d6c0"], { tiers: 4, base: 70 });
  R.ice_cubes_2 = c => iceCubes(c);
  R.choc_chips_2 = c => chocChips(c, 91);
  R.cookie_crumbs = c => { const r = rng(92); [[-50, -40, 30], [20, -50, 22], [44, 16, 34], [-30, 30, 30], [-70, 4, 14], [70, -30, 12]].forEach(([x, y, s]) => { part(c, [[() => P(c, wob(x, y, s, s * 0.85, 7, 0.5, x * 3 + y)), "#d9a066"]], 5); dots(c, 3, x * 7 + 1, x, y, s * 0.5, s * 0.5, "#4a2414", 3, 5); }); for (let i = 0; i < 10; i++) { E(c, (r() - 0.5) * 170, (r() - 0.5) * 150, 4, 4); fill(c, "#7a4a2a"); } };
  R.caramel_drizzle_2 = c => drizzle(c, "#e3982f", "#ffd08a", { drops: [[-86, 50, 7], [86, -44, 6], [60, 60, 5]] });
  R.choc_drizzle_2 = c => drizzle(c, "#5a2a16", "#a2643c", { drops: [[-86, 50, 7], [86, -44, 6], [60, 60, 5]] });
  R.cinnamon_powder = c => powder(c, "#b5652a", "#d98a4a");
  R.cocoa_powder = c => powder(c, "#6e3a20", "#8f5634");
  R.coffee_beans = c => { [[-28, -30, 0.5], [34, -22, -0.4], [0, 32, 0.2]].forEach(([x, y, a]) => { c.save(); c.translate(x, y); c.rotate(a); part(c, [[() => E(c, 0, 0, 44, 34), "#7a4024"]]); c.beginPath(); c.moveTo(-36, 4); c.bezierCurveTo(-12, -14, 12, 18, 36, -4); c.strokeStyle = O; c.lineWidth = 7; c.stroke(); hl(c, -18, -18, 12, 5, -0.2, 0.4); c.restore(); }); };
  function powder(c, col, light) { const r = rng(col.length * 7); c.save(); c.globalAlpha = 0.9; for (let i = 0; i < 260; i++) { const a = r() * TAU, d = Math.pow(r(), 0.7); const x = Math.cos(a) * 92 * d, y = 20 + Math.sin(a) * 58 * d - (1 - d) * 26; E(c, x, y, 2 + r() * 3, 2 + r() * 3); fill(c, i % 3 ? col : light); } c.restore(); }

  // Sheet 10: dessert sauces & fruit
  R.cream_splat = c => splat(c, "#fffaf0", "#f0e3cf", 101);
  R.custard_splat = c => splat(c, "#fff0b8", "#f2dc8a", 102);
  R.strawberry_splat = c => splat(c, "#ff9ec0", "#f07aa2", 103);
  R.chocolate_splat = c => splat(c, "#6e3a20", "#54280f", 104);
  R.banana_slice_2 = c => bananaSlice(c);
  R.blueberry_2 = c => R.blueberry(c);
  R.raspberry = c => { const r = rng(3); const list = []; for (let row = 0; row < 6; row++) for (let i = 0; i < 6 - Math.abs(row - 2.5) * 0.9; i++) list.push([(i - (5 - Math.abs(row - 2.5) * 0.9) / 2) * 24 + (r() - 0.5) * 4, -60 + row * 24]); part(c, [[() => E(c, 0, 0, 80, 84), "#d81e44"]]); list.forEach(([x, y]) => { part(c, [[() => E(c, x, y, 14, 13), "#ff3d62"]], 3); hl(c, x - 4, y - 4, 4, 3, 0, 0.7); }); };
  R.mango_chunk = c => { const top = () => P(c, [[-70, 0], [-10, -70], [76, -30], [20, 30]]); const left = () => P(c, [[-70, 0], [20, 30], [20, 80], [-60, 44]]); const right = () => P(c, [[20, 30], [76, -30], [74, 22], [20, 80]]); part(c, [[left, "#f2a00e"], [right, "#e08a00"], [top, "#ffc233"]]); hl(c, -10, -30, 18, 6, -0.5, 0.5); };
  R.kiwi_2 = c => kiwi(c);
  R.spinach_3 = c => leaf(c, "#2e8a35", "#7bc96a", { rot: -0.9, len: 86, w: 64, dark: "#24702b", stem: true });
  R.cream_dollop = c => mound(c, ["#fffaf0", "#eadbc2"]);
  R.whipped_swirl = c => swirl(c, ["#ffffff", "#f3ead9", "#e3d6c0"], { tiers: 4, base: 70 });
  R.choc_drizzle_3 = c => drizzle(c, "#5a2a16", "#a2643c", { pts: [[-82, -44], [-40, 46], [0, -50], [40, 48], [78, -40]], drops: [[-80, 52, 8], [78, 44, 6]] });
  R.caramel_drizzle_3 = c => drizzle(c, "#e3982f", "#ffd08a", { pts: [[-82, -44], [-40, 46], [0, -50], [40, 48], [78, -40]], drops: [[-80, 52, 8], [78, 44, 6]] });
  R.sprinkles_3 = c => sprinkles(c, 105);

  // Sheet 11: fruit & syrups
  R.lemon_round = c => citrusRound(c, "#ffcc1f", "#fff6c4", "#ffe14d", "#ffc21a");
  R.lime_round = c => citrusRound(c, "#4fae2a", "#e6f7b8", "#a6dc4a", "#8fcb36");
  R.orange_round = c => citrusRound(c, "#ff8a1a", "#ffe9c4", "#ffa53d", "#ff8f1f");
  R.grapefruit_round = c => citrusRound(c, "#f47c6c", "#ffe2da", "#ff6a5c", "#f04a42");
  R.pineapple_chunk = c => { const top = () => P(c, [[-80, 10], [-20, -70], [70, -30], [10, 40]]); const front = () => P(c, [[-80, 10], [10, 40], [12, 82], [-78, 50]]); const side = () => P(c, [[10, 40], [70, -30], [72, 14], [12, 82]]); part(c, [[front, "#ffd633"], [side, "#f2bd16"], [top, "#ffe15a"]]); lines(c, [[[-60, 16], [-40, 40], [-30, 30], [-12, 54]]], "#f2b70c", 4); lines(c, [[[-50, -8], [-20, -44], [20, -30]]], "#fff2a0", 5); };
  R.peach_slice = c => { crescent(c, "#f2583a", "#ffb45a", "#ffc87a", 0.1); }; R.peach_slice_old = c => { c.rotate(-0.3); const outer = () => { c.beginPath(); c.moveTo(-86, 30); c.bezierCurveTo(-70, -40, 30, -76, 90, -50); c.bezierCurveTo(70, 20, 10, 60, -60, 60); c.quadraticCurveTo(-90, 56, -86, 30); c.closePath(); }; part(c, [[outer, "#f2583a"]]); c.save(); c.translate(-6, -6); c.scale(0.88, 0.82); outer(); c.restore(); fill(c, "#ffb45a"); lines(c, [[[50, -40], [20, -20]], [[50, -40], [30, -50]], [[50, -40], [44, -16]]], "#e8862a", 4); };
  R.strawberry_half = c => { part(c, [[() => { c.beginPath(); c.moveTo(-4, 86); c.bezierCurveTo(-80, 50, -86, -40, -40, -54); c.quadraticCurveTo(0, -62, 40, -54); c.bezierCurveTo(86, -40, 80, 50, -4, 86); c.closePath(); }, "#e8322e"]]); c.save(); c.beginPath(); c.moveTo(-4, 70); c.bezierCurveTo(-60, 40, -64, -24, -30, -36); c.quadraticCurveTo(0, -44, 30, -36); c.bezierCurveTo(64, -24, 60, 40, -4, 70); c.closePath(); fill(c, "#ff6a5a"); c.beginPath(); c.moveTo(-2, 40); c.bezierCurveTo(-30, 20, -30, -16, -2, -20); c.bezierCurveTo(26, -16, 26, 20, -2, 40); fill(c, "#ffc0b0"); c.restore(); };
  R.basil_leaf = c => leaf(c, "#3a9a3a", "#8fdc7a", { rot: -0.6, len: 86, w: 60, serrated: true, dark: "#2c8030", stem: true });
  R.ice_cubes_3 = c => iceCubes(c);
  R.sugar_cubes = c => { const s = ["#ffffff", "#f2f2f2", "#e2e2e2"]; cube(c, 0, -44, 44, ...s, { edge: "rgba(0,0,0,0)" }); cube(c, -44, 4, 44, ...s, { edge: "rgba(0,0,0,0)" }); cube(c, 44, 4, 44, ...s, { edge: "rgba(0,0,0,0)" }); };
  R.honey_drizzle = c => drizzle(c, "#ffb21f", "#ffe08a", { w: 30, pts: [[-56, -84], [56, -60], [-46, -14], [46, 10], [-14, 60]], drops: [[22, 80, 13], [60, 54, 8]] });
  R.lemon_custard_puddle = c => puddle(c, "#fff4b8", "#f2e08a", { dropsAt: [[78, -50, 7, 7, 0], [88, -32, 5, 5, 0], [76, 54, 6, 6, 0]] });
  R.lime_puddle = c => puddle(c, "#c8e88a", "#a8d060", { dropsAt: [[78, -50, 7, 7, 0], [88, -32, 5, 5, 0], [76, 54, 6, 6, 0]] });
  R.orange_puddle = c => puddle(c, "#ffb21f", "#f29a0a", { dropsAt: [[78, -50, 7, 7, 0], [88, -32, 5, 5, 0], [76, 54, 6, 6, 0]] });
  R.mango_puddle = c => puddle(c, "#ffd633", "#f2bd16", { dropsAt: [[78, -50, 7, 7, 0], [88, -32, 5, 5, 0], [76, 54, 6, 6, 0]] });

  // Sheet 12: drinks
  R.cola_splash = c => drink(c, "#7a3a18", "#a85a2c", "#5a2a10");
  R.blue_splash = c => drink(c, "#2e9ef0", "#8fd0ff", "#1b78c9");
  R.green_splash = c => drink(c, "#8ccf3a", "#c8ef8a", "#6aa82a");
  R.choc_milk_splash = c => { drink(c, "#6e3a20", "#f2d8b4", "#54280f"); };
  R.milk_splash = c => drink(c, "#e6f2fb", "#ffffff", "#c8dcef");
  R.iced_tea_splash = c => drink(c, "#c8541c", "#ef8a4a", "#a33f10");
  R.orange_splash = c => drink(c, "#ff8f2e", "#ffc07a", "#e06a10");
  R.green_tea_splash = c => drink(c, "#8ab83a", "#c0e07a", "#6a9428");
  R.boba_2 = c => boba(c, 120);
  R.ice_cubes_4 = c => iceCubes(c);
  R.lemon_round_2 = c => citrusRound(c, "#ffcc1f", "#fff6c4", "#ffe14d", "#ffc21a", { ry: 76, t: 12 });
  R.lime_round_2 = c => citrusRound(c, "#4fae2a", "#e6f7b8", "#a6dc4a", "#8fcb36", { ry: 76, t: 12 });
  R.mint_2 = c => { c.scale(1.1, 1.1); c.translate(0, -10); part(c, [[() => RR(c, -4, 26, 8, 66, 4), "#4f9a3a"]], 4); c.save(); c.translate(-30, 0); leaf(c, "#3fae4a", "#8fdc7a", { rot: -2.4, len: 56, w: 40, serrated: true }); c.restore(); c.save(); c.translate(30, -6); leaf(c, "#2f9a3e", "#8fdc7a", { rot: -0.7, len: 56, w: 40, serrated: true }); c.restore(); };
  R.cherry_3 = c => cherry(c);
  R.straw = c => { c.rotate(0.62); part(c, [[() => RR(c, -96, -13, 192, 26, 6), "#ffffff"]]); c.save(); RR(c, -96, -13, 192, 26, 6); c.clip(); for (let i = -6; i < 7; i++) { c.beginPath(); c.moveTo(i * 30, -16); c.lineTo(i * 30 + 14, -16); c.lineTo(i * 30 + 2, 16); c.lineTo(i * 30 - 12, 16); c.closePath(); fill(c, "#e53b2c"); } c.restore(); E(c, 96, 0, 5, 12); fill(c, "#c9302a"); };

  // Game-specific variants (Snack Stack ingredient set)
  R.cheddar = c => cheeseSquare(c, "#ff9a1f", "#e07a00");
  R.pepper_jack = c => cheeseSquare(c, "#fff4c8", "#eedb98", { flecks: "#e03131" });
  R.ice_cream_chocolate = c => swirl(c, ["#7a4024", "#7a4024", "#4e2414"]);
  R.hot_sauce = c => puddle(c, "#e8401c", "#c22a0c");
  R.mustard = c => drizzle(c, "#f5c518", "#fff08a");
  R.bagel_sesame = c => { R.donut_plain(c); const r = rng(77); for (let i = 0; i < 20; i++) { const a = r() * TAU, d = 0.55 + r() * 0.3; c.save(); c.translate(Math.cos(a) * 92 * d, -7 + Math.sin(a) * 70 * d); c.rotate(a); E(c, 0, 0, 6, 3.4); fill(c, "#fff6dc"); c.restore(); } };

  // Gallery order (sheet, row, col) \u2014 one-to-one with the reference sheets.
  const SHEETS = [
    ["Cups & mugs", "mug_red mug_blue mug_glass teacup_saucer coffee_cup_black_lid coffee_cup_white_lid plastic_cup plastic_cup_dome plastic_cup_flat_lid cup_striped cup_red cup_blue glass_tumbler mason_jar_mug wine_glass"],
    ["Savory fillings", "tortilla_round wrap_rolled chicken_strips ground_beef lettuce_leaf spinach_leaf tomato_slice cucumber_slice avocado_slice pepper_ring_red pepper_ring_yellow red_onion_slice mushroom_slice shredded_cheese black_beans"],
    ["Snacks & toppings", "fries popcorn nuggets ice_cubes lemon_slice blue_jelly yellow_jelly pink_jelly cookie_chunk whipped_cream caramel_drizzle chocolate_drizzle cherry sprinkles pretzel"],
    ["Sweets", "donut_plain donut_chocolate donut_pink muffin frosting_pink frosting_vanilla strawberry blueberry banana_slice kiwi_slice granola meringue whipped_cream_tall sprinkles_2 chocolate_chips"],
    ["Breakfast", "english_muffin flatbread_round waffle pancake croissant fried_egg scrambled_egg bacon_strip sausage_patty hash_brown cheese_square avocado_slice_2 mushroom_2 leaf_lettuce_2 tomato_2"],
    ["Sandwich", "white_bread toast_slice sesame_roll pita_round croissant_2 ham_slice turkey_slice bacon_2 cheddar_square swiss_square lettuce_3 spinach_2 tomato_3 cucumber_2 red_onion_2"],
    ["Burger", "top_bun bottom_bun beef_patty chicken_patty veggie_patty american_cheese swiss_cheese lettuce tomato onion cucumber avocado pickle jalapeno ketchup"],
    ["Drink add-ins", "crushed_ice ice_sphere coconut_flakes pretzel_2 marshmallows gummy_cubes candy_balls green_jelly_cubes boba_pearls lemon_wedge lime_wedge orange_wedge rosemary mint_sprig cherry_2"],
    ["Sauces", "choc_sauce_dark choc_sauce_milk choc_sauce_raspberry caramel_sauce peanut_sauce white_choc_sauce whipped_cream_3 ice_cubes_2 choc_chips_2 cookie_crumbs caramel_drizzle_2 choc_drizzle_2 cinnamon_powder cocoa_powder coffee_beans"],
    ["Dessert sauces & fruit", "cream_splat custard_splat strawberry_splat chocolate_splat banana_slice_2 blueberry_2 raspberry mango_chunk kiwi_2 spinach_3 cream_dollop whipped_swirl choc_drizzle_3 caramel_drizzle_3 sprinkles_3"],
    ["Fruit & syrups", "lemon_round lime_round orange_round grapefruit_round pineapple_chunk peach_slice strawberry_half basil_leaf ice_cubes_3 sugar_cubes honey_drizzle lemon_custard_puddle lime_puddle orange_puddle mango_puddle"],
    ["Bowls & wraps", "salad_bowl wrap_open wrap_rolled"],
    ["Donuts", "donut_plain donut_chocolate donut_pink donut_caramel donut_choc_sprinkles donut_pink_sprinkles donut_vanilla_sprinkles donut_blue_sprinkles donut_mint_choc"],
    ["Drinks", "cola_splash blue_splash green_splash choc_milk_splash milk_splash iced_tea_splash orange_splash green_tea_splash boba_2 ice_cubes_4 lemon_round_2 lime_round_2 mint_2 cherry_3 straw"]
  ].map(([name, ids]) => ({ name, ids: ids.split(" ") }));

  const CLEAR = { mug_glass: 1, plastic_cup: 1, plastic_cup_dome: 1, plastic_cup_flat_lid: 1, glass_tumbler: 1, mason_jar_mug: 1, wine_glass: 1 };
  const RIM_Y = { mug_red: -66, mug_blue: -66, mug_glass: -66, teacup_saucer: -60, coffee_cup_black_lid: -120, coffee_cup_white_lid: -120, mason_jar_mug: -84, wine_glass: -80 };
  function steam(c, y, t) { c.save(); c.lineCap = "round"; for (let i = -1; i <= 1; i++) { const ph = (t * 0.6 + i * 0.33 + 1) % 1; c.globalAlpha = Math.sin(ph * Math.PI) * 0.75; c.beginPath(); const x0 = i * 26; for (let k = 0; k <= 12; k++) { const yy = y - 10 - ph * 50 - k * 6, xx = x0 + Math.sin(k * 0.7 + t * 3 + i) * 8; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.strokeStyle = "#ffffff"; c.lineWidth = 9; c.stroke(); } c.restore(); }
  // Straw seen through a clear cup: "in" = below the rim (faint, behind the drink), "out" = above the rim, "top" = above a dome lid
  function sprinkleOn(c, cx, cy, rx, ry, n, seed, cols, avoid, size, drop) { // evenly scattered sprinkles that sit on a surface; drop 0..1 = falling in
    const r = rng(seed), pts = []; size = size || 1; drop = drop === undefined ? 1 : drop;
    for (let k = 0; k < 900 && pts.length < n; k++) { const a = r() * TAU, d = Math.sqrt(r()) * 0.9, x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d; if (avoid && avoid(x, y)) continue; if (pts.some(p => Math.hypot(p[0] - x, (p[1] - y) * 1.4) < 22 * size)) continue; pts.push([x, y, r() * 3.14]); }
    pts.forEach(([x, y, rot], i) => { const k = Math.max(0, Math.min(1, drop * 1.6 - (i / pts.length) * 0.6)); if (k <= 0) return; const e = 1 - Math.pow(1 - k, 3); c.save(); c.globalAlpha *= Math.min(1, k * 3); c.translate(x, y - (1 - e) * 90); c.rotate(rot + (1 - e) * 2); c.scale(size, size); c.save(); c.translate(1.5, 3.5); RR(c, -10, -4, 20, 8, 4); c.fillStyle = "rgba(40,20,10,.28)"; c.fill(); c.restore(); RR(c, -10, -4, 20, 8, 4); c.lineJoin = "round"; c.lineWidth = 3.5; c.strokeStyle = O; c.stroke(); c.fillStyle = cols[i % cols.length]; c.fill(); RR(c, -6, -2.5, 8, 2.2, 1.1); c.fillStyle = "rgba(255,255,255,.75)"; c.fill(); c.restore(); });
  }
  const SPRINKLE_COLS = ["#ff5a5a", "#ffd23a", "#4fc35a", "#3c8cf0", "#ffffff", "#ff8ad0", "#ff9a2e"];
  // salad bowl (3/4 view): back rim, contents, then the front of the bowl covers the bottom of the pile
  function saladBowl(c, items, t) {
    const back = () => { c.beginPath(); c.ellipse(0, -10, 96, 30, 0, Math.PI, 0); c.closePath(); };
    const front = () => { c.beginPath(); c.moveTo(-96, -10); c.bezierCurveTo(-92, 70, 92, 70, 96, -10); c.ellipse(0, -10, 96, 30, 0, 0, Math.PI, false); c.closePath(); };
    part(c, [[() => E(c, 0, -10, 96, 30), "#e9f4ec"], [front, "#4fb3a0"]]);
    E(c, 0, -10, 84, 22); fill(c, "#d5ece1");
    // items build a mound: greens spread wide at the base, each later item sits a little higher and nearer the middle
    const spots = [[-38, -16, 0.5], [34, -18, 0.5], [-4, -30, 0.48], [-46, -34, 0.4], [44, -36, 0.4], [6, -48, 0.4], [-22, -54, 0.36], [26, -58, 0.36], [0, -66, 0.34]];
    const greens = { lettuce_leaf: 1, spinach_leaf: 1, lettuce: 1 };
    let k = 0;
    (items || []).forEach(id => {
      if (id === "shredded_cheese") { cheeseShreds(c, k); return; }
      const [x, y, sc] = spots[Math.min(k, spots.length - 1)]; c.save(); c.translate(x, y); c.scale(sc * (greens[id] ? 1.15 : 1), sc * 0.8 * (greens[id] ? 1.1 : 1)); draw(c, id); c.restore(); k++;
    });
    c.save(); c.lineJoin = "round"; front(); c.strokeStyle = O; c.lineWidth = LW * 2; c.stroke(); front(); c.fillStyle = "#4fb3a0"; c.fill(); c.restore();
    c.save(); front(); c.clip(); c.fillStyle = "#3e9a88"; c.beginPath(); c.ellipse(0, 52, 100, 26, 0, 0, TAU); c.fill(); c.globalAlpha = 0.45; c.strokeStyle = "#fff"; c.lineWidth = 7; c.lineCap = "round"; c.beginPath(); c.ellipse(0, -6, 86, 40, 0, Math.PI * 0.62, Math.PI * 0.86); c.stroke(); c.restore();
  }
  R.salad_bowl = c => saladBowl(c, []);
  // fine cheese shreds scattered over the top of the salad (thin curls, not chunky sticks)
  function cheeseShreds(c, k) {
    const r = rng(77), top = -30 - Math.min(k, 8) * 4;
    for (let i = 0; i < 18; i++) { const a = r() * TAU, d = Math.sqrt(r()), x = Math.cos(a) * 52 * d, y = top + Math.sin(a) * 16 * d, ang = r() * 3.14, L = 8 + r() * 5;
      c.save(); c.translate(x, y); c.rotate(ang); c.beginPath(); c.moveTo(-L / 2, 0); c.quadraticCurveTo(0, -3, L / 2, 0);
      c.lineCap = "round"; c.strokeStyle = O; c.lineWidth = 4.4; c.stroke(); c.strokeStyle = i % 3 ? "#ffd04a" : "#ffe28a"; c.lineWidth = 2; c.stroke(); c.restore(); }
  }
  // wrap: fillings laid down the middle of an open tortilla; fold 0..1 brings both sides in, 1 = rolled wrap
  function wrapStep(c, items, fold) {
    fold = fold || 0;
    if (fold >= 1) { R.wrap_rolled(c); return; }
    R.tortilla_round(c);
    (items || []).forEach((id, k) => { c.save(); c.translate(0, -44 + k * 20); c.scale(0.4, 0.26); draw(c, id); c.restore(); });
    if (fold > 0) { const w = 92 * fold; [-1, 1].forEach(sd => { c.save(); c.beginPath(); c.ellipse(0, 0, 94, 82, 0, 0, TAU); c.clip(); const x0 = sd * 94, x1 = sd * (94 - w * 1.05); part(c, [[() => { c.beginPath(); c.moveTo(x0, -90); c.quadraticCurveTo(x1 - sd * 10, 0, x0, 90); c.lineTo(x1, 90); c.quadraticCurveTo(x1 + sd * 14, 0, x1, -90); c.closePath(); }, "#f3dfb6"]], 5); c.restore(); }); }
  }
  R.wrap_open = c => wrapStep(c, ["lettuce", "chicken_strips", "tomato_slice"], 0);
  function strawSeg(c, cb, which) {
    const x0 = 6, y0 = cb.bot - 14, L = (cb.bot - cb.top) + (cb.dome ? 104 : 66), ang = 0.2;
    const shape = () => { c.save(); c.translate(x0, y0); c.rotate(ang); RR(c, -9, -L, 18, L, 7); c.restore(); };
    const stripes = () => { c.save(); c.translate(x0, y0); c.rotate(ang); RR(c, -9, -L, 18, L, 7); c.clip(); for (let i = 0; i * 22 < L + 22; i++) { c.beginPath(); c.moveTo(-12, -i * 22); c.lineTo(12, -i * 22 - 12); c.lineTo(12, -i * 22 - 2); c.lineTo(-12, -i * 22 + 10); c.closePath(); fill(c, "#e8372b"); } c.restore(); };
    c.save();
    if (which === "in") { cb.body(); c.clip(); }                                                   // full straw inside the clear cup, drink drawn over it
    else if (which === "lid") { c.beginPath(); c.rect(-200, cb.top - 76, 400, 80); c.clip(); }
    else if (which === "flat") { const hx = x0 + Math.tan(ang) * (y0 - (cb.top - 6)); E(c, hx, cb.top - 6, 12, 4.5); fill(c, "#7f9fc0"); c.beginPath(); c.rect(-200, -400, 400, cb.top - 6 + 400); c.clip(); }     // between rim and dome top, seen through the dome
    else { c.beginPath(); c.rect(-200, -400, 400, (which === "top" ? cb.top - 64 : cb.top + 2) + 400); c.clip(); }
    shape(); c.fillStyle = "#ffffff"; c.fill(); stripes(); shape(); c.lineWidth = 5; c.strokeStyle = O; c.stroke();
    c.restore();
  }
  function strawIn(c, topY) { c.save(); c.translate(18, topY); c.rotate(0.22); part(c, [[() => RR(c, -9, -70, 18, 120, 6), "#ffffff"]]); c.save(); RR(c, -9, -70, 18, 120, 6); c.clip(); for (let i = -6; i < 6; i++) { c.beginPath(); c.moveTo(-12, -70 + i * 22); c.lineTo(12, -82 + i * 22); c.lineTo(12, -72 + i * 22); c.lineTo(-12, -60 + i * 22); c.closePath(); fill(c, "#e8372b"); } c.restore(); c.restore(); }
  R.waffle_cone = c => { const cone = () => { c.beginPath(); c.moveTo(-60, -40); c.lineTo(60, -40); c.lineTo(4, 92); c.quadraticCurveTo(0, 98, -4, 92); c.closePath(); }; part(c, [[cone, "#e8a64a"]]); c.save(); cone(); c.clip(); c.strokeStyle = "#c47a2c"; c.lineWidth = 6; for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(i * 22 - 60, -50); c.lineTo(i * 22 + 60, 100); c.stroke(); c.beginPath(); c.moveTo(i * 22 + 60, -50); c.lineTo(i * 22 - 60, 100); c.stroke(); } c.restore(); part(c, [[() => RR(c, -66, -52, 132, 22, 10), "#f0b45a"]]); };
  // Fill a container. Clear containers show the rising liquid; opaque ones only show the surface once full.
  // opts: { hot: steam when full, scoop: [fill, light, groove] colours for the cone, topping: sprite id }
  function drawFilled(ctx, id, level, col, t, opts) {
    opts = opts || {};
    if (id === "waffle_cone") {
      const scoopIn = opts.scoopIn === undefined ? (level >= 0.98 ? 1 : 0) : Math.max(0, Math.min(1, opts.scoopIn));
      const topIn = opts.toppingIn === undefined ? 1 : Math.max(0, Math.min(1, opts.toppingIn));
      draw(ctx, "waffle_cone");
      if (scoopIn > 0) {
        const e = 1 - Math.pow(1 - scoopIn, 3), squash = scoopIn >= 1 ? 1 : 1 + (1 - e) * 0.08;
        ctx.save(); ctx.translate(0, -78 - (1 - e) * 120); ctx.scale(0.62 * squash, 0.62 / squash); swirl(ctx, opts.scoop || ["#fff4d6", "#fff4d6", "#e7cf92"], { tiers: 2, base: 98, step: 30 }); ctx.restore();
        if (scoopIn >= 1 && opts.topping && topIn > 0) {
          // sprinkles only land on the visible cream: top tier, the upper half of the bottom tier, and the tip
          const onScoop = (x, y) => ((x / 44) ** 2 + ((y + 67) / 17) ** 2 < 1) || ((x / 56) ** 2 + ((y + 50) / 18) ** 2 < 1 && y < -46) || ((x / 14) ** 2 + ((y + 88) / 10) ** 2 < 1);
          if (opts.topping === "sprinkles") sprinkleOn(ctx, 0, -66, 60, 30, 12, 21, SPRINKLE_COLS, (x, y) => !onScoop(x, y), 0.72, topIn);
          else { const e2 = 1 - Math.pow(1 - topIn, 3); ctx.save(); ctx.translate(-4, -124 - (1 - e2) * 120); ctx.scale(0.4, 0.4); draw(ctx, opts.topping); ctx.restore();
            if (topIn >= 1) { ctx.save(); ctx.translate(0, -78); ctx.scale(0.62, 0.62); ctx.beginPath(); ctx.ellipse(0, -14, 26, 9, 0, 0, Math.PI); ctx.fillStyle = (opts.scoop || ["#fff4d6"])[0]; ctx.fill(); ctx.restore(); } }
        }
      }
      return true;
    }
    if (id === "salad_bowl") { saladBowl(ctx, opts.items); return true; }
    if (id === "wrap") { wrapStep(ctx, opts.items, opts.fold); return true; }
    FILL = { level: CLEAR[id] ? level : (level >= 0.98 ? 1 : 0), col, t }; LID.on = !!opts.lid; LID.straw = !!opts.straw; LID.drop = opts.lidIn === undefined ? 1 : Math.max(0, Math.min(1, 1 - Math.pow(1 - opts.lidIn, 3)));
    try { draw(ctx, id); } finally { FILL = null; LID.on = true; LID.straw = false; LID.drop = 1; }
    if (opts.hot && level >= 0.98 && !(opts.lid && opts.lidIn !== undefined && opts.lidIn < 1)) steam(ctx, opts.lid ? (RIM_Y[id] || -86) : (id.startsWith("coffee_cup") ? -64 : RIM_Y[id] || -86), t || 0);
    return true;
  }
  const CUPS = ["waffle_cone", "coffee_cup_black_lid", "mug_red", "mug_blue", "mug_glass", "teacup_saucer", "plastic_cup", "plastic_cup_dome", "plastic_cup_flat_lid", "cup_striped", "cup_red", "cup_blue", "glass_tumbler", "mason_jar_mug"];
  // Consistent lighting: one soft light from the top-left, gentle shade toward the bottom-right.
  // Applied to a finished sprite canvas (pixel space) before the white sticker rim is added.
  function light(cv, strength) {
    const k = strength === undefined ? 1 : strength, w = cv.width, h = cv.height; if (!w || !h) return cv;
    const c = cv.getContext("2d"), img = c.getImageData(0, 0, w, h), d = img.data;
    // bounds of the opaque pixels, so the light fits the sprite rather than the padded canvas
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (d[(y * w + x) * 4 + 3] > 30) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0 || y1 <= y0) return cv;
    const iw = 1 / (x1 - x0), ih = 1 / (y1 - y0);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const o = (y * w + x) * 4; if (d[o + 3] < 8) continue;
      const r = d[o], g = d[o + 1], b = d[o + 2], lum = 0.3 * r + 0.59 * g + 0.11 * b;
      if (lum < 78) continue;                                       // outline and very dark detail stay crisp
      const t = ((x - x0) * iw * 0.55 + (y - y0) * ih * 0.45);      // 0 = top-left, 1 = bottom-right
      if (t < 0.42) { const a = (0.42 - t) / 0.42 * 0.24 * k; d[o] = r + (255 - r) * a; d[o + 1] = g + (255 - g) * a; d[o + 2] = b + (255 - b) * a; }
      else if (t > 0.6) { const a = 1 - (t - 0.6) / 0.4 * 0.24 * k; d[o] = r * a; d[o + 1] = g * a; d[o + 2] = b * a; }
    }
    c.putImageData(img, 0, 0); return cv;
  }
  function draw(ctx, id) { const f = R[id]; if (!f) return false; ctx.save(); try { f(ctx); } finally { ctx.restore(); } return true; }
  return { draw, drawFilled, light, CUPS, CLEAR, has: id => !!R[id], ids: Object.keys(R), SHEETS, OUTLINE: O, NAVY };
})();
