// ============================================
// CAFFEINE CALCULATOR CORE MATH ENGINE
// All formulas from @EQUATIONS.md
// ============================================

/**
 * EQUATION 1.1: Caffeine concentration at any time after peak
 * C(t) = C_max × e^(-k × t)
 *
 * @param {number} c_max  - Peak concentration (µg/mL)
 * @param {number} k      - Elimination rate constant (hr⁻¹)
 * @param {number} hours  - Time since peak (hours)
 * @returns {number} Concentration at time t (µg/mL)
 */
function concentrationAtTime(c_max, k, hours) {
    if (hours < 0) return 0;
    return c_max * Math.exp(-k * hours);
}

/**
 * EQUATION 1.2: Elimination rate constant from half-life
 * k = ln(2) / t½
 *
 * @param {number} halfLife - Half-life (hours)
 * @returns {number} Elimination rate constant k (hr⁻¹)
 */
function calculateK(halfLife) {
    return COEFFICIENTS.LN_2 / halfLife;
}

/**
 * EQUATION 1.3: Peak plasma concentration
 * C_max = (Dose × 1.65) / Body_weight_kg
 * Where 1.65 = bioavailability (0.99) / volume of distribution (0.6 L/kg)
 *
 * @param {number} dose       - Caffeine dose (mg)
 * @param {number} bodyWeight - Body weight (kg)
 * @returns {number} Peak plasma concentration (µg/mL)
 */
function calculatePeakConcentration(dose, bodyWeight) {
    return (dose * COEFFICIENTS.PEAK_COEFFICIENT) / bodyWeight;
}

/**
 * EQUATION 2.1: Time to peak concentration (Tmax), adjusted for food
 * Food delays gastric emptying, which delays absorption.
 *
 * @param {string} foodStatus - "fasting" | "light_meal" | "moderate_meal" | "heavy_meal"
 * @returns {number} Time to peak (minutes)
 */
function getTimeToMaxConcentration(foodStatus) {
    return TMAX_ADJUSTMENTS[foodStatus] || TMAX_ADJUSTMENTS.fasting;
}

/**
 * EQUATION 3.1: Adjusted half-life based on sex, OCP use, and CYP1A2 genotype
 * half-life = HALFLIFE_BASE_MALE × sex_modifier × metabolizer_modifier
 *
 * Base male half-life: 5.0 hours (Grzegorzewski et al. 2021; Arnaud 2011).
 * Female modifier (no OCP): 1.0 — inherent sex difference is modest without OCP use.
 * OCP modifier: 1.70 — oral contraceptives roughly double caffeine half-life
 *   (Abernethy & Todd 1985; Patwardhan et al. 1980).
 * Smoking modifier: 0.5 — ~50% faster clearance (CYP1A2 induction).
 * Pregnancy modifier: 2.0 — ~2× longer half-life (simplified; Knutti et al. 1982).
 *
 * @param {string}  sex              - "male" | "female"
 * @param {boolean} onContraceptives - Whether the user is on oral contraceptives
 * @param {string}  metabolizerType  - "fast" | "intermediate" | "slow"
 * @param {boolean} [smoking=false]  - Whether the user smokes (faster clearance)
 * @param {boolean} [pregnancy=false] - Whether the user is pregnant (slower clearance)
 * @returns {number} Adjusted half-life (hours)
 */
function calculateHalfLife(sex, onContraceptives = false, metabolizerType = "intermediate", smoking = false, pregnancy = false) {
    let baseFactor = onContraceptives
        ? HALFLIFE_MODIFIERS.female_contraceptives
        : (HALFLIFE_MODIFIERS[sex || 'unspecified'] || HALFLIFE_MODIFIERS.unspecified);

    const metabolizerFactor = METABOLIZER_FACTORS[metabolizerType] || METABOLIZER_FACTORS.intermediate;
    if (smoking) baseFactor *= HALFLIFE_MODIFIERS.smoking;
    if (pregnancy) baseFactor *= HALFLIFE_MODIFIERS.pregnancy;

    return HALFLIFE_BASE_MALE * baseFactor * metabolizerFactor;
}

/**
 * Summarize PK modifier count and uncertainty messaging for combined lifestyle/hormonal factors.
 *
 * @param {object} opts
 * @param {boolean} opts.onContraceptives
 * @param {boolean} opts.smoking
 * @param {boolean} opts.pregnancy
 * @returns {object}
 */
function getPkUncertaintyInfo({ onContraceptives, smoking, pregnancy }) {
    const active = [];
    if (onContraceptives) active.push('oral contraceptives');
    if (smoking) active.push('smoking');
    if (pregnancy) active.push('pregnancy');

    const count = active.length;
    const showCombinedUncertainty = count >= 2;
    const showHealthRiskModal = onContraceptives && smoking && pregnancy;

    let uncertaintyMessage = null;
    if (smoking && pregnancy) {
        uncertaintyMessage =
            'Smoking and pregnancy have opposing effects on caffeine clearance in this simplified model, and their real-world interaction is complex and less studied. Your half-life estimate is less precise—discuss with a healthcare provider.';
    } else if (count >= 2) {
        uncertaintyMessage =
            `Multiple clearance factors selected (${active.join(', ')}). Combined effects are less predictable in this simplified model; treat the half-life as an approximate planning estimate.`;
    }

    return {
        activeFactors: active,
        factorCount: count,
        showCombinedUncertainty,
        showHealthRiskModal,
        uncertaintyMessage
    };
}

/**
 * EQUATION 2.2: Time to reach a target concentration level
 * t = ln(C_max / C_target) / k
 *
 * @param {number} c_max       - Peak concentration (µg/mL)
 * @param {number} k           - Elimination rate constant (hr⁻¹)
 * @param {number} targetLevel - Target concentration to reach (µg/mL)
 * @returns {number} Hours from peak until concentration drops to targetLevel
 */
function timeToTargetLevel(c_max, k, targetLevel) {
    if (c_max <= targetLevel) return 0;
    return Math.log(c_max / targetLevel) / k;
}

/**
 * EQUATION 6.1: Classify a plasma concentration into a sleep disruption zone
 *
 * @param {number} concentration - Caffeine plasma concentration (µg/mL)
 * @returns {object} Matching SLEEP_ZONES entry { label, color, description, ... }
 */
function classifyZone(concentration) {
    if (concentration < SAFE_THRESHOLD)      return SLEEP_ZONES.GREEN;
    if (concentration < CAUTION_THRESHOLD)   return SLEEP_ZONES.YELLOW;
    if (concentration < WARNING_THRESHOLD)   return SLEEP_ZONES.ORANGE;
    if (concentration < DANGER_THRESHOLD)    return SLEEP_ZONES.RED;
    return SLEEP_ZONES.DARK_RED;
}

const DOSE_UNCERTAINTY_LOW  = 0.8;
const DOSE_UNCERTAINTY_HIGH = 1.2;
const MAX_ADDITIONAL_DOSE_MG = 400;
const CURVE_STEP_HOURS = 0.5;

/**
 * Elapsed wall-clock hours from an intake to a target time (same calendar day).
 * Negative when the intake is later today than the target (not yet consumed).
 *
 * @param {number} targetHour  - Wall-clock hour to evaluate (decimal)
 * @param {number} intakeHour  - Wall-clock hour of intake (decimal)
 * @returns {number} Hours elapsed
 */
function hoursElapsedSameDay(targetHour, intakeHour) {
    return targetHour - intakeHour;
}

/**
 * Elapsed wall-clock hours from intake to bedtime (bedtime always forward in the day).
 *
 * @param {number} bedtimeHour - Target bedtime (decimal)
 * @param {number} intakeHour  - Wall-clock hour of intake (decimal)
 * @returns {number} Hours until bedtime from intake
 */
function hoursElapsedToBedtime(bedtimeHour, intakeHour) {
    return (bedtimeHour - intakeHour + 24) % 24;
}

/**
 * Concentration contribution from one intake at a given elapsed time since consumption.
 *
 * @param {number} amountMg     - Dose (mg)
 * @param {number} bodyWeight   - Body weight (kg)
 * @param {number} k            - Elimination rate constant (hr⁻¹)
 * @param {number} elapsedHours - Hours since intake (negative = not yet consumed)
 * @param {number} tmaxHours    - Time to peak (hours)
 * @returns {number} Concentration contribution (µg/mL)
 */
function concentrationFromSingleIntake(amountMg, bodyWeight, k, elapsedHours, tmaxHours) {
    if (elapsedHours < 0 || amountMg <= 0) return 0;
    const cMax = calculatePeakConcentration(amountMg, bodyWeight);
    if (elapsedHours < tmaxHours) {
        return (cMax / tmaxHours) * elapsedHours;
    }
    return concentrationAtTime(cMax, k, elapsedHours - tmaxHours);
}

/**
 * Sum stacked concentration at a wall-clock hour from all intakes (superposition).
 *
 * @param {number} wallClockHour - Time to evaluate (decimal, 0–23)
 * @param {Array<{amountMg: number, hour: number, foodStatus?: string}>} intakes
 * @param {object} params        - User PK parameters
 * @param {object} [options]
 * @param {number} [options.doseScale=1]           - Scale all intake amounts
 * @param {string} [options.metabolizerType]       - Override metabolizer for bounds
 * @param {boolean} [options.useBedtimeElapsed=false] - Use forward-to-bedtime elapsed
 * @returns {number} Total concentration (µg/mL)
 */
function totalConcentrationAt(wallClockHour, intakes, params, options = {}) {
    const {
        doseScale = 1,
        metabolizerType = params.metabolizerType,
        useBedtimeElapsed = false
    } = options;

    const halfLife = calculateHalfLife(
        params.sex,
        params.onContraceptives,
        metabolizerType,
        params.smoking,
        params.pregnancy
    );
    const k = calculateK(halfLife);
    const defaultFood = params.foodStatus || 'fasting';

    let total = 0;
    for (const intake of intakes) {
        const elapsed = useBedtimeElapsed
            ? hoursElapsedToBedtime(wallClockHour, intake.hour)
            : hoursElapsedSameDay(wallClockHour, intake.hour);
        const food = intake.foodStatus || defaultFood;
        const tmaxHours = getTimeToMaxConcentration(food) / 60;
        total += concentrationFromSingleIntake(
            intake.amountMg * doseScale,
            params.bodyWeight,
            k,
            elapsed,
            tmaxHours
        );
    }
    return Math.max(0, total);
}

/**
 * Build nominal and uncertainty concentration curves on a wall-clock window.
 *
 * @param {Array} intakes
 * @param {object} params
 * @param {number} curveStartHour - First wall-clock hour on the chart
 * @returns {{ curve: object, curveLow: object, curveHigh: object, peakConcentration: number }}
 */
function buildConcentrationCurves(intakes, params, curveStartHour) {
    const curve = {};
    const curveLow = {};
    const curveHigh = {};
    let peakConcentration = 0;

    for (let offset = 0; offset <= 24; offset += CURVE_STEP_HOURS) {
        const key = Math.round(offset * 10) / 10;
        const wallHour = curveStartHour + offset;
        const nominal = totalConcentrationAt(wallHour, intakes, params);
        const low = totalConcentrationAt(wallHour, intakes, params, {
            doseScale: DOSE_UNCERTAINTY_LOW,
            metabolizerType: 'fast'
        });
        const high = totalConcentrationAt(wallHour, intakes, params, {
            doseScale: DOSE_UNCERTAINTY_HIGH,
            metabolizerType: 'slow'
        });

        curve[key] = nominal;
        curveLow[key] = low;
        curveHigh[key] = high;
        peakConcentration = Math.max(peakConcentration, nominal);
    }

    return { curve, curveLow, curveHigh, peakConcentration };
}

/**
 * Max additional mg safe to take now given stacked intakes already logged.
 *
 * @param {Array} intakes
 * @param {object} params
 * @param {number} concentrationAtBedtime - Stacked bedtime level from existing intakes
 * @returns {number} Max additional dose (mg)
 */
function calculateMaxAdditionalDoseNow(intakes, params, concentrationAtBedtime) {
    const hoursNowToBedtime = (params.bedtimeHour - params.nowHour + 24) % 24;
    const tmaxHours = getTimeToMaxConcentration(params.foodStatus) / 60;

    if (hoursNowToBedtime <= tmaxHours) return 0;

    const halfLife = calculateHalfLife(
        params.sex,
        params.onContraceptives,
        params.metabolizerType,
        params.smoking,
        params.pregnancy
    );
    const k = calculateK(halfLife);
    const timePeakToBedtime = hoursNowToBedtime - tmaxHours;
    const roomAtBedtime = Math.max(0, SAFE_THRESHOLD - concentrationAtBedtime);

    if (roomAtBedtime <= 0) return 0;

    const maxCmaxAdditional = roomAtBedtime * Math.exp(k * timePeakToBedtime);
    let maxDoseNow = Math.max(0, Math.round(maxCmaxAdditional * params.bodyWeight / COEFFICIENTS.PEAK_COEFFICIENT));
    return Math.min(maxDoseNow, MAX_ADDITIONAL_DOSE_MG);
}

/**
 * MAIN CALCULATION: Generate the full caffeine curve and all derived outputs.
 * Supports multiple intakes via superposition (EQUATION 5.1).
 *
 * @param {object} params
 * @param {Array<{amountMg: number, hour: number, foodStatus?: string}>} params.intakes
 * @param {number}  params.bodyWeight
 * @param {string}  params.sex
 * @param {string}  params.foodStatus       - Default absorption context for intakes
 * @param {boolean} params.onContraceptives
 * @param {boolean} [params.smoking]
 * @param {boolean} [params.pregnancy]
 * @param {string}  params.metabolizerType
 * @param {number}  params.nowHour
 * @param {number}  params.bedtimeHour
 * @returns {object} Full results object
 */
function generateCaffeineCurve(params) {
    const {
        bodyWeight,
        sex,
        foodStatus,
        onContraceptives,
        smoking = false,
        pregnancy = false,
        metabolizerType,
        nowHour,
        bedtimeHour
    } = params;

    const intakes = (params.intakes || [])
        .filter(i => i.amountMg > 0)
        .map(i => ({
            amountMg: i.amountMg,
            hour: i.hour,
            foodStatus: i.foodStatus || foodStatus
        }));

    if (intakes.length === 0) {
        intakes.push({ amountMg: 0, hour: nowHour, foodStatus });
    }

    const pkParams = {
        bodyWeight, sex, foodStatus, onContraceptives, smoking, pregnancy,
        metabolizerType, nowHour, bedtimeHour
    };

    const halfLife = calculateHalfLife(sex, onContraceptives, metabolizerType, smoking, pregnancy);
    const pkUncertainty = getPkUncertaintyInfo({ onContraceptives, smoking, pregnancy });
    const k = calculateK(halfLife);
    const tmax_minutes = getTimeToMaxConcentration(foodStatus);
    const tmax_hours = tmax_minutes / 60;

    const intakeHours = intakes.map(i => i.hour);
    const curveStartHour = Math.floor(Math.min(...intakeHours, nowHour, bedtimeHour));
    const { curve, curveLow, curveHigh, peakConcentration } = buildConcentrationCurves(intakes, pkParams, curveStartHour);

    const concentrationAtBedtime = totalConcentrationAt(bedtimeHour, intakes, pkParams, { useBedtimeElapsed: true });
    const concentrationNow = totalConcentrationAt(nowHour, intakes, pkParams);
    const concentrationAtBedtimeLow = totalConcentrationAt(bedtimeHour, intakes, pkParams, {
        useBedtimeElapsed: true,
        doseScale: DOSE_UNCERTAINTY_LOW,
        metabolizerType: 'fast'
    });
    const concentrationAtBedtimeHigh = totalConcentrationAt(bedtimeHour, intakes, pkParams, {
        useBedtimeElapsed: true,
        doseScale: DOSE_UNCERTAINTY_HIGH,
        metabolizerType: 'slow'
    });
    const concentrationNowLow = totalConcentrationAt(nowHour, intakes, pkParams, {
        doseScale: DOSE_UNCERTAINTY_LOW,
        metabolizerType: 'fast'
    });
    const concentrationNowHigh = totalConcentrationAt(nowHour, intakes, pkParams, {
        doseScale: DOSE_UNCERTAINTY_HIGH,
        metabolizerType: 'slow'
    });

    const zoneAtBedtime = classifyZone(concentrationAtBedtime);
    const zoneNow = classifyZone(concentrationNow);

    const totalMg = intakes.reduce((sum, i) => sum + i.amountMg, 0);
    const pastIntakes = intakes.filter(i => hoursElapsedSameDay(nowHour, i.hour) >= 0);
    const futureIntakes = intakes.filter(i => hoursElapsedSameDay(nowHour, i.hour) < 0);
    const alreadyConsumed = pastIntakes.length > 0;
    const hasFutureIntakes = futureIntakes.length > 0;

    const consumptionTooLate = concentrationAtBedtime >= SAFE_THRESHOLD;
    const cutoffAlreadyPassed = alreadyConsumed && consumptionTooLate;

    const maxDoseNow = calculateMaxAdditionalDoseNow(intakes, pkParams, concentrationAtBedtime);

    const largestIntake = intakes.reduce((best, i) => (i.amountMg > best.amountMg ? i : best), intakes[0]);
    const c_max = calculatePeakConcentration(largestIntake.amountMg, bodyWeight);
    const consumptionHour = intakeHours.length ? Math.min(...intakeHours) : nowHour;

    return {
        intakes,
        totalMg,
        dose: totalMg,
        bodyWeight,
        sex,
        onContraceptives,
        smoking,
        pregnancy,
        metabolizerType,
        halfLife,
        pkUncertainty,
        k,
        c_max,
        peakConcentration,
        tmax_minutes,
        tmax_hours,
        curve,
        curveLow,
        curveHigh,
        curveStartHour,
        concentrationAtBedtime: Math.round(concentrationAtBedtime * 100) / 100,
        concentrationAtBedtimeLow: Math.round(concentrationAtBedtimeLow * 100) / 100,
        concentrationAtBedtimeHigh: Math.round(concentrationAtBedtimeHigh * 100) / 100,
        concentrationNow: Math.round(concentrationNow * 100) / 100,
        concentrationNowLow: Math.round(concentrationNowLow * 100) / 100,
        concentrationNowHigh: Math.round(concentrationNowHigh * 100) / 100,
        zoneAtBedtime,
        zoneNow,
        cutoffAlreadyPassed,
        consumptionTooLate,
        alreadyConsumed,
        hasFutureIntakes,
        maxDoseNow,
        recommendation: generateRecommendation(zoneAtBedtime, {
            alreadyConsumed,
            hasFutureIntakes,
            consumptionTooLate,
            maxDoseNow,
            concentrationNow,
            totalMg,
            intakeCount: intakes.length
        }),
        consumptionHour,
        nowHour,
        bedtimeHour,
    };
}

/**
 * Generate the plain-English recommendation shown in the results panel.
 *
 * @param {object} zone - SLEEP_ZONES entry at bedtime
 * @param {object} opts
 * @returns {string} Human-readable recommendation
 */
function generateRecommendation(zone, opts) {
    const {
        alreadyConsumed,
        hasFutureIntakes,
        consumptionTooLate,
        maxDoseNow,
        concentrationNow,
        totalMg,
        intakeCount
    } = opts;

    const intakeLabel = intakeCount === 1 ? '1 intake' : `${intakeCount} intakes`;

    function additionalCaffeineNote() {
        if (maxDoseNow > 0) {
            return ` Up to about ${maxDoseNow} mg more could still clear by bedtime.`;
        }
        if (alreadyConsumed && concentrationNow > 0) {
            return ' No additional caffeine is recommended before bedtime.';
        }
        return '';
    }

    if (hasFutureIntakes && !alreadyConsumed) {
        if (consumptionTooLate) {
            let msg = `Your planned ${totalMg} mg (${intakeLabel}) may leave levels above the lower concentration band at bedtime.`;
            if (maxDoseNow > 0) {
                msg += ` You could reduce planned doses or limit additional intake to about ${maxDoseNow} mg from now.`;
            }
            return msg;
        }
        if (zone === SLEEP_ZONES.GREEN) {
            return `Your planned ${totalMg} mg (${intakeLabel}) should clear to low estimated levels by bedtime.${additionalCaffeineNote()}`;
        }
        return `Your planned caffeine (${totalMg} mg, ${intakeLabel}) may leave some active at bedtime.${additionalCaffeineNote()}`;
    }

    if (zone === SLEEP_ZONES.GREEN) {
        return `Your ${totalMg} mg today (${intakeLabel}) should clear before bedtime. Estimated concentration at that time is low.${additionalCaffeineNote()}`;
    }

    if (alreadyConsumed && consumptionTooLate) {
        return `Based on your ${totalMg} mg across ${intakeLabel}, caffeine likely won't fully clear before bedtime.${additionalCaffeineNote()}`;
    }

    if (zone === SLEEP_ZONES.YELLOW) {
        return `Some caffeine from today's ${intakeLabel} (${totalMg} mg) will still be active at bedtime.${additionalCaffeineNote()}`;
    }
    if (zone === SLEEP_ZONES.ORANGE) {
        return `Caffeine levels will still be noticeable at bedtime from your ${totalMg} mg (${intakeLabel}).${additionalCaffeineNote()}`;
    }
    if (zone === SLEEP_ZONES.RED) {
        return `Caffeine levels will be high at bedtime from today's ${totalMg} mg (${intakeLabel}).${additionalCaffeineNote()}`;
    }
    return `Caffeine levels will be very high at bedtime from your ${totalMg} mg (${intakeLabel}).${additionalCaffeineNote()}`;
}


// ============================================
// CHART CONFIGURATION & HELPER FUNCTIONS
// ============================================

/**
 * Plain-language bedtime interpretation tied to cited research.
 * No synthetic scores; no exact REM/deep-sleep predictions.
 *
 * @param {object} result - Output of generateCaffeineCurve
 * @returns {object} Panel content fields
 */
function getBedtimeOutcome(result) {
    const conc = result.concentrationAtBedtime;
    const low = result.concentrationAtBedtimeLow;
    const high = result.concentrationAtBedtimeHigh;
    const zone = result.zoneAtBedtime;

    let interpretation;
    if (conc < SAFE_THRESHOLD) {
        interpretation = 'Sleep disruption is less likely at this estimated level. Individual sensitivity still varies.';
    } else if (conc < CAUTION_THRESHOLD) {
        interpretation = 'Small sleep effects are possible; sensitive individuals may notice changes.';
    } else if (conc < WARNING_THRESHOLD) {
        interpretation = 'Measurable sleep effects become more common in research at this level.';
    } else if (conc < DANGER_THRESHOLD) {
        interpretation = 'Greater likelihood of sleep disruption in population averages at this level.';
    } else {
        interpretation = 'Higher likelihood of substantial sleep disruption in population averages.';
    }

    return {
        concentration: conc,
        rangeLow: low,
        rangeHigh: high,
        zoneLabel: zone.label.replace(' estimated level', ''),
        interpretation
    };
}

/**
 * Build percent-remaining curve points for a given half-life.
 *
 * @param {number} halfLife - Half-life in hours
 * @param {number} [maxHours=12]
 * @returns {{ hours: number[], percentages: number[] }}
 */
function buildClearanceCurve(halfLife, maxHours = 12) {
    const k = calculateK(halfLife);
    const hours = [];
    const percentages = [];
    for (let h = 0; h <= maxHours; h++) {
        hours.push(h);
        percentages.push(Math.exp(-k * h) * 100);
    }
    return { hours, percentages };
}

/**
 * Percent caffeine remaining at 4, 8, and 12 hours after a hypothetical peak.
 *
 * @param {number} halfLife - Half-life in hours
 * @returns {{ h4: number, h8: number, h12: number }}
 */
function getRemainingAfterPeak(halfLife) {
    const { percentages } = buildClearanceCurve(halfLife);
    return {
        h4: percentages[4],
        h8: percentages[8],
        h12: percentages[12]
    };
}

/**
 * Build the Chart.js plugin that draws colored zone bands behind a chart.
 * Each band corresponds to a SLEEP_ZONES threshold range.
 * Colors are defined locally (not referenced from constants) to avoid a
 * scope/timing bug where the Chart.js callback fires before globals are ready.
 *
 * @returns {object} Chart.js plugin object (id: "zoneBackground")
 */
function getZoneBackgroundPlugin() {
    const colors = {
        GREEN:    'rgba(122, 155, 142, 0.1)',
        YELLOW:   'rgba(201, 165, 112, 0.1)',
        ORANGE:   'rgba(201, 165, 112, 0.15)',
        RED:      'rgba(168, 112, 112, 0.1)',
        DARK_RED: 'rgba(139, 90, 90, 0.12)'
    };

    return {
        id: 'zoneBackground',
        afterDatasetsDraw(chart) {
            const ctx   = chart.ctx;
            const yAxis = chart.scales.y;
            const xAxis = chart.scales.x;
            if (!yAxis || !xAxis) return;

            const zones = [
                { max: 0.5,      color: colors.GREEN },
                { max: 1.0,      color: colors.YELLOW },
                { max: 1.4,      color: colors.ORANGE },
                { max: 2.5,      color: colors.RED },
                { max: Infinity, color: colors.DARK_RED }
            ];

            let prevMax = 0;
            zones.forEach(zone => {
                const y1 = yAxis.getPixelForValue(prevMax);
                const y2 = yAxis.getPixelForValue(zone.max);
                ctx.fillStyle = zone.color;
                ctx.fillRect(xAxis.left, y2, xAxis.right - xAxis.left, y1 - y2);
                prevMax = zone.max;
            });
        }
    };
}

/**
 * Build the Chart.js plugin that draws a dashed vertical line at the target bedtime.
 *
 * @param {object} result - Output of generateCaffeineCurve
 * @returns {object} Chart.js plugin object (id: "bedtimeLine")
 */
function getBedtimeLinePlugin(result) {
    return {
        id: 'bedtimeLine',
        afterDraw(chart) {
            const xScale = chart.scales.x;
            const yScale = chart.scales.y;
            if (!xScale || !yScale) return;

            const offset = (result.bedtimeHour - result.curveStartHour + 24) % 24;
            if (offset > 24) return;

            const xPos = xScale.getPixelForValue(offset);
            if (xPos < xScale.left || xPos > xScale.right) return;

            const ctx = chart.ctx;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(xPos, yScale.top);
            ctx.lineTo(xPos, yScale.bottom);
            ctx.strokeStyle = '#d4a574';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 4]);
            ctx.stroke();
            ctx.fillStyle = '#d4a574';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Bedtime', xPos, yScale.top - 6);
            ctx.restore();
        }
    };
}

/**
 * Build the Chart.js plugin that draws a solid vertical line at the actual current time.
 *
 * @param {object} result - Output of generateCaffeineCurve
 * @returns {object} Chart.js plugin object (id: "nowLine")
 */
function getNowLinePlugin(result) {
    return {
        id: 'nowLine',
        afterDraw(chart) {
            const xScale = chart.scales.x;
            const yScale = chart.scales.y;
            if (!xScale || !yScale) return;

            const offset = result.nowHour - result.curveStartHour;
            if (offset < 0 || offset > 24) return;

            const xPos = xScale.getPixelForValue(offset);
            if (xPos < xScale.left || xPos > xScale.right) return;

            const ctx = chart.ctx;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(xPos, yScale.top);
            ctx.lineTo(xPos, yScale.bottom);
            ctx.strokeStyle = '#7a9b8e';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([]);
            ctx.stroke();
            ctx.fillStyle = '#7a9b8e';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Now', xPos, yScale.top - 6);
            ctx.restore();
        }
    };
}

/**
 * Draw vertical markers at each logged intake time on the timeline chart.
 *
 * @param {object} result - Output of generateCaffeineCurve
 * @returns {object} Chart.js plugin object (id: "intakeMarkers")
 */
function getIntakeMarkersPlugin(result) {
    return {
        id: 'intakeMarkers',
        afterDraw(chart) {
            const xScale = chart.scales.x;
            const yScale = chart.scales.y;
            if (!xScale || !yScale || !result.intakes) return;

            const ctx = chart.ctx;
            ctx.save();
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';

            result.intakes.forEach((intake, idx) => {
                const offset = intake.hour - result.curveStartHour;
                if (offset < 0 || offset > 24) return;

                const xPos = xScale.getPixelForValue(offset);
                if (xPos < xScale.left || xPos > xScale.right) return;

                ctx.beginPath();
                ctx.moveTo(xPos, yScale.bottom - 4);
                ctx.lineTo(xPos, yScale.bottom);
                ctx.strokeStyle = '#999';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#888';
                ctx.fillText(`${intake.amountMg}mg`, xPos, yScale.bottom + 12);
            });

            ctx.restore();
        }
    };
}

/**
 * Convert a decimal hour value to a 12-hour wall-clock string.
 * e.g. 14.5 → "2:30 PM"
 *
 * @param {number} decimalHour - Hour in decimal form (0–47 supported for next-day times)
 * @returns {string} Formatted time string, e.g. "2:30 PM"
 */
function formatWallClock(decimalHour) {
    const total = decimalHour % 24;
    const h = Math.floor(total);
    let m = Math.round((total % 1) * 60);
    let adjH = h;
    if (m === 60) { m = 0; adjH = (h + 1) % 24; }
    const period  = adjH >= 12 ? 'PM' : 'AM';
    const display = adjH % 12 || 12;
    return `${display}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Build the Chart.js config for the 24-hour concentration timeline.
 * X-axis ticks show both wall-clock time and hours-after-consumption.
 * Plugins: zone background bands, bedtime marker, "Now" marker.
 *
 * @param {object} result - Output of generateCaffeineCurve
 * @returns {object} Chart.js config object
 */
function getTimelineChartConfig(result) {
    const offsets        = Object.keys(result.curve).map(Number).sort((a, b) => a - b);
    const toPoints       = (values) => offsets.map((offset, i) => ({ x: offset, y: values[i] }));
    const concentrations = offsets.map(h => result.curve[h]);
    const curveLow       = offsets.map(h => result.curveLow[h]);
    const curveHigh      = offsets.map(h => result.curveHigh[h]);
    const baurThreshold = typeof BAUR_DELTA_POWER_THRESHOLD !== 'undefined'
        ? BAUR_DELTA_POWER_THRESHOLD
        : WARNING_THRESHOLD;
    const yMax = Math.ceil(Math.max(...curveHigh, result.peakConcentration, baurThreshold) * 1.15);
    const baurLinePoints = [{ x: 0, y: baurThreshold }, { x: 24, y: baurThreshold }];

    return {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Uncertainty range',
                    data: toPoints(curveHigh),
                    borderColor: 'transparent',
                    backgroundColor: 'rgba(212, 165, 116, 0.22)',
                    borderWidth: 0,
                    fill: '+1',
                    tension: 0.4,
                    pointRadius: 0,
                    order: 4
                },
                {
                    label: 'Lower bound',
                    data: toPoints(curveLow),
                    borderColor: 'transparent',
                    backgroundColor: 'transparent',
                    borderWidth: 0,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    order: 3
                },
                {
                    label: 'Estimated concentration',
                    data: toPoints(concentrations),
                    borderColor: '#2c2c2c',
                    backgroundColor: 'rgba(44, 44, 44, 0.05)',
                    borderWidth: 2.5,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#d4a574',
                    order: 2
                },
                {
                    label: 'Baur line (~1.4 µg/mL)',
                    data: baurLinePoints,
                    borderColor: '#a87070',
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderDash: [8, 4],
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            parsing: false,
            layout: { padding: { bottom: 18 } },
            interaction: { mode: 'index', intersect: false },
            plugins: {
                title: {
                    display: true,
                    text: '24-Hour Caffeine Timeline',
                    font: { size: 16, weight: '600' },
                    padding: 20,
                    color: '#2c2c2c'
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        filter: item => !item.text.includes('Lower bound'),
                        boxWidth: 12,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    filter: item => item.dataset.label !== 'Baur line (~1.4 µg/mL)',
                    callbacks: {
                        title(items) {
                            const offset = items[0].parsed.x;
                            return formatWallClock(result.curveStartHour + offset);
                        },
                        label(item) {
                            if (item.dataset.label === 'Baur line (~1.4 µg/mL)') {
                                return null;
                            }
                            const y = item.parsed.y;
                            return `Estimated: ${y.toFixed(2)} µg/mL`;
                        },
                        afterBody(items) {
                            const idx = items[0].dataIndex;
                            const low = curveLow[idx].toFixed(2);
                            const high = curveHigh[idx].toFixed(2);
                            return `Uncertainty range: ${low}–${high} µg/mL`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: yMax,
                    title: {
                        display: true,
                        text: 'Concentration (µg/mL)',
                        font: { size: 12, weight: '500' },
                        color: '#2c2c2c'
                    },
                    ticks: { callback: value => value.toFixed(1) }
                },
                x: {
                    type: 'linear',
                    min: 0,
                    max: 24,
                    ticks: {
                        maxTicksLimit: 13,
                        callback: value => formatWallClock(result.curveStartHour + value)
                    },
                    title: {
                        display: true,
                        text: 'Time of Day',
                        font: { size: 12, weight: '500' },
                        color: '#2c2c2c'
                    }
                }
            }
        },
        plugins: [
            getZoneBackgroundPlugin(),
            getBedtimeLinePlugin(result),
            getNowLinePlugin(result),
            getIntakeMarkersPlugin(result)
        ]
    };
}

/**
 * Build the Chart.js config for the body-weight vs peak-concentration comparison chart.
 * Shows how the same dose produces different peaks across a range of body weights,
 * with the user's actual weight highlighted.
 *
 * @param {object} result       - Output of generateCaffeineCurve
 * @param {string} unit         - "kg" | "lbs" — controls axis labels and user weight display
 * @returns {object} Chart.js config object
 */
function getWeightChartConfig(result, unit) {
    const kgWeights  = [40, 50, 60, 70, 80, 90, 100, 110, 120];
    const peaks      = kgWeights.map(w => (result.dose * COEFFICIENTS.PEAK_COEFFICIENT) / w);
    const useLbs     = unit === 'lbs';
    const userWeightKg = result.bodyWeight;

    const displayWeights = useLbs
        ? kgWeights.map(w => Math.round(w * 2.20462))
        : kgWeights;

    // Find closest kg weight to user's weight for highlighting
    const closestKg = kgWeights.reduce((prev, cur) =>
        Math.abs(cur - userWeightKg) < Math.abs(prev - userWeightKg) ? cur : prev
    );

    return {
        type: 'line',
        data: {
            labels: displayWeights.map(w => w + (useLbs ? ' lbs' : ' kg')),
            datasets: [{
                label: 'Peak Concentration',
                data: peaks,
                borderColor: '#d4a574',
                backgroundColor: 'rgba(212, 165, 116, 0.05)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: kgWeights.map(w =>
                    w === closestKg ? '#d4a574' : 'rgba(212, 165, 116, 0.3)'
                ),
                pointBorderColor: kgWeights.map(w =>
                    w === closestKg ? '#d4a574' : '#ddd'
                ),
                pointBorderWidth: kgWeights.map(w =>
                    w === closestKg ? 2.5 : 1
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
                    text: 'Same dose, different peaks at different weights'
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
                        text: useLbs ? 'Body Weight (lbs)' : 'Body Weight (kg)',
                        font: { size: 12, weight: '500' },
                        color: '#2c2c2c'
                    }
                }
            }
        }
    };
}

/**
 * Shared Chart.js options for static clearance reference charts.
 *
 * @param {string} title
 * @param {string} subtitle
 * @returns {object}
 */
function getClearanceChartOptions(title, subtitle) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            title: {
                display: true,
                text: title,
                font: { size: 16, weight: '600' },
                padding: 20,
                color: '#2c2c2c'
            },
            subtitle: {
                display: true,
                text: subtitle
            },
            legend: {
                display: true,
                position: 'bottom',
                labels: { boxWidth: 12, usePointStyle: true }
            },
            tooltip: {
                callbacks: {
                    label(item) {
                        return `${item.dataset.label}: ${item.parsed.y.toFixed(1)}%`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Caffeine remaining in body (%)',
                    font: { size: 12, weight: '500' },
                    color: '#7a9b8e'
                },
                ticks: { callback: value => value + '%' }
            },
            x: {
                title: {
                    display: true,
                    text: 'Hours since peak',
                    font: { size: 12, weight: '500' },
                    color: '#2c2c2c'
                }
            }
        }
    };
}

/**
 * Static reference: fast, average, and slow metabolizer clearance curves.
 *
 * @param {object} result - Output of generateCaffeineCurve
 * @returns {object} Chart.js config object
 */
function getMetabolizerClearanceChartConfig(result) {
    const types = [
        { key: 'fast', label: 'Fast (AA)', color: '#7a9b8e' },
        { key: 'intermediate', label: 'Average (AC)', color: '#2c2c2c' },
        { key: 'slow', label: 'Slow (CC)', color: '#a87070' }
    ];

    const selected = result.metabolizerType || 'intermediate';
    const onOcp = result.onContraceptives;
    const refNote = buildClearanceReferenceNote(result);
    let labels = null;

    const datasets = types.map(({ key, label, color }) => {
        const hl = calculateHalfLife(result.sex || 'unspecified', false, key);
        const { hours, percentages } = buildClearanceCurve(hl);
        if (!labels) labels = hours.map(h => h + ' h');
        const isSelected = !onOcp && key === selected;
        return {
            label: `${label} (~${hl.toFixed(1)} h)`,
            data: percentages,
            borderColor: color,
            backgroundColor: 'transparent',
            borderWidth: isSelected ? 3.5 : 1.5,
            borderDash: isSelected ? [] : [4, 3],
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4
        };
    });

    const subtitle = (onOcp
        ? 'Reference curves without oral contraceptives. See OCP chart below for contraceptive effect.'
        : 'Bold line = your selected metabolizer type.') + refNote;

    return {
        type: 'line',
        data: { labels, datasets },
        options: getClearanceChartOptions(
            'Clearance by Metabolizer Type',
            subtitle
        )
    };
}

/**
 * Note when reference clearance charts omit smoking/pregnancy modifiers.
 *
 * @param {object} result
 * @returns {string}
 */
function buildClearanceReferenceNote(result) {
    const omitted = [];
    if (result.smoking) omitted.push('smoking');
    if (result.pregnancy) omitted.push('pregnancy');
    if (!omitted.length) return '';
    return ` Reference curves do not include ${omitted.join(' or ')}; your half-life above combines all selected factors.`;
}

/**
 * Static reference: average metabolizer with and without oral contraceptives.
 *
 * @param {object} result - Output of generateCaffeineCurve
 * @returns {object} Chart.js config object
 */
function getOcpClearanceChartConfig(result) {
    const noOcpHl = calculateHalfLife(result.sex || 'unspecified', false, 'intermediate');
    const ocpHl = calculateHalfLife(result.sex || 'unspecified', true, 'intermediate');
    const noOcp = buildClearanceCurve(noOcpHl);
    const withOcp = buildClearanceCurve(ocpHl);
    const labels = noOcp.hours.map(h => h + ' h');
    const onOcp = result.onContraceptives;

    return {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: `No oral contraceptives (~${noOcpHl.toFixed(1)} h)`,
                    data: noOcp.percentages,
                    borderColor: '#2c2c2c',
                    backgroundColor: 'transparent',
                    borderWidth: onOcp ? 1.5 : 3.5,
                    borderDash: onOcp ? [4, 3] : [],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0
                },
                {
                    label: `On oral contraceptives (~${ocpHl.toFixed(1)} h)`,
                    data: withOcp.percentages,
                    borderColor: '#9b8bb5',
                    backgroundColor: 'transparent',
                    borderWidth: onOcp ? 3.5 : 1.5,
                    borderDash: onOcp ? [] : [4, 3],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0
                }
            ]
        },
        options: getClearanceChartOptions(
            'Clearance: Oral Contraceptive Effect',
            (onOcp ? 'Bold line = on oral contraceptives (your selection).' : 'Reference at average metabolizer speed.') +
            buildClearanceReferenceNote(result)
        )
    };
}

/**
 * Shared Chart.js options for static Sleep-tab educational charts (not personalized).
 *
 * @param {string} yLabel
 * @param {string} [xLabel]
 * @returns {object}
 */
function getSleepEducationalChartOptions(yLabel, xLabel) {
    const xScale = {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#666' }
    };
    if (xLabel) {
        xScale.title = {
            display: true,
            text: xLabel,
            font: { size: 11, weight: '500' },
            color: '#2c2c2c'
        };
    }

    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    boxWidth: 12,
                    font: { size: 11 },
                    color: '#2c2c2c'
                }
            },
            title: {
                display: false
            },
            tooltip: {
                enabled: false
            }
        },
        scales: {
            x: xScale,
            y: {
                min: 0,
                max: 100,
                title: {
                    display: true,
                    text: yLabel,
                    font: { size: 11, weight: '500' },
                    color: '#2c2c2c'
                },
                grid: { color: 'rgba(0,0,0,0.06)' },
                ticks: {
                    stepSize: 50,
                    font: { size: 10, color: '#666' },
                    callback(value) {
                        if (value === 0) return 'Low';
                        if (value === 50) return 'Moderate';
                        if (value === 100) return 'High';
                        return '';
                    }
                }
            }
        }
    };
}

/** Illustrative sleep pressure build through a typical wake day. */
function getSleepPressureChartConfig() {
    const labels = ['6 am', '8 am', '10 am', '12 pm', '2 pm', '4 pm', '6 pm', '8 pm', '10 pm'];
    const pressure = [8, 22, 36, 48, 56, 64, 72, 82, 92];

    return {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Sleep drive (illustrative)',
                data: pressure,
                borderColor: '#7a9b8e',
                backgroundColor: 'rgba(122, 155, 142, 0.12)',
                fill: true,
                tension: 0.35,
                pointRadius: 2,
                borderWidth: 2
            }]
        },
        options: getSleepEducationalChartOptions('Sleep drive (illustrative)')
    };
}

/** Conceptual masking: true sleep pressure vs temporarily reduced felt sleepiness. */
function getCaffeineMaskingChartConfig() {
    const labels = ['6 am', '8 am', '10 am', '12 pm', '2 pm', '4 pm', '6 pm', '8 pm', '10 pm'];
    const truePressure = [8, 22, 36, 48, 56, 64, 72, 82, 92];
    const feltSleepiness = [8, 22, 36, 48, 50, 52, 58, 68, 88];

    return {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'True sleep pressure (still building)',
                    data: truePressure,
                    borderColor: '#7a9b8e',
                    borderDash: [6, 4],
                    backgroundColor: 'transparent',
                    tension: 0.35,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: 'How sleepy you feel (with afternoon caffeine)',
                    data: feltSleepiness,
                    borderColor: '#2c2c2c',
                    backgroundColor: 'transparent',
                    tension: 0.35,
                    pointRadius: 0,
                    borderWidth: 2.5
                }
            ]
        },
        options: getSleepEducationalChartOptions('Sleepiness (illustrative — schematic)')
    };
}

/** Illustrative melatonin rise; dashed line = delayed timing after evening caffeine (Burke et al. 2015). */
function getMelatoninChartConfig() {
    const labels = ['6 pm', '8 pm', '10 pm', '12 am', '2 am', '4 am'];
    const typical = [5, 18, 48, 82, 72, 42];
    const delayed = [5, 12, 28, 58, 78, 48];

    return {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Typical melatonin signal',
                    data: typical,
                    borderColor: '#9b8bb5',
                    backgroundColor: 'rgba(155, 139, 181, 0.15)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    borderWidth: 2
                },
                {
                    label: 'Delayed after evening caffeine (illustrative)',
                    data: delayed,
                    borderColor: '#c9a570',
                    borderDash: [6, 4],
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                }
            ]
        },
        options: getSleepEducationalChartOptions(
            'Night signal strength (schematic)',
            'Clock time'
        )
    };
}

// Export for Node.js environments (not used in the browser)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        concentrationAtTime,
        calculateK,
        calculatePeakConcentration,
        getTimeToMaxConcentration,
        calculateHalfLife,
        getPkUncertaintyInfo,
        buildClearanceReferenceNote,
        timeToTargetLevel,
        classifyZone,
        concentrationFromSingleIntake,
        totalConcentrationAt,
        generateCaffeineCurve,
        generateRecommendation,
        getZoneBackgroundPlugin,
        getBedtimeOutcome,
        buildClearanceCurve,
        getRemainingAfterPeak,
        getTimelineChartConfig,
        getWeightChartConfig,
        getMetabolizerClearanceChartConfig,
        getOcpClearanceChartConfig,
        getSleepPressureChartConfig,
        getCaffeineMaskingChartConfig,
        getMelatoninChartConfig
    };
}
