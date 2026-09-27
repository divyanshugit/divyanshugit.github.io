// Page data for /projects.html, derived from src/data/projects.js via the
// server-side view in src/_data/projs.js. Only reshaping happens here: the
// lead project's "Name: text" methodology lines are split, its outcomes are
// separated into the toolkit and the planned papers, and links are checked.
const fs = require("fs");
const path = require("path");
const projs = require("./_data/projs.js");
const pubs = require("./_data/pubs.js");

const LINK_LABELS = { code: "code", demo: "demo", paper: "paper", competition: "competition" };

// A relative link only survives if the page it points to is actually built.
function exists(url) {
  if (!url.startsWith("/")) return true;
  const rel = url.replace(/[#?].*$/, "").replace(/\/$/, "/index");
  const cands = [rel, rel + ".md", rel + ".html", rel + ".njk", rel.replace(/\/index$/, ".md")].map(p => path.join(__dirname, p));
  return cands.some(p => fs.existsSync(p));
}
function links(p) {
  const out = [];
  Object.entries(p.links || {}).forEach(([k, url]) => {
    if (!url || !exists(url)) return;
    out.push({ label: LINK_LABELS[k] || k, url });
    // a project paper that is also on the Publications page: link there too
    const pub = pubs.find(x => x.href === url || (x.urls || []).some(u => u.url === url));
    if (pub) out.push({ label: "in Publications", url: `/publications.html#${pub.id}`, internal: true });
  });
  return out;
}
const splitColon = s => { const i = s.indexOf(":"); return i > 0 && i < 40 ? { term: s.slice(0, i).trim(), text: s.slice(i + 1).trim() } : { term: "", text: s }; };

const lead = projs.find(p => p.featured && p.status === "active") || projs[0];

function shapeLead(p) {
  const method = (p.methodology || []).map(splitColon);
  const outcomes = p.expectedOutcomes || [];
  let toolkit = null; const planned = []; const otherOutcomes = [];
  outcomes.forEach(o => {
    const pubsMatch = o.match(/^Publications?:\s*(.*)$/i);
    if (pubsMatch) { (pubsMatch[1].match(/'([^']+)'|"([^"]+)"/g) || []).forEach(t => planned.push(t.replace(/^['"]|['"]$/g, ""))); return; }
    const tk = o.match(/^(.+?)\s+[-–—]\s+(.+)$/);
    if (tk && !toolkit) { toolkit = { name: tk[1], text: tk[2] }; return; }
    otherOutcomes.push(o);
  });
  return { ...p, method, toolkit, planned, otherOutcomes, linkList: links(p) };
}

// the detail list each other project carries, under whichever key it uses
const DETAIL_KEYS = [["achievements", "What it does"], ["contributions", "What I built"], ["currentWork", "In progress"]];
const others = projs.filter(p => p !== lead).map(p => {
  const d = DETAIL_KEYS.find(([k]) => (p[k] || []).length);
  return { ...p, detailLabel: d ? d[1] : null, detail: d ? p[d[0]] : [], linkList: links(p) };
});

const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
module.exports = {
  lead: shapeLead(lead),
  others,
  eleventyComputed: {
    // The working terms named in projects.md (metrics:) are marked where the
    // methodology first uses them, so their margin gloss can anchor there.
    leadMethod: data => data.lead.method.map(m => {
      let html = m.text.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
      let anchored = false;
      (data.metrics || []).forEach((t, i) => {
        const re = new RegExp(escRe(t.term) + "(\\s*\\([A-Z]+\\))?");
        html = html.replace(re, s => { const first = !anchored; anchored = true; return `<dfn class="term"${first ? ' id="terms"' : ""}>${s}</dfn>`; });
      });
      return { term: m.term, html, hasTerms: anchored };
    })
  }
};
