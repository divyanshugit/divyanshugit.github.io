// ============================================================================
// Social previews (Open Graph / Twitter cards), 1200 × 630 PNG.
//
//   src/_includes/banners/<slug>.js   (the post's banner plate)
//        │  rendered in the Day proof palette, secondary labels dropped
//        │  + the post title in Instrument Serif, labels in Source Sans 3, a madder rule
//        │  every <text> is OUTLINED to paths with opentype.js, from the OFL
//        │  fonts in scripts/og/fonts/ — sharp's librsvg ignores @font-face and,
//        │  on macOS, fontconfig too, and would silently fall back to Helvetica
//        ▼  sharp: SVG → PNG
//   src/assets/og/<slug>.png   (committed; copied to /assets/og/ by the build)
//   src/assets/og/site.png     (the card for every page without a banner)
//
// Run:  npm run og            (only rewrites cards whose inputs changed)
//       npm run og -- --force (rewrites all)
// Pre-generated rather than built on every eleventy run: CI needs no fonts,
// the build stays fast, and --serve never loops on files it wrote into src/.
// ============================================================================
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const matter = require("gray-matter");
const opentype = require("opentype.js");
let sharp;
try { sharp = require(require.resolve("sharp", { paths: [path.dirname(require.resolve("@11ty/eleventy-img"))] })); }
catch (e) { sharp = require("sharp"); }

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "src/assets/og");
const FONTS = path.join(__dirname, "og/fonts");
const { banners, render, lib } = require(path.join(ROOT, "src/_includes/banners/index.js"));
const DMark = require(path.join(ROOT, "src/js/dmark.js"));
const site = require(path.join(ROOT, "src/_data/site.js"));
const P = lib.DAY;
const W = 1200, H = 630, M = 72;

// ---------- fonts ----------
const FACE = {
  serif: "InstrumentSerif-Regular.ttf", italic: "InstrumentSerif-Italic.ttf",
  sc: "SourceSans3-SemiBold.ttf", sans: "SourceSans3-Regular.ttf", mono: "IBMPlexMono-Regular.ttf"
};
const font = {};
for (const [k, f] of Object.entries(FACE)) font[k] = opentype.loadSync(path.join(FONTS, f));
const OPTS = { kerning: true, features: { liga: true, rlig: true } };

// width of a run, with letter-spacing (em)
function measure(face, str, size, ls = 0) {
  return font[face].getAdvanceWidth(str, size, OPTS) + ls * size * Math.max(0, [...str].length - 1);
}
// a run of text as one <path>; anchor start | middle | end.
// · Instrument Serif has no Greek, primes or maths signs (ε, σ, Σ, ′, ≥): those glyphs fall back,
//   one by one, to Source Sans 3 — slanted 12° when they stand in an italic run —
//   as the browser falls back per glyph on the page.
// · opentype.js does not position combining marks (q̂, ŵ, g̃), so a base letter followed
//   by one gets the spacing form of the accent centred over it.
const SPACING = { "\u0302": "\u02C6", "\u0303": "\u02DC", "\u0304": "\u00AF", "\u0301": "\u00B4" };
const has = (face, ch) => font[face].charToGlyphIndex(ch) > 0;
const faceFor = (face, ch) => [face, "sans", "mono"].find((f) => has(f, ch)) || face;
function glyphPath(face, ch, x, y, size, slant) {
  const path = font[face].getPath(ch, x, y, size, OPTS);
  if (slant) path.commands.forEach((c) => { ["", "1", "2"].forEach((k) => { if (c["x" + k] !== undefined) c["x" + k] += (y - c["y" + k]) * slant; }); });
  return path.toPathData(2);
}
function runWidth(face, str, size, ls) {
  const chars = [...str.replace(/[\u0300-\u036f]/g, "")];
  return chars.reduce((w, ch) => w + font[faceFor(face, ch)].getAdvanceWidth(ch, size, OPTS), 0) + ls * size * Math.max(0, chars.length - 1);
}
function outline(face, str, x, y, size, fill, { ls = 0, anchor = "start" } = {}) {
  const simple = !ls && !/[\u0300-\u036f]/.test(str) && [...str].every((ch) => has(face, ch));
  const w = simple ? measure(face, str, size, 0) : runWidth(face, str, size, ls);
  let x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  if (simple) return `<path d="${font[face].getPath(str, x0, y, size, OPTS).toPathData(2)}" fill="${fill}"/>`;
  let d = "";
  const chars = [...str];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i], f = faceFor(face, ch), slant = face === "italic" && f !== "italic" ? 0.21 : 0;
    const adv = font[f].getAdvanceWidth(ch, size, OPTS);
    d += glyphPath(f, ch, x0, y, size, slant);
    const mk = chars[i + 1] && SPACING[chars[i + 1]];
    if (mk) {
      const mf = faceFor(face, mk), ma = font[mf].getAdvanceWidth(mk, size, OPTS), sl = face === "italic" ? size * 0.08 : 0;
      d += glyphPath(mf, mk, x0 + (adv - ma) / 2 + sl, y - size * 0.12, size, 0);
      i++;
    }
    x0 += adv + ls * size;
  }
  return `<path d="${d}" fill="${fill}"/>`;
}
const unesc = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

// ---------- a banner, ready for librsvg ----------
function bannerSvg(mod) {
  let svg = render(mod, { palette: "day", id: "og-" + mod.slug });
  // secondary labels (.x) are for readers of the page; the card stays quiet
  svg = svg.replace(/<(text|line|path|circle|rect)\b[^>]*class="[^"]*\bx\b[^"]*"[^>]*?(\/>|>[\s\S]*?<\/\1>)/g, "");
  // text → outlines, using the same styles as the page
  svg = svg.replace(/<text x="([\d.-]+)" y="([\d.-]+)" class="([^"]+)"(?: text-anchor="(\w+)")?>([\s\S]*?)<\/text>/g, (m, x, y, cls, anchor, body) => {
    const names = cls.split(/\s+/), st = lib.TEXT[names[0]];
    if (!st) return "";
    const size = st.ph * (names.includes("sup") ? 0.74 : 1);          // the phone sizes: same layout, checked at 390px
    let str = unesc(body);
    if (st.font === "sc") str = str.toUpperCase();                       // labels: uppercase, tracked
    return outline(st.font, str, +x, +y, size, P[st.fill], { ls: st.ls, anchor: anchor || "start" });
  });
  svg = svg.replace(/<title[\s\S]*?<\/desc>/, "").replace(/\.bn__svg\{display:block;width:100%;height:auto;overflow:visible\}/, "");
  return svg;
}

// ---------- title wrapping ----------
function wrap(face, str, size, maxW) {
  const words = str.split(/\s+/), lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? cur + " " + w : w;
    if (cur && measure(face, next, size) > maxW) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}
// the largest size (in steps) at which the title fits in maxLines
function fit(face, str, maxW, sizes, maxLines) {
  for (const s of sizes) { const l = wrap(face, str, s, maxW); if (l.length <= maxLines) return { size: s, lines: l }; }
  const s = sizes[sizes.length - 1]; return { size: s, lines: wrap(face, str, s, maxW) };
}
const cleanTitle = (t) => String(t || "").replace(/^[\p{Extended_Pictographic}️\s]+/u, "").replace(/\s*\[[^\]]*\]\s*$/, "").trim();

// ---------- cards ----------
function frame(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
    + `<rect width="${W}" height="${H}" fill="${P.paper}"/>`
    // a hairline mount, as the plates on the site
    + `<rect x="24.5" y="24.5" width="${W - 49}" height="${H - 49}" fill="none" stroke="${P.rule}" stroke-width="1"/>`
    + inner + `</svg>`;
}
function masthead(right) {
  return outline("sc", site.name.toUpperCase(), M, 92, 20, P.text2, { ls: 0.12 })
    + (right ? outline("sc", right.toUpperCase(), W - M, 92, 16, P.text3, { ls: 0.12, anchor: "end" }) : "")
    + `<rect x="${M}" y="114" width="44" height="2" fill="${P.ink}"/>`;
}

// the mark (DESIGN.md "Mark"): variant b, the static release at ε = 0.5, pixel-cut at S.
// Placed by its ink box: right edge at `right`, bottom on `base`.
function mark(S, right, base) {
  const body = DMark.render({ S, variant: "b", eps: 0.5 });
  let x0 = S, x1 = 0, y1 = 0;
  body.replace(/x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g, (m, x, y, w, h) => {
    x0 = Math.min(x0, +x); x1 = Math.max(x1, +x + +w); y1 = Math.max(y1, +y + +h);
  });
  const fills = body.replace(/class="mi"/g, `fill="${P.text}"`).replace(/class="ma"/g, `fill="${P.ink}"`);
  return `<svg x="${right - x1}" y="${base - y1}" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" shape-rendering="crispEdges">${fills}</svg>`;
}

function postCard(post, mod) {
  const title = cleanTitle(post.title);
  const [h1, dek] = title.includes(": ") ? [title.slice(0, title.indexOf(": ")), title.slice(title.indexOf(": ") + 2)] : [title, ""];
  const TW = 452;                                             // text column
  const t = fit("serif", h1, TW, [72, 66, 60, 56, 52, 48], dek ? 3 : 4);
  const lh = Math.round(t.size * 1.04);
  let y = 150 + t.size;
  let text = "";
  t.lines.forEach((l) => { text += outline("serif", l, M, y, t.size, P.text); y += lh; });
  if (dek) {
    const d = fit("italic", dek, TW, [34, 31, 28, 26], 3);
    y += 6;
    d.lines.forEach((l) => { text += outline("italic", l, M, y, d.size, P.text2); y += Math.round(d.size * 1.28); });
  }
  const eyebrow = post.series ? "blog · " + post.series : "blog · " + ((post.tags || [])[0] || "writing");
  // the plate: 2.2 : 1, right of the text, between hairlines, with its label
  const BX = 574, BW = W - M + 16 - BX, BH = BW / 2.2, BY = Math.round((H - BH) / 2) + 26;
  const inner = bannerSvg(mod).replace(/^<svg class="bn__svg" viewBox="0 0 1100 500"/, `<svg class="bn__svg" x="${BX}" y="${BY}" width="${BW}" height="${BH}" viewBox="0 0 1100 500"`);
  const plate = `<line x1="${BX}" y1="${BY - 18}" x2="${BX + BW}" y2="${BY - 18}" stroke="${P.rule}"/>`
    + inner
    + `<line x1="${BX}" y1="${BY + BH + 14}" x2="${BX + BW}" y2="${BY + BH + 14}" stroke="${P.rule}"/>`
    + outline("sc", "FRONTISPIECE", BX, BY + BH + 44, 14, P.ink, { ls: 0.14 });
  const foot = outline("sans", site.domain, M, H - M + 8, 22, P.text3) + mark(48, W - M, H - M + 8);
  return frame(masthead(eyebrow) + text + plate + foot);
}

function siteCard() {
  let s = masthead("");
  s += outline("serif", site.name, M, 300, 116, P.text);
  s += outline("italic", `${site.role}, ${site.org}.`, M, 364, 40, P.text2);
  s += outline("italic", "Making AI systems efficient, secure and private.", M, 416, 40, P.text2);
  s += outline("sans", site.domain, M, H - M + 8, 22, P.text3);
  // the mark in the corner, where the ε used to be
  s += mark(56, W - M, H - M + 8);
  return frame(s);
}

// ---------- run ----------
const hash = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 12);
async function write(name, svg, force) {
  const png = path.join(OUT, name + ".png"), stamp = path.join(OUT, ".hashes.json");
  let hashes = {}; try { hashes = JSON.parse(fs.readFileSync(stamp, "utf8")); } catch (e) {}
  const h = hash(svg);
  if (!force && hashes[name] === h && fs.existsSync(png)) return false;
  await sharp(Buffer.from(svg), { density: 72 }).png({ compressionLevel: 9, palette: false }).toFile(png);
  hashes[name] = h;
  fs.writeFileSync(stamp, JSON.stringify(hashes, null, 2) + "\n");
  return true;
}

async function run({ force = false } = {}) {
  fs.mkdirSync(OUT, { recursive: true });
  const dir = path.join(ROOT, "src/blog");
  let made = 0;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md"))) {
    const { data } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
    if (!data.banner || data.draft) continue;
    const mod = banners[data.banner];
    if (!mod) { console.warn(`[og] ${f}: no banner "${data.banner}"`); continue; }
    const series = /Inception of Differential Privacy/i.test(data.description || "") ? "Inception of Differential Privacy" : "";
    const svg = postCard({ title: data.title, tags: data.tags, series }, mod);
    if (await write(data.banner, svg, force)) { made++; console.log(`[og] ${path.relative(ROOT, path.join(OUT, data.banner + ".png"))}`); }
  }
  if (await write("site", siteCard(), force)) { made++; console.log(`[og] ${path.relative(ROOT, path.join(OUT, "site.png"))}`); }
  if (!made) console.log("[og] all cards up to date");
}

module.exports = run;
if (require.main === module) run({ force: process.argv.includes("--force") }).catch((e) => { console.error(e); process.exit(1); });
