# ☕ Caffeine Calculator

Most caffeine advice boils down to a fixed cutoff time ("stop by 2pm"). That ignores stacking, clearance genetics, and oral contraceptives. This calculator estimates blood caffeine (µg/mL) from your actual drinks and maps bedtime levels to cited sleep research, with the math shown.

**Live site:** [saraxlinnea.github.io/caffeine-calculator](https://saraxlinnea.github.io/caffeine-calculator/)

Try example scenarios: `?scenario=morning`, `?scenario=double`, or `?scenario=late`

## What it does

- **Your levels (Overview):** compact summary strip, then estimated concentration right now, at today's peak, and at bedtime (collapsible explainers)
- **Current time** fills from your device clock on load (falls back to 2:00 PM if unavailable)
- **Plan your next drink:** when another drink might fit and how much headroom you have now
- **Bedtime stacking breakdown:** estimated contribution of each logged dose at bedtime
- **Sleep zones** tied to research (adenosine A1/A2A blockade)
- **Evidence** tab with citations and the equations behind your numbers

## Inputs

- Multiple caffeine intakes (time + source or mg)
- Body weight (kg or lbs)
- Bedtime and current time
- CYP1A2 metabolizer type (fast / average / slow)
- Hormonal factors: oral contraceptives, pregnancy
- Lifestyle: smoking (CYP1A2 induction)
- Food status (absorption delay)

## Results tabs

| Tab | Purpose |
|-----|---------|
| **Overview** | Glance strip, three level cards, recommendation, collapsed level explainers, plan next drink |
| **Caffeine curve** | 24h timeline, plan your next drink, stacking, weight and clearance charts |
| **Sleep** | Zone reference, receptor diagram, pathway education |
| **Evidence** | Citations, model limitations, personalized math after Calculate |

## Sleep zones (research reference)

Concentration bands on the chart are tied to average effects in controlled studies. They are not personal guarantees:

- **Below ~0.5 µg/mL:** lower bedtime residual planning target
- **~0.5–1.4 µg/mL:** may delay sleep onset or reduce sleep quality
- **Above ~1.4 µg/mL:** stronger disruption risk (e.g. REM suppression in research)

See `SLEEP_THRESHOLDS.md` for detail.

## Science and documentation

- `CAFFEINE_SCIENCE.md`: literature summary and citations
- `EQUATIONS.md`: pharmacokinetic formulas with examples
- `SLEEP_THRESHOLDS.md`: concentration zones and sleep endpoints
- `CALCULATOR_ARCHITECTURE.md`: technical design (partially predates current tab layout)

## Project files

- `index.html`: UI, styling, and chart wiring
- `calculator.js`: core math engine and Chart.js configs
- `constants.js`: coefficients, zones, citations, factor explainers
- `favicon.svg` / `assets/caffeine-preview.png`: site icon and social preview image

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Testing

There is no automated test suite: no unit tests for `calculator.js` and no browser tests in CI. That means nothing runs on push to catch regressions in the math or charts.

After you change the code, check it manually in a browser:

1. Hard refresh, confirm **Current Time** matches your clock (or 2:00 PM fallback).
2. Log a dose, press **Calculate**, and read the three Overview cards (now, peak, bedtime).
3. Open **Caffeine curve** and confirm the timeline and clearance charts render.
4. Open **Sleep** and confirm the schematic charts render.
5. Try a scenario button (`Morning coffee`, etc.) and confirm demo times override the clock.

That manual pass is the project's QA until automated tests are added.

## Disclaimer

Educational planning only. Not medical advice or a guarantee of how you will sleep tonight.

## Built with

HTML · CSS · JavaScript · [Chart.js](https://www.chartjs.org/) · GitHub Pages

## Key references

- Gardiner et al. (2023): meta-analysis, *Sleep Med Rev* ([PMID 36870101](https://pubmed.ncbi.nlm.nih.gov/36870101/))
- Baur et al. (2024): concentration–EEG sleep study, *J Sleep Res* ([PMID 38221756](https://pubmed.ncbi.nlm.nih.gov/38221756/))
- Drake et al. (2013): caffeine 0/3/6 h before bed, *J Clin Sleep Med* ([PMID 24235903](https://pubmed.ncbi.nlm.nih.gov/24235903/))
- Clark & Landolt (2017): caffeine and sleep review, *Sleep Med Rev* ([PMID 26899133](https://pubmed.ncbi.nlm.nih.gov/26899133/))
- Cornelis et al. (2011): CYP1A2 genetics, *PLoS Genet* ([PMID 21490707](https://pubmed.ncbi.nlm.nih.gov/21490707/))

Full bibliography: Evidence tab in the app or `CAFFEINE_SCIENCE.md`.
