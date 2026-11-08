// The project proposals under /proposal/ (not the agenda itself), for the
// guide's "another idea" suggestion at the end of each one. Proposals are
// excluded from collections, so they are read straight from their files.
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

module.exports = () => {
    const dir = path.join(__dirname, "..", "proposal");
    return fs.readdirSync(dir).filter(f => f.endsWith(".md") && f !== "index.md").sort()
        .map(f => matter(fs.readFileSync(path.join(dir, f), "utf8")).data)
        .filter(d => d.permalink)
        .map(d => ({ u: d.permalink, t: d.pageTitle || d.title, r: 1 }));
};
