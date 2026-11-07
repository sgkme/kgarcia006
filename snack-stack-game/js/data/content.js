// Snack Stack — content: ingredients, recipes, order pools, substitution groups, modifiers.
// v2.0: built from the dish kit (SS.DISH, js/data/dishdata.js): 117 dishes in 12 food groups, one group per chapter.
// Sizes are 1080x1920 design pixels; kit sprite units are scaled by SS.DATA.KIT_SCALE.
window.SS = window.SS || {};
SS.DATA = SS.DATA || {};

(function () {
  const K = SS.DATA.KIT_SCALE = 0.62;
  const ING = SS.DISH.ing, DISHES = SS.DISH.dishes;
  // Chapter order: one food group per chapter, easiest mechanics first.
  const GROUPS = SS.DATA.GROUP_ORDER = ["Burgers", "Classic breakfast", "Hot dogs & deli", "Sandwiches", "Shakes & smoothies", "Pizza & sides",
    "Refreshments", "Tex-Mex & potatoes", "Fried favorites", "Specialty breakfast", "Salads & desserts", "Ice cream sandwiches"];
  const slug = g => g.toLowerCase().replace(/&/g, "and").replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "");
  SS.DATA.categories = GROUPS.map((g, i) => ({ id: slug(g), name: g, chapter: i + 1 }));
  const HOT = { burgers: 1, classic_breakfast: 1, hot_dogs_and_deli: 1, pizza_and_sides: 1, tex_mex_and_potatoes: 1, fried_favorites: 1, specialty_breakfast: 1, sandwiches: 1 };
  const COLD_DISHES = /parfait|fruit|salad|coleslaw|smoothie|milkshake|shake|sundae|split|cone|lemonade|soda|tea|float|coffee|latte/;

  // Game physics by landing kind: [balance_weight, slip_risk, precision_multiplier, snap]
  // snap = the catch is graded but the layer settles centred (liquids, sauces, loose bits do not sit off-centre).
  const PHYS = {
    solid: [1.0, 1.0, 1.0, 0], top: [1.0, 0.9, 1.15, 0], soft: [0.8, 1.0, 1.0, 0], sheet: [0.55, 1.05, 1.0, 0], melt: [0.55, 1.05, 1.0, 0],
    press: [1.0, 0.9, 1.1, 0], dollop: [0.5, 1.1, 1.0, 0], pipe: [0.5, 1.1, 1.0, 0], stage: [0.8, 1.0, 1.0, 0],
    pieces: [0.7, 1.1, 1.0, 1], scatter: [0.35, 1.1, 0.95, 1], sprinkle: [0.3, 1.1, 0.95, 1], squeeze: [0.35, 1.15, 0.95, 1], sauce: [0.35, 1.15, 0.95, 1],
    pour: [0.35, 1.15, 0.95, 1], coat: [0.35, 1.15, 0.95, 1], fill: [0.5, 0.6, 0.9, 1], float: [0.4, 0.8, 1.0, 1], straw: [0.1, 0.5, 0.9, 1], close: [1.0, 0.8, 1.0, 1], finish: [0, 0, 1, 1]
  };
  const CAT = c => ({ bread: "bread", protein: "protein", cheese: "cheese", vegetable: "vegetable", sauce: "sauce", topping: "topping", dessert: "dessert", drink: "drink" })[c] || "topping";

  // recipes first (ingredient intro chapter = first chapter that uses it)
  const firstCh = {};
  const recipes = DISHES.map(d => {
    const ch = GROUPS.indexOf(d.group) + 1, cat = slug(d.group), id = d.id.replace(/-/g, "_");
    d.seq.forEach(([iid]) => { firstCh[iid] = Math.min(firstCh[iid] || 99, ch); });
    const tags = [];
    if (HOT[cat] && !COLD_DISHES.test(d.id)) tags.push("hot_food");
    if (cat === "shakes_and_smoothies" || cat === "ice_cream_sandwiches" || /sundae|split|cone|milkshake/.test(d.id)) tags.push("frozen");
    if (ING[d.base].rim_height || /cup|glass|highball|mug/.test(d.base)) tags.push("drink");
    const special = d.seq.filter(([iid]) => { const v = ING[iid]; return v.presses || v.smoosh || v.auto || v.wrap_stages || v.seat === "refill"; }).length;
    return { id, kit_id: d.id, display_name: d.name, category: cat, group: d.group, intro_chapter: ch, base: d.base,
      ingredient_sequence: d.seq.map(s => s[0]), cols: d.seq.map(s => s[1]), finish: d.finish, hot: d.hot,
      difficulty: Math.min(5, 1 + Math.floor(d.seq.length / 3) + (special ? 1 : 0)), tags, allowed_modifiers: [] };
  });

  const ingredients = [];
  Object.keys(ING).forEach(id => {
    const v = ING[id]; if (v.cat === "falling" || v.kind === "base" || !firstCh[id]) return;
    const ph = PHYS[v.kind] || PHYS.solid, tags = [];
    if (v.kind === "top" || (v.kind === "solid" && v.cat === "bread")) tags.push("structural");
    if (v.kind === "soft" || v.kind === "dollop" || v.kind === "pipe") tags.push("delicate");
    if (/jalape|hot_sauce|buffalo|sriracha|chili/.test(id)) tags.push("spicy");
    ingredients.push({ id, display_name: v.name, category: CAT(v.cat), kind: v.kind, kit: v,
      w: Math.max(60, v.w * K), h: Math.max(0, v.stack * K), balance_weight: ph[0], slip_risk: ph[1], precision_multiplier: ph[2], snap: !!ph[3],
      auto: !!v.auto, intro_chapter: firstCh[id], art: { kind: v.kind }, tags });
  });
  SS.DATA.ingredients = ingredients;
  SS.DATA.ingredient_by_id = {}; ingredients.forEach(i => SS.DATA.ingredient_by_id[i.id] = i);

  // Substitution groups: same food type and same landing kind, simple layers only (no containers, presses or wraps).
  const simple = id => { const v = ING[id]; return v && !v.seat && !v.presses && !v.smoosh && !v.on_scoop && !v.auto && !v.replaces && !v.mix_into && !v.wrap_stages && !v.hole && !v.axis && !v.container && v.kind !== "fill" && v.kind !== "top" && v.kind !== "straw" && v.kind !== "stage" && v.kind !== "close"; };
  const groups = {};
  ingredients.forEach(i => { if (!simple(i.id) || i.category === "bread") return; const key = i.category + "_" + i.kind; (groups[key] = groups[key] || { members: [], gates: {} }).members.push(i.id); });
  Object.keys(groups).forEach(k => { if (groups[k].members.length < 2) delete groups[k]; else groups[k].members.forEach(m => { const c = SS.DATA.ingredient_by_id[m].intro_chapter; if (c > 1) groups[k].gates[m] = c; }); });
  SS.DATA.substitution_groups = groups;
  SS.DATA.simple_ingredient = simple;

  SS.DATA.recipes = recipes;
  SS.DATA.recipe_by_id = {}; recipes.forEach(r => SS.DATA.recipe_by_id[r.id] = r);
  // one pool per chapter, plus the finale gauntlet (two signature dishes from every group)
  SS.DATA.order_pools = {};
  GROUPS.forEach((g, i) => { SS.DATA.order_pools["POOL-CH" + String(i + 1).padStart(2, "0")] = recipes.filter(r => r.group === g).map(r => r.id); });
  SS.DATA.order_pools["POOL-FINALE"] = GROUPS.flatMap(g => recipes.filter(r => r.group === g).slice(0, 2).map(r => r.id));
})();

SS.DATA.modifiers = {
  "MOD-NO":      { name: "No {ing}",        short: "NO",     first_chapter: 3, weight: 1.0, color: "#e8473b" },
  "MOD-EXTRA":   { name: "Extra {ing}",     short: "EXTRA",  first_chapter: 3, weight: 1.0, color: "#2f9e44" },
  "MOD-SWAP":    { name: "{from} \u2192 {to}",   short: "SWAP",   first_chapter: 3, weight: 1.0, color: "#1c7ed6" },
  "MOD-SAUCE":   { name: "Add {ing}",       short: "SAUCE",  first_chapter: 3, weight: 0.8, color: "#f08c00" },
  "MOD-TOPPING": { name: "Add {ing}",       short: "TOPPING", first_chapter: 2, weight: 1.0, color: "#e64980" },
  "MOD-TALL":    { name: "Tall Order",      short: "TALL",   first_chapter: 4, weight: 0.7, color: "#7048e8" },
  "MOD-PERFECT": { name: "Perfect Finish",  short: "FINISH", first_chapter: 4, weight: 0.7, color: "#e6a700" },
  "MOD-RUSH":    { name: "Rush Order",      short: "RUSH",   first_chapter: 5, weight: 0.8, color: "#e8473b" },
  "MOD-DOUBLE":  { name: "Double {ing}",    short: "DOUBLE", first_chapter: 5, weight: 0.8, color: "#a0522d" },
  "MOD-CLEAN":   { name: "No Mistakes",     short: "CLEAN",  first_chapter: 6, weight: 0.6, color: "#0ca678" },
  "MOD-LIGHT":   { name: "Light: no {ing}", short: "LIGHT",  first_chapter: 6, weight: 0.6, color: "#15aabf" },
  "MOD-SLIP":    { name: "Slippery Stack",  short: "SLIPPY", first_chapter: 7, weight: 0.5, color: "#3bc9db" },
  "MOD-MYSTERY": { name: "Mystery Request", short: "???",    first_chapter: 7, weight: 0.4, color: "#862e9c", challenge_only: true }
};
SS.DATA.modifier_rules = {
  rush_seconds_per_layer: 3.4, rush_bonus_points: 200, rush_bonus_coins: 5, rush_spawn_interval_mult: 0.85,
  perfect_finish_bonus: 200, clean_bonus: 200, slip_stability_mult: 1.35, slip_bonus: 150, tall_extra_layers: 2, max_layers: 10,
  modified_order_bonus: 75
};
