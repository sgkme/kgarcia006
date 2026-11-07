// Snack Stack \u2014 gameplay renderer (canvas, 1080x1920 design space).
// Draw order: kitchen -> plate/stack -> guides -> falling objects -> debris -> events -> fx -> debug.
window.SS = window.SS || {};

SS.Renderer = class {
  constructor(canvas, fxCanvas) { this.c = canvas; this.ctx = canvas.getContext("2d"); this.fx = fxCanvas ? fxCanvas.getContext("2d") : this.ctx; this.t = 0; }
  draw(s, dt) {
    const ctx = this.ctx, A = SS.Art, B = SS.DATA.balance;
    this.t += dt;
    const rm = SS.Save.d.settings.reduced_motion;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    let shakeX = 0, shakeY = 0;
    const sh = s.events.shake;
    if (sh && !rm) { const amp = sh.phase === "active" ? 12 * (1 - sh.t / sh.dur) : 2.5; shakeX = Math.sin(this.t * 60) * amp; shakeY = Math.cos(this.t * 47) * amp * 0.5; }
    ctx.translate(shakeX, shakeY);
    ctx.drawImage(A.kitchen(SS.Save.d.cosmetics.kitchen), 0, 0); SS.BG.drawDyn(ctx, SS.Save.d.cosmetics.kitchen, rm ? 0 : this.t);

    // ---- plate & stack ----
    const p = s.plate, ps = A.plate(SS.Save.d.cosmetics.plate);
    if (s.events.slippery && s.events.slippery.phase === "active") { ctx.save(); ctx.globalAlpha = 0.5 + 0.2 * Math.sin(this.t * 8); ctx.fillStyle = "#74c0fc"; ctx.beginPath(); ctx.ellipse(p.x, p.y + 30, 210, 22, 0, 0, 7); ctx.fill(); ctx.restore(); }
    const st = s.stack, S = B.stability;
    let amp = 0;
    if (st.stability < S.critical_threshold) amp = 4.5; else if (st.stability < S.danger_threshold) amp = 3; else if (st.stability < S.wobbly_threshold) amp = 1.5; else if (st.stability < S.uneasy_threshold) amp = 0.5;
    if (rm) amp *= 0.4;
    const lean = SS.U.clamp(st.balance / (B.plate.support_half_width * 0.6), -1, 1) * S.max_visual_lean_degrees;
    const rot = (lean + Math.sin(this.t * 5) * amp) * Math.PI / 180 * (st.layers.length ? 1 : 0);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(rot);
    if (s.nearFall) { const k = 0.5 + 0.5 * Math.sin(this.t * 10); ctx.save(); ctx.globalAlpha = 0.25 + 0.25 * k; ctx.fillStyle = "#ff3b30"; ctx.beginPath(); ctx.ellipse(st.supportCenter * 0.5, -st.height / 2, 190, st.height / 2 + 60, 0, 0, 7); ctx.fill(); ctx.restore(); }
    ctx.restore();
    // served dishes slide off in the dish layer

    // ---- guide (dashed drop line under the required item, like the mockups) ----
    const reqs = s.objects.filter(o => o.state === "falling" && o.cat === "ingredient" && o.id === s.requiredId);
    if (SS.Save.d.settings.show_guides && !s.noGuides) for (const o of reqs) {
      const supX = p.x + st.supportCenter, top = s.supportTopY;
      const ev = st.evaluate(o.def, o.x - p.x, s.precisionTol);
      const col = ev.quality === "perfect" ? "#ffd43b" : ev.quality === "good" ? "#69db7c" : "rgba(255,255,255,0.85)";
      ctx.save(); ctx.setLineDash([16, 18]); ctx.lineDashOffset = -this.t * 60; ctx.lineWidth = 7; ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(29,43,74,0.25)"; ctx.beginPath(); ctx.moveTo(o.x + 3, o.y + 40); ctx.lineTo(o.x + 3, top - 10); ctx.stroke();
      ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(o.x, o.y + 38); ctx.lineTo(o.x, top - 12); ctx.stroke(); ctx.restore();
      if (ev.quality === "perfect" || ev.quality === "good") { ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(supX, top - 4, 70, 12, 0, 0, 7); ctx.stroke(); ctx.restore(); }
    }

    // ---- falling objects ----
    for (const o of s.objects) this.drawObject(ctx, o, s);
    for (const d of s.debris) this.drawObject(ctx, d, s);

    // ---- events ----
    this.drawEvents(ctx, s);
    // ---- fx (top canvas, above the dish layer) ----
    const fxc = this.fx; if (fxc !== ctx) { fxc.setTransform(1, 0, 0, 1, 0, 0); fxc.clearRect(0, 0, 1080, 1920); fxc.translate(shakeX, shakeY); }
    { const ctx = fxc;
    for (const f of s.fx) {
      const k = f.t / f.life;
      if (f.type === "spark") { ctx.globalAlpha = 1 - k; ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1 - k * 0.5), 0, 7); ctx.fill(); ctx.globalAlpha = 1; continue; }
      const pop = k < 0.15 ? 0.6 + k / 0.15 * 0.55 : (k < 0.25 ? 1.15 - (k - 0.15) * 1.5 : 1);
      ctx.save(); ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; ctx.translate(f.x, f.y); ctx.scale(f.scale * pop, f.scale * pop);
      ctx.font = "64px 'Titan One', 'Fredoka', 'Arial Rounded MT Bold', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
      ctx.fillStyle = "rgba(15,24,48,.35)"; ctx.fillText(f.text, 0, 8);
      ctx.lineWidth = 26; ctx.strokeStyle = "#ffffff"; ctx.strokeText(f.text, 0, 0);
      ctx.lineWidth = 13; ctx.strokeStyle = SS.Art.OUT; ctx.strokeText(f.text, 0, 0);
      ctx.fillStyle = f.color; ctx.fillText(f.text, 0, 0); ctx.restore();
    }
    if (SS.Debug && SS.Debug.overlay) this.drawDebug(ctx, s);
    }
  }
  drawObject(ctx, o, s) {
    if (o.state === "dead" || o.state === "caught") return;
    const A = SS.Art;
    ctx.save(); ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0);
    if (o.scale) ctx.scale(o.scale, o.scale);
    if (o.state === "falling" && o.qd) { ctx.save(); ctx.rotate(-(o.rot || 0)); ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 6; ctx.lineCap = "round"; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 34, -40 - Math.abs(i) * 6); ctx.lineTo(i * 34, -110 - Math.abs(i) * 6); ctx.stroke(); } ctx.restore(); }
    if (o.cat === "ingredient") { ctx.restore(); return; }
    if (false) {
      const sp = A.ingredient(o.id);
      const base = o.contactHalf !== undefined ? o.contactHalf : sp.vh / 2;
      if (o.state === "falling" && o.id === s.requiredId) { ctx.save(); ctx.globalAlpha *= 0.35 + 0.15 * Math.sin(this.t * 6); ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(0, base - sp.vh / 2, o.def.w * 0.62, sp.vh / 2 + 26, 0, 0, 7); ctx.fill(); ctx.restore(); }
      if (o.tint) ctx.filter = "hue-rotate(80deg) saturate(1.4)";
      ctx.drawImage(sp.rim, -sp.ox, -sp.oy + base); ctx.drawImage(sp.canvas, -sp.ox, -sp.oy + base);
      ctx.filter = "none";
    } else {
      const ic = A.icon(o.id, 120);
      if (o.cat === "hazard" && o.state === "falling") { ctx.save(); ctx.rotate(-(o.rot || 0)); const k = 0.5 + 0.5 * Math.sin(this.t * 9); ctx.strokeStyle = "rgba(255,59,48," + (0.4 + 0.4 * k) + ")"; ctx.lineWidth = 6; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.arc(0, 0, 66 + k * 4, 0, 7); ctx.stroke(); ctx.restore(); }
      if (o.cat === "bonus" && o.state === "falling") { ctx.save(); ctx.rotate(this.t * 1.5); ctx.fillStyle = "rgba(255,236,153,0.55)"; for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -78); ctx.lineTo(10, -78); ctx.fill(); } ctx.restore(); }
      ctx.drawImage(ic, -60, -60);
    }
    ctx.restore();
  }
  drawEvents(ctx, s) {
    const w = s.events.wind;
    if (w) {
      ctx.save();
      if (w.phase === "telegraph") { const k = 0.5 + 0.5 * Math.sin(this.t * 14); ctx.globalAlpha = 0.5 + 0.5 * k; ctx.fillStyle = "#ffffff"; ctx.strokeStyle = SS.Art.OUT; ctx.lineWidth = 8; ctx.lineJoin = "round"; for (let i = 0; i < 3; i++) { const y = 620 + i * 230, x = 540 + w.dir * (-120 + i * 40); ctx.save(); ctx.translate(x, y); ctx.scale(w.dir, 1); ctx.beginPath(); ctx.moveTo(-90, -24); ctx.lineTo(30, -24); ctx.lineTo(30, -56); ctx.lineTo(100, 0); ctx.lineTo(30, 56); ctx.lineTo(30, 24); ctx.lineTo(-90, 24); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore(); } }
      else { ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 5; ctx.lineCap = "round"; for (let i = 0; i < 16; i++) { const y = 420 + ((i * 89) % 1100); const x = ((this.t * 900 * w.dir + i * 211) % 1300 + 1300) % 1300 - 110; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - w.dir * 120, y); ctx.stroke(); } }
      ctx.restore();
    }
    const st = s.events.steam;
    if (st) {
      ctx.save();
      const a = st.phase === "telegraph" ? 0.25 * (st.t / st.tel) : Math.min(1, st.t / 0.3) * Math.min(1, (st.dur - st.t) / 0.5) * 0.93;
      ctx.globalAlpha = a; ctx.fillStyle = "#f8f9fa";
      for (let i = 0; i < 14; i++) { const x = (i * 97 + this.t * 40 * (i % 2 ? 1 : -1)) % 1200 - 60; const y = st.y0 + ((i * 53) % st.h); ctx.beginPath(); ctx.arc(x, y, 110 + (i % 3) * 30, 0, 7); ctx.fill(); }
      ctx.fillRect(0, st.y0 + 60, 1080, st.h - 120);
      ctx.restore();
    }
    const mv = s.events.moving;
    if (mv && mv.phase === "telegraph") { ctx.save(); ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.t * 12); ctx.fillStyle = "#ffd43b"; ctx.strokeStyle = SS.Art.OUT; ctx.lineWidth = 6; [-1, 1].forEach(d => { ctx.save(); ctx.translate(s.plate.x + d * 230, s.plate.y - 10); ctx.scale(d, 1); ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(50, 0); ctx.lineTo(0, 30); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }); ctx.restore(); }
    const sh = s.events.shake;
    if (sh && sh.phase === "telegraph") { ctx.save(); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(this.t * 16); ctx.fillStyle = "#ff922b"; ctx.font = "56px 'Titan One', 'Fredoka', sans-serif"; ctx.textAlign = "center"; ctx.lineWidth = 12; ctx.strokeStyle = SS.Art.OUT; ctx.strokeText("RUMBLE...", 540, 1600); ctx.fillText("RUMBLE...", 540, 1600); ctx.restore(); }
  }
  drawDebug(ctx, s) {
    const B = SS.DATA.balance;
    ctx.save();
    ctx.globalAlpha = 0.18; ctx.fillStyle = "#4dabf7";
    const req = s.objects.find(o => o.state === "falling" && o.id === s.requiredId);
    if (req && req.reach !== undefined) ctx.fillRect(s.plate.x - req.reach, s.plate.y - 40, req.reach * 2, 30);
    ctx.globalAlpha = 1;
    for (const o of s.objects) if (o.state === "falling" && o.predicted) { ctx.strokeStyle = o.id === s.requiredId ? "#ff00aa" : "rgba(0,0,0,0.4)"; ctx.lineWidth = 3; ctx.beginPath(); o.predicted.pts.forEach((pt, i) => i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])); ctx.stroke(); ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(o.predicted.landX, s.supportTopY, 8, 0, 7); ctx.fill(); ctx.font = "22px monospace"; ctx.fillText(o.profile.id, o.x + 70, o.y); }
    const st = s.stack;
    ctx.strokeStyle = "#00e676"; ctx.lineWidth = 3; ctx.strokeRect(s.plate.x + st.supportCenter - st.supportHalf, s.supportTopY - 3, st.supportHalf * 2, 6);
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(20, 1700, 520, 200); ctx.fillStyle = "#fff"; ctx.font = "24px monospace";
    [`tier ${s.tier} (${s.tierDef.name})  diff ${s.diff.id}`, `stab ${st.stability.toFixed(1)} bal ${st.balance.toFixed(1)} h ${st.height}`, `objs ${s.objects.length} budget ${s.activeBudget()}`, `seed ${s.seed}  t ${s.simTime.toFixed(1)}`, `buffs ${Object.entries(s.buffs).filter(e => e[1]).map(e => e[0]).join(",") || "-"}`, `last: ${(SS.Analytics.buf.filter(e => e.event === "placement").slice(-1)[0] || { data: {} }).data.q || "-"} off ${(SS.Analytics.buf.filter(e => e.event === "placement").slice(-1)[0] || { data: {} }).data.off || "-"}`].forEach((t, i) => ctx.fillText(t, 34, 1736 + i * 28));
    ctx.restore();
  }
};
