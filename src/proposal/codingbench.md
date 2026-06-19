---
layout: page.njk
title: "Research Proposal: CodingAgentBench"
pageTitle: "CodingAgentBench"
subtitle: "A multi-language, multi-repo benchmark for evaluating real-world AI coding agents."
permalink: /proposal/codingbench.html
hasCode: true
extraCss:
  - proposal.css
eleventyExcludeFromCollections: true
sitemap:
  ignore: true
---

<div class="proposal">

<p class="proposal-meta">Divyanshu Kumar &middot; Working draft, last updated 2026-06-18 &middot; <a href="https://github.com/divyanshugit">github.com/divyanshugit</a></p>

<div class="proposal-grid">

<aside class="proposal-toc">
<h4>Contents</h4>
<ol>
<li><a href="#tldr"><span class="toc-num">00</span>TL;DR</a></li>
<li><a href="#problem"><span class="toc-num">01</span>The problem</a></li>
<li><a href="#thesis"><span class="toc-num">02</span>Thesis</a></li>
<li><a href="#shipped"><span class="toc-num">03</span>What's built</a></li>
<li><a href="#example"><span class="toc-num">04</span>Example task</a></li>
<li><a href="#scoring"><span class="toc-num">05</span>Scoring</a></li>
<li><a href="#agenda"><span class="toc-num">06</span>Research agenda</a></li>
<li><a href="#open"><span class="toc-num">07</span>Open questions</a></li>
<li><a href="#deliverables"><span class="toc-num">08</span>Deliverables</a></li>
<li><a href="#timeline"><span class="toc-num">09</span>Timeline</a></li>
<li><a href="#limits"><span class="toc-num">10</span>Honest limits</a></li>
<li><a href="#related"><span class="toc-num">11</span>Related work</a></li>
<li><a href="#status"><span class="toc-num">12</span>Status</a></li>
</ol>
</aside>

<main class="proposal-body">

<section id="tldr" class="proposal-hero">
<h2>TL;DR</h2>
<p class="lead">Coding agents ship weekly. Buyers pick them on demos and tweets. There is no rigorous, multi-language, multi-repo benchmark that compares real coding agents on the actual job: fixing real bugs in real codebases.</p>
<p>I'm building one. <strong>CodingAgentBench</strong> is 682 curated tasks across 35 production repositories in 5 languages, verified against each repo's own test suite. The research agenda goes beyond a leaderboard: difficulty calibration from agent traces, capability decomposition into measurable sub-skills, and a contamination-resistant fresh-issue stream.</p>
<ol class="phase-list">
<li><strong>Multi-agent leaderboard.</strong> Apples-to-apples comparison of Aider, Claude Code, Cline, OpenHands, Cursor on the same task suite.</li>
<li><strong>Capability decomposition.</strong> Beyond pass/fail: navigation, planning, edit precision, test-output interpretation, recovery from failure.</li>
<li><strong>Contamination-resistant variant.</strong> A rolling stream of fresh GitHub issues so the benchmark doesn't decay as models improve.</li>
</ol>
<p class="hero-footer">Target deliverables: a public leaderboard, the open-source runner (Apache-2.0), the curated task set on HuggingFace (CC-BY-4.0), and quarterly fresh-task drops to keep the benchmark live.</p>
</section>

<section id="problem">
<span class="section-num">01 / THE PROBLEM</span>
<h2>Existing benchmarks don't measure the actual job</h2>
<p>The AI coding-agent space is exploding. Aider, Cline, OpenHands, Claude Code, Cursor, Copilot Workspace, new entrants every week. But if you ask "which one is best on real engineering work?", the honest answer today is <em>we cannot tell</em>. Existing benchmarks are each broken in a different way.</p>

<ul>
<li><strong>SWE-bench</strong> was a breakthrough (real GitHub issues, real test suites) but it's <em>Python-only</em>, draws from ~12 mostly-scientific-computing repos, top agents now score 50%+ on the Verified split, and after a year of public availability the contamination risk is real. Useful, but saturating.</li>
<li><strong>HumanEval / MBPP / CodeContests</strong> test function synthesis from a spec. No repository navigation, no multi-file edits, no test-suite interpretation. They measure code <em>generation</em>, not coding <em>agents</em>.</li>
<li><strong>Aider's polyglot benchmark</strong> is multi-language but built to evaluate Aider's specific workflow: small, single-file edits with clear instructions. Doesn't stress the full agent surface area.</li>
<li><strong>LiveCodeBench / BigCodeBench</strong> are competitive-programming or API-level. Nobody's production codebase looks like a Codeforces problem.</li>
</ul>

<p>Meanwhile companies are making real purchasing decisions. "Do we buy Cursor seats or roll out Claude Code?" "Does our internal coding agent actually beat the off-the-shelf one?" These decisions are made on cherry-picked demos and Twitter hype. That isn't good enough when engineering productivity is on the line.</p>
</section>

<section id="thesis">
<span class="section-num">02 / THESIS</span>
<h2>A Chatbot Arena for coding agents</h2>
<blockquote>An agent that fixes real bugs in popular open-source codebases against the repo's own test suite is doing the closest thing we have to the real job. Measure that across languages, repos, and difficulties, and you have a benchmark a buyer can actually trust.</blockquote>
<p>The thesis isn't novel. SWE-bench established the template. The contribution is making it <em>broad enough</em> (5 languages, 35 repos, 682 tasks), <em>fresh enough</em> (a rolling stream of recent PRs), and <em>scientifically informative enough</em> (capability decomposition, difficulty calibration from agent traces) to remain useful as frontier agents saturate the easy cases.</p>
</section>

<section id="shipped">
<span class="section-num">03 / WHAT'S BUILT</span>
<h2>The starting state</h2>
<p>CodingAgentBench is not vaporware. The substrate exists:</p>

<div class="phase-grid">
<div class="phase-card">
<span class="phase-tag">Tasks</span>
<h5>682 curated</h5>
<p>Real PRs from 35 active open-source repositories. Each task carries the issue body, the pre-fix commit, the merged fix, the files changed, and a difficulty label.</p>
</div>
<div class="phase-card">
<span class="phase-tag">Languages</span>
<h5>5 with serious coverage</h5>
<p>Python, Rust, Go, TypeScript, C/C++. ~140 tasks per language, not a Python benchmark with a few token Go tasks bolted on.</p>
</div>
<div class="phase-card">
<span class="phase-tag">Runner</span>
<h5>CLI + adapters</h5>
<p>Python + uv. Pluggable agent adapter interface (<code>BaseAdapter</code>). Aider adapter shipped; Claude Code / Cline / OpenHands / Cursor adapters in the queue.</p>
</div>
</div>

<h3>Repository coverage</h3>
<p>Repos are the load-bearing design choice. These are the projects developers actually use. Saying "agent X scored 72% on Kubernetes" lands harder than "agent X scored 72% on toy_repo_42":</p>

<table>
<thead><tr><th>Language</th><th>Repositories</th></tr></thead>
<tbody>
<tr><td><strong>Python</strong></td><td>vllm, transformers, pytorch, fastapi, langchain, pydantic, django</td></tr>
<tr><td><strong>Rust</strong></td><td>ruff, polars, candle, tauri, swc, uv, axum</td></tr>
<tr><td><strong>Go</strong></td><td>kubernetes, prometheus, terraform, etcd, docker-compose, gh-cli, fiber</td></tr>
<tr><td><strong>TypeScript</strong></td><td>next.js, vscode, prisma, trpc, excalidraw, svelte, shadcn/ui</td></tr>
<tr><td><strong>C / C++</strong></td><td>llama.cpp, redis, curl, jq, neovim, tmux, unleashed-firmware</td></tr>
</tbody>
</table>

<h3>Difficulty distribution</h3>
<p>Every task is labelled <strong>easy</strong>, <strong>medium</strong>, or <strong>hard</strong> based on a heuristic over diff size, files touched, and whether the PR description signals architectural work. The labels are an <em>input</em> to research, not a finished classification (see §07).</p>

<ul>
<li><strong>182 easy.</strong> One-file fixes, clear error messages.</li>
<li><strong>221 medium.</strong> Multi-file changes, requires codebase understanding.</li>
<li><strong>279 hard.</strong> Architectural changes, subtle bugs, large diffs.</li>
</ul>
</section>

<section id="example">
<span class="section-num">04 / EXAMPLE TASK</span>
<h2>What a task looks like</h2>
<pre><code class="language-json">{
  "repo": "django/django",
  "language": "python",
  "difficulty": "hard",
  "issue_number": 19331,
  "issue_title": "Fixed #36290 -- Made TupleIn() lookup discard tuples containing None.",
  "issue_body": "For the same reasons lookups.In discards None members,
                 tuple_lookups.TupleIn should discard tuples containing any None
                 as NULL != NULL in SQL ...",
  "pr_url": "https://github.com/django/django/pull/19331",
  "files_changed": [
    "django/db/models/fields/tuple_lookups.py",
    "docs/releases/5.2.1.txt",
    "tests/composite_pk/test_filter.py",
    "tests/foreign_object/models/person.py",
    "tests/foreign_object/tests.py"
  ],
  "files_changed_count": 5,
  "has_test_changes": true,
  "commit_before": "543e17c4405dfdac4f18759fc78b190406d14239",
  "commit_fix":    "f7f38f3a0b44d8c6d14344dae66b6ce52cd77b55",
  "additions": 37,
  "deletions": 1
}
</code></pre>
<p>The runner clones the repo, checks out <code>commit_before</code>, hands the agent the issue text, lets it edit, then runs the repo's own test suite at the post-agent state. Pass / fail against the same tests the human maintainer's PR had to pass.</p>
</section>

<section id="scoring">
<span class="section-num">05 / SCORING</span>
<h2>What we measure</h2>

<h3>Headline metric</h3>
<p>For now, the headline is simple: <strong>resolve rate</strong>, the fraction of tasks where the agent produces a diff whose application makes the repo's test suite go from red to green. Reported by language, repo, and difficulty.</p>

<h3>Per-run dimensions captured</h3>
<p>Each task run records more than pass/fail:</p>
<ul>
<li><strong>Wall-clock time.</strong> How long the agent took.</li>
<li><strong>Token / API cost.</strong> Billable cost for the run.</li>
<li><strong>Edit diff.</strong> The actual change the agent produced (orthogonal to the reference PR).</li>
<li><strong>Trace.</strong> Turn-by-turn observations, tool calls, file reads. The substrate for §07's capability decomposition.</li>
<li><strong>Test output.</strong> Both pre- and post-agent test runs, to distinguish "agent's fix passes" from "tests were already passing".</li>
</ul>

<h3>What we explicitly do not collapse to one number</h3>
<p>A scalar leaderboard is what makes the benchmark <em>shareable</em>, but it's not the whole story. A 70% resolve rate at $0.20/task and 30s/task is a different product than a 70% resolve rate at $4.00/task and 5min/task. The reporter surfaces resolve-rate, cost-per-resolve, and time-per-resolve as a three-axis profile, not a single column.</p>
</section>

<section id="agenda">
<span class="section-num">06 / AGENDA</span>
<h2>Four-phase research agenda</h2>

<h3>Phase 0: Curation + runner <span class="subtle">(done)</span></h3>
<p>682 tasks curated from 35 repos. CLI shipped. Aider adapter shipped. The substrate is real.</p>

<h3>Phase 1: Multi-agent leaderboard</h3>
<p>The visible deliverable. Adapters for the agents that matter:</p>
<ul>
<li><strong>Aider</strong> (done). Baseline, well-documented, scriptable.</li>
<li><strong>Claude Code.</strong> CLI-driven, programmable.</li>
<li><strong>Cline.</strong> VS Code extension; need headless invocation harness.</li>
<li><strong>OpenHands.</strong> Already designed for benchmarking; clean integration.</li>
<li><strong>Cursor.</strong> Closed CLI; need creative scripting or a cooperative integration.</li>
</ul>
<p>Output: a public leaderboard with per-language, per-repo, per-difficulty resolve rates and cost/time profiles. This is the artifact that makes the benchmark <em>useful</em> to buyers and <em>visible</em> to the field.</p>

<h3>Phase 2: Difficulty calibration from agent traces</h3>
<p>Current difficulty labels are heuristic over diff size, files touched, and PR keywords. After Phase 1, we have N agents × 682 tasks of trace data, enough to re-derive difficulty <em>empirically</em>.</p>
<p>A task that 7/8 frontier agents solve is "easy" regardless of its diff size. A task with 5 files changed that no agent can solve might be "easy in shape, hard in semantics", exactly the discrimination heuristic labels miss. Concretely: fit an item-response model (Rasch / 2PL) on the agent×task matrix to get a per-task discrimination and difficulty parameter, and a per-agent ability parameter. Drop tasks with zero discrimination. Re-label difficulty from the IRT difficulty parameter.</p>
<p>This is the part of the project that's actually <em>scientifically</em> interesting, and the part that ages best as frontier agents saturate the easy cases.</p>

<h3>Phase 3: Capability decomposition</h3>
<p>Pass/fail tells you that the agent solved (or didn't solve) the task. It doesn't tell you <em>why</em>. From the per-run trace we can decompose agent capability into sub-skills, each independently failable:</p>

<table>
<thead><tr><th>Sub-skill</th><th>How to measure from trace</th></tr></thead>
<tbody>
<tr><td><strong>Navigation</strong></td><td>Did the agent open the files actually relevant to the fix (overlap with <code>files_changed</code>)?</td></tr>
<tr><td><strong>Planning</strong></td><td>Did the agent state a plan before editing? Did the plan survive contact with the codebase?</td></tr>
<tr><td><strong>Edit precision</strong></td><td>Diff size vs. minimum-necessary diff. Edits that touch unrelated lines.</td></tr>
<tr><td><strong>Test interpretation</strong></td><td>Did the agent run tests, read output, and use it to course-correct?</td></tr>
<tr><td><strong>Failure recovery</strong></td><td>When an edit broke tests, did the agent diagnose and fix, or thrash?</td></tr>
</tbody>
</table>

<p>Per-agent capability profiles, not just a scalar score. An agent that's strong at navigation and weak at failure recovery has a very different product story than an agent that's the opposite.</p>

<h3>Phase 4: Contamination-resistant variant</h3>
<p>Even fresh PRs leak via training-data cutoffs as models update. The only durable mitigation is a <strong>rolling stream</strong>: a quarterly drop of new tasks curated from PRs merged <em>after</em> the latest model release. The contamination control is the publication-date filter.</p>
<p>Methodology piece: a contamination-detection probe per task. Ask the agent to recite the fix without seeing the codebase. High recitation accuracy on the unmodified test signals contamination and the task is flagged or dropped.</p>
</section>

<section id="open">
<span class="section-num">07 / OPEN QUESTIONS</span>
<h2>What the research has to answer</h2>

<ul>
<li><strong>Test-suite-as-oracle has limits.</strong> Tests can pass for the wrong reason (lucky edit, partial coverage, test that was already passing). How often does this happen, and can we detect it from the diff structure? This is the same problem the <a href="/proposal/ceval.html">causal-eval framework</a> attacks at the language-model level. Answers there transfer here.</li>
<li><strong>Heuristic difficulty labels are imperfect.</strong> Phase 2's IRT calibration gives us an empirical difficulty distribution, but does it match what humans label as "hard"? Disagreement is itself informative.</li>
<li><strong>How discriminative is the benchmark?</strong> Do two leading agents within 1% on a surface metric show distinguishable capability profiles? If not, the benchmark is a vanity scoreboard.</li>
<li><strong>Reproducibility under nondeterminism.</strong> Most agents are stochastic. Per-task variance across 5 reruns: how big is it, and what's the minimum N for a publishable ranking?</li>
<li><strong>Cost as a first-class dimension.</strong> A 60% resolve rate at $0.10/task may be more useful than a 70% resolve rate at $5/task. How do we surface this in a way that's robust to vendor pricing changes?</li>
<li><strong>Generalization claim.</strong> Does resolve rate on the 682 curated tasks correlate with resolve rate on a held-out fresh set? Phase 4's rolling stream provides the test set for this construct-validity claim.</li>
</ul>
</section>

<section id="deliverables">
<span class="section-num">08 / DELIVERABLES</span>
<h2>What ships</h2>
<ul>
<li><strong>Leaderboard report: multi-agent v1.</strong> 5+ agents × 682 tasks. Per-language, per-difficulty resolve rates. Cost and time profiles. Public, reproducible.</li>
<li><strong>Difficulty calibration paper.</strong> IRT-derived per-task discrimination and difficulty parameters. Comparison with heuristic labels. Recommended sub-benchmark stratification.</li>
<li><strong>Capability decomposition framework.</strong> Trace-derived sub-skill metrics with construct validity (sub-skill scores predict resolve rate on held-out tasks).</li>
<li><strong>Quarterly fresh-task drops.</strong> CodingAgentBench-2026Q3, Q4, etc. Each drop ships with a contamination report.</li>
<li><strong>Artifacts.</strong> Runner (Apache-2.0). Curated task corpus on HuggingFace (CC-BY-4.0). Adapter SDK so anyone can plug in their own agent.</li>
</ul>
</section>

<section id="timeline">
<span class="section-num">09 / TIMELINE</span>
<h2>Milestones</h2>
<p>Working weeks of effort. Phase 1 (adapter coverage + first multi-agent report) is the gating deliverable; everything else depends on having real trace data.</p>

<div class="callout callout-decision">
<div class="callout-title">Decision gate · first multi-agent report</div>
<p>Ship a leaderboard with at least 3 agents × full task set. <strong>If the leaderboard surfaces meaningful agent ordering and discriminates within 5% on at least one language, the benchmark is signal-bearing. Proceed.</strong> If all agents bunch within 2% or one agent saturates above 90%, the curated task set needs harder tasks before the rest of the agenda is worth running.</p>
</div>

<h3>Phase 1: Multi-agent leaderboard</h3>
<ol class="milestones">
<li><span class="ms-id">M1</span><div class="ms-body"><strong>Adapter sprint<span class="ms-week">3 wk</span></strong><p>Claude Code, Cline, OpenHands, Cursor adapters. Each implements <code>BaseAdapter</code>. Headless invocation, isolated workspace per task, deterministic trace capture.</p></div></li>
<li><span class="ms-id">M2</span><div class="ms-body"><strong>Sandboxed runner<span class="ms-week">2 wk</span></strong><p>Docker-per-task isolation. Repo state hermetic. Cost / time / token metering. Resume-from-checkpoint for long sweeps.</p></div></li>
<li><span class="ms-id">M3</span><div class="ms-body"><strong>v1 sweep + report<span class="ms-week">2 wk</span></strong><p>5 agents × 682 tasks × N=3 reruns. Public leaderboard page. Blog post / methodology writeup.</p></div></li>
</ol>

<h3>Phase 2: Difficulty calibration</h3>
<ol class="milestones">
<li><span class="ms-id">M4</span><div class="ms-body"><strong>IRT calibration<span class="ms-week">2 wk</span></strong><p>Fit a 2PL item-response model on the agent × task matrix. Per-task difficulty and discrimination. Drop zero-discrimination tasks.</p></div></li>
<li><span class="ms-id">M5</span><div class="ms-body"><strong>Re-stratification<span class="ms-week">1 wk</span></strong><p>New difficulty labels from IRT. Public comparison with heuristic labels. Sub-benchmark splits for fast iteration.</p></div></li>
</ol>

<h3>Phase 3: Capability decomposition</h3>
<ol class="milestones">
<li><span class="ms-id">M6</span><div class="ms-body"><strong>Trace schema + extractors<span class="ms-week">2 wk</span></strong><p>Common trace format across adapters. Extractors for navigation overlap, plan presence, edit precision, test interpretation, failure recovery.</p></div></li>
<li><span class="ms-id">M7</span><div class="ms-body"><strong>Construct validity<span class="ms-week">2 wk</span></strong><p>Show sub-skill scores predict resolve rate on held-out tasks better than baseline. Per-agent capability profiles published.</p></div></li>
</ol>

<h3>Phase 4: Contamination-resistant variant</h3>
<ol class="milestones">
<li><span class="ms-id">M8</span><div class="ms-body"><strong>Rolling stream pipeline<span class="ms-week">2 wk</span></strong><p>Automated quarterly curation from recent PRs in the same 35 repos. Date-filter against named model release dates. Contamination probe.</p></div></li>
<li><span class="ms-id">M9</span><div class="ms-body"><strong>First fresh drop<span class="ms-week">1 wk</span></strong><p>CodingAgentBench-fresh-2026Q3 (or current quarter). Published with contamination report and a head-to-head against the original 682.</p></div></li>
</ol>
</section>

<section id="limits">
<span class="section-num">10 / LIMITS</span>
<h2>Honest limits and what could kill the program</h2>
<ol>
<li><strong>Tests-as-oracle isn't gold.</strong> A diff can pass tests for the wrong reason (incidental, partial coverage, unrelated state). Phase 3's edit-precision metric partly compensates; ground truth comparison against the merged PR's diff is a backstop. This is also the bridge to the <a href="/proposal/ceval.html">causal-eval</a> agenda: same root problem, different layer.</li>
<li><strong>Cost of running.</strong> 5 agents × 682 tasks × 3 reruns × per-task ~$0.50–5 in API calls = $5K–50K per full sweep. Selective sub-benchmarks for fast iteration; full sweeps only at report milestones.</li>
<li><strong>Adapter parity is a real engineering tax.</strong> Each agent has a different invocation contract, different streaming semantics, different ways of failing. The benchmark's credibility lives or dies on adapter fidelity. Plan for ~1 week per non-trivial adapter, plus regression maintenance.</li>
<li><strong>Closed agents may not cooperate.</strong> Cursor in particular doesn't ship a clean headless mode. Workarounds (UI automation, cooperative API) may be brittle. May ship without Cursor in v1.</li>
<li><strong>Repo coverage isn't representative of all software.</strong> No mobile, no embedded, no SQL-only repos, no game engines. Worth flagging in every report.</li>
<li><strong>Difficulty labels (today) are heuristic.</strong> Until Phase 2 lands, the stratification is suggestive at best. Inter-rater agreement against a small human-labeled gold set would help.</li>
</ol>

<div class="callout callout-warn">
<div class="callout-title">What would kill the program</div>
<p><strong>Saturation.</strong> If 3 of 5 leading agents score above 85% on the full task set, the benchmark is a checkbox, not a signal. Phase 4's fresh-task stream is the response, but if even fresh PRs saturate fast, the format has shorter life than hoped.</p>
<p><strong>Bunching.</strong> If all agents score within 2% of each other, the benchmark isn't discriminating. Either the task pool needs harder tasks or the headline metric needs to shift to capability-decomposed profiles.</p>
<p><strong>Reproducibility collapse.</strong> If per-agent variance over 3 reruns exceeds inter-agent gaps, no ranking is publishable. Raise N or move to consensus voting.</p>
</div>
</section>

<section id="related">
<span class="section-num">11 / RELATED WORK</span>
<h2>Position relative to the field</h2>
<ul>
<li><strong>SWE-bench / SWE-bench Verified.</strong> Direct ancestor. CodingAgentBench's contribution over SWE-bench is multi-language breadth, freshness via rolling drops, and the capability-decomposition / IRT-calibration research layer.</li>
<li><strong>Aider polyglot benchmark.</strong> Multi-language but agent-specific and small. We borrow the multi-language commitment and generalize it to agent-agnostic, full-codebase tasks.</li>
<li><strong>LiveCodeBench, BigCodeBench, HumanEval, MBPP.</strong> Code-generation benchmarks. Solving them is necessary but not sufficient for agent quality; CodingAgentBench tests the wrapper, not just the model.</li>
<li><strong>AgentBench / WebArena / OSWorld.</strong> Broader agent benchmarks; coding is one of many domains. We go narrow and deep on coding specifically.</li>
<li><strong>Chatbot Arena.</strong> The format inspiration: public, leaderboard-shaped, community-trusted. We aim for the same role in the coding-agent space.</li>
</ul>
</section>

<section id="status">
<span class="section-num">12 / STATUS</span>
<h2>Where this is now</h2>
<p>Phase 0 substrate is shipped: 682 tasks, CLI, runner, Aider adapter, Pydantic models, JSON task corpus. The next concrete deliverable is the <strong>multi-agent v1 sweep</strong>: 3–5 agents on the full task set, public leaderboard. Everything in the research agenda (calibration, capability decomposition, fresh-task stream) is downstream of having that trace data.</p>
<p>Sibling proposal, same author, related thesis at the language-model layer: <a href="/proposal/ceval.html"><code>causal-eval-framework</code></a>.</p>
<p>Repository: <a href="https://github.com/divyanshugit"><code>github.com/divyanshugit/codingagentbench</code></a> (private during early iteration; public at first multi-agent report release).</p>
<p>Contact: <a href="mailto:kumardivy1999@gmail.com">kumardivy1999 [at] gmail.com</a></p>
<p class="proposal-footer">This page is a working document. It will move as the experiments teach us what's real.</p>
</section>

</main>
</div>
</div>
