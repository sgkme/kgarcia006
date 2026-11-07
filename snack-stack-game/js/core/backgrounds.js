// Snack Stack \u2014 backgrounds drawn in code (1080x1920), one-to-one replicas of the reference set:
// bg_loading_screen, bg_main_menu_kitchen, bg_gameplay_classic_kitchen, bg_gameplay_food_truck, bg_gameplay_retro_diner.
// Flat fills + navy outline, same language as SS.Sprites. Kitchen themes reuse the classic layout with their own palette.
window.SS = window.SS || {};

SS.BG = (function () {
  const W = 1080, H = 1920, O = "#3b2314", LW = 8;
  const mk = () => { const c = document.createElement("canvas"); c.width = W; c.height = H; return c; };
  function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  const fs = (c, col, lw) => { if (col) { c.fillStyle = col; c.fill(); } if (lw !== 0) { c.lineWidth = lw || LW; c.strokeStyle = O; c.lineJoin = "round"; c.lineCap = "round"; c.stroke(); } };
  const box = (c, x, y, w, h, r, col, lw) => { rr(c, x, y, w, h, r); fs(c, col, lw); };
  const ell = (c, x, y, rx, ry, col, lw) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); fs(c, col, lw); };
  const flat = (c, x, y, w, h, r, col) => { rr(c, x, y, w, h, r); c.fillStyle = col; c.fill(); };
  function shade(hex, amt) { let s = hex.replace("#", ""); let r = parseInt(s.slice(0, 2), 16), g = parseInt(s.slice(2, 4), 16), b = parseInt(s.slice(4, 6), 16); const t = amt < 0 ? 0 : 255, p = Math.abs(amt); r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b); return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join(""); }

  // ---------- props ----------
  const shadowUnder = (c, x, y, w) => { c.save(); c.fillStyle = "rgba(15,24,48,.22)"; c.beginPath(); c.ellipse(x, y + 2, w / 2, 9, 0, 0, Math.PI * 2); c.fill(); c.restore(); };
  // grounded props: pass the TOP of the surface they stand on
  const plantOn = (c, x, surf, s, pot) => { shadowUnder(c, x, surf, 80 * s); plant(c, x, surf - 72 * s, s, pot); };
  const bottleOn = (c, x, surf, col, s) => { s = s || 1; shadowUnder(c, x + 29 * s, surf, 56 * s); bottle(c, x, surf - 136 * s, col, s); };
  const jarOn = (c, x, surf, fillc, dots) => { shadowUnder(c, x + 38, surf, 76); jar(c, x, surf - 92, fillc, dots); };
  const bowlsOn = (c, x, surf, n) => { shadowUnder(c, x + 60, surf, 120); bowls(c, x, surf - 42, n); };
  const platesOn = (c, x, surf, n, w) => { shadowUnder(c, x + w / 2, surf, w); plates(c, x, surf - 22, n, w); };
  function cloud(c, x, y, s, col) { c.beginPath(); [[0, 0, 40], [42, -22, 50], [92, -4, 38], [-34, 10, 26], [124, 12, 24]].forEach(([dx, dy, r]) => { c.moveTo(x + (dx + r) * s, y + dy * s); c.arc(x + dx * s, y + dy * s, r * s, 0, 7); }); c.rect(x - 40 * s, y, 180 * s, 34 * s); c.fillStyle = col || "#fff"; c.fill(); }
  function bushes(c, x, y, w, h, cols) { cols.forEach((col, k) => { c.beginPath(); c.moveTo(x, y + h); const n = 4 + k; for (let i = 0; i <= n; i++) { const bx = x + w * i / n, by = y + h * (0.25 + 0.2 * k) + (i % 2 ? 30 : -10); c.quadraticCurveTo(bx - w / n / 2, by - 90 + k * 30, bx, by); } c.lineTo(x + w, y + h); c.closePath(); c.fillStyle = col; c.fill(); }); }
  function windowFrame(c, x, y, w, h, frame, opts) {
    opts = opts || {};
    box(c, x - 26, y - 26, w + 52, h + 52, 22, frame);
    c.save(); rr(c, x, y, w, h, 8); c.clip();
    c.fillStyle = opts.sky || "#7fd3ff"; c.fillRect(x, y, w, h);
    if (opts.night) { c.fillStyle = "#fff3bf"; c.beginPath(); c.arc(x + w * 0.7, y + 110, 46, 0, 7); c.fill(); c.fillStyle = opts.sky; c.beginPath(); c.arc(x + w * 0.7 + 24, y + 96, 40, 0, 7); c.fill(); c.fillStyle = "#fff"; for (let i = 0; i < 18; i++) c.fillRect(x + (i * 97) % w, y + (i * 61) % (h * 0.55), 5, 5); }
    else { const t = opts.t || 0, span = w + 360; [[0.25, 110, 1.0, 18], [0.62, h * 0.5, 0.75, 11], [0.05, h * 0.3, 0.55, 7]].forEach(([fx, cy, sc, sp]) => { const cx = x - 180 + (((fx * span + t * sp) % span) + span) % span; cloud(c, cx, y + cy, sc); }); }
    bushes(c, x - 20, y + h - 260, w + 40, 260, opts.night ? ["#2b2f66", "#363b7a"] : ["#5cb85c", "#3f9e46"]);
    c.restore();
    c.fillStyle = frame; c.fillRect(x, y + h * 0.48 - 12, w, 24);
    rr(c, x, y, w, h, 8); c.lineWidth = LW; c.strokeStyle = O; c.stroke();
    c.beginPath(); c.moveTo(x, y + h * 0.48 - 12); c.lineTo(x + w, y + h * 0.48 - 12); c.moveTo(x, y + h * 0.48 + 12); c.lineTo(x + w, y + h * 0.48 + 12); c.lineWidth = 5; c.stroke();
    c.save(); c.globalAlpha = 0.35; c.fillStyle = "#fff"; c.beginPath(); c.moveTo(x + w - 110, y + 30); c.lineTo(x + w - 70, y + 30); c.lineTo(x + w - 150, y + 170); c.lineTo(x + w - 190, y + 170); c.closePath(); c.fill(); c.restore();
  }
  function shelf(c, x, y, w, col) { const d = shade(col, -0.2); box(c, x, y, w, 34, 10, col); [x + 50, x + w - 90].forEach(bx => { c.beginPath(); c.moveTo(bx, y + 34); c.lineTo(bx + 40, y + 34); c.lineTo(bx + 34, y + 96); c.lineTo(bx + 8, y + 96); c.closePath(); fs(c, d, 6); }); flat(c, x + 10, y + 6, w - 20, 8, 4, shade(col, 0.25)); }
  function plant(c, x, y, s, pot) { c.save(); c.translate(x, y); c.scale(s, s); [[-0.95], [-0.5], [-0.1], [0.32], [0.75], [1.05]].forEach(([r], i) => { c.save(); c.rotate(r); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-32, -56, 0, -112 + Math.abs(i - 2.5) * 12); c.quadraticCurveTo(32, -56, 0, 0); fs(c, i % 2 ? "#3fae4a" : "#52c058", 6); c.strokeStyle = "#2f8f3a"; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -6); c.lineTo(0, -78); c.stroke(); c.restore(); }); c.beginPath(); c.moveTo(-44, -6); c.lineTo(44, -6); c.lineTo(34, 64); c.quadraticCurveTo(34, 72, 26, 72); c.lineTo(-26, 72); c.quadraticCurveTo(-34, 72, -34, 64); c.closePath(); fs(c, pot || "#ffffff", 6); box(c, -50, -14, 100, 22, 8, shade(pot || "#ffffff", -0.06), 6); c.restore(); }
  function bottle(c, x, y, col, s) { c.save(); c.translate(x, y); c.scale(s || 1, s || 1); c.beginPath(); c.moveTo(6, 40); c.quadraticCurveTo(0, 30, 14, 20); c.lineTo(22, 2); c.lineTo(36, 2); c.lineTo(44, 20); c.quadraticCurveTo(58, 30, 52, 40); c.lineTo(54, 124); c.quadraticCurveTo(54, 136, 42, 136); c.lineTo(16, 136); c.quadraticCurveTo(4, 136, 4, 124); c.closePath(); fs(c, col, 6); c.beginPath(); c.moveTo(22, 2); c.lineTo(27, -24); c.lineTo(31, -24); c.lineTo(36, 2); c.closePath(); fs(c, col, 5); c.save(); c.globalAlpha = 0.45; c.fillStyle = "#fff"; rr(c, 12, 46, 8, 60, 4); c.fill(); c.restore(); c.restore(); }
  function plates(c, x, y, n, w) { for (let i = 0; i < n; i++) box(c, x, y - i * 18, w, 22, 11, "#ffffff", 5); }
  function bowls(c, x, y, n) { for (let i = 0; i < n; i++) { c.beginPath(); c.moveTo(x, y - i * 24); c.lineTo(x + 120, y - i * 24); c.quadraticCurveTo(x + 116, y - i * 24 + 40, x + 60, y - i * 24 + 42); c.quadraticCurveTo(x + 4, y - i * 24 + 40, x, y - i * 24); c.closePath(); fs(c, "#ffffff", 5); } }
  function jar(c, x, y, fill, dots) { box(c, x, y, 76, 92, 16, "#e8f4fb"); flat(c, x + 9, y + 26, 58, 58, 10, fill); c.fillStyle = dots; for (let i = 0; i < 8; i++) { rr(c, x + 14 + (i * 23) % 46, y + 32 + (i * 17) % 44, 10, 8, 3); c.fill(); } box(c, x + 4, y - 16, 68, 22, 8, "#b8763a"); c.save(); c.globalAlpha = 0.6; c.fillStyle = "#fff"; rr(c, x + 8, y + 10, 8, 48, 4); c.fill(); c.restore(); }
  function rail(c, x, y, w, metal) { box(c, x, y, w, 22, 11, metal || "#3b4a66"); }
  function spatula(c, x, y) { box(c, x - 9, y, 18, 70, 8, "#e8963c", 5); box(c, x - 34, y + 66, 68, 110, 16, "#2f3a52", 6); c.fillStyle = "#4d5d7e"; [-18, -2, 14].forEach(dx => { rr(c, x + dx, y + 84, 7, 70, 3); c.fill(); }); }
  function pan(c, x, y) { box(c, x - 9, y, 18, 82, 8, "#e8963c", 5); c.beginPath(); c.arc(x, y + 150, 72, 0, 7); fs(c, "#2f3a52", 6); c.beginPath(); c.arc(x, y + 150, 48, 0, 7); c.fillStyle = "#3e4c6b"; c.fill(); c.save(); c.globalAlpha = 0.35; c.strokeStyle = "#fff"; c.lineWidth = 6; c.beginPath(); c.arc(x, y + 150, 34, 3.7, 4.7); c.stroke(); c.restore(); }
  function tiles(c, x, y, w, h, col, line, size) { size = size || 108; c.fillStyle = col; c.fillRect(x, y, w, h); for (let ty = y; ty < y + h; ty += size) for (let tx = x; tx < x + w; tx += size) { rr(c, tx + 6, ty + 6, size - 12, size - 12, 12); c.fillStyle = shade(col, 0.18); c.fill(); c.lineWidth = 3; c.strokeStyle = line; c.stroke(); } }
  function cabinet(c, x, y, w, h, body, top, drawers) { box(c, x, y, w, h, 10, body); flat(c, x + w - 26, y + 4, 20, h - 8, 6, shade(body, -0.12)); c.fillStyle = "rgba(15,24,48,.18)"; c.fillRect(x + 4, y + 8, w - 8, 14); box(c, x - 14, y - 26, w + 28, 34, 10, top); drawers.forEach(([dy, dh]) => { box(c, x + 20, y + dy, w - 40, dh, 12, shade(body, 0.06), 5); box(c, x + w / 2 - 40, y + dy + dh / 2 - 9, 80, 18, 9, shade(body, -0.35), 0); }); }
  function counter(c, y, top, front, frontDark) { const th = 230; box(c, -20, y, W + 40, th, 0, top); flat(c, 0, y + 16, W, 26, 0, shade(top, 0.15)); c.fillStyle = shade(top, -0.12); c.fillRect(0, y + th - 40, W, 40); c.beginPath(); c.moveTo(0, y + th - 40); c.lineTo(W, y + th - 40); c.lineWidth = 5; c.strokeStyle = O; c.stroke(); box(c, -20, y + th, W + 40, H - y - th + 20, 0, front); [[30, 340], [400, 300], [730, 330]].forEach(([x, w]) => { rr(c, x, y + th + 34, w, H - y - th, 14); c.lineWidth = 6; c.strokeStyle = frontDark; c.stroke(); }); }
  function chalkboard(c, x, y, w, h) { box(c, x, y, w, h, 26, "#e08a2a"); box(c, x + 22, y + 22, w - 44, h - 44, 14, "#24303f"); const rows = [y + 110, y + 290, y + 460]; rows.forEach((ry, i) => { c.save(); c.translate(x + 90, ry); if (i === 0) SS.Sprites && drawMini(c, "burger"); if (i === 1) drawMini(c, "fries"); if (i === 2) drawMini(c, "drink"); c.restore(); c.fillStyle = "#fff"; c.beginPath(); c.arc(x + 160, ry - 16, 8, 0, 7); c.fill(); rr(c, x + 186, ry - 22, w - 240, 12, 6); c.fill(); c.beginPath(); c.arc(x + 160, ry + 22, 8, 0, 7); c.fill(); rr(c, x + 186, ry + 16, w - 300, 12, 6); c.fill(); }); }
  function drawMini(c, kind) { // tiny menu-board doodles
    if (kind === "burger") { c.beginPath(); c.ellipse(0, -18, 46, 26, 0, Math.PI, 0); c.closePath(); fs(c, "#f2a33f", 5); box(c, -48, -16, 96, 14, 7, "#5ab546", 4); box(c, -46, -2, 92, 18, 9, "#7a3a22", 4); box(c, -44, 16, 88, 16, 8, "#f2a33f", 4); }
    if (kind === "fries") { ["#ffc533", "#ffc533", "#ffc533", "#ffc533"].forEach((col, i) => { box(c, -28 + i * 14, -46 + (i % 2) * 8, 12, 40, 4, col, 4); }); c.beginPath(); c.moveTo(-36, -10); c.lineTo(36, -10); c.lineTo(28, 40); c.lineTo(-28, 40); c.closePath(); fs(c, "#e53b2c", 5); }
    if (kind === "drink") { c.beginPath(); c.moveTo(-30, -24); c.lineTo(30, -24); c.lineTo(22, 44); c.lineTo(-22, 44); c.closePath(); fs(c, "#ffffff", 5); box(c, -36, -36, 72, 16, 6, "#e53b2c", 4); c.beginPath(); c.moveTo(4, -36); c.lineTo(16, -66); c.lineWidth = 7; c.strokeStyle = "#e53b2c"; c.stroke(); box(c, -22, 4, 44, 18, 4, "#e53b2c", 0); }
  }
  function lamp(c, x, len, col) { c.strokeStyle = O; c.lineWidth = 6; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, len); c.stroke(); c.beginPath(); c.moveTo(x - 80, len + 70); c.quadraticCurveTo(x - 76, len, x, len); c.quadraticCurveTo(x + 76, len, x + 80, len + 70); c.closePath(); fs(c, col); flat(c, x - 50, len + 26, 30, 10, 5, "rgba(255,255,255,.45)"); c.beginPath(); c.ellipse(x, len + 72, 34, 12, 0, 0, Math.PI); fs(c, "#fff3bf", 5); }
  function checkerBand(c, y, rows, size, a, b) { for (let r = 0; r < rows; r++) for (let i = 0; i * size < W; i++) { c.fillStyle = (i + r) % 2 ? a : b; c.fillRect(i * size, y + r * size, size, size); } c.beginPath(); c.moveTo(0, y + rows * size); c.lineTo(W, y + rows * size); c.lineWidth = 5; c.strokeStyle = O; c.stroke(); }
  function stool(c, x, y) { box(c, x - 18, y + 50, 36, H - y, 6, "#c9d1dc"); c.beginPath(); c.ellipse(x, y + 60, 150, 42, 0, 0, Math.PI * 2); fs(c, "#d6dde6"); c.beginPath(); c.ellipse(x, y + 30, 156, 50, 0, 0, Math.PI * 2); fs(c, "#e53b2c"); c.beginPath(); c.ellipse(x, y + 10, 150, 44, 0, 0, Math.PI * 2); fs(c, "#f0473e", 5); flat(c, x - 90, y - 8, 80, 14, 7, "rgba(255,255,255,.5)"); }

  // ---------- scenes ----------
  // Classic kitchen layout (loading screen, menu kitchen, gameplay kitchens). pal: wall, tile, tileLine, cab, cabTop, counter, front, frontDark, frame, shelf, sky, night
  function kitchenScene(c, pal, o) {
    o = o || {};
    c.fillStyle = pal.wall; c.fillRect(0, 0, W, H);
    // window (left, partly off-screen)
    if (!o.anim) windowFrame(c, -40, o.board ? 110 : 140, 360, o.board ? 610 : 620, pal.frame, { sky: pal.sky, night: pal.night });
    if (o.board) chalkboard(c, 380, 130, 360, 560);
    // shelves top-right
    const sx = o.board ? 790 : 610, sw = W - sx + 30;
    shelf(c, sx, 330, sw, pal.shelf); shelf(c, sx, 570, sw, pal.shelf);
    if (!o.board) { plantOn(c, sx + 60, 330, 0.75, "#ffffff"); platesOn(c, sx + 240, 330, 3, 120); }
    plantOn(c, sx + (o.board ? 70 : 150), 330, 1.15, "#ffffff");
    bottleOn(c, W - 196, 330, "#e8372b", 1.05); bottleOn(c, W - 122, 330, "#ffc21a", 1.05);
    jarOn(c, sx + (o.board ? 20 : 70), 570, "#ffd8d0", "#f04a3a"); jarOn(c, sx + (o.board ? 110 : 160), 570, "#cbeec0", "#3fae4a"); bowlsOn(c, sx + (o.board ? 200 : 260), 570, 3);
    // utensil rail + spatula + pan
    rail(c, 790, 700, 310, pal.metal); if (!o.anim) { spatula(c, 862, 712); pan(c, 975, 712); }
    // tiles across the lower wall
    tiles(c, 0, 1075, W, 470, pal.tile, pal.tileLine);
    // left unit: shelf with plant + bottles, cabinet below
    shelf(c, -30, 1050, 320, pal.shelf);
    plantOn(c, 205, 1050, 1.75, "#ffffff"); bottleOn(c, 6, 1050, "#e8372b", 1.25); bottleOn(c, 84, 1050, "#ffc21a", 1.25);
    cabinet(c, -20, 1115, 250, 420, pal.cab, pal.cabTop, [[40, 160], [250, 160]]);
    flat(c, -30, 1320, 270, 30, 8, pal.cabTop); rr(c, -30, 1320, 270, 30, 8); c.lineWidth = 6; c.strokeStyle = O; c.stroke();
    // right unit: cabinet with plant on top
    cabinet(c, 820, 1235, 280, 300, pal.cab, pal.cabTop, [[40, 110], [170, 110]]);
    plantOn(c, 960, 1209, 1.6, "#ffffff");
    // counter (plate rests here) + front panels
    counter(c, 1530, pal.counter, pal.front, pal.frontDark);
  }
  function truckScene(c, o) {
    o = o || {};
    c.fillStyle = "#5cc2ff"; c.fillRect(0, 0, W, H);
    if (!o.anim) { cloud(c, 140, 120, 1.0); cloud(c, 780, 110, 1.2); }
    // checker floor in perspective
    const fy = 990, vx = 540, vy = 520;
    c.fillStyle = "#ffffff"; c.fillRect(0, fy, W, H - fy);
    c.save(); c.beginPath(); c.rect(0, fy, W, H - fy); c.clip();
    for (let row = 0; row < 12; row++) {
      const t0 = row / 12, t1 = (row + 1) / 12, y0 = fy + (H - fy) * Math.pow(t0, 1.5), y1 = fy + (H - fy) * Math.pow(t1, 1.5);
      for (let col = -12; col < 12; col++) { if ((row + col) % 2 === 0) continue; const xa = x => vx + (x - vx) * ((y0 - vy) / (H - vy)), xb = x => vx + (x - vx) * ((y1 - vy) / (H - vy)); const X0 = vx + col * 190, X1 = X0 + 190; c.beginPath(); c.moveTo(xa(X0), y0); c.lineTo(xa(X1), y0); c.lineTo(xb(X1), y1); c.lineTo(xb(X0), y1); c.closePath(); c.fillStyle = "#4aa3f0"; c.fill(); }
    }
    c.restore();
    c.beginPath(); c.moveTo(0, fy); c.lineTo(W, fy); c.lineWidth = 6; c.strokeStyle = O; c.stroke();
    // truck body
    box(c, -40, 160, W + 20, 820, 40, "#ffcf2e");
    flat(c, -20, 182, W - 20, 20, 10, "#ffe27a");
    c.fillStyle = "#f2b705"; c.fillRect(-40, 900, W + 20, 30);
    // awning
    const ay = 170, aw = W + 40; for (let i = 0; i < 10; i++) { const x = -20 + i * aw / 10; c.beginPath(); c.moveTo(x, ay); c.lineTo(x + aw / 10, ay); c.lineTo(x + aw / 10, ay + 90); c.arc(x + aw / 20, ay + 90, aw / 20, 0, Math.PI); c.closePath(); c.fillStyle = i % 2 ? "#ffffff" : "#e8372b"; c.fill(); }
    c.beginPath(); c.moveTo(-20, ay); c.lineTo(W + 20, ay); c.lineWidth = 6; c.strokeStyle = O; c.stroke();
    for (let i = 0; i < 10; i++) { const x = -20 + i * aw / 10; c.beginPath(); c.arc(x + aw / 20, ay + 90, aw / 20, 0, Math.PI); c.stroke(); }
    // dark side window + door
    box(c, 30, 360, 170, 260, 18, "#2b3445");
    box(c, W - 110, 360, 140, 360, 18, "#bfe3ff"); box(c, W - 70, 760, 50, 90, 12, "#3b4a66");
    // serving window with kitchen inside
    box(c, 240, 330, 720, 420, 18, "#3d6fae");
    c.fillStyle = "#2f5a92"; c.fillRect(250, 560, 700, 180);
    rail(c, 290, 380, 300); spatula(c, 330, 392); pan(c, 450, 392);
    shelf(c, 600, 470, 330, "#8fa3c4");
    box(c, 630, 424, 90, 46, 8, "#ffc533"); box(c, 640, 400, 70, 26, 8, "#ffc533"); box(c, 760, 424, 70, 46, 6, "#ffc533"); bottle(c, 856, 360, "#e8372b", 0.75); bottle(c, 896, 360, "#ffc21a", 0.75);
    box(c, 640, 600, 220, 90, 10, "#c9d1dc"); box(c, 660, 570, 120, 40, 8, "#e9edf2");
    box(c, 220, 720, 760, 48, 12, "#c9d1dc");
    // wheel
    c.beginPath(); c.arc(60, 960, 110, 0, 7); c.fillStyle = "#2f3a52"; c.fill(); c.lineWidth = 7; c.strokeStyle = O; c.stroke(); c.beginPath(); c.arc(60, 960, 58, 0, 7); c.fillStyle = "#c9d1dc"; c.fill(); c.stroke(); c.beginPath(); c.arc(60, 960, 18, 0, 7); c.fillStyle = "#8a96aa"; c.fill();
    c.fillStyle = "rgba(15,24,48,.18)"; c.beginPath(); c.ellipse(560, 1000, 600, 30, 0, 0, 7); c.fill();
  }
  function dinerScene(c, o) {
    o = o || {};
    c.fillStyle = "#fbf2e2"; c.fillRect(0, 0, W, H);
    checkerBand(c, 0, 2, 54, "#e8372b", "#ffffff");
    if (!o.anim) { lamp(c, 90, 108, "#e8372b"); lamp(c, 540, 108, "#e8372b"); lamp(c, 990, 108, "#e8372b"); windowFrame(c, -40, 260, 360, 520, "#e8372b"); }
    // red shelves right
    const red = "#e8372b";
    shelf(c, 620, 400, 490, red); shelf(c, 620, 640, 490, red);
    shadowUnder(c, 705, 400, 80); ["#e8372b", "#ffffff", "#e8372b"].forEach((col, i) => box(c, 682 + i * 18, 262 + i * 6, 12, 70, 5, col, 4)); box(c, 670, 300, 70, 100, 10, "#ffffff");
    platesOn(c, 780, 400, 3, 140); bottleOn(c, W - 196, 400, "#e8372b", 1.05); bottleOn(c, W - 122, 400, "#ffc21a", 1.05);
    jarOn(c, 690, 640, "#ffd8d0", "#f04a3a"); jarOn(c, 780, 640, "#cbeec0", "#3fae4a"); bowlsOn(c, 880, 640, 3);
    rail(c, 800, 740, 300, red); if (!o.anim) { spatula(c, 870, 752); pan(c, 985, 752); }
    // checker wainscot + cabinets
    checkerBand(c, 1090, 2, 54, "#e8372b", "#ffffff");
    c.fillStyle = "#fbf2e2"; c.fillRect(0, 1198, W, 340);
    cabinet(c, -20, 1110, 260, 430, "#ffffff", red, [[40, 150], [220, 150]]);
    plantOn(c, 190, 1084, 1.6, "#ffffff"); bottleOn(c, 10, 1084, "#e8372b", 1.2); bottleOn(c, 84, 1084, "#ffc21a", 1.2);
    cabinet(c, 840, 1225, 260, 310, "#ffffff", red, [[40, 110], [170, 110]]);
    plantOn(c, 970, 1199, 1.5, "#ffffff");
    // white counter top + red front, stools in front
    box(c, -20, 1530, W + 40, 190, 0, "#f6f1ea"); flat(c, 0, 1546, W, 22, 0, "#ffffff"); c.fillStyle = "#e2d9cc"; c.fillRect(0, 1684, W, 36);
    box(c, -20, 1720, W + 40, 240, 0, red); c.fillStyle = "#c92a2a"; c.fillRect(0, 1720, W, 22);
    stool(c, 120, 1780); stool(c, 540, 1780); stool(c, 960, 1780);
  }

  const PAL = {
    classic: { wall: "#7fc8f5", tile: "#c8e8fb", tileLine: "#9dd0f2", cab: "#2f7fe0", cabTop: "#f2a33f", counter: "#f2a33f", front: "#7a3f22", frontDark: "#5e2f18", frame: "#2f7fe0", shelf: "#f2a33f", sky: "#7fd3ff", metal: "#3b4a66" },
    cream: { wall: "#fbf0d6", tile: "#f7e7c2", tileLine: "#ead39d", cab: "#2f7fe0", cabTop: "#f2a33f", counter: "#f2a33f", front: "#7a3f22", frontDark: "#5e2f18", frame: "#2f7fe0", shelf: "#f2a33f", sky: "#7fd3ff", metal: "#3b4a66" },
    modern: { wall: "#eef1f5", tile: "#ffffff", tileLine: "#d5dbe3", cab: "#4b5563", cabTop: "#20c997", counter: "#dfe4ea", front: "#4b5563", frontDark: "#373f4a", frame: "#343a40", shelf: "#adb5bd", sky: "#cfe8ff", metal: "#343a40" },
    cafe: { wall: "#f3d9b1", tile: "#fbe8cc", tileLine: "#e2c290", cab: "#8d5a3b", cabTop: "#c08457", counter: "#c08457", front: "#6e4229", frontDark: "#55311d", frame: "#6e4229", shelf: "#c08457", sky: "#ffd8a8", metal: "#55311d" },
    night: { wall: "#3b3f6b", tile: "#4a4f80", tileLine: "#363a66", cab: "#5f3dc4", cabTop: "#9775fa", counter: "#9775fa", front: "#45289e", frontDark: "#341d7a", frame: "#22264f", shelf: "#9775fa", sky: "#1b1f4b", night: true, metal: "#22264f" },
    garden: { wall: "#dff6e6", tile: "#ffffff", tileLine: "#c3eccf", cab: "#2b8a3e", cabTop: "#d9a066", counter: "#d9a066", front: "#8a5a32", frontDark: "#6e4426", frame: "#2b8a3e", shelf: "#94d82d", sky: "#a5e3ff", metal: "#2b8a3e" },
    candy: { wall: "#ffe3ef", tile: "#ffffff", tileLine: "#fcc2d7", cab: "#f06595", cabTop: "#66d9e8", counter: "#e599f7", front: "#cc5de8", frontDark: "#ae3ec9", frame: "#d6336c", shelf: "#faa2c1", sky: "#ffd6e8", metal: "#d6336c" }
  };
  const KIT = { kitchen_default: ["kitchen", "classic"], kitchen_modern: ["kitchen", "modern"], kitchen_cozy_cafe: ["kitchen", "cafe", { board: true }], kitchen_night: ["kitchen", "night"], kitchen_retro_diner: ["diner"], kitchen_food_truck: ["truck"], kitchen_garden: ["kitchen", "garden"], kitchen_candy: ["kitchen", "candy"] };
  const cache = {};
  const kindOf = key => key === "loading" ? ["kitchen", "cream", {}] : key === "menu" ? ["kitchen", "cream", { board: true }] : (KIT[key] || KIT.kitchen_default).concat([]);
  function scene(key, anim) {
    const reference=SS.Reference&&SS.Reference.background(key);if(reference)return reference;
    const ck = key + (anim ? ":base" : ""); if (cache[ck]) return cache[ck];
    const c = mk(), ctx = c.getContext("2d"), k = kindOf(key), o = Object.assign({}, k[2] || {}, { anim: !!anim });
    if (k[0] === "truck") truckScene(ctx, o); else if (k[0] === "diner") dinerScene(ctx, o); else kitchenScene(ctx, PAL[k[1]], o);
    cache[ck] = c; return c;
  }
  // Moving layer drawn over the animated base: drifting clouds, swinging utensils, swaying lamps.
  function drawDyn(c, key, t) {
    if(SS.Reference&&SS.Reference.hasKitchen(key))return;
    const k = kindOf(key), o = k[2] || {}, sw = (ph, amp) => Math.sin(t * 1.4 + ph) * amp;
    const hang = (x, y, f, ph) => { c.save(); c.translate(x, y); c.rotate(sw(ph, 0.07)); c.translate(-x, -y); f(); c.restore(); };
    if (k[0] === "truck") { const span = W + 500; [[140, 120, 1.0, 14], [780, 110, 1.2, 9], [420, 70, 0.7, 20]].forEach(([x0, y, sc, sp]) => cloud(c, ((x0 + t * sp) % span + span) % span - 250, y, sc)); return; }
    if (k[0] === "diner") {
      [90, 540, 990].forEach((x, i) => { c.save(); c.translate(x, 0); c.rotate(sw(i * 1.7, 0.035)); c.translate(-x, 0); lamp(c, x, 108, "#e8372b"); c.restore(); });
      windowFrame(c, -40, 260, 360, 520, "#e8372b", { t });
      hang(870, 752, () => spatula(c, 870, 752), 0.4); hang(985, 752, () => pan(c, 985, 752), 1.9); return;
    }
    const pal = PAL[k[1]];
    windowFrame(c, -40, o.board ? 110 : 140, 360, o.board ? 610 : 620, pal.frame, { sky: pal.sky, night: pal.night, t });
    hang(862, 712, () => spatula(c, 862, 712), 0.4); hang(975, 712, () => pan(c, 975, 712), 1.9);
  }
  // Animate a full-screen canvas: base + moving layer. Loading screen also pans slowly (gentle scroll).
  // Menu screens: Snack Stack Cafe scenes (vector art in assets/bg/cafe_*.svg; source: cafe_kit.py.txt + cafe_scenes.py.txt).
  // Each is rasterised once into its own canvas; until one is ready the kitchen "menu" scene is drawn instead.
  const CAFE = ["anchor", "level", "shop", "settings", "results"];
  const cafe = {};
  const img = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = SS.assetURL(src); });
  // load the home scene first so the title screen is ready quickly; the rest follow in the background
  const homeLoad = img("assets/bg/cafe_anchor.svg").then(i => { if (i) { const c = mk(); c.getContext("2d").drawImage(i, 0, 0, W, H); cafe.anchor = c; } });
  homeLoad.then(() => CAFE.slice(1).forEach(n => img("assets/bg/cafe_" + n + ".svg").then(i => { if (i) { const c = mk(); c.getContext("2d").drawImage(i, 0, 0, W, H); cafe[n] = c; } })));
  function draw(c, key, t, opts) {
    opts = opts || {};
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (CAFE.indexOf(key) >= 0) { const k = cafe[key] ? key : cafe.anchor ? "anchor" : null; if (k) { c.drawImage(cafe[k], 0, 0); return; } key = "menu"; }
    if (opts.pan) { const z = 1.1; c.setTransform(z, 0, 0, z, -54 - Math.sin(t * 0.35) * 48, -96 - Math.cos(t * 0.27) * 20); }
    c.drawImage(scene(key, true), 0, 0); drawDyn(c, key, t);
    c.setTransform(1, 0, 0, 1, 0, 0);
  }
  function url(key, q) { const k = "url:" + key; return cache[k] || (cache[k] = scene(key).toDataURL("image/jpeg", q || 0.9)); }
  return { homeLoad, scene, url, draw, drawDyn, kitchen: id => scene(id, true), still: id => scene(id) };
})();
