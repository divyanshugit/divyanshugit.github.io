// ============================================================================
// PARTICULARS — the only text the ε privacy budget may touch.
//
// `facts` are released through the Laplace mechanism in /js/eps.js:
//   - categorical: `levels` is a generalisation hierarchy, most specific first.
//     Levels dropped = floor(|z| · (1/ε) · 1.6), z = one seeded unit-Laplace draw.
//   - numeric: value + z · delta/ε, rounded to `round`; shown as "≈n" when noised.
// `line` is the one releasable line on the homepage. Each part is either plain
// text or { f: "<fact id>" }. Body prose is never noised.
// ============================================================================
const places = require("./places.js");

const base = {
    // Where he is from: Berai, a village in Sarai, Bihar (also Plate I).
    from:     { levels: ["Berai, Sarai, Bihar", "a village in Bihar", "Bihar", "North India", "South Asia"] },
    kolkata:  { levels: ["Kolkata", "a city in West Bengal", "a city on the Hooghly", "East India", "South Asia"] },
    iisc:     { levels: ["IISc Bangalore", "an institute in Bangalore", "an institute in South India", "a university", "an institution"] },
    enkrypt:  { levels: ["Enkrypt AI", "an AI-security startup", "a startup", "a company"] },
    models:   { value: 250, delta: 60, round: 10, exact: "250+", min: 10 },
    anaconda: { levels: ["Anaconda", "a Python company", "a software company", "a company"] },
    since:    { levels: ["2026", "the mid-2020s", "recently"] },
    grad:     { levels: ["2022", "the early 2020s", "a few years ago"] },
    started:  { levels: ["2020", "the early 2020s", "a while ago"] }
};

// Every place name on a plate caption is releasable too: "place-<id>".
const placeFacts = Object.fromEntries(places.map(p => [`place-${p.id}`, { levels: p.levels }]));

module.exports = {
  facts: { ...base, ...placeFacts },
  // Home: only particulars the bio above does not already state, so a noised
  // line can never contradict the sentence printed right above it.
  homeLine: [
    "From ", { f: "from" },
    " · B.Tech, ", { f: "kolkata" }, ", ", { f: "grad" },
    " · doing research since ", { f: "started" }
  ],
  // About: the full line
  line: [
    "From ", { f: "from" },
    " · B.Tech, ", { f: "kolkata" },
    " · ", { f: "iisc" },
    " · ", { f: "enkrypt" }, ", ", { f: "models" }, " models red-teamed",
    " · ", { f: "anaconda" }, ", ", { f: "since" }
  ]
};
