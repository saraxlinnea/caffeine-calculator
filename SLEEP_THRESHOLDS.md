# Caffeine Concentration & Sleep Impact Thresholds

## Research-Backed Sleep Disruption Zones

Zone boundaries in the calculator align with **Baur et al. (2024)** [1] concentration–EEG findings, **Gardiner et al. (2023)** [2] meta-analysis averages, and **Drake et al. (2013)** [3] dose-timing effects. Adenosine mechanism context draws on **Clark & Landolt (2017)** [4]. These are population research references, not personal sleep guarantees.

The app chart uses **five** bands (green, yellow, orange, red, dark red); see `constants.js` thresholds at 0.5, 1.0, 1.4, and 2.5 µg/mL.

See `CAFFEINE_SCIENCE.md` for full citations (PubMed links).

---

## The Five Sleep Disruption Zones

The calculator uses **five** bands in `constants.js` (green, yellow, orange, red, dark red). Percent ranges below are **illustrative** population averages from studies, not precise predictions at your exact µg/mL.

### **ZONE 1: LOW (🟢 Green)**

**Concentration Range:** < 0.5 µg/mL

**What Happens:**
- Minimal to no impact on sleep architecture
- REM sleep: normal timing and duration
- Deep sleep (Stage 3): unaffected
- Sleep onset: normal latency (time to fall asleep)

**User Perception:**
- Feel rested upon waking
- Normal sleep quality reported

**When This Applies:**
- Caffeine taken 12+ hours before bed
- Single low dose (< 50 mg)
- Empty stomach absorption

**Recommendation:** Lower bedtime residual planning target; may be compatible with sleep for many people

**Associated Dose (approx):**
- 30 mg caffeine @ 70kg = 0.42 µg/mL ✅

---

### **ZONE 2: MODERATE (🟡 Yellow)**

**Concentration Range:** 0.5–1.0 µg/mL

**What Happens (illustrative averages):**
- Subtle sleep architecture changes may appear
- REM sleep latency: may be slightly delayed
- Light sleep (Stage 1-2): may increase
- Deep sleep (Stage 3 delta): may be slightly reduced

**Physiological Changes:**
- Heart rate: may increase modestly
- EEG delta power: minimal reduction in some studies
- Sleep fragmentation: often minimal

**User Perception:**
- May feel like "lighter sleep"
- May take slightly longer to fall asleep
- Possible night waking
- Morning alertness: normal to slightly reduced

**When This Applies:**
- Caffeine taken 6-10 hours before bed
- Moderate dose (75-150 mg)
- With food (delayed absorption)

**Recommendation:** ⚠️ **CAUTION — May impact sleep quality for some people**

**Associated Doses (approx):**
- 80 mg caffeine @ 70kg = 1.1 µg/mL (upper yellow)
- 50 mg caffeine @ 70kg = 0.7 µg/mL

---

### **ZONE 3: ELEVATED (🟠 Orange)**

**Concentration Range:** 1.0–1.4 µg/mL

**What Happens (illustrative averages):**
- More noticeable sleep architecture changes
- REM sleep latency: may be further delayed
- Deep sleep (Stage 3): may be more reduced
- Approaches the Baur et al. (2024) [1] ~1.4 µg/mL research reference line

**Physiological Changes:**
- EEG delta power: may show clearer reduction approaching ~1.4 µg/mL in controlled protocols
- Sleep fragmentation: may become more noticeable

**User Perception:**
- More likely to notice lighter or less restorative sleep
- Longer sleep onset for some people

**When This Applies:**
- Caffeine taken 4-10 hours before bed
- Moderate doses with slower clearance (OCP, slow metabolizer)

**Recommendation:** ⚠️ **ELEVATED — Higher chance of sleep impact**

**Associated Doses (approx):**
- 100 mg caffeine @ 70kg = 1.4 µg/mL (orange/red boundary; Baur reference)

---

### **ZONE 4: HIGH (🔴 Red)**

**Concentration Range:** 1.4–2.5 µg/mL

**What Happens (illustrative averages):**
- Clearer sleep architecture disruption on average
- REM sleep latency: may be substantially delayed
- Total REM sleep: may be reduced
- Deep sleep (Stage 3): may be significantly reduced

**Physiological Changes:**
- Heart rate: may be elevated
- EEG delta power: may show substantial reduction in studies
- Sleep fragmentation: may be noticeable

**User Perception:**
- May feel like "tossed and turned"
- May wake multiple times during night
- Morning grogginess / reduced alertness possible
- "Didn't feel like I slept well" (even if total sleep time similar)
- May not realize caffeine is the cause

**When This Applies:**
- Caffeine taken 4-8 hours before bed
- Moderate to high dose (150-250 mg)
- On empty stomach (rapid absorption)

**Recommendation:** 🛑 **HIGH — Stronger average disruption risk in research**

**Associated Doses (approx):**
- 200 mg caffeine @ 70kg = 2.8 µg/mL (above red band)
- 150 mg caffeine @ 70kg = 2.1 µg/mL
- 100 mg caffeine @ 70kg = 1.4 µg/mL (red threshold)

---

### **ZONE 5: VERY HIGH (⛔ Dark Red)**

**Concentration Range:** > 2.5 µg/mL

**What Happens (illustrative averages):**
- Severe sleep architecture disruption on average
- REM sleep: latency may be greatly delayed
- Total REM sleep: may be substantially reduced
- Deep sleep (Stage 3): may be nearly eliminated for some
- Total sleep time: may be reduced

**Physiological Changes:**
- Heart rate and arousal: may be elevated
- EEG delta power: may show large reductions in studies
- Sleep fragmentation: may be severe
- Insomnia-like symptoms possible despite tiredness

**User Perception:**
- Difficulty falling asleep / severe sleep onset delay
- Frequent waking throughout night
- Little deep sleep / little restorative feeling
- Morning exhaustion despite time in bed
- Jitteriness, anxiety in evening possible

**When This Applies:**
- Caffeine taken 2-6 hours before bed
- High doses (250+ mg)
- Multiple caffeine sources combined
- Fasting state (rapid absorption)

**Recommendation:** ⛔ **VERY HIGH — Severe average disruption risk in research**

**Associated Doses (approx):**
- 300 mg caffeine @ 70kg = 4.2 µg/mL
- 400 mg caffeine @ 70kg = 5.6 µg/mL

---

## How to Use These Thresholds

### **Example 1: Is 200 mg coffee safe for my 11pm bedtime?**

**Your stats:**
- Dose: 200 mg
- Weight: 70 kg
- Sex: Male (half-life: 4 hrs)
- Current time: 2pm
- Hours until bed: 9 hours

**Calculation:**
1. Peak concentration: 200 × 1.65 / 70 = 4.7 µg/mL (at peak)
2. After 9 hours: 4.7 × e^(-0.693/4 × 9) = 4.7 × 0.214 = 1.0 µg/mL
3. At bedtime: **1.0 µg/mL** = YELLOW ZONE (Caution)

**Result:** ⚠️ May delay sleep onset by 5-15 minutes. Not ideal but tolerable.

---

### **Example 2: When should I stop caffeine for 10pm bedtime?**

**Your stats:**
- Want: < 0.5 µg/mL at bedtime
- Weight: 65 kg (female)
- Sex: Female (half-life: 4.5 hrs)
- Target bedtime: 10pm

**Calculation:**
1. Assume 150 mg dose
2. Peak concentration: 150 × 1.65 / 65 = 3.8 µg/mL
3. Half-life: 4.5 hours
4. Need to decay from 3.8 to 0.5 µg/mL
5. Time needed: ln(3.8/0.5) / (0.693/4.5) = 12.8 hours
6. Cutoff time: 10pm - 12.8 hours = **9:12am**

**Result:** Stop caffeine by **9am** to be safely in green zone by 10pm.

---

## Practical Recommendations by Bedtime

### **If bedtime is 10pm:**
- Stop caffeine by **2pm** (8 hours prior)
  - Ensures < 1.0 µg/mL even for heavy doses
- Strict cutoff: **12pm** (10 hours)
  - Gets you into green zone (< 0.5 µg/mL) for most doses

### **If bedtime is 11pm:**
- Stop caffeine by **3pm** (8 hours prior)
- Strict cutoff: **1pm** (10 hours)

### **If bedtime is midnight:**
- Stop caffeine by **4pm** (8 hours prior)
- Strict cutoff: **2pm** (10 hours)

### **If bedtime is 9pm (early):**
- Stop caffeine by **1pm** (8 hours prior)
- Strict cutoff: **11am** (10 hours)

---

## Individual Variations

Your actual threshold may vary based on:

1. **Sex:**
   - Females: +15-30% more sensitive
   - Consider using "caution" zone instead of "safe"

2. **Genetics (CYP1A2):**
   - Fast metabolizer (AA): tolerate higher concentrations
   - Slow metabolizer (CC): more sensitive, lower thresholds

3. **Sleep Sensitivity:**
   - Light sleepers: use "caution" zone cutoff
   - Heavy sleepers: can tolerate yellow zone

4. **Age:**
   - Older adults: more sensitive to caffeine
   - Younger: slightly more tolerant

5. **Chronic Use:**
   - Regular caffeine users: may have built tolerance (underestimate impact)
   - Occasional users: more acutely aware of effects

---

## Key Takeaway

**Bottom Line:**
- **Lower bedtime residual target: < 0.5 µg/mL (green zone)**
- **Baur research reference: ~1.4 µg/mL (not a personal safe limit)**
- **Above ~1.4 µg/mL (red zone): stronger average disruption risk in studies**
- **Many people cut off caffeine 8-10 hours before bed as a planning heuristic**
- **Individual response varies by genetics, clearance factors, and sleep sensitivity**

---

## References (calculator Evidence tab)

Numbering matches the Evidence tab (`constants.js` → `CITATION_GROUPS`).

| Ref | Study | Role in zones |
|-----|-------|----------------|
| [1] | [Baur et al. 2024](https://pubmed.ncbi.nlm.nih.gov/38221756/) — *J Sleep Res* | ~1.4 µg/mL Baur line; EEG delta-power concentration–effect |
| [2] | [Gardiner et al. 2023](https://pubmed.ncbi.nlm.nih.gov/36870101/) — *Sleep Med Rev* | Meta-analysis: latency, total sleep time, efficiency |
| [3] | [Drake et al. 2013](https://pubmed.ncbi.nlm.nih.gov/24235903/) — *J Clin Sleep Med* | Sleep disruption at 0, 3, and 6 h before bed |
| [4] | [Clark & Landolt 2017](https://pubmed.ncbi.nlm.nih.gov/26899133/) — *Sleep Med Rev* | Adenosine mechanisms and dose–response variability |
| [5] | [Burke et al. 2015](https://pubmed.ncbi.nlm.nih.gov/26378246/) — *Sci Transl Med* | Circadian melatonin delay (separate from plasma zones) |
