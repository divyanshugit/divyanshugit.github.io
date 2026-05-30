---
layout: page.njk
title: "Project Proposal — Loom: Inference-Time Search over Reasoning Paths"
pageTitle: "Loom"
subtitle: "Turn a small open model into a reasoning model at inference time — with structured search and deterministic verification, no training."
permalink: /proposal/loom.html
hasMath: true
hasCode: true
extraCss:
  - proposal.css
eleventyExcludeFromCollections: true
sitemap:
  ignore: true
---

<div class="proposal">

<p class="proposal-meta">Divyanshu Kumar &middot; Working draft, last updated 2026-06-04 &middot; <a href="https://github.com/divyanshugit">github.com/divyanshugit</a></p>

<div class="proposal-grid">

<aside class="proposal-toc">
<h4>Contents</h4>
<ol>
<li><a href="#tldr"><span class="toc-num">00</span>TL;DR</a></li>
<li><a href="#problem"><span class="toc-num">01</span>The problem</a></li>
<li><a href="#thesis"><span class="toc-num">02</span>Thesis</a></li>
<li><a href="#loop"><span class="toc-num">03</span>The core loop</a></li>
<li><a href="#architecture"><span class="toc-num">04</span>Architecture</a></li>
<li><a href="#scoring"><span class="toc-num">05</span>Scoring model</a></li>
<li><a href="#entropy"><span class="toc-num">06</span>Entropy-guided branching</a></li>
<li><a href="#example"><span class="toc-num">07</span>What a solve looks like</a></li>
<li><a href="#agenda"><span class="toc-num">08</span>Research agenda</a></li>
<li><a href="#deliverables"><span class="toc-num">09</span>Deliverables</a></li>
<li><a href="#timeline"><span class="toc-num">10</span>Timeline</a></li>
<li><a href="#open"><span class="toc-num">11</span>Open questions</a></li>
<li><a href="#limits"><span class="toc-num">12</span>Honest limits</a></li>
<li><a href="#whynow"><span class="toc-num">13</span>Why now</a></li>
<li><a href="#related"><span class="toc-num">14</span>Related work</a></li>
<li><a href="#references"><span class="toc-num">15</span>References</a></li>
<li><a href="#status"><span class="toc-num">16</span>Status</a></li>
</ol>
</aside>

<main class="proposal-body">

<section id="tldr" class="proposal-hero">
<h2>TL;DR</h2>
<p class="lead">A single forward pass commits to one chain of reasoning and lives with it. When a small model takes a wrong turn at step three, nothing pulls it back. I propose <strong>Loom</strong>: an inference-time engine that turns one LLM call into a <em>tree search over reasoning steps</em>, verifies each step against a deterministic oracle, prunes the failures, and expands what survives.</p>
<p>The bet is narrow and falsifiable: a small open model (Llama-3-8B class) with structured search and step-level verification can <strong>close a meaningful fraction of the gap</strong> to much larger models on tasks where correctness is checkable — math, code, formal logic. No fine-tuning. No reward model. Just compute spent at inference time, in the right place.</p>
<p>Loom is a three-layer system already under construction: a <strong>C++ engine</strong> linked directly against llama.cpp for KV-cache control and raw logprobs, a <strong>Python oracle daemon</strong> that executes candidate steps in a sandbox, and a <strong>TypeScript visualizer</strong> that renders the live search tree.</p>
<p class="hero-footer">Target deliverables: an open-source engine (single binary), a reproducible GSM8K/MATH evaluation harness, a live reasoning-trace visualizer, and a writeup measuring exactly how much of the small-vs-large gap inference-time search recovers.</p>
</section>

<section id="problem">
<span class="section-num">01 / THE PROBLEM</span>
<h2>One pass, one chance</h2>
<p>Chain-of-thought made small models look like reasoners. It didn't make them <em>reliable</em> ones. The failure mode is structural, not stylistic:</p>
<blockquote>An 8B model solving a multi-step word problem makes an arithmetic slip at step three. Every subsequent step is fluent, confident, and built on the wrong number. The final answer is wrong, and the model has no idea — there was never a moment where it could compare the bad branch against a good one. Greedy decoding committed; the rest was momentum.</blockquote>
<p>The standard responses each leave value on the table:</p>
<ul>
<li><strong>Bigger models.</strong> Works, but you pay for it forever, on every token, and you give up local control and privacy. The capability is real; the cost structure is permanent.</li>
<li><strong>Fine-tuning / RL for reasoning.</strong> Powerful, but it requires data, compute, and a training pipeline most people building on top of open weights don't have. It bakes reasoning into weights instead of buying it at inference time.</li>
<li><strong>Best-of-N sampling.</strong> Generates N complete solutions and picks one. It wastes compute on the long confident prefix that all N samples agree on, and the picker is usually just majority vote — no step-level signal about <em>where</em> a solution went wrong.</li>
</ul>
<p>The thing none of these do is the obvious thing: when a reasoning step is <em>checkable</em>, check it, and use the check to steer. For math and code, the check is cheap and exact — run the arithmetic, execute the snippet, see if the assertion holds. The signal is sitting right there and single-pass decoding throws it away.</p>
</section>

<section id="thesis">
<span class="section-num">02 / THESIS</span>
<h2>Search beats scale where verification is free</h2>
<blockquote>In any domain where an intermediate reasoning step can be <em>programmatically verified</em>, structured search with step-level verification recovers a large share of the capability normally bought with parameters — and it does so at inference time, on a model you control.</blockquote>
<p>This is not a general anti-hallucination claim. Loom does nothing for open-ended summarization or factual QA, because there is no oracle for "is this paragraph good." It is a claim about a specific, valuable slice: <strong>formal reasoning where correctness is decidable.</strong> Math word problems, program synthesis with tests, algebraic manipulation, logic puzzles. Where you can write <code>assert</code>, Loom has traction.</p>
<p>The mechanism is allocation. A single pass spends equal compute on confident boilerplate and on the one numeric commitment that decides the answer. Loom spends compute where uncertainty and consequence concentrate: it branches at decision points, verifies the branches, and discards the dead ones before they propagate. Test-time compute, but spent deliberately rather than uniformly.</p>
</section>

<section id="loop">
<span class="section-num">03 / THE CORE LOOP</span>
<h2>Branch, verify, score, select, repeat</h2>
<p>The v1 engine is <strong>beam search over a tree of reasoning steps</strong> — not full MCTS. MCTS needs a reliable value function to backpropagate, which we don't have out of the box. Beam search is simpler, well-understood, and sufficient to test the thesis. MCTS becomes interesting only once v1 produces a usable reward signal to backpropagate.</p>

<pre><code class="language-text">1. BRANCH  — prompt the model for N candidate next-steps
2. VERIFY  — run each candidate step through a deterministic oracle
3. SCORE   — value each surviving branch (oracle result + logprob prior)
4. SELECT  — keep the top-K branches (the beam) and expand them
5. REPEAT  — until solved, budget exhausted, or every branch is pruned
</code></pre>

<p>Two design decisions make this work in practice rather than in slides:</p>
<ul>
<li><strong>Step forcing.</strong> Stop sequences (<code>\nStep</code>, <code>\n\nStep</code>) prevent the model from dumping a whole solution in one shot, which is what gives the engine a branch point to act on. Disableable for ablations.</li>
<li><strong>Consensus-based termination.</strong> Beams vote on a final answer; the search stops early once a threshold of beams agree. No format markers required from the model. Strict extraction (<code>"the answer is"</code> patterns) drives consensus; a looser <code>= N</code> fallback supplies a best guess if the budget runs out first.</li>
</ul>

<div class="callout callout-info">
<div class="callout-title">Budget is compute, not time</div>
Time depends on hardware and isn't reproducible. Loom budgets in <code>max_expansions</code> (total generate calls), <code>beam_width</code> (branches kept alive), <code>max_depth</code> (steps per path), and <code>max_tokens_per_step</code>. <code>beam_width=3, max_depth=8, max_expansions=50</code> means "at most 50 LLM calls, 3 live paths, 8 steps deep" — a reproducible cost ceiling.
</div>
</section>

<section id="architecture">
<span class="section-num">04 / ARCHITECTURE</span>
<h2>Three layers, three languages, one reason each</h2>
<p>Loom is split across three runtimes, each doing what it is uniquely good at. The split is not aesthetic; each boundary buys a concrete capability.</p>

<div class="phase-grid">
<div class="phase-card">
<span class="phase-tag">C / C++</span>
<h5>Engine</h5>
<p>Links directly against <code>libllama</code>. Owns the beam-search loop, generation, KV-cache snapshot/restore at branch points, and raw logprob extraction. This is where the compute-sensitive loop lives — no HTTP, no serialization tax.</p>
</div>
<div class="phase-card">
<span class="phase-tag">Python</span>
<h5>Oracle daemon</h5>
<p>Long-running process on a Unix pipe. Receives candidate code/steps, executes them in an isolated subprocess with a hard timeout, returns <code>{valid, output, error}</code>. Code execution <em>is</em> Python; SymPy and Z3 live here.</p>
</div>
<div class="phase-card">
<span class="phase-tag">TypeScript</span>
<h5>Visualizer</h5>
<p>Browser UI over a WebSocket relay. Renders the live search tree, per-beam reasoning steps, oracle pass/fail, consensus state, and the winning path. Zero runtime dependency on the engine internals.</p>
</div>
</div>

<h3>4.1 Why native for the engine</h3>
<p>The non-negotiable reason to go C++ rather than wrap an HTTP server is the <strong>KV cache</strong>. When a beam branches, every sibling shares the same reasoning prefix. Recomputing that prefix for each branch is the whole cost of naive search. Direct llama.cpp access lets the engine snapshot the cache at a branch point (<code>llama_memory_seq_cp</code>) and restore it on a fresh sequence — real stateful backtracking with <em>zero recomputation</em> of the shared prefix. That single capability is the difference between "search is too expensive to be worth it" and "search is cheap enough to beat scale."</p>

<h3>4.2 Data flow</h3>
<pre><code class="language-text">Problem ──► loom-engine (C++)
              │
              ├─ llama.cpp: generate candidate steps
              │     └─ KV-cache snapshot / restore at branches
              │
              ├─ code blocks ──► loom-oracle (Python)
              │   results    ◄──   (unix pipe, newline-delimited JSON)
              │
              ├─ live events ──► loom-viz (TypeScript, WebSocket)
              │
              └─ winning path + tree.json
</code></pre>

<h3>4.3 Engine ↔ oracle protocol</h3>
<p>Persistent pipe, one JSON message per line. Deliberately boring:</p>
<pre><code class="language-text">Engine → Oracle:  {"code": "x = (20 - 5) / 3\nassert x == 5"}
Oracle → Engine:  {"valid": true,  "output": "5.0", "error": null}

Engine → Oracle:  {"code": "result = sum(range(10))\nassert result == 999"}
Oracle → Engine:  {"valid": false, "output": "45", "error": "AssertionError"}
</code></pre>
</section>

<section id="scoring">
<span class="section-num">05 / SCORING MODEL</span>
<h2>Combining the oracle with the model's own confidence</h2>
<p>A pure pass/fail oracle is too coarse to drive beam search — many steps pass, and the engine still has to choose <em>which</em> passing branch to expand. So each surviving branch gets a scalar that blends the deterministic signal with the model's generation confidence:</p>
<p class="math-display">$$\text{score} \;=\; w_{\text{oracle}} \cdot s_{\text{oracle}} \;+\; w_{\text{lp}} \cdot \overline{\log p}.$$</p>
<p>Here \(s_{\text{oracle}}\) is the oracle's verdict (pass / fail / graded), \(\overline{\log p}\) is the mean per-token log-probability of the generated step (the model's own confidence), and the weights are configurable. The weighting is the knob that controls <em>how much to trust the oracle versus the model</em> — turn \(w_{\text{oracle}}\) up and the search becomes verification-dominated; turn it down and it leans on the model's prior.</p>
<div class="callout callout-info">
<div class="callout-title">Why blend at all?</div>
The oracle answers "is this step <em>valid</em>," not "is this step <em>on the path to the answer</em>." A step can be perfectly valid arithmetic and still be a detour. The logprob prior is a cheap, always-available proxy for "does the model think this is the natural continuation" — it breaks ties between equally-valid branches without a learned value function.
</div>
</section>

<section id="entropy">
<span class="section-num">06 / ENTROPY-GUIDED BRANCHING</span>
<h2>Branch where the model is actually uncertain</h2>
<p>The v1 engine branches at <em>text-level step boundaries</em> — wherever a stop sequence fires. That's a crude proxy for "a decision happened here." Step boundaries don't align with decisions: a single step can contain both rote setup and the one numeric commitment that decides everything. The research direction (Method 1 in the design notes) replaces fixed boundaries with <strong>token-level branching driven by the model's own uncertainty.</strong></p>
<p>At every token, after the forward pass, we already have the full logit distribution. Its Shannon entropy is a direct read on how uncertain the model is right now:</p>
<p class="math-display">$$H \;=\; -\sum_{k} p_k \log_2 p_k \qquad \text{(bits)}.$$</p>
<p>Low entropy (<code>"United" → "States"</code>) means "don't waste a branch here." High entropy (the second digit of a product the model isn't sure about) means "this is exactly where exploration pays." We branch where <em>H</em> spikes and run confidently everywhere else — compute allocated by the model's own signal rather than by punctuation.</p>

<h4>The decision function, in spirit</h4>
<pre><code class="language-cpp">bool should_branch(float entropy, const BeamState&amp; b, const Cfg&amp; c) {
    if (entropy &lt; c.entropy_floor)            return false; // confident
    if (b.pos - b.last_branch &lt; c.cooldown)   return false; // anti-explosion
    if (b.branches_used &gt;= c.max_per_beam)    return false; // budget
    if (c.adaptive)                                          // relative spike
        return entropy &gt; b.mean_entropy + c.k * b.stddev_entropy;
    return entropy &gt;= c.entropy_ceiling;                     // always-branch
}
</code></pre>

<p>Thresholding is <em>adaptive</em>, not a magic number: a warmup window collects per-beam entropy statistics, then branches trigger on <em>H</em> &gt; mean + <em>k</em>·stddev, with an absolute floor (never branch below ~1 bit) and ceiling (always branch above ~4 bits). A cooldown after each branch stops the engine from forking on every digit of a long number.</p>

<h4>Convergence and divergence</h4>
<p>Two beams exploring the same region of distribution space are wasted compute. We measure redundancy with symmetric KL divergence between their next-token distributions:</p>
<p class="math-display">$$D_{\text{sym}}(P \,\|\, Q) \;=\; \tfrac{1}{2}\!\left(D_{\mathrm{KL}}(P\|Q) + D_{\mathrm{KL}}(Q\|P)\right).$$</p>
<p>When two beams sit below a KL threshold, kill the one with lower cumulative logprob. The dual case is the valuable one: when two beams that forked at <em>different</em> points converge on the <em>same</em> answer via different reasoning, that independent agreement is a strong correctness signal and gets weighted up in consensus.</p>

<div class="callout callout-info">
<div class="callout-title">Two strategies, one engine</div>
Step-level beam search (v1) is the baseline that proves the thesis end-to-end. Entropy-guided branching is the research bet that the <em>where-to-branch</em> decision is the lever that matters. The oracle is orthogonal to both: under entropy mode it demotes from primary scorer to an optional validator that can veto a clearly-wrong branch.
</div>
</section>

<section id="example">
<span class="section-num">07 / WHAT A SOLVE LOOKS LIKE</span>
<h2>Where the branches land</h2>
<p>The point of token-level entropy is that branch points fall on the <em>computation</em>, not the boilerplate. Annotated trace for a multiplication:</p>
<pre><code class="language-text">Prompt: "What is 25 * 37?"

"Step 1: I need to multiply 25 by 37."   ← low entropy   (boilerplate)
" 25 * 37 = "                             ← low entropy   (setup)
"9"                                       ← HIGH entropy   ◀ BRANCH (925? 950? 937?)
"25"                                      ← lower entropy  (given first digit)
"The answer is "                          ← low entropy   (format)
"925"                                     ← HIGH entropy   ◀ BRANCH (committing)
</code></pre>
<p>The engine spends its branch budget on the two tokens that actually decide the answer, and runs the surrounding text once. Each fork is verified — the oracle executes <code>25 * 37</code> and prunes every branch that isn't <code>925</code> — so the search collapses to the correct path without the model ever needing to "notice" its own error.</p>
</section>

<section id="agenda">
<span class="section-num">08 / AGENDA</span>
<h2>Phased research and build plan</h2>

<div class="phase-grid">
<div class="phase-card">
<span class="phase-tag">Phase 1</span>
<h5>Beam search, end to end</h5>
<p>Step-level beam search + Python oracle on GSM8K. The question this phase answers: does step-level verification beat single-pass at all, on the same model and prompt?</p>
</div>
<div class="phase-card">
<span class="phase-tag">Phase 2</span>
<h5>Entropy-guided branching</h5>
<p>Token-level branching driven by logit entropy, KV-cache forking, diverse sampling at branch points, convergence-anchored consensus. The bet that <em>where</em> you branch is the real lever.</p>
</div>
<div class="phase-card">
<span class="phase-tag">Phase 3</span>
<h5>Harder domains + richer oracles</h5>
<p>MATH (competition-level), SymPy for algebraic verification, Z3 for logic. Trace export as training data, and the reward signal that makes MCTS worth trying.</p>
</div>
</div>

<h3>Phase 1 — Prove the loop</h3>
<p>The whole point is a clean A/B on a fixed model. Same Llama-3-8B, same prompt template, same problems. Baseline: single-pass chain-of-thought. Loom: beam search (<code>beam_width=3</code>, <code>max_depth=6</code>) + Python execution oracle. Upper bound: a frontier model single-pass on the same problems. Success = Loom closes a meaningful fraction of the baseline→upper-bound gap. Published process-verification results (Lightman et al., 2023) say this gap is closable; Phase 1 measures it on a model you can run locally.</p>

<h3>Phase 2 — Move the branch point</h3>
<p>Refactor the generator to single-token generation with per-token entropy, implement position-aware KV-cache forking and nucleus-then-partition diverse sampling, add redundancy pruning via symmetric KL, and upgrade consensus to weight independent-path agreement. The headline comparison: <em>entropy-guided branching vs. fixed step-boundary branching at equal compute budget.</em></p>

<h3>Phase 3 — Generalize the oracle</h3>
<p>The Python oracle is a stand-in for a family. SymPy verifies algebraic equivalence rather than numeric assertion; Z3 checks logical constraints. Every successful search also emits a verified reasoning trace — and a corpus of verified traces is exactly the training data a future process-reward model or MCTS value function needs. v1 produces the data v2 consumes.</p>
</section>

<section id="deliverables">
<span class="section-num">09 / DELIVERABLES</span>
<h2>What ships</h2>
<ul>
<li><strong>The engine.</strong> <code>loom-engine</code>, a single C++ binary linked against llama.cpp, with a CLI for standalone solves and a streaming mode for the relay. Apache-2.0.</li>
<li><strong>The oracle daemon.</strong> Sandboxed Python executor (Python → SymPy → Z3), pipe protocol, per-execution timeouts.</li>
<li><strong>The visualizer.</strong> Live browser UI: search tree, per-beam steps, oracle verdicts, consensus, entropy heatmaps, and the winning reasoning trace.</li>
<li><strong>Reproducible evaluation harness.</strong> GSM8K and MATH runners with compute-budgeted, seeded, deterministic configs. The headline artifact: a figure plotting accuracy vs. compute budget for single-pass, beam search, and entropy-guided search on a fixed model.</li>
<li><strong>Verified-trace dataset.</strong> Successful reasoning paths exported as JSONL — a by-product that doubles as training data for downstream work.</li>
</ul>
</section>

<section id="timeline">
<span class="section-num">10 / TIMELINE</span>
<h2>Milestones</h2>
<p>Working weeks of effort, not calendar weeks. The C++/llama.cpp integration front-loads the risk, so the first gate is deliberately small and brutal.</p>

<div class="callout callout-decision">
<div class="callout-title">Decision gate · Milestone 0</div>
<p>End-to-end on <strong>100 GSM8K problems</strong>: engine loads the model and generates step-wise solutions, oracle executes the code blocks, beam search explores 3 paths to depth 6, accuracy compared against single-pass on the same model. <strong>If Loom beats single-pass by a margin that survives the extra compute cost → continue. If it ties single-pass at equal budget → the thesis is wrong on this domain and we diagnose before scaling.</strong> Everything downstream is conditional on this one comparison.</p>
</div>

<h3>Phase 1 — Beam search end to end</h3>
<ol class="milestones">
<li><span class="ms-id">M1</span><div class="ms-body"><strong>Engine + llama.cpp integration<span class="ms-week">2 wk</span></strong><p>Model loading, generation with step-forcing stop sequences, logprob extraction, CMake build against the llama.cpp submodule, single-problem CLI.</p></div></li>
<li><span class="ms-id">M2</span><div class="ms-body"><strong>Oracle daemon + IPC<span class="ms-week">1 wk</span></strong><p>Pipe protocol, sandboxed subprocess execution, timeout handling, code-block extraction from generated text.</p></div></li>
<li><span class="ms-id">M3</span><div class="ms-body"><strong>Beam search + KV management<span class="ms-week">2 wk</span></strong><p>Tree structure, beam loop, KV-cache snapshot/restore at branches, scorer (oracle + logprob), consensus termination. <em>This is Milestone 0's engine.</em></p></div></li>
<li><span class="ms-id">M4</span><div class="ms-body"><strong>GSM8K harness + first numbers<span class="ms-week">1 wk</span></strong><p>Dataset loader, batch runner, accuracy-vs-budget figure: single-pass vs. beam search on a fixed model.</p></div></li>
</ol>

<h3>Phase 2 — Entropy-guided branching</h3>
<ol class="milestones">
<li><span class="ms-id">M5</span><div class="ms-body"><strong>Token-level generation + entropy<span class="ms-week">2 wk</span></strong><p>Single-token generation API, per-token entropy/logprob trace, adaptive thresholding, an <code>--entropy-debug</code> mode to validate that spikes land on decision points.</p></div></li>
<li><span class="ms-id">M6</span><div class="ms-body"><strong>Branching + diverse sampling<span class="ms-week">2 wk</span></strong><p>Position-aware KV forking, nucleus-then-partition sampling at branch points, single-level then recursive branching with budget management.</p></div></li>
<li><span class="ms-id">M7</span><div class="ms-body"><strong>Convergence + enhanced consensus<span class="ms-week">1 wk</span></strong><p>Symmetric-KL redundancy pruning, independent-path-weighted consensus. Headline comparison: entropy-guided vs. step-boundary branching at equal budget.</p></div></li>
</ol>

<h3>Phase 3 — Harder domains + richer oracles</h3>
<ol class="milestones">
<li><span class="ms-id">M8</span><div class="ms-body"><strong>SymPy + Z3 oracles<span class="ms-week">2 wk</span></strong><p>Algebraic-equivalence verification and SMT constraint checking as drop-in oracle backends.</p></div></li>
<li><span class="ms-id">M9</span><div class="ms-body"><strong>MATH benchmark + trace export<span class="ms-week">2 wk</span></strong><p>Competition-level math runner. Verified-trace JSONL export. Visualizer entropy heatmaps and branch graph.</p></div></li>
</ol>
</section>

<section id="open">
<span class="section-num">11 / OPEN QUESTIONS</span>
<h2>What the work has to answer</h2>
<ul>
<li><strong>Does search actually beat the extra compute it costs?</strong> The honest comparison is accuracy <em>at equal compute budget</em>, not accuracy at any cost. If beam search of 50 expansions only matches single-pass run 50 times and majority-voted, the structure isn't earning its keep.</li>
<li><strong>What is a "step"?</strong> A single equation? A paragraph? Step granularity is a free parameter in v1 that the entropy approach is meant to dissolve — but only if entropy spikes really do align with reasoning decisions across problems and models.</li>
<li><strong>Does failed-step feedback help?</strong> When a step fails verification, feeding the error back into a regeneration prompt is intuitive — but it complicates the tree and may just bias the model toward the oracle's surface form. Worth measuring, not assuming.</li>
<li><strong>How far does the binary oracle take you?</strong> Pass/fail is a thin signal for beam selection. How much of the lift comes from the oracle versus the logprob prior, and where does a learned verifier become necessary?</li>
<li><strong>KV-cache memory pressure.</strong> Snapshotting many beams at many depths competes for VRAM with the model itself. What's the real ceiling on concurrent beams before we have to evict, and does eviction cost the accuracy gain?</li>
<li><strong>Do entropy spikes survive formatting noise?</strong> Whitespace and punctuation tokens often spike entropy without being meaningful decisions. Does token-class filtering cleanly separate real decision points, or is the signal noisier than the toy example suggests?</li>
</ul>
</section>

<section id="limits">
<span class="section-num">12 / LIMITS</span>
<h2>Honest limits and what could kill the project</h2>
<ol>
<li><strong>It only works where verification exists.</strong> Math, code, formal logic — yes. Summarization, open factual QA, anything subjective — no. This is a sharp tool for a narrow slot, and the slot is the whole pitch. Calling it a general reasoning booster would be a lie.</li>
<li><strong>The oracle passes too much.</strong> A Python executor marks any non-crashing step "valid," so on many problems the oracle gives no discriminative signal and the search leans entirely on the logprob prior. The richer oracles (SymPy, Z3) and entropy scoring are the response, but until they land, "verification-guided" partly means "logprob-guided."</li>
<li><strong>Code-block extraction is brittle.</strong> The whole loop depends on the model emitting parseable, fenced code consistently. Prompt engineering and strict output formatting carry real weight here, and a model that won't comply degrades the engine to ordinary sampling.</li>
<li><strong>Search may not beat sampling at equal budget.</strong> The sharpest risk. Best-of-N with self-consistency is a strong, simple baseline. If Loom can't beat it at matched compute, the KV-cache machinery isn't justified. Milestone 0 surfaces this early and cheaply.</li>
<li><strong>Native llama.cpp coupling is fragile.</strong> Linking against an unstable internal API (KV-cache memory functions, batch layout) means upstream changes can break the build. The payoff (zero-recompute branching) is the entire performance argument, so the coupling is deliberate — but it is a maintenance tax.</li>
<li><strong>Inference-only, by design.</strong> Loom produces training data; it doesn't consume it. It will not, on its own, make a base model better. It makes a fixed model <em>perform</em> better at solve time, and that's the only claim.</li>
</ol>

<div class="callout callout-warn">
<div class="callout-title">What would kill the project</div>
<p><strong>No edge over self-consistency.</strong> If structured search at budget <em>B</em> doesn't beat best-of-N + majority vote at the same <em>B</em>, the search structure is decoration. Milestone 0 is built to expose exactly this.</p>
<p><strong>Entropy doesn't localize decisions.</strong> If high-entropy tokens don't reliably mark reasoning decisions — if they're dominated by formatting and lexical noise — the Phase 2 thesis collapses and we're left with the v1 baseline.</p>
<p><strong>Memory ceiling too low.</strong> If KV-cache pressure caps concurrent beams so aggressively that the search can't stay broad enough to help, the native advantage evaporates.</p>
</div>
</section>

<section id="whynow">
<span class="section-num">13 / WHY NOW</span>
<h2>The moment is right</h2>
<ol>
<li><strong>Test-time compute is the frontier story.</strong> The o1/o3 generation made it explicit: spending more compute at inference, deliberately, buys reasoning. Loom asks whether you can get a slice of that on an open 8B model you run yourself, without the training the labs did.</li>
<li><strong>Process verification is validated, not speculative.</strong> "Let's Verify Step by Step" (Lightman et al., 2023) showed step-level supervision substantially beats outcome-level. Loom applies the same insight at inference with a <em>free</em> verifier (code execution) instead of a trained reward model.</li>
<li><strong>llama.cpp's KV-cache API is finally good enough.</strong> Per-sequence copy/remove and explicit memory control make true stateful branching a tractable engineering task rather than a research project. The one capability the whole design rests on is now within reach.</li>
<li><strong>Small open models are genuinely capable and genuinely runnable.</strong> Llama-3-8B-class models reason well enough that the gap to close is real but not hopeless — and they fit on hardware an individual controls, which is the entire point of buying capability at inference instead of renting it from an API.</li>
</ol>
</section>

<section id="related">
<span class="section-num">14 / RELATED WORK</span>
<h2>Position relative to four lines</h2>
<ul>
<li><strong>Process supervision.</strong> Lightman et al., <em>Let's Verify Step by Step</em> (2023); Uesato et al. (2022). <em>Strength:</em> proves step-level signal beats outcome-level. <em>Difference:</em> they train a reward model; Loom uses a deterministic oracle at inference and trains nothing.</li>
<li><strong>Search over reasoning.</strong> Tree of Thoughts (Yao et al., 2023); Self-Consistency (Wang et al., 2022); MCTS-for-reasoning variants. <em>Strength:</em> structured exploration helps. <em>Difference:</em> these run at the API/text level and recompute shared prefixes; Loom goes native for zero-recompute KV branching and uses a real verifier rather than self-evaluation.</li>
<li><strong>Verifier- and execution-guided generation.</strong> Code-execution feedback, AlphaCode-style filtering, self-debugging loops. <em>Strength:</em> execution is a strong correctness signal. <em>Difference:</em> Loom makes execution a <em>step-level</em> pruning signal inside a search, not a post-hoc filter over complete samples.</li>
<li><strong>Uncertainty-guided decoding.</strong> Entropy/confidence-based sampling and speculative decoding. <em>Strength:</em> the model's own uncertainty is a usable signal. <em>Difference:</em> speculative decoding speeds up one path; Loom uses entropy to decide <em>where to fork into many</em>.</li>
</ul>
</section>

<section id="references">
<span class="section-num">15 / REFERENCES</span>
<h2>Citable reference points</h2>
<ul>
<li><strong>Process supervision.</strong> Lightman et al., <em>Let's Verify Step by Step</em> (2023); Uesato et al., <em>Solving math word problems with process- and outcome-based feedback</em> (2022).</li>
<li><strong>Search over reasoning.</strong> Yao et al., <em>Tree of Thoughts</em> (NeurIPS 2023); Wang et al., <em>Self-Consistency Improves Chain of Thought Reasoning</em> (ICLR 2023).</li>
<li><strong>Test-time compute scaling.</strong> Snell et al., <em>Scaling LLM Test-Time Compute Optimally</em> (2024).</li>
<li><strong>Inference systems.</strong> llama.cpp (Gerganov et al.) — KV-cache and batched decoding API.</li>
<li><strong>Information-theoretic uncertainty.</strong> Shannon, <em>A Mathematical Theory of Communication</em> (1948); KL divergence (Kullback &amp; Leibler, 1951).</li>
</ul>
</section>

<section id="status">
<span class="section-num">16 / STATUS</span>
<h2>Where this is now</h2>
<p>Under active construction. The three-layer skeleton exists — C++ engine scaffolding linked against the llama.cpp submodule, the Python oracle daemon with pipe IPC, and the TypeScript visualizer with a WebSocket relay. Beam search, KV-cache management, consensus termination, and step forcing are implemented in the engine. The next concrete deliverable is <strong>Milestone 0</strong>: the 100-problem GSM8K comparison against single-pass on a fixed model. Everything in this proposal is conditional on that comparison clearing the compute bar.</p>
<p>Repository: <a href="https://github.com/divyanshugit"><code>github.com/divyanshugit/loom</code></a> (private during early iteration).</p>
<p>Contact: <a href="mailto:kumardivy1999@gmail.com">kumardivy1999 [at] gmail.com</a></p>
<p class="proposal-footer">This page is a working document. It will move as the experiments teach us what's real.</p>
</section>

</main>
</div>
</div>
