// ============================================
// CAFFEINE CALCULATOR CORE MATH ENGINE
// All formulas from @EQUATIONS.md
// ============================================

/**
 * EQUATION 1.1: Calculate concentration at any time
 * C(t) = C_max × e^(-k × t)
 * 
 * @param {number} c_max - Peak concentration (µg/mL)
 * @param {number} k - Elimination rate constant (hr⁻¹)
 * @param {number} hours - Time since peak (hours)
 * @returns {number} Concentration at time t (µg/mL)
 */
function concentrationAtTime(c_max, k, hours) {
    if (hours < 0) return 0;
    return c_max * Math.exp(-k * hours);
  }
  
  /**
   * EQUATION 1.2: Calculate elimination rate constant from half-life
   * k = 0.693 / t½
   * 
   * @param {number} halfLife - Half-life (hours)
   * @returns {number} Elimination constant k (hr⁻¹)
   */
  function calculateK(halfLife) {
    return COEFFICIENTS.LN_2 / halfLife;
  }
  
  /**
   * EQUATION 1.3: Calculate peak plasma concentration
   * C_max = (Dose × 1.65) / Body_weight_kg
   * 
   * @param {number} dose - Caffeine dose (mg)
   * @param {number} bodyWeight - Body weight (kg)
   * @returns {number} Peak concentration (µg/mL)
   */
  function calculatePeakConcentration(dose, bodyWeight) {
    return (dose * COEFFICIENTS.PEAK_COEFFICIENT) / bodyWeight;
  }
  
  /**
   * EQUATION 2.1: Get time to peak (Tmax) adjusted for food
   * 
   * @param {string} foodStatus - "fasting", "light_meal", "moderate_meal", "heavy_meal"
   * @returns {number} Time to peak (minutes)
   */
  function getTimeToMaxConcentration(foodStatus) {
    return TMAX_ADJUSTMENTS[foodStatus] || TMAX_ADJUSTMENTS.fasting;
  }
  
  /**
   * EQUATION 3.1: Calculate half-life adjusted for sex
   * 
   * @param {string} sex - "male" or "female"
   * @param {boolean} onContraceptives - Is user on oral contraceptives?
   * @param {string} metabolizerType - "fast", "intermediate", "slow"
   * @returns {number} Adjusted half-life (hours)
   */
  function calculateHalfLife(sex, onContraceptives = false, metabolizerType = "intermediate") {
    let baseFactor = HALFLIFE_MODIFIERS[sex] || HALFLIFE_MODIFIERS.male;
    
    // Add contraceptive adjustment if applicable
    if (sex === "female" && onContraceptives) {
      baseFactor = HALFLIFE_MODIFIERS.female_contraceptives;
    }
    
    // Apply metabolizer type
    const metabolizerFactor = METABOLIZER_FACTORS[metabolizerType] || METABOLIZER_FACTORS.intermediate;
    
    // Final half-life = base (male 4.0) × sex modifier × metabolizer modifier
    return HALFLIFE_BASE_MALE * baseFactor * metabolizerFactor;
  }
  
  /**
   * EQUATION 2.2: Find time when concentration drops to a target level
   * t = ln(C_max / C_target) / k
   * 
   * @param {number} c_max - Peak concentration (µg/mL)
   * @param {number} k - Elimination constant (hr⁻¹)
   * @param {number} targetLevel - Target concentration (µg/mL)
   * @returns {number} Time to reach target (hours from peak)
   */
  function timeToTargetLevel(c_max, k, targetLevel) {
    if (c_max <= targetLevel) return 0;
    return Math.log(c_max / targetLevel) / k;
  }
  
  /**
   * EQUATION 6.1: Classify concentration into sleep zone
   * 
   * @param {number} concentration - Caffeine concentration (µg/mL)
   * @returns {object} Zone info {label, color, description, ...}
   */
  function classifyZone(concentration) {
    if (concentration < SAFE_THRESHOLD) {
      return SLEEP_ZONES.GREEN;
    } else if (concentration < CAUTION_THRESHOLD) {
      return SLEEP_ZONES.YELLOW;
    } else if (concentration < WARNING_THRESHOLD) {
      return SLEEP_ZONES.ORANGE;
    } else if (concentration < DANGER_THRESHOLD) {
      return SLEEP_ZONES.RED;
    } else {
      return SLEEP_ZONES.DARK_RED;
    }
  }
  
  /**
   * MAIN CALCULATION: Generate full caffeine curve for 24 hours
   * 
   * @param {object} params - User input parameters
   * @returns {object} Complete calculation results
   */
  function generateCaffeineCurve(params) {
    const {
      dose,           // mg
      bodyWeight,     // kg
      sex,            // "male" or "female"
      foodStatus,     // "fasting", "light_meal", etc
      onContraceptives,
      metabolizerType,
      currentHour,    // 0-23 (current time)
      bedtimeHour     // 0-23 (target bedtime)
    } = params;
  
    // STEP 1: Calculate peak concentration
    const c_max = calculatePeakConcentration(dose, bodyWeight);
    
    // STEP 2: Calculate half-life and k
    const halfLife = calculateHalfLife(sex, onContraceptives, metabolizerType);
    const k = calculateK(halfLife);
    
    // STEP 3: Get time to peak (in minutes, convert to hours)
    const tmax_minutes = getTimeToMaxConcentration(foodStatus);
    const tmax_hours = tmax_minutes / 60;
    
    // STEP 4: Generate curve for 24 hours
    const curve = {};
    for (let hour = 0; hour <= 24; hour++) {
      if (hour < tmax_hours) {
        // ABSORPTION PHASE: linear approximation
        curve[hour] = (c_max / tmax_hours) * hour;
      } else {
        // ELIMINATION PHASE: exponential decay
        const timeSincePeak = hour - tmax_hours;
        curve[hour] = concentrationAtTime(c_max, k, timeSincePeak);
      }
      // Ensure non-negative
      curve[hour] = Math.max(0, curve[hour]);
    }
    
    // STEP 5: Calculate concentration at bedtime
    let hoursSincePeak = bedtimeHour - currentHour;
    if (hoursSincePeak < 0) hoursSincePeak += 24; // Next day
    
    let concentrationAtBedtime;
    if (hoursSincePeak < tmax_hours) {
      concentrationAtBedtime = (c_max / tmax_hours) * hoursSincePeak;
    } else {
      concentrationAtBedtime = concentrationAtTime(c_max, k, hoursSincePeak - tmax_hours);
    }
    
    // STEP 6: Classify zone at bedtime
    const zoneAtBedtime = classifyZone(concentrationAtBedtime);
    
    // STEP 7: Calculate time to reach safe threshold (<0.5 µg/mL)
    let timeToSafe = timeToTargetLevel(c_max, k, SAFE_THRESHOLD);
    timeToSafe += tmax_hours; // Add absorption phase
    
    // STEP 8: Calculate recommended cutoff time
    const cutoffTime = (currentHour - tmax_hours + timeToSafe) % 24;
    
    // RETURN everything
    return {
      // Raw values
      dose,
      bodyWeight,
      sex,
      halfLife,
      k,
      
      // Peak info
      c_max,
      tmax_minutes,
      tmax_hours,
      
      // Curve data
      curve,
      
      // At bedtime
      concentrationAtBedtime: Math.round(concentrationAtBedtime * 100) / 100,
      zoneAtBedtime,
      
      // Recommendations
      timeToSafe: Math.round(timeToSafe * 10) / 10,
      cutoffHour: Math.floor(cutoffTime),
      cutoffMinute: Math.round((cutoffTime % 1) * 60),
      
      // For UI
      recommendation: generateRecommendation(zoneAtBedtime, cutoffTime, bedtimeHour)
    };
  }
  
  /**
   * Generate human-readable recommendation
   */
  function generateRecommendation(zone, cutoffTime, bedtimeHour) {
    const cutoffHour = Math.floor(cutoffTime);
    const cutoffMin = Math.round((cutoffTime % 1) * 60);
    
    const timeStr = `${String(cutoffHour).padStart(2, '0')}:${String(cutoffMin).padStart(2, '0')}`;
    
    if (zone === SLEEP_ZONES.GREEN) {
      return `✅ ${zone.label}: You're in the safe zone! Sleep should be unaffected.`;
    } else if (zone === SLEEP_ZONES.YELLOW) {
      return `⚠️ ${zone.label}: You may experience lighter sleep. Cut caffeine by ${timeStr} to be safe.`;
    } else if (zone === SLEEP_ZONES.ORANGE) {
      return `🟠 ${zone.label}: REM sleep will be disrupted. Cut caffeine by ${timeStr}.`;
    } else if (zone === SLEEP_ZONES.RED) {
      return `🔴 ${zone.label}: Significant sleep disruption likely. Cut caffeine by ${timeStr}.`;
    } else {
      return `⛔ ${zone.label}: Severe sleep disruption. Don't take caffeine this close to bed!`;
    }
  }
  
  /**
   * EQUATION 5.1: Handle multiple doses (stacked caffeine)
   * C_total(t) = Σ [C_max_i × e^(-k × (t - t_i))]
   * 
   * @param {array} doses - Array of {time: hour, amount: mg}
   * @param {object} params - Same as generateCaffeineCurve
   * @returns {object} Cumulative curve
   */
  function generateMultipleDoseCurve(doses, params) {
    const halfLife = calculateHalfLife(params.sex, params.onContraceptives, params.metabolizerType);
    const k = calculateK(halfLife);
    
    const cumulativeCurve = {};
    
    for (let hour = 0; hour <= 24; hour++) {
      let totalConcentration = 0;
      
      // Sum contribution from each dose
      doses.forEach(dose => {
        if (hour >= dose.time) {
          const c_max = calculatePeakConcentration(dose.amount, params.bodyWeight);
          const timeSinceDose = hour - dose.time;
          const concentration = concentrationAtTime(c_max, k, timeSinceDose);
          totalConcentration += concentration;
        }
      });
      
      cumulativeCurve[hour] = Math.max(0, totalConcentration);
    }
    
    return cumulativeCurve;
  }


// ============================================
// CHART CONFIGURATION & HELPER FUNCTIONS
// ============================================

/**
 * Generate Chart.js plugin for zone background colors
 * Adds colored bands behind the graph based on sleep zones
 */
function getZoneBackgroundPlugin() {
    return {
        id: 'zoneBackground',
        afterDatasetsDraw(chart) {
            const ctx = chart.ctx;
            const yAxis = chart.scales.y;
            const xAxis = chart.scales.x;
            
            if (!yAxis || !xAxis) return;
            
            // Define zones (thresholds from SLEEP_THRESHOLDS.md)
            const zones = [
                { max: 0.5, color: ZONE_COLORS_RGBA.GREEN },
                { max: 1.0, color: ZONE_COLORS_RGBA.YELLOW },
                { max: 1.4, color: ZONE_COLORS_RGBA.ORANGE },
                { max: 2.5, color: ZONE_COLORS_RGBA.RED },
                { max: Infinity, color: ZONE_COLORS_RGBA.DARK_RED }
            ];

            let currentMax = 0;
            zones.forEach(zone => {
                const y1 = yAxis.getPixelForValue(currentMax);
                const y2 = yAxis.getPixelForValue(zone.max);
                
                ctx.fillStyle = zone.color;
                ctx.fillRect(xAxis.left, y2, xAxis.width, y1 - y2);
                
                currentMax = zone.max;
            });
        }
    };
}

/**
 * Calculate sleep disruption risk (0-100 scale) based on caffeine concentration
 * Used for dual-axis clearance chart
 */
function calculateSleepRisk(concentration) {
    // Map concentration to risk percentage
    if (concentration < 0.5) return 0;                                    // Safe
    if (concentration < 1.0) return Math.min(25, (concentration - 0.5) * 50);  // Caution
    if (concentration < 1.4) return Math.min(50, 25 + (concentration - 1.0) * 83);  // Warning
    if (concentration < 2.5) return Math.min(80, 50 + (concentration - 1.4) * 61);  // Not recommended
    return 100; // Danger
}

/**
 * Get timeline chart config with zone background and proper labels
 */
function getTimelineChartConfig(result) {
    const hours = Object.keys(result.curve).map(Number);
    const concentrations = hours.map(h => result.curve[h]);

    return {
        type: 'line',
        data: {
            labels: hours.map(h => h + 'h'),
            datasets: [{
                label: 'Caffeine Concentration',
                data: concentrations,
                borderColor: '#2c2c2c',
                backgroundColor: 'rgba(44, 44, 44, 0.05)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointBackgroundColor: '#d4a574'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                title: {
                    display: true,
                    text: '24-Hour Caffeine Timeline',
                    font: { size: 16, weight: '600' },
                    padding: 20,
                    color: '#2c2c2c'
                },
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: Math.ceil(result.c_max * 1.1),
                    title: {
                        display: true,
                        text: 'Concentration (µg/mL)',
                        font: { size: 12, weight: '500' },
                        color: '#2c2c2c'
                    },
                    ticks: {
                        callback: value => value.toFixed(1)
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Hours from Now',
                        font: { size: 12, weight: '500' },
                        color: '#2c2c2c'
                    }
                }
            }
        },
        plugins: [getZoneBackgroundPlugin()]
    };
}

/**
 * Get weight comparison chart config
 */
function getWeightChartConfig(result) {
    const weights = [40, 50, 60, 70, 80, 90, 100, 110, 120];
    const peaks = weights.map(w => (result.dose * COEFFICIENTS.PEAK_COEFFICIENT) / w);

    return {
        type: 'line',
        data: {
            labels: weights.map(w => w + ' kg'),
            datasets: [{
                label: 'Peak Concentration',
                data: peaks,
                borderColor: '#d4a574',
                backgroundColor: 'rgba(212, 165, 116, 0.05)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: weights.map(w => 
                    w === result.bodyWeight ? '#d4a574' : 'rgba(212, 165, 116, 0.3)'
                ),
                pointBorderColor: weights.map(w => 
                    w === result.bodyWeight ? '#d4a574' : '#ddd'
                ),
                pointBorderWidth: weights.map(w => 
                    w === result.bodyWeight ? 2.5 : 1
                )
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                title: {
                    display: true,
                    text: 'Peak Concentration vs Body Weight',
                    font: { size: 16, weight: '600' },
                    padding: 20,
                    color: '#2c2c2c'
                },
                subtitle: {
                    display: true,
                    text: 'Same dose creates different peaks at different weights'
                },
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Peak Concentration (µg/mL)',
                        font: { size: 12, weight: '500' },
                        color: '#2c2c2c'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Body Weight (kg)',
                        font: { size: 12, weight: '500' },
                        color: '#2c2c2c'
                    }
                }
            }
        }
    };
}

/**
 * Get clearance rate chart config (dual-axis: caffeine remaining % + sleep risk)
 */
function getClearanceChartConfig(result) {
    const hours = [];
    const percentages = [];
    const sleepRisks = [];
    
    for (let h = 0; h <= 24; h += 1) {
        hours.push(h);
        const remaining = Math.exp(-result.k * h) * 100;
        percentages.push(remaining);
        
        // Calculate sleep risk based on remaining caffeine converted to concentration
        const concentration = result.c_max * Math.exp(-result.k * h);
        sleepRisks.push(calculateSleepRisk(concentration));
    }

    return {
        type: 'line',
        data: {
            labels: hours.map(h => h + 'h'),
            datasets: [
                {
                    label: 'Remaining Caffeine (%)',
                    data: percentages,
                    borderColor: '#7a9b8e',
                    backgroundColor: 'rgba(122, 155, 142, 0.05)',
                    borderWidth: 2.5,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    yAxisID: 'y'
                },
                {
                    label: 'Sleep Disruption Risk (%)',
                    data: sleepRisks,
                    borderColor: '#d4a574',
                    backgroundColor: 'rgba(212, 165, 116, 0.05)',
                    borderWidth: 2.5,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    yAxisID: 'y1',
                    borderDash: [5, 5]  // Dashed line for second axis
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                title: {
                    display: true,
                    text: 'Caffeine Clearance Rate vs Sleep Risk',
                    font: { size: 16, weight: '600' },
                    padding: 20,
                    color: '#2c2c2c'
                },
                subtitle: {
                    display: true,
                    text: 'See how caffeine remaining correlates with sleep disruption risk'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Remaining Caffeine (%)',
                        font: { size: 12, weight: '500' },
                        color: '#7a9b8e'
                    }
                },
                y1: {
                    beginAtZero: true,
                    max: 100,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Sleep Risk (%)',
                        font: { size: 12, weight: '500' },
                        color: '#d4a574'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    };
}
  
  // Export for use in other files
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      concentrationAtTime,
      calculateK,
      calculatePeakConcentration,
      getTimeToMaxConcentration,
      calculateHalfLife,
      timeToTargetLevel,
      classifyZone,
      generateCaffeineCurve,
      generateRecommendation,
      generateMultipleDoseCurve,
      getZoneBackgroundPlugin,
      calculateSleepRisk,
      getTimelineChartConfig,
       getWeightChartConfig,
       getClearanceChartConfig
    };
  }
 