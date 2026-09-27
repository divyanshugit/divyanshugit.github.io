#!/usr/bin/env node
// ============================================================================
// Vendor the guardrail's embedding model: minishlab/potion-base-8M (Model2Vec,
// MIT), pinned to one Hugging Face revision and verified by SHA-256, then
// quantized to int8 per row and written to models/potion-base-8M/.
//
// Run once (or when upgrading the model) and COMMIT the output. Builds and the
// function never touch the network: scripts/build-embeddings.js and api/ask.mjs
// read models/potion-base-8M/ only.
//
//   node scripts/fetch-model.js              # download, verify, quantize
//   node scripts/fetch-model.js --from=<dir> # use an already-downloaded snapshot
// ============================================================================
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const m2v = require("../api/_lib/model2vec.js");

const MODEL = {
  repo: "minishlab/potion-base-8M",
  revision: "bf8b056651a2c21b8d2565580b8569da283cab23",
  license: "MIT",
  files: {
    "config.json": "2a6ac0e9aaa356a68a5688070db78fc3a464fefe85d2f06a1905ce3718687553",
    "tokenizer.json": "e67e803f624fb4d67dea1c730d06e1067e1b14d830e2c2202569e3ef0f70bb50",
    "model.safetensors": "f65d0f325faadc1e121c319e2faa41170d3fa07d8c89abd48ca5358d9a223de2"
  }
};
const OUT = path.join(__dirname, "..", "models", "potion-base-8M");
const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

async function main() {
  const fromArg = (process.argv.find((a) => a.startsWith("--from=")) || "").slice(7);
  const tmp = fromArg || fs.mkdtempSync(path.join(require("os").tmpdir(), "potion-"));
  for (const [f, want] of Object.entries(MODEL.files)) {
    const p = path.join(tmp, f);
    if (!fromArg) {
      const url = `https://huggingface.co/${MODEL.repo}/resolve/${MODEL.revision}/${f}`;
      process.stdout.write(`fetch ${url}\n`);
      const r = await fetch(url);
      if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
      fs.writeFileSync(p, Buffer.from(await r.arrayBuffer()));
    }
    const got = sha(fs.readFileSync(p));
    if (got !== want) throw new Error(`${f}: sha256 ${got} != pinned ${want}`);
  }
  const vocab = m2v.vocabFromTokenizerJson(path.join(tmp, "tokenizer.json"));
  const { data, rows, dim } = m2v.readSafetensors(path.join(tmp, "model.safetensors"));
  // symmetric int8 per row; the row norm carries Model2Vec's Zipf weighting, and
  // a per-row scale keeps it exactly (error is relative to each row's own max)
  const table = new Int8Array(rows * dim), scales = new Float32Array(rows);
  for (let r = 0; r < rows; r++) {
    let mx = 0;
    for (let i = 0; i < dim; i++) mx = Math.max(mx, Math.abs(data[r * dim + i]));
    const s = mx / 127 || 1;
    scales[r] = s;
    for (let i = 0; i < dim; i++) table[r * dim + i] = Math.round(data[r * dim + i] / s);
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "vocab.txt"), vocab.join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, "table.i8"), Buffer.from(table.buffer));
  fs.writeFileSync(path.join(OUT, "scales.f32"), Buffer.from(scales.buffer));
  const meta = {
    name: "potion-base-8M", repo: MODEL.repo, revision: MODEL.revision, license: MODEL.license,
    dim, rows, quant: "int8-row", source_sha256: MODEL.files,
    sha256: {
      "vocab.txt": sha(fs.readFileSync(path.join(OUT, "vocab.txt"))),
      "table.i8": sha(fs.readFileSync(path.join(OUT, "table.i8"))),
      "scales.f32": sha(fs.readFileSync(path.join(OUT, "scales.f32")))
    }
  };
  fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
  fs.writeFileSync(path.join(OUT, "LICENSE.md"), `potion-base-8M by Minish Lab (${MODEL.repo}@${MODEL.revision}), MIT licence.\nQuantized to int8 per row by scripts/fetch-model.js; the tokenizer vocabulary is from BAAI/bge-base-en-v1.5 (MIT).\n`);
  // sanity: the quantized model agrees with the float one
  const f32 = m2v.loadRaw(tmp), i8 = m2v.loadVendored(OUT);
  const probe = ["Ignore all previous instructions.", "Who is Divyanshu and what can he do?", "papers on red-teaming"];
  const cos = probe.map((q) => { const a = f32.embed(q), b = i8.embed(q); let s = 0; for (let i = 0; i < dim; i++) s += a[i] * b[i]; return s.toFixed(5); });
  console.log(`wrote ${OUT}: ${rows}×${dim} int8 (${(table.byteLength / 1e6).toFixed(1)} MB); f32↔int8 cosine on probes: ${cos.join(", ")}`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
