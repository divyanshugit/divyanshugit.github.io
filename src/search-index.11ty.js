// ============================================================================
// /search-index.json — the site-wide index the home-page probe answers from.
// Grounded, no model: every entry is a sentence or an item that exists on a
// page, with the URL (and anchor) where it lives. Built at compile time from
// the same sources as the pages, so it never drifts:
//   about.md prose + places stories · publications · projects · blog posts ·
//   timeline items · contact · the probe profile (src/_data/probe.js).
// Entry: { t: quote, k: extra keywords, u: url#anchor, s: "Page · label", g: group }
// ============================================================================
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const ABBR = /\b(Prof|Dr|Mr|Ms|Mrs|St|vs|etc|e\.g|i\.e|A\.P|U\.S)\./g;
function sentences(text) {
  const masked = text.replace(ABBR, m => m.replace(/\./g, "․"));
  const out = []; let last = 0; const re = /[.?!]["”’)]*\s+(?=[A-Z“"(0-9])/g; let m;
  while ((m = re.exec(masked))) { out.push(text.slice(last, m.index + m[0].length).trim()); last = m.index + m[0].length; }
  out.push(text.slice(last).trim());
  return out.filter(s => s.length > 3);
}
// markdown paragraph -> plain text (links kept as their text, footnote refs dropped)
function plain(md) {
  return md
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\[\^[^\]]+\]/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function fragment(s) {
  // a text fragment so the browser highlights the exact sentence on arrival
  const w = s.replace(/[“”"]/g, "").split(/\s+/);
  const enc = x => encodeURIComponent(x).replace(/-/g, "%2D");
  if (w.length <= 8) return ":~:text=" + enc(w.join(" "));
  return ":~:text=" + enc(w.slice(0, 5).join(" ")) + "," + enc(w.slice(-3).join(" "));
}
const strip = s => String(s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

class SearchIndex {
  data() {
    return { permalink: "/search-index.json", eleventyExcludeFromCollections: true, layout: false };
  }
  render(data) {
    const out = [];
    const add = (e) => out.push(e);

    // ---- About: prose (lede → #top, §1 → #work) and the journey (→ #places)
    const about = matter(fs.readFileSync(path.join(__dirname, "about.md"), "utf8"));
    const body = about.content.replace(/^\[\^[^\]]+\]:.*$/gm, "");
    const [lede, rest = ""] = body.split("<!-- more -->");
    const para = (md, anchor, label) => md.split(/\n\s*\n/).map(plain).filter(Boolean)
      .forEach(p => sentences(p).forEach(s => add({ t: s, u: `/about.html#${anchor}${fragment(s)}`, s: `About · ${label}`, g: "about" })));
    para(lede, "top", "Introduction");
    para(rest, "work", about.data.workHeading || "What I work on");
    if (about.data.journey) para(about.data.journey, "places", "Where this happened");

    // ---- Home: the short bio (same page as the probe)
    try {
      const home = matter(fs.readFileSync(path.join(__dirname, "index.md"), "utf8"));
      home.content.replace(/^\[\^[^\]]+\]:.*$/gm, "").split(/\n\s*\n/).map(plain).filter(Boolean)
        .forEach(p => sentences(p).forEach(s => add({ t: s, u: "/index.html#top", s: "Home · Introduction", g: "home" })));
    } catch (e) {}

    // ---- Where I've worked (src/_data/work.js → About §3, one row each)
    const W = data.work || { entries: [] };
    [...W.entries, W.service].filter(Boolean).forEach(e => {
      const where = e.place ? `, ${e.place}` : "";
      add({
        t: `${e.org}: ${e.role}${where}, ${e.dates}. ${(e.lines || []).map(plain).join(" ")}`,
        k: [...(e.alias || []), e.kind, e.intern ? "intern internship interned" : "", "worked work job company employer experience career", e.country || ""].join(" "),
        u: `/about.html#w-${e.id}`, s: `About · Where I’ve worked, ${e.org}`, g: "work"
      });
    });

    // ---- Places: where he has lived in one sentence, where he has travelled in another, then each plate
    // only the first place (where he is from) carries its region: "Berai (Sarai, Bihar), Patna, Kolkata, …"
    const pname = (p, i) => p.name.replace(/^The /, "the ") + (i === 0 && p.region ? ` (${p.region})` : "");
    const and = (xs) => xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs.join("");
    const pl = (data.places || []).map((p, i) => ({ n: pname(p, i), visited: !!p.visited }));
    const lived = pl.filter(p => !p.visited).map(p => p.n), visited = pl.filter(p => p.visited).map(p => p.n);
    const NUM = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    if (lived.length) add({ t: `I have lived in ${NUM[lived.length] || lived.length} places, in this order: ${and(lived)}.`, k: "lived live places cities journey moved home", u: "/about.html#places", s: "About · Where this happened", g: "places" });
    if (visited.length) add({ t: `I have also travelled to ${and(visited)}.`, k: "travelled traveled travel visited trips wander places countries", u: "/about.html#places", s: "About · Where this happened", g: "places" });
    // role/caption always; the story when written
    (data.places || []).forEach(p => {
      const bits = [p.name + (p.role ? `: ${p.role}.` : "."), p.caption].filter(Boolean).join(" ");
      add({ t: bits, k: [p.name, p.local, p.region, ...(p.levels || [])].join(" "), u: `/about.html#place-${p.id}`, s: `About · Plate ${p.plate}, ${p.name}`, g: "places" });
      if (p.story) sentences(plain(p.story)).forEach(s => add({ t: s, k: p.name, u: `/about.html#place-${p.id}`, s: `About · Plate ${p.plate}, ${p.name}`, g: "places" }));
    });

    // ---- Publications (+ the one-line gists written for the home page)
    let gists = {};
    try { gists = matter(fs.readFileSync(path.join(__dirname, "index.md"), "utf8")).data.papers || {}; } catch (e) {}
    (data.pubs || []).forEach(p => {
      const g = gists[p.id] || {};
      const short = p.title.split(":")[0];
      add({
        t: g.gist ? `${p.title}. ${g.gist}` : `${p.title}.`,
        k: [p.venue, p.year, ...(p.tags || []), p.status, (p.abstract || "").slice(0, 600)].join(" "),
        u: `/publications.html#${p.id}`,
        s: `Publications · ${short} (${(g.venue || p.venue).replace(/\s*\(Poster\)/, "")}${g.venue ? "" : ", " + p.year})`,
        g: "papers"
      });
    });

    // ---- Projects
    (data.projs || []).forEach(p => add({
      t: `${p.title}: ${p.description}`,
      k: [...(p.technologies || []), p.status, p.fullDescription || "", ...(p.currentWork || [])].join(" "),
      u: `/projects.html#${p.id}`, s: `Projects · ${p.title.split(":")[0]}`, g: "projects"
    }));

    // ---- Blog posts
    const clean = t => String(t || "").replace(/^[\p{Extended_Pictographic}️\s]+/u, "").replace(/\s*\[[^\]]*\]\s*$/, "").trim();
    ((data.collections && data.collections.blog) || []).forEach(post => add({
      t: `${clean(post.data.title)}. ${clean(post.data.description)}`.replace(/([.?!])\./g, "$1"),
      k: (post.data.tags || []).join(" "),
      u: post.url, s: `Blog · ${clean(post.data.title)}`, g: "blog"
    }));

    // ---- Timeline
    (data.news || []).forEach(n => add({
      t: `${n.date}: ${strip(n.content)}`, u: `/timeline.html#${n.id}`, s: `Timeline · ${n.date}`, g: "timeline"
    }));

    // ---- Contact / CV
    const site = data.site;
    add({ t: "Write to me by email; I am happy to talk about AI safety, efficiency and privacy.", k: "email contact reach mail talk collaborate hire write", u: "email:", s: "Email · write to me", g: "contact" });
    add({ t: "My CV, as a PDF.", k: "cv resume curriculum vitae pdf", u: "/assets/cv.pdf", s: "CV · PDF", g: "contact" });
    (site.links || []).filter(l => l.url && l.icon !== "cv").forEach(l => add({ t: `${l.text}: ${l.url.replace(/^https?:\/\//, "")}`, k: `${l.text} profile social`, u: l.url, s: l.text, g: "contact" }));

    // ---- Profile: the facts composed answers ("who is he", "what can he do") are
    // built from. One entry; the probe keeps it out of sentence grounding.
    if (data.probe) add({ t: "", u: "/about.html", s: "About", g: "profile", p: data.probe });

    return JSON.stringify(out);
  }
}
module.exports = SearchIndex;
