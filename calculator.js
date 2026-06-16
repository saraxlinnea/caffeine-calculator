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
 *
 * @param {string}  sex              - "male" | "female"
 * @param {boolean} onContraceptives - Whether the user is on oral contraceptives
 * @param {string}  metabolizerType  - "fast" | "intermediate" | "slow"
 * @returns {number} Adjusted half-life (hours)
 */
function calculateHalfLife(sex, onContraceptives = false, metabolizerType = "intermediate") {
    let baseFactor = HALFLIFE_MODIFIERS[sex] || HALFLIFE_MODIFIERS.male;

    if (sex === "female" && onContraceptives) {
        baseFactor = HALFLIFE_MODIFIERS.female_contraceptives;
    }

    const metabolizerFactor = METABOLIZER_FACTORS[metabolizerType] || METABOLIZER_FACTORS.intermediate;
    return HALFLIFE_BASE_MALE * baseFactor * metabolizerFactor;
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

    const halfLife = calculateHalfLife(params.sex, params.onContraceptives, metabolizerType);
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

    const halfLife = calculateHalfLife(params.sex, params.onContraceptives, params.metabolizerType);
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

    const pkParams = { bodyWeight, sex, foodStatus, onContraceptives, metabolizerType, nowHour, bedtimeHour };

    const halfLife = calculateHalfLife(sex, onContraceptives, metabolizerType);
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
        halfLife,
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
            let msg = `Your planned ${totalMg} mg (${intakeLabel}) may leave levels above the low-risk band at bedtime.`;
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
    const yMax           = Math.ceil(Math.max(...curveHigh, result.peakConcentration) * 1.15);

    return {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Upper bound',
                    data: toPoints(curveHigh),
                    borderColor: 'transparent',
                    backgroundColor: 'rgba(212, 165, 116, 0.22)',
                    borderWidth: 0,
                    fill: '+1',
                    tension: 0.4,
                    pointRadius: 0,
                    order: 3
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
                    order: 2
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
                        filter: item => item.text === 'Estimated concentration',
                        boxWidth: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        title(items) {
                            const offset = items[0].parsed.x;
                            return formatWallClock(result.curveStartHour + offset);
                        },
                        afterBody(items) {
                            const idx = items[0].dataIndex;
                            const low = curveLow[idx].toFixed(2);
                            const high = curveHigh[idx].toFixed(2);
                            return `Range: ${low}–${high} µg/mL`;
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
 * Build the Chart.js config for the clearance rate vs sleep risk chart.
 * Left axis: caffeine remaining as a percentage of peak (%).
 * Right axis: estimated sleep disruption risk (0–100 scale).
 * X-axis ticks show both wall-clock time and hours-after-consumption.
 *
 * @param {object} result - Output of generateCaffeineCurve
 * @returns {object} Chart.js config object
 */
function getClearanceChartConfig(result) {
    const offsets        = Object.keys(result.curve).map(Number).sort((a, b) => a - b);
    const concentrations = offsets.map(h => result.curve[h]);
    const sleepRisks     = concentrations.map(c => calculateSleepRisk(c));
    const peakConc       = result.peakConcentration || 1;
    const percentages    = concentrations.map(c => (c / peakConc) * 100);
    const toPoints       = (values) => offsets.map((offset, i) => ({ x: offset, y: values[i] }));

    return {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Relative Level (% of daily peak)',
                    data: toPoints(percentages),
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
                    data: toPoints(sleepRisks),
                    borderColor: '#d4a574',
                    backgroundColor: 'rgba(212, 165, 116, 0.05)',
                    borderWidth: 2.5,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    yAxisID: 'y1',
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            parsing: false,
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
                    text: 'How caffeine remaining correlates with estimated sleep disruption risk'
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
                        text: 'Relative Level (% of peak)',
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
                    grid: { drawOnChartArea: false }
                },
                x: {
                    type: 'linear',
                    min: 0,
                    max: 24,
                    ticks: {
                        maxTicksLimit: 13,
                        callback: value => formatWallClock(result.curveStartHour + value)
                    }
                }
            }
        }
    };
}

/**
 * EQUATION 4.1: Map plasma concentration to an estimated sleep disruption risk score
 * Piecewise linear mapping: 0 (no risk) → 100 (maximum estimated risk).
 * Breakpoints correspond to SLEEP_ZONES thresholds.
 *
 * @param {number} concentration - Caffeine plasma concentration (µg/mL)
 * @returns {number} Risk score 0–100
 */
function calculateSleepRisk(concentration) {
    if (concentration < 0.5)  return 0;
    if (concentration < 1.0)  return Math.min(25, (concentration - 0.5) * 50);
    if (concentration < 1.4)  return Math.min(50, 25 + (concentration - 1.0) * 83);
    if (concentration < 2.5)  return Math.min(80, 50 + (concentration - 1.4) * 61);
    return 100;
}

// Export for Node.js environments (not used in the browser)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        concentrationAtTime,
        calculateK,
        calculatePeakConcentration,
        getTimeToMaxConcentration,
        calculateHalfLife,
        timeToTargetLevel,
        classifyZone,
        concentrationFromSingleIntake,
        totalConcentrationAt,
        generateCaffeineCurve,
        generateRecommendation,
        getZoneBackgroundPlugin,
        calculateSleepRisk,
        getTimelineChartConfig,
        getWeightChartConfig,
        getClearanceChartConfig
    };
}
