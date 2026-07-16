# The Caffeine Calculator

**Cups, Clocks, and Curves**

Most caffeine advice boils down to a fixed cutoff time ("stop by 2pm"). That ignores stacking, clearance genetics, and oral contraceptives. This calculator estimates blood caffeine (µg/mL) from your actual drinks and maps bedtime levels to cited sleep research, with the math shown.

**Live site:** [saraxlinnea.github.io/caffeine-calculator](https://saraxlinnea.github.io/caffeine-calculator/)

Try example scenarios: `?scenario=morning`, `?scenario=double`, or `?scenario=late`

## What it does

- **Your levels (Overview):** compact summary strip, then estimated concentration right now, at today's peak, and at bedtime (collapsible explainers)
- **Current time** fills from your device clock on load (falls back to 2:00 PM if unavailable)
- **Plan your next drink:** when another drink might fit and how much headroom you have now
- **Exercise timing & dose guide:** dedicated **Exercise** tab plus Overview teaser — optional workout time, estimated caffeine at workout, Tmax timing tip, 3–6 mg/kg range, research context, and sleep-tradeoff framing when bedtime levels are elevated
- **Bedtime stacking breakdown:** estimated contribution of each logged dose at bedtime
- **Sleep zones** tied to research (adenosine A1/A2A blockade)
- **Evidence** tab with numbered citations synced to inline refs, plus the equations behind your numbers

## Inputs

- Multiple caffeine intakes (time + source or mg)
- Body weight (kg or lbs)
- Bedtime, current time, and optional workout time
- CYP1A2 metabolizer type (fast / average / slow)
- Hormonal factors: oral contraceptives, pregnancy
- Lifestyle: smoking (CYP1A2 induction)
- Food status (absorption delay)

## Results tabs

| Tab | Purpose |
|-----|---------|
| **Overview** | Glance strip, three level cards, recommendation, plan next drink, exercise teaser |
| **Caffeine curve** | 24h timeline, compare overlays, stacking, weight and clearance charts |
| **Sleep** | Zone reference, receptor diagram, pathway education |
| **Exercise** | Workout plan, research summary, risks/energy drinks, dose/timing, sleep tradeoff |
| **Evidence** | Numbered bibliography, model limitations, personalized math after Calculate |

## Sleep zones (research reference)

The app uses **five** concentration bands on the chart (green → dark red). They reflect average effects in controlled studies, not personal guarantees:

| Band | µg/mL | Summary |
|------|-------|---------|
| Green | &lt; 0.5 | Lower bedtime residual planning target |
| Yellow | 0.5–1.0 | May begin to affect sleep onset or quality |
| Orange | 1.0–1.4 | Elevated; approaches Baur research reference (~1.4) |
| Red | 1.4–2.5 | Stronger average disruption risk in studies |
| Dark red | &gt; 2.5 | Very high estimated level |

See `SLEEP_THRESHOLDS.md` for detail.

## Science and documentation

- `CAFFEINE_SCIENCE.md`: literature summary and citations (numbered to match Evidence tab)
- `EQUATIONS.md`: pharmacokinetic formulas with examples
- `SLEEP_THRESHOLDS.md`: concentration zones and sleep endpoints
- `CALCULATOR_ARCHITECTURE.md`: technical design (tabs, charts, citation wiring, tests)

## Project files

- `index.html`: UI, styling, and chart wiring
- `calculator.js`: core math engine and Chart.js configs
- `constants.js`: coefficients, zones, citations, factor explainers
- `test/calculator.test.js`, `test/citations.test.js`: automated tests
- `favicon.svg` / `assets/caffeine-preview.png`: site icon and social preview image

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Testing

**Automated:** run `npm test` for **16 Node tests**:

- `test/calculator.test.js` — PK math (`generateCaffeineCurve`, `findDailyPeak`, `classifyZone`, etc.)
- `test/citations.test.js` — citation registry, inline `data-cite` keys, and `#ref-` anchor consistency with `index.html`

**Manual (browser):** after code changes, hard refresh and spot-check:

1. Confirm **Current Time** matches your clock (or 2:00 PM fallback).
2. Log a dose, press **Calculate**, and read the three Overview cards (now, peak, bedtime).
3. Open **Caffeine curve** — compare buttons below title, timeline tooltip on touch/hover, sub-charts render.
4. Open **Sleep** and confirm schematic charts render; inline `[1]`–`[5]` links jump to numbered Evidence entries.
5. Try a scenario button (`Morning coffee`, etc.) and confirm demo times override the clock.

## Disclaimer

Educational planning only. Not medical advice or a guarantee of how you will sleep tonight.

## Built with

HTML · CSS · JavaScript · [Chart.js](https://www.chartjs.org/) · GitHub Pages

## Key references

- Gardiner et al. (2023) [2]: meta-analysis, *Sleep Med Rev* ([PMID 36870101](https://pubmed.ncbi.nlm.nih.gov/36870101/))
- Baur et al. (2024) [1]: concentration–EEG sleep study, *J Sleep Res* ([PMID 38221756](https://pubmed.ncbi.nlm.nih.gov/38221756/))
- Drake et al. (2013) [3]: caffeine 0/3/6 h before bed, *J Clin Sleep Med* ([PMID 24235903](https://pubmed.ncbi.nlm.nih.gov/24235903/))
- Clark & Landolt (2017) [4]: caffeine and sleep review, *Sleep Med Rev* ([PMID 26899133](https://pubmed.ncbi.nlm.nih.gov/26899133/))
- Burke et al. (2015) [5]: circadian melatonin delay, *Sci Transl Med* ([PMID 26378246](https://pubmed.ncbi.nlm.nih.gov/26378246/))
- Guest et al. (2021): ISSN caffeine & exercise position stand ([PMID 33388079](https://pubmed.ncbi.nlm.nih.gov/33388079/))
- Sachse et al. (1999) [20]: CYP1A2 genotype and caffeine clearance (*Br J Clin Pharmacol*; [PMID 10233211](https://pubmed.ncbi.nlm.nih.gov/10233211/)) — primary basis for fast/slow metabolizer modifiers
- Cornelis et al. (2011) [19]: CYP1A2 genetics and habitual consumption, *PLoS Genet* ([PMID 21490707](https://pubmed.ncbi.nlm.nih.gov/21490707/))

Full numbered bibliography: Evidence tab in the app or `CAFFEINE_SCIENCE.md`.
