// ============================================================================
// The server-side guardrail behind POST /api/ask. Pure (no HTTP), so the
// function, the local dev server and the eval harness all call the same code.
//
//   1. normalize   probe-core: tags/zero-width/NFKC/homoglyphs, base64/hex/rot13/
//                  leet/spacing decoding, split-payload joining
//   2. rules       probe-core: the regex families (shared with the browser)
//   3. embed       Model2Vec potion-base-8M, loaded once per instance
//   4. attack kNN  cosine vs the private attack bank, with benign anchors as a
//                  counterweight: refuse when s_attack ≥ τ and s_attack − s_benign ≥ δ
//   5. retrieval   BM25 + cosine over the site index, reciprocal-rank fusion,
//                  fed into probe-core's grounding as a bonus
//   6. compose     probe-core: intents, multi-question split, quotes + sources
//   7. output check  canary, PII and bank leakage; a failing reply is withheld
// ============================================================================
"use strict";
const fs = require("fs");
const path = require("path");
const core = require("../../src/js/probe-core.js");
const m2v = require("./model2vec.js");
const { SYSTEM_PROMPT, canaryValue } = require("./canary.js");

// Operating point, tuned on eval/ (npm run eval -- --sweep). See docs/guardrail.md.
const DEFAULTS = { tau: 0.48, delta: 0.12, semMin: 0.42, rrfK: 60, fuseTop: 8, boost: 3 };
const MAX_Q = 600;

function readF32(file, dim) {
  const b = fs.readFileSync(file);
  const a = new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  const rows = a.length / dim, out = new Array(rows);
  for (let r = 0; r < rows; r++) out[r] = a.subarray(r * dim, (r + 1) * dim);
  return out;
}
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const round = (x, n = 3) => (x == null || !isFinite(x) ? null : Math.round(x * 10 ** n) / 10 ** n);

// ---- BM25 over the index (k1 1.2, b .75), built once
function bm25Index(docs) {
  const N = docs.length, df = new Map(), lens = docs.map((d) => d.length);
  const avg = lens.reduce((a, b) => a + b, 0) / (N || 1);
  const tfs = docs.map((d) => { const m = new Map(); d.forEach((w) => m.set(w, (m.get(w) || 0) + 1)); m.forEach((_, w) => df.set(w, (df.get(w) || 0) + 1)); return m; });
  return function score(qw) {
    return tfs.map((tf, i) => {
      let s = 0;
      for (const w of new Set(qw)) {
        const f = tf.get(w); if (!f) continue;
        const idf = Math.log(1 + (N - df.get(w) + 0.5) / (df.get(w) + 0.5));
        s += idf * (f * 2.2) / (f + 1.2 * (1 - 0.75 + 0.75 * lens[i] / avg));
      }
      return s;
    });
  };
}

function createGuardrail(opts = {}) {
  const t0 = performance.now();
  const kbDir = opts.kbDir || path.join(__dirname, "..", "_kb");
  const modelDir = opts.modelDir || path.join(__dirname, "..", "..", "models", "potion-base-8M");
  const cfg = Object.assign({}, DEFAULTS, opts.config || {});
  if (process.env.GUARDRAIL_TAU) cfg.tau = +process.env.GUARDRAIL_TAU;
  if (process.env.GUARDRAIL_DELTA) cfg.delta = +process.env.GUARDRAIL_DELTA;

  const model = m2v.loadVendored(modelDir);
  const kb = JSON.parse(fs.readFileSync(path.join(kbDir, "kb.json"), "utf8"));
  if (kb.model.revision !== model.meta.revision || kb.model.dim !== model.dim) {
    throw new Error(`kb built with ${kb.model.name}@${kb.model.revision}, runtime model is ${model.meta.name}@${model.meta.revision}; rebuild with scripts/build-embeddings.js`);
  }
  const index = core.prepareIndex(kb.index);
  const IV = readF32(path.join(kbDir, "index.f32"), model.dim);
  const AV = readF32(path.join(kbDir, "attacks.f32"), model.dim);
  const NV = readF32(path.join(kbDir, "benign.f32"), model.dim);
  const bm25 = bm25Index(index.map((e) => (e.g === "profile" ? [] : e.tw.concat(e.kw || []))));
  const canary = canaryValue();
  const secrets = [canary, Buffer.from(canary).toString("base64"), ...SYSTEM_PROMPT.split("\n").map((l) => l.trim()).filter((l) => l.length >= 24)];
  const bankTexts = kb.attacks.map((a) => a.t.toLowerCase()).filter((t) => t.length >= 25);
  const loadMs = performance.now() - t0;

  // ---- 4. attack kNN
  function knn(text) {
    const v = model.embed(text);
    let sa = -1, ia = -1, sb = -1;
    for (let i = 0; i < AV.length; i++) { const s = dot(v, AV[i]); if (s > sa) { sa = s; ia = i; } }
    for (let i = 0; i < NV.length; i++) { const s = dot(v, NV[i]); if (s > sb) sb = s; }
    return { text, v, sa, sb, margin: sa - sb, family: ia >= 0 ? kb.attacks[ia].f : null };
  }
  const fires = (k) => k.sa >= cfg.tau && k.margin >= cfg.delta;

  // ---- 5. hybrid retrieval for one sub-question → a boost function for probe-core.ground
  function retrieval(sub, v) {
    const qv = v || model.embed(sub);
    const cos = IV.map((x) => dot(qv, x));
    const bm = bm25(core.words(sub));
    const rank = (arr) => { const o = arr.map((s, i) => [s, i]).filter(([s, i]) => s > 0 && index[i].g !== "profile").sort((a, b) => b[0] - a[0]); const r = new Map(); o.forEach(([, i], k) => r.set(i, k + 1)); return r; };
    const rc = rank(cos), rb = rank(bm);
    const fused = new Map();
    index.forEach((e, i) => {
      if (e.g === "profile") return;
      let f = 0;
      if (rc.has(i) && cos[i] >= cfg.semMin) f += 1 / (cfg.rrfK + rc.get(i));
      if (rb.has(i)) f += 1 / (cfg.rrfK + rb.get(i));
      if (f) fused.set(i, f);
    });
    const top = [...fused.entries()].sort((a, b) => b[1] - a[1]).slice(0, cfg.fuseTop);
    const max = top.length ? top[0][1] : 1, keep = new Map(top);
    return {
      // BM25 only reorders; a bonus (and a "hit") needs real semantic similarity
      boost: (e) => (keep.has(e.i) && cos[e.i] >= cfg.semMin ? { bonus: cfg.boost * keep.get(e.i) / max, hit: true } : null),
      top: top.slice(0, 3).map(([i, f]) => ({ u: index[i].u.split(":~:")[0], g: index[i].g, rrf: round(f, 4), cos: round(cos[i]), bm25: round(bm[i], 2) }))
    };
  }

  // ---- 7. output check
  function outputCheck(result) {
    const reasons = [];
    const all = JSON.stringify(result).toLowerCase();
    if (secrets.some((s) => all.includes(s.toLowerCase()))) reasons.push("canary");
    const answers = (result.parts || []).map((p) => (p.answer || "") + " " + JSON.stringify(p.sources || [])).join(" ");
    if (/[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z.]{2,}/i.test(answers)) reasons.push("pii:email");
    // a phone number: 10–15 digits in one run of digits, spaces, dots, dashes and brackets
    const text = answers.replace(/<[^>]+>/g, " ");
    if ((text.match(/\+?\(?\d[\d\s().-]{8,20}\d/g) || []).some((m) => { const d = m.replace(/\D/g, "").length; return d >= 10 && d <= 15 && !/^\d{4}\s*[–-]\s*\d{4}$/.test(m.trim()); })) reasons.push("pii:phone");
    const low = answers.toLowerCase();
    if (bankTexts.some((t) => low.includes(t))) reasons.push("leak:attack-bank");
    return { ok: !reasons.length, reasons };
  }

  function ask(qIn) {
    const T = { start: performance.now() };
    const q = String(qIn == null ? "" : qIn).slice(0, MAX_Q * 4);
    const norm = core.normalize(q);
    T.normalize = performance.now();
    let out;
    const hit = norm.text.toLowerCase().includes(canary.toLowerCase())
      ? { kind: "attack", a: { id: "canary", fam: "System-prompt extraction (canary replay)", pol: "1.2", paper: "nfl", dry: "That string is a canary. It is only ever sent, never received." } }
      : core.rules(norm);
    T.rules = performance.now();

    // the semantic layer sees every reading, and each sub-question of each reading
    const texts = [...new Set([...norm.readings, ...norm.readings.flatMap((r) => core.splitQ(r))])].slice(0, 12);
    const ks = hit.kind === "hello" ? [] : texts.map(knn);
    T.embed = performance.now();
    const firing = ks.filter(fires).sort((a, b) => b.sa - a.sa);
    const nearest = firing[0] || ks.slice().sort((a, b) => b.margin - a.margin)[0];
    const attackOf = (k) => { const f = core.FAMILIES[k.family] || {}; return { family: k.family, fam: f.fam, pol: f.pol, paper: f.paper, score: round(k.sa), benign: round(k.sb), margin: round(k.margin), matchedOn: k.text !== norm.text ? k.text.slice(0, 200) : undefined }; };

    if (hit.kind === "attack") {
      out = Object.assign(core.refusalOf(hit), { via: firing.length ? "rules+knn" : "rules" });
      if (firing.length) out.attack = attackOf(firing[0]);
    } else if (firing.length) {
      out = { verdict: "refuse", parts: [], via: "knn", attack: attackOf(firing[0]) };
      if (norm.enc && !norm.enc.soft) out.enc = { how: norm.enc.how, text: String(norm.enc.text).slice(0, 200) };
    } else if (hit.kind === "hello") {
      out = { verdict: "hello", parts: [], via: "rules" };
    } else {
      const retrievals = [];
      const parts = core.splitQ(norm.text).map((sub) => {
        const k = ks.find((x) => x.text === sub);
        const r = retrieval(sub, k && k.v);
        retrievals.push({ q: sub, top: r.top });
        return core.answerParts(index, sub, { boost: r.boost })[0];
      }).filter(Boolean);
      out = { verdict: parts.some((p) => p.answer) ? "allow" : "decline", parts, via: "hybrid" };
      out.retrieval = retrievals;
    }
    T.compose = performance.now();

    const check = outputCheck(out);
    if (!check.ok) out = { verdict: "withheld", parts: [], via: out.via, withheld: check.reasons };
    T.end = performance.now();
    out.scores = {
      knn: nearest ? { attack: round(nearest.sa), benign: round(nearest.sb), margin: round(nearest.margin), family: nearest.family, tau: cfg.tau, delta: cfg.delta } : null,
      check: { ok: check.ok, reasons: check.reasons },
      normalized: norm.steps.length ? norm.steps : undefined,
      ms: { total: round(T.end - T.start, 2), normalize: round(T.normalize - T.start, 2), embed: round(T.embed - T.rules, 2), compose: round(T.compose - T.embed, 2) },
      model: `${model.meta.name}@${model.meta.revision.slice(0, 7)}`, kb: kb.hash
    };
    return out;
  }

  return { ask, knn, outputCheck, cfg, loadMs, info: { model: model.meta.name, revision: model.meta.revision, kb: kb.hash, index: index.length, attacks: AV.length, benign: NV.length }, MAX_Q };
}

module.exports = { createGuardrail, DEFAULTS, MAX_Q };
