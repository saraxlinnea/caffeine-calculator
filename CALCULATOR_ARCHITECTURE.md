# Caffeine Calculator: Technical Architecture

## Application overview

Static single-page site (`index.html` + `calculator.js` + `constants.js`) on GitHub Pages. After **Calculate**, results appear in five tabs.

### File roles

| File | Responsibility |
|------|----------------|
| `index.html` | Layout, CSS, form inputs, tab switching, Chart.js lifecycle, inline glue (`calculateCaffeine`, Overview panels, copy summary) |
| `calculator.js` | PK engine, zone classification, recommendation copy, Chart.js config builders, custom timeline tooltip |
| `constants.js` | Coefficients, sleep zones, citations, factor explainers |
| `test/calculator.test.js` | Node unit tests for PK math |
| `test/citations.test.js` | Node integration tests for citation registry + HTML wiring |

### Result tabs

1. **Overview** — Primary dashboard.
   - **Inputs glance strip:** total mg, intake count, half-life, as-of time, bedtime.
   - **Three level cards:** Right now, Today's peak, At bedtime (zone badge, µg/mL, uncertainty range, time subtitle).
   - **Bedtime recommendation** (`#mainRecommendation`) directly under the cards, from `generateRecommendation()`.
   - **µg/mL primer** and **collapsed explainer** (`<details>`) via `buildOverviewLevelSummary()`.
   - **Plan your next drink** (Overview only; not duplicated on Curve).
   - **Exercise teaser** (`#exerciseOverviewTeaser`): compact summary; links to Exercise tab.
   - Cross-links to Curve chart, Exercise tab, and Sleep zone reference.

2. **Caffeine curve** — 24-hour timeline + educational sub-charts.
   - Compare toolbar **below** the chart title (not overlaid on the plot).
   - Custom external tooltip: all visible datasets (including compare overlays), 2s auto-hide, touch-follow on mobile.
   - Stacking breakdown, weight vs peak, metabolizer/OCP clearance charts.
   - Charts **lazy-drawn** when the tab becomes visible; destroyed on recalculate.

3. **Sleep** — Zone reference, receptor diagram, schematic Chart.js education charts (lazy-drawn).

4. **Exercise** — Workout planning + cited research context.
   - **Your workout plan** (`#exercisePlanningSection`): optional workout time → estimated plasma at workout, Tmax-based intake tip, 3–6 mg/kg dose range, sleep tradeoff when bedtime ≥ 0.5 µg/mL, OCP clearance note.
   - **Worth it?** callout: small average benefits; sleep tradeoff often matters more.
   - **Risks, energy drinks, and other ingredients:** caffeine-only model caveat; taurine/caffeine interaction literature; exercise BP meta-analysis cites.
   - Collapsible sections: research summary (sport-type table), dose/timing reference, model limits.
   - `getWorkoutLinePlugin()` draws workout marker on 24h curve when workout time is set.

5. **Evidence** — Numbered citations `[1]`–`[N]`, model limitations, personalized math walkthrough.

### Citation numbering (`constants.js` + `index.html`)

Single source of truth: `CITATION_GROUPS` (~32 items in 7 groups).

```
CITATION_GROUPS
  └── items may include citeKey: 'baur2024'
        ↓
assignCitationNumbers()  (runs once at load)
  ├── num: 1, 2, 3… in group order
  ├── refId: ref-{pmid} | ref-NBK223808 | ref-doi-…
  ├── duplicateOf: first num when refId repeats (IOM book → [16] points to [8])
  └── CITATION_INDEX { citeKey → { num, refId, pmid, short } }
        ↓
index.html
  ├── data-cite="baur2024" → applyInlineCitations() → cite() → [N] superscript
  ├── renderCitations() → Evidence list with [N] prefix + id="{refId}"
  └── data-scroll="#ref-{pmid}" on input panel (scroll-only; no inline number)
```

Inline `data-cite` keys today: sleep papers (`baur2024` … `burke2015`) plus exercise papers (`guest2021` … `pickering2019`, `grinberg2022`, `ellermann2022`, `schaffer2014`, `gutierrez2021`). `test/citations.test.js` guards registry ↔ HTML consistency.

### Calculation flow

```
User inputs → generateCaffeineCurve(params)
  → half-life from sex, food, smoking, OCP, pregnancy, metabolizer type
  → stacked intakes → curve samples (0.5 h steps)
  → findDailyPeak() for today's peak time/level
  → concentrationNow, concentrationAtBedtime, zones
  → generateRecommendation(), buildOverviewLevelContent(), chart configs
```

### Chart lifecycle (`index.html`)

- `destroyCurveCharts()` on each Calculate (avoids stale/hidden canvas state).
- `ensureCurveCharts()` when user opens **Caffeine curve** tab.
- Sleep tab charts initialized on first open of **Sleep** tab.

### Time model

- **Current time** defaults to device clock on load (`getDefaultNowTime()`); 2:00 PM fallback if unset.
- Scenario buttons can override time when clicked.
- Same-day elapsed hours only (`hoursElapsedSameDay`); no yesterday carryover.

### Testing

```bash
npm test                        # PK + citation tests (includes exercise helpers)
python3 -m http.server 8080     # manual browser QA
```

---

## Chart reference

Charts live on **Caffeine curve** and **Sleep** tabs. All use Chart.js, configured in `calculator.js`.

| Chart | Tab | Purpose |
|-------|-----|---------|
| 24-hour timeline | Curve | User's stacked concentration curve with sleep-zone background bands; optional compare overlays (metabolism speed, OCP) |
| Weight vs peak | Curve | Inverse relationship: same dose, different body weights |
| Metabolizer clearance | Curve | Fast / intermediate / slow decay curves (% remaining) |
| OCP clearance | Curve | With vs without oral contraceptives |
| Sleep education (pressure, masking, melatonin) | Sleep | Schematic curves for adenosine/caffeine education (not personalized PK) |

**Timeline visual elements:** Y-axis µg/mL, X-axis clock time, colored zone bands from `SLEEP_ZONES`, markers for now and bedtime, uncertainty band on main curve.

---

## Pharmacokinetics (core formulas)

Implemented in `calculator.js`; coefficients in `constants.js`.

```
k = 0.693 / t½
C_peak ≈ (dose_mg × absorption_factor) / weight_kg
C(t) = Σ C_peak,i × exp(-k × hours_since_peak,i)   // stacked intakes
```

Half-life modifiers: sex, food, smoking, OCP, pregnancy, CYP1A2 metabolizer type.

Peak time (Tmax) adjusted for fed vs fasting. Curve sampled every 0.5 h from earliest intake through bedtime window.

---

## Sleep zones

From `constants.js` / `@SLEEP_THRESHOLDS.md`. Used for card badges, chart bands, and recommendations.

| Zone | µg/mL | Label |
|------|-------|-------|
| Green | &lt; 0.5 | Low estimated level |
| Yellow | 0.5–1.0 | Moderate estimated level |
| Orange | 1.0–1.4 | Elevated estimated level |
| Red | 1.4–2.5 | High estimated level |
| Dark red | &gt; 2.5 | Very high estimated level |

Language stays probabilistic ("estimated", "may") — not absolute safe/unsafe claims.

---

## Data flow

```
index.html (form)
  → getFormData() / getIntakesFromForm()
  → generateCaffeineCurve()          [calculator.js]
  → result object (curve, zones, peak, recommendation, …)
  → updateBedtimeOutcomePanel()      [cards + recommendation + explainer]
  → getTimelineChartConfig() etc.    [lazy on tab open]
  → Chart.js render
```

---

## Mobile UX notes

- Timeline chart fits ~390px viewport; no `min-width` forcing horizontal scroll.
- Compare buttons sit below chart title, not over the plot.
- Custom timeline tooltip follows touch; auto-hides after 2s.
- Collapsed input summary stays above results after Calculate.

---

## Known model limitations

- Same-day time model only; no carryover from previous days.
- Peak time sampled every 0.5 h (display can wrap past midnight).
- Subjective feel copy is interpretive, not personalized lab data.
