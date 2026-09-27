// ============================================================================
// POST /api/ask  {"q": "..."}  →  { verdict, parts:[{q, answer, sources}], rule?, attack?, scores }
//
// A Vercel Function (Node.js runtime, Fluid Compute). No LLM anywhere: the reply
// is grounded quotes and links from the site index, or a refusal. The guardrail
// itself lives in api/_lib/guardrail.js (shared with the eval and dev server).
//
// The model and knowledge base load ONCE per instance, at module scope, and are
// reused across requests (Fluid Compute keeps instances warm and concurrent).
//
// Env (all optional):
//   GUARDRAIL_CANARY           the canary secret (set a fresh random value in prod)
//   GUARDRAIL_TAU / _DELTA     override the tuned kNN operating point
//   GUARDRAIL_ALLOWED_ORIGINS  extra comma-separated origins allowed to POST
//   GUARDRAIL_EVAL_LOG=console log {q, verdict, family} per request (no IP, no UA)
//   GUARDRAIL_BOTID=1          require a BotID pass (see docs/guardrail.md, deploy steps)
// ============================================================================
import guardrailLib from "./_lib/guardrail.js";

const { createGuardrail, MAX_Q } = guardrailLib;
const MAX_BODY = 4096;

let guard = null, bootError = null;
const bootStart = performance.now();
try { guard = createGuardrail(); } catch (e) { bootError = e; console.error("[ask] guardrail failed to load:", e.message); }
const bootMs = performance.now() - bootStart;
let served = 0;

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex"
};
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extra } });

function originAllowed(origin) {
  if (!origin) return true; // non-browser clients; the WAF and BotID handle those
  let host;
  try { host = new URL(origin).host; } catch { return false; }
  const allowed = new Set(["dvynsh.org", "www.dvynsh.org"]);
  for (const v of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) if (v) allowed.add(v);
  for (const o of String(process.env.GUARDRAIL_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean)) {
    try { allowed.add(new URL(o).host); } catch { allowed.add(o); }
  }
  if (process.env.VERCEL_ENV !== "production" && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return true;
  return allowed.has(host);
}

async function botCheck() {
  if (process.env.GUARDRAIL_BOTID !== "1") return true;
  // Enabling BotID: `npm i botid`, then replace the next two lines with
  //   const { checkBotId } = await import("botid/server");
  // (a literal specifier, so the bundler traces the package). See docs/guardrail.md.
  const spec = "botid/server";
  const { checkBotId } = await import(spec);
  const v = await checkBotId();
  return !v.isBot;
}

export async function POST(request) {
  if (bootError) return json({ error: "unavailable", detail: "knowledge base not loaded" }, 503);
  if (!originAllowed(request.headers.get("origin"))) return json({ error: "forbidden origin" }, 403);
  if (!/^application\/json\b/i.test(request.headers.get("content-type") || "")) return json({ error: "send application/json" }, 415);
  if (!(await botCheck())) return json({ error: "bot traffic is not answered" }, 403);

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: "request too large" }, 413);
  let q;
  try { q = JSON.parse(raw).q; } catch { return json({ error: "invalid JSON" }, 400); }
  if (typeof q !== "string" || !q.trim()) return json({ error: "q must be a non-empty string" }, 400);
  if (q.length > MAX_Q) return json({ error: `q is limited to ${MAX_Q} characters` }, 413);

  const warm = served++ > 0;
  const out = guard.ask(q);
  out.scores.instance = { warm, bootMs: Math.round(bootMs), loadMs: Math.round(guard.loadMs) };

  // Privacy: nothing is logged unless the owner opts in, and then only the
  // question text and the verdict: no IP, no user agent, no headers.
  if (process.env.GUARDRAIL_EVAL_LOG === "console") {
    console.log(JSON.stringify({ evt: "guardrail", q: q.slice(0, 300), verdict: out.verdict, family: (out.rule && out.rule.id) || (out.attack && out.attack.family) || null }));
  }
  return json(out);
}

const notAllowed = () => json({ error: "method not allowed; POST {\"q\": \"...\"}" }, 405, { allow: "POST" });
export const GET = notAllowed;
export const PUT = notAllowed;
export const DELETE = notAllowed;
