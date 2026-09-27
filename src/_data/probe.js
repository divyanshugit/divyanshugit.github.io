// ============================================================================
// PROBE — the facts the home-page "Ask this site" composes its answers from
// ("who is he", "what can he do", "how do I contact him", ...).
//
// Built from site.js, particulars.js, pubs/projs and the prose in about.md and
// index.md, so edits there flow through. Nothing here is new prose: each item
// names a `phrase` that must appear verbatim in about.md or index.md, and the
// build warns and drops the item if the page no longer says it. Paper titles,
// the model count, role and org are read from the data files.
// Written into /search-index.json by src/search-index.11ty.js as { g: "profile" }.
// ============================================================================
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const site = require("./site.js");
const { facts } = require("./particulars.js");
const pubs = require("./pubs.js");
const projs = require("./projs.js");
const work = require("./work.js");

const read = f => { try { return matter(fs.readFileSync(path.join(__dirname, "..", f), "utf8")); } catch (e) { return { data: {}, content: "" }; } };
const about = read("about.md"), home = read("index.md");
const flat = s => String(s || "").replace(/\[\^[^\]]+\]/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/<[^>]+>/g, "").replace(/[’]/g, "'").replace(/\s+/g, " ");
const SOURCE = flat([about.content, about.data.description, about.data.subtitle, home.content, home.data.description, home.data.display].join(" ")).toLowerCase();
const said = phrase => SOURCE.includes(flat(phrase).toLowerCase());
const keep = (item) => {
  if (!item.phrase || said(item.phrase)) return true;
  console.warn(`[probe] dropped "${item.label || item.t}": about.md / index.md no longer say "${item.phrase}"`);
  return false;
};

const pub = id => pubs.find(p => p.id === id);
const short = p => p.title.split(":")[0];
const cites = ids => ids.map(pub).filter(Boolean).map(p => ({ t: short(p), u: `/publications.html#${p.id}` }));
const active = projs.filter(p => p.status === "active");

// "I make AI systems efficient, secure and private." -> "efficient, secure and private"
const focusWords = (/systems? ([a-z ,]+?)\./i.exec(home.data.display || "") || [])[1] || "efficient, secure and private";

module.exports = {
  name: site.name,
  role: { t: `${site.role} at ${site.org}`, u: "/about.html#top", s: "About · Introduction" },
  previous: [
    { t: `the founding ML research engineer at ${facts.enkrypt.levels[0]}`, phrase: "founding ML research engineer", u: "/about.html#work", s: "About · What I work on" },
    { t: `a Research Associate at ${facts.iisc.levels[0]}`, phrase: "Research Associate at IISc Bangalore", u: "/about.html#work", s: "About · What I work on" }
  ].filter(keep),
  focus: {
    t: `${focusWords} AI systems`,
    areas: [["quantization", "inference"], ["red-teaming", "guardrails"], ["differential privacy"]]
      .map(a => a.filter(w => said(w))).filter(a => a.length).map(a => a.join(" and ")),
    u: "/about.html#work", s: "About · What I work on"
  },
  // grounded capability bullets: a label, a short clause the page states, and the evidence
  capabilities: [
    { label: "Adversarial testing", t: `built the adversarial testing pipelines run against ${facts.models.exact} foundation models`, phrase: "adversarial testing pipelines", cites: cites(["kumar2024sagert", "agentredteaming", "multimodalredteaming"]), u: "/about.html#work", s: "About · What I work on" },
    { label: "Guardrails", t: "built production guardrails, and measured what each refusal costs in usefulness", phrase: "production guardrails", cites: cites(["kumar2025nfl"]), u: "/publications.html#kumar2025nfl", s: "Publications · No Free Lunch with Guardrails" },
    { label: "Differential privacy", t: "privacy-preserving ML at IISc, and a four-part series from the definition to DP-SGD", phrase: "four-part series", cites: [{ t: "Inception of Differential Privacy", u: "/blog/differential-privacy-but-why.html" }], u: "/blog.html", s: "Blog · Inception of Differential Privacy" },
    { label: "Quantization and inference", t: "making models smaller and faster to run, and what that does to their safety", phrase: "making models smaller and faster to run", cites: cites(["kumar2024vulnerabilities"]), u: "/publications.html#kumar2024vulnerabilities", s: "Publications · Increased LLM Vulnerabilities" },
    { label: "Evaluation benchmarks", t: "benchmarks for bias, partisanship and hazardous-capability risk", cites: cites(["socioeval", "partisanbias", "kumar2024investigating", "cbrnllm"]), u: "/publications.html", s: "Publications" },
    { label: "Graph reasoning with LLMs", t: "whether an LLM’s answer about a graph changes when only how the graph is written down changes", phrase: "how the graph is written down", cites: cites(["graphreasoning"]), u: "/publications.html#graphreasoning", s: "Publications · Lost in Serialization" }
  ].filter(keep).filter(c => c.cites.length),
  now: [
    ...active.filter(p => /diffusion/i.test(p.title)).map(p => ({ t: (home.data.now && home.data.now.gist) || p.description, u: `/projects.html#${p.id}`, s: `Projects · ${short(p)}` })),
    ...cites(["graphreasoning"]).map(c => ({ t: (home.data.papers && home.data.papers.graphreasoning && home.data.papers.graphreasoning.gist) || c.t, u: c.u, s: `Publications · ${c.t}` }))
  ],
  // where he has worked (src/_data/work.js): each entry links to its row on About §3
  work: [...work.entries, work.service].map(e => ({
    id: e.id, org: e.org, alias: e.alias || [], kind: e.kind, intern: !!e.intern,
    role: e.role, dates: e.dates, place: e.place || "", start: e.start,
    lines: (e.lines || []).map(flat).map(s => s.trim()),
    u: `/about.html#w-${e.id}`, s: `About · Where I’ve worked, ${e.org}`
  })),
  contact: {
    email: site.emailObf,
    invite: { t: "If any of this is your problem too, write to me.", phrase: "If any of this is your problem too" },
    links: site.links.filter(l => l.url).map(l => ({ t: l.label, u: l.url }))
  }
};
