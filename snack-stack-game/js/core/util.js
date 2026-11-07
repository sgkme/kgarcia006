// Snack Stack \u2014 shared utilities: seeded RNG, math helpers, event bus, analytics ring buffer.
window.SS = window.SS || {};

SS.U = {
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp: (a, b, t) => a + (b - a) * t,
  sign: v => (v < 0 ? -1 : 1),
  fmt: n => Math.round(n).toLocaleString("en-US"),
  fmtTime: s => { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); },
  todayKey: (d) => { d = d || new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); },
  weekKey: (d) => { d = d || new Date(); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + "-W" + Math.ceil(((t - y0) / 86400000 + 1) / 7); },
  hashStr: s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; },
  esc: s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]))
};

// Deterministic RNG (mulberry32). Every gameplay random draw goes through a seeded instance
// so runs are reproducible for QA (Godot: RandomNumberGenerator with fixed seed).
SS.RNG = class {
  constructor(seed) { this.s = (seed >>> 0) || 1; }
  next() { let t = (this.s += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  range(a, b) { return a + (b - a) * this.next(); }
  int(a, b) { return Math.floor(this.range(a, b + 1)); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  weighted(items, wfn) { let tot = 0; for (const it of items) tot += Math.max(0, wfn(it)); if (tot <= 0) return items[0]; let r = this.next() * tot; for (const it of items) { r -= Math.max(0, wfn(it)); if (r <= 0) return it; } return items[items.length - 1]; }
  shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
};

// Minimal event emitter (Godot: signals).
SS.Emitter = class {
  constructor() { this._h = {}; }
  on(ev, fn) { (this._h[ev] = this._h[ev] || []).push(fn); return () => this.off(ev, fn); }
  off(ev, fn) { const l = this._h[ev]; if (l) this._h[ev] = l.filter(f => f !== fn); }
  emit(ev, data) { const l = this._h[ev]; if (l) l.slice().forEach(f => { try { f(data); } catch (e) { console.error("[event " + ev + "]", e); } }); }
};

// Analytics hook (07_BALANCE_QA_ANALYTICS/ANALYTICS_EVENT_PLAN.md). Ring buffer, visible in debug panel.
SS.Analytics = {
  buf: [],
  log(event, data) { this.buf.push({ t: Date.now(), event, data: data || {} }); if (this.buf.length > 200) this.buf.shift(); if (SS.Debug && SS.Debug.verbose) console.log("[analytics]", event, data); }
};
