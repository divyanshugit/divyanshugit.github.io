// All banner plates, by slug. Used by the `banner` shortcode (.eleventy.js)
// and by scripts/og-images.js. A new banner is one file in this folder;
// it is picked up here automatically.
const fs = require("fs");
const path = require("path");
delete require.cache[require.resolve("./_lib.js")];
const lib = require("./_lib.js");

const banners = {};
for (const f of fs.readdirSync(__dirname)) {
  if (!f.endsWith(".js") || f.startsWith("_") || f === "index.js") continue;
  const file = path.join(__dirname, f);
  delete require.cache[file];                    // fresh on every rebuild in --serve
  const mod = require(file);
  if (mod.slug !== path.basename(f, ".js")) throw new Error(`[banners] ${f}: slug "${mod.slug}" must match the file name`);
  banners[mod.slug] = mod;
}

module.exports = { banners, render: lib.render, lib };
