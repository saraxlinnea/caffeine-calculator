# Caffeine Calculator: Technical Architecture

## Application overview

Static single-page site (`index.html` + `calculator.js` + `constants.js`) on GitHub Pages. After **Calculate**, results appear in four tabs.

### File roles

| File | Responsibility |
|------|----------------|
| `index.html` | Layout, CSS, form inputs, tab switching, Chart.js lifecycle, inline glue (`calculateCaffeine`, Overview panels, copy summary) |
| `calculator.js` | PK engine, zone classification, recommendation copy, Chart.js config builders, custom timeline tooltip |
| `constants.js` | Coefficients, sleep zones, citations, factor explainers |
| `test/calculator.test.js` | Node unit tests (`npm test`) for core math |

### Result tabs

1. **Overview** — Primary dashboard.
   - **Inputs glance strip:** total mg, intake count, half-life, as-of time, bedtime.
   - **Three level cards:** Right now, Today's peak, At bedtime (zone badge, µg/mL, uncertainty range, time subtitle).
   - **Bedtime recommendation** (`#mainRecommendation`) directly under the cards, from `generateRecommendation()`.
   - **µg/mL primer** and **collapsed explainer** (`<details>`) via `buildOverviewLevelSummary()`.
   - **Plan your next drink** (Overview only; not duplicated on Curve).
   - Cross-links to Curve chart and Sleep zone reference.

2. **Caffeine curve** — 24-hour timeline + educational sub-charts.
   - Compare toolbar **below** the chart title (not overlaid on the plot).
   - Custom external tooltip: all visible datasets (including compare overlays), 2s auto-hide, touch-follow on mobile.
   - Stacking breakdown, weight vs peak, metabolizer/OCP clearance charts.
   - Charts **lazy-drawn** when the tab becomes visible; destroyed on recalculate.

3. **Sleep** — Zone reference, receptor diagram, schematic Chart.js education charts (lazy-drawn).

4. **Evidence** — Citations, model limitations, personalized math walkthrough.

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
npm test                        # Node unit tests for calculator.js
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
