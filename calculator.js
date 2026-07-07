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
            'Smoking and pregnancy have opposing effects on caffeine clearance in this simplified model, and their real-world interaction is complex and less studied. Your half-life estimate is less precise. Discuss with a healthcare provider.';
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
 * Find stacked daily peak concentration and wall-clock time from curve samples.
 *
 * @param {object} curve - Nominal concentration by hour offset from curveStartHour
 * @param {object} curveLow
 * @param {object} curveHigh
 * @param {number} curveStartHour
 * @returns {{ peakConcentration: number, peakHour: number, peakConcentrationLow: number, peakConcentrationHigh: number, zoneAtPeak: object }}
 */
function findDailyPeak(curve, curveLow, curveHigh, curveStartHour) {
    let peakConcentration = 0;
    let peakOffset = 0;

    for (const [offsetStr, conc] of Object.entries(curve)) {
        const offset = parseFloat(offsetStr);
        if (conc > peakConcentration) {
            peakConcentration = conc;
            peakOffset = offset;
        }
    }

    const key = String(Math.round(peakOffset * 10) / 10);
    const peakHour = curveStartHour + peakOffset;

    return {
        peakConcentration,
        peakHour,
        peakConcentrationLow: curveLow[key] ?? peakConcentration,
        peakConcentrationHigh: curveHigh[key] ?? peakConcentration,
        zoneAtPeak: classifyZone(peakConcentration)
    };
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
 * Projected bedtime concentration if maxDoseNow mg is taken at nowHour.
 *
 * @param {number} maxMg
 * @param {Array} intakes
 * @param {object} pkParams
 * @returns {number}
 */
function getBedtimeConcentrationIfDoseNow(maxMg, intakes, pkParams) {
    const active = (intakes || []).filter(i => i.amountMg > 0);
    if (maxMg <= 0) {
        return totalConcentrationAt(pkParams.bedtimeHour, active, pkParams, { useBedtimeElapsed: true });
    }
    const hypothetical = {
        amountMg: maxMg,
        hour: pkParams.nowHour,
        foodStatus: pkParams.foodStatus
    };
    return totalConcentrationAt(
        pkParams.bedtimeHour,
        [...active, hypothetical],
        pkParams,
        { useBedtimeElapsed: true }
    );
}

/**
 * Intakes at or before a cutoff wall-clock hour (same-day model).
 *
 * @param {Array} intakes
 * @param {number} cutoffHour
 * @returns {Array}
 */
function intakesAtOrBeforeCutoff(intakes, cutoffHour) {
    return intakes.filter(i => i.hour <= cutoffHour + 1e-9);
}

/**
 * Bedtime concentration if only intakes at or before cutoffHour count.
 *
 * @param {Array} intakes
 * @param {object} pkParams
 * @param {number} cutoffHour
 * @returns {number}
 */
function bedtimeConcentrationForCutoff(intakes, pkParams, cutoffHour) {
    const filtered = intakesAtOrBeforeCutoff(intakes, cutoffHour);
    return totalConcentrationAt(pkParams.bedtimeHour, filtered, pkParams, { useBedtimeElapsed: true });
}

function bedtimeConcentrationForPastIntakes(intakes, pkParams, referenceHour) {
    const past = intakes.filter(i => hoursElapsedSameDay(referenceHour, i.hour) >= 0);
    return totalConcentrationAt(pkParams.bedtimeHour, past, pkParams, { useBedtimeElapsed: true });
}

function hourToMinutes(h) {
    return Math.round((((h % 24) + 24) % 24) * 60);
}

function minutesToHour(m) {
    const wrapped = ((m % (24 * 60)) + 24 * 60) % (24 * 60);
    return wrapped / 60;
}

/**
 * Latest wall-clock cutoff: no caffeine after this time (logged intakes after cutoff excluded).
 *
 * @param {Array} intakes
 * @param {object} pkParams
 * @param {number} [targetLevel=SAFE_THRESHOLD]
 * @returns {object}
 */
function calculateLastCaffeineCutoff(intakes, pkParams, targetLevel = SAFE_THRESHOLD) {
    const { nowHour, bedtimeHour } = pkParams;
    const stepMin = 15;
    const nowMin = hourToMinutes(nowHour);
    const hoursNowToBedtime = (bedtimeHour - nowHour + 24) % 24;
    const windowMin = hoursNowToBedtime === 0 ? 24 * 60 : Math.round(hoursNowToBedtime * 60);

    const atNowConc = bedtimeConcentrationForPastIntakes(intakes, pkParams, nowHour);
    const alreadyOverTarget = atNowConc > targetLevel + 1e-9;

    let forwardBestMin = -1;
    for (let offset = 0; offset <= windowMin; offset += stepMin) {
        const cutoffMin = (nowMin + offset) % (24 * 60);
        const cutoffHour = minutesToHour(cutoffMin);
        const conc = bedtimeConcentrationForCutoff(intakes, pkParams, cutoffHour);
        if (conc <= targetLevel + 1e-9) {
            forwardBestMin = cutoffMin;
        }
    }

    let globalBestMin = -1;
    for (let m = 0; m < 24 * 60; m += stepMin) {
        const cutoffHour = minutesToHour(m);
        const conc = bedtimeConcentrationForCutoff(intakes, pkParams, cutoffHour);
        if (conc <= targetLevel + 1e-9) {
            globalBestMin = m;
        }
    }

    const displayMin = forwardBestMin >= 0 ? forwardBestMin : globalBestMin;
    const planningCutoffHour = displayMin >= 0 ? minutesToHour(displayMin) : nowHour;
    const pastCutoffHour = globalBestMin >= 0 ? minutesToHour(globalBestMin) : nowHour;
    const cutoffPassed = !alreadyOverTarget && forwardBestMin < 0 && globalBestMin >= 0 && globalBestMin < nowMin;
    const cutoffHour = cutoffPassed ? pastCutoffHour : planningCutoffHour;
    const bedtimeAtCutoff = Math.round(bedtimeConcentrationForCutoff(intakes, pkParams, cutoffHour) * 100) / 100;

    return {
        cutoffHour,
        alreadyOverTarget,
        cutoffPassed,
        bedtimeAtCutoff,
        targetLevel
    };
}

/**
 * Intake to use as "another cup like your last one" (most recent logged dose at or before now).
 *
 * @param {Array} intakes
 * @param {number} nowHour
 * @returns {{ amountMg: number, hour: number, foodStatus?: string }|null}
 */
function getReferenceRepeatIntake(intakes, nowHour) {
    const active = intakes.filter(i => i.amountMg > 0);
    if (!active.length) return null;

    const past = active.filter(i => hoursElapsedSameDay(nowHour, i.hour) >= 0);
    const pool = past.length ? past : active;

    return pool.reduce((best, i) => {
        if (i.hour > best.hour) return i;
        if (i.hour === best.hour && i.amountMg > best.amountMg) return i;
        return best;
    });
}

/**
 * Latest wall-clock time to add a repeat dose and still hit target at bedtime.
 *
 * @param {Array} intakes
 * @param {object} pkParams
 * @param {number} referenceMg
 * @param {number} [targetLevel=SAFE_THRESHOLD]
 * @returns {object}
 */
function calculateLatestRepeatDoseTime(intakes, pkParams, referenceMg, targetLevel = SAFE_THRESHOLD) {
    const { nowHour, bedtimeHour, foodStatus } = pkParams;
    const tmaxHours = getTimeToMaxConcentration(foodStatus) / 60;

    if (referenceMg <= 0) {
        return {
            latestHour: null,
            fitsAtNow: false,
            bedtimeIfAddedNow: null,
            neverFits: true,
            referenceMg: 0
        };
    }

    const stepMin = 15;
    const nowMin = hourToMinutes(nowHour);
    const hoursNowToBedtime = (bedtimeHour - nowHour + 24) % 24;
    const windowMin = hoursNowToBedtime === 0 ? 24 * 60 : Math.round(hoursNowToBedtime * 60);

    const hypothetical = { amountMg: referenceMg, hour: nowHour, foodStatus };
    const bedtimeIfAddedNow = totalConcentrationAt(
        bedtimeHour,
        [...intakes, hypothetical],
        pkParams,
        { useBedtimeElapsed: true }
    );
    const hoursNowIntakeToBed = (bedtimeHour - nowHour + 24) % 24;
    const fitsAtNow = hoursNowIntakeToBed >= tmaxHours
        && bedtimeIfAddedNow <= targetLevel + 1e-9;

    let latestMin = -1;
    for (let offset = 0; offset <= windowMin; offset += stepMin) {
        const testMin = (nowMin + offset) % (24 * 60);
        const testHour = minutesToHour(testMin);
        const hoursIntakeToBed = (bedtimeHour - testHour + 24) % 24;
        if (hoursIntakeToBed < tmaxHours) continue;

        const testIntake = { amountMg: referenceMg, hour: testHour, foodStatus };
        const conc = totalConcentrationAt(
            bedtimeHour,
            [...intakes, testIntake],
            pkParams,
            { useBedtimeElapsed: true }
        );
        if (conc <= targetLevel + 1e-9) {
            latestMin = testMin;
        }
    }

    return {
        latestHour: latestMin >= 0 ? minutesToHour(latestMin) : null,
        fitsAtNow,
        bedtimeIfAddedNow: Math.round(bedtimeIfAddedNow * 100) / 100,
        neverFits: latestMin < 0,
        referenceMg
    };
}

/** Standard drink presets for “latest time today” planning (mg), low → high. */
const STANDARD_PLANNING_DRINKS = [
    { label: 'Black tea', mg: 40 },
    { label: 'Energy drink', mg: 80 },
    { label: '8 oz coffee', mg: 95 },
    { label: '12 oz coffee (latte)', mg: 143 }
];

/**
 * Latest wall-clock time each standard drink could still fit before bedtime target.
 *
 * @param {Array} intakes
 * @param {object} pkParams
 * @param {number} [targetLevel=SAFE_THRESHOLD]
 * @returns {Array<{ label: string, mg: number, latestHour: number|null, neverFits: boolean, fitsAtNow: boolean }>}
 */
function getStandardDrinkLatestTimes(intakes, pkParams, targetLevel = SAFE_THRESHOLD) {
    return STANDARD_PLANNING_DRINKS.map(preset => {
        const timing = calculateLatestRepeatDoseTime(intakes, pkParams, preset.mg, targetLevel);
        return {
            label: preset.label,
            mg: preset.mg,
            tier: getStandardDrinkDoseTier(preset.mg),
            latestHour: timing.latestHour,
            neverFits: timing.neverFits,
            fitsAtNow: timing.fitsAtNow,
            bedtimeIfAddedNow: timing.bedtimeIfAddedNow
        };
    });
}

/**
 * Dose tier for standard-drink planning UI (low / moderate / high).
 *
 * @param {number} mg
 * @returns {'low'|'moderate'|'high'}
 */
function getStandardDrinkDoseTier(mg) {
    if (mg <= 40) return 'low';
    if (mg <= 95) return 'moderate';
    return 'high';
}

/**
 * Display name and timing copy for one standard-drink row.
 *
 * @param {{ label: string, mg: number, latestHour: number|null, neverFits: boolean, fitsAtNow: boolean }} drink
 * @returns {{ name: string, timing: string, tier: 'low'|'moderate'|'high' }}
 */
function getStandardDrinkDisplay(drink) {
    const name = `${drink.label} (${drink.mg} mg)`;
    const tier = drink.tier || getStandardDrinkDoseTier(drink.mg);
    let timing;
    if (drink.neverFits) {
        timing = 'Would not stay below target at any time today.';
    } else if (drink.fitsAtNow) {
        timing = `Could fit now; latest about ${formatWallClock(drink.latestHour)}.`;
    } else {
        timing = `Latest about ${formatWallClock(drink.latestHour)}.`;
    }
    return { name, timing, tier };
}

/**
 * Plain-language line for one standard-drink latest-time result.
 *
 * @param {{ label: string, mg: number, latestHour: number|null, neverFits: boolean, fitsAtNow: boolean }} drink
 * @returns {string}
 */
function formatStandardDrinkLatestLine(drink) {
    const name = `${drink.label} (${drink.mg} mg)`;
    if (drink.neverFits) {
        return `${name}: would not stay below the lower bedtime residual target at any time today.`;
    }
    const latestStr = formatWallClock(drink.latestHour);
    if (drink.fitsAtNow) {
        return `${name}: could still fit if taken now; latest about ${latestStr}.`;
    }
    return `${name}: latest about ${latestStr}.`;
}

/**
 * Closest named drink for a caffeine amount (mg).
 *
 * @param {number} mg
 * @returns {string}
 */
function getDrinkEquivalentForMg(mg) {
    if (mg <= 0) return 'none';

    const sources = Object.values(CAFFEINE_SOURCES)
        .map(s => ({ mg: s.mg, label: s.label }))
        .sort((a, b) => a.mg - b.mg);

    if (mg < 12) return 'less than a few sips of coffee';

    let closest = sources[0];
    let minDiff = Math.abs(mg - closest.mg);
    for (const s of sources) {
        const diff = Math.abs(mg - s.mg);
        if (diff < minDiff) {
            minDiff = diff;
            closest = s;
        }
    }

    if (minDiff <= 12) {
        return `about one ${closest.label.toLowerCase()}`;
    }

    const under = sources.filter(s => s.mg <= mg);
    const underBest = under.length ? under[under.length - 1] : null;
    if (underBest && mg < underBest.mg * 1.15) {
        return `roughly ${mg} mg, a bit less than a full ${underBest.label.toLowerCase()}`;
    }

    return `about ${mg} mg (nearest reference: ${closest.label.toLowerCase()})`;
}

/**
 * Human label for a reference repeat dose amount.
 *
 * @param {number} referenceMg
 * @returns {string}
 */
function getReferenceDoseLabel(referenceMg) {
    const drink = getDrinkEquivalentForMg(referenceMg);
    if (drink.includes('about one')) {
        return drink.replace('about one ', '');
    }
    return `${referenceMg} mg`;
}

/**
 * Whether the legacy log-filter cutoff message adds information.
 *
 * @param {object|null} cutoffResult
 * @param {object} pkParams
 * @param {boolean} hasFutureIntakes
 * @returns {boolean}
 */
function isLegacyCutoffInformative(cutoffResult, pkParams, hasFutureIntakes) {
    if (!cutoffResult) return false;
    if (cutoffResult.alreadyOverTarget || cutoffResult.cutoffPassed) return true;
    if (hasFutureIntakes) return true;

    const hoursCutoffToBed = (pkParams.bedtimeHour - cutoffResult.cutoffHour + 24) % 24;
    return hoursCutoffToBed > 1.0;
}

/**
 * Label for the intake used as a repeat-dose reference (time + size).
 *
 * @param {{ hour: number, amountMg: number }} intake
 * @returns {string}
 */
function formatReferenceIntakeLabel(intake) {
    const timeStr = formatWallClock(intake.hour);
    const drink = getDrinkEquivalentForMg(intake.amountMg);
    if (drink.startsWith('about one ')) {
        const short = drink.replace('about one ', '');
        return `your ${timeStr} ${short} (${intake.amountMg} mg)`;
    }
    return `your ${timeStr} dose (${intake.amountMg} mg)`;
}

/**
 * One-line Overview teaser pointing users to the curve tab for full planning.
 *
 * @param {object} result
 * @returns {string|null}
 */
function buildPlanningTeaser(result) {
    if (!result) return null;

    const target = SAFE_THRESHOLD.toFixed(1);
    const bed = result.concentrationAtBedtime;
    const { maxDoseNow, latestRepeatDose, referenceRepeatIntake, hasNoLoggedCaffeine } = result;

    if (hasNoLoggedCaffeine) {
        if (maxDoseNow > 0) {
            return `No caffeine logged yet. Up to about ${maxDoseNow} mg could fit now below the lower bedtime residual target (~${target} µg/mL).`;
        }
        return `No caffeine logged yet. The model would not suggest more caffeine right now for that target.`;
    }

    if (bed > SAFE_THRESHOLD + 1e-9) {
        return `Your current log estimates above ~${target} µg/mL at bedtime. Open your caffeine curve for timing details.`;
    }

    if (latestRepeatDose && referenceRepeatIntake && latestRepeatDose.referenceMg > 0) {
        if (latestRepeatDose.neverFits) {
            if (maxDoseNow > 0) {
                return `Logged drinks look OK at bedtime; a full second ${referenceRepeatIntake.amountMg} mg would not. Up to ~${maxDoseNow} mg could fit now. See your curve.`;
            }
            return `Logged drinks look OK at bedtime; a full second ${referenceRepeatIntake.amountMg} mg would not. See your curve for options.`;
        }
        const latestStr = formatWallClock(latestRepeatDose.latestHour);
        if (maxDoseNow > 0) {
            return `Another ${referenceRepeatIntake.amountMg} mg drink could work before ${latestStr}; up to ~${maxDoseNow} mg right now. See your curve.`;
        }
        return `Another ${referenceRepeatIntake.amountMg} mg drink before ${latestStr} could still fit the lower bedtime residual target. See your curve.`;
    }

    if (maxDoseNow > 0) {
        return `About ${maxDoseNow} mg could still fit before bedtime under ~${target} µg/mL. See your curve for timing.`;
    }

    return `No extra room below ~${target} µg/mL at bedtime on this plan. See your curve.`;
}

/**
 * Planning copy: repeat-dose deadline, max mg now (full detail for Curve tab).
 *
 * @param {object} result - Output of generateCaffeineCurve
 * @returns {{ intro: string, lines: string[] }}
 */
function buildCaffeinePlanningContent(result) {
    const target = SAFE_THRESHOLD.toFixed(1);
    const intro =
        `This calculator uses about ${target} µg/mL at bedtime as the lower bedtime residual planning target. In research, that range tends to mean less adenosine receptor blockade on average. It is a planning target, not medical advice or a guarantee you will sleep well.`;

    const lines = [];
    const {
        latestRepeatDose,
        referenceRepeatIntake,
        maxDoseNow,
        concentrationAtBedtime,
        hasFutureIntakes,
        hasNoLoggedCaffeine,
        bedtimeIfMaxDoseNow
    } = result;

    if (hasNoLoggedCaffeine) {
        lines.push('No caffeine logged yet. The curve below shows zero until you add a drink.');
    } else if (hasFutureIntakes && latestRepeatDose && referenceRepeatIntake) {
        lines.push(
            `You have future doses on your list. The timeline and stacking table below reflect that full plan (${concentrationAtBedtime.toFixed(2)} µg/mL at bedtime).`
        );
    } else if (concentrationAtBedtime <= SAFE_THRESHOLD + 1e-9) {
        lines.push(
            `Your logged drinks alone estimate about ${concentrationAtBedtime.toFixed(2)} µg/mL at bedtime (under the ~${target} µg/mL lower bedtime residual target).`
        );
    }

    if (latestRepeatDose && referenceRepeatIntake && latestRepeatDose.referenceMg > 0) {
        const refLabel = formatReferenceIntakeLabel(referenceRepeatIntake);

        if (latestRepeatDose.neverFits) {
            lines.push(
                `A second drink the same size as ${refLabel} would likely push you above ~${target} µg/mL at bedtime.`
            );
        } else {
            const latestStr = formatWallClock(latestRepeatDose.latestHour);
            if (latestRepeatDose.fitsAtNow) {
                lines.push(
                    `To stay near the lower bedtime residual target, you could have another drink like ${refLabel} as late as about ${latestStr}.`
                );
            } else {
                lines.push(
                    `To stay near the lower bedtime residual target, have another drink like ${refLabel} before about ${latestStr}. After that, one more of that size would likely push you above ~${target} µg/mL.`
                );
            }
        }
    }

    if (maxDoseNow > 0) {
        const drink = getDrinkEquivalentForMg(maxDoseNow);
        lines.push(
            `Right now you could add about ${maxDoseNow} mg and still stay under the lower bedtime residual target (~${target} µg/mL) (${drink}).`
        );
        lines.push(
            `If you took that amount now, the model estimates about ${bedtimeIfMaxDoseNow.toFixed(2)} µg/mL at bedtime.`
        );
    } else {
        lines.push(
            `Based on your current settings and logged caffeine, the model would not suggest more caffeine right now if you want to stay below the lower bedtime residual target (~${target} µg/mL).`
        );
    }

    return { intro, lines, standardDrinks: result.standardDrinkLatestTimes || [] };
}

/**
 * Prominent reverse-calculator copy for "Plan your next drink".
 *
 * @param {object|null} result - Output of generateCaffeineCurve
 * @returns {{ headline: string, summaryParagraphs: string[], standardDrinks: Array, disclaimer: string }}
 */
function buildHowMuchNowContent(result) {
    const target = SAFE_THRESHOLD.toFixed(1);
    const disclaimer =
        'Planning estimate from this pharmacokinetic model only. Not medical advice and not a guarantee of how you will sleep.';

    if (!result) {
        return {
            headline: 'Plan your next drink',
            summaryParagraphs: [
                'Press Calculate to see how much caffeine you could have right now and still stay below the lower bedtime residual target.'
            ],
            standardDrinks: [],
            disclaimer
        };
    }

    const {
        maxDoseNow,
        bedtimeIfMaxDoseNow,
        concentrationAtBedtime,
        hasNoLoggedCaffeine,
        standardDrinkLatestTimes
    } = result;

    if (maxDoseNow > 0) {
        const drink = getDrinkEquivalentForMg(maxDoseNow);
        const loggedNote = hasNoLoggedCaffeine
            ? 'With no caffeine logged yet,'
            : `With your logged caffeine estimating about ${concentrationAtBedtime.toFixed(2)} µg/mL at bedtime,`;
        return {
            headline: `Up to about ${maxDoseNow} mg now`,
            summaryParagraphs: [
                `${loggedNote} you could add about ${maxDoseNow} mg right now (${drink}) and still stay under the lower bedtime residual target (~${target} µg/mL).`,
                `If you took that amount now, the model estimates about ${bedtimeIfMaxDoseNow.toFixed(2)} µg/mL at bedtime.`
            ],
            standardDrinks: standardDrinkLatestTimes || [],
            disclaimer
        };
    }

    const loggedNote = hasNoLoggedCaffeine
        ? 'No caffeine logged yet.'
        : `Your logged caffeine already estimates about ${concentrationAtBedtime.toFixed(2)} µg/mL at bedtime.`;

    return {
        headline: 'No additional caffeine suggested now',
        summaryParagraphs: [
            `${loggedNote} Based on your current settings and timing, the model would not suggest more caffeine right now if you want to stay below the lower bedtime residual target (~${target} µg/mL).`
        ],
        standardDrinks: standardDrinkLatestTimes || [],
        disclaimer
    };
}

/**
 * Per-intake bedtime concentration contributions (superposition).
 *
 * @param {Array} intakes
 * @param {object} pkParams
 * @returns {{ rows: Array, totalAtBedtime: number }}
 */
function getBedtimeIntakeBreakdown(intakes, pkParams) {
    const active = intakes.filter(i => i.amountMg > 0);
    const rows = active.map(intake => {
        const concentrationAtBedtime = totalConcentrationAt(
            pkParams.bedtimeHour,
            [intake],
            pkParams,
            { useBedtimeElapsed: true }
        );
        return {
            hour: intake.hour,
            amountMg: intake.amountMg,
            concentrationAtBedtime: Math.round(concentrationAtBedtime * 100) / 100
        };
    });

    const totalAtBedtime = rows.reduce((sum, r) => sum + r.concentrationAtBedtime, 0);
    const roundedTotal = Math.round(totalAtBedtime * 100) / 100;

    rows.forEach(row => {
        row.percentOfTotal = roundedTotal > 0
            ? Math.round((row.concentrationAtBedtime / roundedTotal) * 1000) / 10
            : 0;
    });

    rows.sort((a, b) => b.concentrationAtBedtime - a.concentrationAtBedtime);

    return { rows, totalAtBedtime: roundedTotal };
}

/**
 * Plain-language message for last safe caffeine cutoff.
 *
 * @param {object} cutoffResult - Output of calculateLastCaffeineCutoff
 * @param {number} nowHour
 * @returns {string}
 */
function formatLastCaffeineCutoffMessage(cutoffResult, nowHour) {
    const { alreadyOverTarget, cutoffPassed, cutoffHour, targetLevel } = cutoffResult;

    if (alreadyOverTarget) {
        return 'Your logged intakes may already exceed the lower bedtime residual target at bedtime. Cutoff not applicable.';
    }

    const cutoffStr = formatWallClock(cutoffHour);
    const nowStr = formatWallClock(nowHour);
    const target = targetLevel.toFixed(1);

    if (cutoffPassed) {
        return `Last time for additional caffeine was about ${cutoffStr} (now ${nowStr}). Planning target ~${target} µg/mL at bedtime; not a personal sleep guarantee.`;
    }

    return `Avoid caffeine after ${cutoffStr} to stay below ~${target} µg/mL at bedtime (lower bedtime residual planning target, not a personal sleep guarantee).`;
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

    const hasNoLoggedCaffeine = intakes.length === 0;

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
    const curveStartHour = Math.floor(
        intakeHours.length ? Math.min(...intakeHours, nowHour, bedtimeHour) : Math.min(nowHour, bedtimeHour)
    );
    const { curve, curveLow, curveHigh } =
        buildConcentrationCurves(intakes, pkParams, curveStartHour);
    const {
        peakConcentration,
        peakHour,
        peakConcentrationLow,
        peakConcentrationHigh,
        zoneAtPeak
    } = findDailyPeak(curve, curveLow, curveHigh, curveStartHour);

    const buildOverlay = (overrides) =>
        buildConcentrationCurves(intakes, { ...pkParams, ...overrides }, curveStartHour).curve;
    const curveFast = buildOverlay({ metabolizerType: 'fast' });
    const curveIntermediate = buildOverlay({ metabolizerType: 'intermediate' });
    const curveSlow = buildOverlay({ metabolizerType: 'slow' });
    const curveWithOcp = buildOverlay({ onContraceptives: true });
    const curveWithoutOcp = buildOverlay({ onContraceptives: false });

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
    const activeIntakes = intakes;
    const referenceRepeatIntake = activeIntakes.length > 0
        ? getReferenceRepeatIntake(activeIntakes, nowHour)
        : null;
    const referenceRepeatMg = referenceRepeatIntake ? referenceRepeatIntake.amountMg : 0;
    const latestRepeatDose = referenceRepeatMg > 0
        ? calculateLatestRepeatDoseTime(activeIntakes, pkParams, referenceRepeatMg, SAFE_THRESHOLD)
        : null;
    const lastCaffeineCutoff = activeIntakes.length > 0
        ? calculateLastCaffeineCutoff(activeIntakes, pkParams, SAFE_THRESHOLD)
        : null;
    const bedtimeIntakeBreakdown = activeIntakes.length > 0
        ? getBedtimeIntakeBreakdown(activeIntakes, pkParams)
        : { rows: [], totalAtBedtime: 0 };

    const largestIntake = activeIntakes.length > 0
        ? activeIntakes.reduce((best, i) => (i.amountMg > best.amountMg ? i : best), activeIntakes[0])
        : { amountMg: 0, hour: nowHour };
    const c_max = calculatePeakConcentration(largestIntake.amountMg, bodyWeight);
    const consumptionHour = intakeHours.length ? Math.min(...intakeHours) : nowHour;
    const bedtimeIfMaxDoseNow = getBedtimeConcentrationIfDoseNow(maxDoseNow, activeIntakes, pkParams);
    const standardDrinkLatestTimes = getStandardDrinkLatestTimes(activeIntakes, pkParams, SAFE_THRESHOLD);

    return {
        intakes: activeIntakes,
        hasNoLoggedCaffeine,
        totalMg,
        foodStatus,
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
        peakConcentration: Math.round(peakConcentration * 100) / 100,
        peakHour,
        peakConcentrationLow: Math.round(peakConcentrationLow * 100) / 100,
        peakConcentrationHigh: Math.round(peakConcentrationHigh * 100) / 100,
        zoneAtPeak,
        tmax_minutes,
        tmax_hours,
        curve,
        curveLow,
        curveHigh,
        curveFast,
        curveIntermediate,
        curveSlow,
        curveWithOcp,
        curveWithoutOcp,
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
        bedtimeIfMaxDoseNow: Math.round(bedtimeIfMaxDoseNow * 100) / 100,
        standardDrinkLatestTimes,
        lastCaffeineCutoff,
        referenceRepeatIntake,
        latestRepeatDose,
        bedtimeIntakeBreakdown,
        recommendation: generateRecommendation(zoneAtBedtime, {
            alreadyConsumed,
            hasFutureIntakes,
            consumptionTooLate,
            maxDoseNow,
            concentrationNow,
            totalMg,
            intakeCount: activeIntakes.length,
            hasNoLoggedCaffeine
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
        totalMg,
        intakeCount,
        hasNoLoggedCaffeine
    } = opts;

    if (hasNoLoggedCaffeine || intakeCount === 0) {
        if (maxDoseNow > 0) {
            return `No caffeine logged yet. Based on your settings, you could have up to about ${maxDoseNow} mg now and still stay below the lower bedtime residual target. See Plan your next drink for details.`;
        }
        return 'No caffeine logged yet. Based on your current settings and timing, the model would not suggest more caffeine right now if you want to stay below the lower bedtime residual target.';
    }

    const intakeLabel = intakeCount === 1 ? '1 intake' : `${intakeCount} intakes`;

    if (hasFutureIntakes && !alreadyConsumed) {
        if (consumptionTooLate) {
            return `Your planned ${totalMg} mg (${intakeLabel}) may leave levels above the lower concentration band at bedtime. See your caffeine curve for timing.`;
        }
        if (zone === SLEEP_ZONES.GREEN) {
            return `Your planned ${totalMg} mg (${intakeLabel}) should clear to low estimated levels by bedtime.`;
        }
        return `Your planned caffeine (${totalMg} mg, ${intakeLabel}) may leave some active at bedtime.`;
    }

    if (zone === SLEEP_ZONES.GREEN) {
        return `Your ${totalMg} mg today (${intakeLabel}) should clear before bedtime. Estimated concentration at that time is low.`;
    }

    if (alreadyConsumed && consumptionTooLate) {
        return `Based on your ${totalMg} mg across ${intakeLabel}, caffeine likely will not fully clear before bedtime.`;
    }

    if (zone === SLEEP_ZONES.YELLOW) {
        return `Some caffeine from today's ${intakeLabel} (${totalMg} mg) will still be active at bedtime. Sensitive people may notice mild effects.`;
    }
    if (zone === SLEEP_ZONES.ORANGE) {
        return `Caffeine levels will still be noticeable at bedtime from your ${totalMg} mg (${intakeLabel}).`;
    }
    if (zone === SLEEP_ZONES.RED) {
        return `Caffeine levels will be high at bedtime from today's ${totalMg} mg (${intakeLabel}).`;
    }
    return `Caffeine levels will be very high at bedtime from your ${totalMg} mg (${intakeLabel}).`;
}


// ============================================
// CHART CONFIGURATION & HELPER FUNCTIONS
// ============================================

/**
 * Adenosine-focused mechanism summary for a plasma concentration zone.
 *
 * @param {number} concentration - µg/mL
 * @returns {string}
 */
function getZoneMechanismSummary(concentration) {
    if (concentration < SAFE_THRESHOLD) {
        return 'Little adenosine receptor occupancy by caffeine. Most A1/A2A sites likely available; sleep-drive signaling largely unopposed.';
    }
    if (concentration < CAUTION_THRESHOLD) {
        return 'Partial adenosine receptor blockade (A1/A2A). Caffeine competes with adenosine; some sleep-pressure signaling may be dampened.';
    }
    if (concentration < WARNING_THRESHOLD) {
        return 'Substantial adenosine receptor blockade (A1/A2A). Felt sleepiness can lag behind true sleep pressure.';
    }
    if (concentration < DANGER_THRESHOLD) {
        return 'Heavy adenosine receptor blockade at this estimated level. Arousal pathways less sensitive to rising adenosine.';
    }
    return 'Very heavy adenosine receptor blockade. Adenosine’s pro-sleep signal largely countered at many A1/A2A sites.';
}

/**
 * Short zone label without emoji or suffix.
 *
 * @param {object} zone - SLEEP_ZONES entry
 * @returns {string}
 */
function getZoneLabelShort(zone) {
    return (zone.label || '')
        .replace(/[🟢🟡🟠🔴⛔]\s*/g, '')
        .replace(' estimated level', '')
        .trim();
}

/**
 * Population-average sleep research context for a concentration at bedtime.
 *
 * @param {number} concentration - µg/mL
 * @returns {string}
 */
function getBedtimeResearchSummary(concentration) {
    if (concentration < SAFE_THRESHOLD) {
        return 'Baur et al. reported minimal EEG delta-power changes at lower plasma levels. Sleep onset and architecture are unlikely to be meaningfully affected for most people.';
    }
    if (concentration < CAUTION_THRESHOLD) {
        return 'Population studies report average dose-dependent effects on sleep latency and total sleep time; sensitive individuals may notice milder sleep onset.';
    }
    if (concentration < WARNING_THRESHOLD) {
        return 'Research suggests measurable average effects on sleep onset and quality at this level, approaching the Baur delta-power reference.';
    }
    if (concentration < DANGER_THRESHOLD) {
        return 'Baur et al. associated concentrations around and above ~1.4 µg/mL with reduced EEG delta power in their controlled protocol. Group averages also suggest delayed sleep onset.';
    }
    return 'Research consistently shows stronger average effects on sleep architecture, onset, and total sleep time across this concentration range.';
}

/**
 * Plain-language subjective effects by zone and time-of-day context.
 *
 * @param {number} concentration - µg/mL
 * @param {'daytime'|'bedtime'} context
 * @returns {string}
 */
function getSubjectiveFeelSummary(concentration, context) {
    if (context === 'bedtime') {
        if (concentration < SAFE_THRESHOLD) {
            return 'Sleep is unlikely to be affected much at this residual level.';
        }
        if (concentration < CAUTION_THRESHOLD) {
            return 'You might take a bit longer to fall asleep or sleep a little lighter. Some people notice little change.';
        }
        if (concentration < WARNING_THRESHOLD) {
            return 'Sleep onset may take longer and mornings may feel less refreshing for some people.';
        }
        if (concentration < DANGER_THRESHOLD) {
            return 'Tossing, night waking, or morning grogginess are common at similar levels. The link to caffeine is easy to miss.';
        }
        return 'Research at this level often shows delayed sleep onset and fragmented sleep on average.';
    }

    if (concentration < SAFE_THRESHOLD) {
        return 'Likely little active effect. Typical between doses or hours after coffee.';
    }
    if (concentration < CAUTION_THRESHOLD) {
        return 'A common alertness range. You may feel more awake; sleepiness can feel weaker than it is.';
    }
    if (concentration < WARNING_THRESHOLD) {
        return 'Stronger alertness is likely. You may feel less tired than your actual sleep drive.';
    }
    if (concentration < DANGER_THRESHOLD) {
        return 'Jitters, restlessness, or trouble winding down are possible. Habitual users may feel only alert.';
    }
    return 'Often very stimulating. Jitteriness or anxiety are possible; tolerance varies.';
}

/**
 * Short merged copy for the Overview "What these levels mean" dropdown.
 *
 * @param {object} result - Output of generateCaffeineCurve
 * @returns {string[]}
 */
function buildOverviewLevelSummary(result) {
    const nowLabel = getZoneLabelShort(result.zoneNow);
    const peakLabel = getZoneLabelShort(result.zoneAtPeak);
    const bedLabel = getZoneLabelShort(result.zoneAtBedtime);
    const allSame = nowLabel === peakLabel && peakLabel === bedLabel;

    const hasPeakTime = !result.hasNoLoggedCaffeine && result.peakConcentration > 0;
    const peakTimeStr = hasPeakTime && typeof formatWallClock === 'function'
        ? formatWallClock(result.peakHour)
        : null;

    if (allSame) {
        if (result.concentrationAtBedtime < SAFE_THRESHOLD) {
            return [
                `All three snapshots are in the ${nowLabel} range. Likely little active effect now; sleep at bedtime is unlikely to be affected much.`
            ];
        }
        if (result.concentrationAtBedtime < CAUTION_THRESHOLD) {
            return [
                `All three snapshots are in the ${nowLabel} range. You may feel more awake now; sleep onset may take a bit longer tonight for some people.`
            ];
        }
        if (result.concentrationAtBedtime < WARNING_THRESHOLD) {
            return [
                `All three snapshots are in the ${nowLabel} range. Stronger alertness now; sleep onset and morning rest may be affected for some people.`
            ];
        }
        return [
            `All three snapshots are in the ${nowLabel} range. ${getSubjectiveFeelSummary(result.concentrationAtBedtime, 'bedtime')}`
        ];
    }

    const paragraphs = [
        `Right now (${nowLabel}): ${getSubjectiveFeelSummary(result.concentrationNow, 'daytime')}`
    ];

    let peakLead = `Today's peak (${peakLabel}`;
    if (peakTimeStr) peakLead += ` at ${peakTimeStr}`;
    peakLead += `): ${getSubjectiveFeelSummary(result.peakConcentration, 'daytime')}`;
    paragraphs.push(peakLead);

    paragraphs.push(
        `At bedtime (${bedLabel}): ${getSubjectiveFeelSummary(result.concentrationAtBedtime, 'bedtime')}`
    );

    return paragraphs;
}

/**
 * Overview panel: three level snapshots and personalized explainer blocks.
 *
 * @param {object} result - Output of generateCaffeineCurve
 * @returns {{ cards: Array, summaryParagraphs: string[], disclaimer: string }}
 */
function buildOverviewLevelContent(result) {
    const hasPeakTime = !result.hasNoLoggedCaffeine && result.peakConcentration > 0;
    const peakTimeLabel = hasPeakTime && typeof formatWallClock === 'function'
        ? `Peak around ${formatWallClock(result.peakHour)}`
        : null;

    const nowTimeLabel = typeof formatWallClock === 'function'
        ? `As of ${formatWallClock(result.nowHour)}`
        : null;

    const cards = [
        {
            id: 'now',
            label: 'Right now',
            concentration: result.concentrationNow,
            rangeLow: result.concentrationNowLow,
            rangeHigh: result.concentrationNowHigh,
            zone: result.zoneNow,
            subtitle: nowTimeLabel
        },
        {
            id: 'peak',
            label: "Today's peak",
            concentration: result.peakConcentration,
            rangeLow: result.peakConcentrationLow,
            rangeHigh: result.peakConcentrationHigh,
            zone: result.zoneAtPeak,
            subtitle: peakTimeLabel
        },
        {
            id: 'bedtime',
            label: 'At bedtime',
            concentration: result.concentrationAtBedtime,
            rangeLow: result.concentrationAtBedtimeLow,
            rangeHigh: result.concentrationAtBedtimeHigh,
            zone: result.zoneAtBedtime,
            subtitle: typeof formatWallClock === 'function'
                ? `Target ${formatWallClock(result.bedtimeHour)}`
                : null
        }
    ];

    const disclaimer =
        'Model estimate only. Not a blood test or medical advice. Your response may differ from population averages.';

    return {
        cards,
        summaryParagraphs: buildOverviewLevelSummary(result),
        disclaimer
    };
}

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

    return {
        concentration: conc,
        rangeLow: low,
        rangeHigh: high,
        zoneLabel: getZoneLabelShort(zone),
        mechanismSummary: getZoneMechanismSummary(conc),
        interpretation: getBedtimeResearchSummary(conc)
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
 * Percent caffeine remaining at 4, 8, 12, and 24 hours after a hypothetical peak.
 *
 * @param {number} halfLife - Half-life in hours
 * @returns {{ h4: number, h8: number, h12: number, h24: number }}
 */
function getRemainingAfterPeak(halfLife) {
    const k = calculateK(halfLife);
    const remaining = hours => Math.exp(-k * hours) * 100;
    return {
        h4: remaining(4),
        h8: remaining(8),
        h12: remaining(12),
        h24: remaining(24)
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
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            const bedConc = result.concentrationAtBedtime.toFixed(2);
            ctx.fillText(`Bed · ${bedConc} µg/mL`, xPos, yScale.top - 6);

            const yBed = yScale.getPixelForValue(result.concentrationAtBedtime);
            ctx.beginPath();
            ctx.arc(xPos, yBed, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#d4a574';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
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
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            const nowConc = result.concentrationNow.toFixed(2);
            ctx.fillText(`Now · ${nowConc} µg/mL`, xPos, yScale.top - 6);

            const yNow = yScale.getPixelForValue(result.concentrationNow);
            ctx.beginPath();
            ctx.arc(xPos, yNow, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#7a9b8e';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }
    };
}

/**
 * Draw a labeled marker at today's peak on the main concentration curve.
 *
 * @param {object} result - Output of generateCaffeineCurve
 * @returns {object} Chart.js plugin object (id: "peakMarker")
 */
function getPeakMarkerPlugin(result) {
    return {
        id: 'peakMarker',
        afterDraw(chart) {
            if (result.hasNoLoggedCaffeine || !result.peakConcentration) return;

            const xScale = chart.scales.x;
            const yScale = chart.scales.y;
            if (!xScale || !yScale) return;

            const offset = result.peakHour - result.curveStartHour;
            if (offset < 0 || offset > 24) return;

            const xPos = xScale.getPixelForValue(offset);
            if (xPos < xScale.left || xPos > xScale.right) return;

            const yPeak = yScale.getPixelForValue(result.peakConcentration);
            const ctx = chart.ctx;
            ctx.save();

            ctx.beginPath();
            ctx.arc(xPos, yPeak, 5.5, 0, Math.PI * 2);
            ctx.fillStyle = '#2c2c2c';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = '#2c2c2c';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            const peakTime = typeof formatWallClock === 'function'
                ? formatWallClock(result.peakHour)
                : '';
            const label = peakTime
                ? `Peak · ${peakTime} · ${result.peakConcentration.toFixed(2)} µg/mL`
                : `Peak · ${result.peakConcentration.toFixed(2)} µg/mL`;
            ctx.fillText(label, xPos, Math.max(yPeak - 12, yScale.top + 10));
            ctx.restore();
        }
    };
}

/**
 * Resolve a display label for an intake (source name or custom dose).
 *
 * @param {{ source?: string, amountMg: number }} intake
 * @returns {string}
 */
function getIntakeSourceLabel(intake) {
    if (intake.source && typeof CAFFEINE_SOURCES !== 'undefined' && CAFFEINE_SOURCES[intake.source]) {
        return CAFFEINE_SOURCES[intake.source].label;
    }
    return intake.amountMg > 0 ? `${intake.amountMg} mg dose` : 'Intake';
}

/**
 * Assign stagger levels so nearby intake labels do not overlap horizontally.
 *
 * @param {Array<{ xPos: number }>} markers
 * @param {number} minGapPx
 * @returns {Array<{ xPos: number, level: number }>}
 */
function assignIntakeLabelLevels(markers, minGapPx = 52) {
    const sorted = markers.map(m => ({ ...m, level: 0 })).sort((a, b) => a.xPos - b.xPos);
    for (let i = 1; i < sorted.length; i++) {
        const usedLevels = new Set();
        for (let j = 0; j < i; j++) {
            if (Math.abs(sorted[j].xPos - sorted[i].xPos) < minGapPx) {
                usedLevels.add(sorted[j].level);
            }
        }
        let level = 0;
        while (usedLevels.has(level)) level++;
        sorted[i].level = level;
    }
    return sorted;
}

/**
 * Choose x-axis tick density from chart width so labels stay readable.
 *
 * @param {number} chartWidth
 * @returns {number}
 */
function getTimelineXTickLimit(chartWidth) {
    if (!chartWidth || chartWidth < 520) return 7;
    if (chartWidth < 720) return 9;
    if (chartWidth < 960) return 11;
    return 13;
}

/**
 * Adjust timeline legend, ticks, and bottom padding as the chart resizes.
 *
 * @param {object} result - Output of generateCaffeineCurve
 * @returns {object} Chart.js plugin object (id: "timelineResponsive")
 */
function getTimelineResponsivePlugin(result) {
    return {
        id: 'timelineResponsive',
        beforeUpdate(chart) {
            const w = chart.width || chart.canvas?.parentNode?.clientWidth || 0;
            const xTicks = chart.options.scales?.x?.ticks;
            if (xTicks) {
                xTicks.maxTicksLimit = getTimelineXTickLimit(w);
            }

            const legendLabels = chart.options.plugins?.legend?.labels;
            if (legendLabels) {
                legendLabels.font = { size: w < 600 ? 9 : 11 };
            }

            const titleFont = chart.options.plugins?.title?.font;
            if (titleFont) {
                titleFont.size = w < 600 ? 14 : 16;
            }

            const yScale = chart.options.scales?.y;
            if (yScale?.title) {
                yScale.title.display = w >= 360;
            }

            const hideIntakeLabels = w < 520;
            let maxLevel = 0;
            if (!hideIntakeLabels && result.intakes) {
                const chartAreaWidth = Math.max(w - 80, 200);
                const markers = result.intakes
                    .filter(intake => intake.amountMg > 0)
                    .map(intake => intake.hour - result.curveStartHour)
                    .filter(offset => offset >= 0 && offset <= 24)
                    .map(offset => ({ xPos: (offset / 24) * chartAreaWidth }));
                const labelGap = w < 700 ? 44 : 52;
                maxLevel = assignIntakeLabelLevels(markers, labelGap)
                    .reduce((max, marker) => Math.max(max, marker.level), 0);
            }

            const bottomPad = hideIntakeLabels
                ? (w < 640 ? 32 : 40)
                : Math.max(w < 640 ? 36 : 48, 48 + maxLevel * 14);
            const layout = chart.options.layout || (chart.options.layout = {});
            const padding = layout.padding || (layout.padding = {});
            layout.padding = {
                ...padding,
                bottom: bottomPad,
                top: 8
            };
        }
    };
}

/**
 * Find intakes near a chart x-offset (hours from curve start).
 *
 * @param {object} result
 * @param {number} offsetHours
 * @param {number} [toleranceHours=0.35]
 * @returns {Array}
 */
function getIntakesNearChartOffset(result, offsetHours, toleranceHours = 0.35) {
    if (!result.intakes) return [];
    return result.intakes.filter(intake => {
        const intakeOffset = intake.hour - result.curveStartHour;
        return Math.abs(intakeOffset - offsetHours) <= toleranceHours;
    });
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

            const hideLabels = chart.width < 520;
            const labelGap = chart.width < 700 ? 44 : 52;
            const markerBaseY = yScale.bottom - (hideLabels ? 18 : 34);
            const labelBaseOffset = 12;
            const labelLevelStep = chart.width < 700 ? 14 : 16;

            const visibleMarkers = [];
            result.intakes.forEach(intake => {
                if (!intake.amountMg || intake.amountMg <= 0) return;
                const offset = intake.hour - result.curveStartHour;
                if (offset < 0 || offset > 24) return;

                const xPos = xScale.getPixelForValue(offset);
                if (xPos < xScale.left || xPos > xScale.right) return;
                visibleMarkers.push({ xPos, intake });
            });

            const staggered = assignIntakeLabelLevels(visibleMarkers, labelGap);
            const maxLevel = staggered.reduce((max, m) => Math.max(max, m.level), 0);

            const ctx = chart.ctx;
            ctx.save();
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';

            staggered.forEach(marker => {
                const { xPos, intake, level } = marker;

                ctx.beginPath();
                ctx.moveTo(xPos, markerBaseY);
                ctx.lineTo(xPos, yScale.bottom - 2);
                ctx.strokeStyle = '#999';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.beginPath();
                ctx.arc(xPos, markerBaseY, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#888';
                ctx.fill();

                if (!hideLabels) {
                    const labelY = markerBaseY - labelBaseOffset - level * labelLevelStep;
                    ctx.fillStyle = '#666';
                    ctx.fillText(`${intake.amountMg} mg`, xPos, labelY);
                }
            });

            chart.$intakeLabelMaxLevel = maxLevel;
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

function getRepeatDoseLinePlugin(result) {
    return {
        id: 'repeatDoseLine',
        afterDraw(chart) {
            const repeat = result.latestRepeatDose;
            if (!repeat || repeat.neverFits || repeat.latestHour == null) return;

            const xScale = chart.scales.x;
            const yScale = chart.scales.y;
            if (!xScale || !yScale) return;

            const offset = repeat.latestHour - result.curveStartHour;
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
            ctx.setLineDash([4, 3]);
            ctx.stroke();
            ctx.fillStyle = '#7a9b8e';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Latest repeat', xPos, yScale.top + 12);
            ctx.restore();
        }
    };
}

/**
 * Custom touch-friendly tooltip for the timeline chart.
 * Shows all visible curves at the nearest time point; auto-hides after 2s unless touching.
 *
 * @param {object} result
 * @param {number[]} curveLow
 * @param {number[]} curveHigh
 * @returns {object} Chart.js plugin
 */
function getTimelineCustomTooltipPlugin(result, curveLow, curveHigh) {
    const SKIP_LABELS = /Lower bound|Uncertainty range|bedtime residual|Baur line/;

    function getNearestDataIndex(chart, pixelX) {
        const dataset = chart.data.datasets.find(d => d.label === 'Estimated concentration');
        if (!dataset?.data?.length) return 0;
        const xScale = chart.scales.x;
        let nearest = 0;
        let minDist = Infinity;
        dataset.data.forEach((pt, i) => {
            const px = xScale.getPixelForValue(pt.x);
            const dist = Math.abs(px - pixelX);
            if (dist < minDist) {
                minDist = dist;
                nearest = i;
            }
        });
        return nearest;
    }

    function buildTooltipHtml(chart, dataIndex) {
        const mainDs = chart.data.datasets.find(d => d.label === 'Estimated concentration');
        const offset = mainDs?.data[dataIndex]?.x ?? 0;
        const timeStr = formatWallClock(result.curveStartHour + offset);
        const rows = [];

        chart.data.datasets.forEach(ds => {
            if (ds.hidden || !ds.label || SKIP_LABELS.test(ds.label)) return;
            const point = ds.data[dataIndex];
            if (!point || point.y == null || Number.isNaN(point.y)) return;
            if (ds.data.length <= 2) return;
            const short = ds.label.replace('Estimated concentration', 'Estimated');
            rows.push(`<div class="chart-tooltip-row"><span>${short}</span><strong>${point.y.toFixed(2)} µg/mL</strong></div>`);
        });

        const low = curveLow[dataIndex]?.toFixed(2);
        const high = curveHigh[dataIndex]?.toFixed(2);
        const extras = [];
        if (low != null && high != null) {
            extras.push(`<div class="chart-tooltip-meta">Range: ${low}–${high} µg/mL</div>`);
        }
        getIntakesNearChartOffset(result, offset).forEach(intake => {
            const sourceLabel = getIntakeSourceLabel(intake);
            extras.push(
                `<div class="chart-tooltip-meta">Intake: ${sourceLabel}, ${intake.amountMg} mg at ${formatWallClock(intake.hour)}</div>`
            );
        });

        return `<div class="chart-tooltip-title">${timeStr}</div>${rows.join('')}${extras.join('')}`;
    }

    return {
        id: 'timelineCustomTooltip',
        afterInit(chart) {
            const parent = chart.canvas.parentNode;
            if (!parent || parent.querySelector('.chart-external-tooltip')) return;

            const chartHost = parent.closest('.chart-container-inner') || parent;
            const el = document.createElement('div');
            el.className = 'chart-external-tooltip';
            el.setAttribute('role', 'tooltip');
            el.hidden = true;
            parent.appendChild(el);

            let hideTimer = null;
            let touching = false;

            const hide = () => {
                el.hidden = true;
                el.style.opacity = '0';
            };

            const scheduleHide = () => {
                clearTimeout(hideTimer);
                hideTimer = setTimeout(() => {
                    if (!touching) hide();
                }, 2000);
            };

            const showAt = (clientX, clientY) => {
                const rect = chart.canvas.getBoundingClientRect();
                const pixelX = clientX - rect.left;
                const dataIndex = getNearestDataIndex(chart, pixelX);
                el.innerHTML = buildTooltipHtml(chart, dataIndex);
                el.hidden = false;
                el.style.opacity = '1';

                const parentRect = parent.getBoundingClientRect();
                let left = clientX - parentRect.left + 12;
                let top = clientY - parentRect.top - 12;
                const maxLeft = parentRect.width - el.offsetWidth - 8;
                const maxTop = parentRect.height - el.offsetHeight - 8;
                left = Math.max(8, Math.min(left, maxLeft));
                top = Math.max(8, Math.min(top, maxTop));
                el.style.left = `${left}px`;
                el.style.top = `${top}px`;
            };

            const onPointerMove = (clientX, clientY) => {
                if (clientX == null || clientY == null) return;
                showAt(clientX, clientY);
                if (!touching) scheduleHide();
            };

            chart.canvas.addEventListener('mousemove', (e) => {
                touching = false;
                onPointerMove(e.clientX, e.clientY);
            });
            chart.canvas.addEventListener('mouseleave', () => {
                touching = false;
                clearTimeout(hideTimer);
                hide();
            });
            chartHost.addEventListener('mouseleave', (e) => {
                if (e.relatedTarget && chartHost.contains(e.relatedTarget)) return;
                touching = false;
                clearTimeout(hideTimer);
                hide();
            });
            chart.canvas.addEventListener('touchstart', (e) => {
                touching = true;
                clearTimeout(hideTimer);
                const t = e.touches[0];
                if (t) onPointerMove(t.clientX, t.clientY);
            }, { passive: true });
            chart.canvas.addEventListener('touchmove', (e) => {
                touching = true;
                clearTimeout(hideTimer);
                const t = e.touches[0];
                if (t) onPointerMove(t.clientX, t.clientY);
            }, { passive: true });
            chart.canvas.addEventListener('touchend', () => {
                touching = false;
                scheduleHide();
            });
            chart.canvas.addEventListener('touchcancel', () => {
                touching = false;
                scheduleHide();
            });

            chart.$timelineTooltip = { hide, scheduleHide };
        },
        beforeDestroy(chart) {
            chart.canvas?.parentNode?.querySelector('.chart-external-tooltip')?.remove();
        }
    };
}

/**
 * Build the Chart.js config for the 24-hour concentration timeline.
 * Plugins: zone bands, bedtime, now, repeat-dose deadline, intake markers.
 *
 * @param {object} result - Output of generateCaffeineCurve
 * @param {{ animate?: boolean }} [chartOptions]
 * @returns {object} Chart.js config object
 */
function getTimelineChartConfig(result, chartOptions = {}) {
    const shouldAnimate = chartOptions.animate !== false;
    const offsets = Object.keys(result.curve).map(Number).sort((a, b) => a - b);
    const toPoints = (curveObj) => offsets.map(offset => ({ x: offset, y: curveObj[offset] }));
    const curveLow = offsets.map(h => result.curveLow[h]);
    const curveHigh = offsets.map(h => result.curveHigh[h]);
    const baurThreshold = typeof BAUR_DELTA_POWER_THRESHOLD !== 'undefined'
        ? BAUR_DELTA_POWER_THRESHOLD
        : WARNING_THRESHOLD;
    const greenThreshold = SAFE_THRESHOLD;
    const overlayMax = Math.max(
        ...Object.values(result.curveHigh),
        ...(result.curveSlow ? Object.values(result.curveSlow) : []),
        ...(result.curveFast ? Object.values(result.curveFast) : []),
        ...(result.curveIntermediate ? Object.values(result.curveIntermediate) : []),
        ...(result.curveWithOcp ? Object.values(result.curveWithOcp) : []),
        ...(result.curveWithoutOcp ? Object.values(result.curveWithoutOcp) : [])
    );
    const yMax = Math.ceil(Math.max(overlayMax, result.peakConcentration, baurThreshold, greenThreshold) * 1.15);
    const baurLinePoints = [{ x: 0, y: baurThreshold }, { x: 24, y: baurThreshold }];
    const greenLinePoints = [{ x: 0, y: greenThreshold }, { x: 24, y: greenThreshold }];

    const overlayDataset = (label, curveObj, color) => ({
        label,
        data: toPoints(curveObj),
        borderColor: color,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        hidden: true,
        order: 2
    });

    return {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Uncertainty range',
                    data: toPoints(result.curveHigh),
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
                    data: toPoints(result.curveLow),
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
                    data: toPoints(result.curve),
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
                    label: 'Lower bedtime residual target (~0.5 µg/mL)',
                    data: greenLinePoints,
                    borderColor: '#7a9b8e',
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderDash: [6, 4],
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    order: 1
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
                },
                overlayDataset('Fast metabolizer', result.curveFast, '#7a9b8e'),
                overlayDataset('Average metabolizer', result.curveIntermediate, '#8a8a8a'),
                overlayDataset('Slow metabolizer', result.curveSlow, '#a87070'),
                overlayDataset('On oral contraceptives', result.curveWithOcp, '#7a9b8e'),
                overlayDataset('No oral contraceptives', result.curveWithoutOcp, '#a87070')
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            parsing: false,
            animation: shouldAnimate ? {
                duration: 550,
                easing: 'easeOutQuart'
            } : false,
            layout: { padding: { left: 2, right: 8, bottom: 36, top: 14 } },
            interaction: { mode: 'nearest', intersect: false },
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        filter: item => {
                            const text = item.text;
                            return !text.includes('Lower bound')
                                && !text.includes('metabolizer')
                                && !text.includes('contraceptive');
                        },
                        boxWidth: 12,
                        usePointStyle: true,
                        padding: 10,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    enabled: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: yMax,
                    title: {
                        display: true,
                        text: 'Concentration (µg/mL)',
                        font: { size: 11, weight: '500' },
                        color: '#2c2c2c',
                        padding: { top: 0, bottom: 4 }
                    },
                    ticks: {
                        callback: value => value.toFixed(1),
                        maxTicksLimit: 6,
                        padding: 2
                    }
                },
                x: {
                    type: 'linear',
                    min: 0,
                    max: 24,
                    ticks: {
                        maxTicksLimit: 13,
                        maxRotation: 0,
                        autoSkip: true,
                        callback: value => formatWallClock(result.curveStartHour + value)
                    },
                    title: {
                        display: true,
                        text: 'Time of Day',
                        font: { size: 11, weight: '500' },
                        color: '#2c2c2c'
                    }
                }
            }
        },
        plugins: [
            getTimelineCustomTooltipPlugin(result, curveLow, curveHigh),
            getTimelineResponsivePlugin(result),
            getZoneBackgroundPlugin(),
            getBedtimeLinePlugin(result),
            getNowLinePlugin(result),
            getPeakMarkerPlugin(result),
            getRepeatDoseLinePlugin(result),
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
        options: getSleepEducationalChartOptions('Sleepiness (illustrative, schematic)')
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
        calculateMaxAdditionalDoseNow,
        calculateLastCaffeineCutoff,
        calculateLatestRepeatDoseTime,
        getStandardDrinkLatestTimes,
        getStandardDrinkDoseTier,
        getStandardDrinkDisplay,
        formatStandardDrinkLatestLine,
        getReferenceRepeatIntake,
        getDrinkEquivalentForMg,
        getReferenceDoseLabel,
        isLegacyCutoffInformative,
        buildCaffeinePlanningContent,
        buildPlanningTeaser,
        formatReferenceIntakeLabel,
        getBedtimeIntakeBreakdown,
        formatLastCaffeineCutoffMessage,
        intakesAtOrBeforeCutoff,
        bedtimeConcentrationForCutoff,
        bedtimeConcentrationForPastIntakes,
        classifyZone,
        concentrationFromSingleIntake,
        totalConcentrationAt,
        generateCaffeineCurve,
        generateRecommendation,
        getZoneBackgroundPlugin,
        getBedtimeOutcome,
        buildOverviewLevelContent,
        buildOverviewLevelSummary,
        buildHowMuchNowContent,
        getZoneMechanismSummary,
        getZoneLabelShort,
        hoursElapsedSameDay,
        hoursElapsedToBedtime,
        findDailyPeak,
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
