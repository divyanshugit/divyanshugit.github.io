// Site-wide facts used by the masthead, colophon and homepage.
// Edit here, not in templates.
module.exports = {
  name: "Divyanshu Kumar",
  domain: "dvynsh.org",
  url: "https://dvynsh.org",
  role: "AI Research Engineer",
  org: "Anaconda",
  orgUrl: "https://www.anaconda.com/",
  email: "kumardivy1999@gmail.com",
  emailDisplay: "kumardivy1999 [at] gmail.com",
  // Shown obfuscated; site.js assembles the mailto only when someone interacts.
  emailObf: "kumardivy1999 [at] gmail [dot] com",
  // Contact row (partials/links.njk). `icon` picks the glyph; `label` is the tooltip + aria-label.
  links: [
    { icon: "email", text: "Email", label: "Email" },
    { icon: "scholar", text: "Scholar", label: "Google Scholar", url: "https://scholar.google.com/citations?user=KdLbMkYAAAAJ&hl=en" },
    { icon: "github", text: "GitHub", label: "GitHub", url: "https://github.com/divyanshugit" },
    { icon: "linkedin", text: "LinkedIn", label: "LinkedIn", url: "https://www.linkedin.com/in/divyanshuusingh/" },
    { icon: "x", text: "X", label: "X (Twitter)", url: "https://x.com/divyanshutwt" },
    { icon: "cv", text: "CV", label: "CV (PDF)", url: "/assets/cv.pdf" }
  ],
  nav: [
    { text: "Home", url: "/index.html", match: "/" },
    { text: "Publications", url: "/publications.html", match: "/publications" },
    { text: "Projects", url: "/projects.html", match: "/projects" },
    { text: "Blog", url: "/blog.html", match: "/blog" },
    { text: "Timeline", url: "/timeline.html", match: "/timeline" },
    { text: "About", url: "/about.html", match: "/about" }
  ],

  // "revised" date on the title page = build date
  revised: new Date()
};
