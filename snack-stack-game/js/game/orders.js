// Snack Stack — OrderBuilder: runtime order = recipe + legal customer modifiers.
// v2.0: works on the dish kit's steps ({ id, col }) so side-by-side positions stay aligned, and only edits
// "simple" layers (never containers, liquids that fill, wraps, presses or the scoop-and-press sandwich steps).
// The final explicit sequence is produced BEFORE play so HUD, dish layout and validator share one truth.
window.SS = window.SS || {};

SS.OrderBuilder = (function () {
  const D = () => SS.DATA;
  const ing = id => SS.DATA.ingredient_by_id[id];
  const kit = id => SS.DISH.ing[id];
  const short = id => ing(id).display_name.replace(/^(Sliced|Shredded|Diced|Melted) /, m => m).replace(/ \((top|bottom)\)$/, "");
  const MAXL = 12;
  // closing steps stay last: lids, straws, top buns, wraps folding shut
  const isCloser = id => { const v = kit(id); return v.kind === "top" || v.kind === "straw" || v.kind === "close" || v.seat === "rim" || v.presses; };
  const isIceFloat = id => kit(id).kind === "float" && id.startsWith("ice_");
  function editable(o, i) {
    const s = o.steps[i]; if (!s || s.col != null || i === 0) return false;
    if (!D().simple_ingredient(s.id) || isIceFloat(s.id)) return false;
    const between = o.steps.slice(0, i).some(x => kit(x.id).smoosh) && o.steps.slice(i).some(x => kit(x.id).presses);
    return !between;
  }
  const endIndex = o => { let i = o.steps.length; while (i > 0 && isCloser(o.steps[i - 1].id)) i--; return i; };
  function groupOf(id) { for (const g in D().substitution_groups) if (D().substitution_groups[g].members.indexOf(id) >= 0) return g; return null; }
  const availableIn = (id, chapter) => ing(id) && ing(id).intro_chapter <= chapter;
  // ingredients that already appear in some dish with this container (keeps toppings and sauces believable)
  const sameBase = {};
  // Believable extras: only ingredients already used by dishes that share this dish's container, menu group and
  // flavour profile (sweet / savoury / coffee / refreshment), so pancakes never get chives and eggs never get chocolate chips.
  function profileOf(r) {
    if (r.group === "Refreshments") return "refresh";
    if (/coffee|latte|tea/.test(r.id)) return "coffee";
    if (r.group === "Shakes & smoothies" || r.group === "Ice cream sandwiches") return "sweet";
    return /pancake|waffle|french_toast|cinnamon|fruit|parfait|sundae|split|cone|smoothie|milkshake|yogurt|cake|cookie|brownie|donut|crepe/.test(r.id) ? "sweet" : "savory";
  }
  function usedWithBase(base, pred, r) {
    const key = base + "|" + (r ? r.group + "|" + profileOf(r) : ""); if (!sameBase[key]) { const set = {}; D().recipes.forEach(q => { if (q.base === base && (!r || (q.group === r.group && profileOf(q) === profileOf(r)))) q.ingredient_sequence.forEach(i => set[i] = 1); }); sameBase[key] = Object.keys(set); }
    return sameBase[key].filter(pred);
  }
  // an ingredient named in the dish's own title ("Fish Burger", "Pulled Pork", "Blueberry Pancakes") is what the customer came for
  const words = t => (t || "").toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter(w => w.length >= 4).map(w => w.slice(0, 4));
  function signature(o, id) { const dn = words(o.name); return words(kit(id).name).some(w => dn.indexOf(w) >= 0); }
  const grpOf = o => D().recipe_by_id[o.recipe_id];
  const has = (o, id) => o.steps.some(s => s.id === id);
  const kinds = { extra: { sheet: 1, melt: 1, sprinkle: 1, scatter: 1, squeeze: 1, sauce: 1, coat: 1, pour: 1, dollop: 1, pipe: 1, solid: 1, soft: 1 } };

  const FAMILIES = {
    "MOD-NO"(o, ctx) {
      if (o.steps.length < 4) return null;
      const proteins = o.steps.filter(s => ing(s.id).category === "protein").length;
      const c = o.steps.map((s, i) => i).filter(i => editable(o, i) && ing(o.steps[i].id).category !== "bread" && !(ing(o.steps[i].id).category === "protein" && proteins <= 1));
      if (!c.length) return null;
      const i = ctx.rng.pick(c), id = o.steps[i].id; o.steps.splice(i, 1);
      return { family: "MOD-NO", label: "No " + short(id), param: id };
    },
    "MOD-EXTRA"(o, ctx) {
      if (o.steps.length >= MAXL) return null;
      const c = o.steps.map((s, i) => i).filter(i => editable(o, i) && kinds.extra[kit(o.steps[i].id).kind] && ing(o.steps[i].id).category !== "protein" && ing(o.steps[i].id).category !== "bread");
      if (!c.length) return null;
      const i = ctx.rng.pick(c), id = o.steps[i].id; o.steps.splice(i + 1, 0, { id, col: null });
      return { family: "MOD-EXTRA", label: "Extra " + short(id), param: id };
    },
    "MOD-SWAP"(o, ctx) {
      if (o.steps.some(s => ing(s.id).auto)) return null;   // wraps: the fillings are sealed in, keep them as written
      const opts = [];
      o.steps.forEach((s, i) => {
        if (!editable(o, i) || signature(o, s.id)) return; const g = groupOf(s.id); if (!g) return;
        const grp = D().substitution_groups[g], a = kit(s.id);
        grp.members.forEach(m => { const b = kit(m);
          if (m === s.id || kit(m).name === kit(s.id).name || signature(o, m) || has(o, m) || !availableIn(m, ctx.chapter) || (grp.gates[m] && grp.gates[m] > ctx.chapter)) return;
          if (Math.abs(b.w - a.w) > a.w * 0.25 || Math.abs(b.stack - a.stack) > Math.max(12, a.stack * 0.4)) return;
          if (usedWithBase(o.base, x => x === m, grpOf(o)).length === 0) return;
          opts.push([i, m]); });
      });
      if (!opts.length) return null;
      const [i, to] = ctx.rng.pick(opts), from = o.steps[i].id; o.steps[i] = { id: to, col: null };
      return { family: "MOD-SWAP", label: short(to) + " not " + short(from), param: { from, to } };
    },
    "MOD-SAUCE"(o, ctx) {
      if (o.tags.indexOf("frozen") >= 0 || o.tags.indexOf("drink") >= 0 || o.steps.length >= MAXL) return null;
      const sauces = usedWithBase(o.base, m => { const v = kit(m), d = ing(m); return d && d.category === "sauce" && v.kind === "squeeze" && availableIn(m, ctx.chapter) && !has(o, m) && !o.steps.some(x => kit(x.id).name === v.name); }, grpOf(o));
      if (!sauces.length) return null;
      const s = ctx.rng.pick(sauces), ex = o.steps.findIndex((x, i) => editable(o, i) && ing(x.id).category === "sauce" && kit(x.id).kind === "squeeze");
      if (ex >= 0) { const from = o.steps[ex].id; if (kit(from).name === kit(s).name) return null; o.steps[ex] = { id: s, col: null }; return { family: "MOD-SAUCE", label: short(s) + " not " + short(from), param: s }; }
      o.steps.splice(endIndex(o), 0, { id: s, col: null });
      return { family: "MOD-SAUCE", label: "Add " + short(s), param: s };
    },
    "MOD-DOUBLE"(o, ctx) {
      if (o.steps.length >= MAXL) return null;
      const i = o.steps.findIndex((s, j) => editable(o, j) && ing(s.id).category === "protein" && (kit(s.id).kind === "solid" || kit(s.id).kind === "sheet"));
      if (i < 0) return null;
      const id = o.steps[i].id; o.steps.splice(i + 1, 0, { id, col: null });
      return { family: "MOD-DOUBLE", label: "Double " + short(id), param: id };
    },
    "MOD-LIGHT"(o, ctx) {
      if (o.steps.length < 5) return null;
      const c = o.steps.map((s, i) => i).filter(i => editable(o, i) && (ing(o.steps[i].id).category === "cheese" || ing(o.steps[i].id).category === "sauce"));
      if (!c.length) return null;
      const i = ctx.rng.pick(c), id = o.steps[i].id; o.steps.splice(i, 1);
      return { family: "MOD-LIGHT", label: "Light: no " + short(id), param: id };
    },
    "MOD-TALL"(o, ctx) {
      const add = D().modifier_rules.tall_extra_layers; if (o.steps.length + add > MAXL) return null;
      const c = o.steps.map((s, i) => i).filter(i => editable(o, i) && ing(o.steps[i].id).tags.indexOf("delicate") < 0 && kinds.extra[kit(o.steps[i].id).kind]);
      if (!c.length) return null;
      for (let k = 0; k < add; k++) { const i = ctx.rng.pick(c); o.steps.splice(i + 1, 0, { id: o.steps[i].id, col: null }); for (let j = 0; j < c.length; j++) if (c[j] > i) c[j]++; }
      return { family: "MOD-TALL", label: "Tall Order", param: add };
    },
    "MOD-TOPPING"(o, ctx) {
      if (o.steps.length >= MAXL) return null;
      const opts = usedWithBase(o.base, m => { const d = ing(m), v = kit(m); return d && d.category === "topping" && D().simple_ingredient(m) && (v.kind === "sprinkle" || v.kind === "scatter" || v.kind === "pipe" || v.kind === "coat") && availableIn(m, ctx.chapter) && !has(o, m); }, grpOf(o))
        .filter(m => o.category === "shakes_and_smoothies" || o.category === "salads_and_desserts" || o.category === "ice_cream_sandwiches" || /breakfast/.test(o.category) || o.tags.indexOf("frozen") >= 0);
      if (!opts.length) return null;
      const id = ctx.rng.pick(opts); o.steps.splice(endIndex(o), 0, { id, col: null });
      return { family: "MOD-TOPPING", label: "Add " + short(id), param: id };
    },
    "MOD-RUSH"(o) { o.flags.rush = true; return { family: "MOD-RUSH", label: "Rush Order" }; },
    "MOD-PERFECT"(o) { o.flags.perfectFinish = true; return { family: "MOD-PERFECT", label: "Perfect Finish" }; },
    "MOD-CLEAN"(o) { o.flags.clean = true; return { family: "MOD-CLEAN", label: "No Mistakes" }; },
    "MOD-SLIP"(o) { o.flags.slip = true; return { family: "MOD-SLIP", label: "Slippery Stack" }; },
    "MOD-MYSTERY"(o) { if (o.steps.length < 4) return null; o.flags.mystery = true; return { family: "MOD-MYSTERY", label: "Mystery Request" }; }
  };
  const SEQ_CHANGING = ["MOD-NO", "MOD-EXTRA", "MOD-SWAP", "MOD-SAUCE", "MOD-DOUBLE", "MOD-LIGHT", "MOD-TALL", "MOD-TOPPING"];

  // ctx: { rng, chapter, modifierChance, forceModifier, allowChallengeOnly, maxModifiers }
  function build(recipeId, ctx) {
    const recipe = SS.DATA.recipe_by_id[recipeId];
    const o = { recipe, recipe_id: recipeId, name: recipe.display_name, category: recipe.category, tags: recipe.tags.slice(), base: recipe.base,
      steps: recipe.ingredient_sequence.map((id, i) => ({ id, col: recipe.cols[i] })), base_seq: recipe.ingredient_sequence.slice(), modifiers: [], flags: {}, hot: recipe.hot };
    const ch = ctx.chapter || 1;
    const fam = recipe.allowed_modifiers.filter(f => { const m = SS.DATA.modifiers[f]; return m && m.first_chapter <= ch && (!m.challenge_only || ctx.allowChallengeOnly); });
    const wanted = [];
    if (ctx.forceModifier) wanted.push(ctx.forceModifier);
    if (ctx.rng.chance(ctx.modifierChance || 0) && fam.length) {
      const maxN = ctx.maxModifiers || (ch >= 3 && ctx.rng.chance(ch >= 6 ? 0.45 : 0.25) ? 2 : 1);
      for (const f of ctx.rng.shuffle(fam)) { if (wanted.length >= maxN + (ctx.forceModifier ? 1 : 0)) break; if (wanted.indexOf(f) < 0) wanted.push(f); }
    }
    const used = {};
    for (const f of wanted) {
      if (used[f] || !FAMILIES[f]) continue;
      if (SEQ_CHANGING.indexOf(f) >= 0 && o.modifiers.filter(m => SEQ_CHANGING.indexOf(m.family) >= 0).length >= (ch >= 3 ? 2 : 1)) continue;
      const rec = FAMILIES[f](o, ctx);
      if (rec) { o.modifiers.push(rec); used[f] = true; }
    }
    o.seq = o.steps.map(s => s.id); o.cols = o.steps.map(s => s.col);
    // a finishing animation (e.g. cheese oozing out) only when its anchor layer is still where the recipe put it
    const f = recipe.finish;
    o.finish = f && o.seq[f.anchor_step] === recipe.ingredient_sequence[f.anchor_step] && o.seq.length === recipe.ingredient_sequence.length ? f : null;
    if (o.flags.rush) o.rush_limit = Math.round(o.seq.filter(id => !ing(id).auto).length * SS.DATA.modifier_rules.rush_seconds_per_layer + 4);
    return o;
  }

  // Which families each recipe may roll (each family still checks legality against the actual steps).
  function assignModifiers() {
    D().recipes.forEach(r => {
      const fam = ["MOD-NO", "MOD-EXTRA", "MOD-SWAP", "MOD-LIGHT", "MOD-RUSH", "MOD-PERFECT", "MOD-CLEAN", "MOD-SLIP", "MOD-TALL"];
      if (r.ingredient_sequence.some(id => ing(id).category === "protein")) fam.push("MOD-DOUBLE");
      if (r.tags.indexOf("frozen") < 0 && r.tags.indexOf("drink") < 0) fam.push("MOD-SAUCE");
      if (r.tags.indexOf("frozen") >= 0 || /breakfast|desserts|smoothies/.test(r.category)) fam.push("MOD-TOPPING");
      if (r.ingredient_sequence.length >= 4) fam.push("MOD-MYSTERY");
      r.allowed_modifiers = fam;
    });
  }

  // Ingredient eligibility for decoys: everything in the given recipes that the player has met, never auto steps.
  function eligibleIngredients(recipeIds, chapter) {
    const set = {};
    recipeIds.forEach(r => { const rec = SS.DATA.recipe_by_id[r]; if (rec) rec.ingredient_sequence.forEach(i => set[i] = 1); });
    return Object.keys(set).filter(i => { const d = SS.DATA.ingredient_by_id[i]; return d && !d.auto && d.intro_chapter <= Math.max(chapter, 1); });
  }

  return { build, eligibleIngredients, short, assignModifiers };
})();
SS.OrderBuilder.assignModifiers();

// Special Orders need the builder to check which twists fit which menus.
if (SS.DATA.buildSpecials) SS.DATA.buildSpecials();
