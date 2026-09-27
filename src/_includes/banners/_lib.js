// ============================================================================
// Banner plates: shared drawing kit (see DESIGN.md § 11).
//
// Every banner is a small scientific figure drawn from its post's subject,
// set in the site's ink-on-paper language. A banner module exports
//   { slug, title, desc, caption, draw(k) }  →  draw returns SVG children
// and this file wraps it into one <svg> that:
//   · in the browser, takes its colours from the page tokens (var(--ink) …),
//     so Day and Night proof apply instantly;
//   · for social previews (scripts/og-images.js), takes the Day proof hex
//     values instead, because librsvg does not resolve CSS custom properties.
//
// All geometry is computed here (densities, CDFs, quantizers, noise) — never
// eyeballed. The viewBox is 1100 × 500 (2.2 : 1).
// ============================================================================

const W = 1100, H = 500;

// ---------- palettes ----------
const TOKENS = {
  paper: "var(--paper)", paper2: "var(--paper-2)", text: "var(--text)", text2: "var(--text-2)", text3: "var(--text-3)",
  rule: "var(--rule)", rule2: "var(--rule-2)", ink: "var(--ink)", wash: "var(--ink-wash)",
  serif: "var(--serif)", sans: "var(--sans)", sc: "var(--sc)", mono: "var(--mono)"
};
const DAY = {
  paper: "#F5F1E8", paper2: "#EEE8DB", text: "#211D18", text2: "#574E44", text3: "#6E6558",
  rule: "rgba(33,29,24,.14)", rule2: "rgba(33,29,24,.32)", ink: "#8F3E2F", wash: "rgba(143,62,47,.09)",
  serif: "Instrument Serif", sans: "Source Sans 3", sc: "Source Sans 3", mono: "IBM Plex Mono"
};

// ---------- text styles (shared with the OG outliner) ----------
// font: which face; size in viewBox units; fill: palette key; ls: letter-spacing (em)
// ph: the size on phones (≤560px), where secondary labels (.x) are dropped;
// the social cards use the same, so they are laid out and checked once
const TEXT = {
  l:  { font: "sc",     size: 16, ph: 25, fill: "text3", ls: 0.1 },    // label: Source Sans 3 semibold, uppercase, tracked
  li: { font: "sc",     size: 16, ph: 25, fill: "ink",   ls: 0.1 },    // label, ink
  m:  { font: "italic", size: 30, ph: 42, fill: "text2", ls: 0 },      // maths / names: Instrument Serif italic
  mi: { font: "italic", size: 30, ph: 42, fill: "ink",   ls: 0 },
  r:  { font: "serif",  size: 26, ph: 36, fill: "text2", ls: 0 },      // roman text
  n:  { font: "sans",   size: 18, ph: 28, fill: "text3", ls: 0 },      // numbers, names: Source Sans 3
  ni: { font: "sans",   size: 18, ph: 28, fill: "ink",   ls: 0 },
  nl: { font: "sans",   size: 21, ph: 28, fill: "text2", ls: 0 },      // names beside a mark (larger than numbers)
  c:  { font: "mono",   size: 17, ph: 27, fill: "text2", ls: 0 },      // code
  ci: { font: "mono",   size: 17, ph: 27, fill: "ink",   ls: 0 }
};
const FAMILY = { sc: "sc", italic: "serif", serif: "serif", sans: "sans", mono: "mono" };

function style(P, { responsive = true } = {}) {
  const f = (k) => (P === TOKENS ? P[k] : `"${P[k]}"`);
  let css = `
.bn__svg{display:block;width:100%;height:auto;overflow:visible}
.bn__svg *{vector-effect:non-scaling-stroke}
.bn__svg .h,.bn__svg .hf,.bn__svg .s2,.bn__svg .s3,.bn__svg .ik,.bn__svg .ikt{fill:none;stroke-linejoin:round;stroke-linecap:round}
.bn__svg .h{stroke:${P.rule2};stroke-width:1}
.bn__svg .hf{stroke:${P.rule};stroke-width:1}
.bn__svg .s2{stroke:${P.text2};stroke-width:1.1}
.bn__svg .s3{stroke:${P.text3};stroke-width:1}
.bn__svg .ik{stroke:${P.ink};stroke-width:1.7}
.bn__svg .ikt{stroke:${P.ink};stroke-width:1.1}
.bn__svg .d{stroke-dasharray:4 3}
.bn__svg .dt{stroke-dasharray:1 3}
.bn__svg .w{fill:${P.wash};stroke:none}
.bn__svg .fp{fill:${P.paper}}
.bn__svg .fp2{fill:${P.paper2}}
.bn__svg .fi{fill:${P.ink};stroke:none}
.bn__svg .f2{fill:${P.text2};stroke:none}
.bn__svg .f3{fill:${P.text3};stroke:none}
.bn__svg .fr{fill:${P.rule2};stroke:none}
.bn__svg .ffr{fill:${P.rule};stroke:none}
.bn__svg text{stroke:none;font-variant-numeric:lining-nums}
`;
  for (const [cls, s] of Object.entries(TEXT)) {
    css += `.bn__svg .${cls}{font-family:${f(FAMILY[s.font])};font-size:${s.size}px;fill:${P[s.fill]};letter-spacing:${s.ls}em${s.font === "italic" ? ";font-style:italic" : ""}${s.font === "sc" ? ";text-transform:uppercase;font-weight:600" : ""}}\n`;
  }
  // exponents and indices: an explicit size per class (em would resolve against the svg's own 16px)
  for (const [cls, st] of Object.entries(TEXT)) css += `.bn__svg .${cls}.sup{font-size:${Math.round(st.size * 0.74)}px}\n`;
  if (responsive) {
    // phones: fewer, larger labels (secondary ones carry .x)
    css += `
@media (max-width:560px){
.bn__svg .x{display:none}
${Object.entries(TEXT).map(([c, v]) => `.bn__svg .${c}{font-size:${v.ph}px}\n.bn__svg .${c}.sup{font-size:${Math.round(v.ph * 0.74)}px}`).join("\n")}
}
@media (prefers-reduced-motion:no-preference){
.bn__svg .reveal{animation:bn-reveal 1.8s cubic-bezier(.22,.61,.36,1) .25s both}
@keyframes bn-reveal{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
}`;
  }
  return css.replace(/\n+/g, "\n");
}

// ---------- geometry helpers ----------
const r1 = (v) => Math.round(v * 10) / 10;
// map a data domain to a pixel range
function scale(d0, d1, p0, p1) { const s = (v) => p0 + (v - d0) * (p1 - p0) / (d1 - d0); s.inv = (p) => d0 + (p - p0) * (d1 - d0) / (p1 - p0); return s; }
// polyline "M x,y L …" from points
function line(pts) { return pts.map((p, i) => (i ? "L" : "M") + r1(p[0]) + "," + r1(p[1])).join(" "); }
// sample f on [a,b] (n steps, plus any exact points such as a peak)
function sample(f, a, b, n = 240, extra = []) {
  const xs = []; for (let i = 0; i <= n; i++) xs.push(a + (b - a) * i / n);
  extra.forEach((e) => { if (e > a && e < b) xs.push(e); });
  xs.sort((p, q) => p - q);
  return xs.map((x) => [x, f(x)]);
}
const laplace = (mu, b) => (x) => Math.exp(-Math.abs(x - mu) / b) / (2 * b);
const laplaceCdf = (mu, b) => (x) => (x < mu ? 0.5 * Math.exp((x - mu) / b) : 1 - 0.5 * Math.exp(-(x - mu) / b));
const normal = (mu, s) => (x) => Math.exp(-0.5 * ((x - mu) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
// a small seeded generator, so every build draws the same "random" figure
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(rand) { const u = Math.max(1e-12, rand()), v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// one text element; anchor: start | middle | end
function t(x, y, str, cls = "l", anchor) {
  // labels are set uppercase: a Greek letter there would turn into a capital (ε → Ε)
  if (/^li?\b/.test(cls) && /[\u0370-\u03ff]/.test(str)) throw new Error(`[banners] Greek in an uppercase label: "${str}" — use class m or n`);
  return `<text x="${r1(x)}" y="${r1(y)}" class="${cls}"${anchor && anchor !== "start" ? ` text-anchor="${anchor}"` : ""}>${esc(str)}</text>`;
}
const p = (d, cls, extra = "") => `<path d="${d}" class="${cls}"${extra ? " " + extra : ""}/>`;
const ln = (x1, y1, x2, y2, cls = "h") => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" class="${cls}"/>`;
const circ = (cx, cy, r, cls = "h") => `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" class="${cls}"/>`;
const rect = (x, y, w, h, cls = "h", rx = 0) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}"${rx ? ` rx="${rx}"` : ""} class="${cls}"/>`;
// a small open arrowhead at (x,y) pointing along angle a (radians)
function head(x, y, a, cls = "s2", L = 9, spread = 0.42) {
  const p1 = [x - L * Math.cos(a - spread), y - L * Math.sin(a - spread)], p2 = [x - L * Math.cos(a + spread), y - L * Math.sin(a + spread)];
  return p(line([p1, [x, y], p2]), cls);
}
// a base with a raised exponent (two plain text runs, so the OG outliner can set them too)
function sup(x, y, base, exp, cls = "m", anchor) {
  const size = (TEXT[cls.split(" ")[0]] || TEXT.m).size, bw = base.length * size * 0.46;
  const x0 = anchor === "end" ? x - bw - exp.length * size * 0.36 : x;
  const extra = cls.split(" ").slice(1).join(" ");
  return t(x0, y, base, cls) + `<text x="${r1(x0 + bw)}" y="${r1(y - size * 0.42)}" class="${cls.split(" ")[0]} sup${extra ? " " + extra : ""}">${esc(exp)}</text>`;
}
// a base with a lowered index (ᵢ has no glyph in the site faces)
function sub(x, y, base, idx, cls = "m") {
  const size = (TEXT[cls.split(" ")[0]] || TEXT.m).size, bw = [...base.replace(/[\u0300-\u036f\s]/g, "")].length * size * 0.55 + (base.match(/\s/g) || []).length * size * 0.28;
  return t(x, y, base, cls) + `<text x="${r1(x + bw)}" y="${r1(y + size * 0.22)}" class="${cls.split(" ")[0]} sup">${esc(idx)}</text>`;
}
function arrow(x1, y1, x2, y2, cls = "s2") { return ln(x1, y1, x2, y2, cls) + head(x2, y2, Math.atan2(y2 - y1, x2 - x1), cls); }

// ---------- the svg ----------
function render(mod, { palette = "tokens", id } = {}) {
  const P = palette === "day" ? DAY : TOKENS;
  const uid = id || "bn-" + mod.slug;
  const k = { W, H, t, sup, sub, p, ln, circ, rect, head, arrow, line, sample, scale, laplace, laplaceCdf, normal, rng, gauss, r1, esc, uid };
  return `<svg class="bn__svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="${uid}-t ${uid}-d" focusable="false">`
    + `<title id="${uid}-t">${esc(mod.title)}</title><desc id="${uid}-d">${esc(mod.desc)}</desc>`
    + `<style>${style(P, { responsive: palette !== "day" })}</style>`
    + mod.draw(k)
    + `</svg>`;
}

module.exports = { W, H, TEXT, DAY, TOKENS, render, style };
