'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadEngine() {
    const root = path.join(__dirname, '..');
    const ctx = vm.createContext({
        module: { exports: {} },
        exports: {},
        console,
        Math,
        parseFloat,
        parseInt,
        Number,
        Object,
        Array,
        String,
        Boolean,
        Infinity,
        isNaN: Number.isNaN,
        undefined
    });
    vm.runInContext(fs.readFileSync(path.join(root, 'constants.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(root, 'calculator.js'), 'utf8'), ctx);
    return ctx;
}

const engine = loadEngine();
const {
    generateCaffeineCurve,
    classifyZone,
    findDailyPeak,
    buildOverviewLevelSummary,
    hoursElapsedToBedtime,
    getExerciseDoseGuide,
    getSuggestedPreWorkoutIntake,
    getNextBedtimeHour,
    hoursUntilNextBedtime,
    getBedtimeChartOffset,
    getWorkoutAbsoluteHour,
    findBestWorkoutWindows,
    SAFE_THRESHOLD
} = engine;

const baseParams = {
    intakes: [{ amountMg: 95, hour: 8 }],
    bodyWeight: 70,
    sex: 'unspecified',
    foodStatus: 'fasting',
    onContraceptives: false,
    smoking: false,
    pregnancy: false,
    metabolizerType: 'intermediate',
    nowHour: 14,
    bedtimeHour: 23
};

test('classifyZone uses sleep thresholds', () => {
    assert.match(classifyZone(0.2).label, /Low estimated level/);
    assert.match(classifyZone(0.7).label, /Moderate estimated level/);
    assert.match(classifyZone(1.2).label, /Elevated estimated level/);
    assert.match(classifyZone(2.0).label, /High estimated level/);
});

test('generateCaffeineCurve returns now, peak, and bedtime levels', () => {
    const result = generateCaffeineCurve(baseParams);
    assert.ok(result.concentrationNow > 0);
    assert.ok(result.peakConcentration >= result.concentrationNow);
    assert.ok(result.concentrationAtBedtime > 0);
    assert.ok(result.peakHour >= 8);
    assert.equal(result.zoneAtBedtime.label, result.zoneAtBedtime.label);
});

test('stacked intakes produce higher peak than single dose', () => {
    const single = generateCaffeineCurve(baseParams);
    const stacked = generateCaffeineCurve({
        ...baseParams,
        intakes: [
            { amountMg: 95, hour: 8 },
            { amountMg: 63, hour: 14 }
        ],
        nowHour: 15
    });
    assert.ok(stacked.peakConcentration > single.peakConcentration);
});

test('findDailyPeak locates max on curve', () => {
    const result = generateCaffeineCurve({
        ...baseParams,
        intakes: [
            { amountMg: 95, hour: 8 },
            { amountMg: 63, hour: 14 }
        ],
        nowHour: 16
    });
    const peak = findDailyPeak(result.curve, result.curveLow, result.curveHigh, result.curveStartHour);
    assert.ok(Math.abs(peak.peakConcentration - result.peakConcentration) < 0.01);
    assert.ok(peak.peakHour >= result.curveStartHour);
});

test('hoursElapsedToBedtime wraps forward across midnight', () => {
    assert.equal(hoursElapsedToBedtime(23, 8), 15);
    assert.equal(hoursElapsedToBedtime(1, 22), 3);
});

test('buildOverviewLevelSummary merges when all zones match', () => {
    const result = generateCaffeineCurve({
        ...baseParams,
        nowHour: 22,
        bedtimeHour: 23
    });
    const allLow = result.concentrationNow < SAFE_THRESHOLD
        && result.peakConcentration < SAFE_THRESHOLD
        && result.concentrationAtBedtime < SAFE_THRESHOLD;
    if (allLow) {
        const paragraphs = buildOverviewLevelSummary(result);
        assert.equal(paragraphs.length, 1);
        assert.match(paragraphs[0], /All three snapshots/);
    }
});

test('oral contraceptives lengthen half-life in model', () => {
    const off = generateCaffeineCurve(baseParams);
    const on = generateCaffeineCurve({ ...baseParams, onContraceptives: true });
    assert.ok(on.halfLife > off.halfLife);
    assert.ok(on.concentrationAtBedtime > off.concentrationAtBedtime);
});

test('exercise dose guide scales with body weight', () => {
    const guide = getExerciseDoseGuide(70);
    assert.equal(guide.lowMg, 210);
    assert.equal(guide.highMg, 420);
    assert.equal(guide.lowPerKg, 3);
    assert.equal(guide.highPerKg, 6);
});

test('suggested pre-workout intake uses model Tmax lead time', () => {
    const tip = getSuggestedPreWorkoutIntake(10, 0.75);
    assert.ok(tip);
    assert.equal(tip.leadMinutes, 45);
    assert.ok(Math.abs(tip.suggestedIntakeHour - 9.25) < 1e-6);
});

test('workoutHour yields concentrationAtWorkout on result', () => {
    const result = generateCaffeineCurve({
        ...baseParams,
        intakes: [{ amountMg: 200, hour: 8 }],
        nowHour: 9,
        workoutHour: 9,
        bedtimeHour: 23
    });
    assert.ok(result.exercisePlanning);
    assert.equal(result.exercisePlanning.workoutHour, 9);
    assert.ok(result.exercisePlanning.concentrationAtWorkout > 0);
    assert.equal(result.exercisePlanning.doseGuide.lowMg, 210);
    assert.ok(result.exercisePlanning.hoursWorkoutToBedtime > 0);
    assert.equal(result.exercisePlanning.totalLoggedMg, 200);
});

test('getNextBedtimeHour treats after-midnight bed as next calendar night', () => {
    assert.equal(getNextBedtimeHour(14, 1), 25);
    assert.equal(hoursUntilNextBedtime(14, 1), 11);
    assert.equal(getNextBedtimeHour(14, 23), 23);
    assert.equal(hoursUntilNextBedtime(14, 23), 9);
});

test('bedtime chart offset places next 1 AM after afternoon now', () => {
    const result = generateCaffeineCurve({
        ...baseParams,
        nowHour: 14,
        bedtimeHour: 1
    });
    assert.equal(result.hoursUntilBedtime, 11);
    assert.equal(result.nextBedtimeHour, 25);
    assert.ok(result.bedtimeChartOffset != null);
    assert.ok(result.bedtimeChartOffset > result.nowHour - result.curveStartHour);
    assert.ok(result.bedtimeChartOffset <= 24);
});

test('after-midnight workout uses absolute hour so evening coffee still counts', () => {
    assert.equal(getWorkoutAbsoluteHour(22, 1), 25);
    assert.equal(getWorkoutAbsoluteHour(14, 9), 9);
    assert.equal(getWorkoutAbsoluteHour(10, 14), 14);

    const result = generateCaffeineCurve({
        ...baseParams,
        intakes: [{ amountMg: 200, hour: 20 }],
        nowHour: 22,
        bedtimeHour: 2,
        workoutHour: 1
    });
    assert.equal(result.exercisePlanning.workoutAbsoluteHour, 25);
    assert.ok(result.exercisePlanning.concentrationAtWorkout > 0);
});

test('findBestWorkoutWindows returns elevated band from logged coffee', () => {
    const windows = findBestWorkoutWindows({
        intakes: [{ amountMg: 200, hour: 8 }],
        pkParams: {
            bodyWeight: 70,
            sex: 'unspecified',
            foodStatus: 'fasting',
            onContraceptives: false,
            smoking: false,
            pregnancy: false,
            metabolizerType: 'intermediate'
        },
        nowHour: 9,
        bedtimeHour: 23
    });
    assert.ok(windows.hasSignal);
    assert.ok(windows.peakConc > 0);
    assert.ok(windows.windows.length >= 1);
    assert.ok(windows.windows[0].endAbs >= windows.windows[0].startAbs);
});

test('workout time alone does not change bedtime concentration', () => {
    const shared = {
        ...baseParams,
        intakes: [{ amountMg: 200, hour: 8 }],
        nowHour: 14,
        bedtimeHour: 23
    };
    const early = generateCaffeineCurve({ ...shared, workoutHour: 9 });
    const late = generateCaffeineCurve({ ...shared, workoutHour: 18 });
    assert.equal(early.concentrationAtBedtime, late.concentrationAtBedtime);
    assert.ok(early.exercisePlanning.bestWindows.hasSignal);
});
