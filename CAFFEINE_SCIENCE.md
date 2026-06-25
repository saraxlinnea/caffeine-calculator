# Caffeine Science: Literature Behind the Calculator

This document mirrors the **Evidence** tab in the calculator (`constants.js` → `CITATION_GROUPS`). All PubMed links below were checked against PubMed metadata.

---

## Sleep disruption & timing

### Baur et al. (2024) — concentration vs. EEG delta power

**Title:** Concentration-effect relationships of plasma caffeine on EEG delta power and cardiac autonomic activity during human sleep

**Authors:** Baur DM, Dornbierer DA, Landolt HP

**Journal:** *Journal of Sleep Research*

**Published:** 2024, Volume 33, Issue 5, Article e14140

**PMID:** 38221756

**Link:** https://pubmed.ncbi.nlm.nih.gov/38221756/

**DOI:** 10.1111/jsr.14140

**Study design:**
- 21 healthy young men, randomized double-blind crossover
- 160 mg caffeine or placebo at habitual bedtime; sleep opportunity 4.5 h later
- Simultaneous plasma caffeine, polysomnography, EEG, and heart-rate variability

**Key findings:**
- Plasma caffeine during sleep: 0.2–18.4 µmol/L (high individual variability)
- Non-linear models: EEG delta (0.75–2.5 Hz) reduction above ~7.4 µmol/L (~**1.4 µg/mL**)
- Heart-rate effects above ~4.3–4.9 µmol/L (~0.8–0.9 µg/mL)

**Used in this calculator:**
- Red dashed **Baur line** at ~1.4 µg/mL on the caffeine curve (research reference, not a personal sleep cutoff)
- Zone copy for concentration–effect relationships in controlled sleep recordings

**Note:** An earlier medRxiv preprint (2023) reported similar findings; the published *J Sleep Res* paper (2024) is what the app cites.

---

### Gardiner et al. (2023) — systematic review & meta-analysis

**Title:** The effect of caffeine on subsequent sleep: A systematic review and meta-analysis

**Authors:** Gardiner C, Weakley J, Burke LM, Roach GD, Sargent C, Maniar N, et al.

**Journal:** *Sleep Medicine Reviews*

**Published:** 2023, Volume 69, Article 101764

**PMID:** 36870101

**Link:** https://pubmed.ncbi.nlm.nih.gov/36870101/

**DOI:** 10.1016/j.smrv.2023.101764

**Key findings (24 studies):**
- Caffeine reduced total sleep time by ~45 min and sleep efficiency by ~7%
- Sleep onset latency increased ~9 min; wake after sleep onset ~12 min
- Light sleep (N1) increased; deep sleep (N3/N4) duration and proportion decreased
- Guidance from pooled data: e.g. ~107 mg coffee ~8.8 h before bed; higher doses need longer gaps

**Used in this calculator:**
- Population-average effects on sleep latency, total sleep time, and efficiency
- Planning copy and zone descriptions (dose–timing averages, not personal guarantees)

**Note:** Gardiner et al. also published a 2024 crossover trial in *Sleep* (DOI 10.1093/sleep/zsae230). The calculator cites the **2023 meta-analysis**, which synthesizes dose- and timing effects across studies.

---

### Drake et al. (2013) — caffeine 0, 3, or 6 hours before bed

**Title:** Caffeine effects on sleep taken 0, 3, or 6 hours before going to bed

**Authors:** Drake C, Roehrs T, Shambroom J, Roth T

**Journal:** *Journal of Clinical Sleep Medicine*

**Published:** 2013, Volume 9, Issue 11, Pages 1195–120

**PMID:** 24235903

**Link:** https://pubmed.ncbi.nlm.nih.gov/24235903/

**Used in this calculator:**
- Measurable sleep disruption even when caffeine is taken **6 hours** before bedtime

---

### Clark & Landolt (2017) — mechanisms & variability

**Title:** Coffee, caffeine, and sleep: A systematic review of epidemiological studies and randomized controlled trials

**Authors:** Clark I, Landolt HP

**Journal:** *Sleep Medicine Reviews*

**Published:** 2017, Volume 31, Pages 70–78

**PMID:** 26899133

**Link:** https://pubmed.ncbi.nlm.nih.gov/26899133/

**Used in this calculator:**
- Adenosine receptor mechanisms (A1/A2A), dose–response patterns, and individual variability in caffeine–sleep research

---

### Burke et al. (2015) — circadian clock

**Title:** Effects of caffeine on the human circadian clock in vivo and in vitro

**Authors:** Burke TM, Markwald RR, McHill AW, Chinoy ED, Snider JA, Bessman SC, et al.

**Journal:** *Science Translational Medicine*

**Published:** 2015, Volume 7, Issue 305, Pages 305ra146

**PMID:** 26378246

**Link:** https://pubmed.ncbi.nlm.nih.gov/26378246/

**Used in this calculator:**
- Evening caffeine can delay circadian melatonin timing — separate from adenosine blockade at bedtime

---

## Sleep zones (summary)

Zones in the app combine Baur concentration–effect data with Gardiner/Drake population averages. They are **planning guides**, not personal sleep guarantees.

| Plasma caffeine | Approx. context | Sleep impact (research summary) | Primary reference |
|-----------------|-----------------|-------------------------------|-------------------|
| < 0.5 µg/mL | Lower bedtime residual planning target | Minimal average EEG delta change in Baur protocol | Baur et al. 2024 |
| 0.5–1.4 µg/mL | Caution zone | Partial adenosine blockade; meta-analytic average effects on latency and total sleep | Gardiner et al. 2023 |
| ~1.4 µg/mL | Baur line | Delta-power association in controlled protocol | Baur et al. 2024 |
| 1.4–2.5 µg/mL | Warning zone | Stronger average disruption; reduced slow-wave sleep in studies | Baur et al. 2024; Drake et al. 2013 |
| > 2.5 µg/mL | High zone | Greater average fragmentation and architecture disruption | Gardiner et al. 2023; Drake et al. 2013 |

---

## Pharmacokinetics (core)

**Source:** NCBI Bookshelf — Pharmacology of caffeine

**Link:** https://www.ncbi.nlm.nih.gov/books/NBK223808/

**Data used in the model:**
- Absorption: ~99% within 45 minutes (fasting)
- Peak time (Tmax): ~30–75 minutes (food delays peak, not Cmax)
- Half-life: ~3–7 h in adults (model uses ~5 h base)
- Metabolism: predominantly CYP1A2
- Volume of distribution: ~0.6 L/kg

**Additional PK references in the app:** Grzegorzewski et al. (2021, PMID 35280254); Liguori et al. (1997, PMID 9329065); Arnaud (2011, PMID 20859793).

---

## Genetics (CYP1A2)

**Title:** Genome-wide meta-analysis identifies regions on 7p21 (AHR) and 15q24 (CYP1A2) as determinants of habitual caffeine consumption

**Authors:** Cornelis MC, Monda KL, Yu K, et al.

**Journal:** *PLoS Genetics*

**Published:** 2011, Volume 7, Issue 4, Article e1002033

**PMID:** 21490707

**Link:** https://pubmed.ncbi.nlm.nih.gov/21490707/

**PMC:** https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3072367/

**DOI:** 10.1371/journal.pgen.1002033

**Also cited:** Sachse et al. (1999, PMID 10233211) — CYP1A2 rs762551 and caffeine clearance phenotypes.

**Used in this calculator:**
- Fast / intermediate / slow metabolizer modifiers in the half-life model

---

## Sex, hormones & pregnancy

### Oral contraceptives

**Patwardhan et al. (1980)** — PMID [7359014](https://pubmed.ncbi.nlm.nih.gov/7359014/)  
Impaired elimination of caffeine by oral contraceptive steroids.

**Abernethy & Todd (1985)** — PMID [4029248](https://pubmed.ncbi.nlm.nih.gov/4029248/)  
Impairment of caffeine clearance by chronic use of low-dose oestrogen-containing oral contraceptives.

**Used in this calculator:** OCP half-life modifier (~×1.70).

### Pregnancy

**Knutti et al. (1982)** — PMID [6954898](https://pubmed.ncbi.nlm.nih.gov/6954898/)  
The effect of pregnancy on the pharmacokinetics of caffeine.

**Yu et al. (2016)** — PMID [26358647](https://pubmed.ncbi.nlm.nih.gov/26358647/)  
Pregnancy-induced changes in the pharmacokinetics of caffeine and its metabolites.  
**PMC:** [PMC5564294](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5564294/)

**Used in this calculator:** Pregnancy half-life modifier (~×2.0).

### Smoking

**Parsons & Neims (1978)** — PMID [657717](https://pubmed.ncbi.nlm.nih.gov/657717/)  
Effect of smoking on caffeine clearance.

**Used in this calculator:** Smoking half-life modifier (~×0.5).

---

## Food & absorption

**Grimm et al. (2023)** — PMID [36839650](https://pubmed.ncbi.nlm.nih.gov/36839650/)  
Comparing salivary caffeine kinetics for gastric emptying; supports delayed Tmax with slower gastric emptying.

---

## Safety guidance (not personalized medical advice)

- **FDA:** [Spilling the Beans: How Much Caffeine is Too Much?](https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much)
- **EFSA (2015):** [Scientific Opinion on the safety of caffeine](https://www.efsa.europa.eu/en/efsajournal/pub/4102) — ~400 mg/day habitual intake for healthy adults; lower in pregnancy
