// Server-side view of src/data/publications.js (the same file the browser loads).
// Adds real URLs for the bare arXiv / OpenReview ids.
const { publications } = require("../data/publications.js");
module.exports = publications
  .map(p => {
    const l = p.links || {};
    const urls = [];
    if (l.paper) urls.push({ label: "paper", url: l.paper });
    if (l.arxiv) urls.push({ label: "arXiv", url: `https://arxiv.org/abs/${l.arxiv}` });
    if (l.openreview) urls.push({ label: "OpenReview", url: `https://openreview.net/forum?id=${l.openreview}` });
    return { ...p, urls, href: l.paper || urls[0]?.url || null };
  })
  .sort((a, b) => (b.year - a.year) || ((b.month || 0) - (a.month || 0)));
