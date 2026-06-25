// ============================================
// CAFFEINE CALCULATOR CONSTANTS
// All data from @CAFFEINE_SCIENCE.md
// ============================================

// CAFFEINE CONTENT BY SOURCE (mg)
const CAFFEINE_SOURCES = {
    espresso: { mg: 63, label: "Espresso (1 shot)" },
    coffee_8oz: { mg: 95, label: "Coffee (8 oz)" },
    coffee_12oz: { mg: 143, label: "Coffee (12 oz)" },
    black_tea: { mg: 40, label: "Black tea (8 oz)" },
    green_tea: { mg: 30, label: "Green tea (8 oz)" },
    energy_drink: { mg: 80, label: "Energy drink (8 oz)" },
    cola: { mg: 35, label: "Cola (12 oz)" },
    caffeine_pill: { mg: 100, label: "Caffeine pill" },
  };
  
  // HALF-LIFE MODIFIERS
  // Base half-life: 5.0 hours (see HALFLIFE_BASE_MALE)
  const HALFLIFE_BASE_MALE = 5.0;
  
  const HALFLIFE_MODIFIERS = {
    male: 1.0,
    female: 1.0,
    unspecified: 1.0,        // Same baseline as male when sex not provided
    female_contraceptives: 1.70,
    smoking: 0.5,            // ~50% faster clearance (CYP1A2 induction)
    pregnancy: 2.0,          // ~2× longer half-life (simplified; trimester varies)
  };
  
  // METABOLIZER TYPE (CYP1A2 genetics)
  const METABOLIZER_FACTORS = {
    fast: 0.875,        // AA genotype, -12.5%
    intermediate: 1.0,  // AC genotype, baseline
    slow: 1.375,        // CC genotype, +37.5%
  };
  
  // TIME TO PEAK (Tmax) ADJUSTMENTS - in minutes
  const TMAX_ADJUSTMENTS = {
    fasting: 45,
    light_meal: 45 + 15,      // +15 min
    moderate_meal: 45 + 30,   // +30 min
    heavy_meal: 45 + 60,      // +60 min
  };
  
  // PHARMACOKINETIC COEFFICIENTS
  const COEFFICIENTS = {
    BIOAVAILABILITY: 0.99,
    VOLUME_DIST_PER_KG: 0.6,  // L/kg
    PEAK_COEFFICIENT: 1.65,   // 0.99 / 0.6, combined
    LN_2: 0.693,              // Natural log of 2
    CLEARANCE_PER_KG: 0.08,   // L/hr/kg
  };
  
  // SLEEP DISRUPTION THRESHOLDS (from @SLEEP_THRESHOLDS.md)
  // All values in µg/mL (micrograms per milliliter)
  const SLEEP_ZONES = {
    GREEN: {
      min: 0,
      max: 0.5,
      label: "🟢 Low estimated level",
      color: "#4CAF50",
      description: "Minimal sleep impact",
      rem_impact: "Normal REM sleep",
      deep_sleep_impact: "Unaffected"
    },
    YELLOW: {
      min: 0.5,
      max: 1.0,
      label: "🟡 Moderate estimated level",
      color: "#FFC107",
      description: "May delay sleep onset",
      rem_impact: "REM latency +10-20 min",
      deep_sleep_impact: "Slightly reduced"
    },
    ORANGE: {
      min: 1.0,
      max: 1.4,
      label: "🟠 Elevated estimated level",
      color: "#FF9800",
      description: "REM sleep disruption",
      rem_impact: "REM latency +30-60 min",
      deep_sleep_impact: "20-40% reduced"
    },
    RED: {
      min: 1.4,
      max: 2.5,
      label: "🔴 High estimated level",
      color: "#F44336",
      description: "Significant disruption",
      rem_impact: "Severely delayed",
      deep_sleep_impact: "50%+ reduced"
    },
    DARK_RED: {
      min: 2.5,
      max: Infinity,
      label: "⛔ Very high estimated level",
      color: "#C62828",
      description: "Severe sleep disruption",
      rem_impact: "Extreme latency",
      deep_sleep_impact: "Nearly eliminated"
    }
  };
  
  // Baur et al. 2024 (PMID 38221756): EEG delta-power association in controlled sleep study.
  // Endpoint-specific reference — not a universal personal sleep cutoff.
  const BAUR_DELTA_POWER_THRESHOLD = 1.4;

  // SLEEP ZONE THRESHOLDS (for quick lookup)
  const SAFE_THRESHOLD = 0.5;         // Green zone max
  const CAUTION_THRESHOLD = 1.0;      // Yellow zone max
  const WARNING_THRESHOLD = 1.4;      // Orange zone max (aligns with Baur delta-power reference)
  const DANGER_THRESHOLD = 2.5;       // Red zone max

  // ============================================
// CHART STYLING & CONFIGURATION
// ============================================

const CHART_COLORS = {
    primary: '#2c2c2c',
    accent: '#d4a574',
    success: '#7a9b8e',
    warning: '#c9a570',
    danger: '#a87070',
    light_bg: '#fafaf8'
};

const ZONE_COLORS_RGBA = {
    GREEN: 'rgba(122, 155, 142, 0.1)',      // Light green
    YELLOW: 'rgba(201, 165, 112, 0.1)',     // Light tan
    ORANGE: 'rgba(201, 165, 112, 0.15)',    // Light orange
    RED: 'rgba(168, 112, 112, 0.1)',        // Light red
    DARK_RED: 'rgba(139, 90, 90, 0.12)'     // Dark red
};

const ZONE_COLORS_BORDER = {
    GREEN: '#7a9b8e',
    YELLOW: '#c9a570',
    ORANGE: '#c9a570',
    RED: '#a87070',
    DARK_RED: '#8b5a5a'
};

// Factor explainer content
const FACTOR_EXPLAINERS = {
    ocp: {
        title: '💊 Oral Contraceptives & Caffeine Clearance',
        content: `
            <strong>The Science:</strong> Estrogen in combined oral contraceptives inhibits CYP1A2, the liver enzyme that clears most caffeine. That can substantially extend how long caffeine stays in your system. This is the main hormonal factor modeled here, not an inherent sex difference without OCP use.
            
            <strong>Your Status:</strong> <span id="ocpStatus">Not on oral contraceptives</span>
            
            <strong>What This Means:</strong>
            <ul>
                <li><strong>Not on OCP:</strong> Baseline half-life in this model (~4.4–6.9 h depending on metabolizer type)</li>
                <li><strong>On oral contraceptives:</strong> Roughly 70% longer half-life (~8–9 h at average metabolizer) based on multiple studies</li>
            </ul>
            
            <strong>Impact on Your Results:</strong> Your caffeine clearance is <span id="ocpImpact">at baseline rates</span>.
            
            <strong>Sources:</strong> Patwardhan et al. (1980) PMID 7359014; Abernethy &amp; Todd (1985) PMID 4029248;
            <a href="https://www.ncbi.nlm.nih.gov/books/NBK223808/" target="_blank" rel="noopener">NCBI Bookshelf NBK223808</a>
        `
    },
    smoking: {
        title: '🚬 Smoking & Caffeine Clearance',
        content: `
            <strong>The Science:</strong> Cigarette smoke induces CYP1A2, the main enzyme that metabolizes caffeine. Smokers often clear caffeine faster than non-smokers, with half-life roughly halved in many studies.
            
            <strong>Your Status:</strong> <span id="smokingStatus">Not selected</span>
            
            <strong>What This Means:</strong>
            <ul>
                <li><strong>Non-smoker (default):</strong> No smoking adjustment in this model</li>
                <li><strong>Smoker:</strong> Half-life multiplied by ~0.5 (~50% faster clearance) as a simplified estimate</li>
            </ul>
            
            <strong>Impact on Your Results:</strong> <span id="smokingImpact">No smoking adjustment applied</span>.
            
            <strong>Sources:</strong> Parsons &amp; Neims (1978) PMID 657717;
            <a href="https://www.ncbi.nlm.nih.gov/books/NBK223808/" target="_blank" rel="noopener">NCBI Bookshelf NBK223808</a>
        `
    },
    pregnancy: {
        title: '🤰 Pregnancy & Caffeine Clearance',
        content: `
            <strong>The Science:</strong> Pregnancy slows caffeine metabolism, especially in later trimesters. Reported half-life increases are often 50–100% or more above baseline. This model uses a simplified ~2× multiplier.
            
            <strong>Your Status:</strong> <span id="pregnancyStatus">Not selected</span>
            
            <strong>What This Means:</strong>
            <ul>
                <li><strong>Not pregnant (default):</strong> No pregnancy adjustment</li>
                <li><strong>Pregnant:</strong> Half-life multiplied by ~2.0 in this model</li>
            </ul>
            
            <strong>Impact on Your Results:</strong> <span id="pregnancyImpact">No pregnancy adjustment applied</span>.
            







            
            <strong>Caution:</strong> Smoking during pregnancy carries serious health risks for the baby. This tool does not provide medical advice. Discuss caffeine and smoking with a healthcare provider.
            
            <strong>Sources:</strong> Knutti et al. (1982) PMID 6954898; Yu et al. (2016) PMID 26358647 (PMC5564294).
        `
    },
    weight: {
        title: '⚖️ How Body Weight Affects Caffeine',
        content: `
            <strong>The Science:</strong> Caffeine distributes throughout body water at roughly 0.6 L per kilogram of body weight. A larger body means a larger volume of distribution, which dilutes the same dose to a lower peak concentration.
            
            <strong>Your Status:</strong> You weigh <span id="weightStatus">154 lbs</span>
            
            <strong>What This Means:</strong>
            <ul>
                <li>Lighter people hit higher peaks from the same dose</li>
                <li>Heavier people hit lower peaks from the same dose</li>
                <li>Weight does not change how fast caffeine is cleared. It only affects peak height.</li>
            </ul>
            
            <strong>Impact on Your Results:</strong> Your peak concentration is <span id="weightImpact">at baseline</span> compared to a reference weight.
            
            <strong>Source:</strong> Institute of Medicine (2001), "Pharmacology of caffeine"
            <br><a href="https://www.ncbi.nlm.nih.gov/books/NBK223808/" target="_blank">NCBI Bookshelf: NBK223808</a>
        `
    },
    genetics: {
        title: '🧬 How Your Genetics (CYP1A2) Affect Caffeine',
        content: `
            <strong>The Science:</strong> CYP1A2 is the liver enzyme responsible for roughly 95% of caffeine metabolism. A single-nucleotide polymorphism in its gene creates fast (AA) and slow (CC) metabolizer variants. About 50% of people carry the fast AA genotype, though this varies by ancestry.
            
            <strong>Your Status:</strong> You selected <span id="metabolizerStatus">average</span>
            
            <strong>What This Means:</strong>
            <ul>
                <li><strong>Fast (AA genotype):</strong> About 12.5% faster than average, roughly 4.4-hour half-life at baseline</li>
                <li><strong>Average (AC genotype):</strong> Baseline, roughly 5.0-hour half-life</li>
                <li><strong>Slow (CC genotype):</strong> About 37.5% slower than average, roughly 6.9-hour half-life</li>
            </ul>
            
            <strong>Impact on Your Results:</strong> Your caffeine clearance is <span id="geneticsImpact">at average speed</span>.
            
            <strong>Sources:</strong> Sachse et al. (1999) PMID 10233211; Cornelis et al. (2011) PMID 21490707
        `
    },
    food: {
        title: '🍽️ How Food Timing Affects Caffeine Absorption',
        content: `
            <strong>The Science:</strong> Food slows gastric emptying, which delays how quickly caffeine passes from the stomach into the small intestine where it is absorbed. The delay affects timing of the peak but not the total amount absorbed.
            
            <strong>Your Status:</strong> You selected: <span id="foodStatus">fasting</span>
            
            <strong>What This Means:</strong>
            <ul>
                <li><strong>Fasting:</strong> Peak in roughly 45 minutes</li>
                <li><strong>Light meal:</strong> Peak in roughly 60 minutes</li>
                <li><strong>Moderate meal:</strong> Peak in roughly 75 minutes</li>
                <li><strong>Heavy meal:</strong> Peak in roughly 105 minutes</li>
            </ul>
            
            <strong>Food delays the peak but does not reduce it.</strong> The same dose produces the same maximum concentration. It just takes longer to get there.
            
            <strong>Impact on Your Results:</strong> With <span id="foodImpact">fasting</span>, your peak arrives faster.
            
            <strong>Source:</strong> Grimm et al. (2023) Pharmaceutics: gastric emptying and caffeine absorption kinetics
            <br><a href="https://pubmed.ncbi.nlm.nih.gov/36839650/" target="_blank">PubMed: PMID 36839650</a>
        `
    },
    sleep: {
        title: '😴 How Caffeine Affects Sleep',
        content: `
            <strong>How it works:</strong> Caffeine is a non-selective <strong>adenosine receptor antagonist</strong> (mainly A1 and A2A). It competes with adenosine at these receptors. Adenosine builds up during wakefulness and promotes sleep drive. Blocking it delays how quickly that pressure converts to drowsiness. Separately, evening caffeine has been shown to delay the circadian clock phase, which can shift your natural sleep window later.
            
            <strong>What the research shows:</strong>
            <ul>
                <li>Caffeine consumed even 6 hours before bed measurably reduces sleep (Drake et al. 2013)</li>
                <li>Average effects across studies: ~45 min longer to fall asleep, ~45 min less total sleep per 200 mg (Gardiner et al. 2023)</li>
                <li>Individual sensitivity varies widely. Some people are much more or less affected than average.</li>
                <li>The zones in this tool represent approximate population averages, not personal guarantees</li>
            </ul>
            
            <strong>Key caveat:</strong> This model uses plasma concentration estimates. It does not account for tolerance, adenosine sensitivity, or circadian phase differences. Treat the output as a planning guide, not a precise medical prediction.
            
            <strong>Sources:</strong> Drake et al. (2013) PMID 24235903; Gardiner et al. (2023) PMID 36870101; Clark &amp; Landolt (2017) PMID 26899133; Burke et al. (2015) PMID 26378246
        `
    }
};

// Inline citation keys for Overview guides (number maps to Science tab anchors).
const CITATION_INDEX = {
    baur2024:     { pmid: '38221756', num: 1, short: 'Baur et al. 2024' },
    gardiner2023: { pmid: '36870101', num: 2, short: 'Gardiner et al. 2023' },
    drake2013:    { pmid: '24235903', num: 3, short: 'Drake et al. 2013' },
    clark2017:    { pmid: '26899133', num: 4, short: 'Clark & Landolt 2017' },
    burke2015:    { pmid: '26378246', num: 5, short: 'Burke et al. 2015' }
};

/**
 * Return superscript inline citation link to Science tab reference.
 *
 * @param {string} key - Key in CITATION_INDEX
 * @returns {string} HTML snippet
 */
function cite(key) {
    const c = CITATION_INDEX[key];
    if (!c) return '';
    return `<sup class="cite-ref"><a href="#ref-${c.pmid}" title="${c.short}">[${c.num}]</a></sup>`;
}

// Full references (Vancouver-style fields). Rendered in index.html via renderCitations().
const CITATION_GROUPS = [
    {
        title: 'Sleep Disruption Thresholds',
        items: [
            {
                authors: 'Baur DM, Dornbierer DA, Landolt HP',
                title: 'Concentration-effect relationships of plasma caffeine on EEG delta power and cardiac autonomic activity during human sleep',
                journal: 'J Sleep Res',
                year: 2024,
                volume: '33',
                issue: '5',
                pages: 'e14140',
                pmid: '38221756',
                usedFor: 'Background on concentration–effect relationships in controlled sleep studies. Not used as a universal personal cutoff.'
            },
            {
                authors: 'Gardiner C, Weakley J, Burke LM, Roach GD, Sargent C, Maniar N, et al',
                title: 'The effect of caffeine on subsequent sleep: A systematic review and meta-analysis',
                journal: 'Sleep Med Rev',
                year: 2023,
                volume: '69',
                pages: '101764',
                pmid: '36870101',
                usedFor: 'Mean effects on sleep latency, total sleep time, and sleep efficiency across dose and timing conditions.'
            },
            {
                authors: 'Drake C, Roehrs T, Shambroom J, Roth T',
                title: 'Caffeine effects on sleep taken 0, 3, or 6 hours before going to bed',
                journal: 'J Clin Sleep Med',
                year: 2013,
                volume: '9',
                issue: '11',
                pages: '1195-200',
                pmid: '24235903',
                usedFor: 'Measurable sleep disruption even when caffeine is taken 6 hours before bedtime.'
            },
            {
                authors: 'Clark I, Landolt HP',
                title: 'Coffee, caffeine, and sleep: A systematic review of epidemiological studies and randomized controlled trials',
                journal: 'Sleep Med Rev',
                year: 2017,
                volume: '31',
                pages: '70-78',
                pmid: '26899133',
                usedFor: 'Adenosine receptor mechanisms, dose–response patterns, and individual variability in caffeine–sleep research.'
            },
            {
                authors: 'Burke TM, Markwald RR, McHill AW, Chinoy ED, Snider JA, Bessman SC, et al',
                title: 'Effects of caffeine on the human circadian clock in vivo and in vitro',
                journal: 'Sci Transl Med',
                year: 2015,
                volume: '7',
                issue: '305',
                pages: '305ra146',
                pmid: '26378246',
                usedFor: 'Evening caffeine can delay circadian melatonin timing. Separate from adenosine blockade at bedtime.'
            }
        ]
    },
    {
        title: 'Pharmacokinetics & Half-Life',
        items: [
            {
                authors: 'Grzegorzewski J, Bartsch F, Köller A, König M',
                title: 'Pharmacokinetics of caffeine: A systematic analysis of reported data for application in metabolic phenotyping and liver function testing',
                journal: 'Front Pharmacol',
                year: 2021,
                volume: '12',
                pages: '752826',
                pmid: '35280254',
                usedFor: 'Systematic analysis of reported half-life values; supports ~5 hour mean half-life in healthy adults.'
            },
            {
                authors: 'Liguori A, Hughes JR, Grass JA',
                title: 'Absorption and subjective effects of caffeine from coffee, cola and capsules',
                journal: 'Pharmacol Biochem Behav',
                year: 1997,
                volume: '58',
                issue: '3',
                pages: '721-6',
                pmid: '9329065',
                usedFor: 'Fasting Tmax (~45 min) and bioavailability (~99%) for coffee, cola, and capsules.'
            },
            {
                authors: 'Institute of Medicine (US) Committee on Military Nutrition Research',
                title: 'Pharmacology of caffeine',
                bookTitle: 'Caffeine for the Sustainment of Mental Task Performance: Formulations for Military Operations',
                publisher: 'National Academies Press (US)',
                year: 2001,
                url: 'https://www.ncbi.nlm.nih.gov/books/NBK223808/',
                usedFor: 'Volume of distribution (~0.6 L/kg), clearance, and peak concentration modeling.'
            },
            {
                authors: 'Arnaud MJ',
                title: 'Pharmacokinetics and metabolism of natural methylxanthines in animal and man',
                journal: 'Handb Exp Pharmacol',
                year: 2011,
                volume: '200',
                pages: '33-91',
                pmid: '20859793',
                usedFor: 'Half-life range and methylxanthine metabolism in humans (updated handbook review).'
            }
        ]
    },
    {
        title: 'Sex, Hormones & Pregnancy',
        items: [
            {
                authors: 'Patwardhan RV, Desmond PV, Johnson RF, Schenker S',
                title: 'Impaired elimination of caffeine by oral contraceptive steroids',
                journal: 'J Lab Clin Med',
                year: 1980,
                volume: '95',
                issue: '4',
                pages: '603-8',
                pmid: '7359014',
                usedFor: 'Oral contraceptives significantly prolong caffeine elimination; supports the OCP half-life modifier.'
            },
            {
                authors: 'Abernethy DR, Todd EL',
                title: 'Impairment of caffeine clearance by chronic use of low-dose oestrogen-containing oral contraceptives',
                journal: 'Eur J Clin Pharmacol',
                year: 1985,
                volume: '28',
                issue: '4',
                pages: '425-8',
                pmid: '4029248',
                usedFor: 'Replication of prolonged caffeine clearance with low-dose estrogen-containing oral contraceptives.'
            },
            {
                authors: 'Knutti R, Rothweiler H, Schlatter C',
                title: 'The effect of pregnancy on the pharmacokinetics of caffeine',
                journal: 'Arch Toxicol',
                year: 1982,
                volume: '51',
                pages: '55-9',
                pmid: '6954898',
                usedFor: 'Pregnancy prolongs caffeine half-life; supports ~2× half-life modifier in this model.'
            },
            {
                authors: 'Yu T, Campbell SC, Stockmann C, Tak C, Schoen K, et al',
                title: 'Pregnancy-induced changes in the pharmacokinetics of caffeine and its metabolites',
                journal: 'J Clin Pharmacol',
                year: 2016,
                volume: '56',
                issue: '5',
                pages: '590-6',
                pmcid: 'PMC5564294',
                pmid: '26358647',
                usedFor: 'Pregnancy-related changes in caffeine pharmacokinetics; trimester-dependent variation.'
            }
        ]
    },
    {
        title: 'CYP1A2 & Lifestyle',
        items: [
            {
                authors: 'Gu L, Gonzalez FJ, Kalow W, Tang BK',
                title: 'Biotransformation of caffeine, paraxanthine, theobromine and theophylline by cDNA-expressed human CYP1A2 and CYP2E1',
                journal: 'Pharmacogenetics',
                year: 1992,
                volume: '2',
                issue: '2',
                pages: '73-7',
                pmid: '1302044',
                usedFor: 'CYP1A2 handles most caffeine metabolism. Cited for inter-individual enzyme variability.'
            },
            {
                authors: 'Parsons WD, Neims AH',
                title: 'Effect of smoking on caffeine clearance',
                journal: 'Clin Pharmacol Ther',
                year: 1978,
                volume: '24',
                issue: '1',
                pages: '40-5',
                pmid: '657717',
                usedFor: 'Smoking induces CYP1A2 and speeds caffeine clearance; supports ~50% shorter half-life modifier.'
            },
            {
                authors: 'Institute of Medicine (US) Committee on Military Nutrition Research',
                title: 'Pharmacology of caffeine',
                bookTitle: 'Caffeine for the Sustainment of Mental Task Performance: Formulations for Military Operations',
                publisher: 'National Academies Press (US)',
                year: 2001,
                url: 'https://www.ncbi.nlm.nih.gov/books/NBK223808/',
                usedFor: 'CYP1A2 induction by smoking and general caffeine pharmacokinetics (NCBI Bookshelf).'
            }
        ]
    },
    {
        title: 'Safety Guidance (FDA / EFSA)',
        items: [
            {
                authors: 'U.S. Food and Drug Administration',
                title: 'Spilling the Beans: How Much Caffeine is Too Much?',
                year: 2023,
                url: 'https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much',
                usedFor: 'Consumer guidance on daily caffeine limits. Not personalized medical advice.'
            },
            {
                authors: 'European Food Safety Authority',
                title: 'Scientific Opinion on the safety of caffeine',
                journal: 'EFSA Journal',
                year: 2015,
                volume: '13',
                issue: '5',
                pages: '4102',
                doi: '10.2903/j.efsa.2015.4102',
                url: 'https://www.efsa.europa.eu/en/efsajournal/pub/4102',
                usedFor: 'Population guidance (~400 mg/day habitual intake for healthy adults; lower in pregnancy).'
            }
        ]
    },
    {
        title: 'Genetics (CYP1A2)',
        items: [
            {
                authors: 'Cornelis MC, Monda KL, Yu K, Paynter N, Azzato EM, Bennett SN, et al',
                title: 'Genome-wide meta-analysis identifies regions on 7p21 (AHR) and 15q24 (CYP1A2) as determinants of habitual caffeine consumption',
                journal: 'PLoS Genet',
                year: 2011,
                volume: '7',
                issue: '4',
                pages: 'e1002033',
                pmid: '21490707',
                pmcid: 'PMC3072367',
                usedFor: 'CYP1A2 genotype associations with habitual caffeine intake and metabolizer variation.'
            },
            {
                authors: 'Sachse C, Brockmöller J, Bauer S, Roots I',
                title: 'Functional significance of a C→A polymorphism in intron 1 of the cytochrome P450 CYP1A2 gene tested with caffeine',
                journal: 'Br J Clin Pharmacol',
                year: 1999,
                volume: '47',
                issue: '4',
                pages: '445-9',
                pmid: '10233211',
                usedFor: 'AA genotype clears caffeine faster than CC genotype; basis for fast/slow metabolizer modifiers.'
            }
        ]
    },
    {
        title: 'Food & Absorption',
        items: [
            {
                authors: 'Grimm M, Rump A, Meilicke L, Feldmüller M, Keßler R, Scheuch E, et al',
                title: 'Comparing salivary caffeine kinetics of 13C and 12C caffeine for gastric emptying of 50 mL water',
                journal: 'Pharmaceutics',
                year: 2023,
                volume: '15',
                issue: '2',
                pages: '328',
                pmid: '36839650',
                doi: '10.3390/pharmaceutics15020328',
                usedFor: 'Gastric emptying affects caffeine absorption timing; supports delayed Tmax with slower emptying.'
            }
        ]
    }
];
  
  // Export for use in other files
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      CAFFEINE_SOURCES,
      HALFLIFE_BASE_MALE,
      HALFLIFE_MODIFIERS,
      METABOLIZER_FACTORS,
      TMAX_ADJUSTMENTS,
      COEFFICIENTS,
      SLEEP_ZONES,
      SAFE_THRESHOLD,
      CAUTION_THRESHOLD,
      WARNING_THRESHOLD,
      DANGER_THRESHOLD,
      BAUR_DELTA_POWER_THRESHOLD,
      CITATION_GROUPS
    };
  }

  