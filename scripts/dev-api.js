#!/usr/bin/env node
// ============================================================================
// Local stand-in for Vercel: serves a built site and routes POST /api/ask to the
// real function export (api/ask.mjs → POST(request)), with the headers from
// vercel.json applied, so the probe can be tested in a browser without linking
// a Vercel project (`vercel dev` requires `vercel link`).
//
//   node scripts/dev-api.js [--site=_site] [--port=3000] [--no-api]
//   GUARDRAIL_EVAL_LOG=file:eval/asked.jsonl node scripts/dev-api.js   # local log
//
// --no-api serves only the static files (the probe then uses its offline fallback).
// ============================================================================
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const arg = (k, d) => { const a = process.argv.find((x) => x === `--${k}` || x.startsWith(`--${k}=`)); if (!a) return d; return a.includes("=") ? a.slice(a.indexOf("=") + 1) : true; };
const SITE = path.resolve(ROOT, arg("site", "_site"));
const PORT = +arg("port", 3000);
const API = !arg("no-api", false);
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".pdf": "application/pdf", ".ico": "image/x-icon", ".txt": "text/plain" };

// vercel.json "headers": path-to-regexp style sources, "(.*)" groups only
const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
const escRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const headerRules = (vercel.headers || []).map((h) => ({ re: new RegExp("^" + h.source.replace(/\\\./g, ".").split("(.*)").map(escRe).join("(.*)") + "$"), headers: h.headers }));
const headersFor = (p) => Object.assign({}, ...headerRules.filter((r) => r.re.test(p)).map((r) => Object.fromEntries(r.headers.map((x) => [x.key, x.value]))));

let handler = null;
async function api(req, res) {
  if (!handler) handler = await import(path.join(ROOT, "api", "ask.mjs"));
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const method = req.method.toUpperCase();
  const fn = handler[method];
  if (!fn) { res.writeHead(405, { allow: "POST" }); return res.end(); }
  const request = new Request(`http://localhost:${PORT}${req.url}`, { method, headers: req.headers, body: ["GET", "HEAD"].includes(method) ? undefined : Buffer.concat(chunks) });
  const t = performance.now();
  const response = await fn(request);
  const body = Buffer.from(await response.arrayBuffer());
  const log = process.env.GUARDRAIL_EVAL_LOG || "";
  if (log.startsWith("file:") && response.status === 200) {
    try {
      const out = JSON.parse(body.toString("utf8")), q = JSON.parse(Buffer.concat(chunks).toString("utf8")).q;
      fs.appendFileSync(path.resolve(ROOT, log.slice(5)), JSON.stringify({ t: new Date().toISOString(), q, verdict: out.verdict }) + "\n");
    } catch (e) { /* never fail a request on logging */ }
  }
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(body);
  console.log(`${method} ${req.url} ${response.status} ${(performance.now() - t).toFixed(1)}ms`);
}

function serveStatic(req, res) {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = path.join(SITE, p);
  if (!file.startsWith(SITE)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) { res.writeHead(404, { "content-type": "text/plain" }); return res.end("not found"); }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream", ...headersFor(p) });
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  const p = req.url.split("?")[0];
  if (p.startsWith("/api/")) {
    if (!API || p !== "/api/ask") { res.writeHead(404, { "content-type": "application/json" }); return res.end('{"error":"not found"}'); }
    return api(req, res).catch((e) => { console.error(e); res.writeHead(500); res.end(); });
  }
  serveStatic(req, res);
}).listen(PORT, () => console.log(`dev-api: ${SITE} on http://localhost:${PORT}${API ? " with /api/ask" : " (static only, no API)"}`));
