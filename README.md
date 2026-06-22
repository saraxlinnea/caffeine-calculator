# ☕ Caffeine Calculator

Interactive tool to estimate caffeine blood levels and sleep impact — runs entirely in your browser.

**Live site:** [saraxlinnea.github.io/caffeine-calculator](https://saraxlinnea.github.io/caffeine-calculator/)

Try example scenarios: `?scenario=morning`, `?scenario=double`, or `?scenario=late`

## What it does

- Estimates **concentration now and at bedtime** (µg/mL) from logged drinks
- **Overview** verdict and at-a-glance stats
- **Optimal Sleep Planning** — when another drink might fit and how much headroom you have now
- **Bedtime stacking breakdown** — estimated contribution of each logged dose at bedtime
- **Sleep zones** tied to research (adenosine A1/A2A blockade)
- **Evidence** tab with citations and the equations behind your numbers

## Inputs

- Multiple caffeine intakes (time + source or mg)
- Body weight (kg or lbs)
- Bedtime and current time
- CYP1A2 metabolizer type (fast / average / slow)
- Clearance factors: oral contraceptives, smoking, pregnancy
- Food status (absorption delay)

## Results tabs

| Tab | Purpose |
|-----|---------|
| **Overview** | Bedtime outcome, recommendation, quick stats, link to planning |
| **Caffeine curve** | 24h timeline, optimal sleep planning, stacking, weight and clearance charts |
| **Sleep** | Zone reference, receptor diagram, pathway education |
| **Evidence** | Citations, model limitations, personalized math after Calculate |

## Sleep zones (research reference)

Concentration bands on the chart are tied to average effects in controlled studies — not personal guarantees:

- **Below ~0.5 µg/mL:** optimal sleep planning target at bedtime
- **~0.5–1.4 µg/mL:** may delay sleep onset or reduce sleep quality
- **Above ~1.4 µg/mL:** stronger disruption risk (e.g. REM suppression in research)

See `SLEEP_THRESHOLDS.md` for detail.

## Science and documentation

- `CAFFEINE_SCIENCE.md` — literature summary and citations
- `EQUATIONS.md` — pharmacokinetic formulas with examples
- `SLEEP_THRESHOLDS.md` — concentration zones and sleep endpoints
- `CALCULATOR_ARCHITECTURE.md` — technical design (partially predates current tab layout)

## Project files

- `index.html` — UI, styling, and chart wiring
- `calculator.js` — core math engine and Chart.js configs
- `constants.js` — coefficients, zones, citations, factor explainers
- `favicon.svg` / `og-image.png` — site icon and social preview image

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Disclaimer

Educational planning only — not medical advice or a guarantee of how you will sleep tonight.

## Built with

HTML · CSS · JavaScript · [Chart.js](https://www.chartjs.org/) · GitHub Pages

## Key references

- Gardiner et al. (2024) — *Sleep*
- Weibel et al. (2021) — *Journal of Biological Rhythms*
- Baur et al. (2023) — *medRxiv*
- Cornelis et al. (2011) — *PLoS Genetics*
