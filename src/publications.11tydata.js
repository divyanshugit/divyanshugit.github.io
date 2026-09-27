// Page data for /publications.html, derived from src/data/publications.js via
// the server-side view in src/_data/pubs.js. Nothing here is hand-copied:
// counts, subjects and the cleaned abstracts are all computed at build time.
const pubs = require("./_data/pubs.js");

const SELF = "Divyanshu Kumar";

// The Index of subjects: curated groupings over tags + title (the raw tags are
// too granular to index). Order is the reading order of the research arc.
const SUBJECTS = [
  { id: "efficiency", label: "Efficiency & quantization", re: /quantization|compression|efficien/i },
  { id: "redteam", label: "Red teaming & jailbreaks", re: /red teaming|jailbreak|adversarial|cbrn/i },
  { id: "guardrails", label: "Guardrails & alignment", re: /guardrail|alignment|model safety/i },
  { id: "agents", label: "Agents", re: /agentic/i },
  { id: "multimodal", label: "Multimodal", re: /multimodal|vision|audio/i },
  { id: "bias", label: "Bias & fairness", re: /bias|fairness|socioeconomic|partisan/i },
  { id: "eval", label: "Evaluation & benchmarks", re: /evaluation|benchmark|risk/i },
  { id: "retrieval", label: "Retrieval", re: /\brag\b|retrieval/i },
  { id: "graphs", label: "Graph reasoning", re: /graph/i }
];

const esc = s => String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// Abstracts carry a little LaTeX: "\%" arrives as "%", but "\textit{…}" arrives
// as a tab + "extit{…}" because "\t" is a JS escape. Undo both, then escape.
function cleanAbstract(a) {
  let s = esc(String(a || "").trim());
  s = s.replace(/(?:\t|\\t)extit\{([^}]*)\}/g, "<i>$1</i>").replace(/\\%/g, "%").replace(/\s+/g, " ");
  return s;
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const items = pubs.map(p => {
  const hay = [...(p.tags || []), p.title].join(" ");
  const subjects = SUBJECTS.filter(s => s.re.test(hay)).map(s => s.id);
  const selfIdx = (p.authors || []).findIndex(a => a.replace(/\*$/, "") === SELF);
  const selfStar = selfIdx > -1 && /\*$/.test(p.authors[selfIdx]);
  const first = selfIdx === 0;
  // co-first: starred with the first author (shared first authorship)
  const coFirst = selfStar && /\*$/.test(p.authors[0]);
  const venue = String(p.venue || "").replace(/\s*\(Poster\)/g, "");
  const poster = /\(Poster\)/.test(p.venue || "");
  return {
    ...p,
    subjects,
    first, coFirst,
    firstish: first || coFirst,
    venueShort: venue,
    poster,
    when: (p.month ? MONTHS[p.month - 1] + " " : "") + p.year,
    abstractHtml: cleanAbstract(p.abstract),
    // links other than the canonical title link: arXiv / OpenReview (real URLs from pubs.js)
    extra: (p.urls || []).filter(u => u.label !== "paper")
  };
});

const years = [...new Set(items.map(p => p.year))].sort((a, b) => b - a)
  .map(y => ({ year: y, items: items.filter(p => p.year === y) }));

const counts = {};
items.forEach(p => p.subjects.forEach(s => { counts[s] = (counts[s] || 0) + 1; }));

const byStatus = s => items.filter(p => p.status === s).length;
const collation = {
  total: items.length,
  from: Math.min(...items.map(p => p.year)),
  to: Math.max(...items.map(p => p.year)),
  published: byStatus("published"),
  preprint: byStatus("preprint"),
  review: byStatus("under-review"),
  firstish: items.filter(p => p.firstish).length,
  coFirst: items.filter(p => p.coFirst).length,
  featured: items.filter(p => p.featured).length
};

module.exports = {
  pubList: items,
  pubYears: years,
  subjects: SUBJECTS.filter(s => counts[s.id]).map(s => ({ id: s.id, label: s.label, n: counts[s.id] })),
  collation
};
