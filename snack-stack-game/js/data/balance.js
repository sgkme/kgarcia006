// Snack Stack \u2014 balance & system configuration.
// Mirrors config/catch_stack_balance.json, config/catch_stack_spawn_tiers.json,
// config/catch_stack_mode_rules.json and 13_MACHINE_READABLE/*.json from the build kit.
// Godot port: each top-level key below maps 1:1 to a JSON file under res://config/.
window.SS = window.SS || {};
SS.DATA = SS.DATA || {};

SS.DATA.balance = {
  design_size: [1080, 1920],
  quality_thresholds: { perfect: 0.15, good: 0.35, messy: 0.60, danger: 0.80, tumble: 1.15 },
  base_points: { perfect: 100, good: 75, messy: 45, danger: 20, fall: 0 },
  precision_bonus_max: 20,
  plate: {
    y: 1668, min_x: 170, max_x: 910, support_half_width: 150, width: 330,
    follow_strength: 16.0, key_speed: 1500, assumed_player_speed: 1050, reaction_time: 0.35
  },
  spawn: {
    top_y: 360, left_x: 150, right_x: 930, base_fall_speed: 430, fairness_margin: 0.8,
    min_separation_x: 170, counter_y: 1720
  },
  stability: {
    start: 100, perfect_delta: 2, good_delta: -2, messy_delta: -8, danger_delta: -18,
    critical_threshold: 15, danger_threshold: 35, wobbly_threshold: 60, uneasy_threshold: 80,
    max_visual_lean_degrees: 8, critical_visual_lean_degrees: 11,
    near_fall_window_s: 5.0, collapse_layers: 2, post_collapse_stability: 55
  },
  recovery: { minimum_improvement_ratio: 0.25, bonus_points: 50, stability_bonus: 5 },
  near_fall: { save_bonus: 100 },
  combo: { tiers: [[0, 1.0], [3, 1.25], [6, 1.5], [10, 1.75], [15, 2.0]], max_multiplier: 2.0 },
  perfect_streak_milestones: { 3: 50, 5: 100, 8: 200 },
  perfect_order: { minimum_stability: 80, bonus_points: 500 },
  order_quality: { flawless: 95, clean: 85, solid: 70, rough: 50 },
  wrong_catch_endless_penalty: 50,
  quick_drop: { enabled: true, speed_multiplier: 2.75, tap_max_seconds: 0.22, drag_threshold_px: 24, hit_padding_px: 22, min_hit_half_h: 46 },
  skill_bonus: { perfect_streak_for_bonus: 4, clean_orders_for_shield: 3 },
  economy: {
    // Economy Bible \u00a75: run_coins = clamp(orders*12 + floor(score/400) + quality_bonus, 20, 250)
    coins_per_order: 12, coins_score_divisor: 400, coins_min: 20, coins_max: 250,
    xp_per_order: 8, xp_score_divisor: 800
  }
};

SS.DATA.spawn_tiers = [
  { id: 0, name: "intro",    max_active: 1, fall_speed_multiplier: 1.00, decoy_chance: 0.00, spawn_interval: 1.75, score_multiplier: 1.0 },
  { id: 1, name: "normal",   max_active: 2, fall_speed_multiplier: 1.05, decoy_chance: 0.10, spawn_interval: 1.55, score_multiplier: 1.1 },
  { id: 2, name: "busy",     max_active: 2, fall_speed_multiplier: 1.10, decoy_chance: 0.20, spawn_interval: 1.35, score_multiplier: 1.2 },
  { id: 3, name: "advanced", max_active: 3, fall_speed_multiplier: 1.18, decoy_chance: 0.30, spawn_interval: 1.18, score_multiplier: 1.35 },
  { id: 4, name: "expert",   max_active: 3, fall_speed_multiplier: 1.25, decoy_chance: 0.35, spawn_interval: 1.02, score_multiplier: 1.5 },
  { id: 5, name: "max",      max_active: 4, fall_speed_multiplier: 1.30, decoy_chance: 0.40, spawn_interval: 0.92, score_multiplier: 1.65 }
];

SS.DATA.mode_rules = {
  classic:  { display_name: "Classic", tagline: "Timed score run", start_time: 60, order_time_bonus: 9, perfect_time_bonus: 0.4, max_time: 99, hearts: 3, tier_time_seconds: [0, 45, 100, 170, 250, 340] },
  survival: { display_name: "Survival", tagline: "Endless waves", hearts: 3, heart_regen_clean_orders: 5, tier_orders: [0, 2, 5, 9, 14, 20] },
  story:    { display_name: "Story", tagline: "Mission chapters" },
  daily:    { display_name: "Daily Challenge", tagline: "New rules every day", unlock_mission: "ch01_m06" }
};

// 13_MACHINE_READABLE/movement_profiles.json (+3 provisional profiles, logged in DESIGN_CONFLICTS.md)
SS.DATA.motion_profiles = [
  { id: "straight",     type: "none",  amplitude_px: 0,   frequency_hz: 0,    drift_px_per_sec: 0,   quick_drop_amplitude_multiplier: 1.0, min_chapter: 1, weight_by_tier: [0.6, 0.2, 0.1, 0, 0, 0] },
  { id: "steady_intro", type: "sine",  amplitude_px: 18,  frequency_hz: 0.25, drift_px_per_sec: 0,   quick_drop_amplitude_multiplier: 0.9, min_chapter: 1, weight_by_tier: [1, 0.8, 0.4, 0.2, 0.1, 0.1] },
  { id: "gentle_sway",  type: "sine",  amplitude_px: 55,  frequency_hz: 0.42, drift_px_per_sec: 0,   quick_drop_amplitude_multiplier: 0.9, min_chapter: 1, weight_by_tier: [0.5, 1, 1, 0.8, 0.6, 0.5] },
  { id: "drift_left",   type: "drift", amplitude_px: 0,   frequency_hz: 0,    drift_px_per_sec: -62, quick_drop_amplitude_multiplier: 1.0, min_chapter: 2, weight_by_tier: [0, 0.4, 0.6, 0.7, 0.7, 0.7] },
  { id: "drift_right",  type: "drift", amplitude_px: 0,   frequency_hz: 0,    drift_px_per_sec: 62,  quick_drop_amplitude_multiplier: 1.0, min_chapter: 2, weight_by_tier: [0, 0.4, 0.6, 0.7, 0.7, 0.7] },
  { id: "weave_medium", type: "sine",  amplitude_px: 105, frequency_hz: 0.62, drift_px_per_sec: 0,   quick_drop_amplitude_multiplier: 0.88, min_chapter: 3, weight_by_tier: [0, 0, 0.5, 0.8, 1, 1] },
  { id: "zigzag",       type: "tri",   amplitude_px: 90,  frequency_hz: 0.5,  drift_px_per_sec: 0,   quick_drop_amplitude_multiplier: 0.85, min_chapter: 5, weight_by_tier: [0, 0, 0, 0.5, 0.8, 1] },
  { id: "late_swerve",  type: "late",  amplitude_px: 0,   frequency_hz: 0,    drift_px_per_sec: 120, quick_drop_amplitude_multiplier: 1.0, min_chapter: 6, late_start_ratio: 0.45, weight_by_tier: [0, 0, 0, 0.3, 0.6, 0.8] }
];

// 13_MACHINE_READABLE/difficulty_profiles.json (+ objective_scaling, provisional)
SS.DATA.difficulty_profiles = [
  { id: "normal", display_name: "Normal", story_canonical: true, fall_speed_multiplier: 1.0, horizontal_motion_multiplier: 1.0, decoy_frequency_multiplier: 1.0, hazard_frequency_multiplier: 1.0, bonus_frequency_multiplier: 1.0, telegraph_duration_multiplier: 1.0, precision_tolerance_multiplier: 1.0, recovery_window_multiplier: 1.0, modifier_frequency_multiplier: 1.0, challenge_budget_range: [1, 3], reward_multiplier: 1.0, tier_offset: 0,
    objective_scaling: { perfect_mult: 1.0, time_mult: 1.0, mistakes_delta: 0 } },
  { id: "hard", display_name: "Hard", story_canonical: false, fall_speed_multiplier: 1.12, horizontal_motion_multiplier: 1.15, decoy_frequency_multiplier: 1.25, hazard_frequency_multiplier: 1.45, bonus_frequency_multiplier: 0.8, telegraph_duration_multiplier: 0.85, precision_tolerance_multiplier: 0.93, recovery_window_multiplier: 0.82, modifier_frequency_multiplier: 1.25, challenge_budget_range: [3, 5], reward_multiplier: 1.35, tier_offset: 1,
    objective_scaling: { perfect_mult: 1.25, time_mult: 0.9, mistakes_delta: 0 } },
  { id: "extreme", display_name: "Extreme", story_canonical: false, unlock_rule: "complete_chapter_01_any_difficulty", fall_speed_multiplier: 1.24, horizontal_motion_multiplier: 1.3, decoy_frequency_multiplier: 1.5, hazard_frequency_multiplier: 1.8, bonus_frequency_multiplier: 0.6, telegraph_duration_multiplier: 0.72, precision_tolerance_multiplier: 0.88, recovery_window_multiplier: 0.65, modifier_frequency_multiplier: 1.5, challenge_budget_range: [5, 7], reward_multiplier: 1.75, tier_offset: 2,
    objective_scaling: { perfect_mult: 1.5, time_mult: 0.82, mistakes_delta: -1 } }
];

// 13_MACHINE_READABLE/meal_quality_states.json
SS.DATA.meal_quality_states = [
  { id: "fresh",        name: "Fresh",        servable: true,  reward_multiplier: 1.0,  quality_penalty: 0,   severity: 0 },
  { id: "messy",        name: "Messy",        servable: true,  reward_multiplier: 0.88, quality_penalty: 10,  severity: 1 },
  { id: "cold",         name: "Cold",         servable: true,  reward_multiplier: 0.8,  quality_penalty: 15,  severity: 2 },
  { id: "melted",       name: "Melted",       servable: true,  reward_multiplier: 0.78, quality_penalty: 18,  severity: 2 },
  { id: "crushed",      name: "Crushed",      servable: true,  reward_multiplier: 0.7,  quality_penalty: 25,  severity: 3 },
  { id: "contaminated", name: "Contaminated", servable: false, reward_multiplier: 0.0,  quality_penalty: 100, severity: 9 }
];
