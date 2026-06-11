# ☕ Caffeine Calculator

**An interactive tool to calculate caffeine blood levels and predict sleep impact**

## What It Does

This calculator helps you understand:
- ✅ Your peak caffeine concentration (µg/mL)
- ✅ How long caffeine stays in your system (based on genetics + sex)
- ✅ When caffeine will disrupt your sleep
- ✅ Recommended "cutoff time" for your bedtime

## Why It Matters

Caffeine affects everyone differently. This calculator accounts for:
- **Body weight** (heavier = lower peak concentration)
- **Sex** (females metabolize slower due to estrogen)
- **Genetics** (fast vs. slow metabolizers)
- **Food intake** (delays absorption)
- **Sleep science** (exact thresholds for REM disruption)

## Quick Start

1. Enter your caffeine dose, body weight, sex, and bedtime
2. View four interactive dashboards:
   - **Timeline:** Caffeine levels over 24 hours
   - **Comparison:** Peak concentration vs. body weight
   - **Clearance:** How fast you metabolize caffeine
   - **Sleep Impact:** When you hit sleep-disrupting levels
3. Get a recommendation on when to stop caffeine

## Verified by Science

All calculations based on peer-reviewed studies:
- Gardiner et al. (2024) - *Sleep*
- Weibel et al. (2021) - *Journal of Biological Rhythms*
- Baur et al. (2023) - *medRxiv*
- Cornelis et al. (2011) - *PLoS Genetics*

## How It's Built

- **Frontend:** HTML/CSS/JavaScript (runs in browser)
- **Hosting:** GitHub Pages (free)
- **Graphs:** Chart.js
- **All math verified** against peer-reviewed data

---

## Files Overview

- `CAFFEINE_SCIENCE.md` - Peer-reviewed science + verified citations
- `EQUATIONS.md` - All mathematical formulas with examples
- `SLEEP_THRESHOLDS.md` - Sleep disruption data by concentration level
- `CALCULATOR_ARCHITECTURE.md` - Technical design & multiple curves
- `index.html` - Main web interface
- `css/style.css` - Styling
- `js/calculator.js` - Core math engine
- `js/charts.js` - Graph generation

---

## User Guide

### **Tab 1: Caffeine Timeline**
Shows your caffeine concentration over the next 24 hours with color-coded sleep zones:
- 🟢 **Green (< 0.5 µg/mL):** Safe for sleep
- 🟡 **Yellow (0.5-1.4 µg/mL):** May delay sleep
- 🔴 **Red (> 1.4 µg/mL):** Will disrupt REM sleep

### **Tab 2: Peak vs. Body Weight**
Compare how your body weight affects peak concentration compared to others. Heavier = lower peak (same dose).

### **Tab 3: Clearance Rate**
See how your metabolism (half-life) affects how long caffeine stays in your system.

### **Tab 4: Sleep Impact Zones**
Understand the exact thresholds where sleep disruption occurs based on your concentration level.
