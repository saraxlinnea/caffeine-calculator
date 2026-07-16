'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const {
    CITATION_GROUPS,
    CITATION_INDEX,
    cite,
    getCitationRefId
} = require(path.join(root, 'constants.js'));

function allCitationItems() {
    return CITATION_GROUPS.flatMap(group => group.items);
}

function collectDataCiteKeys(source) {
    return [...source.matchAll(/data-cite="([^"]+)"/g)].map(m => m[1]);
}

function collectRefAnchors(source) {
    const fromScroll = [...source.matchAll(/data-scroll="(#ref-[^"]+)"/g)].map(m => m[1].slice(1));
    const fromHref = [...source.matchAll(/href="(#ref-[^"]+)"/g)].map(m => m[1].slice(1));
    return [...new Set([...fromScroll, ...fromHref])];
}

function itemByCiteKey(key) {
    return allCitationItems().find(c => c.citeKey === key);
}

const items = allCitationItems();
const anchorRefIds = items.filter(c => !c.duplicateOf).map(c => c.refId);

test('citation items are numbered sequentially 1..N', () => {
    const nums = items.map(c => c.num);
    assert.deepEqual(nums, Array.from({ length: items.length }, (_, i) => i + 1));
});

test('every citeKey in CITATION_INDEX maps to one group item', () => {
    for (const [key, entry] of Object.entries(CITATION_INDEX)) {
        const item = itemByCiteKey(key);
        assert.ok(item, `citeKey "${key}" has no CITATION_GROUPS item`);
        assert.equal(entry.num, item.num);
        assert.equal(entry.refId, item.refId);
        assert.equal(entry.pmid, item.pmid || null);
    }
});

test('duplicate refId entries point to first occurrence num and only first anchors', () => {
    const byRefId = {};
    for (const c of items) {
        if (byRefId[c.refId]) {
            const first = byRefId[c.refId];
            assert.equal(c.duplicateOf, first.num, `duplicate ${c.refId} should reference first num`);
            assert.ok(first.num < c.num);
        } else {
            byRefId[c.refId] = c;
            assert.equal(c.duplicateOf, undefined);
        }
    }

    const iomEntries = items.filter(c => c.refId === 'ref-NBK223808');
    assert.equal(iomEntries.length, 2);
    assert.equal(iomEntries[1].duplicateOf, iomEntries[0].num);
});

test('every data-cite key in index.html exists in CITATION_INDEX', () => {
    const keys = collectDataCiteKeys(html);
    assert.ok(keys.length > 0, 'expected at least one data-cite in index.html');
    const missing = [...new Set(keys)].filter(k => !CITATION_INDEX[k]);
    assert.deepEqual(missing, []);
});

test('every ref anchor in index.html matches a non-duplicate citation refId', () => {
    const targets = collectRefAnchors(html);
    assert.ok(targets.length > 0, 'expected at least one #ref- anchor in index.html');
    const bad = targets.filter(t => !anchorRefIds.includes(t));
    assert.deepEqual(bad, []);
});

test('every CITATION_INDEX key is referenced in index.html', () => {
    const htmlKeys = new Set(collectDataCiteKeys(html));
    const orphans = Object.keys(CITATION_INDEX).filter(k => !htmlKeys.has(k));
    assert.deepEqual(
        orphans,
        [],
        `CITATION_INDEX keys not used in HTML: ${orphans.join(', ')}`
    );
});

test('cite() output contains bracketed num and refId href for each HTML citeKey', () => {
    const keys = [...new Set(collectDataCiteKeys(html))];
    for (const key of keys) {
        const entry = CITATION_INDEX[key];
        const item = itemByCiteKey(key);
        const out = cite(key);
        assert.match(out, new RegExp(`\\[${entry.num}\\]`));
        assert.match(out, new RegExp(`href="#${entry.refId}"`));
        assert.equal(entry.num, item.num);
    }
});

test('getCitationRefId is stable for items without pre-assigned refId', () => {
    for (const c of items) {
        const { refId, num, duplicateOf, citeKey, ...raw } = c;
        const expected = getCitationRefId(raw);
        if (c.pmid) {
            assert.equal(expected, `ref-${c.pmid}`);
        } else if (c.url && c.url.includes('NBK223808')) {
            assert.equal(expected, 'ref-NBK223808');
        }
        assert.equal(c.refId, expected);
    }
});

test('every citation item has required bibliographic fields', () => {
    for (const c of items) {
        assert.ok(c.authors && c.authors.trim(), `citation [${c.num}] missing authors`);
        assert.ok(c.title && c.title.trim(), `citation [${c.num}] missing title`);
        assert.ok(c.usedFor && c.usedFor.trim(), `citation [${c.num}] missing usedFor`);
        assert.ok(c.year || c.url, `citation [${c.num}] needs year or url`);
    }
});
