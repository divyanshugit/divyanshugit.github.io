// Data for /timeline.html (layout timeline-page.njk). The milestones come from
// src/data/news.js (the same file the rest of the site reads); this only
// parses their dates and groups them by year, newest first.
//  · "Aug 2026", "June 2026", "Sept 2025" and year-only "2023" all parse;
//    a year-only entry sorts after the dated ones of its year.
//  · An entry whose date cannot be read is kept, under "Undated", at the end.
//  · PLACES ties an entry to a plate on About (src/_data/places.js). Only
//    places the record itself names are listed here.
const { news } = require("./data/news.js");

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const PLACES = { "graduation": "kolkata", "iisc-research": "bangalore", "aaai-2026-attendance": "singapore" };

function parse(date) {
  const s = String(date || "").trim();
  const y = s.match(/\b(19|20)\d{2}\b/);
  const m = s.match(/\b([A-Za-z]{3,})\.?\b/);
  const month = m ? MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) + 1 : 0;
  return { year: y ? Number(y[0]) : null, month, label: month ? m[1].slice(0, 3) : "" };
}

module.exports = {
  eleventyComputed: {
    chronicle: () => {
      const items = (news || []).filter(n => n && n.id).map((n, i) => {
        const d = parse(n.date);
        const links = Object.entries(n.links || {}).filter(([, url]) => url && url !== "#");
        return { ...n, ...d, i, links, place: PLACES[n.id] || null };
      });
      items.sort((a, b) => ((b.year || 0) - (a.year || 0)) || (b.month - a.month) || (a.i - b.i));
      const years = [];
      items.forEach(it => {
        const key = it.year || "Undated";
        let g = years.find(y => y.year === key);
        if (!g) years.push(g = { year: key, items: [] });
        g.items.push(it);
      });
      return years;
    }
  }
};
