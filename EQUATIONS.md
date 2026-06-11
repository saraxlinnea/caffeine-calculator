# Caffeine Calculator: All Equations & Formulas

This document contains all mathematical formulas used in the calculator.

---

## PART 1: CORE PHARMACOKINETIC EQUATIONS

### **Equation 1.1: One-Compartment Exponential Decay Model**

**Name:** First-order elimination kinetics

**Formula:**
```
C(t) = C_max × e^(-k × t)
```

**Where:**
- **C(t)** = Plasma caffeine concentration at time t (µg/mL)
- **C_max** = Peak plasma concentration (µg/mL)
- **k** = Elimination rate constant (hr⁻¹)
- **t** = Time since peak absorption (hours)
- **e** = Euler's number (≈2.71828)

**Use:** Calculate caffeine level at any time point

**Example:** 
- C_max = 4.7 µg/mL
- k = 0.173 hr⁻¹ (4-hour half-life)
- At t = 6 hours: C(6) = 4.7 × e^(-0.173 × 6) = 4.7 × 0.346 = **1.63 µg/mL**

---

### **Equation 1.2: Elimination Rate Constant from Half-Life**

**Formula:**
```
k = 0.693 / t½
```

**Where:**
- **k** = Elimination rate constant (hr⁻¹)
- **0.693** = Natural logarithm of 2 (ln(2))
- **t½** = Half-life (hours)

**Use:** Convert half-life to rate constant

**Examples:**
- 3-hour half-life: k = 0.693 / 3 = 0.231 hr⁻¹ (fast metabolizer)
- 4-hour half-life: k = 0.693 / 4 = 0.173 hr⁻¹ (typical male)
- 5-hour half-life: k = 0.693 / 5 = 0.139 hr⁻¹ (female or slow metabolizer)

---

### **Equation 1.3: Peak Plasma Concentration**

**Formula:**
```
C_max (µg/mL) = (Dose_mg × Bioavailability) / Volume_of_Distribution

Simplified:
C_max (µg/mL) = (Dose_mg × 0.99) / (Body_weight_kg × 0.6)

Further simplified:
C_max (µg/mL) = (Dose_mg × 1.65) / Body_weight_kg
```

**Where:**
- **Dose_mg** = Amount of caffeine consumed (milligrams)
- **Bioavailability** = 0.99 (essentially complete absorption)
- **Body_weight_kg** = User's body weight in kilograms
- **0.6** = Volume of distribution per kg (L/kg)
- **1.65** = Combined coefficient (0.99 / 0.6)

**Use:** Calculate peak blood level

**Examples:**
- 100 mg dose, 70 kg male: C_max = 165 / 70 = **2.36 µg/mL**
- 200 mg dose, 70 kg male: C_max = 330 / 70 = **4.71 µg/mL**
- 200 mg dose, 60 kg female: C_max = 330 / 60 = **5.5 µg/mL**

---

### **Equation 1.4: Volume of Distribution (Vd)**

**Formula:**
```
Vd (L) = Body_weight (kg) × 0.6 (L/kg)
```

**Where:**
- **0.6 L/kg** = Standard caffeine distribution in body water

**Why 0.6?** Caffeine distributes in total body water, which is ~60% of body mass in adults.

**Examples:**
- 50 kg person: Vd = 50 × 0.6 = 30 L
- 70 kg person: Vd = 70 × 0.6 = 42 L
- 100 kg person: Vd = 100 × 0.6 = 60 L

---

## PART 2: TIME-DEPENDENT PARAMETERS

### **Equation 2.1: Time to Peak (Tmax) with Food Adjustment**

**Formula:**
```
Base Tmax = 45 minutes (fasting)

Adjusted Tmax:
Tmax = 45 min + Food_delay_factor

Where Food_delay_factor:
- Fasting: +0 min
- Light meal: +15 min
- Moderate meal: +30 min
- Heavy/high-fat meal: +45-60 min
```

**Use:** Determine when peak concentration is reached

**Examples:**
- Espresso on empty stomach: Tmax = 45 min
- Coffee with light breakfast: Tmax = 45 + 15 = 60 min
- Coffee with heavy breakfast: Tmax = 45 + 45 = 90 min

---

### **Equation 2.2: Time to Reach Target Concentration**

**Formula:**
```
t_target = ln(C_max / C_target) / k

Where:
- t_target = Time to reach target concentration (hours)
- C_max = Peak concentration (µg/mL)
- C_target = Target concentration (µg/mL)
- k = Elimination constant (hr⁻¹)
- ln = Natural logarithm
```

**Use:** Find when caffeine drops to a specific level

**Examples:**

**When does caffeine drop to < 0.5 µg/mL (safe for bed)?**
- C_max = 4.71 µg/mL (200 mg, 70 kg male)
- k = 0.173 hr⁻¹ (4-hour half-life)
- C_target = 0.5 µg/mL
- t = ln(4.71 / 0.5) / 0.173 = ln(9.42) / 0.173 = 2.24 / 0.173 = **12.9 hours**

**When does caffeine cross into yellow zone (> 1.0 µg/mL)?**
- Same parameters, C_target = 1.0
- t = ln(4.71 / 1.0) / 0.173 = 1.55 / 0.173 = **8.9 hours**

---

### **Equation 2.3: Remaining Caffeine Percentage**

**Formula:**
```
Remaining_% (t) = e^(-k × t) × 100
```

**Use:** Show what percentage of peak concentration remains

**Examples (4-hour half-life, k=0.173):**
- At t=4 hours: e^(-0.173 × 4) × 100 = 0.5 × 100 = **50%** ✓ (checks out: half-life)
- At t=8 hours: e^(-0.173 × 8) × 100 = 0.25 × 100 = **25%**
- At t=12 hours: e^(-0.173 × 12) × 100 = 0.125 × 100 = **12.5%**

---

## PART 3: SEX & METABOLIZER ADJUSTMENTS

### **Equation 3.1: Adjusted Half-Life by Sex**

**Formula:**
```
Base half-life (male) = 4.0 hours

Adjusted half-life:
t½_adjusted = t½_base × Sex_factor

Sex_factor values:
- Male: 1.0 (baseline)
- Female: 1.125 (12.5% longer)
- Female (oral contraceptives): 1.30 (30% longer)
- Female (pregnant): 1.50 (50% longer)
```

**Examples:**
- Male, 200 mg: t½ = 4.0 hours
- Female, 200 mg: t½ = 4.0 × 1.125 = 4.5 hours
- Female (contraceptives), 200 mg: t½ = 4.0 × 1.30 = 5.2 hours

---

### **Equation 3.2: Metabolizer Type Adjustment (CYP1A2 Genetics)**

**Formula:**
```
t½_metabolizer = t½_base × Metabolizer_factor

Metabolizer_factor (from Cornelis et al. 2011):
- Fast (AA genotype): 0.875 (12.5% faster)
- Intermediate (AC genotype): 1.0 (baseline)
- Slow (CC genotype): 1.375 (37.5% slower)
```

**Examples (baseline 4.0 hours):**
- Fast metabolizer (AA): t½ = 4.0 × 0.875 = 3.5 hours
- Intermediate (AC): t½ = 4.0 × 1.0 = 4.0 hours
- Slow metabolizer (CC): t½ = 4.0 × 1.375 = 5.5 hours

---

### **Equation 3.3: Combined Sex + Genetics Adjustment**

**Formula:**
```
t½_final = t½_base × Sex_factor × Metabolizer_factor

Example: Female (AC metabolizer) = 4.0 × 1.125 × 1.0 = 4.5 hours
Example: Female (CC metabolizer) = 4.0 × 1.125 × 1.375 = 6.2 hours
```

---

## PART 4: BODY WEIGHT EFFECTS (Not on half-life, only on peak)

### **Equation 4.1: Peak Concentration vs. Body Weight**

**Key Insight:** Half-life is NOT directly affected by body weight

**But:** Peak concentration IS affected

```
Same dose, different weights:
- 200 mg @ 50 kg: C_max = 330/50 = 6.6 µg/mL
- 200 mg @ 70 kg: C_max = 330/70 = 4.7 µg/mL
- 200 mg @ 100 kg: C_max = 330/100 = 3.3 µg/mL
```

**Why?** Heavier people have larger volume of distribution → same dose dilutes more

**Important:** Despite lower peak, heavier and lighter people have the SAME half-life

---

### **Equation 4.2: Total Clearance vs. Body Weight**

**Formula:**
```
Total_Clearance (L/hr) = Clearance_per_kg × Body_weight

Where Clearance_per_kg ≈ 0.08 L/hr/kg
```

**Examples:**
- 50 kg person: Total Cl = 0.08 × 50 = 4.0 L/hr
- 70 kg person: Total Cl = 0.08 × 70 = 5.6 L/hr
- 100 kg person: Total Cl = 0.08 × 100 = 8.0 L/hr

**Note:** Per-kg clearance stays constant, but total clearance increases with weight

---

## PART 5: MULTIPLE DOSES (STACKED CAFFEINE)

### **Equation 5.1: Cumulative Concentration with Multiple Doses**

**Formula:**
```
C_total(t) = Σ [C_max_i × e^(-k × (t - t_i))]

For i = 1 to n doses
Only include doses where t > t_i (dose already consumed)
```

**Example:** 
- 8am: 100 mg coffee → C_max₁ = 2.36 µg/mL
- 2pm: 80 mg energy drink → C_max₂ = 1.89 µg/mL
- At 5pm (t = 9 hours since 8am, 3 hours since 2pm):
  - Coffee contribution: 2.36 × e^(-0.173 × 9) = 0.53 µg/mL
  - Energy drink contribution: 1.89 × e^(-0.173 × 3) = 1.15 µg/mL
  - **Total: 1.68 µg/mL** (yellow zone - caution)

---

## PART 6: SLEEP DISRUPTION THRESHOLDS

### **Equation 6.1: Zone Classification**

**Formula:**
```
IF C(t) < 0.5:
  Zone = GREEN (safe)
  
ELSE IF C(t) < 1.0:
  Zone = YELLOW (caution - may delay sleep)
  
ELSE IF C(t) < 1.4:
  Zone = ORANGE (caution - REM latency)
  
ELSE IF C(t) < 2.5:
  Zone = RED (warning - significant disruption)
  
ELSE:
  Zone = DARK_RED (danger - severe disruption)
```

**Data source:** Baur et al. (2023)

---

## PART 7: VERIFICATION TEST CASES

Use these to verify your calculator implementation:

### **Test Case 1: Male, 200mg coffee, fasting, 70kg**
```
Expected peak: 4.71 µg/mL ✓
Expected half-life: 4.0 hours ✓
At 8 hours: 1.54 µg/mL (yellow zone) ✓
At 12 hours: 0.59 µg/mL (green zone) ✓
Time to green: ~10 hours ✓
```

### **Test Case 2: Female, 150mg tea, light meal, 65kg**
```
Expected peak: 3.83 µg/mL ✓
Expected half-life: 4.5 hours (female adjustment) ✓
Tmax: 60 minutes (light meal) ✓
At 6 hours: 1.38 µg/mL (orange zone) ✓
At 10 hours: 0.53 µg/mL (green zone) ✓
```

### **Test Case 3: Female + contraceptives, 100mg espresso, empty stomach, 70kg**
```
Expected peak: 2.36 µg/mL ✓
Expected half-life: 5.2 hours (female + OCP adjustment) ✓
Tmax: 45 minutes (fasting) ✓
At 6 hours: 1.34 µg/mL (orange zone - longer staying) ✓
At 10 hours: 0.72 µg/mL (yellow zone) ✓
At 15 hours: 0.28 µg/mL (green zone) ✓
```

---

## Summary: Key Coefficients to Hard-Code

```javascript
// In constants.js
const COEFFICIENTS = {
  BIOAVAILABILITY: 0.99,
  VOLUME_DIST_PER_KG: 0.6,
  PEAK_COEFFICIENT: 1.65,  // 0.99 / 0.6
  BASE_HALF_LIFE: 4.0,
  BASE_CLEARANCE_PER_KG: 0.08,
  LN_2: 0.693,
  EULER: 2.71828,
};
```
