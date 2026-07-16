# Caffeine Science: Literature Behind the Calculator

This document mirrors the **Evidence** tab in the calculator (`constants.js` → `CITATION_GROUPS`). Citation numbers **[1]–[21]** match the auto-numbered Evidence list. All PubMed links below were checked against PubMed metadata.

---

## Sleep disruption & timing

### [1] Baur et al. (2024) — concentration vs. EEG delta power

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

### [2] Gardiner et al. (2023) — systematic review & meta-analysis

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

### [3] Drake et al. (2013) — caffeine 0, 3, or 6 hours before bed

**Title:** Caffeine effects on sleep taken 0, 3, or 6 hours before going to bed

**Authors:** Drake C, Roehrs T, Shambroom J, Roth T

**Journal:** *Journal of Clinical Sleep Medicine*

**Published:** 2013, Volume 9, Issue 11, Pages 1195–200

**PMID:** 24235903

**Link:** https://pubmed.ncbi.nlm.nih.gov/24235903/

**Used in this calculator:**
- Measurable sleep disruption even when caffeine is taken **6 hours** before bedtime

---

### [4] Clark & Landolt (2017) — mechanisms & variability

**Title:** Coffee, caffeine, and sleep: A systematic review of epidemiological studies and randomized controlled trials

**Authors:** Clark I, Landolt HP

**Journal:** *Sleep Medicine Reviews*

**Published:** 2017, Volume 31, Pages 70–78

**PMID:** 26899133

**Link:** https://pubmed.ncbi.nlm.nih.gov/26899133/

**Used in this calculator:**
- Adenosine receptor mechanisms (A1/A2A), dose–response patterns, and individual variability in caffeine–sleep research

---

### [5] Burke et al. (2015) — circadian clock

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

Zones in the app combine Baur concentration–effect data with Gardiner/Drake population averages. They are **planning guides**, not personal sleep guarantees. The chart uses **five** bands:

| Plasma caffeine | Band | Sleep impact (research summary) | Primary reference |
|-----------------|------|-------------------------------|-------------------|
| < 0.5 µg/mL | Green | Lower bedtime residual planning target | Baur [1] |
| 0.5–1.0 µg/mL | Yellow | May affect onset or quality on average | Gardiner [2] |
| 1.0–1.4 µg/mL | Orange | Elevated; approaches Baur reference | Baur [1]; Gardiner [2] |
| 1.4–2.5 µg/mL | Red | Stronger average disruption in studies | Baur [1]; Drake [3] |
| > 2.5 µg/mL | Dark red | Greater average fragmentation | Gardiner [2]; Drake [3] |

The dashed **Baur line** at ~1.4 µg/mL is a study reference from controlled EEG recordings, not a universal personal cutoff.

---

## Pharmacokinetics (core)

### [8] NCBI Bookshelf — Pharmacology of caffeine

**Link:** https://www.ncbi.nlm.nih.gov/books/NBK223808/

**Data used in the model:**
- Absorption: ~99% within 45 minutes (fasting)
- Peak time (Tmax): ~30–75 minutes (food delays peak, not Cmax)
- Half-life: ~3–7 h in adults (model uses ~5 h base)
- Metabolism: predominantly CYP1A2
- Volume of distribution: ~0.6 L/kg

**Additional PK references in the app:** [6] Grzegorzewski et al. (2021, PMID 35280254); [7] Liguori et al. (1997, PMID 9329065); [9] Arnaud (2011, PMID 20859793).

---

## Genetics (CYP1A2)

### [20] Sachse et al. (1999) — CYP1A2 genotype and caffeine clearance

**Title:** Functional significance of a C→A polymorphism in intron 1 of the cytochrome P450 CYP1A2 gene tested with caffeine

**Authors:** Sachse C, Brockmöller J, Bauer S, Roots I

**Journal:** *British Journal of Clinical Pharmacology*

**Published:** 1999, Volume 47, Issue 4, Pages 445–449

**PMID:** 10233211

**Link:** https://pubmed.ncbi.nlm.nih.gov/10233211/

**Used in this calculator:**
- **Primary basis** for fast / intermediate / slow metabolizer half-life modifiers (AA faster, CC slower)

### [19] Cornelis et al. (2011) — habitual consumption GWAS

**Title:** Genome-wide meta-analysis identifies regions on 7p21 (AHR) and 15q24 (CYP1A2) as determinants of habitual caffeine consumption

**Authors:** Cornelis MC, Monda KL, Yu K, et al.

**Journal:** *PLoS Genetics*

**Published:** 2011, Volume 7, Issue 4, Article e1002033

**PMID:** 21490707

**Link:** https://pubmed.ncbi.nlm.nih.gov/21490707/

**PMC:** https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3072367/

**DOI:** 10.1371/journal.pgen.1002033

**Used in this calculator:**
- Cited for CYP1A2 genotype associations with habitual intake; supports inter-individual variability narrative. Clearance modifiers follow Sachse [20], not consumption GWAS effect sizes directly.

---

## Sex, hormones & pregnancy

### Oral contraceptives

**[10] Patwardhan et al. (1980)** — PMID [7359014](https://pubmed.ncbi.nlm.nih.gov/7359014/)  
Impaired elimination of caffeine by oral contraceptive steroids.

**[11] Abernethy & Todd (1985)** — PMID [4029248](https://pubmed.ncbi.nlm.nih.gov/4029248/)  
Impairment of caffeine clearance by chronic use of low-dose oestrogen-containing oral contraceptives.

**Used in this calculator:** OCP half-life modifier (~×1.70).

### Pregnancy

**[12] Knutti et al. (1982)** — PMID [6954898](https://pubmed.ncbi.nlm.nih.gov/6954898/)  
The effect of pregnancy on the pharmacokinetics of caffeine.

**[13] Yu et al. (2016)** — PMID [26358647](https://pubmed.ncbi.nlm.nih.gov/26358647/)  
Pregnancy-induced changes in the pharmacokinetics of caffeine and its metabolites.  
**PMC:** [PMC5564294](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5564294/)

**Used in this calculator:** Pregnancy half-life modifier (~×2.0; simplified; trimester varies).

### Smoking

**[15] Parsons & Neims (1978)** — PMID [657717](https://pubmed.ncbi.nlm.nih.gov/657717/)  
Effect of smoking on caffeine clearance.

**Used in this calculator:** Smoking half-life modifier (~×0.5).

---

## Food & absorption

**[21] Grimm et al. (2023)** — PMID [36839650](https://pubmed.ncbi.nlm.nih.gov/36839650/)  
Comparing salivary caffeine kinetics for gastric emptying; supports delayed Tmax with slower gastric emptying.

---

## Exercise & performance

Population guidance for the Overview **Exercise timing & dose guide**. Not personal performance prescriptions. PMIDs verified via NCBI.

### [22] Guest et al. (2021) — ISSN position stand

**Title:** International society of sports nutrition position stand: caffeine and exercise performance

**PMID:** [33388079](https://pubmed.ncbi.nlm.nih.gov/33388079/) · **PMC:** [PMC7777221](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7777221/)

**Used in this calculator:** ~3–6 mg/kg dose range, common ~60 min pre-exercise timing, broad ergogenic consensus framing.

### [23] Grgic et al. (2020) — umbrella review

**Title:** Wake up and smell the coffee: caffeine supplementation and exercise performance—an umbrella review of 21 published meta-analyses

**PMID:** [30926628](https://pubmed.ncbi.nlm.nih.gov/30926628/)

**Used in this calculator:** Cross-outcome synthesis (endurance, strength, power); supports cautious population-average language.

### [24] Southward et al. (2018) — endurance meta-analysis

**Title:** The effect of acute caffeine ingestion on endurance performance: a systematic review and meta-analysis

**PMID:** [29876876](https://pubmed.ncbi.nlm.nih.gov/29876876/)

**Used in this calculator:** Endurance time-trial effects at moderate doses (~3–6 mg/kg).

### [25] Grgic et al. (2018) — strength & power meta-analysis

**Title:** Effects of caffeine intake on muscle strength and power: a systematic review and meta-analysis

**PMID:** [29527137](https://pubmed.ncbi.nlm.nih.gov/29527137/)

**Used in this calculator:** Small average strength/power effects; softer language than endurance claims.

### [26] Ganio et al. (2009) — sport-specific endurance review

**Title:** Effect of caffeine on sport-specific endurance performance: a systematic review

**PMID:** [19077738](https://pubmed.ncbi.nlm.nih.gov/19077738/)

**Used in this calculator:** Sport-specific endurance time-trial context; supports 3–6 mg/kg dosing language.

### [27] Doherty & Smith (2004) — exercise testing meta-analysis

**Title:** Effects of caffeine ingestion on exercise testing: a meta-analysis

**PMID:** [15657469](https://pubmed.ncbi.nlm.nih.gov/15657469/)

**Used in this calculator:** Foundational ergogenic evidence, especially endurance / time-to-exhaustion protocols.

### [28] Pickering & Kiely (2019) — habitual use

**Title:** What should we do about habitual caffeine use in athletes?

**PMID:** [30173351](https://pubmed.ncbi.nlm.nih.gov/30173351/)

**Used in this calculator:** Response variability / habitual-use caveat.

---

## Safety guidance (not personalized medical advice)

- **[17] FDA:** [Spilling the Beans: How Much Caffeine is Too Much?](https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much)
- **[18] EFSA (2015):** [Scientific Opinion on the safety of caffeine](https://www.efsa.europa.eu/en/efsajournal/pub/4102) — ~400 mg/day habitual intake for healthy adults; lower in pregnancy

---

## Full bibliography (Evidence tab order)

| Ref | Authors (short) | Year | PMID / link |
|-----|-----------------|------|-------------|
| [1] | Baur et al. | 2024 | [38221756](https://pubmed.ncbi.nlm.nih.gov/38221756/) |
| [2] | Gardiner et al. | 2023 | [36870101](https://pubmed.ncbi.nlm.nih.gov/36870101/) |
| [3] | Drake et al. | 2013 | [24235903](https://pubmed.ncbi.nlm.nih.gov/24235903/) |
| [4] | Clark & Landolt | 2017 | [26899133](https://pubmed.ncbi.nlm.nih.gov/26899133/) |
| [5] | Burke et al. | 2015 | [26378246](https://pubmed.ncbi.nlm.nih.gov/26378246/) |
| [6] | Grzegorzewski et al. | 2021 | [35280254](https://pubmed.ncbi.nlm.nih.gov/35280254/) |
| [7] | Liguori et al. | 1997 | [9329065](https://pubmed.ncbi.nlm.nih.gov/9329065/) |
| [8] | IOM / NCBI Bookshelf | 2001 | [NBK223808](https://www.ncbi.nlm.nih.gov/books/NBK223808/) |
| [9] | Arnaud | 2011 | [20859793](https://pubmed.ncbi.nlm.nih.gov/20859793/) |
| [10] | Patwardhan et al. | 1980 | [7359014](https://pubmed.ncbi.nlm.nih.gov/7359014/) |
| [11] | Abernethy & Todd | 1985 | [4029248](https://pubmed.ncbi.nlm.nih.gov/4029248/) |
| [12] | Knutti et al. | 1982 | [6954898](https://pubmed.ncbi.nlm.nih.gov/6954898/) |
| [13] | Yu et al. | 2016 | [26358647](https://pubmed.ncbi.nlm.nih.gov/26358647/) |
| [14] | Gu et al. | 1992 | [1302044](https://pubmed.ncbi.nlm.nih.gov/1302044/) |
| [15] | Parsons & Neims | 1978 | [657717](https://pubmed.ncbi.nlm.nih.gov/657717/) |
| [16] | IOM (duplicate) | 2001 | Same as [8] |
| [17] | FDA | 2023 | [Consumer update](https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much) |
| [18] | EFSA | 2015 | [4102](https://www.efsa.europa.eu/en/efsajournal/pub/4102) |
| [19] | Cornelis et al. | 2011 | [21490707](https://pubmed.ncbi.nlm.nih.gov/21490707/) |
| [20] | Sachse et al. | 1999 | [10233211](https://pubmed.ncbi.nlm.nih.gov/10233211/) |
| [21] | Grimm et al. | 2023 | [36839650](https://pubmed.ncbi.nlm.nih.gov/36839650/) |
| [22] | Guest et al. | 2021 | [33388079](https://pubmed.ncbi.nlm.nih.gov/33388079/) |
| [23] | Grgic et al. (umbrella) | 2020 | [30926628](https://pubmed.ncbi.nlm.nih.gov/30926628/) |
| [24] | Southward et al. | 2018 | [29876876](https://pubmed.ncbi.nlm.nih.gov/29876876/) |
| [25] | Grgic et al. (strength) | 2018 | [29527137](https://pubmed.ncbi.nlm.nih.gov/29527137/) |
| [26] | Ganio et al. | 2009 | [19077738](https://pubmed.ncbi.nlm.nih.gov/19077738/) |
| [27] | Doherty & Smith | 2004 | [15657469](https://pubmed.ncbi.nlm.nih.gov/15657469/) |
| [28] | Pickering & Kiely | 2019 | [30173351](https://pubmed.ncbi.nlm.nih.gov/30173351/) |
