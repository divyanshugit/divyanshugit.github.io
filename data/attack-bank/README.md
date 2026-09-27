# Attack bank (server-only)

Seed prompts for the guardrail's semantic layer (`api/ask.mjs`, see `docs/guardrail.md`).
This directory is **never** copied into `_site` (it is outside `src/`), and the build
(`scripts/build-embeddings.js`) writes only vectors plus family tags into `api/_kb/`,
which ships inside the function bundle, not to the public site.

## Files

| File | What |
|---|---|
| `seed.jsonl` | Attack *prompts*, one per line: `{"f": "<family>", "t": "<prompt>"}` |
| `benign.jsonl` | Benign anchors: in-domain questions, including questions *about* attacks ("what is a jailbreak?"), so the kNN can tell "talking about jailbreaks" from "doing one". `{"t": "..."}` |
| `*.jsonl` (any other) | Extra banks, same shape as `seed.jsonl`, picked up automatically |

Families (must be one of the ids in `FAMILIES` in `src/js/probe-core.js`):
`override`, `persona`, `extract`, `obfuscation`, `splitting`, `manyshot`, `suppression`,
`pii`, `cbrn`, `fiction`, `authority`, `delimiter`.

## Rules for entries

- **Prompts only.** Never add a model's answer, a completion, or any real harmful content.
  Hazardous-request entries describe the *shape* of the request ("give synthesis steps for a
  banned agent"), never a real agent, quantity or procedure.
- Keep them short (one or two sentences). The embedding is a mean of token vectors, so long
  prompts dilute; split a long template into its distinctive sentences.
- Do not copy prompts from `eval/cases.jsonl`. The eval must stay held out; the build warns
  if a bank line is identical to an eval case.

## Extending it with public benchmarks

Good sources of attack prompts (check each licence before copying text in, and record the
source in a `"src"` field):

- **JailbreakBench** behaviours and artifacts (MIT) — `JailbreakBench/JBB-Behaviors`.
- **HarmBench** behaviour strings (MIT) — use the *behaviour* text only.
- **Lakera gandalf_ignore_instructions** (MIT) — prompt-injection attempts.
- **deepset/prompt-injections** (Apache-2.0).
- **jackhhao/jailbreak-classification** (Apache-2.0) — DAN-style role-play prompts.
- **TrustAIRLab in-the-wild jailbreak prompts** (MIT; research use) — long persona templates;
  keep only the distinctive opening sentences.
- **SAGE-RT** (the owner's own synthetic red-team data) — the natural first import.

Workflow:

1. Write the new prompts to `data/attack-bank/<source>.jsonl` with `f`, `t`, `src`.
2. `npm run build` (or `node scripts/build-embeddings.js --site=<dir>`) re-embeds the bank.
3. `npm run eval` and compare recall / false-refusal against the last run; re-tune tau with
   `npm run eval -- --sweep` if the benign false-refusal rate moves.
4. More entries raise recall but also raise false refusals on benign questions that share
   vocabulary with attacks. Add benign anchors to `benign.jsonl` when that happens.
