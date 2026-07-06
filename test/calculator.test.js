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
