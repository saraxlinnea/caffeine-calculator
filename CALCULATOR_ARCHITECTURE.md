# Caffeine Calculator: Technical Architecture with Multiple Curves

## Design Overview

This calculator displays **4 interactive visualizations** instead of just one concentration curve. This gives users deeper understanding of:
1. How THEIR caffeine behaves (timeline)
2. How BODY WEIGHT affects peak concentration
3. How GENETICS affect half-life
4. SLEEP SCIENCE thresholds

---

## TAB 1: CAFFEINE TIMELINE (Main Dashboard)

### **What It Shows**
Single curve: Caffeine concentration over 24 hours for the user's specific parameters

### **Visual Elements**
```
Y-axis: Caffeine concentration (0-8 µg/mL)
X-axis: Time (0-24 hours)

Background zones (colored bands):
- Green (< 0.5 µg/mL): Safe for sleep
- Yellow (0.5-1.0): Caution
- Orange (1.0-1.4): REM disruption
- Red (1.4-2.5): Significant disruption
- Dark red (> 2.5): Danger

Curve: Exponential decay starting from peak

Markers:
- Peak point (marked with ●)
- Sleep zone indicator line (where bedtime falls)
- Recommendation text box below
```

### **User Inputs**
- Caffeine dose (mg) OR source
- Body weight (kg or lbs)
- Sex (M/F)
- Food status (yes/no)
- Current time
- Target bedtime

### **Outputs**
- Peak concentration (µg/mL)
- Time to peak (minutes)
- Half-life (hours)
- Concentration at bedtime
- Zone assessment (green/yellow/red)
- Recommendation: "Stop caffeine by X:XX pm"

### **Calculation Flow**
```
1. Get base half-life (male = 4.0 hrs)
2. Adjust for sex (female = +12.5%)
3. Calculate elimination constant k = 0.693 / t½
4. Calculate peak: C_max = dose × 1.65 / weight_kg
5. Add Tmax adjustment for food
6. Generate curve for 24 hours
7. Find concentration at bedtime
8. Classify zone (green/yellow/red)
9. Calculate time to reach safe threshold (< 0.5)
```

---

## TAB 2: PEAK vs. BODY WEIGHT COMPARISON

### **What It Shows**
How body weight affects peak concentration for **same dose**

### **Visual Elements**
```
X-axis: Body weight (kg) [40, 50, 60, 70, 80, 90, 100+]
Y-axis: Peak concentration (µg/mL) [0-8]

Curve: Inverse relationship (↑ weight = ↓ peak)

User's marker: Arrow/highlight at their weight

Percentile info: "You're at Xth percentile for caffeine sensitivity"

Formula displayed: C_max = (Dose × 1.65) / Weight_kg
```

### **Insight It Provides**
- **Heavier people:** Lower peak concentration from same dose
- **Lighter people:** Higher peak concentration (more sensitive)
- Example: 200mg coffee hits differently at 60kg vs 90kg

### **Key Takeaway**
"Body weight directly affects how high your peak goes, but NOT how fast it leaves your system"

---

## TAB 3: CLEARANCE RATE & HALF-LIFE

### **What It Shows**
How caffeine remaining changes over time based on **genetics + sex**

### **Visual Elements**
```
X-axis: Time since peak (hours) [0, 4, 8, 12, 16, 20, 24]
Y-axis: Remaining caffeine (%) [0%, 100%]

Three curves overlaid:
- Fast metabolizer (CC genotype): Steeper decline
- Average metabolizer (AC genotype): Medium decline
- Slow metabolizer (AA genotype): Shallow decline

User's curve: Highlighted in bold

Half-life markings:
- At 50% mark (one half-life)
- At 25% mark (two half-lives)
- At 12.5% mark (three half-lives)

Table below showing:
- Your half-life: X hours
- Remaining at 4hrs: Y%
- Remaining at 8hrs: Z%
- Remaining at 12hrs: W%
```

### **Insight It Provides**
- **Same dose, same peak, DIFFERENT decay rates**
- Slow metabolizers stay at high levels longer
- Fast metabolizers clear caffeine quickly
- Example table:
  ```
  Time    Fast (AA)   Average (AC)   Slow (CC)
  0 hrs   100%        100%           100%
  4 hrs   50%         50%            50%
  8 hrs   25%         25%            25%
  12 hrs  12%         12%            12%
  
  (Note: half-life determines these percentages, 
   but absolute concentration depends on peak)
  ```

### **Key Takeaway**
"Your genetics determine how fast you metabolize caffeine, independent of body weight"

---

## TAB 4: SLEEP IMPACT ZONES (Science Explanation)

### **What It Shows**
Exact concentration thresholds for sleep disruption

### **Visual Elements**
```
Vertical stacked bars showing zones:

🟢 GREEN < 0.5 µg/mL (Safe - minimal sleep impact)
  - REM sleep: normal
  - Deep sleep: normal
  - Duration: full effect

🟡 YELLOW 0.5-1.0 µg/mL (Caution - subtle effects)
  - REM sleep: latency +10-20 min
  - Deep sleep: slightly reduced
  - User perception: "lighter sleep"

🟠 ORANGE 1.0-1.4 µg/mL (REM disruption)
  - REM sleep: latency +30-60 min
  - Deep sleep: 20-40% reduced
  - User perception: "tossed and turned"

🔴 RED 1.4-2.5 µg/mL (Significant disruption)
  - REM sleep: severely delayed
  - Deep sleep: 50%+ reduced
  - Fragmentation: 3-5 extra arousals

⛔ DARK RED > 2.5 µg/mL (Danger - severe insomnia-like)
  - REM sleep: extreme latency
  - Deep sleep: nearly eliminated
  - User perception: "couldn't sleep"

Timeline overlay for user's bedtime:
- Mark where user's bedtime falls
- Show what zone they'd be in
- Show estimated sleep quality
```

### **Data Displayed**
Each zone shows:
- Concentration range (µg/mL)
- Sleep changes (REM latency, deep sleep %, fragmentation)
- User perception
- Corresponding dose example
- Study source (Baur et al. / Gardiner et al.)

### **Insight It Provides**
- Specific numerical thresholds from research
- What actually happens physiologically
- Why people don't always "feel" caffeine impact

### **Key Takeaway**
"Below 0.5 µg/mL is genuinely safe. Above 1.4 is genuinely disruptive. In between is individual."

---

## COMPARISON TAB (Optional 5th Tab)

### **What It Shows**
Scenario planning: Compare different choices

### **Compare Options**
- Same dose, different times
- Different doses, same time
- Different body weights, same dose
- Your profile vs. "average person"

### **Example Comparisons**
1. **200mg coffee at 10am vs. 2pm**
   - "If I wait 4 hours, I'll be in GREEN at 11pm"
   
2. **100mg vs. 200mg dose**
   - "200mg means I need to cut off 2 hours earlier"

3. **Your weight vs. friend's weight**
   - "You're 70kg, friend is 80kg. Same coffee hits differently"

---

## Data Flow Architecture

```
USER INPUT
  ↓
CALCULATIONS ENGINE (calculator.js)
  ├─ calculate_peak_concentration()
  ├─ calculate_half_life()
  ├─ generate_caffeine_curve()
  ├─ calculate_zone_classification()
  └─ calculate_time_to_threshold()
  ↓
DATA OBJECT
  {
    peak: 4.71,
    tmax: 50,
    half_life: 4.0,
    curve: {0: 0, 1: 2.4, 2: 3.8, ...},
    concentration_at_bed: 0.72,
    zone: "yellow",
    recommendation: "Stop by 3pm",
    metabolizer_info: {...},
    sleep_science: {...}
  }
  ↓
CHART RENDERING (charts.js)
  ├─ render_timeline_chart()
  ├─ render_weight_comparison()
  ├─ render_clearance_rate()
  └─ render_sleep_zones()
  ↓
DISPLAY TO USER (HTML/CSS)
  └─ Tabbed interface with 4 visualizations
```

---

## File Structure for Frontend

```
caffeine-calculator/
├── index.html                 (Main page, tab structure)
├── css/
│   ├── style.css             (General styling)
│   ├── tabs.css              (Tab navigation)
│   ├── charts.css            (Chart styling)
│   └── zones.css             (Color zones)
├── js/
│   ├── calculator.js         (Core math engine)
│   ├── charts.js             (Chart.js integration)
│   ├── tabs.js               (Tab switching)
│   ├── ui.js                 (DOM manipulation)
│   └── main.js               (Initialization)
└── data/
    └── constants.js          (Hard-coded caffeine data)
```

---

## Chart Libraries

### **Recommended: Chart.js**
- Lightweight (~50KB)
- Excellent line/bar charts
- Color zones easy to add
- Good performance

### **Alternative: Plotly.js**
- More powerful
- Better interactivity (hover shows values)
- Heavier (~3MB)
- Overkill for this use case

**Recommendation: Use Chart.js for main curves, add hover tooltips manually**

---

## Interactivity Features

### **Tab 1: Caffeine Timeline**
- Hover over curve → show exact value at that time
- Click to see what time that concentration occurs
- Zoom in/out (optional)
- Download curve as image (optional)

### **Tab 2: Weight Comparison**
- Slider to adjust your weight → see peak change in real-time
- Show "equivalent dose" for other weight
- Display percentile

### **Tab 3: Clearance Rate**
- Toggle between %, absolute mg, or µg/mL
- Show your exact parameters
- Expandable detail panel with math

### **Tab 4: Sleep Zones**
- Collapsible sections for each zone
- Link to studies (Baur, Gardiner)
- Your timeline marked on zones

---

## Mobile Responsiveness

All tabs must work on phone:
- Tabs stack vertically on small screens
- Charts adjust height/width
- Input form is full-width
- Readable on 320px+ width

---

## Performance Considerations

**Calculations:**
- All math happens client-side (instant)
- No server calls
- Curves generated on-demand

**Rendering:**
- Lazy load charts (only render visible tab)
- Debounce input updates (wait 500ms after user stops typing)
- Cache curve data (don't recalculate on tab switch)

---

## Testing Strategy

Each curve should verify against:

**Tab 1 (Timeline):**
- Test Case 1: Male 200mg, should hit yellow at 8hrs
- Test Case 2: Female 150mg, should stay longer
- Test Case 3: Stacked doses should add correctly

**Tab 2 (Weight):**
- Heavier weight → lower peak (inverse)
- 70kg baseline reference

**Tab 3 (Clearance):**
- At 4 hrs: should show 50% remaining
- At 8 hrs: should show 25% remaining
- Different half-lives should produce different curves

**Tab 4 (Zones):**
- Zone boundaries at exact thresholds
- Color coding matches spec
