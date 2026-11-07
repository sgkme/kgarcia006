// Snack Stack \u2014 campaign: chapters, 72 missions in 12 chapters, 250 Special Orders, customers, story beats, hazards, bonuses, conditions.
// Sources: Missions & Progression Bible (05) \u00a73/\u00a75/\u00a75A, Story Bible (04) \u00a74\u2013\u00a78, Bible 13, 13_MACHINE_READABLE.
window.SS = window.SS || {};
SS.DATA = SS.DATA || {};

// The story is narrated by the shop owner (the user's chef sprites in assets/icons/chef_*.png). Rename here.
SS.DATA.narrator = { name: "Chef Pepper", role: "Owner of the Snack Stack shop" };
SS.DATA.customers = { chef: { name: "Chef Pepper", trait: "Shop owner and your mentor", skin: "#f1c27d", hair: "#5a3420", shirt: "#ffffff", style: "chef" } };

// 12 chapters, one food group each (see SS.DATA.GROUP_ORDER in content.js).
SS.DATA.chapters = [
  { id: "chapter_01", number: 1, title: "Burger Beginnings", group: "Burgers", icon: "cheeseburger",
    intro: ["wave|Welcome to Snack Stack! I'm Chef Pepper, and this little shop is my whole heart.", "thinking|Business has been slow. I need a cook with steady hands, and I think that's you.", "fists|We start with burgers. Stack them neat and the neighbourhood will notice!"],
    outro: ["celebrate|Look at that line outside! The neighbourhood noticed.", "proud|You've earned your apron. Breakfast is next."], finale_grants: { tickets: 10, badge: "Burger Beginnings", cosmetics: [] } },
  { id: "chapter_02", number: 2, title: "Breakfast Breakout", group: "Classic breakfast", icon: "pancakes",
    intro: ["calm|We're opening early now. Commuters want breakfast, and they want it fast.", "stars|Pancakes, waffles, eggs. Syrup pours over the top and runs down the sides, so centre it!"],
    outro: ["celebrate|Morning rush, handled! Take the Blue Plate, you've earned it.", "thinking|Lunch crowds want hot dogs and deli classics next."], finale_grants: { tickets: 10, cosmetics: ["plate_blue"] } },
  { id: "chapter_03", number: 3, title: "Deli Days", group: "Hot dogs & deli", icon: "hot_dog",
    intro: ["fists|Hot dogs, Reubens, a proper club sandwich. The deli counter is open!", "thinking|Customers love to customise. No onions, extra cheese... read every ticket."],
    outro: ["proud|Every special request, done right. Our kitchen just got an upgrade!", "stars|Next up: the full sandwich board."], finale_grants: { tickets: 10, cosmetics: ["kitchen_modern"] } },
  { id: "chapter_04", number: 4, title: "Sandwich Shift", group: "Sandwiches", icon: "club_sandwich",
    intro: ["calm|Subs, melts and a cheesesteak that sizzles. Long rolls are wider, so use the whole plate.", "worried|And watch the counter. It rattles when the freezer kicks in."],
    outro: ["celebrate|Lunch is a hit! The Bakery Shop is yours.", "stars|Now for something cold. We're opening a soda fountain!"], finale_grants: { tickets: 10, cosmetics: ["kitchen_cozy_cafe"] } },
  { id: "chapter_05", number: 5, title: "Soda Fountain", group: "Shakes & smoothies", icon: "strawberry_milkshake",
    intro: ["stars|Milkshakes and smoothies! Catch each pour in the glass and watch it fill up.", "thinking|Toppings go on last, then the straw slides in. Glasses are narrow, so be precise."],
    outro: ["proud|Not a drop spilled. The Red Plate is yours.", "fists|Pizza night is next. Hot, cheesy and fast!"], finale_grants: { tickets: 10, cosmetics: ["plate_red"] } },
  { id: "chapter_06", number: 6, title: "Pizza Party", group: "Pizza & sides", icon: "pepperoni_pizza",
    intro: ["fists|Pizza on the board, nachos and loaded fries in baskets!", "worried|Keep ice away from hot food, and the oven sends up steam that hides the kitchen."],
    outro: ["celebrate|The pizza crowd loves us! Midnight Fridge Raid is yours.", "calm|When it's hot outside, people want something cool."], finale_grants: { tickets: 10, cosmetics: ["kitchen_night"] } },
  { id: "chapter_07", number: 7, title: "Lemonade Stand", group: "Refreshments", icon: "lemonade",
    intro: ["calm|Summer drinks! Ice goes in first and floats up as the drink pours in.", "stars|A root beer float, fresh lemonade... light and fizzy, but tall glasses wobble."],
    outro: ["celebrate|Refreshing work! The Movie Theater Concession is yours.", "fists|Now the Tex-Mex night. Wraps fold themselves once the filling is in!"], finale_grants: { tickets: 10, cosmetics: ["kitchen_retro_diner"] } },
  { id: "chapter_08", number: 8, title: "Tex-Mex Fiesta", group: "Tex-Mex & potatoes", icon: "tacos",
    intro: ["fists|Tacos side by side, burritos that roll up, potatoes loaded high!", "thinking|Taco shells sit next to each other, so catch each filling over the right shell."],
    outro: ["proud|What a fiesta! Fried favourites are calling next."], finale_grants: { tickets: 10 } },
  { id: "chapter_09", number: 9, title: "Fry Day", group: "Fried favorites", icon: "chicken_tenders",
    intro: ["stars|Baskets of crispy goodness! Pieces tumble in, then the dip goes on the side.", "worried|Our festival cart is back, and it slides the plate on its own. Correct early!"],
    outro: ["celebrate|Crispy, golden, perfect. Brunch is next, and it's fancy."], finale_grants: { tickets: 10 } },
  { id: "chapter_10", number: 10, title: "Brunch Club", group: "Specialty breakfast", icon: "eggs_benedict",
    intro: ["calm|Eggs Benedict, skillets that sizzle, parfaits in tall glasses.", "thinking|Brunch guests notice everything. Clean catches only."],
    outro: ["proud|The brunch club gave us five stars!", "stars|Salads and desserts next. Pretty food sells itself."], finale_grants: { tickets: 10 } },
  { id: "chapter_11", number: 11, title: "Sweet Garden", group: "Salads & desserts", icon: "sundae",
    intro: ["stars|Fresh salads and big desserts: sundaes, banana splits, ice cream cones.", "worried|Hot fudge coats the scoop and drips down. Delicate scoops squash if you're careless!"],
    outro: ["celebrate|Sweet success!", "surprised|Wait... a letter. We've been entered in the Golden Spatula contest!"], finale_grants: { tickets: 10 } },
  { id: "chapter_12", number: 12, title: "Golden Spatula", group: "Ice cream sandwiches", icon: "chocolate_chip_sandwich",
    intro: ["thinking|The Golden Spatula! The judges want ice cream sandwiches.", "fists|Catch the top cookie on the scoop, then TAP to press it together. Quick presses score more!"],
    outro: ["celebrate|WE WON! You're a true Stack Master.", "proud|Snack Stack is the busiest shop in town, because of you. Thank you, partner."], finale_grants: { tickets: 10, badge: "Stack Master", cosmetics: ["plate_gold"] } }
];
SS.DATA.chapters.forEach(c => c.customer = "chef");

// Midpoint micro-choices (Story Bible §7). They patch mission 4 of the chapter only.
SS.DATA.story_choices = (function () {
  const out = {}, bonus = (type, target, label, coins) => ({ bonus_objective: { type, target, label, coins } });
  const sets = [
    ["How should we run tomorrow's shift?", ["Keep it classic", bonus("perfect_streak", 4, "Bonus: 4 Perfects in a row", 120)], ["Load it up", { force_modifier: "MOD-EXTRA", note: "Customers will ask for Extra layers" }]],
    ["The line is out the door! What's the plan?", ["Fast and simple", bonus("time_remaining_min", 20, "Bonus: finish with 20s left", 120)], ["Make it tall", { force_modifier: "MOD-TALL", note: "Tall Orders on the menu" }]],
    ["Two lunch lists came in. Which do we take?", ["Exact requests", { force_modifier: "MOD-SWAP", note: "Swap requests on every order" }], ["Chef's pick", bonus("perfect_streak", 5, "Bonus: 5 Perfects in a row", 150)]],
    ["What matters most today?", ["Go tall", { force_modifier: "MOD-TALL", note: "Tall stacks" }], ["Stay precise", { force_modifier: "MOD-PERFECT", note: "Perfect Finish requests" }]],
    ["The fountain is packed. More flavour or more speed?", ["More toppings", { force_modifier: "MOD-TOPPING", note: "Extra toppings on every glass" }], ["More speed", { force_modifier: "MOD-RUSH", note: "Rush Orders on every ticket" }]],
    ["Pizza night is busy. Your call!", ["Keep them coming", bonus("time_remaining_min", 15, "Bonus: finish with 15s left", 150)], ["Keep them clean", { force_modifier: "MOD-CLEAN", note: "No Mistakes requests" }]],
    ["Hot day! What's the plan?", ["Cool and steady", bonus("combo_reach", 8, "Bonus: reach combo x8", 150)], ["Rush the line", { force_modifier: "MOD-RUSH", note: "Rush Orders on every ticket" }]],
    ["Fiesta time. Crowd favourite, or surprise them?", ["Crowd favourite", bonus("combo_reach", 10, "Bonus: reach combo x10", 150)], ["Surprise me", { force_modifier: "MOD-MYSTERY", note: "Mystery Requests: only the next layer is shown" }]],
    ["Fryers are hot. Extra or exact?", ["Extra crispy", { force_modifier: "MOD-EXTRA", note: "Extra layers on every order" }], ["Exact orders", bonus("flawless_orders", 1, "Bonus: 1 flawless order", 150)]],
    ["Brunch guests are picky. How do we serve?", ["Precision first", bonus("flawless_orders", 2, "Bonus: 2 flawless orders", 180)], ["Customise it", { force_modifier: "MOD-SWAP", note: "Swap requests on every order" }]],
    ["Dessert crowd! Tall or tidy?", ["Go tall", { force_modifier: "MOD-TALL", note: "Tall desserts" }], ["Keep it tidy", { force_modifier: "MOD-CLEAN", note: "No Mistakes requests" }]],
    ["How do you want the judges to see us?", ["Precision first", bonus("flawless_orders", 2, "Bonus: 2 flawless orders", 200)], ["Speed first", bonus("time_remaining_min", 15, "Bonus: finish with 15s left", 200)]]
  ];
  sets.forEach((c, i) => { out["chapter_" + String(i + 1).padStart(2, "0")] = { prompt: c[0], a: { label: c[1][0], patch: c[1][1] }, b: { label: c[2][0], patch: c[2][1] } }; });
  return out;
})();

// 72 missions: six per chapter, built from each food group's dishes.
(function () {
  const groups = SS.DATA.GROUP_ORDER, R = SS.DATA.recipes;
  // hazards/bonuses introduced per mission (Preview -> First Encounter -> Reinforcement)
  const INTRO = { "1-2": { bn: ["score_star"] }, "1-3": { hz: ["wrapper_trash"] }, "1-4": { bn: ["time_boost"] }, "1-5": { hz: ["slime_blob"] },
    "2-2": { bn: ["coin_burst"] }, "2-3": { hz: ["bug"] }, "2-5": { hz: ["gust_wind"] }, "3-1": { bn: ["slow_time"] }, "3-3": { hz: ["grease_drop"] },
    "4-1": { bn: ["wide_catch"] }, "4-3": { hz: ["counter_shake"] }, "4-4": { bn: ["hazard_shield"] }, "5-2": { bn: ["combo_shield"] },
    "6-1": { hz: ["ice_cube"] }, "6-3": { hz: ["steam_burst"] }, "8-5": { hz: ["slippery_counter"] }, "9-2": { hz: ["moving_plate_event"] } };
  const HZ_LINE = { wrapper_trash: "worried|Someone keeps tossing wrappers around. Don't catch trash, it costs you a heart!", slime_blob: "surprised|Uh oh, the ceiling vent is dripping slime! If it lands on the food, we remake it.",
    bug: "worried|A bug flew in! It zig-zags, so keep the food away from it.", gust_wind: "surprised|It's windy out front! Arrows show which way the food will drift.",
    grease_drop: "worried|The grill is spitting hot grease. It makes a mess of any meal it lands on.", counter_shake: "surprised|The freezer is rattling the counter! Tall, messy stacks wobble the most.",
    ice_cube: "fists|Keep ice cubes away from hot food, or it goes cold!", steam_burst: "surprised|Steam from the oven hides the kitchen! Remember where things were.",
    slippery_counter: "surprised|I just mopped and the counter is slippery! Small, early moves.", moving_plate_event: "worried|The festival cart wobbles. The plate might slide on its own!" };
  const BN_LINE = { score_star: "stars|Grab any gold stars you see. Bonus points!", time_boost: "fists|Clocks give you extra time.", coin_burst: "thinking|Coin bags mean bonus tips!",
    slow_time: "calm|An hourglass slows everything down for a bit.", wide_catch: "stars|The wide-catch bubble makes Perfects easier for a while.", hazard_shield: "calm|A shield bubble blocks one hazard for you.", combo_shield: "stars|A combo shield saves your streak once." };
  const POSES = ["wave", "calm", "thinking", "fists", "stars", "proud"];
  const THIRD = ["m3", "m3", "m2", "m2", "c5", "s"];
  const chapterTier = [0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4];
  const hazardRate = [0.9, 1.4, 1.8, 2.1, 2.3, 2.6, 2.8, 3.0, 3.2, 3.4, 3.5, 3.6];
  const modChance = [0, 0.3, 0.42, 0.46, 0.5, 0.52, 0.55, 0.58, 0.6, 0.62, 0.64, 0.66];
  const recipeUnlocks = {}; SS.DATA.chapter_open_recipes = {};
  const missions = [];
  groups.forEach((g, gi) => {
    const ch = gi + 1, cid = "chapter_" + String(ch).padStart(2, "0"), dishes = R.filter(r => r.group === g).map(r => r.id);
    // unlock plan: two dishes open with the chapter, the rest arrive across missions 1-5
    SS.DATA.chapter_open_recipes[cid] = dishes.slice(0, 2);
    const rest = dishes.slice(2), per = [0, 0, 0, 0, 0];
    rest.forEach((_, k) => per[k % 5]++);
    let at = 2; const unlockAt = [];
    for (let m = 0; m < 5; m++) { const ids = dishes.slice(at, at + per[m]); at += per[m]; unlockAt.push(ids); if (ids.length) recipeUnlocks[`ch${String(ch).padStart(2, "0")}_m${String(m + 1).padStart(2, "0")}`] = ids; }
    for (let n = 1; n <= 6; n++) {
      const id = `ch${String(ch).padStart(2, "0")}_m${String(n).padStart(2, "0")}`;
      const src = n === 6 ? (ch === 12 ? "POOL-FINALE" : "POOL-CH" + String(ch).padStart(2, "0")) : (n === 1 ? dishes[0] : (unlockAt[n - 2][0] || dishes[(n - 1) % dishes.length]));
      const intro = INTRO[ch + "-" + n] || {};
      const name = n === 6 ? (ch === 12 ? "Finale Gauntlet" : g + " Rush") : SS.DATA.recipe_by_id[src].display_name;
      const line = intro.hz ? HZ_LINE[intro.hz[0]] : intro.bn ? BN_LINE[intro.bn[0]] : n === 6 ? (ch === 12 ? "stars|The final round. Everything you've learned, one last time. Ready?" : "proud|The whole " + g.toLowerCase() + " menu. Run the kitchen, partner!")
        : `${POSES[(ch + n) % POSES.length]}|${n === 1 ? "First up" : "Next"}: ${SS.DATA.recipe_by_id[src].display_name}. ${["Build it bottom to top.", "Read the ticket carefully.", "Keep the stack centred.", "Nice and steady.", "Let's keep that combo going!"][(n - 1) % 5]}`;
      const orders = Math.min(7, 2 + Math.floor((ch + n) / 3)), perfects = Math.min(16, 3 + Math.floor(ch * 0.8) + n), coins = 280 + ch * 70 + n * 40 + (n === 6 ? 300 : 0), xp = 60 + ch * 14 + n * 9 + (n === 6 ? 60 : 0);
      let third = THIRD[n - 1]; if (third === "s") third = "s" + (6500 + ch * 900); if (ch >= 6 && n >= 4 && n <= 5) third = n === 4 ? "m1" : "f1"; if (ch >= 10 && n === 3) third = "m0"; if (n === 5 && ch % 3 === 0) third = "t" + (8 + Math.floor(ch / 2));
      missions.push([id, name, src, orders, perfects, third, coins, xp, intro, line]);
    }
  });
  SS.DATA.missions = missions.map((r, idx) => {
    const [id, title, src, orders, perfects, third, coins, xp, intro, line] = r;
    const ch = parseInt(id.slice(2, 4), 10), num = parseInt(id.slice(6, 8), 10);
    const objectives = [
      { type: "complete_orders", target: orders, label: `Complete ${orders} orders` },
      { type: "perfect_drops", target: perfects, label: `Make ${perfects} Perfect drops` }
    ];
    const t = third[0], v = parseInt(third.slice(1), 10);
    if (t === "m") objectives.push({ type: "mistakes_max", target: v, label: v === 0 ? "Finish with 0 mistakes" : `Finish with ${v} or fewer mistakes` });
    if (t === "c") objectives.push({ type: "combo_reach", target: v, label: `Reach combo x${v}` });
    if (t === "s") objectives.push({ type: "score_min", target: v, label: `Score at least ${v.toLocaleString("en-US")}` });
    if (t === "t") objectives.push({ type: "time_remaining_min", target: v, label: `Finish with ${v}+ seconds left` });
    if (t === "f") objectives.push({ type: "flawless_orders", target: v, label: `Complete ${v} flawless order` });
    const isPool = !!SS.DATA.order_pools[src];
    return {
      id, chapter_id: "chapter_" + String(ch).padStart(2, "0"), chapter: ch, number: num, index: idx, title,
      recipe_id: isPool ? null : src, order_pool_id: isPool ? src : null,
      objectives, rewards: { coins, xp }, first_clear_recipes: recipeUnlocks[id] || [],
      new_hazards: intro.hz || [], new_bonuses: intro.bn || [], story_line: line,
      tier: Math.min(5, chapterTier[ch - 1] + (num >= 4 ? 1 : 0)),
      hazard_rate: hazardRate[ch - 1] * (num === 1 ? 0.7 : 1) + (num >= 5 ? 0.4 : 0),
      modifier_chance: modChance[ch - 1] + (num >= 5 ? 0.1 : 0),
      time_limit: null
    };
  });
  SS.DATA.mission_by_id = {};
  SS.DATA.missions.forEach(m => SS.DATA.mission_by_id[m.id] = m);
})();

// 250 Special Orders: optional side missions (25 written by hand, 225 generated below). Each opens when its chapter is finished and plays with one twist.
// rules: no_guides, hazards_only [ids], hazard_mult, force_modifier, mod_chance, tier_bonus, precision_mult (<1 = tighter), time_mult.
// Objectives may use the extra types hazards_max, collapses_max, stable_orders, quick_drops, quick_presses, near_fall_saves.
// Built once at boot (needs SS.OrderBuilder, which loads after this file): SS.DATA.buildSpecials().
SS.DATA.buildSpecials = function () { if (SS.DATA.specials) return SS.DATA.specials;
  const G = SS.DATA.GROUP_ORDER, R = SS.DATA.recipes;
  const poolOf = groups => R.filter(r => groups.indexOf(r.group) >= 0).map(r => r.id);
  const O = (type, target, label) => ({ type, target, label });
  const orders = n => O("complete_orders", n, `Complete ${n} orders`), perf = n => O("perfect_drops", n, `Make ${n} Perfect drops`);
  // [chapter, title, groups, rules, objectives, chef line]
  const S = [
    [1, "Blind Stack", ["Burgers"], { no_guides: true }, [orders(4), perf(8)], "thinking|No drop line today. Trust your eyes and line it up yourself!"],
    [1, "Grill Smoke", ["Burgers"], { hazard_mult: 2.2 }, [orders(4), O("hazards_max", 1, "Get hit by 1 hazard or fewer")], "worried|Twice the mess flying around the grill. Dodge everything you can!"],
    [2, "Mystery Mornings", ["Classic breakfast"], { force_modifier: "MOD-MYSTERY" }, [orders(4), perf(9)], "surprised|Sleepy customers! Every ticket only shows the next layer."],
    [2, "Short Stack Sprint", ["Classic breakfast"], { tier_bonus: 1, time_mult: 0.8 }, [orders(5), perf(10)], "fists|Commuter rush! Food falls faster and the clock is shorter."],
    [3, "Picky Regulars", ["Hot dogs & deli"], { force_modifier: "MOD-SWAP" }, [orders(5), Object.assign(O("mistakes_max", 2, "Finish with 2 or fewer mistakes"), { strict: true })], "thinking|Our regulars swap something on every order. Read each ticket!"],
    [3, "Windy Corner", ["Hot dogs & deli"], { hazards_only: ["gust_wind"], hazard_mult: 1.8 }, [orders(4), O("stable_orders", 3, "Serve 3 orders at 80+ stability")], "surprised|We moved the cart to the windy corner. Watch the arrows!"],
    [4, "Rattle & Roll", ["Sandwiches"], { hazards_only: ["counter_shake"], hazard_mult: 1.6 }, [orders(4), O("collapses_max", 0, "No collapses")], "worried|The freezer won't stop rattling. Keep every stack standing!"],
    [4, "Lunch Box", ["Sandwiches", "Burgers"], {}, [orders(6), O("combo_reach", 10, "Reach combo x10")], "stars|School lunch order! Burgers and sandwiches, all mixed together."],
    [5, "Steady Pour", ["Shakes & smoothies"], { precision_mult: 0.8 }, [orders(4), O("perfect_streak", 5, "Get 5 Perfects in a row")], "calm|Fancy glasses today. The Perfect window is smaller, so take your time."],
    [5, "Fountain Rush", ["Shakes & smoothies"], { force_modifier: "MOD-RUSH" }, [orders(5), O("quick_drops", 8, "Quick Drop 8 ingredients")], "fists|Everyone wants their shake NOW. Swipe down to Quick Drop!"],
    [6, "Oven Fog", ["Pizza & sides"], { hazards_only: ["steam_burst"], hazard_mult: 1.5 }, [orders(4), perf(10)], "surprised|The oven door is stuck open. Steam everywhere! Remember where things are."],
    [6, "Game Night Platter", ["Pizza & sides", "Hot dogs & deli"], { tier_bonus: 1 }, [orders(6), O("score_min", 14000, "Score at least 14,000")], "stars|Big game tonight! Pizza, nachos, hot dogs, the works."],
    [7, "Drink Cart", ["Refreshments", "Shakes & smoothies"], {}, [orders(6), O("flawless_orders", 2, "Complete 2 flawless orders")], "calm|We're taking every drink on the cart to the park. Spill nothing!"],
    [7, "Slippery Summer", ["Refreshments"], { force_modifier: "MOD-SLIP" }, [orders(5), O("collapses_max", 0, "No collapses")], "worried|Condensation everywhere, so every glass is slippery. Small moves!"],
    [8, "Taco Tuesday Takeover", ["Tex-Mex & potatoes"], { tier_bonus: 1 }, [orders(6), O("combo_reach", 10, "Reach combo x10")], "fists|It's Taco Tuesday and the whole town showed up. Faster!"],
    [8, "Mop Duty", ["Tex-Mex & potatoes"], { hazards_only: ["slippery_counter"], hazard_mult: 1.4 }, [orders(5), O("stable_orders", 3, "Serve 3 orders at 80+ stability")], "surprised|Salsa spill! The counter keeps getting slippery. Correct early."],
    [9, "Food Truck Festival", ["Fried favorites"], { hazards_only: ["moving_plate_event"], hazard_mult: 1.4 }, [orders(5), perf(14)], "worried|We're serving from the truck on a bumpy road. The plate won't sit still!"],
    [9, "Diner Classics", ["Burgers", "Fried favorites", "Shakes & smoothies"], {}, [orders(7), perf(16)], "proud|Burger, fries and a shake. The classic diner combo, all night long."],
    [10, "Brunch Inspection", ["Specialty breakfast"], { force_modifier: "MOD-CLEAN" }, [orders(4), Object.assign(O("mistakes_max", 0, "Finish with 0 mistakes"), { strict: true })], "thinking|A food critic is here. Not one mistake!"],
    [10, "Breakfast for Dinner", ["Classic breakfast", "Specialty breakfast"], { no_guides: true }, [orders(6), perf(14)], "stars|Pancakes at midnight! Every breakfast on the menu, and no drop line."],
    [11, "Sundae Funday", ["Salads & desserts"], { force_modifier: "MOD-EXTRA" }, [orders(5), O("perfect_streak", 6, "Get 6 Perfects in a row")], "stars|Kids' party! Everyone wants extra of something."],
    [11, "Picnic Basket", ["Sandwiches", "Salads & desserts", "Refreshments"], { hazards_only: ["bug"], hazard_mult: 1.5 }, [orders(6), O("hazards_max", 1, "Get hit by 1 hazard or fewer")], "worried|Picnic in the park... and the bugs found us. Shoo!"],
    [12, "Press Pro", ["Ice cream sandwiches"], {}, [orders(4), O("quick_presses", 3, "Make 3 Quick Presses")], "fists|Practice for the judges. Tap to press as fast as you can!"],
    [12, "Dessert Bar", ["Ice cream sandwiches", "Salads & desserts", "Shakes & smoothies"], { tier_bonus: 1 }, [orders(7), O("score_min", 22000, "Score at least 22,000")], "stars|An all-you-can-eat dessert bar. Sweet, fast and tall."],
    [12, "Grand Opening Gala", G.slice(), { tier_bonus: 1, hazard_mult: 1.3 }, [orders(10), perf(24), O("collapses_max", 1, "1 collapse or fewer")], "celebrate|Our second shop opens tonight! Every dish we know, one big gala."]
  ];
  // ---- 225 more, generated: every twist x menu pairing is used once, ~21 per chapter (250 in total) ----
  const NOUN = { "Burgers": "Burgers", "Classic breakfast": "Breakfast", "Hot dogs & deli": "Deli", "Sandwiches": "Sandwiches", "Shakes & smoothies": "Shakes",
    "Pizza & sides": "Pizza", "Refreshments": "Drinks", "Tex-Mex & potatoes": "Tex-Mex", "Fried favorites": "Fry Basket", "Specialty breakfast": "Brunch", "Salads & desserts": "Desserts", "Ice cream sandwiches": "Ice Cream Sammies" };
  const HZ_CH = { wrapper_trash: 1, slime_blob: 1, bug: 2, gust_wind: 2, grease_drop: 3, counter_shake: 4, ice_cube: 6, steam_burst: 6, slippery_counter: 8, moving_plate_event: 9 };
  // twist: [title, from chapter, rules, focus objective (n = chapter) or null, chef line]
  const T = [
    ["Blind", 1, { no_guides: true }, null, "thinking|No drop line on this one. Line it up by eye!"],
    ["Chaos", 1, { hazard_mult: 2 }, c => O("hazards_max", 2, "Get hit by 2 hazards or fewer"), "worried|Everything is flying today. Dodge, dodge, dodge!"],
    ["Slimy", 1, { hazards_only: ["slime_blob"], hazard_mult: 1.6 }, null, "surprised|The vent is dripping again. Keep slime off the food!"],
    ["Trash Day", 1, { hazards_only: ["wrapper_trash"], hazard_mult: 1.8 }, c => O("mistakes_max", 2, "Finish with 2 or fewer mistakes"), "worried|Wrappers everywhere. Don't catch the trash!"],
    ["Combo Chase", 1, {}, c => O("combo_reach", 6 + Math.min(8, c), `Reach combo x${6 + Math.min(8, c)}`), "fists|Keep the combo alive the whole way!"],
    ["Streak", 1, {}, c => O("perfect_streak", 3 + Math.floor(c / 3), `Get ${3 + Math.floor(c / 3)} Perfects in a row`), "stars|Perfect after Perfect. Can you keep it up?"],
    ["Steady", 1, {}, c => O("stable_orders", 3, "Serve 3 orders at 80+ stability"), "calm|Neat stacks only. Keep them centred."],
    ["Standing Tall", 1, {}, c => O("collapses_max", 0, "No collapses"), "thinking|Not one stack falls today."],
    ["Express", 2, { tier_bonus: 1 }, null, "fists|Express service! Food falls faster."],
    ["Lightning", 3, { tier_bonus: 1, time_mult: 0.8 }, null, "surprised|Faster food AND a shorter clock. Go go go!"],
    ["Precision", 2, { precision_mult: 0.8 }, c => O("perfect_drops", 6 + c, `Make ${6 + c} Perfect drops`), "calm|The Perfect window is smaller. Take your time."],
    ["Buggy", 2, { hazards_only: ["bug"], hazard_mult: 1.5 }, null, "worried|Bugs! They zig-zag, so keep the food clear."],
    ["Windy", 2, { hazards_only: ["gust_wind"], hazard_mult: 1.6 }, null, "surprised|Gusty day. Watch the arrows!"],
    ["Mystery", 2, { force_modifier: "MOD-MYSTERY" }, null, "surprised|Every ticket only shows the next layer."],
    ["Flawless", 2, {}, c => O("flawless_orders", 1 + Math.floor(c / 5), `Complete ${1 + Math.floor(c / 5)} flawless order${c >= 5 ? "s" : ""}`), "proud|Every catch clean. Every order spotless."],
    ["Quick Drop", 2, {}, c => O("quick_drops", 5 + c, `Quick Drop ${5 + c} ingredients`), "fists|Swipe down to Quick Drop. Speed is the goal!"],
    ["Greasy", 3, { hazards_only: ["grease_drop"], hazard_mult: 1.6 }, null, "worried|The grill is spitting. Keep grease off the meal!"],
    ["Swap Shop", 3, { force_modifier: "MOD-SWAP" }, null, "thinking|Everyone's swapping something. Read the ticket!"],
    ["Extra", 3, { force_modifier: "MOD-EXTRA" }, null, "stars|Extra everything! Taller stacks today."],
    ["Spotless", 4, { force_modifier: "MOD-CLEAN" }, c => Object.assign(O("mistakes_max", 1, "Finish with 1 mistake or fewer"), { strict: true }), "thinking|Inspection day. Barely any room for mistakes."],
    ["Rattling", 4, { hazards_only: ["counter_shake"], hazard_mult: 1.5 }, null, "worried|The counter won't stop shaking. Keep it steady!"],
    ["Rush Hour", 5, { force_modifier: "MOD-RUSH" }, null, "fists|Every order is a rush order!"],
    ["High Score", 3, {}, c => O("score_min", 5000 + c * 1500, `Score at least ${(5000 + c * 1500).toLocaleString("en-US")}`), "stars|Big tips today. Score as high as you can!"],
    ["Foggy", 6, { hazards_only: ["steam_burst"], hazard_mult: 1.4 }, null, "surprised|Steam everywhere! Remember where things were."],
    ["Frosty", 6, { hazards_only: ["ice_cube"], hazard_mult: 1.6 }, null, "fists|Ice cubes everywhere. Keep them off hot food!", "hot"],
    ["Tower", 6, { force_modifier: "MOD-TALL" }, null, "stars|Tall orders only. Build them high!"],
    ["Slick", 7, { force_modifier: "MOD-SLIP" }, c => O("collapses_max", 1, "1 collapse or fewer"), "worried|Slippery stacks. Small, careful moves."],
    ["Mopped", 8, { hazards_only: ["slippery_counter"], hazard_mult: 1.3 }, null, "surprised|Fresh mop, slippery counter. Correct early!"],
    ["Bumpy", 9, { hazards_only: ["moving_plate_event"], hazard_mult: 1.3 }, null, "worried|The cart's on a bumpy road. The plate won't sit still!"],
    ["Press", 12, {}, c => O("quick_presses", 3, "Make 3 Quick Presses"), "fists|Tap to press as fast as you can!", "press"]
  ];
  const quota = ch => ch === 1 ? 12 : ch <= 8 ? 22 : 21;   // with the 25 above: 12 + 7 x 22 + 4 x 21 = 250
  const handCount = {}; S.forEach(x => handCount[x[0]] = (handCount[x[0]] || 0) + 1);
  const rng = new SS.RNG(20261106);
  for (let ch = 1; ch <= 12; ch++) {
    const own = G[ch - 1], prev = G.slice(0, ch - 1);
    const menus = [[own]];
    prev.slice(-4).forEach(g => menus.push([own, g]));
    if (prev.length >= 2) menus.push(prev.slice(-2).concat([own]));
    if (prev.length >= 3) menus.push(G.slice(0, ch));   // everything so far
    const pairs = [];
    T.forEach(t => {
      if (t[1] > ch) return;
      if (t[2].hazards_only && HZ_CH[t[2].hazards_only[0]] > ch) return;
      menus.forEach(mn => {
        const pool = poolOf(mn);
        if (t[5] === "hot" && !pool.some(id => (SS.DATA.recipe_by_id[id].tags || []).indexOf("hot_food") >= 0)) return;
        if (t[5] === "press" && mn.indexOf("Ice cream sandwiches") < 0) return;
        if (t[2].force_modifier) {   // only menus where the twist actually changes most orders
          let hit = 0; pool.forEach((id, k) => { const o = SS.OrderBuilder.build(id, { rng: new SS.RNG(k + 11), chapter: ch, modifierChance: 0, forceModifier: t[2].force_modifier, allowChallengeOnly: true }); if (o.modifiers.some(x => x.family === t[2].force_modifier)) hit++; });
          if (hit < pool.length * 0.6) return;
        }
        pairs.push([t, mn]);
      });
    });
    // spread picks across twists: shuffle, then take round-robin by twist
    const byT = {}; rng.shuffle(pairs).forEach(p => (byT[p[0][0]] = byT[p[0][0]] || []).push(p));
    const order = rng.shuffle(Object.keys(byT)), picks = [], need = quota(ch) - (handCount[ch] || 0);
    for (let round = 0; picks.length < need && round < 20; round++) order.forEach(k => { if (picks.length < need && byT[k][round]) picks.push(byT[k][round]); });
    // small chapters (few menus to mix) top up with Deluxe versions: faster food and one more order
    rng.shuffle(pairs).forEach(([t, mn]) => { if (picks.length < need) picks.push([t, mn, true]); });
    picks.forEach(([t, mn, deluxe], k) => {
      const nOrders = Math.min(8, 3 + Math.floor(ch / 3) + (k % 3 === 2 ? 1 : 0) + (mn.length >= 4 ? 1 : 0) + (deluxe ? 1 : 0));
      const objs = [orders(nOrders)];
      const focus = t[3] ? t[3](ch) : perf(Math.min(20, 5 + ch + nOrders));
      objs.push(focus);
      if (k % 4 === 3 && focus.type !== "mistakes_max" && focus.type !== "collapses_max") objs.push(O("mistakes_max", 3, "Finish with 3 or fewer mistakes"));
      const ct = SS.DATA.chapters[ch - 1].title;
      const noun = mn.length === 1 ? NOUN[mn[0]] : mn.length === 2 ? NOUN[mn[0]] + " & " + NOUN[mn[1]] : mn.length >= 4 ? ct + " Grand Menu" : ct + " Platter";
      const rules = deluxe ? Object.assign({}, t[2], { tier_bonus: (t[2].tier_bonus || 0) + 1 }) : t[2];
      S.push([ch, (deluxe ? "Deluxe " : "") + t[0] + " " + noun, mn, rules, objs, t[4]]);
    });
  }
  S.sort((a, b) => a[0] - b[0]);
  const seenT = {}; S.forEach(x => { if (seenT[x[1]]) x[1] += " " + ["II", "III", "IV", "V"][seenT[x[1]]++ - 1]; else seenT[x[1]] = 1; });
  const last = {}; SS.DATA.missions.forEach(m => { if (m.number === 6) last[m.chapter] = m; });
  const per = {};
  SS.DATA.specials = S.map(([ch, title, groups, rules, objectives, line], i) => {
    const id = "sp" + String(i + 1).padStart(3, "0"), pid = "POOL-" + id.toUpperCase(), base = last[ch];
    SS.DATA.order_pools[pid] = poolOf(groups);
    per[ch] = (per[ch] || 0) + 1;
    return {
      id, special: true, chapter_id: base.chapter_id, chapter: ch, number: 6 + per[ch], special_number: per[ch], index: base.index, title,
      recipe_id: null, order_pool_id: pid, groups, rules, objectives, story_line: line,
      rewards: { coins: 420 + ch * 90, xp: 90 + ch * 16 }, first_clear_recipes: [], new_hazards: [], new_bonuses: [],
      tier: Math.min(5, base.tier), hazard_rate: base.hazard_rate, modifier_chance: base.modifier_chance, time_limit: null
    };
  });
  SS.DATA.specials.forEach(m => SS.DATA.mission_by_id[m.id] = m);
  return SS.DATA.specials;
};

// Hazards \u2014 13_MACHINE_READABLE/hazards.json + presentation/teaching copy (Bible 13).
// kind: "falling" objects use the shared falling-object lane; "event" = environmental/timed event.
SS.DATA.hazards = [
  { id: "wrapper_trash", display_name: "Wrapper", kind: "falling", category: "recognition_hazard", budget_cost: 1, motion_profile: "drift_left", effect: { caught: "mistake" }, first_chapter: 1, response: "AVOID IT!", teach: "Trash isn't food. Catching it counts as a mistake.", reinforce_hit: "Trash caught: mistake!", reinforce_avoid: "Trash dodged!" },
  { id: "grease_drop", display_name: "Hot Grease", kind: "falling", category: "falling_control_hazard", budget_cost: 2, motion_profile: "gentle_sway", effect: { food_contact: "messy", frozen_contact: "melted", surface_contact: "slippery" }, first_chapter: 3, response: "AVOID IT!", teach: "Hot grease melts frozen desserts and makes other food messy. You can still serve it for less.", reinforce_hit: "Greased! Meal quality dropped.", reinforce_avoid: "Grease dodged!" },
  { id: "slime_blob", display_name: "Slime Blob", kind: "falling", category: "falling_hazard", budget_cost: 1, motion_profile: "gentle_sway", effect: { food_contact: "contaminated", surface_contact: "slippery" }, first_chapter: 1, response: "AVOID IT!", teach: "Slime ruins food. A slimed meal can't be served and must be remade.", reinforce_hit: "Slimed! That meal is ruined.", reinforce_avoid: "Slime dodged!" },
  { id: "ice_cube", display_name: "Ice Cube", kind: "falling", category: "meal_quality_hazard", budget_cost: 1, motion_profile: "gentle_sway", requires_recipe_tags: ["hot_food"], effect: { food_contact: "cold" }, first_chapter: 6, response: "AVOID IT!", teach: "Ice makes hot food Cold. You can serve it for less, or remake it.", reinforce_hit: "Brr! The meal went Cold.", reinforce_avoid: "Ice dodged!" },
  { id: "bug", display_name: "Bug", kind: "falling", category: "moving_falling_hazard", budget_cost: 1, motion_profile: "weave_medium", effect: { food_contact: "contaminated" }, first_chapter: 2, response: "AVOID IT!", teach: "Bugs zig-zag as they fly. If one lands on the food, it's ruined.", reinforce_hit: "Bugged! That meal is ruined.", reinforce_avoid: "Bug dodged!" },
  { id: "gust_wind", display_name: "Gust of Wind", kind: "event", category: "environmental_event", budget_cost: 2, duration: 3.2, telegraph: 1.4, strength: 150, first_chapter: 2, response: "WATCH THE DRIFT!", teach: "Arrows warn you first. Then the wind pushes everything falling sideways.", reinforce_hit: "Gust passed!", reinforce_avoid: "Gust passed!" },
  { id: "steam_burst", display_name: "Steam Burst", kind: "event", category: "information_event", budget_cost: 3, duration: 3.0, telegraph: 1.2, first_chapter: 6, conflicts: ["MOD-MYSTERY"], response: "REMEMBER POSITIONS!", teach: "Steam hides part of the kitchen for a moment. Track food before it fades.", reinforce_hit: "Steam cleared!", reinforce_avoid: "Steam cleared!" },
  { id: "counter_shake", display_name: "Counter Shake", kind: "event", category: "precision_event", budget_cost: 2, duration: 1.6, telegraph: 1.3, first_chapter: 4, response: "STEADY!", teach: "The counter rattles and nudges your stack. Tall, messy stacks lose stability.", reinforce_hit: "Shake survived!", reinforce_avoid: "Shake survived!" },
  { id: "slippery_counter", display_name: "Slippery Counter", kind: "event", category: "control_event", budget_cost: 3, duration: 5.0, telegraph: 1.2, first_chapter: 8, conflicts: ["moving_plate_event"], response: "PLATE SLIDES!", teach: "The plate keeps sliding after you move it. Make small, early moves.", reinforce_hit: "Grip is back!", reinforce_avoid: "Grip is back!" },
  { id: "moving_plate_event", display_name: "Moving Plate", kind: "event", category: "target_event", budget_cost: 2, duration: 5.0, telegraph: 1.2, first_chapter: 9, conflicts: ["slippery_counter"], response: "PLATE ON THE MOVE!", teach: "The cart wobbles and slides your plate on its own. Correct against it.", reinforce_hit: "Cart steady again!", reinforce_avoid: "Cart steady again!" }
];
SS.DATA.hazard_by_id = {};
SS.DATA.hazards.forEach(h => SS.DATA.hazard_by_id[h.id] = h);

// Bonuses \u2014 13_MACHINE_READABLE/bonuses.json + teaching copy.
SS.DATA.bonuses = [
  { id: "score_star", display_name: "Score Star", effect_type: "add_score", value: 250, category: "instant", first_chapter: 1, teach: "Stars add bonus points. Catch them!", reinforce: "+250 points!" },
  { id: "time_boost", display_name: "Time Boost", effect_type: "add_time", value: 5.0, category: "instant", first_chapter: 1, timed_only: true, teach: "Clocks add 5 seconds to the timer. Catch them!", reinforce: "+5 seconds!" },
  { id: "coin_burst", display_name: "Coin Burst", effect_type: "add_run_coins", value: 15, category: "instant", first_chapter: 2, teach: "Coin bags add Coins to this run's reward.", reinforce: "+15 Coins!" },
  { id: "slow_time", display_name: "Slow Time", effect_type: "fall_speed_multiplier", value: 0.72, duration: 5.0, category: "temporary", first_chapter: 3, teach: "Slows everything falling for 5 seconds.", reinforce: "Slow motion!" },
  { id: "wide_catch", display_name: "Wide Catch", effect_type: "precision_tolerance_multiplier", value: 1.25, duration: 6.0, category: "temporary", first_chapter: 4, teach: "Perfects are easier to land for 6 seconds.", reinforce: "Wide Catch on!" },
  { id: "hazard_shield", display_name: "Hazard Shield", effect_type: "block_hazard_once", value: 1, category: "temporary", first_chapter: 4, teach: "Blocks the next hazard that hits your meal.", reinforce: "Shield ready!" },
  { id: "combo_shield", display_name: "Combo Shield", effect_type: "protect_combo_once", value: 1, category: "temporary", first_chapter: 5, teach: "Your combo survives the next mistake.", reinforce: "Combo protected!" }
];
SS.DATA.bonus_by_id = {};
SS.DATA.bonuses.forEach(b => SS.DATA.bonus_by_id[b.id] = b);

// Daily Challenge presets drawn from challenge_conditions.json (Bible 13 condition library).
SS.DATA.daily_presets = [
  { id: "rush_hour", name: "Rush Hour", desc: "Faster food and quicker spawns. 75 seconds.", tier_bonus: 2, start_time: 75, fall_mult: 1.1 },
  { id: "precision_service", name: "Precision Service", desc: "Only Perfect and Good drops score. Tighter catches.", precision_mult: 0.9, score_only_clean: true, start_time: 80 },
  { id: "three_strikes", name: "Three Strikes", desc: "Three mistakes ends it. No timer.", no_timer: true, hearts: 3 },
  { id: "tall_orders", name: "Tall Orders", desc: "Every order is a Tall Order.", force_modifier: "MOD-TALL", start_time: 90 },
  { id: "mixed_menu", name: "Mixed Menu", desc: "Every unlocked recipe, plus more decoys.", decoy_bonus: 0.15, start_time: 80 },
  { id: "special_requests", name: "Special Requests", desc: "Every order has a customer request.", modifier_chance: 1.0, start_time: 80 },
  { id: "perfect_chain", name: "Perfect Chain", desc: "Perfect streaks pay double.", streak_mult: 2, start_time: 75 },
  { id: "mystery_menu", name: "Mystery Menu", desc: "You only see the next layer of each order.", force_modifier: "MOD-MYSTERY", start_time: 85 }
];
