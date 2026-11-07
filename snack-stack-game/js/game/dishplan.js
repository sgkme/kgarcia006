// Snack Stack — dish layout: where each catch lands and where it is caught (port of stack-builder layout()).
// Pure data, shared by the session (catch heights) and the dish scene (drawing).
// Kit coordinates: the base sprite sits at y = BASE_Y; up is negative. Design px = kit units * SS.DATA.KIT_SCALE.
window.SS = window.SS || {};

SS.DishPlan = (function () {
  const BASE_Y = 60;
  const ING = () => SS.DISH.ing;
  function layout(d) {
    const I = ING(), base = I[d.base], floor = BASE_Y - base.stack, rim = base.rim_height ? BASE_Y - base.rim_height : floor;
    const col = {}; let shared = floor; const placedPlan = [];
    let pend = 0, iceY = null, liquid = false;
    const isIce = (id, info) => info.kind === "float" && id.startsWith("ice_");
    const top = () => Math.min(shared, ...Object.values(col));
    return d.seq.map(([id, sx]) => {
      const info = I[id], x = sx || 0;
      let y;
      if (info.seat === "floor") return { id, x, y: floor, catchY: top() };
      if (isIce(id, info) && !liquid) { const r = { id, x, y: floor, catchY: top(), iceFirst: true }; placedPlan.push(r); return r; }
      if (info.kind === "fill") liquid = true;
      if (info.seat === "refill") { const prev = placedPlan.find(q => q.id === info.replaces); const y0 = prev ? prev.y : floor; const ny = y0 - info.stack; for (const k in col) delete col[k]; const c = Math.min(rim, top()); shared = ny; const r = { id, x, y: y0, catchY: c }; placedPlan.push(r); return r; }
      if (info.on_scoop) { const yy = top() - pend; pend += info.stack; const r = { id, x, y: yy, catchY: yy, iceY }; placedPlan.push(r); return r; }
      if (info.seat === "rim") y = rim;
      else if (info.kind === "close") y = floor;
      else if (sx != null) y = (x in col) ? col[x] : shared;
      else y = top();
      const ny = y - info.stack;
      let catchY = info.kind === "fill" ? Math.min(rim, top()) : y;
      if (info.smoosh) { pend = info.smoosh.scoop_h - info.stack; iceY = y; }
      let drop = 0;
      if (info.presses && pend) { catchY = y - pend; drop = pend; pend = 0; }
      if (sx != null) col[x] = ny; else { for (const k in col) delete col[k]; shared = ny; }
      const r = { id, x, y, catchY, drop }; placedPlan.push(r); return r;
    });
  }
  // dish-like object for an order: { base, seq: [[id, col]], finish, hot }
  function forOrder(o) { return { base: o.base || "plate", seq: o.seq.map((id, i) => [id, o.cols ? o.cols[i] : null]), finish: o.finish || null, hot: o.hot || null }; }
  // design-px height above the plate for a kit y
  const heightOf = y => (BASE_Y - y) * SS.DATA.KIT_SCALE;
  return { BASE_Y, layout, forOrder, heightOf };
})();
