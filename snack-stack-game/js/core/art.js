// Snack Stack \u2014 procedural art: ingredients, hazards, bonuses, plates, kitchens, menu backdrop, avatars, recipe thumbs.
// Style: chunky 3/4-view cartoon food, flat fills with soft shading, thick navy inner outline + white sticker rim + soft drop shadow.
// Dish, scene and UI artwork comes from native SVG. Canvas outputs are display caches.
window.SS = window.SS || {};

SS.Art = (function () {
  const OUT = "#3b2314";
  const LW = 6;          // inner (navy) outline
  const RIM = 6;         // white sticker rim, design px (style rules v2: thinner)
  const cache = {};
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  function shade(hex, amt) { // amt -1..1 (negative darkens toward black, positive lightens toward white)
    let c = String(hex).replace("#", ""); if (c.length === 3) c = c.split("").map(x => x + x).join("");
    let r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
  }
  function stroke(ctx, w) { ctx.lineWidth = w || LW; ctx.strokeStyle = OUT; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke(); }
  function rr(ctx, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function seeded(seed) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function vgrad(ctx, y0, y1, c0, c1) { return c0; } // flat 2D style: solid fills only
  function gloss(ctx, x, y, rx, ry, a0, a1, w) { ctx.save(); ctx.globalAlpha = 0.6; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = w || 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, a0 === undefined ? Math.PI * 1.08 : a0, a1 === undefined ? Math.PI * 1.38 : a1); ctx.stroke(); ctx.restore(); }
  function dot(ctx, x, y, rx, ry, rot, col) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry === undefined ? rx : ry, rot || 0, 0, 7); if (col) ctx.fillStyle = col; ctx.fill(); }
  // wobbly ellipse path (rough edges for patties, eggs, cookies)
  function blob(ctx, cx, cy, rx, ry, n, amp, rnd) {
    ctx.beginPath();
    const pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, k = 1 + (rnd() - 0.5) * amp; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    for (let i = 0; i <= n; i++) { const p = pts[i % n], q = pts[(i + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; if (i === 0) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(p[0], p[1], mx, my); }
    ctx.closePath();
  }

  // ---------------- sticker rim (white outline + soft drop shadow) ----------------
  function silhouette(src, color) { const c = mk(src.width, src.height), x = c.getContext("2d"); x.drawImage(src, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height); return c; }
  function makeRim(src, r, shadow) {
    const c = mk(src.width, src.height), x = c.getContext("2d");
    if (shadow !== false) { const sh = silhouette(src, "rgba(15,24,48,0.28)"); x.drawImage(sh, 0, r + Math.max(4, r * 0.6)); }
    const wt = silhouette(src, "#ffffff");
    const steps = 20; for (let i = 0; i < steps; i++) { const a = i / steps * Math.PI * 2; x.drawImage(wt, Math.cos(a) * r, Math.sin(a) * r); x.drawImage(wt, Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55); }
    return c;
  }
  function withRim(src, r, shadow) { const c = mk(src.width, src.height), x = c.getContext("2d"); x.drawImage(makeRim(src, r, shadow), 0, 0); x.drawImage(src, 0, 0); return c; }
  function topOf(c) { const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 20) return y; return 0; }

  // ---------------- 3/4-view puck (origin bottom-center; lowest point of the bottom arc = y 0) ----------------
  function puckRY(w) { return Math.round(w * 0.12); }
  function puckBody(ctx, w, t, ry) { ctx.beginPath(); ctx.moveTo(-w / 2, -ry - t); ctx.lineTo(-w / 2, -ry); ctx.ellipse(0, -ry, w / 2, ry, 0, Math.PI, 0, true); ctx.lineTo(w / 2, -ry - t); ctx.closePath(); }
  function puck(ctx, w, t, side, top, opts) {
    opts = opts || {};
    const ry = opts.ry || puckRY(w);
    puckBody(ctx, w, t, ry);
    ctx.fillStyle = vgrad(ctx, -ry - t, 0, side, shade(side, -0.28)); ctx.fill();
    // soft rim light on the side band
    ctx.save(); ctx.clip(); ctx.globalAlpha = 0.35; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(-w * 0.28, -ry - t * 0.35, w * 0.12, t * 0.25 + 2, 0, 0, 7); ctx.fill(); ctx.restore();
    puckBody(ctx, w, t, ry); stroke(ctx);
    const topY = -ry - t;
    ctx.beginPath(); ctx.ellipse(0, topY, w / 2, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = typeof top === "string" ? vgrad(ctx, topY - ry, topY + ry, shade(top, 0.12), top) : top; ctx.fill(); stroke(ctx);
    return { topY, ry, t };
  }
  // points on a top face (u,v in -1..1) projected to the ellipse
  const onTop = (r, w, u, v) => [u * w * 0.5, r.topY + v * r.ry];

  // ---------------- ingredient painters ----------------
  const P = {
    bun_bottom(ctx, d, rnd) {
      const w = d.w, a = d.art, t = 26;
      const r = puck(ctx, w, t, a.c1, "#ffe3a8");
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, r.topY, w / 2 - 4, r.ry - 3, 0, 0, 7); ctx.clip();
      ctx.fillStyle = "rgba(214,150,60,.35)"; for (let i = 0; i < 40; i++) { const [x, y] = onTop(r, w, rnd() * 1.8 - 0.9, rnd() * 1.6 - 0.8); dot(ctx, x, y, 3, 2); }
      ctx.strokeStyle = a.c2; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(0, r.topY, w / 2 - 6, r.ry - 5, 0, 0, 7); ctx.stroke();
      ctx.restore();
      gloss(ctx, 0, -r.ry - t * 0.4, w * 0.44, t * 0.6, Math.PI * 0.62, Math.PI * 0.9, 5);
    },
    bun_top(ctx, d, rnd) {
      const w = d.w, a = d.art, ry = puckRY(w), dome = 92;
      // underside band (cut edge), then the dome
      ctx.beginPath(); ctx.moveTo(-w / 2, -ry); ctx.ellipse(0, -ry, w / 2, ry, 0, Math.PI, 0, true); ctx.closePath(); ctx.fillStyle = shade(a.c1, -0.15); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-w / 2, -ry); ctx.bezierCurveTo(-w / 2 - 4, -ry - dome * 1.05, w / 2 + 4, -ry - dome * 1.05, w / 2, -ry); ctx.ellipse(0, -ry, w / 2, ry, 0, 0, Math.PI, false); ctx.closePath();
      const g = ctx.createRadialGradient(-w * 0.18, -ry - dome * 0.7, 10, 0, -ry - dome * 0.3, w * 0.62); g.addColorStop(0, a.c2); g.addColorStop(0.55, shade(a.c1, 0.08)); g.addColorStop(1, shade(a.c1, -0.18)); ctx.fillStyle = g; ctx.fill(); stroke(ctx);
      // pale band where bun meets bottom (baked edge)
      ctx.save(); ctx.beginPath(); ctx.moveTo(-w / 2, -ry); ctx.bezierCurveTo(-w / 2 - 4, -ry - dome * 1.05, w / 2 + 4, -ry - dome * 1.05, w / 2, -ry); ctx.ellipse(0, -ry, w / 2, ry, 0, 0, Math.PI, false); ctx.clip();
      ctx.strokeStyle = "rgba(255,236,190,.55)"; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(0, -ry - 4, w / 2 - 2, ry, 0, 0.15, Math.PI - 0.15); ctx.stroke();
      if (a.seeds) { for (let i = 0; i < 22; i++) { const u = (rnd() * 2 - 1) * 0.82, v = rnd(); const x = u * w * 0.46, top = -ry - dome * 0.78 * Math.sqrt(Math.max(0, 1 - u * u)); const y = top + (-ry - 6 - top) * v * 0.85 + 4; ctx.save(); ctx.translate(x, y); ctx.rotate(rnd() * 3); dot(ctx, 0, 0, 7, 4, 0, "#fff6dc"); ctx.strokeStyle = "rgba(160,100,30,.5)"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); } }
      ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.7; ctx.strokeStyle = "#fff"; ctx.lineWidth = 9; ctx.lineCap = "round"; ctx.beginPath(); ctx.ellipse(-w * 0.1, -ry - dome * 0.42, w * 0.3, dome * 0.38, 0, Math.PI * 1.12, Math.PI * 1.42); ctx.stroke(); ctx.restore();
    },
    patty(ctx, d, rnd) {
      const w = d.w, a = d.art, t = a.fish ? 22 : 26, ry = puckRY(w);
      if (a.fish) { // breaded fillet: rounded rectangle puck
        const r = puck(ctx, w, t, a.c1, a.c2, { ry });
        ctx.fillStyle = shade(a.c2, 0.3); for (let i = 0; i < 46; i++) { const [x, y] = onTop(r, w, rnd() * 1.7 - 0.85, rnd() * 1.5 - 0.75); dot(ctx, x, y, 3.2, 2.4); }
        ctx.fillStyle = shade(a.c1, -0.15); for (let i = 0; i < 22; i++) { const [x, y] = onTop(r, w, rnd() * 1.7 - 0.85, rnd() * 1.5 - 0.75); dot(ctx, x, y, 2.4, 1.8); }
        gloss(ctx, -w * 0.05, r.topY, w * 0.36, r.ry * 0.7); return;
      }
      // rough-edged body
      ctx.beginPath(); ctx.moveTo(-w / 2, -ry - t);
      for (let i = 0; i <= 10; i++) ctx.lineTo(-w / 2 + (rnd() - 0.5) * 4, -ry - t + (t * i) / 10);
      ctx.ellipse(0, -ry, w / 2, ry, 0, Math.PI, 0, true); ctx.lineTo(w / 2, -ry - t); ctx.closePath();
      ctx.fillStyle = vgrad(ctx, -ry - t, 0, a.c1, shade(a.c1, -0.35)); ctx.fill(); stroke(ctx);
      const r = { topY: -ry - t, ry };
      blob(ctx, 0, r.topY, w / 2, ry, 22, 0.08, rnd); ctx.fillStyle = vgrad(ctx, r.topY - ry, r.topY + ry, shade(a.c2, 0.1), a.c2); ctx.fill(); stroke(ctx);
      ctx.save(); blob(ctx, 0, r.topY, w / 2 - 6, ry - 4, 22, 0.05, seeded(7)); ctx.clip();
      if (a.grill) { ctx.strokeStyle = shade(a.c1, -0.45); ctx.lineWidth = 9; ctx.lineCap = "round"; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * w * 0.16 - 24, r.topY - ry * 0.55); ctx.lineTo(i * w * 0.16 + 24, r.topY + ry * 0.55); ctx.stroke(); } }
      const specCol = a.crumb ? shade(a.c2, 0.35) : shade(a.c1, -0.32);
      ctx.fillStyle = specCol; for (let i = 0; i < 40; i++) { const [x, y] = onTop(r, w, rnd() * 1.8 - 0.9, rnd() * 1.6 - 0.8); dot(ctx, x, y, a.crumb ? 3.5 : 2.6, a.crumb ? 2.6 : 2); }
      if (a.speck) { ctx.fillStyle = a.c1 === "#6f8f3a" ? "#f08c00" : "#ffe8cc"; for (let i = 0; i < 16; i++) { const [x, y] = onTop(r, w, rnd() * 1.6 - 0.8, rnd() * 1.4 - 0.7); dot(ctx, x, y, 3, 2.2); } }
      ctx.restore();
      gloss(ctx, -w * 0.04, r.topY, w * 0.36, ry * 0.7, Math.PI * 1.1, Math.PI * 1.36, 5);
    },
    lettuce(ctx, d, rnd) {
      const w = d.w + 22, a = d.art, ry = puckRY(w) + 4, cy = -ry - 8, n = 18;
      // frilly outer leaf (hangs a little over the edge)
      ctx.beginPath();
      for (let i = 0; i <= n; i++) { const ang = i / n * Math.PI * 2, k = i % 2 ? 1.0 : 0.9, x = Math.cos(ang) * w / 2 * k, y = cy + Math.sin(ang) * ry * k + (Math.sin(ang) > 0 ? (i % 2 ? 12 : 4) : 0); if (i === 0) ctx.moveTo(x, y); else { const pa = (i - 0.5) / n * Math.PI * 2; ctx.quadraticCurveTo(Math.cos(pa) * w / 2 * 1.06, cy + Math.sin(pa) * ry * 1.1 + (Math.sin(pa) > 0 ? 14 : 0), x, y); } }
      ctx.closePath(); ctx.fillStyle = vgrad(ctx, cy - ry, cy + ry + 14, a.c2, shade(a.c1, -0.12)); ctx.fill(); stroke(ctx);
      blob(ctx, 0, cy - 2, w * 0.36, ry * 0.62, 14, 0.18, rnd); ctx.fillStyle = shade(a.c2, 0.25); ctx.fill();
      ctx.strokeStyle = shade(a.c1, -0.08); ctx.lineWidth = 4; ctx.lineCap = "round";
      for (let i = 0; i < 7; i++) { const ang = Math.PI * (0.1 + i * 0.13) + Math.PI, x2 = Math.cos(ang) * w * 0.42, y2 = cy + Math.sin(ang) * ry * 0.85; ctx.beginPath(); ctx.moveTo(0, cy + 2); ctx.quadraticCurveTo(x2 * 0.5, cy + (y2 - cy) * 0.2, x2, y2); ctx.stroke(); }
      for (let i = 0; i < 5; i++) { const ang = Math.PI * (0.18 + i * 0.16), x2 = Math.cos(ang) * w * 0.44, y2 = cy + Math.sin(ang) * ry * 1.05; ctx.beginPath(); ctx.moveTo(0, cy + 2); ctx.quadraticCurveTo(x2 * 0.5, cy + (y2 - cy) * 0.3, x2, y2); ctx.stroke(); }
    },
    tomato(ctx, d, rnd) {
      const w = d.w, a = d.art, r = puck(ctx, w, 12, shade(a.c1, -0.08), a.c1);
      ctx.beginPath(); ctx.ellipse(0, r.topY, w / 2 - 14, r.ry - 6, 0, 0, 7); ctx.fillStyle = a.c2; ctx.fill();
      ctx.fillStyle = a.c1; for (let i = 0; i < 6; i++) { const ang = i / 6 * Math.PI * 2 + 0.25; ctx.save(); ctx.translate(Math.cos(ang) * w * 0.25, r.topY + Math.sin(ang) * r.ry * 0.52); ctx.beginPath(); ctx.ellipse(0, 0, 26, 9, ang * 0.15, 0, 7); ctx.fillStyle = "#c92a2a"; ctx.fill(); ctx.fillStyle = "#ffe08a"; for (let k = -1; k <= 1; k++) dot(ctx, k * 9, 0, 3.4, 2.2); ctx.restore(); }
      dot(ctx, 0, r.topY, 16, 6, 0, shade(a.c2, 0.25));
      gloss(ctx, 0, r.topY, w * 0.4, r.ry * 0.75, Math.PI * 1.1, Math.PI * 1.35, 5);
    },
    onion(ctx, d) {
      const w = d.w, a = d.art, ry = puckRY(w) * 0.8;
      [[-w * 0.2, -ry - 10, 0.33], [w * 0.2, -ry - 12, 0.32], [0, -ry - 4, 0.3]].forEach(([x, y, s]) => {
        const rx = w * s, ery = ry * s * 2.6;
        ctx.beginPath(); ctx.ellipse(x, y + 5, rx, ery, 0, 0, 7); ctx.lineWidth = 22; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 12; ctx.strokeStyle = shade(a.c2, -0.1); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, y, rx, ery, 0, 0, 7); ctx.lineWidth = 22; ctx.strokeStyle = OUT; ctx.stroke(); ctx.lineWidth = 12; ctx.strokeStyle = a.c1; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = a.c2; ctx.stroke();
      });
    },
    pickles(ctx, d, rnd) {
      const w = d.w, a = d.art, ry = puckRY(w);
      [[-0.55, -0.1], [-0.1, -0.45], [0.34, -0.2], [-0.32, 0.45], [0.18, 0.4], [0.62, 0.3]].forEach(([u, v]) => {
        ctx.save(); ctx.translate(u * w * 0.5, -ry - 4 + v * ry);
        const cw = 74, cr = puck(ctx, cw, 7, a.c1, a.c2, { ry: 12 });
        ctx.strokeStyle = shade(a.c1, -0.1); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, cr.topY, cw * 0.36, 8, 0, 0, 7); ctx.stroke();
        ctx.fillStyle = "#f4f9d2"; for (let k = 0; k < 5; k++) { const an = k / 5 * 6.28; dot(ctx, Math.cos(an) * 12, cr.topY + Math.sin(an) * 3.5, 3, 1.8); }
        ctx.restore();
      });
    },
    cheese(ctx, d, rnd) {
      const w = d.w, a = d.art, ry = puckRY(w), cy = -ry - 6, hw = w * 0.5, hh = ry * 1.35;
      const L = [-hw, cy], T = [0, cy - hh], R = [hw, cy], B = [0, cy + hh];
      // thickness under the two front edges
      ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(R[0], R[1]); ctx.lineTo(R[0], R[1] + 8); ctx.lineTo(B[0], B[1] + 8); ctx.lineTo(L[0], L[1] + 8); ctx.closePath(); ctx.fillStyle = shade(a.c1, -0.18); ctx.fill(); stroke(ctx);
      // top face with drooping corners
      ctx.beginPath(); ctx.moveTo(L[0] + 10, L[1] + 16); ctx.quadraticCurveTo(L[0] - 6, L[1] + 4, L[0] + 18, L[1] - 6);
      ctx.lineTo(T[0] - 14, T[1] + 6); ctx.quadraticCurveTo(T[0], T[1] - 2, T[0] + 14, T[1] + 6);
      ctx.lineTo(R[0] - 18, R[1] - 6); ctx.quadraticCurveTo(R[0] + 6, R[1] + 4, R[0] - 10, R[1] + 16);
      ctx.lineTo(B[0] + 16, B[1] + 2); ctx.quadraticCurveTo(B[0], B[1] + 26, B[0] - 16, B[1] + 2); ctx.closePath();
      ctx.fillStyle = vgrad(ctx, T[1], B[1] + 20, a.c2, a.c1); ctx.fill(); stroke(ctx);
      ctx.save(); ctx.clip();
      if (a.holes) { [[-0.45, 0.05, 15], [0.1, -0.35, 11], [0.42, 0.1, 13], [-0.05, 0.45, 9], [0.0, 0.0, 7]].forEach(([u, v, s]) => { dot(ctx, u * hw, cy + v * hh, s, s * 0.6, 0, shade(a.c1, -0.18)); dot(ctx, u * hw, cy + v * hh + 2, s * 0.8, s * 0.42, 0, shade(a.c1, -0.32)); }); }
      if (a.specks) { for (let i = 0; i < 26; i++) { const u = rnd() * 1.4 - 0.7, v = (rnd() * 1.4 - 0.7) * (1 - Math.abs(u)); dot(ctx, u * hw, cy + v * hh, 3, 2, 0, i % 3 ? "#e03131" : "#2f9e44"); } }
      ctx.restore();
      gloss(ctx, -hw * 0.25, cy - hh * 0.2, hw * 0.4, hh * 0.45, Math.PI * 1.15, Math.PI * 1.45, 5);
    },
    bacon(ctx, d, rnd) {
      const w = d.w, a = d.art, ry = puckRY(w);
      [[-0.25, -0.9, 0.12], [0.2, -0.5, -0.1]].forEach(([v, , rot], k) => {
        ctx.save(); ctx.translate(0, -ry - 6 + (k ? 8 : -6)); ctx.rotate(rot);
        const L = -w / 2, n = 6, bw = 30;
        const path = (off) => { ctx.beginPath(); ctx.moveTo(L, off); for (let i = 1; i <= n; i++) ctx.quadraticCurveTo(L + w * (i - 0.5) / n, off + (i % 2 ? -14 : 14), L + w * i / n, off); };
        // ribbon: top edge then bottom edge back
        ctx.beginPath(); ctx.moveTo(L, -bw / 2); for (let i = 1; i <= n; i++) ctx.quadraticCurveTo(L + w * (i - 0.5) / n, -bw / 2 + (i % 2 ? -14 : 14), L + w * i / n, -bw / 2);
        ctx.lineTo(L + w, bw / 2); for (let i = n - 1; i >= 0; i--) ctx.quadraticCurveTo(L + w * (i + 0.5) / n, bw / 2 + (i % 2 ? 14 : -14), L + w * i / n, bw / 2); ctx.closePath();
        ctx.fillStyle = vgrad(ctx, -bw, bw, shade(a.c1, 0.08), shade(a.c1, -0.2)); ctx.fill(); stroke(ctx, 5);
        ctx.strokeStyle = a.c2; ctx.lineWidth = 6; path(-3); ctx.stroke(); ctx.strokeStyle = shade(a.c2, 0.4); ctx.lineWidth = 3; path(7); ctx.stroke();
        ctx.restore();
      });
    },
    egg(ctx, d, rnd) {
      const w = d.w, a = d.art, ry = puckRY(w) + 6, cy = -ry - 6;
      blob(ctx, 0, cy + 6, w / 2, ry, 16, 0.14, rnd); ctx.fillStyle = "#e9ecef"; ctx.fill(); stroke(ctx);
      blob(ctx, 0, cy, w / 2 - 2, ry - 2, 16, 0.14, seeded(hash("egg2"))); ctx.fillStyle = "#ffffff"; ctx.fill(); stroke(ctx);
      ctx.beginPath(); ctx.ellipse(w * 0.05, cy - 16, 40, 30, 0, Math.PI, 0); ctx.ellipse(w * 0.05, cy - 16, 40, 16, 0, 0, Math.PI); ctx.closePath();
      const g = ctx.createRadialGradient(w * 0.05 - 12, cy - 30, 4, w * 0.05, cy - 16, 44); g.addColorStop(0, "#ffe066"); g.addColorStop(1, a.c2); ctx.fillStyle = g; ctx.fill(); stroke(ctx, 5);
      dot(ctx, w * 0.05 - 14, cy - 30, 10, 6, -0.4, "rgba(255,255,255,.85)");
    },
    avocado(ctx, d) {
      const w = d.w, a = d.art, ry = puckRY(w);
      [-0.36, -0.12, 0.12, 0.36].forEach((u, i) => {
        ctx.save(); ctx.translate(u * w, -ry - 4 + (i % 2) * 6); ctx.rotate((i - 1.5) * 0.1);
        ctx.beginPath(); ctx.ellipse(0, 0, 42, 22, 0, 0, Math.PI * 2); ctx.fillStyle = "#3d6b21"; ctx.fill(); stroke(ctx, 5);
        ctx.beginPath(); ctx.ellipse(0, -3, 35, 16, 0, 0, Math.PI * 2); ctx.fillStyle = vgrad(ctx, -19, 13, shade(a.c2, 0.2), a.c1); ctx.fill();
        dot(ctx, -10, -7, 10, 4, -0.2, "rgba(255,255,255,.45)");
        ctx.restore();
      });
    },
    toast(ctx, d, rnd) {
      const w = d.w, a = d.art, t = 24, ry = puckRY(w) * 1.25;
      const face = (y) => { ctx.beginPath(); ctx.moveTo(-w / 2 + 6, y + ry * 0.2); ctx.lineTo(-w * 0.38, y - ry * 0.8); ctx.bezierCurveTo(-w * 0.34, y - ry * 1.6, -w * 0.05, y - ry * 1.5, 0, y - ry * 1.15); ctx.bezierCurveTo(w * 0.05, y - ry * 1.5, w * 0.34, y - ry * 1.6, w * 0.38, y - ry * 0.8); ctx.lineTo(w / 2 - 6, y + ry * 0.2); ctx.quadraticCurveTo(w / 2 - 6, y + ry * 0.9, w * 0.3, y + ry * 0.9); ctx.lineTo(-w * 0.3, y + ry * 0.9); ctx.quadraticCurveTo(-w / 2 + 6, y + ry * 0.9, -w / 2 + 6, y + ry * 0.2); ctx.closePath(); };
      face(-ry * 0.9); ctx.fillStyle = shade(a.c1, -0.3); ctx.fill(); stroke(ctx);
      ctx.fillStyle = shade(a.c1, -0.15); ctx.fillRect(-w / 2 + 6, -ry * 0.9 - t, w - 12, t);
      face(-ry * 0.9 - t); ctx.fillStyle = shade(a.c1, -0.05); ctx.fill(); stroke(ctx);
      ctx.save(); ctx.translate(0, -ry * 0.9 - t); ctx.scale(0.86, 0.8); face(0); ctx.restore(); ctx.fillStyle = vgrad(ctx, -ry * 2.4 - t, -t, shade(a.c2, 0.15), a.c2); ctx.fill();
      ctx.fillStyle = shade(a.c1, -0.05); for (let i = 0; i < 26; i++) dot(ctx, (rnd() - 0.5) * w * 0.6, -ry * 0.9 - t + (rnd() - 0.6) * ry * 1.4, 2.6, 1.8);
      gloss(ctx, -w * 0.08, -ry * 0.9 - t - ry * 0.3, w * 0.28, ry * 0.8, Math.PI * 1.15, Math.PI * 1.45, 5);
    },
    bagel(ctx, d, rnd) {
      const w = d.w, a = d.art, r = puck(ctx, w, 24, a.c1, a.c1);
      ctx.beginPath(); ctx.ellipse(0, r.topY, w / 2 - 16, r.ry - 6, 0, 0, 7); ctx.fillStyle = a.c2; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, r.topY + 2, w * 0.13, r.ry * 0.42, 0, 0, 7); ctx.fillStyle = shade(a.c1, -0.55); ctx.fill(); stroke(ctx, 5);
      ctx.fillStyle = "rgba(200,130,50,.3)"; for (let i = 0; i < 30; i++) { const an = rnd() * 6.28, rad = 0.35 + rnd() * 0.5; dot(ctx, Math.cos(an) * w * 0.5 * rad, r.topY + Math.sin(an) * r.ry * rad, 2.6, 1.8); }
      if (a.seeds) { for (let i = 0; i < 24; i++) { const an = rnd() * 6.28, rad = 0.88 + rnd() * 0.08; ctx.save(); ctx.translate(Math.cos(an) * w * 0.5 * rad, r.topY + Math.sin(an) * r.ry * rad + 6); ctx.rotate(an); dot(ctx, 0, 0, 6, 3.4, 0, "#fff6dc"); ctx.restore(); } }
      gloss(ctx, 0, -r.ry - r.t * 0.4, w * 0.44, r.t * 0.6, Math.PI * 0.62, Math.PI * 0.9, 5);
    },
    tortilla(ctx, d, rnd) {
      const w = d.w, a = d.art, ry = puckRY(w) + 2;
      blob(ctx, 0, -ry, w / 2, ry, 20, 0.05, rnd); ctx.fillStyle = shade(a.c1, -0.2); ctx.fill(); stroke(ctx);
      blob(ctx, 0, -ry - 7, w / 2, ry, 20, 0.05, seeded(hash("tort"))); ctx.fillStyle = vgrad(ctx, -ry * 2 - 7, -7, shade(a.c1, 0.15), a.c1); ctx.fill(); stroke(ctx);
      for (let i = 0; i < 14; i++) { const [x, y] = [(rnd() - 0.5) * w * 0.8, -ry - 7 + (rnd() - 0.5) * ry * 1.4]; dot(ctx, x, y, 9 * (0.5 + rnd()), 4, rnd(), "rgba(160,100,40,.45)"); }
    },
    pancake(ctx, d, rnd) {
      const w = d.w, a = d.art, t = 18, ry = puckRY(w);
      // soft rounded side
      ctx.beginPath(); ctx.moveTo(-w / 2, -ry - t); ctx.quadraticCurveTo(-w / 2 - 6, -ry - t / 2, -w / 2, -ry); ctx.ellipse(0, -ry, w / 2, ry, 0, Math.PI, 0, true); ctx.quadraticCurveTo(w / 2 + 6, -ry - t / 2, w / 2, -ry - t); ctx.closePath();
      ctx.fillStyle = vgrad(ctx, -ry - t, 0, "#fbe2b0", shade(a.c1, -0.1)); ctx.fill(); stroke(ctx);
      ctx.beginPath(); ctx.ellipse(0, -ry - t, w / 2, ry, 0, 0, 7); ctx.fillStyle = a.c1; ctx.fill(); stroke(ctx);
      const g = ctx.createRadialGradient(-w * 0.05, -ry - t, 4, 0, -ry - t, w * 0.4); g.addColorStop(0, shade(a.c1, -0.12)); g.addColorStop(1, a.c2); ctx.beginPath(); ctx.ellipse(0, -ry - t, w / 2 - 12, ry - 5, 0, 0, 7); ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = "rgba(150,80,20,.25)"; for (let i = 0; i < 14; i++) dot(ctx, (rnd() - 0.5) * w * 0.6, -ry - t + (rnd() - 0.5) * ry, 4, 2.5);
      gloss(ctx, 0, -ry - t * 0.5, w * 0.46, t * 0.6, Math.PI * 0.62, Math.PI * 0.9, 5);
    },
    cookie(ctx, d, rnd) {
      const w = d.w, a = d.art, t = 18, ry = puckRY(w);
      ctx.beginPath(); ctx.moveTo(-w / 2, -ry - t); ctx.lineTo(-w / 2, -ry); ctx.ellipse(0, -ry, w / 2, ry, 0, Math.PI, 0, true); ctx.lineTo(w / 2, -ry - t); ctx.closePath(); ctx.fillStyle = vgrad(ctx, -ry - t, 0, shade(a.c1, -0.05), shade(a.c1, -0.35)); ctx.fill(); stroke(ctx);
      blob(ctx, 0, -ry - t, w / 2, ry, 18, 0.08, rnd); ctx.fillStyle = vgrad(ctx, -ry * 2 - t, -t, shade(a.c1, 0.2), a.c1); ctx.fill(); stroke(ctx);
      for (let i = 0; i < 12; i++) { const [x, y] = [(rnd() - 0.5) * w * 0.78, -ry - t + (rnd() - 0.5) * ry * 1.3]; ctx.save(); ctx.translate(x, y); ctx.rotate(rnd() * 3); rr(ctx, -8, -5, 16, 11, 4); ctx.fillStyle = a.c2; ctx.fill(); ctx.restore(); }
      [[-0.3, 0.6], [0.25, 0.7]].forEach(([u, v]) => { rr(ctx, u * w * 0.5 - 7, -ry * (1 - v) - t * 0.6, 14, 10, 4); ctx.fillStyle = a.c2; ctx.fill(); });
    },
    scoop(ctx, d, rnd) {
      const w = d.w, a = d.art, ry = puckRY(w), h = 104;
      // drippy skirt
      ctx.beginPath(); ctx.moveTo(-w / 2, -ry - 10);
      for (let i = 0; i <= 8; i++) { const x = -w / 2 + w * i / 8; ctx.quadraticCurveTo(x - w / 16, i % 2 ? 6 : -4, x, i % 2 ? -ry + 10 : -ry - 2 + (i === 3 || i === 6 ? 18 : 0)); }
      ctx.lineTo(w / 2, -ry - 10); ctx.closePath(); ctx.fillStyle = shade(a.c1, -0.08); ctx.fill(); stroke(ctx);
      ctx.beginPath(); ctx.moveTo(-w / 2 + 4, -ry - 6); ctx.bezierCurveTo(-w / 2, -ry - h * 1.15, w / 2, -ry - h * 1.15, w / 2 - 4, -ry - 6); ctx.quadraticCurveTo(0, -ry + 16, -w / 2 + 4, -ry - 6); ctx.closePath();
      const g = ctx.createRadialGradient(-w * 0.16, -ry - h * 0.68, 6, 0, -ry - h * 0.35, w * 0.6); g.addColorStop(0, shade(a.c1, 0.3)); g.addColorStop(0.6, a.c1); g.addColorStop(1, shade(a.c1, -0.15)); ctx.fillStyle = g; ctx.fill(); stroke(ctx);
      ctx.strokeStyle = shade(a.c1, -0.12); ctx.lineWidth = 4; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.ellipse(i * 34, -ry - 20, 24, 10, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      ctx.save(); ctx.globalAlpha = 0.75; ctx.strokeStyle = "#fff"; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.beginPath(); ctx.ellipse(-w * 0.1, -ry - h * 0.45, w * 0.3, h * 0.42, 0, Math.PI * 1.15, Math.PI * 1.42); ctx.stroke(); ctx.restore();
      ctx.fillStyle = a.c2; for (let i = 0; i < 5; i++) dot(ctx, (rnd() - 0.5) * w * 0.5, -ry - h * (0.3 + rnd() * 0.4), 5, 3, rnd());
    },
    strawberry(ctx, d) {
      const w = d.w, a = d.art, ry = puckRY(w);
      [[-0.34, -4, -0.2], [0.34, -6, 0.2], [0, 4, 0]].forEach(([u, dy, rot]) => {
        ctx.save(); ctx.translate(u * w, -ry - 8 + dy); ctx.rotate(rot); ctx.scale(1, 0.62);
        ctx.beginPath(); ctx.moveTo(0, 40); ctx.bezierCurveTo(-56, 20, -50, -36, -18, -36); ctx.quadraticCurveTo(0, -38, 18, -36); ctx.bezierCurveTo(50, -36, 56, 20, 0, 40); ctx.closePath();
        ctx.fillStyle = a.c1; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = OUT; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 28); ctx.bezierCurveTo(-36, 12, -32, -22, -10, -22); ctx.quadraticCurveTo(0, -24, 10, -22); ctx.bezierCurveTo(32, -22, 36, 12, 0, 28); ctx.closePath(); ctx.fillStyle = "#ff8fa0"; ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 0, 10, 20, 0, 0, 7); ctx.fillStyle = a.c2; ctx.fill();
        ctx.fillStyle = "#ffe066"; [[-30, -14], [30, -14], [-24, 10], [24, 10], [0, -26], [-12, 22], [12, 22]].forEach(([x, y]) => dot(ctx, x, y, 3, 4));
        ctx.restore();
      });
    },
    choc_layer(ctx, d, rnd) {
      const w = d.w, a = d.art, r = puck(ctx, w, 14, a.c1, a.c2);
      ctx.fillStyle = a.c2; [[-0.34, 14], [-0.05, 24], [0.25, 12], [0.4, 18]].forEach(([u, l]) => { const x = u * w, y0 = -r.ry - r.t + 2 + Math.abs(u) * 0; ctx.beginPath(); ctx.moveTo(x - 9, -r.ry * (1 - Math.abs(u) * 0.3) - 8); ctx.lineTo(x - 9, -8 + l - r.ry * 0.3); ctx.arc(x, -8 + l - r.ry * 0.3, 9, Math.PI, 0, true); ctx.lineTo(x + 9, -r.ry * (1 - Math.abs(u) * 0.3) - 8); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.beginPath(); ctx.arc(x, -8 + l - r.ry * 0.3, 9, 0.2, Math.PI - 0.2); ctx.stroke(); void y0; });
      gloss(ctx, -w * 0.1, r.topY, w * 0.32, r.ry * 0.6, Math.PI * 1.1, Math.PI * 1.4, 6);
    },
    cream(ctx, d) {
      const w = d.w, a = d.art;
      [[0, -18, 0.5, 20], [0, -46, 0.38, 18], [0, -70, 0.25, 15]].forEach(([x, y, s, rh]) => {
        const rw = w * s; ctx.beginPath(); ctx.ellipse(x, y, rw, rh, 0, 0, 7); ctx.fillStyle = vgrad(ctx, y - rh, y + rh, "#ffffff", a.c2); ctx.fill(); stroke(ctx, 5);
        ctx.strokeStyle = shade(a.c2, -0.12); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x - rw * 0.15, y + 2, rw * 0.6, rh * 0.45, 0, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
      });
      ctx.beginPath(); ctx.moveTo(-16, -80); ctx.quadraticCurveTo(0, -116, 10, -92); ctx.quadraticCurveTo(18, -84, 16, -78); ctx.closePath(); ctx.fillStyle = "#fff"; ctx.fill(); stroke(ctx, 5);
      dot(ctx, -w * 0.12, -52, 10, 5, -0.3, "rgba(255,255,255,.95)");
    },
    jalapeno(ctx, d) {
      const w = d.w, a = d.art, ry = puckRY(w);
      [[-0.55, 0], [-0.18, -0.5], [0.2, 0.1], [0.56, -0.35], [-0.2, 0.55]].forEach(([u, v]) => {
        ctx.save(); ctx.translate(u * w * 0.5, -ry - 4 + v * ry);
        const cr = puck(ctx, 66, 6, a.c1, a.c1, { ry: 11 });
        ctx.beginPath(); ctx.ellipse(0, cr.topY, 22, 7, 0, 0, 7); ctx.fillStyle = a.c2; ctx.fill();
        ctx.fillStyle = "#fffbe6"; for (let k = 0; k < 5; k++) { const an = k / 5 * 6.28; dot(ctx, Math.cos(an) * 9, cr.topY + Math.sin(an) * 3, 2.6, 1.8); }
        ctx.restore();
      });
    },
    sauce(ctx, d, rnd) {
      const w = d.w, a = d.art, ry = puckRY(w), cy = -ry - 4;
      ctx.beginPath(); const n = 14;
      for (let i = 0; i <= n; i++) { const an = i / n * Math.PI * 2, k = 0.92 + (i % 2) * 0.1; const x = Math.cos(an) * w * 0.47 * k, y = cy + Math.sin(an) * ry * k; if (!i) ctx.moveTo(x, y); else ctx.quadraticCurveTo(Math.cos(an - Math.PI / n) * w * 0.5, cy + Math.sin(an - Math.PI / n) * ry * 1.05, x, y); }
      ctx.closePath(); ctx.fillStyle = vgrad(ctx, cy - ry, cy + ry, shade(a.c1, 0.1), shade(a.c1, -0.08)); ctx.fill(); stroke(ctx, 5);
      // drips over the front edge
      ctx.fillStyle = a.c1; [[-0.3, 16], [0.08, 24], [0.34, 14]].forEach(([u, l]) => { const x = u * w, y = cy + ry * Math.sqrt(1 - Math.min(0.95, (u * 2) * (u * 2))) - 4; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x - 8, y + l); ctx.arc(x, y + l, 8, Math.PI, 0, true); ctx.lineTo(x + 8, y); ctx.closePath(); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.beginPath(); ctx.moveTo(x - 8, y + 2); ctx.lineTo(x - 8, y + l); ctx.arc(x, y + l, 8, Math.PI, 0, true); ctx.lineTo(x + 8, y + 2); ctx.stroke(); });
      ctx.strokeStyle = a.c2; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(-w * 0.06, cy - 2, w * 0.3, ry * 0.5, 0, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
      dot(ctx, w * 0.18, cy - 4, 9, 4, 0.2, "rgba(255,255,255,.7)");
    },
    cold_cut(ctx, d, rnd) {
      const w = d.w, a = d.art, ry = puckRY(w) + 4, cy = -ry - 8;
      ctx.beginPath(); const n = 16;
      for (let i = 0; i <= n; i++) { const an = i / n * Math.PI * 2, k = i % 2 ? 1.0 : 0.94, x = Math.cos(an) * w / 2 * k, y = cy + Math.sin(an) * ry * k + (Math.sin(an) > 0.2 ? 10 * (i % 2) : 0); if (!i) ctx.moveTo(x, y); else ctx.quadraticCurveTo(Math.cos(an - Math.PI / n) * w / 2 * 1.04, cy + Math.sin(an - Math.PI / n) * ry * 1.08 + (Math.sin(an) > 0.2 ? 8 : 0), x, y); }
      ctx.closePath(); ctx.fillStyle = vgrad(ctx, cy - ry, cy + ry + 10, a.c2, a.c1); ctx.fill(); stroke(ctx);
      ctx.strokeStyle = shade(a.c1, -0.12); ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, cy, w * 0.4, ry * 0.75, 0, 0, 7); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.45)"; for (let i = 0; i < 8; i++) dot(ctx, (rnd() - 0.5) * w * 0.6, cy + (rnd() - 0.5) * ry, 6, 3, rnd());
      gloss(ctx, 0, cy, w * 0.4, ry * 0.75, Math.PI * 1.1, Math.PI * 1.4, 5);
    },
    banana(ctx, d) {
      const w = d.w, a = d.art, ry = puckRY(w);
      [[-0.56, 0.1], [-0.2, -0.5], [0.18, 0.15], [0.55, -0.3], [-0.12, 0.6]].forEach(([u, v]) => {
        ctx.save(); ctx.translate(u * w * 0.5, -ry - 4 + v * ry);
        const cr = puck(ctx, 68, 7, "#f3d97a", a.c1, { ry: 12 });
        ctx.fillStyle = shade(a.c2, -0.15); for (let k = 0; k < 6; k++) { const an = k / 6 * 6.28; dot(ctx, Math.cos(an) * 8, cr.topY + Math.sin(an) * 2.6, 2.2, 1.6); }
        ctx.restore();
      });
    },
    waffle(ctx, d) {
      const w = d.w, a = d.art, r = puck(ctx, w, 22, a.c1, a.c2);
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, r.topY, w / 2 - 10, r.ry - 6, 0, 0, 7); ctx.clip();
      ctx.fillStyle = shade(a.c1, -0.12); const cell = 30;
      for (let i = -6; i <= 6; i++) for (let j = -3; j <= 3; j++) { const x = i * cell, y = r.topY + j * cell * 0.36; rr(ctx, x - 9, y - 4, 18, 8, 3); ctx.fill(); }
      ctx.restore();
      gloss(ctx, 0, -r.ry - r.t * 0.45, w * 0.45, r.t * 0.6, Math.PI * 0.62, Math.PI * 0.9, 5);
    }
  };

  // ---------------- hand-drawn sprites (SS.Sprites) mapped to game ingredient IDs ----------------
  const SPRITE_OF = { bottom_bun: "bottom_bun", top_bun: "top_bun", beef_patty: "beef_patty", chicken_patty: "chicken_patty", veggie_patty: "veggie_patty", american_cheese: "american_cheese", swiss_cheese: "swiss_cheese", lettuce: "lettuce", tomato: "tomato", onion: "onion", avocado: "avocado", pickles: "pickle", jalapeno_slices: "jalapeno", ketchup: "ketchup", bacon: "bacon_strip", egg: "fried_egg", sausage_patty: "sausage_patty", fish_fillet: "hash_brown", waffle: "waffle", pancake: "pancake", toast: "toast_slice", tortilla: "tortilla_round", bagel_half_plain: "donut_plain", bagel_half_sesame: "bagel_sesame", cookie: "cookie_chunk", ice_cream_vanilla: "frosting_vanilla", ice_cream_chocolate: "ice_cream_chocolate", strawberry_slice: "strawberry_half", chocolate_layer: "choc_sauce_dark", cream_swirl: "whipped_cream", cheddar: "cheddar", mayo: "cream_splat", turkey: "turkey_slice", ham: "ham_slice", caramel_drizzle: "caramel_drizzle", banana_slice: "banana_slice", hot_sauce: "hot_sauce", pepper_jack: "pepper_jack", mustard: "mustard" };
  const TALL = { ice_cream_vanilla: 0.92, ice_cream_chocolate: 0.92, cream_swirl: 0.92, ketchup: 0.9, strawberry_slice: 0.8 };
  const SQUASH = 0.62; // top-down sprites seen at a low angle so stacked layers read as discs
  function preload() { return Promise.resolve(); }
  function spriteFor(id, d) {
    // v1.6: rich hand-authored SVG art (drawn at game scale, front-bottom edge at y = 0) takes priority
    if (SS.SVGArt && SS.SVGArt.has(id)) {
      const im = SS.SVGArt.img[id], b = SS.SVGArt.box, c = mk(b.w + 40, b.h + 40), ctx = c.getContext("2d");
      ctx.drawImage(im, 20, 20);
      // fixed origin: the layer's front edge is y = 0 in the art, so drips and frills can hang over the layer below
      const oy = 20 - b.y, top = topOf(c);
      return { canvas: c, rim: makeRim(c, RIM), ox: c.width / 2, oy, vh: oy - top };
    }
    const sid = SPRITE_OF[id]; if (!sid || !SS.Sprites || !SS.Sprites.has(sid)) return null;
    const k = d.w / 196, sq = TALL[id] || SQUASH;
    const c = mk(d.w + 120, 200 * k * sq + 120), ctx = c.getContext("2d");
    ctx.translate(c.width / 2, c.height / 2); ctx.scale(k, k * sq); SS.Sprites.draw(ctx, sid);
    if (SS.Sprites.light) SS.Sprites.light(c);
    // origin = lowest opaque row (front edge of the food) so layers stack on it
    const dd = ctx.getImageData(0, 0, c.width, c.height).data; let bottom = c.height - 1;
    outer: for (let y = c.height - 1; y >= 0; y--) for (let x = 0; x < c.width; x += 2) if (dd[(y * c.width + x) * 4 + 3] > 40) { bottom = y; break outer; }
    const oy = bottom - 4, top = topOf(c);
    return { canvas: c, rim: makeRim(c, RIM), ox: c.width / 2, oy, vh: oy - top };
  }

  // Build one ingredient sprite: { canvas, rim, ox, oy (bottom-contact origin), vh (visual height above origin) }.
  function ingredient(id) {
    const key = "ing:" + id; if (cache[key]) return cache[key];
    const d = SS.DATA.ingredient_by_id[id];
    const asp = spriteFor(id, d); if (asp) { cache[key] = asp; return asp; }
    const padX = 60, above = 200, below = 60;
    const c = mk(d.w + padX * 2, above + below), ctx = c.getContext("2d");
    ctx.translate(c.width / 2, above);
    (P[d.art.kind] || P.tomato)(ctx, d, seeded(hash(id)));
    const top = topOf(c);
    const out = { canvas: c, rim: makeRim(c, RIM), ox: c.width / 2, oy: above, vh: above - top };
    cache[key] = out; return out;
  }

  // ---------------- hazards & bonuses ----------------
  function warnBadge(ctx, x, y) { ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.moveTo(0, -18); ctx.quadraticCurveTo(2, -20, 4, -16); ctx.lineTo(18, 10); ctx.quadraticCurveTo(19, 14, 15, 14); ctx.lineTo(-15, 14); ctx.quadraticCurveTo(-19, 14, -18, 10); ctx.lineTo(-4, -16); ctx.quadraticCurveTo(-2, -20, 0, -18); ctx.closePath(); ctx.fillStyle = "#ff3b30"; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.lineJoin = "round"; ctx.stroke(); ctx.fillStyle = "#fff"; rr(ctx, -2.8, -9, 5.6, 13, 2.5); ctx.fill(); dot(ctx, 0, 8.5, 3); ctx.restore(); }
  const H = {
    wrapper_trash(ctx) { ctx.beginPath(); const pts = [[-36, -20], [-10, -34], [8, -26], [34, -32], [38, -4], [30, 22], [6, 30], [-20, 26], [-38, 10]]; pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = vgrad(ctx, -34, 30, "#ffffff", "#ced4da"); ctx.fill(); stroke(ctx); ctx.strokeStyle = "#e03131"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-30, -6); ctx.lineTo(30, -12); ctx.stroke(); ctx.strokeStyle = "#adb5bd"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-20, 10); ctx.lineTo(-4, 4); ctx.lineTo(12, 16); ctx.moveTo(-6, -24); ctx.lineTo(4, -14); ctx.stroke(); warnBadge(ctx, 32, -32); },
    grease_drop(ctx) { ctx.beginPath(); ctx.moveTo(0, -40); ctx.bezierCurveTo(26, -10, 32, 6, 30, 14); ctx.arc(0, 14, 30, 0, Math.PI); ctx.bezierCurveTo(-32, 6, -26, -10, 0, -40); ctx.closePath(); ctx.fillStyle = "#ff922b"; ctx.fill(); stroke(ctx); dot(ctx, -10, 6, 6, 10, 0.3, "rgba(255,255,255,.75)"); ctx.fillStyle = OUT; dot(ctx, -9, 18, 3.5); dot(ctx, 9, 18, 3.5); ctx.beginPath(); ctx.arc(0, 28, 6, Math.PI * 1.15, Math.PI * 1.85); ctx.lineWidth = 3; ctx.strokeStyle = OUT; ctx.stroke(); warnBadge(ctx, 32, -32); },
    slime_blob(ctx) { ctx.beginPath(); ctx.moveTo(-38, 10); ctx.bezierCurveTo(-44, -30, -10, -44, 4, -36); ctx.bezierCurveTo(30, -44, 46, -14, 38, 8); ctx.quadraticCurveTo(36, 26, 26, 22); ctx.quadraticCurveTo(22, 40, 14, 22); ctx.quadraticCurveTo(0, 30, -8, 22); ctx.quadraticCurveTo(-16, 42, -22, 20); ctx.quadraticCurveTo(-36, 26, -38, 10); ctx.closePath(); ctx.fillStyle = vgrad(ctx, -40, 30, "#8ce99a", "#2f9e44"); ctx.fill(); stroke(ctx); dot(ctx, -14, -20, 10, 6, -0.4, "#d3f9d8"); ctx.fillStyle = OUT; dot(ctx, -10, -4, 5); dot(ctx, 12, -4, 5); ctx.beginPath(); ctx.moveTo(-8, 12); ctx.quadraticCurveTo(2, 4, 12, 12); ctx.lineWidth = 3.5; ctx.strokeStyle = OUT; ctx.stroke(); warnBadge(ctx, 32, -32); },
    ice_cube(ctx) { ctx.beginPath(); ctx.moveTo(-30, -18); ctx.lineTo(4, -34); ctx.lineTo(36, -18); ctx.lineTo(36, 18); ctx.lineTo(2, 34); ctx.lineTo(-30, 18); ctx.closePath(); ctx.fillStyle = vgrad(ctx, -34, 34, "#e7f5ff", "#74c0fc"); ctx.fill(); stroke(ctx); ctx.beginPath(); ctx.moveTo(-30, -18); ctx.lineTo(2, -2); ctx.lineTo(36, -18); ctx.moveTo(2, -2); ctx.lineTo(2, 34); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke(); ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.moveTo(-22, -16); ctx.lineTo(2, -28); ctx.lineTo(12, -24); ctx.lineTo(-12, -12); ctx.fill(); warnBadge(ctx, 32, -32); },
    bug(ctx) { ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.strokeStyle = OUT; ctx.lineWidth = 3.5; [[-22, -20, -0.5], [22, -20, 0.5]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.ellipse(x, y, 20, 11, r, 0, 7); ctx.fill(); ctx.stroke(); }); ctx.beginPath(); ctx.ellipse(0, 4, 18, 26, 0, 0, 7); ctx.fillStyle = vgrad(ctx, -22, 30, "#495057", "#212529"); ctx.fill(); stroke(ctx); ctx.beginPath(); ctx.arc(0, -22, 12, 0, 7); ctx.fillStyle = "#212529"; ctx.fill(); stroke(ctx, 4); ctx.fillStyle = "#ff6b6b"; dot(ctx, -5, -24, 3.5); dot(ctx, 5, -24, 3.5); ctx.strokeStyle = OUT; ctx.lineWidth = 3.5; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-16, 4 + i * 10); ctx.lineTo(-30, 8 + i * 14); ctx.moveTo(16, 4 + i * 10); ctx.lineTo(30, 8 + i * 14); ctx.stroke(); } warnBadge(ctx, 32, -32); },
    gust_wind(ctx) { ctx.lineCap = "round"; [[-30, -14, 50], [-38, 4, 64], [-24, 22, 40]].forEach(([x, y, l]) => { ctx.lineWidth = 14; ctx.strokeStyle = OUT; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y); ctx.arc(x + l, y - 8, 8, Math.PI / 2, -Math.PI, true); ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = "#a5d8ff"; ctx.stroke(); }); warnBadge(ctx, 34, -32); },
    steam_burst(ctx) { ctx.fillStyle = "#f8f9fa"; const cl = [[-16, 6, 20], [10, 0, 24], [0, -20, 18], [24, 16, 16], [-26, -10, 14]]; ctx.beginPath(); cl.forEach(([x, y, r]) => { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 7); }); ctx.lineWidth = 10; ctx.strokeStyle = OUT; ctx.stroke(); ctx.fill(); ctx.fillStyle = "#dee2e6"; dot(ctx, 8, 10, 12, 6); warnBadge(ctx, 32, -32); },
    counter_shake(ctx) { rr(ctx, -40, 0, 80, 22, 6); ctx.fillStyle = "#ef9a4f"; ctx.fill(); stroke(ctx); ctx.strokeStyle = OUT; ctx.lineWidth = 4; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(s * 46, -24); ctx.lineTo(s * 40, -14); ctx.lineTo(s * 48, -6); ctx.stroke(); }); ctx.fillStyle = "#ffd43b"; rr(ctx, -16, -26, 32, 24, 5); ctx.fill(); stroke(ctx, 4); warnBadge(ctx, 32, -32); },
    slippery_counter(ctx) { ctx.beginPath(); ctx.ellipse(0, 14, 40, 14, 0, 0, 7); ctx.fillStyle = "#74c0fc"; ctx.fill(); stroke(ctx); dot(ctx, -12, 10, 10, 4, 0, "#fff"); ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(10, -10); ctx.lineTo(-10, -10); ctx.closePath(); ctx.fillStyle = "#ffd43b"; ctx.fill(); stroke(ctx, 4); warnBadge(ctx, 32, -32); },
    moving_plate_event(ctx) { ctx.beginPath(); ctx.ellipse(0, 10, 36, 13, 0, 0, 7); ctx.fillStyle = "#fff"; ctx.fill(); stroke(ctx); ctx.strokeStyle = OUT; ctx.lineWidth = 5; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(s * 20, -18); ctx.lineTo(s * 44, -18); ctx.lineTo(s * 36, -26); ctx.moveTo(s * 44, -18); ctx.lineTo(s * 36, -10); ctx.stroke(); }); warnBadge(ctx, 32, -34); }
  };
  function bonusBubble(ctx, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, 44, 0, 7); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = OUT; ctx.stroke(); ctx.save(); ctx.globalAlpha = 0.8; ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(0, 0, 34, Math.PI * 1.1, Math.PI * 1.4); ctx.stroke(); ctx.restore(); }
  function star(ctx, r, r2, n) { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, rad = i % 2 ? r2 : r; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } ctx.closePath(); }
  function sparkle(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = "#fff"; star(ctx, s, s * 0.3, 4); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke(); ctx.restore(); }
  const BN = {
    score_star(ctx) { bonusBubble(ctx, "#ffec99"); star(ctx, 28, 13, 5); ctx.fillStyle = vgrad(ctx, -28, 24, "#ffe066", "#fab005"); ctx.fill(); stroke(ctx, 5); },
    time_boost(ctx) { bonusBubble(ctx, "#b2f2bb"); ctx.beginPath(); ctx.arc(0, 2, 24, 0, 7); ctx.fillStyle = "#fff"; ctx.fill(); stroke(ctx, 5); ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, -12); ctx.moveTo(0, 2); ctx.lineTo(11, 8); ctx.stroke(); ctx.fillStyle = "#2f9e44"; rr(ctx, 16, -26, 16, 6, 2); ctx.fill(); rr(ctx, 21, -31, 6, 16, 2); ctx.fill(); },
    coin_burst(ctx) { bonusBubble(ctx, "#ffe8a1"); [[-12, 8], [10, 4], [0, -10]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 17, 17, 0, 0, 7); ctx.fillStyle = vgrad(ctx, y - 17, y + 17, "#ffe066", "#f59f00"); ctx.fill(); stroke(ctx, 4); ctx.beginPath(); ctx.ellipse(x, y, 9, 9, 0, 0, 7); ctx.strokeStyle = "#e67700"; ctx.lineWidth = 3; ctx.stroke(); }); },
    slow_time(ctx) { bonusBubble(ctx, "#a5d8ff"); ctx.beginPath(); ctx.moveTo(-18, -28); ctx.lineTo(18, -28); ctx.lineTo(0, 0); ctx.lineTo(18, 28); ctx.lineTo(-18, 28); ctx.lineTo(0, 0); ctx.closePath(); ctx.fillStyle = "#e7f5ff"; ctx.fill(); stroke(ctx, 4); ctx.fillStyle = "#fcc419"; ctx.beginPath(); ctx.moveTo(-10, 22); ctx.lineTo(10, 22); ctx.lineTo(0, 10); ctx.fill(); },
    wide_catch(ctx) { bonusBubble(ctx, "#d0bfff"); ctx.strokeStyle = OUT; ctx.lineWidth = 13; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(24, 0); ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = "#7048e8"; ctx.stroke(); [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(s * 30, 0); ctx.lineTo(s * 16, -14); ctx.lineTo(s * 16, 14); ctx.closePath(); ctx.fillStyle = "#7048e8"; ctx.fill(); stroke(ctx, 4); }); },
    hazard_shield(ctx) { bonusBubble(ctx, "#a5d8ff"); ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(24, -20); ctx.quadraticCurveTo(24, 16, 0, 30); ctx.quadraticCurveTo(-24, 16, -24, -20); ctx.closePath(); ctx.fillStyle = vgrad(ctx, -30, 30, "#74c0fc", "#1c7ed6"); ctx.fill(); stroke(ctx, 5); ctx.fillStyle = "#fff"; rr(ctx, -4, -14, 8, 26, 2); ctx.fill(); rr(ctx, -12, -5, 24, 8, 2); ctx.fill(); },
    combo_shield(ctx) { bonusBubble(ctx, "#ffd8a8"); ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(24, -20); ctx.quadraticCurveTo(24, 16, 0, 30); ctx.quadraticCurveTo(-24, 16, -24, -20); ctx.closePath(); ctx.fillStyle = vgrad(ctx, -30, 30, "#ffc078", "#f76707"); ctx.fill(); stroke(ctx, 5); ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(8, 8); ctx.moveTo(8, -8); ctx.lineTo(-8, 8); ctx.stroke(); }
  };
  function icon(id, size) {
    const reference = SS.Reference && SS.Reference.canvasIcon(id, size || 120);
    if (reference) return reference;
    const key = "ico:" + id + ":" + (size || 120); if (cache[key]) return cache[key];
    const s = size || 120, c = mk(s, s), ctx = c.getContext("2d");
    ctx.translate(s / 2, s / 2); ctx.scale(s / 132, s / 132);
    if (H[id]) H[id](ctx); else if (BN[id]) { BN[id](ctx); sparkle(ctx, -36, -32, 10); sparkle(ctx, 38, 28, 8); }
    const out = withRim(c, Math.max(2, RIM * s / 132));
    cache[key] = out; return out;
  }

  // ---------------- plate (3/4 view, sticker rim) ----------------
  function plate(id) {
    const key = "plate:" + id; if (cache[key]) return cache[key];
    const p = SS.DATA.plates.find(x => x.id === id) || SS.DATA.plates[0];
    const w = 400, ry = 74, pad = 34, c = mk(w + pad * 2, ry * 2 + 30 + pad * 2), ctx = c.getContext("2d");
    const cx = c.width / 2, cy = pad + ry;
    ctx.translate(cx, cy);
    const B = "#3b2314";
    const rimShape = () => { ctx.beginPath(); ctx.ellipse(0, 0, w / 2, ry, 0, 0, Math.PI * 2); };
    const sideShape = () => { ctx.beginPath(); ctx.ellipse(0, 12, w / 2, ry, 0, 0, Math.PI * 2); };
    ctx.lineJoin = "round"; ctx.strokeStyle = B; ctx.lineWidth = 14; sideShape(); ctx.stroke(); rimShape(); ctx.stroke();
    sideShape(); ctx.fillStyle = p.rim; ctx.fill(); rimShape(); ctx.fillStyle = p.face; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 4, w * 0.36, ry * 0.62, 0, 0, Math.PI * 2); ctx.fillStyle = p.inner; ctx.fill(); ctx.clip();
    if (p.pattern === "dots") { ctx.fillStyle = p.rim; for (let i = -7; i <= 7; i++) for (let j = -3; j <= 3; j++) dot(ctx, i * 22 + (j % 2) * 11, 4 + j * 14, 4.5, 3.5); }
    if (p.pattern === "checker") { ctx.fillStyle = "#212529"; for (let i = -9; i <= 9; i++) for (let j = -4; j <= 4; j++) if ((i + j) % 2) ctx.fillRect(i * 18, 4 + j * 12 - 6, 18, 12); }
    if (p.pattern === "grain") { ctx.strokeStyle = "rgba(90,50,20,.35)"; ctx.lineWidth = 3; for (let j = -3; j <= 3; j++) { ctx.beginPath(); ctx.moveTo(-150, 4 + j * 12); ctx.quadraticCurveTo(0, j * 12 - 4, 150, 6 + j * 12); ctx.stroke(); } }
    if (p.pattern === "rainbow") { ["#ff6b6b", "#ffa94d", "#ffe066", "#69db7c", "#4dabf7", "#9775fa"].forEach((col, i) => { ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, 4, w * 0.34 - i * 11, ry * 0.58 - i * 7, 0, 0, 7); ctx.stroke(); }); }
    if (p.pattern === "neon") { ctx.strokeStyle = "#f700ff"; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, 4, w * 0.3, ry * 0.5, 0, 0, 7); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.7; ctx.strokeStyle = "#fff"; ctx.lineWidth = 7; ctx.lineCap = "round"; ctx.beginPath(); ctx.ellipse(0, 0, w / 2 - 18, ry - 14, 0, Math.PI * 1.08, Math.PI * 1.34); ctx.stroke(); ctx.restore();
    const out = { canvas: withRim(c, RIM), ox: cx, oy: cy + 46 }; // oy = where the bottom layer's front edge rests
    cache[key] = out; return out;
  }

  // ---------------- shared scenery helpers (backgrounds) ----------------
  function line(ctx, w) { ctx.lineWidth = w || 6; ctx.strokeStyle = OUT; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke(); }
  function cloud(ctx, x, y, s, col) { ctx.fillStyle = col || "#fff"; ctx.beginPath(); [[0, 0, 46], [44, -18, 58], [96, -2, 44], [48, 14, 40], [-30, 14, 30], [130, 16, 30]].forEach(([dx, dy, r]) => { ctx.moveTo(x + (dx + r) * s, y + dy * s); ctx.arc(x + dx * s, y + dy * s, r * s, 0, 7); }); ctx.fill(); ctx.fillRect(x - 30 * s, y + 10 * s, 160 * s, 34 * s); }
  function hills(ctx, x, y, w, h, col, n, seed) { const r = seeded(seed); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + h * 0.5); for (let i = 0; i <= n; i++) { const xx = x + w * i / n; ctx.quadraticCurveTo(xx - w / n / 2, y - h * (0.2 + r() * 0.6), xx, y + h * (0.2 + r() * 0.3)); } ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill(); }
  function plant(ctx, x, y, s, pot) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); [[-0.6, -44], [-0.2, -58], [0.25, -56], [0.65, -42]].forEach(([rot]) => { ctx.save(); ctx.rotate(rot); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-22, -40, 0, -82); ctx.quadraticCurveTo(22, -40, 0, 0); ctx.fillStyle = "#40c057"; ctx.fill(); line(ctx, 4); ctx.strokeStyle = "#2f9e44"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, -66); ctx.stroke(); ctx.restore(); }); ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(34, 0); ctx.lineTo(26, 54); ctx.lineTo(-26, 54); ctx.closePath(); ctx.fillStyle = pot || "#ffffff"; ctx.fill(); line(ctx, 5); ctx.fillStyle = shade(pot || "#ffffff", -0.1); rr(ctx, -38, -6, 76, 16, 6); ctx.fill(); line(ctx, 5); ctx.restore(); }
  function jar(ctx, x, y, col, lid) { rr(ctx, x, y, 62, 78, 14); ctx.fillStyle = "rgba(220,240,255,.85)"; ctx.fill(); line(ctx, 5); rr(ctx, x + 8, y + 22, 46, 50, 10); ctx.fillStyle = col; ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.35)"; for (let i = 0; i < 6; i++) dot(ctx, x + 16 + (i * 17) % 34, y + 32 + (i * 13) % 34, 5, 4); rr(ctx, x + 4, y - 12, 54, 18, 6); ctx.fillStyle = lid || "#e8a64a"; ctx.fill(); line(ctx, 5); ctx.save(); ctx.globalAlpha = 0.7; ctx.fillStyle = "#fff"; rr(ctx, x + 8, y + 8, 8, 40, 4); ctx.fill(); ctx.restore(); }
  function bottle(ctx, x, y, col, cap) { ctx.beginPath(); ctx.moveTo(x + 6, y + 40); ctx.quadraticCurveTo(x, y + 30, x + 14, y + 22); ctx.lineTo(x + 22, y + 4); ctx.lineTo(x + 34, y + 4); ctx.lineTo(x + 42, y + 22); ctx.quadraticCurveTo(x + 56, y + 30, x + 50, y + 40); ctx.lineTo(x + 52, y + 120); ctx.quadraticCurveTo(x + 52, y + 132, x + 40, y + 132); ctx.lineTo(x + 16, y + 132); ctx.quadraticCurveTo(x + 4, y + 132, x + 4, y + 120); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); line(ctx, 5); ctx.beginPath(); ctx.moveTo(x + 22, y + 4); ctx.lineTo(x + 26, y - 18); ctx.lineTo(x + 30, y - 18); ctx.lineTo(x + 34, y + 4); ctx.closePath(); ctx.fillStyle = cap || col; ctx.fill(); line(ctx, 4); ctx.fillStyle = "#fff"; rr(ctx, x + 10, y + 62, 36, 30, 8); ctx.fill(); line(ctx, 3); ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = "#fff"; rr(ctx, x + 10, y + 36, 7, 22, 3); ctx.fill(); ctx.restore(); }
  function lampCone(ctx, x, y, h, w, col) { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, col); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 40, y); ctx.lineTo(x + 40, y); ctx.lineTo(x + w / 2, y + h); ctx.lineTo(x - w / 2, y + h); ctx.closePath(); ctx.fill(); }
  function pendant(ctx, x, len, col) { ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, len); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 60, len + 56); ctx.quadraticCurveTo(x - 56, len, x, len); ctx.quadraticCurveTo(x + 56, len, x + 60, len + 56); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); line(ctx, 5); ctx.beginPath(); ctx.ellipse(x, len + 58, 26, 10, 0, 0, Math.PI); ctx.fillStyle = "#fff3bf"; ctx.fill(); line(ctx, 4); }

  // ---------------- gameplay kitchen (1080x1920) ----------------
  const KDECO = { kitchen_default: "classic", kitchen_modern: "modern", kitchen_cozy_cafe: "cafe", kitchen_night: "night", kitchen_retro_diner: "diner", kitchen_food_truck: "truck", kitchen_garden: "garden", kitchen_candy: "candy" };
  function kitchen(id) { return SS.BG.kitchen(id); }

  // ---------------- menu backdrop: food truck parked on a checkered lot (S01/S02/S05 mockups) ----------------
  function menuBg() { return SS.BG.url("menu"); }

  // ---------------- customer avatar ----------------
  function avatar(id, size) {
    const key = "ava:" + id + ":" + size; if (cache[key]) return cache[key];
    const cu = SS.DATA.customers[id], s = size || 160, c = mk(s, s), ctx = c.getContext("2d");
    ctx.scale(s / 176, s / 176); ctx.translate(88, 92);
    ctx.beginPath(); ctx.arc(0, -6, 76, 0, 7); ctx.fillStyle = vgrad(ctx, -82, 70, "#e7f5ff", "#a5d8ff"); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, -6, 74, 0, 7); ctx.clip();
    ctx.beginPath(); ctx.ellipse(0, 78, 64, 46, 0, 0, 7); ctx.fillStyle = cu.shirt; ctx.fill(); stroke(ctx);
    if (cu.style === "afro") { ctx.beginPath(); ctx.arc(0, -18, 58, 0, 7); ctx.fillStyle = cu.hair; ctx.fill(); stroke(ctx); }
    if (cu.style === "long") { ctx.beginPath(); ctx.ellipse(0, 2, 52, 60, 0, 0, 7); ctx.fillStyle = cu.hair; ctx.fill(); stroke(ctx); }
    ctx.beginPath(); ctx.ellipse(0, -4, 40, 46, 0, 0, 7); ctx.fillStyle = cu.skin; ctx.fill(); stroke(ctx);
    ctx.fillStyle = cu.hair;
    if (cu.style === "bun") { ctx.beginPath(); ctx.arc(0, -60, 18, 0, 7); ctx.fill(); stroke(ctx, 4); ctx.beginPath(); ctx.ellipse(0, -34, 42, 22, 0, Math.PI, 0); ctx.fill(); stroke(ctx, 4); }
    if (cu.style === "cap") { ctx.fillStyle = "#1c7ed6"; ctx.beginPath(); ctx.ellipse(0, -34, 44, 24, 0, Math.PI, 0); ctx.fill(); stroke(ctx, 4); ctx.beginPath(); ctx.ellipse(26, -32, 30, 8, 0.1, 0, 7); ctx.fill(); stroke(ctx, 4); }
    if (cu.style === "bob" || cu.style === "long") { ctx.beginPath(); ctx.ellipse(0, -30, 44, 26, 0, Math.PI, 0); ctx.lineTo(44, -6); ctx.lineTo(30, -26); ctx.lineTo(-30, -26); ctx.lineTo(-44, -6); ctx.closePath(); ctx.fill(); stroke(ctx, 4); }
    if (cu.style === "spiky") { ctx.beginPath(); ctx.moveTo(-42, -26); for (let i = 0; i <= 6; i++) ctx.lineTo(-42 + i * 14, i % 2 ? -66 : -40); ctx.lineTo(42, -26); ctx.closePath(); ctx.fill(); stroke(ctx, 4); }
    if (cu.style === "curly") { for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.arc(i * 13, -42 + Math.abs(i) * 3, 13, 0, 7); ctx.fill(); } }
    if (cu.style === "chef") { ctx.fillStyle = "#fff"; [[-20, -70], [0, -80], [20, -70]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 22, 0, 7); ctx.fill(); stroke(ctx, 4); }); rr(ctx, -34, -60, 68, 26, 6); ctx.fill(); stroke(ctx, 4); ctx.fillStyle = cu.hair; ctx.beginPath(); ctx.ellipse(0, 22, 20, 8, 0, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = OUT; dot(ctx, -14, -6, 5.5, 6.5); dot(ctx, 14, -6, 5.5, 6.5); ctx.fillStyle = "#fff"; dot(ctx, -12, -8, 2); dot(ctx, 16, -8, 2);
    ctx.beginPath(); ctx.arc(0, 12, 14, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = 4; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.fillStyle = "rgba(255,120,120,.35)"; dot(ctx, -26, 8, 8); dot(ctx, 26, 8, 8);
    ctx.restore();
    ctx.beginPath(); ctx.arc(0, -6, 74, 0, 7); stroke(ctx, 6);
    const out = withRim(c, RIM * s / 176 + 1);
    cache[key] = out; return out;
  }


  // ---------------- UI icons (flat, navy outline, white sticker rim; 100x100 design box) ----------------
  const UIP = (function () {
    const N = OUT, W = 7;
    const sp = (c, list) => { c.save(); c.lineJoin = "round"; c.lineCap = "round"; c.strokeStyle = N; c.lineWidth = W * 2; list.forEach(([f]) => { f(); c.stroke(); }); list.forEach(([f, col]) => { if (col) { f(); c.fillStyle = col; c.fill(); } }); c.restore(); };
    const tile = (c, col, dark) => { sp(c, [[() => rr(c, -44, -44, 88, 88, 20), col]]); c.save(); rr(c, -44, -44, 88, 88, 20); c.clip(); c.fillStyle = dark; c.fillRect(-50, 22, 100, 30); c.restore(); c.save(); c.globalAlpha = 0.35; c.fillStyle = "#fff"; rr(c, -34, -36, 40, 10, 5); c.fill(); c.restore(); };
    const white = (c, f) => { c.save(); c.lineJoin = "round"; c.lineCap = "round"; f(); c.strokeStyle = N; c.lineWidth = 10; c.stroke(); f(); c.fillStyle = "#fff"; c.fill(); c.restore(); };
    const starPath = (c, r, r2, cy) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r2 : r; c.lineTo(Math.cos(a) * rad, (cy || 0) + Math.sin(a) * rad); } c.closePath(); };
    const heartPath = c => { c.beginPath(); c.moveTo(0, 38); c.bezierCurveTo(-60, 0, -48, -46, -20, -40); c.quadraticCurveTo(-6, -36, 0, -22); c.quadraticCurveTo(6, -36, 20, -40); c.bezierCurveTo(48, -46, 60, 0, 0, 38); c.closePath(); };
    const shine = (c, x, y, rx, ry, rot) => { c.save(); c.globalAlpha = 0.6; c.fillStyle = "#fff"; c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, 7); c.fill(); c.restore(); };
    return {
      pause: c => { tile(c, "#ffc93c", "#f2a900"); white(c, () => { c.beginPath(); rr(c, -22, -24, 15, 48, 5); }); white(c, () => { c.beginPath(); rr(c, 7, -24, 15, 48, 5); }); },
      gear: c => { tile(c, "#2f9bf0", "#1f7fd0"); white(c, () => { c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = i % 2 ? 22 : 30; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); }); c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fillStyle = "#2f9bf0"; c.fill(); c.lineWidth = 5; c.strokeStyle = N; c.stroke(); },
      back: c => { tile(c, "#ffc933", "#f2a900"); white(c, () => { c.beginPath(); c.moveTo(-28, 0); c.lineTo(0, -24); c.lineTo(0, -10); c.lineTo(26, -10); c.lineTo(26, 10); c.lineTo(0, 10); c.lineTo(0, 24); c.closePath(); }); },
      home: c => { tile(c, "#ffc933", "#f2a900"); white(c, () => { c.beginPath(); rr(c, -20, -6, 40, 32, 4); }); sp(c, [[() => { c.beginPath(); c.moveTo(-32, 0); c.lineTo(0, -28); c.lineTo(32, 0); c.lineTo(24, 6); c.lineTo(0, -14); c.lineTo(-24, 6); c.closePath(); }, "#f0473e"]]); c.fillStyle = "#2f6fe0"; rr(c, -7, 8, 14, 18, 3); c.fill(); },
      coin: c => { sp(c, [[() => { c.beginPath(); c.arc(0, 4, 42, 0, 7); }, "#e8a000"], [() => { c.beginPath(); c.arc(0, 0, 42, 0, 7); }, "#ffcc1f"]]); c.beginPath(); c.arc(0, 0, 28, 0, 7); c.lineWidth = 7; c.strokeStyle = "#f2a900"; c.stroke(); c.beginPath(); c.arc(0, 0, 21, 0, 7); c.fillStyle = "#ffdb4d"; c.fill(); shine(c, -16, -20, 10, 6, -0.6); },
      gem: c => { const outer = () => { c.beginPath(); c.moveTo(-42, -12); c.lineTo(-24, -36); c.lineTo(24, -36); c.lineTo(42, -12); c.lineTo(0, 40); c.closePath(); }; sp(c, [[outer, "#c14bea"]]); c.fillStyle = "#e07cff"; c.beginPath(); c.moveTo(-24, -36); c.lineTo(24, -36); c.lineTo(14, -12); c.lineTo(-14, -12); c.closePath(); c.fill(); c.fillStyle = "#9a2bd0"; c.beginPath(); c.moveTo(14, -12); c.lineTo(42, -12); c.lineTo(0, 40); c.closePath(); c.fill(); c.strokeStyle = "rgba(29,43,74,.35)"; c.lineWidth = 3; c.beginPath(); c.moveTo(-42, -12); c.lineTo(42, -12); c.moveTo(-14, -12); c.lineTo(0, 40); c.lineTo(14, -12); c.stroke(); shine(c, -16, -26, 8, 4, -0.3); },
      heart: c => { sp(c, [[() => heartPath(c), "#ff4d5a"]]); shine(c, -22, -20, 9, 6, -0.6); },
      heartOff: c => { sp(c, [[() => heartPath(c), "#a9b6cc"]]); },
      star: c => { sp(c, [[() => starPath(c, 46, 22, 4), "#ffc933"]]); shine(c, -10, -14, 7, 4, -0.5); },
      starOff: c => { sp(c, [[() => starPath(c, 46, 22, 4), "#a9b6cc"]]); },
      lock: c => { c.save(); c.lineCap = "round"; c.beginPath(); c.moveTo(-18, -6); c.lineTo(-18, -18); c.arc(0, -18, 18, Math.PI, 0); c.lineTo(18, -6); c.strokeStyle = N; c.lineWidth = 20; c.stroke(); c.strokeStyle = "#b9c6dc"; c.lineWidth = 8; c.stroke(); c.restore(); sp(c, [[() => rr(c, -34, -8, 68, 50, 12), "#ffc933"]]); c.fillStyle = N; c.beginPath(); c.arc(0, 12, 8, 0, 7); c.fill(); rr(c, -4, 14, 8, 16, 3); c.fill(); },
      check: c => { sp(c, [[() => { c.beginPath(); c.arc(0, 0, 44, 0, 7); }, "#45c449"]]); white(c, () => { c.beginPath(); c.moveTo(-24, 0); c.lineTo(-8, 16); c.lineTo(24, -18); c.lineTo(16, -26); c.lineTo(-8, 0); c.lineTo(-16, -8); c.closePath(); }); },
      close: c => { tile(c, "#f0473e", "#c9302a"); white(c, () => { c.beginPath(); const a = 9, b = 26; c.moveTo(-b, -b + a); c.lineTo(-b + a, -b); c.lineTo(0, -a); c.lineTo(b - a, -b); c.lineTo(b, -b + a); c.lineTo(a, 0); c.lineTo(b, b - a); c.lineTo(b - a, b); c.lineTo(0, a); c.lineTo(-b + a, b); c.lineTo(-b, b - a); c.lineTo(-a, 0); c.closePath(); }); },
      mistake: c => { white(c, () => {}); c.save(); c.lineCap = "round"; c.beginPath(); c.moveTo(-28, -28); c.lineTo(28, 28); c.moveTo(28, -28); c.lineTo(-28, 28); c.strokeStyle = N; c.lineWidth = 30; c.stroke(); c.strokeStyle = "#f0473e"; c.lineWidth = 16; c.stroke(); c.restore(); },
      clock: c => { sp(c, [[() => { c.beginPath(); c.arc(-26, -30, 11, 0, 7); }, "#f0473e"], [() => { c.beginPath(); c.arc(26, -30, 11, 0, 7); }, "#f0473e"], [() => { c.beginPath(); c.arc(0, 6, 38, 0, 7); }, "#f0473e"]]); c.beginPath(); c.arc(0, 6, 28, 0, 7); c.fillStyle = "#fff"; c.fill(); c.save(); c.lineCap = "round"; c.beginPath(); c.moveTo(0, 6); c.lineTo(0, -12); c.moveTo(0, 6); c.lineTo(13, 14); c.strokeStyle = N; c.lineWidth = 7; c.stroke(); c.restore(); },
      play: c => { white(c, () => { c.beginPath(); c.moveTo(-26, -38); c.lineTo(38, 0); c.lineTo(-26, 38); c.closePath(); }); },
      book: c => { sp(c, [[() => rr(c, -36, -42, 72, 84, 10), "#f0473e"], [() => rr(c, -30, 30, 66, 14, 4), "#ffffff"]]); white(c, () => { c.beginPath(); c.arc(-10, -8, 11, 0, 7); c.arc(10, -8, 11, 0, 7); c.arc(0, -16, 12, 0, 7); }); white(c, () => { c.beginPath(); rr(c, -12, -2, 24, 16, 3); }); },
      cart: c => { c.save(); c.lineCap = "round"; c.lineJoin = "round"; const p = () => { c.beginPath(); c.moveTo(-42, -30); c.lineTo(-28, -30); c.lineTo(-16, 16); c.lineTo(30, 16); c.lineTo(40, -16); c.lineTo(-22, -16); }; p(); c.strokeStyle = N; c.lineWidth = 18; c.stroke(); p(); c.strokeStyle = "#fff"; c.lineWidth = 7; c.stroke(); c.restore(); sp(c, [[() => { c.beginPath(); c.arc(-10, 32, 8, 0, 7); }, "#fff"], [() => { c.beginPath(); c.arc(24, 32, 8, 0, 7); }, "#fff"]]); },
      clip: c => { sp(c, [[() => rr(c, -34, -36, 68, 80, 10), "#ffffff"], [() => rr(c, -16, -46, 32, 18, 6), "#ffc933"]]); sp(c, [[() => starPath(c, 22, 10, 6), "#ffc933"]]); },
      trophy: c => { c.save(); c.lineCap = "round"; [[-1], [1]].forEach(([s]) => { c.beginPath(); c.arc(s * 30, -14, 14, s > 0 ? -1.4 : Math.PI - 1.7, s > 0 ? 1.7 : Math.PI + 1.4, s < 0); c.strokeStyle = N; c.lineWidth = 16; c.stroke(); c.strokeStyle = "#ffc933"; c.lineWidth = 6; c.stroke(); }); c.restore(); sp(c, [[() => rr(c, -26, 28, 52, 14, 4), "#c08457"], [() => rr(c, -8, 10, 16, 22, 4), "#f2a900"], [() => { c.beginPath(); c.moveTo(-30, -36); c.lineTo(30, -36); c.quadraticCurveTo(30, 14, 0, 14); c.quadraticCurveTo(-30, 14, -30, -36); c.closePath(); }, "#ffc933"]]); shine(c, -14, -20, 5, 12, 0.1); },
      flame: c => { sp(c, [[() => { c.beginPath(); c.moveTo(0, 42); c.bezierCurveTo(-46, 40, -40, -10, -14, -26); c.quadraticCurveTo(-12, -6, 0, -4); c.quadraticCurveTo(-4, -30, 12, -44); c.bezierCurveTo(16, -18, 46, 0, 34, 26); c.quadraticCurveTo(26, 42, 0, 42); c.closePath(); }, "#ff6b1f"]]); c.beginPath(); c.moveTo(0, 38); c.bezierCurveTo(-24, 36, -20, 10, -4, 0); c.quadraticCurveTo(0, 14, 10, 12); c.bezierCurveTo(22, 20, 20, 38, 0, 38); c.fillStyle = "#ffd23a"; c.fill(); }
    };
  })();
  function uiIconURL(id, size) {
    const s = size || 128, key = "ui:" + id + ":" + s; if (cache[key]) return cache[key];
    const c = mk(s, s), ctx = c.getContext("2d"); ctx.translate(s / 2, s / 2); ctx.scale(s / 118, s / 118); (UIP[id] || UIP.star)(ctx);
    return (cache[key] = withRim(c, Math.max(2, s * 0.045), true).toDataURL());
  }

  // Draw a stack of layer sprites with ONE sticker rim around the whole stack (not between layers).
  // layers: [{ id, x, y (up from origin), tilt }]; origin = plate surface.
  function drawStack(ctx, layers, alpha) {
    ctx.save(); if (alpha !== undefined) ctx.globalAlpha *= alpha;
    for (const pass of ["rim", "canvas"]) for (const l of layers) {
      const sp = ingredient(l.id); ctx.save(); ctx.translate(l.x, -l.y + (l.dy || 0)); if (l.tilt) ctx.rotate(l.tilt * Math.PI / 180); ctx.drawImage(sp[pass], -sp.ox, -sp.oy); ctx.restore();
    }
    ctx.restore();
  }

  // Recipe thumbnail: the finished stack drawn small with a single sticker rim.
  function recipeThumb(recipeOrSeq, size) {
    const seq = Array.isArray(recipeOrSeq) ? recipeOrSeq : SS.DATA.recipe_by_id[recipeOrSeq].ingredient_sequence;
    const key = "thumb:" + seq.join(",") + ":" + size; if (cache[key]) return cache[key];
    let H = 0; seq.forEach(id => H += SS.DATA.ingredient_by_id[id].h);
    const top = ingredient(seq[seq.length - 1]);
    const totalH = H - SS.DATA.ingredient_by_id[seq[seq.length - 1]].h + top.vh + 40, W = 330;
    const c = mk(size, size), ctx = c.getContext("2d");
    const sc = Math.min(size / W, size / (totalH + 30));
    ctx.translate(size / 2, size - (size - totalH * sc) / 2 - 10 * sc); ctx.scale(sc, sc);
    let y = 0; const layers = seq.map(id => { const l = { id, x: 0, y }; y += SS.DATA.ingredient_by_id[id].h; return l; });
    drawStack(ctx, layers);
    const url = c.toDataURL();
    cache[key] = url; return url;
  }
  function iconURL(id, size) { const key = "icourl:" + id + ":" + size; if (cache[key]) return cache[key]; let c; if (SS.DATA.ingredient_by_id[id]) { const sp = ingredient(id); const s = size || 96; c = mk(s, s); const ctx = c.getContext("2d"); const bw = SS.DATA.ingredient_by_id[id].w + 2 * RIM + 8, bh = sp.vh + 60; const sc = Math.min(s / bw, s / bh); ctx.translate(s / 2, s / 2 + (sp.vh / 2 - 22) * sc); ctx.scale(sc, sc); ctx.drawImage(sp.rim, -sp.ox, -sp.oy); ctx.drawImage(sp.canvas, -sp.ox, -sp.oy); } else c = icon(id, size || 96); cache[key] = c.toDataURL(); return cache[key]; }
  function avatarURL(id, size) { if (id === "chef" || !SS.DATA.customers[id]) return SS.assetURL("assets/icons/chef_calm.png"); const key = "avaurl:" + id + ":" + size; return cache[key] || (cache[key] = avatar(id, size).toDataURL()); }
  function plateURL(id) { const key = "plateurl:" + id; return cache[key] || (cache[key] = plate(id).canvas.toDataURL()); }
  function kitchenURL(id, w) { const key = "kiturl:" + id + ":" + w; if (cache[key]) return cache[key]; const src = SS.BG.still(id), c = mk(w, w * 16 / 9), ctx = c.getContext("2d"); ctx.drawImage(src, 0, 0, c.width, c.height); return (cache[key] = c.toDataURL()); }

  // v2.0 dish kit art: inline SVG that reuses the page's sprite library (see SS.DishView)
  const thumbHTML = (src, size, attrs) => SS.DishView.thumbHTML(src, size, attrs);
  const iconHTML = (id, size, attrs) => SS.DishView.iconHTML(id, size, attrs);
  return { thumbHTML, iconHTML, preload, uiIconURL, ingredient, icon, plate, kitchen, menuBg, avatar, recipeThumb, drawStack, iconURL, avatarURL, plateURL, kitchenURL, OUT, RIM, shade };
})();
