// ============================================
// CAFFEINE CALCULATOR CONSTANTS
// All data from @CAFFEINE_SCIENCE.md
// ============================================

// CAFFEINE CONTENT BY SOURCE (mg)
const CAFFEINE_SOURCES = {
    espresso: { mg: 63, label: "Espresso (1 shot)" },
    coffee_8oz: { mg: 95, label: "Coffee (8 oz)" },
    coffee_12oz: { mg: 143, label: "Coffee (12 oz)" },
    black_tea: { mg: 40, label: "Black tea (8 oz)" },
    green_tea: { mg: 30, label: "Green tea (8 oz)" },
    energy_drink: { mg: 80, label: "Energy drink (8 oz)" },
    cola: { mg: 35, label: "Cola (12 oz)" },
    caffeine_pill: { mg: 100, label: "Caffeine pill" },
  };
  
  // HALF-LIFE MODIFIERS (based on sex)
  // Base male half-life: 4.0 hours
  const HALFLIFE_BASE_MALE = 4.0;
  
  const HALFLIFE_MODIFIERS = {
    male: 1.0,
    female: 1.125,           // +12.5% from Abernethy & Todd
    female_contraceptives: 1.30, // +30%
  };
  
  // METABOLIZER TYPE (CYP1A2 genetics)
  const METABOLIZER_FACTORS = {
    fast: 0.875,        // AA genotype, -12.5%
    intermediate: 1.0,  // AC genotype, baseline
    slow: 1.375,        // CC genotype, +37.5%
  };
  
  // TIME TO PEAK (Tmax) ADJUSTMENTS - in minutes
  const TMAX_ADJUSTMENTS = {
    fasting: 45,
    light_meal: 45 + 15,      // +15 min
    moderate_meal: 45 + 30,   // +30 min
    heavy_meal: 45 + 60,      // +60 min
  };
  
  // PHARMACOKINETIC COEFFICIENTS
  const COEFFICIENTS = {
    BIOAVAILABILITY: 0.99,
    VOLUME_DIST_PER_KG: 0.6,  // L/kg
    PEAK_COEFFICIENT: 1.65,   // 0.99 / 0.6, combined
    LN_2: 0.693,              // Natural log of 2
    CLEARANCE_PER_KG: 0.08,   // L/hr/kg
  };
  
  // SLEEP DISRUPTION THRESHOLDS (from @SLEEP_THRESHOLDS.md)
  // All values in µg/mL (micrograms per milliliter)
  const SLEEP_ZONES = {
    GREEN: {
      min: 0,
      max: 0.5,
      label: "🟢 SAFE",
      color: "#4CAF50",
      description: "Minimal sleep impact",
      rem_impact: "Normal REM sleep",
      deep_sleep_impact: "Unaffected"
    },
    YELLOW: {
      min: 0.5,
      max: 1.0,
      label: "🟡 CAUTION",
      color: "#FFC107",
      description: "May delay sleep onset",
      rem_impact: "REM latency +10-20 min",
      deep_sleep_impact: "Slightly reduced"
    },
    ORANGE: {
      min: 1.0,
      max: 1.4,
      label: "🟠 WARNING",
      color: "#FF9800",
      description: "REM sleep disruption",
      rem_impact: "REM latency +30-60 min",
      deep_sleep_impact: "20-40% reduced"
    },
    RED: {
      min: 1.4,
      max: 2.5,
      label: "🔴 NOT RECOMMENDED",
      color: "#F44336",
      description: "Significant disruption",
      rem_impact: "Severely delayed",
      deep_sleep_impact: "50%+ reduced"
    },
    DARK_RED: {
      min: 2.5,
      max: Infinity,
      label: "⛔ AVOID",
      color: "#C62828",
      description: "Severe sleep disruption",
      rem_impact: "Extreme latency",
      deep_sleep_impact: "Nearly eliminated"
    }
  };
  
  // SLEEP ZONE THRESHOLDS (for quick lookup)
  const SAFE_THRESHOLD = 0.5;         // Green zone max
  const CAUTION_THRESHOLD = 1.0;      // Yellow zone max
  const WARNING_THRESHOLD = 1.4;      // Orange zone max (from Baur et al.)
  const DANGER_THRESHOLD = 2.5;       // Red zone max
  
  // Export for use in other files
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      CAFFEINE_SOURCES,
      HALFLIFE_BASE_MALE,
      HALFLIFE_MODIFIERS,
      METABOLIZER_FACTORS,
      TMAX_ADJUSTMENTS,
      COEFFICIENTS,
      SLEEP_ZONES,
      SAFE_THRESHOLD,
      CAUTION_THRESHOLD,
      WARNING_THRESHOLD,
      DANGER_THRESHOLD
    };
  }