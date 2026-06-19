---
layout: page.njk
title: "Research Proposal: Causal Evaluation of Language Models"
pageTitle: "Causal Evaluation of Language Models"
subtitle: "Eval suites that measure mechanisms, not correlations. A three-phase research program."
permalink: /proposal/ceval.html
hasMath: true
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
<li><a href="#scoring"><span class="toc-num">03</span>Scoring model</a></li>
<li><a href="#task-example"><span class="toc-num">04</span>Example task</a></li>
<li><a href="#interventions"><span class="toc-num">05</span>Interventions</a></li>
<li><a href="#principles"><span class="toc-num">06</span>P1–P7 principles</a></li>
<li><a href="#agenda"><span class="toc-num">07</span>Research agenda</a></li>
<li><a href="#deliverables"><span class="toc-num">08</span>Deliverables</a></li>
<li><a href="#timeline"><span class="toc-num">09</span>Timeline</a></li>
<li><a href="#cross"><span class="toc-num">10</span>Open questions</a></li>
<li><a href="#limits"><span class="toc-num">11</span>Honest limits</a></li>
<li><a href="#whynow"><span class="toc-num">12</span>Why now</a></li>
<li><a href="#related"><span class="toc-num">13</span>Related work</a></li>
<li><a href="#references"><span class="toc-num">14</span>References</a></li>
<li><a href="#status"><span class="toc-num">15</span>Status</a></li>
</ol>
</aside>

<main class="proposal-body">

<section id="tldr" class="proposal-hero">
<h2>TL;DR</h2>
<p class="lead">Two models tie on MMLU. One reasons. One pattern-matches. Leaderboards can't see the difference. I propose a research program that treats every evaluation as a <em>causal claim</em> and scores models on whether they get answers right <strong>for the right reason</strong>.</p>
<p>The framework, <code>causal-eval-framework</code> (<code>ceval</code>), runs <em>do-interventions</em> over features of causally-annotated tasks and reports</p>
<p class="math-display">$$\text{causal_score} \;=\; \text{accuracy} \,\times\, \text{mechanism_fidelity}.$$</p>
<p>The proposal spans three phases:</p>
<ol class="phase-list">
<li><strong>SLMs as calibration lab.</strong> Establish mechanism-fidelity scaling curves with activation-level ground truth on open-weight models.</li>
<li><strong>Behavioral calibration → closed models.</strong> Measure how well prompt-level interventions correlate with activation-level truth, then apply the calibrated suite to frontier models with confidence bounds.</li>
<li><strong>Agentic mechanism fidelity.</strong> Reward hacking, tool-use mechanism, and agentic CoT faithfulness, where trajectory observables make behavioral evidence sufficient.</li>
</ol>
<p class="hero-footer">Target deliverables: two papers, a reusable runner (Apache-2.0), annotated datasets (CC-BY-4.0), and a public leaderboard with calibrated confidence intervals.</p>
</section>

<section id="problem">
<span class="section-num">01 / THE PROBLEM</span>
<h2>Outputs are not mechanisms</h2>
<p>A canonical scene from current benchmarking practice:</p>
<blockquote>Model A and Model B both score 0.82 on MMLU. Model A arrives at correct answers by composing facts. Model B arrives at correct answers by exploiting positional bias in the answer choices, surface lexical overlap with the question stem, and overrepresentation of certain answer letters in the training distribution. On the leaderboard they are indistinguishable.</blockquote>
<p>This is broken in both directions:</p>
<ul>
<li><strong>False positives.</strong> The model memorized the test, pattern-matched a shortcut, or got lucky. Still scores.</li>
<li><strong>False negatives.</strong> The model used correct reasoning but stumbled on output format. Doesn't score.</li>
</ul>
<p>The literature has documented this for years (<em>Right for the Wrong Reasons</em>, McCoy et al., ACL 2019; Goodhart's Law in optimization; shortcut learning, Geirhos et al., 2020) yet evaluation practice has barely moved. Vendors still publish MMLU and call it a day; buyers still treat the score as a signal of capability.</p>
<p>The downstream cost is real. A pattern-matcher and a reasoner with identical leaderboard scores will diverge sharply on out-of-distribution inputs, on adversarial inputs, and on the long tail of real deployments. Buyers cannot price this divergence because the benchmark hides it.</p>
</section>

<section id="thesis">
<span class="section-num">02 / THESIS</span>
<h2>An eval is a causal claim</h2>
<blockquote>Model $M$ on task $T$ produces answer $A$ <em>because</em> feature $F$ in the input drives mechanism $\mu$ which produces $A$. Intervene on $F$ or disrupt $\mu$, and the answer must change in a predictable way.</blockquote>
<p>Current evals check only $A$. A causal eval checks the whole chain.</p>
<p>This is not new vocabulary. It borrows directly from Pearl's do-calculus and the causal-abstraction line of work (Geiger, Wu, Potts, et al., 2021, 2024). What is new is the operationalization: a runnable framework that turns the causal claim into a falsifiable, automated metric and applies it across a model ladder.</p>
</section>

<section id="scoring">
<span class="section-num">03 / SCORING MODEL</span>
<h2>From outputs to mechanism fidelity</h2>
<p>A task declares a small structural causal model (SCM) over input features and a reference outcome function $f_H$. For each task, the framework runs the base prompt and a set of $\mathrm{do}(\cdot)$ interventions, then reports:</p>

<h3>3.1 Accuracy</h3>
<p class="math-display">$$\text{accuracy} \;=\; \mathbf{1}\{M(\mathbf{x}) \approx f_H(\mathbf{x})\}.$$</p>
<p>Binary exact-match on the unperturbed prompt. A prefactor: a model that cannot produce the base answer should not earn mechanism credit for behaving consistently in the wrong world.</p>

<h3>3.2 Sensitivity <span class="subtle">(necessity analogue)</span></h3>
<p class="math-display">$$\text{sensitivity} \;=\; \frac{1}{|I_S|} \sum_{i \in I_S} \mathbf{1}\{M(\mathbf{x}'_i) \approx f_H(\mathbf{x}'_i)\}.$$</p>
<p>For interventions where $f_H$ predicts the answer changes, does the model's answer change in the predicted way? Corresponds to Pearl's <em>probability of necessity</em> under controlled intervention.</p>

<h3>3.3 Invariance <span class="subtle">(specificity analogue)</span></h3>
<p class="math-display">$$\text{invariance} \;=\; \frac{1}{|I_V|} \sum_{i \in I_V} \mathbf{1}\{M(\mathbf{x}'_i) \approx f_H(\mathbf{x})\}.$$</p>
<p>For interventions where $f_H$ predicts the answer is stable (paraphrases, irrelevant noise), does the model stay stable?</p>

<h3>3.4 Individual Causal Effect (ICE) match</h3>
<p class="math-display">$$\Delta_H^i = f_H(\mathbf{x}'_i) - f_H(\mathbf{x}), \qquad \Delta_M^i = M(\mathbf{x}'_i) - M(\mathbf{x}),$$</p>
<p class="math-display">$$\text{ice}_i \;=\; \mathbf{1}\{\,|\Delta_M^i - \Delta_H^i| \lt \varepsilon\,\}.$$</p>
<p>ICE is independent of absolute accuracy. A model that is wrong by a constant offset but moves the <em>right amount</em> under intervention passes ICE, separating <em>wrong arithmetic, right mechanism</em> from <em>right arithmetic, wrong mechanism</em>.</p>

<h3>3.5 Mechanism fidelity</h3>
<p class="math-display">$$\text{mechanism_fidelity} \;=\; \frac{2 \cdot S \cdot I}{S + I}.$$</p>
<p>Harmonic mean of sensitivity and invariance. Why harmonic, not arithmetic? The arithmetic mean awards $0.5$ to a constant-outputting model ($S=0$, $I=1$), which is exactly the failure mode the metric must catch. Harmonic gives such a model $0$. Same argument that motivates F1 over mean accuracy in classification (van Rijsbergen, 1979).</p>

<h3>3.6 Composite causal score</h3>
<p class="math-display">$$\text{causal_score} \;=\; \text{accuracy} \times \text{mechanism_fidelity}.$$</p>
<p>Multiplication (not averaging) encodes that base correctness and mechanism consistency are <em>conjoint</em> requirements: failing either zeroes the score.</p>

<div class="callout callout-info">
<div class="callout-title">Intuition</div>
A model at <code>0.95 × 0.30</code> is a shortcut learner. A model at <code>0.95 × 0.90</code> is a reasoner. Today's leaderboards report only the first factor.
</div>
</section>

<section id="task-example">
<span class="section-num">04 / EXAMPLE TASK</span>
<h2>A causal-annotated task</h2>
<pre><code class="language-yaml">task_id: gsm8k-123-causal
prompt: |
  A store sells apples at $2 each and oranges at $3 each.
  If Alice buys 4 apples and 3 oranges, how much does she pay?

expected_answer: 17

causal_hypothesis:
  mechanism: arithmetic_composition
  computation: (apple_price * apple_count) + (orange_price * orange_count)

dag:
  causes: [apple_price, apple_count, orange_price, orange_count]
  irrelevant: [clothing, weather, alice_age]

interventions:
  - type: value_swap
    feature: apple_price
    new_value: 5
    expected_new_answer: 29     # derived from `computation`, not authored

  - type: irrelevant_noise
    addition: "Alice is wearing a red hat."
    rationale: "Clothing is not in the DAG; mechanism predicts invariance."

  - type: structure_preserving_paraphrase
    new_prompt: "At $2/apple and $3/orange, 4 apples and 3 oranges total?"

alternative_hypotheses:
  - name: last_number_heuristic
    computation: orange_count
</code></pre>
<p>The runner executes base + each intervention and scores the model on whether responses match the predicted causal pattern. Expected answers are <em>derived</em> from <code>computation</code>, not authored, so annotator error is removed from the loop and the SCM becomes falsifiable.</p>
</section>

<section id="interventions">
<span class="section-num">05 / INTERVENTIONS</span>
<h2>Intervention taxonomy</h2>

<h4>Prompt-level <span class="subtle">: all models</span></h4>
<table>
<thead><tr><th>Type</th><th>Tests</th></tr></thead>
<tbody>
<tr><td>Value swap</td><td>Compositional reasoning vs. memorization</td></tr>
<tr><td>Irrelevant noise</td><td>Robustness to spurious features</td></tr>
<tr><td>Structure-preserving paraphrase</td><td>Surface-form dependency</td></tr>
<tr><td>Counterfactual confounder</td><td>Shortcut learning</td></tr>
<tr><td>Decomposition probe</td><td>Chain-of-thought faithfulness</td></tr>
</tbody>
</table>

<h4>Activation-level <span class="subtle">: open-weight models</span></h4>
<table>
<thead><tr><th>Type</th><th>Tests</th></tr></thead>
<tbody>
<tr><td>Circuit ablation</td><td>Whether the predicted mechanism is <em>necessary</em></td></tr>
<tr><td>Feature injection (SAE)</td><td>Whether the predicted mechanism is <em>sufficient</em></td></tr>
</tbody>
</table>

<h4>Agent-level <span class="subtle">: Phase 3</span></h4>
<table>
<thead><tr><th>Type</th><th>Tests</th></tr></thead>
<tbody>
<tr><td>Tool-description perturbation</td><td>Does the agent notice, or confabulate?</td></tr>
<tr><td>Tool-misuse injection</td><td>Does the agent catch lying tools?</td></tr>
<tr><td>Proxy/objective divergence</td><td>Reward-hacking rate</td></tr>
<tr><td>Tool-call rationale faithfulness</td><td>Does the stated reason match the call?</td></tr>
</tbody>
</table>
</section>

<section id="principles">
<span class="section-num">06 / PRINCIPLES</span>
<h2>P1–P7 principled intervention design</h2>
<p>The metric only means what it means if the <em>intervention set</em> is designed to test mechanism, not cherry-picked to look impressive. The framework enforces seven principles via schema + a <code>ceval validate</code> pass:</p>
<ul>
<li><strong>P1. Machine-checkable mechanisms.</strong> Every task declares <code>computation</code>: an evaluable expression over <code>features</code> (Python-restricted AST, whitelisted operators). Expected answers are derived, not authored.</li>
<li><strong>P2. Explicit DAG.</strong> Tasks declare <code>dag.causes</code> and <code>dag.irrelevant</code>. The validator enforces that <code>computation</code> references only <code>causes</code> and never <code>irrelevant</code>.</li>
<li><strong>P3. Coverage of causal pathways.</strong> Every feature in <code>dag.causes</code> must appear in at least one sensitivity intervention. No silent pathways.</li>
<li><strong>P4. Invariance requires a stated reason.</strong> Every paraphrase / irrelevant-noise intervention carries a <code>rationale</code> field stating <em>why</em> the perturbation is non-causal under the DAG. "Paraphrase" alone is not a rationale.</li>
<li><strong>P5. Falsification against named alternatives.</strong> Tasks declare <code>alternative_hypotheses</code> (named shortcut theories). Interventions declare <code>discriminates: [name]</code> to state they separate the true mechanism from the alternative. Tasks with declared alternatives and at least one discriminating intervention have genuine falsificatory power, not just robustness testing.</li>
<li><strong>P6. Isolation by default.</strong> Value swaps change one feature at a time unless explicitly modeling an interaction.</li>
<li><strong>P7. Identifiability is trivial; say so.</strong> Because we construct every prompt, every $\mathrm{do}(\cdot)$ is controlled. There are no hidden confounders. Unlike causal inference on observed data we don't need instrumental variables or backdoor adjustment. The claims derive their strength from <em>experimental control</em>, not from identification proofs. Stating this prevents readers from confusing the setting with observational causal inference.</li>
</ul>
<p><code>ceval validate tasks/</code> runs all these checks. <code>--strict</code> promotes warnings to errors. Tasks that don't pass <code>validate</code> are rejected before any inference runs.</p>
</section>

<section id="agenda">
<span class="section-num">07 / AGENDA</span>
<h2>Three-phase research agenda</h2>

<div class="phase-grid">
<div class="phase-card">
<span class="phase-tag">Phase 1</span>
<h5>SLMs as calibration lab</h5>
<p>Open-weight ladder + activation access → mechanism-fidelity scaling curves and per-family shortcut taxonomies with substrate-level ground truth.</p>
</div>
<div class="phase-card">
<span class="phase-tag">Phase 2</span>
<h5>Behavioral calibration</h5>
<p>Correlate behavioral interventions with activation-level truth on SLMs. Deploy the calibrated suite to closed frontier models with explicit confidence bounds.</p>
</div>
<div class="phase-card">
<span class="phase-tag">Phase 3</span>
<h5>Agentic mechanism fidelity</h5>
<p>Reward hacking, tool-use mechanism, agentic CoT faithfulness. Trajectory observables make behavioral evidence sufficient at the frontier.</p>
</div>
</div>

<h3>Phase 1: SLMs as calibration lab</h3>
<p>Small open-weight models are where ground truth lives: activation access, fine-tuning control, known scaling ladders, published teacher-student pairs.</p>
<p><strong>Model selection.</strong> Two study sets in the registry, answering different questions:</p>
<ul>
<li><strong><code>scale-qwen</code>.</strong> Qwen 2.5 ladder (0.5B / 1.5B / 3B / 7B), plus Qwen 3.5 (0.8B / 2B / 4B). Same family, same recipe, just size. Supports a clean <em>mechanism-fidelity scaling curve</em> with no training-regime confound.</li>
<li><strong><code>diversity</code>.</strong> Cross-family set: Qwen 3.5, Gemma (4-E2B, 3n-E4B/E2B, 2-2B), Phi (3.5-mini, 3-mini variants), Llama 3.2 (1B, 3B), Liquid LFM 2.5-1.2B. Supports family / training-recipe effect analysis.</li>
</ul>
<p>Phase 1's paper uses <code>scale-qwen</code> for the headline scaling curve and <code>diversity</code> for the "does this hold cross-family?" robustness section.</p>
<p><strong>Headline questions:</strong></p>
<ul>
<li>Is there a <em>mechanism-fidelity scaling curve</em>? Does causal faithfulness grow smoothly, or is there a phase transition?</li>
<li><strong>Shortcut taxonomy per family</strong>: do Phi, Llama, and Qwen fail via different mechanism classes? Is the shortcut profile a more discriminative signature than a raw scalar score?</li>
<li><strong>Distillation fidelity</strong>: does a student inherit the teacher's mechanisms, or just its outputs?</li>
<li><strong>Reasoning-RL ablation</strong>: Qwen 2.5 base vs. QwQ. Does reasoning-RL produce causal reasoning, or high-fidelity hallucination of reasoning?</li>
</ul>
<p><strong>Activation-level validation.</strong> Prompt-level interventions are suggestive of mechanism; circuit ablation and SAE feature injection are <em>causal evidence at the substrate</em>. On open-weight models we can ablate the predicted circuit and check that the model fails on tasks tagged with that mechanism but not others, closing the gap between behavior and mechanism.</p>

<h3>Phase 2: Behavioral calibration → closed models</h3>
<p>Activation access is only available on open-weight models. To make causal scoring useful for the closed frontier, we need to know <em>how predictive behavioral interventions are of true mechanism</em>.</p>
<p>For each prompt-level intervention (value swap, paraphrase, noise, decomposition probe), measure its correlation with activation-level ground truth on Phase 1's SLMs. Publish the correlation. Now every intervention has a <strong>known predictive strength</strong>. Apply the behavioral suite to closed frontier models with <strong>calibrated confidence bounds</strong>:</p>
<blockquote>"Behavioral score $X$ maps to true mechanism fidelity $Y \pm 0.12$, based on SLM calibration ($n=\ldots$, $r^2 = \ldots$)."</blockquote>
<p>That is a defensible scientific claim. No one currently has it for any closed model.</p>
<div class="callout callout-warn">
<div class="callout-title">Honest limits, flagged in every closed-model report</div>
<p><strong>Phase transitions.</strong> Mechanisms at 3B may not exist at 400B. Calibration extrapolation across scales is the main external validity threat.</p>
<p><strong>Architectural shifts.</strong> MoE, non-dense variants, latent-reasoning architectures need separate calibration runs.</p>
<p><strong>Scale-dependent shortcuts.</strong> Sycophancy, long-context drift, certain hallucination modes don't exist at SLM scale; new interventions are needed at the frontier.</p>
</div>

<h3>Phase 3: Agentic mechanism fidelity</h3>
<p>Mechanism fidelity <em>is</em> the anti-Goodhart measure. Agents give the richest causal substrate: every tool call, argument, intermediate result is observable and interveneable. Three research threads:</p>
<ol>
<li><strong>Reward hacking as a measurable phenomenon.</strong> A benchmark of proxy/objective divergence pairs across domains (code, task completion, knowledge). Report a per-model <em>Goodhart rate</em>: the fraction of runs in which the agent exploits the proxy at the expense of the true objective.</li>
<li><strong>Tool-use mechanism.</strong> Does the agent plan, or pattern-match training trajectories? Interventions: tool-description perturbation (rename, paraphrase, falsify), tool-misuse injection (tools that lie or silently fail), tool-call rationale faithfulness (does the stated reason match what the call accomplishes?).</li>
<li><strong>Agentic CoT faithfulness.</strong> Does reasoning spanning multiple tool calls drive the next action, or narrate a decision already made? Adapt single-turn CoT faithfulness probes (Lanham et al., 2023; Turpin et al., 2023) to multi-step trajectories.</li>
</ol>
<p>On agent behaviors, <strong>behavioral evidence is sufficient</strong>: trajectory observables are rich enough that activation access isn't required. This is where frontier models become the primary target. Reward hacking is a frontier-scale phenomenon and the public evidence base for it is still thin (Apollo's scheming demos, Anthropic's agentic-misalignment work, OpenAI's spec-gaming reports), narrative-rich but quantitatively sparse.</p>
</section>

<section id="deliverables">
<span class="section-num">08 / DELIVERABLES</span>
<h2>What ships</h2>
<ul>
<li><strong>Paper 1.</strong> <em>Mechanism-fidelity scaling curves and the calibration of behavioral causal interventions.</em> Headline figure: mechanism fidelity vs. parameter count across the Qwen ladder, with activation-level ground truth.</li>
<li><strong>Paper 2.</strong> <em>Agent mechanism fidelity: reward hacking, tool-use, and agentic chain-of-thought faithfulness.</em> Positioned against existing agentic-safety work as the first systematic measurement framework.</li>
<li><strong>Artifacts.</strong> <code>ceval</code> runner (Apache-2.0). Annotated datasets (GSM8K-Causal, MMLU-Causal subsets) on HuggingFace Datasets (CC-BY-4.0). Public leaderboard with calibrated confidence intervals.</li>
</ul>
</section>

<section id="timeline">
<span class="section-num">09 / TIMELINE</span>
<h2>Milestones</h2>
<p>Working weeks of effort, not calendar weeks. Phases run partly in parallel: Phase 3 can be kicked off as soon as the Phase 1 runner is stable.</p>

<div class="callout callout-decision">
<div class="callout-title">Decision gate · Milestone 0</div>
<p>20 GSM8K problems, hand-annotated. Minimal runner. SLM ladder (Qwen 2.5 0.5B–7B + Llama 3.2 1B/3B + Phi-3.5-mini). Plot mechanism fidelity vs. parameter count. <strong>Visible structure → continue. Flat or noisy → diagnose before scaling effort.</strong> The whole proposal is conditional on this one figure.</p>
</div>

<h3>Phase 1</h3>
<ol class="milestones">
<li><span class="ms-id">M1</span><div class="ms-body"><strong>Schema + runner hardened<span class="ms-week">2 wk</span></strong><p>Typed YAML schema, pydantic v2 models, batched vLLM inference with disk cache, model adapters (vLLM, HF Transformers, OpenAI/Anthropic/Gemini), CLI (<code>ceval run</code>, <code>validate</code>, <code>analyze</code>), scoring unit tests.</p></div></li>
<li><span class="ms-id">M2</span><div class="ms-body"><strong>Annotated set scale-up<span class="ms-week">2 wk</span></strong><p>GSM8K-Causal-100, MMLU-Causal subset (knowledge-probing mechanism class), expanded intervention types, semi-automated annotator (~10 min human time per task), inter-annotator agreement on 20 tasks.</p></div></li>
<li><span class="ms-id">M3</span><div class="ms-body"><strong>Activation-level interventions<span class="ms-week">2 wk</span></strong><p>Integrate <code>transformer_lens</code> / <code>nnsight</code>, circuit ablation, feature injection via Gemma Scope / Llama Scope SAEs. <em>Publishable figure: mechanism fidelity vs. parameter count with activation-level ground truth.</em></p></div></li>
<li><span class="ms-id">M4</span><div class="ms-body"><strong>Training-strategy experiments<span class="ms-week">2 wk · optional</span></strong><p>Process- vs. outcome-supervised fine-tuning on causal-annotated tasks; Qwen 2.5 base vs. QwQ delta; teacher→student distillation fidelity on published pairs.</p></div></li>
</ol>

<h3>Phase 2</h3>
<ol class="milestones">
<li><span class="ms-id">M5</span><div class="ms-body"><strong>Calibration study<span class="ms-week">2 wk</span></strong><p>Per-intervention correlation with activation-level ground truth across SLMs. Confidence-bound methodology. Sensitivity analysis across families.</p></div></li>
<li><span class="ms-id">M6</span><div class="ms-body"><strong>Closed-model deployment<span class="ms-week">2 wk</span></strong><p>GPT-4o-class, Claude Sonnet 4.6, Gemini 2.5, Grok. Case study: two frontier models near-identical on MMLU, divergent on causal profile.</p></div></li>
<li><span class="ms-id">M7</span><div class="ms-body"><strong>Public release v0.1<span class="ms-week">1 wk</span></strong><p>HF dataset cards, reproducibility (pinned versions, seeds, deterministic sampling), leaderboard, Paper 1 draft.</p></div></li>
</ol>

<h3>Phase 3</h3>
<ol class="milestones">
<li><span class="ms-id">M8</span><div class="ms-body"><strong>Agent runner foundation<span class="ms-week">2 wk</span></strong><p>Agent-specific YAML extensions, trajectory-aware scorer, tool-execution sandbox, port <code>causal_score</code> to the trajectory setting.</p></div></li>
<li><span class="ms-id">M9</span><div class="ms-body"><strong>Reward-hacking benchmark<span class="ms-week">2–3 wk</span></strong><p>20–30 proxy/objective divergence pairs, per-pair Goodhart rate, run against SLM and frontier agents. <em>First published per-model Goodhart rate table.</em></p></div></li>
<li><span class="ms-id">M10</span><div class="ms-body"><strong>Tool-use mechanism<span class="ms-week">2 wk</span></strong><p>Tool-description perturbation, tool-misuse injection, rationale faithfulness. Planning-claimed models (o1-class, Claude with extended thinking) vs. non-planning agents.</p></div></li>
<li><span class="ms-id">M11</span><div class="ms-body"><strong>Agentic CoT faithfulness<span class="ms-week">2 wk</span></strong><p>Multi-step adaptation of single-turn faithfulness probes. Case study of post-hoc vs. load-bearing reasoning.</p></div></li>
<li><span class="ms-id">M12</span><div class="ms-body"><strong>Paper 2 draft<span class="ms-week">1 wk</span></strong></div></li>
</ol>
</section>

<section id="cross">
<span class="section-num">10 / OPEN QUESTIONS</span>
<h2>Cross-cutting research questions</h2>
<p>These run through the whole program, not any single milestone:</p>
<ul>
<li>Does <code>causal_score</code> correlate with OOD / distribution-shift performance <em>better than raw accuracy</em>? This is the construct-validity claim that justifies the metric over existing benchmarks.</li>
<li>Do two models within 1% on a surface benchmark show <em>discriminable</em> causal profiles? (Discriminative power: what the framework actually buys you.)</li>
<li>How stable are intervention results across reruns? (Reproducibility.)</li>
<li>How much do two independent annotators agree on <code>causal_hypothesis</code>? (Annotator reliability.)</li>
<li>Does the framework recover known shortcut behaviors (e.g. McCoy-style HANS heuristics) as a sanity check?</li>
<li>Is there a phase transition in mechanism fidelity as a function of scale? Where, and is it stable across families?</li>
<li>Does reasoning-RL produce new mechanisms, or amplify existing ones?</li>
</ul>
</section>

<section id="limits">
<span class="section-num">11 / LIMITS</span>
<h2>Honest limits and what could kill the program</h2>
<p>Stated up front, not buried in supplementary:</p>
<ol>
<li><strong>Exact match is binary; real answers are graded.</strong> An off-by-one numeric answer earns zero. A task-appropriate distance metric is queued; for now, ICE partly compensates.</li>
<li><strong>No sampling variance in v0.</strong> Greedy decoding (temperature = 0) is the default. At $T \gt 0$ each intervention defines a distribution and proper inference requires multi-sample estimation with bootstrap or Wilson CIs. Mentioned in the limitations section of every result.</li>
<li><strong>No explicit paired-intervention PNS.</strong> Pearl's joint probability of necessity and sufficiency requires treatment/control pairing per item. Can be added via a <code>pair_id</code> schema field; not yet implemented.</li>
<li><strong>Hypothesis uniqueness is assumed.</strong> Each task declares one mechanism. The <code>alternative_hypotheses</code> schema is the first step toward multi-hypothesis scoring.</li>
<li><strong>DAG correctness is assumed.</strong> If the declared mechanism is wrong, the score measures consistency with a wrong model. Sensitivity analysis under DAG misspecification is deferred.</li>
<li><strong>Behavioral evidence is suggestive, not decisive.</strong> Until Phase 1 activation-level work lands, prompt-level interventions tell us about behavior, not mechanism. Closing that gap on SLMs is the whole point of Phase 1.</li>
</ol>

<div class="callout callout-warn">
<div class="callout-title">What would kill the program</div>
<p><strong>No scaling curve.</strong> If <code>causal_score</code> is flat (or noisy) across the SLM ladder, the framework is not adding signal. Milestone 0 surfaces this in week one.</p>
<p><strong>No behavioral→activation correlation.</strong> If prompt-level interventions don't correlate with activation-level truth, Phase 2's calibration story collapses and the program is reduced to "another robustness benchmark."</p>
<p><strong>Discriminative power too low.</strong> If models close on MMLU are also close on <code>causal_score</code>, the metric isn't adding information for the buyer use case.</p>
</div>
<p>Each of these is an empirical question with an early decision gate. The program is structured so the most expensive work (closed-model deployment, agent track) only fires <em>after</em> the cheap experiments justify it.</p>
</section>

<section id="whynow">
<span class="section-num">12 / WHY NOW</span>
<h2>The moment is right</h2>
<ol>
<li><strong>Mechanistic interpretability is finally industrial-grade.</strong> Gemma Scope and Llama Scope SAEs, plus mature interpretability libraries (<code>transformer_lens</code>, <code>nnsight</code>), make activation-level interventions a one-week engineering task rather than a multi-month research project. Phase 1's ground truth is now within reach.</li>
<li><strong>The closed-model frontier is opaque enough that calibration is the only honest path.</strong> As mechanism-level access disappears at the frontier, the alternative is either (a) no causal claims about closed models, or (b) calibrated behavioral inference. (b) is the more useful position.</li>
<li><strong>The agent literature has run ahead of its evaluation methodology.</strong> Reward hacking, scheming, sycophancy, sandbagging: the <em>demonstrations</em> are vivid; the <em>measurement</em> is qualitative. Phase 3 fills that gap.</li>
</ol>
</section>

<section id="related">
<span class="section-num">13 / RELATED WORK</span>
<h2>Position relative to three lines</h2>
<ul>
<li><strong>Behavioral robustness benchmarks.</strong> Adversarial NLI, HANS, checklist-style robustness suites. <em>Strength:</em> scalable behavioral tests. <em>Weakness:</em> no causal interpretation; no link to mechanism.</li>
<li><strong>Mechanistic interpretability and causal abstraction.</strong> Geiger, Wu, Potts, et al. (2021, 2024); circuit-level work from Anthropic, DeepMind, EleutherAI; SAE feature circuits. <em>Strength:</em> mechanism-level evidence. <em>Weakness:</em> per-paper, model-specific findings; no benchmark with broad coverage; no calibration to behavioral observables.</li>
<li><strong>Agent safety evaluation.</strong> Apollo (scheming), Anthropic (agentic misalignment), OpenAI (spec gaming), AgentBench / SWE-Bench / AgentHarm / Agent-SafetyBench. <em>Strength:</em> rich phenomenology. <em>Weakness:</em> aggregate scalar scores; little systematic causal probing of <em>why</em> agents fail.</li>
</ul>
<p>The contribution of this proposal is to <strong>bridge these three</strong> with a runnable, calibratable framework that produces falsifiable causal claims about model behavior, and to apply that bridge across an SLM ladder, a calibrated closed-model deployment, and an agentic track.</p>
</section>

<section id="references">
<span class="section-num">14 / REFERENCES</span>
<h2>Citable reference points</h2>
<ul>
<li><strong>Causal abstraction.</strong> Geiger, Wu, Potts, et al. <em>Inducing Causal Structure for Interpretable Neural Networks</em> (ICML 2021); <em>Interpretability at Scale</em> (2024).</li>
<li><strong>Probabilities of necessity / sufficiency.</strong> Pearl, <em>Causality</em> (2009), Ch. 9.</li>
<li><strong>Individual Causal Effects.</strong> Imbens &amp; Rubin, <em>Causal Inference for Statistics, Social, and Biomedical Sciences</em> (2015), Ch. 1–2.</li>
<li><strong>Harmonic aggregation rationale.</strong> Van Rijsbergen, <em>Information Retrieval</em> (1979), Ch. 7.</li>
<li><strong>Shortcut learning and right-for-the-right-reasons.</strong> McCoy et al., <em>Right for the Wrong Reasons</em> (ACL 2019); Geirhos et al. (<em>Nature Machine Intelligence</em>, 2020); Jacovi &amp; Goldberg (ACL 2020).</li>
<li><strong>CoT faithfulness.</strong> Lanham et al. (2023); Turpin et al. (2023).</li>
<li><strong>SAE features for causal interventions.</strong> Gemma Scope (DeepMind); Llama Scope (EleutherAI).</li>
</ul>
</section>

<section id="status">
<span class="section-num">15 / STATUS</span>
<h2>Where this is now</h2>
<p>Early. Schema, validator, scorer, vLLM runner, and CLI are in place. The next concrete deliverable is <strong>Milestone 0</strong>: GSM8K-Causal-20 across the SLM ladder, one figure plotting mechanism fidelity vs. parameter count. Everything in this proposal is conditional on that figure showing visible structure.</p>
<p>Repository: <a href="https://github.com/divyanshugit"><code>github.com/divyanshugit/causal-eval-framework</code></a> (private during early iteration; public at Paper 1 release).</p>
<p>Contact: <a href="mailto:kumardivy1999@gmail.com">kumardivy1999 [at] gmail.com</a></p>
<p class="proposal-footer">This page is a working document. It will move as the experiments teach us what's real.</p>
</section>

</main>
</div>
</div>
