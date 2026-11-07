// Snack Stack \u2014 meta systems data: cosmetics, levels, daily rewards, daily/weekly templates, achievements.
// Sources: Economy Bible (06) \u00a75\u2013\u00a77, Missions Bible (05) \u00a76\u2013\u00a79, Shop Bible (07).
window.SS = window.SS || {};
SS.DATA = SS.DATA || {};

// Plates. price_coins / price_tickets; grant_only = earned via campaign (never purchasable for real money).
SS.DATA.plates = [
  { id: "plate_default", display_name: "Classic Plate", rim: "#1c7ed6", face: "#ffffff", inner: "#e7eef7", price_coins: 0, owned_default: true, description: "The original white serving plate." },
  { id: "plate_blue", display_name: "Blue Plate", rim: "#1864ab", face: "#74c0fc", inner: "#a5d8ff", grant_only: "chapter_02", description: "Earned by finishing Breakfast Breakout." },
  { id: "plate_red", display_name: "Red Plate", rim: "#a61e1e", face: "#ff6b6b", inner: "#ffa8a8", grant_only: "chapter_05", description: "Earned by finishing Soda Fountain." },
  { id: "plate_gold", display_name: "Gold Plate", rim: "#b8860b", face: "#ffd43b", inner: "#ffec99", grant_only: "chapter_12", description: "For Stack Masters only: win the Golden Spatula." },
  { id: "plate_mint", display_name: "Mint Plate", rim: "#087f5b", face: "#96f2d7", inner: "#c3fae8", price_coins: 900, description: "Cool and fresh." },
  { id: "plate_sunny", display_name: "Sunny Plate", rim: "#e67700", face: "#ffe066", inner: "#fff3bf", price_coins: 1100, description: "A little sunshine under every stack." },
  { id: "plate_polka", display_name: "Polka Plate", rim: "#c2255c", face: "#fff0f6", inner: "#ffdeeb", pattern: "dots", price_coins: 1300, description: "Dots, dots, dots." },
  { id: "plate_checker", display_name: "Diner Checker", rim: "#212529", face: "#ffffff", inner: "#f1f3f5", pattern: "checker", price_coins: 1500, description: "Straight out of a 50s diner." },
  { id: "plate_wood", display_name: "Wood Board", rim: "#7c4a1e", face: "#c98b4f", inner: "#dba673", pattern: "grain", price_coins: 2200, description: "Rustic serving board." },
  { id: "plate_slate", display_name: "Slate Board", rim: "#212529", face: "#495057", inner: "#5c636a", price_coins: 2800, description: "Fancy restaurant energy." },
  { id: "plate_rainbow", display_name: "Rainbow Plate", rim: "#7048e8", face: "#ffffff", inner: "#f3f0ff", pattern: "rainbow", price_tickets: 25, description: "Premium. Every color at once." },
  { id: "plate_neon", display_name: "Neon Plate", rim: "#f700ff", face: "#1a1033", inner: "#2b1a55", pattern: "neon", price_tickets: 30, description: "Premium. Glows in the night kitchen." }
];

// Kitchen IDs remain stable so existing saves and chapter rewards stay valid.
// The reference registry supplies the scene artwork; palettes are fallbacks.
SS.DATA.kitchens = [
  { id: "kitchen_default", display_name: "Default Kitchen", owned_default: true, price_coins: 0, pal: { sky: "#7fd3ff", sky2: "#b9e8ff", wall: "#f2ede4", tile: "#ffffff", tileLine: "#d9dee5", cab: "#3a9bea", cabDark: "#2a7fc9", counter: "#ef9a4f", counterDark: "#c9713a", shelf: "#f2b366", frame: "#2f8de4", accent: "#ffd43b", night: false }, description: "The classic Snack Stack kitchen." },
  { id: "kitchen_modern", display_name: "Modern Kitchen", grant_only: "chapter_03", pal: { sky: "#cfe8ff", sky2: "#eef6ff", wall: "#f8f9fa", tile: "#e9ecef", tileLine: "#ced4da", cab: "#495057", cabDark: "#343a40", counter: "#dee2e6", counterDark: "#adb5bd", shelf: "#adb5bd", frame: "#343a40", accent: "#20c997", night: false }, description: "A bright, polished modern kitchen." },
  { id: "kitchen_cozy_cafe", display_name: "Cozy Cafe", grant_only: "chapter_04", pal: { sky: "#ffd8a8", sky2: "#fff0d9", wall: "#f3d9b1", tile: "#fbe8cc", tileLine: "#e2c290", cab: "#8d5a3b", cabDark: "#6e4229", counter: "#a9714b", counterDark: "#7f4f30", shelf: "#c08457", frame: "#6e4229", accent: "#f783ac", night: false }, description: "A warm cafe-style kitchen." },
  { id: "kitchen_night", display_name: "Night Kitchen", grant_only: "chapter_06", pal: { sky: "#1b1f4b", sky2: "#30366f", wall: "#3b3f6b", tile: "#4a4f80", tileLine: "#363a66", cab: "#5f3dc4", cabDark: "#45289e", counter: "#845ef7", counterDark: "#6741d9", shelf: "#9775fa", frame: "#22264f", accent: "#ffe066", night: true }, description: "A cool late-night kitchen theme." },
  { id: "kitchen_retro_diner", display_name: "Retro Diner", grant_only: "chapter_07", pal: { sky: "#a5f3fc", sky2: "#e3fafc", wall: "#fff5f5", tile: "#ffffff", tileLine: "#ffc9c9", cab: "#e03131", cabDark: "#c92a2a", counter: "#f1f3f5", counterDark: "#ced4da", shelf: "#ff8787", frame: "#c92a2a", accent: "#4dabf7", checker: true, night: false }, description: "A bright red retro diner." },
  { id: "kitchen_food_truck", display_name: "Food Truck", price_coins: 5000, pal: { sky: "#74c0fc", sky2: "#d0ebff", wall: "#ffe066", tile: "#fff3bf", tileLine: "#fcc419", cab: "#fab005", cabDark: "#e67700", counter: "#adb5bd", counterDark: "#868e96", shelf: "#ced4da", frame: "#495057", accent: "#ff6b6b", night: false }, description: "Cook on the go." },
  { id: "kitchen_garden", display_name: "Garden Grill", price_coins: 7500, pal: { sky: "#8ce99a", sky2: "#d3f9d8", wall: "#e6fcf5", tile: "#ffffff", tileLine: "#c3fae8", cab: "#2b8a3e", cabDark: "#237032", counter: "#d9a066", counterDark: "#b07b45", shelf: "#94d82d", frame: "#2b8a3e", accent: "#ff922b", night: false }, description: "Outdoor grilling vibes." },
  { id: "kitchen_candy", display_name: "Candy Shop", price_tickets: 40, pal: { sky: "#fcc2d7", sky2: "#fff0f6", wall: "#fff0f6", tile: "#ffffff", tileLine: "#fcc2d7", cab: "#f06595", cabDark: "#d6336c", counter: "#e599f7", counterDark: "#cc5de8", shelf: "#faa2c1", frame: "#d6336c", accent: "#66d9e8", night: false }, description: "Premium. Sugar-coated everything." }
];

const REFERENCE_KITCHEN_NAMES = {
  kitchen_default: ['Food Truck', 'Fresh snacks from a bright roadside food truck.'],
  kitchen_modern: ['Space Station Cafeteria', 'A snack break among the stars.'],
  kitchen_cozy_cafe: ['Bakery Shop', 'Warm bread and treats behind the bakery counter.'],
  kitchen_night: ['Midnight Fridge Raid', 'A late-night kitchen lit by the open fridge.'],
  kitchen_retro_diner: ['Movie Theater Concession', 'Popcorn, snacks and a night at the movies.'],
  kitchen_food_truck: ['Beach Snack Shack', 'Cool drinks and beachside snacks.'],
  kitchen_garden: ['Picnic Park', 'A sunny picnic in the park.'],
  kitchen_candy: ['Candy Store', 'A colorful shop full of sweets.']
};
for (const kitchen of SS.DATA.kitchens) {
  [kitchen.display_name, kitchen.description] = REFERENCE_KITCHEN_NAMES[kitchen.id];
}
SS.DATA.kitchens.push(
  {id:'kitchen_arcade', display_name:'Arcade Snack Bar', price_coins:0, pal:SS.DATA.kitchens[0].pal, description:'A snack counter surrounded by arcade games.'},
  {id:'kitchen_haunted', display_name:'Haunted Snack House', price_coins:0, pal:SS.DATA.kitchens[3].pal, description:'Moonlit snacks in a haunted house.'}
);

// Player levels 1\u201350 (Missions Bible \u00a76). Cumulative XP; rewards in Coins.
SS.DATA.levels = (function () {
  const out = [{ level: 1, xp: 0, coins: 0 }, { level: 2, xp: 250, coins: 200 }, { level: 3, xp: 600, coins: 200 }, { level: 4, xp: 1000, coins: 200 }];
  for (let L = 5; L <= 50; L++) {
    const prev = out[out.length - 1].xp;
    out.push({ level: L, xp: prev + 100 * L, coins: L % 10 === 0 ? 750 : (L % 5 === 0 ? 500 : 200), badge: L % 10 === 0 });
  }
  return out;
})();

// Economy Bible \u00a76 daily reward cycle (no Tickets).
SS.DATA.daily_rewards = [
  { day: 1, coins: 150, xp: 0 }, { day: 2, coins: 200, xp: 0 }, { day: 3, coins: 250, xp: 25 }, { day: 4, coins: 300, xp: 0 },
  { day: 5, coins: 350, xp: 40 }, { day: 6, coins: 450, xp: 0 }, { day: 7, coins: 750, xp: 75 }
];

// Daily mission templates (implemented subset of DAY-001..030). stat = run/lifetime counter evaluated by MissionTracker.
SS.DATA.daily_templates = [
  { id: "DAY-001", stat: "orders", range: [3, 8], label: "Complete {n} orders", coins: 120 },
  { id: "DAY-002", stat: "runs", range: [2, 5], label: "Play {n} runs", coins: 100 },
  { id: "DAY-003", stat: "best_run_score", range: [2500, 9000], round: 500, label: "Score {n} in one run", coins: 150, max_type: true },
  { id: "DAY-004", stat: "perfects", range: [8, 25], label: "Earn {n} Perfect catches", coins: 130 },
  { id: "DAY-005", stat: "best_combo", range: [4, 12], label: "Reach combo x{n}", coins: 130, max_type: true },
  { id: "DAY-006", stat: "clean_runs", range: [1, 3], label: "Finish {n} runs with no wrong catches", coins: 140 },
  { id: "DAY-007", stat: "orders_burgers", range: [2, 5], label: "Complete {n} Burger orders", coins: 110, requires_category: "burgers" },
  { id: "DAY-008", stat: "orders_classic_breakfast", range: [2, 5], label: "Complete {n} Breakfast orders", coins: 110, requires_category: "classic_breakfast" },
  { id: "DAY-009", stat: "orders_sandwiches", range: [2, 5], label: "Complete {n} Sandwich orders", coins: 110, requires_category: "sandwiches" },
  { id: "DAY-010", stat: "orders_salads_and_desserts", range: [2, 5], label: "Complete {n} Salad & Dessert orders", coins: 110, requires_category: "salads_and_desserts" },
  { id: "DAY-013", stat: "orders_shakes_and_smoothies", range: [2, 4], label: "Serve {n} shakes or smoothies", coins: 110, requires_category: "shakes_and_smoothies" },
  { id: "DAY-014", stat: "orders_pizza_and_sides", range: [2, 4], label: "Complete {n} Pizza & Sides orders", coins: 110, requires_category: "pizza_and_sides" },
  { id: "DAY-012", stat: "modified_orders", range: [2, 4], label: "Complete {n} modified customer orders", coins: 140, requires_chapter: 3 },
  { id: "DAY-017", stat: "recoveries", range: [1, 3], label: "Recover {n} unstable stacks", coins: 140 },
  { id: "DAY-018", stat: "near_fall_saves", range: [1, 3], label: "Make {n} near-fall saves", coins: 150 },
  { id: "DAY-019", stat: "stable_orders", range: [2, 5], label: "Complete {n} orders at 80+ stability", coins: 130 },
  { id: "DAY-020", stat: "flawless_orders", range: [1, 3], label: "Complete {n} flawless orders", coins: 160 },
  { id: "DAY-022", stat: "story_runs", range: [2, 4], label: "Play {n} story missions or replays", coins: 120 },
  { id: "DAY-025", stat: "coins_earned", range: [250, 800], round: 50, label: "Earn {n} Coins from gameplay", coins: 120 },
  { id: "DAY-QD", stat: "quick_drops", range: [5, 15], label: "Quick Drop {n} ingredients", coins: 100 }
];
SS.DATA.weekly_templates = [
  { id: "WEEK-001", stat: "orders", range: [35, 60], label: "Complete {n} orders", coins: 600 },
  { id: "WEEK-002", stat: "perfects", range: [100, 180], label: "Earn {n} Perfect catches", coins: 650 },
  { id: "WEEK-003", stat: "best_combo", range: [12, 20], label: "Reach combo x{n}", coins: 600, max_type: true },
  { id: "WEEK-005", stat: "flawless_orders", range: [8, 12], label: "Complete {n} flawless orders", coins: 700 },
  { id: "WEEK-006", stat: "runs", range: [12, 20], label: "Finish {n} runs", coins: 500 },
  { id: "WEEK-008", stat: "score_total", range: [6000, 12000], round: 1000, label: "Earn {n} total score", coins: 550 },
  { id: "WEEK-009", stat: "recoveries", range: [8, 15], label: "Make {n} recovery saves", coins: 650 },
  { id: "WEEK-014", stat: "coins_earned", range: [2500, 5000], round: 250, label: "Earn {n} Coins from play", coins: 600 }
];

// Achievements ACH-001..050 (Missions Bible \u00a79). stat counters are lifetime unless noted.
SS.DATA.achievements = (function () {
  const A = (id, name, stat, target, coins, tickets, desc) => ({ id, name, stat, target, coins, tickets: tickets || 0, desc });
  return [
    A("ACH-001", "First Service", "orders", 1, 25, 0, "Complete your first order"),
    A("ACH-002", "Ten Served", "orders", 10, 25, 0, "Complete 10 orders"),
    A("ACH-003", "Century Service", "orders", 100, 50, 0, "Complete 100 orders"),
    A("ACH-004", "Five Hundred Served", "orders", 500, 75, 0, "Complete 500 orders"),
    A("ACH-005", "Thousand Stack", "orders", 1000, 100, 10, "Complete 1,000 orders"),
    A("ACH-006", "Perfect Start", "perfects", 1, 20, 0, "Earn your first Perfect catch"),
    A("ACH-007", "Precision 50", "perfects", 50, 30, 0, "Earn 50 Perfect catches"),
    A("ACH-008", "Precision 250", "perfects", 250, 50, 0, "Earn 250 Perfect catches"),
    A("ACH-009", "Precision 1000", "perfects", 1000, 100, 0, "Earn 1,000 Perfect catches"),
    A("ACH-010", "Combo Five", "best_combo", 5, 20, 0, "Reach x5 combo"),
    A("ACH-011", "Combo Ten", "best_combo", 10, 35, 0, "Reach x10 combo"),
    A("ACH-012", "Combo Fifteen", "best_combo", 15, 60, 0, "Reach x15 combo"),
    A("ACH-013", "Combo Twenty", "best_combo", 20, 100, 0, "Reach x20 combo"),
    A("ACH-014", "Clean Plate", "flawless_orders", 1, 25, 0, "Complete one flawless order"),
    A("ACH-015", "Clean Shift", "best_run_flawless", 5, 75, 0, "Complete five flawless orders in one run"),
    A("ACH-016", "Recovery Artist", "recoveries", 10, 40, 0, "Trigger 10 recovery saves"),
    A("ACH-017", "Edge Catcher", "near_fall_saves", 10, 40, 0, "Make 10 near-fall saves"),
    A("ACH-018", "Burger Graduate", "chapters_done", 1, 10, 0, "Finish Chapter 1"),
    A("ACH-019", "Morning Pro", "chapters_done", 2, 10, 0, "Finish Chapter 2"),
    A("ACH-020", "Deli Expert", "chapters_done", 3, 10, 0, "Finish Chapter 3"),
    A("ACH-021", "Sandwich Specialist", "chapters_done", 4, 10, 0, "Finish Chapter 4"),
    A("ACH-022", "Fountain Ace", "chapters_done", 5, 10, 0, "Finish Chapter 5"),
    A("ACH-023", "Pizza Pro", "chapters_done", 6, 10, 0, "Finish Chapter 6"),
    A("ACH-024", "Cool Customer", "chapters_done", 7, 10, 0, "Finish Chapter 7"),
    A("ACH-051", "Fiesta Star", "chapters_done", 8, 10, 0, "Finish Chapter 8"),
    A("ACH-052", "Fry Cook", "chapters_done", 9, 10, 0, "Finish Chapter 9"),
    A("ACH-053", "Brunch Boss", "chapters_done", 10, 10, 0, "Finish Chapter 10"),
    A("ACH-054", "Sweet Success", "chapters_done", 11, 10, 0, "Finish Chapter 11"),
    A("ACH-025", "Stack Master", "chapters_done", 12, 30, 20, "Finish Chapter 12"),
    A("ACH-026", "Collector 10", "recipes_unlocked", 10, 20, 0, "Unlock 10 recipes"),
    A("ACH-027", "Collector 20", "recipes_unlocked", 20, 35, 0, "Unlock 20 recipes"),
    A("ACH-028", "Collector 30", "recipes_unlocked", 30, 50, 0, "Unlock 30 recipes"),
    A("ACH-029", "Half the Menu", "recipes_unlocked", 60, 60, 10, "Unlock 60 recipes"),
    A("ACH-055", "Full Menu", "recipes_unlocked", 117, 120, 25, "Unlock all 117 recipes"),
    A("ACH-030", "Style Starter", "cosmetics_owned", 3, 20, 0, "Own 3 cosmetics"),
    A("ACH-031", "Style Shelf", "cosmetics_owned", 10, 40, 0, "Own 10 cosmetics"),
    A("ACH-032", "Kitchen Collector", "kitchens_owned", 4, 50, 0, "Own 4 kitchens"),
    A("ACH-033", "Plate Parade", "plates_owned", 8, 50, 0, "Own 8 plates"),
    A("ACH-034", "Classic Regular", "classic_runs", 25, 35, 0, "Finish 25 Classic runs"),
    A("ACH-035", "Survival Regular", "survival_runs", 15, 35, 0, "Finish 15 Survival runs"),
    A("ACH-036", "Challenge Regular", "story_runs", 20, 35, 0, "Complete 20 story missions or replays"),
    A("ACH-037", "Score 10K", "best_run_score", 10000, 30, 0, "Score 10,000 in one run"),
    A("ACH-038", "Score 25K", "best_run_score", 25000, 60, 0, "Score 25,000 in one run"),
    A("ACH-039", "Score 50K", "best_run_score", 50000, 100, 10, "Score 50,000 in one run"),
    A("ACH-040", "Modifier Novice", "modified_orders", 10, 25, 0, "Complete 10 modified orders"),
    A("ACH-041", "Modifier Expert", "modified_orders", 100, 60, 0, "Complete 100 modified orders"),
    A("ACH-042", "Rush Specialist", "mod_MOD-RUSH", 50, 50, 0, "Complete 50 Rush Orders"),
    A("ACH-043", "Tall Stack Specialist", "mod_MOD-TALL", 50, 50, 0, "Complete 50 Tall Orders"),
    A("ACH-044", "No-Onion Please", "mod_MOD-NO", 25, 30, 0, "Complete 25 No Ingredient requests"),
    A("ACH-045", "Extra Please", "mod_MOD-EXTRA", 25, 30, 0, "Complete 25 Extra Ingredient requests"),
    A("ACH-046", "Swap Shop", "mod_MOD-SWAP", 25, 30, 0, "Complete 25 Swap requests"),
    A("ACH-047", "Seven-Day Rhythm", "daily_rewards_claimed", 7, 30, 0, "Claim seven daily rewards"),
    A("ACH-048", "Mission Habit", "daily_missions_claimed", 25, 40, 0, "Claim 25 daily missions"),
    A("ACH-049", "Weekly Worker", "weekly_missions_claimed", 10, 60, 10, "Complete 10 weekly missions"),
    A("ACH-050", "Everything on the Menu", "recipes_served", 117, 150, 25, "Serve at least one order of every recipe"),
    A("ACH-056", "Off the Menu", "specials_cleared", 1, 40, 0, "Clear a Special Order"),
    A("ACH-057", "Special Shift", "specials_cleared", 25, 80, 5, "Clear 25 Special Orders"),
    A("ACH-058", "Regular's Favourite", "specials_cleared", 100, 150, 10, "Clear 100 Special Orders"),
    A("ACH-059", "Every Special", "specials_cleared", 250, 300, 30, "Clear all 250 Special Orders")
  ];
})();
