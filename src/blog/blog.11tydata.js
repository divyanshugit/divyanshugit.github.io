// Directory data for every post in src/blog/ (layout: blog-post.njk).
//  · `draft: true` in a post's front matter keeps it off the site entirely:
//    no page is written and it is left out of collections.blog.
//  · `series` is derived for the "Inception of Differential Privacy" posts
//    (their description reads "Blog #N in the series of …"), so the list can
//    group them and each post can link to its neighbours. A post can also
//    set `series: { id, name, part }` by hand.
const SERIES = {
  dp: { id: "dp", name: "Inception of Differential Privacy", match: /Inception of Differential Privacy/i }
};

module.exports = {
  layout: "blog-post.njk",
  eleventyComputed: {
    permalink: (data) => (data.draft ? false : data.permalink),
    series: (data) => {
      if (data.series && data.series.id) return data.series;
      const d = String(data.description || "");
      for (const s of Object.values(SERIES)) {
        if (s.match.test(d)) {
          const n = d.match(/#\s*(\d+)/);
          return { id: s.id, name: s.name, part: n ? Number(n[1]) : null };
        }
      }
      return null;
    },
    year: (data) => {
      const t = new Date((data.page && data.page.date) || data.date);
      return isNaN(t) ? "Undated" : t.getUTCFullYear();
    }
  }
};
