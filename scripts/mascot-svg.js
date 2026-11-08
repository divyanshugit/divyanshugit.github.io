// The guide's drawings (src/assets/mascot/small/*.svg), made small for the web.
//  · optimize(svg): folds each path's translate() into its points, rounds them to
//    a 1/`q` grid of the art's own units (art is drawn at ~0.5x, so q=1 is about
//    a quarter of a CSS pixel at the sizes the site uses), and writes relative
//    commands. Drops the drawn ledge (the page rule replaces it).
//  · bundle(frames): one SVG per drawn sequence (hat, wave). Each frame is a
//    <g data-frame>; paths that several frames share are written once in <defs>
//    and referenced with <use>, which js/guide.js expands back into full frames.
const fs = require("fs");
const path = require("path");
const DIR = path.join(__dirname, "../src/assets/mascot/small");

const num = (v) => { const s = String(Math.round(v)); return s === "-0" ? "0" : s; };
function joinNums(a) {             // "12-3 4" style: a minus sign is its own separator
  let out = "";
  a.forEach((n, i) => { out += (i && !n.startsWith("-") ? " " : "") + n; });
  return out;
}
function optPath(d, tx, ty, q) {
  const toks = d.match(/[MCZmcz]|-?\d*\.?\d+(?:e-?\d+)?/g);
  let i = 0, cmd = "", cx = 0, cy = 0, sx = 0, sy = 0, out = "", last = "";
  const R = (v) => Math.round(v * q);
  while (i < toks.length) {
    const t = toks[i];
    if (/[A-Za-z]/.test(t)) { cmd = t; i++; if (cmd === "Z" || cmd === "z") { out += "z"; cx = sx; cy = sy; last = "z"; } continue; }
    if (cmd === "M") {
      const x = R(+toks[i] + tx), y = R(+toks[i + 1] + ty); i += 2;
      out += "M" + joinNums([num(x), num(y)]); cx = sx = x; cy = sy = y; last = "M"; cmd = "C";   // (implicit lineto never occurs here)
    } else if (cmd === "C") {
      const p = []; for (let k = 0; k < 6; k++) p.push(R(+toks[i + k] + (k % 2 ? ty : tx)));
      i += 6;
      const rel = [p[0] - cx, p[1] - cy, p[2] - cx, p[3] - cy, p[4] - cx, p[5] - cy].map(num);
      out += (last === "c" ? (rel[0].startsWith("-") ? "" : " ") : "c") + joinNums(rel);
      cx = p[4]; cy = p[5]; last = "c";
    } else i++;
  }
  return out;
}
function optimize(svg, q = 1) {
  return svg
    .replace(/<path id="ledge"[^>]*\/>/, "")
    .replace(/<path fill="([^"]+)"(?: transform="translate\(([-\d.e]+)[ ,]([-\d.e]+)\)")? d="([^"]+)"\/>/g,
      (m, fill, tx, ty, d) => {
        const s = q === 1 ? "" : ` transform="scale(${1 / q})"`;
        return `<path fill="${fill}"${s} d="${optPath(d, +(tx || 0), +(ty || 0), q)}"/>`;
      })
    .replace(/\n\s*/g, "");
}
const read = (p) => optimize(fs.readFileSync(path.join(DIR, p + ".svg"), "utf8"));
const inner = (svg) => svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
function bundle(frames) {
  const bodies = frames.map((f) => inner(read(f)));
  const count = new Map();
  bodies.forEach((b) => new Set(b.match(/<path [^>]*\/>/g)).forEach((p) => count.set(p, (count.get(p) || 0) + 1)));
  const shared = [...count].filter(([, n]) => n > 1).map(([p]) => p);
  const id = new Map(shared.map((p, i) => [p, "s" + i]));
  const defs = shared.map((p) => p.replace("<path ", `<path id="${id.get(p)}" `)).join("");
  const gs = frames.map((f, k) => `<g data-frame="${f}">` + bodies[k].replace(/<path [^>]*\/>/g, (p) => id.has(p) ? `<use href="#${id.get(p)}"/>` : p) + "</g>");
  const vb = JSON.parse(fs.readFileSync(path.join(DIR, "../meta.json"), "utf8")).viewBox.join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><defs>${defs}</defs>${gs.join("")}</svg>`;
}
module.exports = { optimize, read, bundle, DIR };
