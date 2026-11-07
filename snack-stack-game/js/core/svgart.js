// Snack Stack — rich sticker-style ingredient art (v1.6, burger batch), hand-authored as SVG.
// Each ingredient is drawn at game-pixel scale as a stack layer: centred on x = 0, front-bottom edge at y = 0, up is negative.
// Shading is baked in (top-left light); SS.Art adds the white sticker rim. SVG strings are also exportable for Godot.
window.SS = window.SS || {};

SS.SVGArt = (function () {
  const OUT = "#612a1e", W = 5; // style rules v2: one warm ink colour (tier 1 silhouette)
  const f1 = n => Math.round(n * 10) / 10;
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function smooth(pts) { const n = pts.length; let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`; for (let i = 0; i < n; i++) { const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]; d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`; } return d + "Z"; }
  function blob(cx, cy, rx, ry, n, amp, seed, rot) { const r = rng(seed), pts = []; rot = rot || 0; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, k = 1 + (r() - 0.5) * amp, x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k; pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); } return smooth(pts); }
  const rg = (id, stops, cx, cy, r) => rg0(id, flat(stops), cx, cy, r);
  const ol = (d, fill, w) => `<path d="${d}" fill="${fill}" stroke="${OUT}" stroke-width="${w || W}" stroke-linejoin="round" paint-order="stroke"/>`;
  const p = (d, fill, op) => `<path d="${d}" fill="${fill}"${op ? ` opacity="${op}"` : ""}/>`;
  const line = (d, col, w, op) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op ? ` opacity="${op}"` : ""}/>`;
  const E = (cx, cy, rx, ry) => `M${f1(cx - rx)},${cy}A${rx},${ry} 0 1 0 ${f1(cx + rx)},${cy}A${rx},${ry} 0 1 0 ${f1(cx - rx)},${cy}Z`;
  // Style rule: base fills are almost flat. Every gradient is pulled 60% toward its mid colour.
  const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)), toHex = a => "#" + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
  const flat = stops => { if (!stops.every(([, c]) => /^#[0-9a-f]{6}$/i.test(c))) return stops; const m = hx(stops[Math.floor(stops.length / 2)][1]);
    return stops.map(([o, c]) => [o, toHex(hx(c).map((v, i) => v + (m[i] - v) * 0.6))]); };
  const lg0 = (id, stops, x2, y2) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2 === undefined ? 0 : x2}" y2="${y2 === undefined ? 1 : y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
  const lg = (id, stops, x2, y2) => lg0(id, flat(stops), x2, y2);
  const rg0 = (id, stops, cx, cy, r) => `<radialGradient id="${id}" cx="${cx || .4}" cy="${cy || .35}" r="${r || .75}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</radialGradient>`;
  // a puck/disc seen at a low angle: wobbly top ellipse + side band of thickness t (front edge at y = 0)
  function puck(rx, ry, t, seed, amp) { const r = rng(seed), pts = [], n = 28; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, k = 1 + (r() - 0.5) * (amp || 0.03), s = Math.sin(a); pts.push([Math.cos(a) * rx * k, -ry - t + s * ry * k + (s > 0 ? t : 0) * Math.min(1, s * 3)]); } return smooth(pts); }
  const sticky = (cx, cy, rx, ry, seed, n) => { const r = rng(seed); let s = ""; const m = Math.max(4, Math.round(n * 0.45)); for (let i = 0; i < m; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()), x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d, L = 2.4 + r() * 1.8; s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(L)}" ry="${f1(L * .62)}" transform="rotate(${f1((r() - .5) * 40)} ${f1(x)} ${f1(y)})"/>`; } return s; };

  const A = {};
  // Side-view style (matches the reference stickers): every layer is a horizontal band, front edge at y = 0.
  // Anything that should drape over the layer below (cheese drips, lettuce frills) hangs below y = 0.
  const OW = 5.5; // tier 1 silhouette weight; tier 2 contact lines = 0.7x, tier 3 details use tone, never ink
  const O2 = (d, fill) => `<path d="${d}" fill="${fill}" stroke="${OUT}" stroke-width="${OW}" stroke-linejoin="round" paint-order="stroke"/>`;
  // rounded "pill" outline with gentle bumps (superellipse), for patties and buns
  function pill(cx, cy, rx, ry, n, amp, seed, ex) { const r = rng(seed), pts = []; ex = ex || 4; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), k = 1 + (r() - 0.5) * amp; pts.push([cx + Math.sign(c) * Math.pow(Math.abs(c), 2 / ex) * rx * k, cy + Math.sign(sn) * Math.pow(Math.abs(sn), 2 / ex) * ry * k]); } return smooth(pts); }
  // mottled texture inside a clip: soft lighter wavy patches + small darker dots
  // Style rule: texture = sparse tilted oval specks in a darker shade of the base. No light blobs, no noise.
  function specks(cx, cy, rx, ry, col, seed, n) { const r = rng(seed); let s = "";
    for (let i = 0; i < n; i++) { const x = cx + (r() - 0.5) * rx * 1.7, y = cy + (r() - 0.5) * ry * 1.5, a = (r() - 0.5) * 40, L = 2.6 + r() * 1.6; s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(L)}" ry="${f1(L * 0.62)}" transform="rotate(${f1(a)} ${f1(x)} ${f1(y)})" fill="${col}" opacity=".8"/>`; }
    return s; }
  function mottle(id, d, cx, cy, rx, ry, light, dark, seed, nl, nd) {
    return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${specks(cx, cy, rx, ry, dark, seed, Math.max(8, Math.round((nd || 10) * 0.7)))}</g>`;
  }
  // ---------------- buns (match reference: chunky, orange, lighter wavy band, small darker dots) ----------------
  function wavyBand() { return ""; } // style rule: no wavy texture bands (removed)
  A.bottom_bun = () => {
    const d = "M-136,-58C-136,-76 -120,-78 0,-78C120,-78 136,-76 136,-58L136,-30C136,4 110,6 0,6C-110,6 -136,4 -136,-30Z";
    return lg("bbg", [[0, "#ffc56a"], [.5, "#f6a646"], [1, "#e0822c"]]) + O2(d, "url(#bbg)") +
      `<clipPath id="bbc"><path d="${d}"/></clipPath><g clip-path="url(#bbc)">` + wavyBand("bbw", -44, 140, 8, "#ffd796", 4) + `<g fill="#e07a26" opacity=".7">${sticky(0, -30, 120, 26, 5, 14)}</g>` + p("M-140,-12C-80,8 80,8 140,-12L140,10L-140,10Z", "#d8752a", .45) + "</g>";
  };
  A.top_bun = () => {
    const d = "M-138,-20C-150,-190 150,-190 138,-20C136,0 120,2 0,2C-120,2 -136,0 -138,-20Z";
    const r = rng(9); let seeds = "";
    const spots = [[-92, -60], [-50, -96], [-6, -122], [44, -110], [88, -78], [-104, -36], [-60, -56], [-14, -84], [30, -70], [72, -48], [108, -40], [-30, -132], [60, -134], [0, -150], [-80, -110], [96, -104]];
    spots.forEach(([x, y], i) => { const a = -20 + r() * 60 - x * 0.15; seeds += `<g transform="translate(${x},${y}) rotate(${f1(a)})"><ellipse rx="11" ry="6.5" fill="#fbe0b0" stroke="#d99a52" stroke-width="2"/><ellipse cx="-3" cy="-2" rx="5" ry="2.2" fill="#fff6e2"/></g>`; });
    return rg("tbg", [[0, "#ffb85a"], [.6, "#f39a3c"], [1, "#e0822c"]], .45, .3, .8) + O2(d, "url(#tbg)") +
      `<clipPath id="tbc"><path d="${d}"/></clipPath><g clip-path="url(#tbc)">` + wavyBand("tbw", -44, 140, 10, "#ffd08a", 9) + `<g fill="#e07a26" opacity=".75">${sticky(0, -80, 120, 50, 12, 16)}</g>` + p("M-140,-14C-80,4 80,4 140,-14L140,8L-140,8Z", "#d8752a", .5) + "</g>" + seeds;
  };
  // ---------------- patties ----------------
  A.beef_patty = () => {
    const d = pill(0, -30, 140, 34, 48, 0.07, 3, 3);
    const r = rng(15); let spots = ""; for (let i = 0; i < 26; i++) spots += p(blob(f1((r() - 0.5) * 250), f1(-30 + (r() - 0.5) * 48), 4 + r() * 9, 3 + r() * 6, 7, 0.4, 100 + i), r() < 0.7 ? "#5a2610" : "#b0603a", r() < 0.7 ? .85 : .6);
    return lg("bpg", [[0, "#ad5f34"], [.5, "#924a26"], [1, "#6e3219"]]) + O2(d, "url(#bpg)") + `<clipPath id="bpc"><path d="${d}"/></clipPath><g clip-path="url(#bpc)">` + spots + "</g>";
  };
  A.chicken_patty = () => {
    const d = pill(0, -30, 134, 32, 64, 0.11, 31, 3);
    const r = rng(33); let crumbs = ""; for (let i = 0; i < 40; i++) crumbs += p(blob(f1((r() - 0.5) * 240), f1(-30 + (r() - 0.5) * 46), 3 + r() * 7, 2.5 + r() * 5, 6, 0.5, 300 + i), r() < 0.55 ? "#ffd98a" : "#b55c1a", .8);
    return lg("cpg", [[0, "#ffbe5c"], [.6, "#ec9634"], [1, "#c8701e"]]) + O2(d, "url(#cpg)") + `<clipPath id="cpc"><path d="${d}"/></clipPath><g clip-path="url(#cpc)">` + crumbs + "</g>";
  };
  // ---------------- veg ----------------
  A.lettuce = () => {
    // big ruffled leaf (as in the burger reference): wavy ruffled top, billowing lobes that hang over the layer below,
    // wider than the bun; darker fold shadows and pale crest highlights inside
    const r = rng(44), N = 7, top = [], bot = [];
    for (let i = 0; i <= N; i++) { const x = -150 + i * 300 / N + (i > 0 && i < N ? (r() - 0.5) * 22 : 0); top.push([f1(x), f1(-42 + (i % 2 ? -7 : 8) + (r() - 0.5) * 6)]); bot.push([f1(x), f1(-4 + (i % 2 ? 10 : 0) + r() * 4)]); }
    let d = `M${top[0][0]},${top[0][1]}`; for (let i = 1; i <= N; i++) d += `Q${f1((top[i - 1][0] + top[i][0]) / 2)},${f1(Math.min(top[i - 1][1], top[i][1]) - 22)} ${top[i][0]},${top[i][1]}`;
    d += `C${f1(top[N][0] + 22)},${f1(top[N][1] + 4)} ${f1(bot[N][0] + 22)},${f1(bot[N][1] - 4)} ${bot[N][0]},${bot[N][1]}`; for (let i = N - 1; i >= 0; i--) d += `Q${f1((bot[i + 1][0] + bot[i][0]) / 2)},${f1(Math.max(bot[i + 1][1], bot[i][1]) + 12)} ${bot[i][0]},${bot[i][1]}`; d += `C${f1(bot[0][0] - 22)},${f1(bot[0][1] - 4)} ${f1(top[0][0] - 22)},${f1(top[0][1] + 4)} ${top[0][0]},${top[0][1]}Z`;
    let folds = "";
    for (let i = 0; i < N; i++) { const x0 = top[i][0], x1 = top[i + 1][0], xm = (x0 + x1) / 2;
      folds += p(`M${f1(x0 + 4)},-20C${f1(xm - 8)},0 ${f1(xm + 8)},0 ${f1(x1 - 4)},-20C${f1(xm + 6)},-10 ${f1(xm - 6)},-10 ${f1(x0 + 4)},-20Z`, "#6fa52a", .55);
      if (i % 2 === 0) folds += line(`M${f1(x0 + 10)},${f1(top[i][1] + 12)}Q${f1(xm - 6)},${f1(Math.min(top[i][1], top[i + 1][1]) - 2)} ${f1(xm + 8)},${f1(top[i + 1][1] + 6)}`, "#f2ff9a", 5, .85);
      else folds += line(`M${f1(xm - 12)},${f1(-30)}q10,-6 20,0`, "#f2ff9a", 4, .7); }
    return lg("lfg", [[0, "#dcf05a"], [.55, "#b1da3e"], [1, "#82ba2e"]]) + O2(d, "url(#lfg)") + `<clipPath id="lfc"><path d="${d}"/></clipPath><g clip-path="url(#lfc)">${folds}</g>`;
  };
  A.tomato = () => {
    let s = lg("tmg", [[0, "#ff5636"], [.6, "#e83222"], [1, "#c11f14"]]);
    [-64, 64].forEach((x, k) => { const d = pill(x, -22, 68, 24, 28, 0.02, 7 + k, 2.6); s += O2(d, "url(#tmg)") + `<clipPath id="tmc${k}"><path d="${d}"/></clipPath><g clip-path="url(#tmc${k})">`;
      s += p(`M${x - 70},-36C${x - 30},-46 ${x + 30},-46 ${x + 70},-36L${x + 70},-50L${x - 70},-50Z`, "#ff7a5a", .7);
      [-30, -6, 18, 40].forEach((dx, i) => { const sx = x + dx - 6, a = (i - 1.5) * 10; s += `<g transform="translate(${sx},-34) rotate(${a})"><path d="M-6,-6Q0,10 6,-6Q0,-10 -6,-6Z" fill="#ffc05a" stroke="#ffde9a" stroke-width="1.5"/></g>`; });
      s += line(`M${x - 46},-10C${x - 20},-4 ${x + 20},-4 ${x + 46},-10`, "#ff9a7e", 6, .55) + "</g>"; });
    return s;
  };
  A.onion = () => {
    let s = lg("ong", [[0, "#cc6dbf"], [1, "#94358a"]]);
    [-62, 62].forEach((x, k) => { const d = pill(x, -16, 66, 18, 28, 0.02, 11 + k, 2.6); s += O2(d, "url(#ong)");
      s += `<clipPath id="onc${k}"><path d="${d}"/></clipPath><g clip-path="url(#onc${k})">`; for (let i = 0; i < 10; i++) s += `<rect x="${x - 62 + i * 13}" y="-34" width="6" height="40" rx="3" fill="#f2c6ec" opacity=".8"/>`;
      s += line(`M${x - 54},-26C${x - 20},-30 ${x + 20},-30 ${x + 54},-26`, "#fff", 4, .7) + "</g>"; });
    return s;
  };
  A.pickles = () => {
    let s = rg("pkg", [[0, "#bfe06a"], [.6, "#86b83e"], [1, "#55862a"]], .45, .4, .7);
    [[-86, -14, -8], [-30, -18, 6], [30, -14, -6], [86, -18, 8]].forEach(([x, y, a], i) => {
      const d = pill(x, y, 36, 17, 24, 0.08, 80 + i, 2.2); s += `<g transform="rotate(${a} ${x} ${y})">` + O2(d, "url(#pkg)") + `<path d="${E(x, y - 1, 22, 8)}" fill="none" stroke="#e8f6b0" stroke-width="2.5" opacity=".85"/><g fill="#f4f9cf">${sticky(x, y - 1, 15, 5, 90 + i, 5)}</g></g>`;
    });
    return s;
  };
  // ---------------- melted cheese (big drape with rounded drips, like the reference) ----------------
  function cheese(id, c1, c2, extra) {
    let d = "M-146,-18C-146,-28 -136,-30 -120,-30L120,-30C136,-30 146,-28 146,-18L146,-4";
    const drips = [[112, 14], [64, -4], [22, 22], [-24, -2], [-70, 18], [-112, -4]];
    let x0 = 146; drips.forEach(([x, h], i) => { const w = 20; d += `C${x0},${h} ${x + w},${h + 8} ${x},${h + 8}`; x0 = x - w; });
    d += "C-146,10 -146,0 -146,-4Z";
    const r = rng(id.length * 3); let hl = ""; for (let i = 0; i < 6; i++) hl += p(blob(f1((r() - 0.5) * 240), f1(-16 + r() * 10), 16 + r() * 18, 4 + r() * 3, 8, 0.5, 400 + i), c2, .8);
    return lg(id + "g", [[0, c2], [.5, c1], [1, c1]]) + O2(d, `url(#${id}g)`) + `<clipPath id="${id}c"><path d="${d}"/></clipPath><g clip-path="url(#${id}c)">${hl}</g>` + line("M-124,-20C-60,-16 40,-22 124,-18", "#fff6c0", 5, .6) + (extra || "");
  }
  A.american_cheese = () => cheese("ac", "#fbb216", "#ffd84a");
  A.cheddar = () => cheese("cd", "#ef7f16", "#ffae46");
  A.swiss_cheese = () => cheese("sw", "#f0d46a", "#fff2b0", [[-90, -10, 10, 6], [-20, 6, 8, 5], [50, -8, 11, 6], [104, 10, 6, 4]].map(([x, y, rx, ry]) => p(E(x, y, rx, ry), "#c9a640")).join(""));
  A.pepper_jack = () => cheese("pj", "#f3e3a8", "#fffbea", (() => { const r = rng(5); let s = ""; for (let i = 0; i < 24; i++) s += `<ellipse cx="${f1((r() - 0.5) * 260)}" cy="${f1(-20 + r() * 26)}" rx="3.6" ry="2.4" fill="${i % 2 ? "#e2402b" : "#4c9a2a"}"/>`; return s; })());
  // ---------------- breakfast batch ----------------
  A.egg = () => {
    // fried egg from the side: a smooth cream white with a few big soft waves that spill over the bread, glossy yolk dome
    const d = "M-150,-14C-152,-30 -130,-34 -110,-32C-60,-28 60,-30 110,-32C134,-34 154,-26 152,-10C150,4 138,8 124,10C104,14 92,24 72,22C52,20 44,8 20,10C-4,12 -14,24 -38,22C-62,20 -70,8 -92,10C-112,12 -122,20 -138,14C-150,10 -150,0 -150,-14Z";
    const yolk = "M-60,-26C-60,-74 60,-74 60,-26C38,-18 -38,-18 -60,-26Z";
    return lg("egw", [[0, "#ffffff"], [.6, "#fff5e0"], [1, "#f1dcb4"]]) + O2(d, "url(#egw)") +
      `<clipPath id="egc"><path d="${d}"/></clipPath><g clip-path="url(#egc)">` + p(blob(-96, -8, 26, 7, 9, 0.4, 611), "#ffe8b4", .7) + p(blob(92, -6, 30, 7, 9, 0.4, 612), "#ffe8b4", .7) + p(blob(-20, 6, 22, 5, 9, 0.4, 613), "#ffe8b4", .6) + "</g>" +
      rg("egy", [[0, "#ffd84a"], [.6, "#ffb31c"], [1, "#f08a0e"]], .4, .35, .75) + `<path d="${yolk}" fill="url(#egy)" stroke="#f07a10" stroke-width="10" stroke-linejoin="round"/>` +
      p(E(-22, -52, 18, 8), "#fff3b0", .9) + p(E(-28, -56, 7, 3), "#fff", .95);
  };
  A.sausage_patty = () => {
    const d = pill(0, -26, 132, 30, 44, 0.06, 71, 3);
    const r = rng(72); let spots = ""; for (let i = 0; i < 30; i++) spots += p(blob(f1((r() - 0.5) * 240), f1(-26 + (r() - 0.5) * 42), 3 + r() * 6, 2.5 + r() * 4, 6, 0.4, 700 + i), r() < 0.55 ? "#f2c6a2" : "#6a2a14", .8);
    return lg("sgg", [[0, "#c46a42"], [.55, "#a3502e"], [1, "#7a361c"]]) + O2(d, "url(#sgg)") + `<clipPath id="sgc"><path d="${d}"/></clipPath><g clip-path="url(#sgc)">${spots}</g>` + p(E(-60, -44, 26, 5), "#fff", .3);
  };
  A.toast = () => {
    // thick slice: golden crumb face on top with toasty holes, darker crust band below (works as top or bottom slice)
    const d = "M-130,-62C-134,-72 -126,-78 -112,-78L112,-78C126,-78 134,-72 130,-62L130,-14C130,0 120,2 0,2C-120,2 -130,0 -130,-14Z";
    const face = "M-130,-62C-134,-72 -126,-78 -112,-78L112,-78C126,-78 134,-72 130,-62L130,-50C80,-42 -80,-42 -130,-50Z";
    const r = rng(81); let holes = ""; for (let i = 0; i < 9; i++) holes += p(blob(f1(-110 + i * 27 + (r() - 0.5) * 8), f1(-63 + (r() - 0.5) * 8), 6 + r() * 6, 2.6 + r() * 2, 7, 0.4, 820 + i), "#ec9a2e", .9);
    return lg("tsg", [[0, "#d9813a"], [1, "#a85a22"]]) + O2(d, "url(#tsg)") + `<clipPath id="tsc"><path d="${d}"/></clipPath><g clip-path="url(#tsc)"><g fill="#7a3e14" opacity=".55">${sticky(0, -24, 120, 18, 83, 14)}</g>` + wavyBand("tsw", -32, 132, 5, "#e9a052", 84) + "</g>" +
      lg("tsf", [[0, "#ffe6a2"], [1, "#ffc864"]]) + O2(face, "url(#tsf)") + `<clipPath id="tsfc"><path d="${face}"/></clipPath><g clip-path="url(#tsfc)"><path d="${d}" fill="none" stroke="#d07024" stroke-width="22" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#f09934" stroke-width="16" stroke-linejoin="round"/></g>` + holes + line("M-118,-48C-60,-40 60,-40 118,-48", "#7a3e14", 4, .25);
  };
  // bagel halves: plain is the chunky bottom half, sesame is the domed top with the hole on top
  A.bagel_half_plain = () => {
    const d = "M-134,-56C-134,-74 -116,-78 0,-78C116,-78 134,-74 134,-56L134,-30C134,4 108,6 0,6C-108,6 -134,4 -134,-30Z";
    return lg("bpg2", [[0, "#ffc66a"], [.5, "#f2a240"], [1, "#d8792a"]]) + O2(d, "url(#bpg2)") +
      `<clipPath id="bpc2"><path d="${d}"/></clipPath><g clip-path="url(#bpc2)">` + wavyBand("bpw", -40, 140, 8, "#ffd796", 85) + `<g fill="#d0701e" opacity=".7">${sticky(0, -30, 118, 26, 86, 14)}</g>` + p("M-140,-10C-80,8 80,8 140,-10L140,10L-140,10Z", "#c8661c", .45) + "</g>";
  };
  A.bagel_half_sesame = () => {
    const d = "M-136,-22C-146,-176 146,-176 136,-22C134,0 118,2 0,2C-118,2 -134,0 -136,-22Z";
    const hole = "M-44,-100C-44,-118 44,-118 44,-100C44,-88 -44,-88 -44,-100Z";
    const r = rng(19); let seeds = "";
    [[-96, -58], [-70, -92], [76, -92], [100, -60], [-112, -34], [-60, -50], [-20, -68], [26, -66], [64, -46], [112, -36], [-36, -122], [40, -122], [-86, -76], [90, -78], [0, -128], [-4, -76]].forEach(([x, y]) => { seeds += `<g transform="translate(${x},${y}) rotate(${f1(-30 + r() * 60)})"><ellipse rx="10" ry="6" fill="#fbe0b0" stroke="#d99a52" stroke-width="2"/><ellipse cx="-3" cy="-2" rx="4.5" ry="2" fill="#fff6e2"/></g>`; });
    return rg("bsg", [[0, "#ffbf62"], [.6, "#f29c3a"], [1, "#d8792a"]], .45, .3, .8) + O2(d, "url(#bsg)") +
      `<clipPath id="bsc"><path d="${d}"/></clipPath><g clip-path="url(#bsc)">` + wavyBand("bsw", -40, 140, 9, "#ffd08a", 87) + `<g fill="#d0701e" opacity=".7">${sticky(0, -80, 118, 46, 88, 14)}</g>` + p("M-140,-14C-80,4 80,4 140,-14L140,8L-140,8Z", "#c8661c", .5) + "</g>" +
      p(hole, "#c86a22") + `<path d="${hole}" fill="none" stroke="${OUT}" stroke-width="5"/>` + p("M-32,-99C-32,-110 32,-110 32,-99C22,-103 -22,-103 -32,-99Z", "#6e3412", .85) + seeds;
  };
  A.pancake = () => {
    const d = pill(0, -22, 134, 24, 40, 0.03, 91, 3.4);
    return lg("pcg", [[0, "#ffd88c"], [.3, "#f6b456"], [1, "#d9822e"]]) + O2(d, "url(#pcg)") +
      `<clipPath id="pcc"><path d="${d}"/></clipPath><g clip-path="url(#pcc)">` + p("M-140,-34C-80,-28 80,-28 140,-34L140,-50L-140,-50Z", "#ffe8b0", .9) + `<g fill="#e9a04a" opacity=".8">${sticky(0, -18, 122, 12, 92, 18)}</g>` + "</g>";
  };
  A.waffle = () => {
    const d = "M-130,-50C-134,-58 -126,-62 -114,-62L114,-62C126,-62 134,-58 130,-50L130,-10C130,0 120,2 0,2C-120,2 -130,0 -130,-10Z";
    let grid = ""; for (let i = 0; i < 9; i++) { const x = -112 + i * 28; grid += `<rect x="${x - 9}" y="-42" width="18" height="30" rx="5" fill="#c97424"/><rect x="${x - 6}" y="-40" width="8" height="10" rx="3" fill="#e9a04a" opacity=".8"/>`; }
    return lg("wfg", [[0, "#ffc967"], [.5, "#efa040"], [1, "#d27a28"]]) + O2(d, "url(#wfg)") + `<clipPath id="wfc"><path d="${d}"/></clipPath><g clip-path="url(#wfc)">${grid}` + p("M-140,-52C-80,-48 80,-48 140,-52L140,-64L-140,-64Z", "#ffe0a0", .9) + "</g>";
  };
  // ---------------- sweets batch ----------------
  A.cookie = () => {
    // round, chunky cookie seen at a low angle: rounded top face with chips, soft lower side band (no inner ink)
    const d = "M-112,-40C-112,-82 112,-82 112,-40L112,-26C112,0 70,8 0,8C-70,8 -112,0 -112,-26Z";
    const face = "M-112,-40C-112,-82 112,-82 112,-40C112,-18 70,-10 0,-10C-70,-10 -112,-18 -112,-40Z";
    const r = rng(102); let chips = "";
    [[-62, -48], [-20, -62], [30, -54], [74, -44], [-40, -30], [8, -34], [52, -26], [-82, -36]].forEach(([x, y], i) => {
      chips += p(blob(x, y, 8 + r() * 3, 5.5 + r() * 2, 7, 0.35, 1030 + i), "#5a2e14") + p(E(x - 2.5, y - 2, 2.6, 1.4), "#8a5228", .9); });
    return lg("cks", [[0, "#c9853e"], [1, "#a8662a"]]) + lg("ckf", [[0, "#efb766"], [1, "#e0a052"]]) + O2(d, "url(#cks)") + p(face, "url(#ckf)") +
      line("M-108,-36C-80,-16 80,-16 108,-36", "#c27a34", 3, .7) + `<g fill="#c27a34">${specks(0, -46, 100, 22, "#c27a34", 104, 10)}</g>` + chips +
      line("M-74,-66C-40,-74 0,-76 30,-74", "#ffd896", 5, .7);
  };
  // rounded ice cream scoop: a full ball with a soft ruffled foot where it sits; inner folds are tone lines, never ink
  function scoop(id, c0, c1, c2, flecks) {
    const r = rng(id.length * 11); let foot = "M-104,-6"; const N = 8;
    for (let i = 1; i <= N; i++) foot += `Q${f1(-104 + (i - 0.5) * 208 / N)},${i % 2 ? 6 : -2} ${f1(-104 + i * 208 / N)},-6`;
    const d = `M-100,-10C-128,-60 -96,-150 0,-150C96,-150 128,-60 100,-10C96,0 60,8 0,8C-60,8 -96,0 -100,-10Z`;
    let fl = ""; if (flecks) for (let i = 0; i < 16; i++) fl += p(E(f1((r() - 0.5) * 160), f1(-80 + (r() - 0.5) * 100), 2.2, 1.4), flecks, .55);
    return lg(id + "g", [[0, c0], [1, c1]]) + O2(d, `url(#${id}g)`) + `<clipPath id="${id}c"><path d="${d}"/></clipPath><g clip-path="url(#${id}c)">` + fl +
      line("M-96,-28C-60,-14 60,-14 96,-28", c2, 4, .8) + line("M-70,-14C-60,-6 -46,-6 -36,-14M-14,-12C-4,-4 10,-4 20,-12M42,-14C52,-6 66,-6 76,-14", c2, 3, .7) + "</g>" +
      line("M-62,-118C-40,-134 -10,-140 16,-138", "#ffffff", 7, .55);
  }
  A.ice_cream_vanilla = () => scoop("icv", "#fffaea", "#fbeccb", "#e8d3a4", "#8a5a2a");
  A.ice_cream_chocolate = () => scoop("icc", "#9a5c36", "#7e4527", "#5e3018");
  A.strawberry_slice = () => {
    // halved strawberries showing the pale cut face with streaks, like the shortcake reference
    let s = "";
    [[-86, -4], [0, 4], [86, -6]].forEach(([x, a], i) => { const X = x; x = 0; s += `<g transform="translate(${X},0) scale(1.18,1.25) translate(0,4)">`;
      const d = `M${x - 42},-34C${x - 44},-6 ${x - 14},6 ${x},6C${x + 14},6 ${x + 44},-6 ${x + 42},-34C${x + 30},-46 ${x - 30},-46 ${x - 42},-34Z`;
      s += `<g transform="rotate(${a} ${x} -20)">` + O2(d, "#e2342e") + p(`M${x - 32},-32C${x - 32},-12 ${x - 10},-2 ${x},-2C${x + 10},-2 ${x + 32},-12 ${x + 32},-32C${x + 20},-40 ${x - 20},-40 ${x - 32},-32Z`, "#ff7a6e") +
        p(`M${x - 14},-32C${x - 12},-18 ${x - 4},-10 ${x},-10C${x + 4},-10 ${x + 12},-18 ${x + 14},-32C${x + 6},-35 ${x - 6},-35 ${x - 14},-32Z`, "#ffc7bd") +
        [-24, -12, 0, 12, 24].map(dx => line(`M${x + dx * 0.4},-14L${x + dx},-30`, "#ffd9d2", 2.5, .9)).join("") + p(E(x - 22, -24, 6, 3), "#fff", .7) + "</g></g>";
    });
    return s;
  };
  A.banana_slice = () => {
    let s = "";
    [-92, -32, 30, 90].forEach((x, i) => { const d = pill(x, -16, 34, 18, 22, 0.03, 120 + i, 2.2);
      s += O2(d, "#fff2b0") + p(E(x, -18, 26, 12), "#fff9d8") + `<g fill="#b48a3a" opacity=".75">${[0, 1, 2, 3, 4, 5].map(k => { const a = k / 6 * 6.283; return `<circle cx="${f1(x + Math.cos(a) * 9)}" cy="${f1(-18 + Math.sin(a) * 4)}" r="1.8"/>`; }).join("")}</g>` + line(`M${x - 24},-6C${x - 8},-2 ${x + 8},-2 ${x + 24},-6`, "#e8cc6a", 4, .7); });
    return s;
  };
  function sauceDrape(id, c1, c2, top, drips, gloss) {
    let d = `M-138,${top}C-138,${top - 10} -128,${top - 12} -112,${top - 12}L112,${top - 12}C128,${top - 12} 138,${top - 10} 138,${top}L138,-4`; let x0 = 138;
    drips.forEach(([x, h]) => { d += `C${x0},${h} ${x + 12},${h + 6} ${x},${h + 6}`; x0 = x - 12; }); d += `C-138,8 -138,0 -138,-4Z`;
    return lg(id + "g", [[0, c2], [1, c1]]) + O2(d, `url(#${id}g)`) + line(`M-118,${top - 4}C-60,${top} 40,${top - 6} 118,${top - 3}`, gloss, 5, .7);
  }
  A.chocolate_layer = () => sauceDrape("chl", "#4a2210", "#7a3e1c", -18, [[100, 16], [58, -2], [18, 22], [-24, 0], [-66, 18], [-104, -2]], "#b0704a");
  A.caramel_drizzle = () => {
    // thin wavy drizzle with a few drops hanging off
    let d = "M-130,-14"; for (let i = 1; i <= 10; i++) d += `Q${-130 + (i - 0.5) * 26},${i % 2 ? -26 : -2} ${-130 + i * 26},-14`;
    return line(d, OUT, 15) + line(d, "#e08a2a", 10) + line(d, "#ffc36a", 3.5, .9) + [[-60, 10], [24, 14], [92, 8]].map(([x, h]) => O2(`M${x - 6},-10C${x - 6},${h} ${x + 6},${h} ${x + 6},-10Z`, "#e08a2a")).join("");
  };
  A.cream_swirl = () => {
    // soft-serve style whipped cream: ONE seamless silhouette (three soft tiers and a curled tip),
    // tiers separated only by soft tone lines inside; no inner ink
    const d = "M-112,-6C-128,-14 -126,-40 -104,-44C-112,-62 -92,-80 -72,-78C-80,-98 -62,-114 -42,-110C-44,-130 -26,-142 -6,-140C2,-160 26,-162 30,-146C40,-134 30,-122 20,-120C42,-118 54,-102 46,-86C68,-90 84,-72 76,-56C100,-56 114,-38 108,-22C120,-14 116,6 98,6C60,12 -60,12 -112,-6Z";
    return lg("crg", [[0, "#ffffff"], [1, "#f6ecdc"]]) + O2(d, "url(#crg)") + `<clipPath id="crc"><path d="${d}"/></clipPath><g clip-path="url(#crc)">` +
      line("M-104,-44C-60,-34 40,-34 108,-22", "#e9dcc4", 4, .9) + line("M-72,-78C-36,-68 30,-70 76,-56", "#e9dcc4", 4, .9) + line("M-42,-110C-16,-102 20,-104 46,-86", "#e9dcc4", 3.5, .9) +
      line("M-6,-140C2,-130 14,-124 20,-120", "#e9dcc4", 3, .85) + p("M-120,-4C-60,4 60,4 120,-4L120,14L-120,14Z", "#ead9bc", .6) + "</g>" +
      line("M-86,-56C-70,-62 -54,-64 -40,-62", "#ffffff", 5, .9) + line("M-50,-92C-38,-98 -26,-98 -14,-96", "#ffffff", 4.5, .9) + line("M-18,-126C-10,-132 0,-132 8,-130", "#ffffff", 4, .9);
  };

  // ---------------- deli & sauces batch ----------------
  function deli(id, c0, c1, c2, rim, marble) {
    // ONE seamless square deli slice: single outline, flat top, square corners drooping over the sides.
    // Inside it only soft shading: a pale fat-edge glow along the top, faint marbling, a shine. No inner lines.
    const d = "M-140,-30C-70,-33 70,-27 140,-30C146,-30 150,-26 150,-20L152,6C152,14 146,18 138,14C114,4 64,6 0,6C-64,6 -114,4 -138,14C-146,18 -152,14 -152,6L-150,-20C-150,-26 -146,-30 -140,-30Z";
    const r = rng(id.length * 31); let mb = "";
    for (let m = 0; m < 6; m++) { const x = -112 + m * 45 + (r() - 0.5) * 12, y = -12 + (r() - 0.5) * 10; mb += p(blob(x, y, 20 + r() * 10, 3 + r() * 1.5, 8, 0.5, 2000 + id.length * 10 + m, (r() - 0.5) * 0.2), marble, .55); }
    return lg(id + "g", [[0, c0], [.65, c1], [1, c2]]) + O2(d, `url(#${id}g)`) +
      `<clipPath id="${id}c"><path d="${d}"/></clipPath><g clip-path="url(#${id}c)">` +
      p("M-160,-40L160,-40L160,-21C70,-18 -70,-24 -160,-21Z", rim, .75) + mb + "</g>" +
      p(E(-84, -24, 34, 3.5), "#fff", .6) + p(E(40, -25, 18, 2.5), "#fff", .45);
  }
  A.turkey = () => deli("tk", "#f8e6cc", "#e6c69c", "#d2a878", "#fff6e6", "#fffaf0");
  A.ham = () => deli("hm", "#ffa9b8", "#f07f93", "#dc6479", "#ffe0e5", "#ffc9d3");
  A.fish_fillet = () => {
    const d = pill(0, -28, 136, 30, 60, 0.09, 141, 6);
    const r = rng(142); let crumbs = ""; for (let i = 0; i < 44; i++) crumbs += p(blob(f1((r() - 0.5) * 250), f1(-28 + (r() - 0.5) * 46), 3 + r() * 6, 2.5 + r() * 4, 6, 0.5, 1420 + i), r() < 0.55 ? "#ffe2a0" : "#b8641c", .8);
    return lg("fsg", [[0, "#ffcb6a"], [.6, "#f0a443"], [1, "#cf7a24"]]) + O2(d, "url(#fsg)") + `<clipPath id="fsc"><path d="${d}"/></clipPath><g clip-path="url(#fsc)">${crumbs}</g>` + p(E(-60, -48, 26, 5), "#fff", .35);
  };
  A.veggie_patty = () => {
    const d = pill(0, -28, 132, 30, 48, 0.07, 151, 3);
    const r = rng(152); let bits = ""; for (let i = 0; i < 28; i++) { const x = f1((r() - 0.5) * 230), y = f1(-28 + (r() - 0.5) * 40), c = ["#9bd04a", "#f39a2c", "#e9d77a", "#5f8a2a"][i % 4]; bits += `<circle cx="${x}" cy="${y}" r="${f1(3 + r() * 3.5)}" fill="${c}" stroke="#3f5a1a" stroke-width="1.6"/>`; }
    return lg("vpg", [[0, "#9cae54"], [.5, "#7d9440"], [1, "#5c7030"]]) + O2(d, "url(#vpg)") + `<clipPath id="vpc"><path d="${d}"/></clipPath><g clip-path="url(#vpc)">${bits}</g>` + p(E(-56, -48, 24, 5), "#fff", .3);
  };
  A.avocado = () => {
    // fanned crescent slices: dark skin edge along the bottom, pale yellow-green flesh
    let s = lg("avg", [[0, "#eef7a4"], [.6, "#c4e070"], [1, "#94c24a"]]);
    [-90, -30, 30, 90].forEach((x, i) => { const a = -8 + i * 5; s += `<g transform="translate(${x},0) scale(1.4) translate(${-x},0)">`;
      const d = `M${x - 30},-30C${x - 34},-6 ${x + 34},-6 ${x + 30},-30C${x + 16},-24 ${x - 16},-24 ${x - 30},-30Z`;
      s += `<g transform="rotate(${a} ${x} -18)">` + O2(`M${x - 33},-30C${x - 38},2 ${x + 38},2 ${x + 33},-30C${x + 16},-22 ${x - 16},-22 ${x - 33},-30Z`, "#3f6a1c") + p(d, "url(#avg)") + line(`M${x - 18},-24C${x - 6},-20 ${x + 6},-20 ${x + 18},-24`, "#fbffd8", 3.5, .8) + "</g></g>"; });
    return s;
  };
  A.jalapeno_slices = () => {
    let s = "";
    [-100, -50, 0, 50, 100].forEach((x, i) => { const y = -14 + (i % 2 ? -4 : 2);
      s += O2(E(x, y, 26, 13), "#3f9a2c") + p(E(x, y - 1, 19, 9), "#cfe8a0") + p(E(x, y - 1, 10, 5), "#f4f9d8") + `<g fill="#fffbe0" stroke="#b8c870" stroke-width="1">${[0, 1, 2, 3].map(k => `<ellipse cx="${f1(x + Math.cos(k * 1.57 + .4) * 7)}" cy="${f1(y - 1 + Math.sin(k * 1.57 + .4) * 3.4)}" rx="2.6" ry="1.6"/>`).join("")}</g>` + p(E(x - 12, y - 7, 6, 2), "#fff", .6); });
    return s;
  };
  A.tortilla = () => {
    let d = "M-146,-12C-150,-24 -136,-28 -120,-26"; for (let i = 0; i < 6; i++) d += `Q${f1(-96 + i * 44)},${i % 2 ? -32 : -20} ${f1(-76 + i * 44)},-26`;
    d += "C140,-28 152,-22 146,-10C150,4 136,6 120,4L-120,4C-136,6 -150,4 -146,-12Z";
    const r = rng(161); let spots = ""; for (let i = 0; i < 14; i++) spots += p(blob(f1((r() - 0.5) * 260), f1(-12 + (r() - 0.5) * 14), 5 + r() * 6, 2 + r() * 2, 6, 0.5, 1610 + i), "#b88440", .65);
    return lg("ttg", [[0, "#fbe6b0"], [1, "#e2bf78"]]) + O2(d, "url(#ttg)") + `<clipPath id="ttc"><path d="${d}"/></clipPath><g clip-path="url(#ttc)">${spots}</g>`;
  };
  // sauces: a glossy squiggle band with a few drops hanging over the layer below
  function sauce(id, c1, c2, gloss) {
    // a thick glossy zig-zag squeezed across the layer, with round teardrop drops hanging over the edge
    let d = "M-132,-14"; for (let i = 1; i <= 7; i++) d += `Q${f1(-132 + (i - 0.5) * 264 / 7)},${i % 2 ? -34 : 6} ${f1(-132 + i * 264 / 7)},-14`;
    const drop = x => `M${x - 8},-10C${x - 8},2 ${x - 12},10 ${x - 12},16C${x - 12},26 ${x + 12},26 ${x + 12},16C${x + 12},10 ${x + 8},2 ${x + 8},-10Z`;
    const drops = [-76, 4, 80];
    return drops.map(x => O2(drop(x), c1)).join("") + line(d, OUT, 24) + drops.map(x => p(drop(x), c1)).join("") + line(d, c1, 17) + line(d, c2, 8, .8) +
      line(d.replace(/,-14/g, ",-17").replace(/,-34/g, ",-36").replace(/,6 /g, ",3 "), gloss, 3, .9) + drops.map(x => p(E(x - 4, 14, 3, 4), "#fff", .7)).join("");
  }
  A.ketchup = () => sauce("kc", "#d8231d", "#f0503c", "#ffb0a0");
  A.mayo = () => sauce("my", "#fbf1d2", "#fffaec", "#ffffff");
  A.mustard = () => sauce("ms", "#f2c014", "#ffd84a", "#fff4b0");
  A.hot_sauce = () => sauce("hs", "#e0461b", "#ff6a36", "#ffc0a0");
  // ---------------- loaded potato set (matches the loaded potato reference video) ----------------
  // Drawn in the potato page's 960-space and scaled to game size (front edge at y = 0).
  A.baked_potato = () => {
    const yTop = x => 196 - 40 * Math.sin(Math.PI * (x - 260) / 480);
    let back = "M196,300C188,236 244,200 292,192";
    for (let i = 1; i <= 10; i++) { const x0 = 292 + (i - 1) * 42, x1 = 292 + i * 42; back += `Q${f1((x0 + x1) / 2)},${f1(Math.min(yTop(x0), yTop(x1)) - 16)} ${f1(x1)},${f1(yTop(x1))}`; }
    back += "C760,196 806,236 800,298Z";
    const flesh = "M214,286C228,228 330,208 490,208C650,208 762,228 782,276C700,304 300,308 214,286Z";
    const front = "M206,272C252,292 298,300 330,302L343,320L357,305C424,318 522,322 602,310C682,298 742,282 794,264C822,272 832,302 830,334C828,404 722,448 490,450C258,452 162,412 160,342C159,310 178,282 206,272Z";
    const lip = "M206,272C252,292 298,300 330,302L343,320L357,305C424,318 522,322 602,310C682,298 742,282 794,264";
    const N = 12, pts = []; for (let i = 0; i <= N; i++) { const x = 222 + i * 552 / N; pts.push([x, yTop(x) + 30 + Math.pow(Math.abs(x - 498) / 276, 3) * 46]); }
    let fTop = `M${f1(pts[0][0])},${f1(pts[0][1])}`; for (let i = 1; i <= N; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; fTop += `C${f1(x0 + 2)},${f1(y0 - 20)} ${f1(x1 - 2)},${f1(y1 - 20)} ${f1(x1)},${f1(y1)}`; }
    let fRim = fTop; for (let i = N; i >= 0; i--) fRim += `L${f1(pts[i][0])},${f1(pts[i][1] + 22)}`; fRim += "Z";
    let hl = ""; for (let i = 0; i < N; i++) { const xm = (pts[i][0] + pts[i + 1][0]) / 2, ym = (pts[i][1] + pts[i + 1][1]) / 2 - 8; hl += `M${f1(xm - 12)},${f1(ym + 2)}C${f1(xm - 6)},${f1(ym - 6)} ${f1(xm + 6)},${f1(ym - 6)} ${f1(xm + 12)},${f1(ym + 2)}`; }
    const r = rng(7); let sp = ""; for (let i = 0; i < 18; i++) { const x = 200 + r() * 600, y = 340 + r() * 90 - Math.abs(x - 490) * 0.08; sp += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(5 + r() * 3)}" ry="${f1(3.4 + r() * 1.6)}" transform="rotate(${f1((r() - 0.5) * 40)} ${f1(x)} ${f1(y)})" fill="#8a4620" opacity=".85"/>`; }
    const k = 0.41, sw = OW / k;
    return `<g transform="scale(${k}) translate(-490,-450)">` + lg("bpb", [[0, "#a8642e"], [1, "#8a4c22"]]) + lg("bpf", [[0, "#d08c50"], [.6, "#ca8349"], [1, "#b36f3e"]]) +
      `<path d="${back}" fill="url(#bpb)" stroke="${OUT}" stroke-width="${sw}" stroke-linejoin="round"/>` +
      `<clipPath id="bpbc"><path d="${back}"/></clipPath><g clip-path="url(#bpbc)"><path d="${back.replace(/Z$/, "")}" fill="none" stroke="#d29a5e" stroke-width="20" transform="translate(0,12)"/>` +
      `<path d="${flesh}" fill="#fff1cf"/><path d="${fRim}" fill="#fff5dc"/><path d="${fTop}" fill="none" stroke="#dcbb88" stroke-width="5" stroke-linecap="round"/><path d="${hl}" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/></g>` +
      `<path d="${front}" fill="url(#bpf)" stroke="${OUT}" stroke-width="${sw}" stroke-linejoin="round"/>` +
      `<clipPath id="bpfc"><path d="${front}"/></clipPath><g clip-path="url(#bpfc)"><path d="M150,400C300,438 680,438 840,396L840,470L150,470Z" fill="#8f5024" opacity=".3"/>${sp}` +
      `<path d="${lip}" fill="none" stroke="#e2ad74" stroke-width="12" transform="translate(0,9)" opacity=".7"/><path d="M240,330C290,342 336,346 380,346" fill="none" stroke="#e0a870" stroke-width="12" stroke-linecap="round" opacity=".55"/></g>` +
      `<path d="${lip}" fill="none" stroke="${OUT}" stroke-width="${sw}" stroke-linejoin="round"/></g>`;
  };
  // toppings: low mounds that fill the potato's opening (about +-112 wide), front edge at y = 0
  const mound = "M-112,-6C-112,-30 -60,-40 0,-40C60,-40 112,-30 112,-6C112,2 60,6 0,6C-60,6 -112,2 -112,-6Z";
  const scatter = (seed, n, fn) => { const r = rng(seed); let s = ""; for (let i = 0; i < n; i++) { const u = r() * 2 - 1, v = r() * 2 - 1; if (u * u + v * v > 1) { i--; continue; } s += fn(u * 104, -18 + v * 16, r); } return s; };
  A.butter = () => lg("btg", [[0, "#fff1a0"], [1, "#f5d45a"]]) + O2("M-104,-8C-104,-28 -50,-34 0,-34C50,-34 104,-28 104,-8C104,0 50,4 0,4C-50,4 -104,0 -104,-8Z", "url(#btg)") +
    line("M-60,-24C-20,-30 30,-30 64,-24", "#fff9d0", 5, .9) + O2("M-18,-30L18,-30Q22,-30 22,-26L22,-14Q22,-10 18,-10L-18,-10Q-22,-10 -22,-14L-22,-26Q-22,-30 -18,-30Z", "#ffd84a") + p("M-14,-26L2,-26L2,-22L-14,-22Z", "#fff3a8");
  A.shredded_cheddar = () => p(mound, "#f7c656", .35) + scatter(51, 46, (x, y, r) => { const L = 16 + r() * 10, a = (r() - 0.5) * 140, d = `M${f1(-L / 2)},0q${f1(L / 2)},-4 ${f1(L)},0`;
    return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(a)})"><path d="${d}" fill="none" stroke="${OUT}" stroke-width="6.5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${r() < .5 ? "#f2b236" : "#f7c656"}" stroke-width="3.6" stroke-linecap="round"/></g>`; });
  A.sour_cream = () => {
    let d = "M-114,-10C-114,-26 -60,-34 0,-34C60,-34 114,-26 114,-10"; const drips = [[96, 12], [64, 20], [30, 14], [-6, 24], [-42, 14], [-78, 20], [-104, 10]]; let x0 = 114;
    drips.forEach(([x, h]) => { d += `C${x0},${-2} ${x + 10},${h} ${x},${h}C${x - 8},${h} ${x - 10},${-2} ${x - 14},-2`; x0 = x - 14; }); d += "C-112,-2 -114,-4 -114,-10Z";
    return O2(d, "#fffdf6") + line("M-70,-24C-30,-29 30,-29 70,-24", "#ffffff", 6, .95) + line("M-90,-10C-40,-6 40,-6 90,-10", "#ece3d2", 4, .8);
  };
  A.bacon_bits = () => scatter(62, 44, (x, y, r) => `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1((r() - 0.5) * 60)})"><ellipse rx="${f1(5.5 + r() * 2.5)}" ry="${f1(4 + r() * 1.5)}" fill="${r() < .5 ? "#9a2c1c" : "#b23a26"}" stroke="${OUT}" stroke-width="2"/><ellipse cx="-2.5" cy="-2" rx="3" ry="1.5" fill="#d9705a" opacity=".85"/></g>`);
  A.chives = () => scatter(73, 34, (x, y, r) => { const L = 13 + r() * 9; return `<path d="M${f1(x - L / 2)},${f1(y)}L${f1(x + L / 2)},${f1(y + (r() - 0.5) * 8)}" stroke="${r() < .5 ? "#3f9d2e" : "#5cbc40"}" stroke-width="3.4" stroke-linecap="round"/>`; });

  // ---------------- bacon ----------------
  A.bacon = () => {
    const top = [], bot = []; for (let i = 0; i <= 18; i++) { const x = -146 + i * 292 / 18, y = -18 + Math.sin(i * 0.9) * 10; top.push([x, y - 15]); bot.push([x, y + 15]); }
    const d = "M" + top.map(q => q.map(f1).join(",")).join("L") + "L" + bot.slice().reverse().map(q => q.map(f1).join(",")).join("L") + "Z";
    const mid = n => "M" + top.map(q => [q[0], q[1] + 15 + n].map(f1).join(",")).join("L");
    return O2(d, "#cf3a25") + `<clipPath id="bcc"><path d="${d}"/></clipPath><g clip-path="url(#bcc)">` + line(mid(-6), "#f59a78", 6) + line(mid(4), "#f7b394", 4) + line(mid(10), "#93200f", 5, .7) + line(mid(-11), "#e8604a", 3, .8) + "</g>";
  };

  const ids = Object.keys(A), svg = {}, img = {};
  // Volume pass applied to every ingredient: a soft highlight just inside the top edge and a soft shade along the
  // bottom, both kept inside the outline (eroded mask) so outlines stay crisp.
  const VOL = `<filter id="vol" filterUnits="userSpaceOnUse" x="-180" y="-230" width="360" height="280" color-interpolation-filters="sRGB">
    <feMorphology in="SourceAlpha" operator="erode" radius="3.5" result="in"/>
    <feOffset in="in" dy="-11" result="up"/><feComposite in="in" in2="up" operator="out" result="bot"/><feGaussianBlur in="bot" stdDeviation="0.8" result="botb"/><feComposite in="botb" in2="in" operator="in" result="botm"/>
    <feFlood flood-color="#5a2a10" flood-opacity=".17"/><feComposite in2="botm" operator="in" result="sh"/>
    <feMerge result="m"><feMergeNode in="SourceGraphic"/><feMergeNode in="sh"/></feMerge><feColorMatrix in="m" type="saturate" values=".8"/></filter>`;
  ids.forEach(id => { svg[id] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-180 -230 360 280" width="360" height="280"><defs>${VOL}</defs><g filter="url(#vol)">${A[id]()}</g></svg>`; });
  const ready = Promise.all(ids.map(id => new Promise(res => { const im = new Image(); im.onload = () => { img[id] = im; res(); }; im.onerror = () => res(); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg[id]); })));
  return { svg, img, ready, has: id => !!img[id], box: { x: -180, y: -230, w: 360, h: 280 } };
})();
