#!/usr/bin/env node
// ============================================================================
// Knowledge base for POST /api/ask (api/ask.mjs), built after Eleventy.
//
// Reads  <site>/search-index.json (written by src/search-index.11ty.js)
//        data/attack-bank/*.jsonl  (server-only attack prompts + benign anchors)
//        models/potion-base-8M/    (vendored, pinned; see scripts/fetch-model.js)
// Writes api/_kb/kb.json           index entries + attack families + model id
//        api/_kb/index.f32         one L2-normalised vector per index entry
//        api/_kb/attacks.f32       one per attack prompt
//        api/_kb/benign.f32        one per benign anchor
//
// The SAME model embeds the queries at runtime, so the two always agree; the
// function refuses to start if kb.json names a different model revision.
// api/_kb/ ships inside the function bundle only; nothing here is copied to
// the public site.
//
//   node scripts/build-embeddings.js [--site=_site] [--out=api/_kb]
// ============================================================================
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const m2v = require("../api/_lib/model2vec.js");

const ROOT = path.join(__dirname, "..");
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const SITE = path.resolve(ROOT, arg("site", process.env.ELEVENTY_OUTPUT || "_site"));
const OUT = path.resolve(ROOT, arg("out", "api/_kb"));
const BANK = path.join(ROOT, "data", "attack-bank");
const MODEL = path.join(ROOT, "models", "potion-base-8M");

const FAMILIES = Object.keys(require("../src/js/probe-core.js").FAMILIES);
const readJsonl = (f) => fs.readFileSync(f, "utf8").split("\n").map((l) => l.trim()).filter(Boolean).map((l, i) => {
  try { return JSON.parse(l); } catch (e) { throw new Error(`${path.basename(f)}:${i + 1}: ${e.message}`); }
});
// what gets embedded for an index entry: the quote plus a little of its keywords
const docText = (e) => `${e.t} ${String(e.k || "").slice(0, 300)}`.trim();

function main() {
  const t0 = Date.now();
  const idxFile = path.join(SITE, "search-index.json");
  if (!fs.existsSync(idxFile)) throw new Error(`${idxFile} not found; run Eleventy first (or pass --site=<output dir>)`);
  const index = JSON.parse(fs.readFileSync(idxFile, "utf8"));

  const attacks = [], benign = [];
  for (const f of fs.readdirSync(BANK).filter((f) => f.endsWith(".jsonl")).sort()) {
    const rows = readJsonl(path.join(BANK, f));
    if (f === "benign.jsonl") { rows.forEach((r) => benign.push({ t: r.t })); continue; }
    rows.forEach((r, i) => {
      if (!FAMILIES.includes(r.f)) throw new Error(`${f}:${i + 1}: unknown family "${r.f}" (one of ${FAMILIES.join(", ")})`);
      attacks.push({ f: r.f, t: r.t, src: r.src || f.replace(/\.jsonl$/, "") });
    });
  }
  // the eval must stay held out
  try {
    const cases = require("../eval/cases.js");
    const low = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();
    const caseSet = new Set(cases.map((c) => low(c.q)));
    const dup = attacks.concat(benign).filter((a) => caseSet.has(low(a.t)));
    if (dup.length) console.warn(`[kb] ${dup.length} bank line(s) identical to eval cases (eval no longer held out): ${dup.map((d) => JSON.stringify(d.t)).join(", ")}`);
  } catch (e) { /* eval/ is optional in production builds */ }

  const model = m2v.loadVendored(MODEL);
  const pack = (texts) => {
    const buf = new Float32Array(texts.length * model.dim);
    texts.forEach((t, i) => buf.set(t ? model.embed(t) : new Float32Array(model.dim), i * model.dim));
    return Buffer.from(buf.buffer);
  };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "index.f32"), pack(index.map((e) => (e.g === "profile" ? "" : docText(e)))));
  fs.writeFileSync(path.join(OUT, "attacks.f32"), pack(attacks.map((a) => a.t)));
  fs.writeFileSync(path.join(OUT, "benign.f32"), pack(benign.map((a) => a.t)));

  const kb = {
    v: 1,
    model: { name: model.meta.name, revision: model.meta.revision, dim: model.dim },
    // a content hash, not a timestamp, so identical inputs give identical output
    hash: crypto.createHash("sha256").update(JSON.stringify([index, attacks, benign, model.meta.sha256])).digest("hex").slice(0, 16),
    index,
    attacks: attacks.map((a) => ({ f: a.f, t: a.t, src: a.src })),
    benign: benign.length
  };
  fs.writeFileSync(path.join(OUT, "kb.json"), JSON.stringify(kb));
  const size = fs.readdirSync(OUT).reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
  const fams = attacks.reduce((o, a) => ((o[a.f] = (o[a.f] || 0) + 1), o), {});
  console.log(`[kb] ${index.length} index entries, ${attacks.length} attack prompts (${Object.keys(fams).length} families), ${benign.length} benign anchors → ${path.relative(ROOT, OUT)}/ (${(size / 1024).toFixed(0)} KB, hash ${kb.hash}) in ${Date.now() - t0} ms`);
}
try { main(); } catch (e) { console.error(`[kb] ${e.message}`); process.exit(1); }
