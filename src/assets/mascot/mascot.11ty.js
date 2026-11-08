// The guide's drawings as the site serves them (js/guide.js fetches these):
//   /assets/mascot/small/<pose>.svg      one optimized drawing ("singles" in meta.json)
//   /assets/mascot/small/seq-<name>.svg  a drawn sequence's frames in one file ("bundles")
// Sources are src/assets/mascot/small/*.svg; scripts/mascot-svg.js does the work.
const fs = require("fs");
const path = require("path");
const SRC = path.join(__dirname, "../../../scripts/mascot-svg.js");

module.exports = class {
  data() {
    const meta = JSON.parse(fs.readFileSync(path.join(__dirname, "meta.json"), "utf8"));
    const files = [
      ...meta.singles.map((p) => ({ name: p, frames: null })),
      ...Object.entries(meta.bundles).map(([name, frames]) => ({ name: "seq-" + name, frames }))
    ];
    return {
      eleventyExcludeFromCollections: true,
      pagination: { data: "files", size: 1, alias: "file" },
      files,
      permalink: (d) => `/assets/mascot/small/${d.file.name}.svg`
    };
  }
  render({ file }) {
    delete require.cache[require.resolve(SRC)];
    const m = require(SRC);
    return file.frames ? m.bundle(file.frames) : m.read(file.name);
  }
};
