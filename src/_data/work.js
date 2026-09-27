// ============================================================================
// WORK — where I have worked, studied and reviewed. The single source for
// About §3 ("Where I've worked") and for the probe's work answers
// (src/_data/probe.js, src/search-index.11ty.js).
//
// From the CV (resume/experience.tex, education.tex, opensource.tex, misc.tex).
// Keep numbers as the CV has them; add nothing it does not say.
//
// Each entry:
//   id      anchor on About: /about.html#w-<id>
//   org     as printed; `alias` = other names the probe should match
//   role, kind: "work" | "research" | "open-source" | "education"
//   remote  true when the job was remote; `where` is then where the company is
//           (city if the CV names one, else the country); `place` is printed
//   placeId one of the plates in places.js, when the entry happened there
//   start / end  "YYYY-MM"; end null = present
//   lines   1–3 short sentences, markdown inline, first person
// ============================================================================
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ym = s => { const [y, m] = s.split("-").map(Number); return { y, m, t: `${MON[m - 1]} ${y}` }; };
function dates(start, end) {
  const a = ym(start);
  if (!end) return `${a.t} – present`;
  const b = ym(end);
  return a.y === b.y ? `${MON[a.m - 1]} – ${b.t}` : `${a.t} – ${b.t}`;
}

const entries = [
  {
    id: "anaconda", org: "Anaconda", alias: ["anaconda"], kind: "work",
    role: "AI Research Engineer",
    remote: true, where: "India", country: "India",
    start: "2026-08", end: null, link: "https://www.anaconda.com/",
    lines: ["Joined with Enkrypt AI’s acquisition."]
  },
  {
    id: "enkrypt", org: "Enkrypt AI", alias: ["enkrypt"], kind: "work",
    role: "ML Research Engineer, founding engineer", note: "acquired by Anaconda",
    remote: true, where: "India", country: "India",
    start: "2023-07", end: "2026-08", link: "https://www.enkryptai.com/",
    lines: [
      "Led red-teaming across 250+ foundation models, the work behind Enkrypt’s public [LLM Safety Leaderboard](https://www.enkryptai.com/llm-safety-leaderboard).",
      "Built proofs of concept and automated red-teaming for enterprise customers in finance, consulting and cybersecurity, and agentic document tools for fund administration: an LPA extractor with hybrid vector search, and an Excel formula-tracing agent with cell-level provenance.",
      "Shipped low-latency guardrails on ONNX and Triton, a differentially private fine-tuning framework (PEFT and SFT), and SecureLLM, which uses homomorphic encryption."
    ]
  },
  {
    id: "iisc", org: "Indian Institute of Science", alias: ["iisc", "indian institute of science", "prathosh"], kind: "research",
    role: "Research Associate, with Prof.\u00a0Prathosh\u00a0A.P.",
    remote: false, where: "Bangalore", country: "India", placeId: "bangalore",
    start: "2022-06", end: "2023-06", link: "https://iisc.ac.in/",
    lines: [
      "Unlearning targeted features in GANs by perturbing the latent space, with differential privacy; tested on MNIST, CIFAR-10 and CelebA.",
      "Knowledge-distilled Hindi–Kannada translation: a custom mBART, and an IndicBART encoder with part-of-speech embeddings."
    ]
  },
  {
    id: "factmata", org: "FactMata", alias: ["factmata"], kind: "work",
    role: "ML Engineer Intern", intern: true,
    remote: true, where: "London", country: "UK",
    start: "2021-11", end: "2021-12", link: null,
    lines: ["Worked on the Information Nutrition Label model, and on back-translation to augment its training data."]
  },
  {
    id: "aicrowd", org: "AIcrowd", alias: ["aicrowd", "ai crowd"], kind: "work",
    role: "Intern", intern: true,
    remote: true, where: "Switzerland", country: "Switzerland",
    start: "2021-09", end: "2022-03", link: "https://www.aicrowd.com/",
    lines: [
      "Wrote baselines for NLP and vision challenges (LSTM, BERT, ALBERT, YOLO, Detectron).",
      "Made ML puzzles for learners, with GANs and transformers."
    ]
  },
  {
    id: "highradius", org: "HighRadius", alias: ["highradius", "high radius"], kind: "work",
    role: "Intern", intern: true,
    remote: true, where: null, country: null,
    start: "2021-06", end: "2021-10", link: "https://www.highradius.com/",
    lines: [
      "Predicted when clients would pay with XGBoost (MAE 0.19).",
      "Wrote Java web agents that parse 10 remittances a minute, in production."
    ]
  },
  {
    // Commented out of the CV, kept here: it was my first research.
    id: "helppr", org: "Helppr.ai", alias: ["helppr", "helppr ai", "helppr.ai"], kind: "research",
    role: "NLP Research Intern", intern: true,
    remote: false, where: "Gurugram", country: "India", placeId: "delhi", placeNote: "Delhi NCR",
    start: "2021-03", end: "2021-04", link: null,
    lines: [
      "Fine-tuned ALBERT, BERT, BART and T5 for summarisation.",
      "Deployed one at 78% accuracy, with 30% lower inference time."
    ]
  },
  {
    id: "nimbleedge", org: "NimbleEdge", alias: ["nimbleedge", "nimble edge", "envisedge"], kind: "open-source",
    role: "Contributor; Google Season of Docs mentor",
    remote: false, where: "Bangalore", country: "India", placeId: "bangalore",
    start: "2022-05", end: "2022-11", link: "https://github.com/NimbleEdge/EnvisEdge",
    lines: [
      "Built federated matrix reconstruction for recommendation, and the Sphinx docs for EnvisEdge’s Python APIs.",
      "As a Season of Docs mentor I edited docs and tutorials, and ran weekly community meetups."
    ]
  },
  {
    id: "openmined", org: "OpenMined", alias: ["openmined", "open mined", "pysyft"], kind: "open-source",
    role: "Mentor",
    remote: true, where: null, country: null,
    start: "2020-10", end: "2021-01", link: "https://www.openmined.org/",
    lines: ["Mentored the Secure and Private AI course, on PySyft, with weekly check-ins on each mentee."]
  },
  {
    id: "narula", org: "Narula Institute of Technology", alias: ["narula", "nit kolkata", "b.tech", "btech"], kind: "education",
    role: "B.Tech, Electronics and Communication Engineering",
    remote: false, where: "Kolkata", country: "India", placeId: "kolkata",
    start: "2018-08", end: "2022-06", link: null,
    lines: ["CGPA 8.78 out of 10."]
  }
].map(e => ({
  ...e,
  dates: dates(e.start, e.end),
  year: Number(e.start.slice(0, 4)),
  // "Remote · London", "Remote · Switzerland", "Remote", "Bangalore"
  place: e.remote ? ["Remote", e.where].filter(Boolean).join(" · ") : e.where
}));

// Reviewing. One row on About; each item is a venue.
const service = {
  id: "service", org: "Reviewing", alias: ["reviewer", "reviewing"], kind: "service",
  role: "Reviewer", start: "2024-01", year: 2024, showYear: true, dates: "2024 – 2026", place: null,
  items: [
    { venue: "ICLR", years: "2024", track: "SET workshop" },
    { venue: "NeurIPS", years: "2024, 2025", track: "Datasets and Benchmarks" },
    { venue: "COLM", years: "2025, 2026" }
  ]
};
service.lines = service.items.map(i => `${i.venue} ${i.years.replace(", ", " and ")}${i.track ? `, ${i.track}${/workshop/i.test(i.track) ? "" : " track"}` : ""}.`);

const GROUPS = [
  { id: "work", label: "Work and research", kinds: ["work", "research"] },
  { id: "open-source", label: "Open source", kinds: ["open-source"] },
  { id: "education", label: "Education", kinds: ["education"] }
];

module.exports = {
  entries,
  service,
  // newest first within each group; `showYear` prints the gutter year only when it changes
  groups: GROUPS.map(g => {
    let last = null;
    const items = entries.filter(e => g.kinds.includes(e.kind))
      .sort((a, b) => b.start.localeCompare(a.start))
      .map(e => { const showYear = e.year !== last; last = e.year; return { ...e, showYear }; });
    return { ...g, items };
  })
};
