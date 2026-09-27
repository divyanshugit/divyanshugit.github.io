// ============================================================================
// Model2Vec static embeddings in plain JavaScript (no native code, no WASM).
//
// A Model2Vec model is a token-embedding table distilled from a sentence
// transformer: embedding(text) = normalize(mean(table[wordpiece(text)])).
// Inference is a tokenizer plus a few hundred multiply-adds, so a query embeds
// in well under a millisecond and "loading the model" is reading one file.
//
// Two on-disk formats:
//   - vendored (what the function ships): models/<name>/
//       meta.json     { name, revision, dim, rows, sha256: {…}, quant: "int8-row" }
//       vocab.txt     one WordPiece token per line, id = line number
//       table.i8      rows × dim int8, row-major
//       scales.f32    rows float32: row r = table.i8[r] * scales[r]
//   - raw Hugging Face snapshot (bench / fetch only): tokenizer.json + model.safetensors
// ============================================================================
"use strict";
const fs = require("fs");
const path = require("path");

// ---- BERT normalizer + pre-tokenizer + WordPiece (bge / bert-base-uncased rules)
const isPunct = (cp) => (cp >= 33 && cp <= 47) || (cp >= 58 && cp <= 64) || (cp >= 91 && cp <= 96) || (cp >= 123 && cp <= 126) || /\p{P}/u.test(String.fromCodePoint(cp));
const isCjk = (cp) => (cp >= 0x4E00 && cp <= 0x9FFF) || (cp >= 0x3400 && cp <= 0x4DBF) || (cp >= 0x20000 && cp <= 0x2A6DF) || (cp >= 0xF900 && cp <= 0xFAFF) || (cp >= 0x2F800 && cp <= 0x2FA1F);

function bertNormalize(text) {
  let out = "";
  for (const ch of String(text)) {
    const cp = ch.codePointAt(0);
    if (cp === 0 || cp === 0xFFFD || (/\p{Cc}|\p{Cf}/u.test(ch) && !/\s/.test(ch))) continue;
    if (/\s/.test(ch)) { out += " "; continue; }
    out += isCjk(cp) ? ` ${ch} ` : ch;
  }
  // lowercase implies strip_accents for BertNormalizer
  return out.toLowerCase().normalize("NFD").replace(/\p{Mn}/gu, "");
}
function preTokenize(text) {
  const words = [];
  for (const chunk of text.split(/\s+/)) {
    if (!chunk) continue;
    let cur = "";
    for (const ch of chunk) {
      if (isPunct(ch.codePointAt(0))) { if (cur) words.push(cur); words.push(ch); cur = ""; }
      else cur += ch;
    }
    if (cur) words.push(cur);
  }
  return words;
}

class WordPiece {
  constructor(vocab /* array of tokens */) {
    this.vocab = new Map();
    vocab.forEach((t, i) => this.vocab.set(t, i));
    this.unk = this.vocab.get("[UNK]");
  }
  word(w, out) {
    if (w.length > 100) { out.push(this.unk); return; }
    const ids = [];
    let start = 0;
    while (start < w.length) {
      let end = w.length, id;
      while (start < end) {
        const sub = (start > 0 ? "##" : "") + w.slice(start, end);
        id = this.vocab.get(sub);
        if (id !== undefined) break;
        end--;
      }
      if (start === end) { out.push(this.unk); return; }
      ids.push(id);
      start = end;
    }
    for (const id of ids) out.push(id);
  }
  encode(text) {
    const out = [];
    for (const w of preTokenize(bertNormalize(text))) this.word(w, out);
    return out;
  }
}

class StaticModel {
  constructor({ vocab, dim, rowAt, meta }) {
    this.tok = new WordPiece(vocab);
    this.dim = dim;
    this.rowAt = rowAt; // (id, acc: Float32Array) => void, adds the row into acc
    this.meta = meta;
  }
  tokenize(text) { return this.tok.encode(text).filter((id) => id !== this.tok.unk); }
  // mean of token rows, L2-normalised (Model2Vec's `normalize: true`)
  embed(text) {
    const ids = this.tokenize(text);
    const v = new Float32Array(this.dim);
    if (!ids.length) return v;
    for (const id of ids) this.rowAt(id, v);
    let n = 0;
    for (let i = 0; i < v.length; i++) n += v[i] * v[i];
    n = Math.sqrt(n) || 1;
    for (let i = 0; i < v.length; i++) v[i] /= n;
    return v;
  }
}

// the vendored, int8-per-row format the function ships
function loadVendored(dir) {
  const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
  const vocab = fs.readFileSync(path.join(dir, "vocab.txt"), "utf8").split("\n");
  if (vocab[vocab.length - 1] === "") vocab.pop();
  const tb = fs.readFileSync(path.join(dir, "table.i8"));
  const table = new Int8Array(tb.buffer, tb.byteOffset, tb.byteLength);
  const sb = fs.readFileSync(path.join(dir, "scales.f32"));
  const scales = new Float32Array(sb.buffer.slice(sb.byteOffset, sb.byteOffset + sb.byteLength));
  const dim = meta.dim;
  if (table.length !== meta.rows * dim || scales.length !== meta.rows || vocab.length !== meta.rows) throw new Error(`model ${dir}: shape mismatch`);
  return new StaticModel({
    vocab, dim, meta,
    rowAt(id, acc) { const s = scales[id], o = id * dim; for (let i = 0; i < dim; i++) acc[i] += table[o + i] * s; }
  });
}

// a raw Hugging Face snapshot (tokenizer.json + model.safetensors, F32)
function readSafetensors(file) {
  const buf = fs.readFileSync(file);
  const n = Number(buf.readBigUInt64LE(0));
  const header = JSON.parse(buf.slice(8, 8 + n).toString("utf8"));
  const key = Object.keys(header).find((k) => k !== "__metadata__");
  const { dtype, shape, data_offsets } = header[key];
  if (dtype !== "F32") throw new Error(`unsupported dtype ${dtype}`);
  const start = 8 + n + data_offsets[0], end = 8 + n + data_offsets[1];
  const data = new Float32Array(buf.buffer.slice(buf.byteOffset + start, buf.byteOffset + end));
  return { data, rows: shape[0], dim: shape[1] };
}
function vocabFromTokenizerJson(file) {
  const tj = JSON.parse(fs.readFileSync(file, "utf8"));
  if (tj.model.type !== "WordPiece") throw new Error("expected a WordPiece tokenizer");
  const vocab = [];
  for (const [tok, id] of Object.entries(tj.model.vocab)) vocab[id] = tok;
  return vocab;
}
function loadRaw(dir) {
  const vocab = vocabFromTokenizerJson(path.join(dir, "tokenizer.json"));
  const { data, rows, dim } = readSafetensors(path.join(dir, "model.safetensors"));
  if (rows !== vocab.length) throw new Error(`vocab ${vocab.length} != rows ${rows}`);
  return new StaticModel({ vocab, dim, meta: { name: path.basename(dir), quant: "f32" }, rowAt(id, acc) { const o = id * dim; for (let i = 0; i < dim; i++) acc[i] += data[o + i]; } });
}

module.exports = { loadVendored, loadRaw, readSafetensors, vocabFromTokenizerJson, WordPiece, bertNormalize, preTokenize };
