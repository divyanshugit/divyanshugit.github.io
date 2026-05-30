---
layout: page.njk
title: "Research Proposal — Temporal Dynamics of Safety in Diffusion LMs"
pageTitle: "Temporal Safety in Diffusion LMs"
subtitle: "Diffusion language models generate by denoising, not left-to-right. Safety is a property of the trajectory — so measure it, and intervene, step by step."
permalink: /proposal/diffusion.html
hasMath: true
hasCode: true
extraCss:
  - proposal.css
eleventyExcludeFromCollections: true
sitemap:
  ignore: true
---

<div class="proposal">

<p class="proposal-meta">Divyanshu Kumar &middot; Working draft, last updated 2026-06-17 &middot; <a href="https://github.com/divyanshugit">github.com/divyanshugit</a></p>

<div class="proposal-grid">

<aside class="proposal-toc">
<h4>Contents</h4>
<ol>
<li><a href="#tldr"><span class="toc-num">00</span>TL;DR</a></li>
<li><a href="#problem"><span class="toc-num">01</span>The problem</a></li>
<li><a href="#thesis"><span class="toc-num">02</span>Thesis</a></li>
<li><a href="#metrics"><span class="toc-num">03</span>Temporal metrics</a></li>
<li><a href="#agenda"><span class="toc-num">04</span>Research agenda</a></li>
<li><a href="#deliverables"><span class="toc-num">05</span>Deliverables</a></li>
<li><a href="#timeline"><span class="toc-num">06</span>Timeline</a></li>
<li><a href="#open"><span class="toc-num">07</span>Open questions</a></li>
<li><a href="#limits"><span class="toc-num">08</span>Honest limits</a></li>
<li><a href="#whynow"><span class="toc-num">09</span>Why now</a></li>
<li><a href="#related"><span class="toc-num">10</span>Related work</a></li>
<li><a href="#status"><span class="toc-num">11</span>Status</a></li>
</ol>
</aside>

<main class="proposal-body">

<section id="tldr" class="proposal-hero">
<h2>TL;DR</h2>
<p class="lead">Autoregressive models generate one token at a time, and every safety tool we have — alignment training, guardrails, refusal behavior — assumes that left-to-right shape. Diffusion language models (LLaDA, Dream-7B, TraDo-8B) don't have it. They produce text by <em>iterative denoising</em>: the whole sequence is refined in parallel over many steps. Safety is no longer a property of a token stream — it's a property of a <strong>trajectory</strong>.</p>
<p>I propose the first <strong>temporal safety framework for diffusion-based LMs</strong>: model, measure, and mitigate how alignment evolves across denoising steps. The core observation is that a generation can pass through — or settle into — unsafe states at specific points in the denoising process that <em>end-only</em> output filtering, the only thing AR-era guardrails know how to do, cannot see.</p>
<p>Three questions drive it: <strong>(1)</strong> how does the probability of unsafe content evolve across denoising steps? <strong>(2)</strong> can in-loop, step-wise alignment suppress harmful emergence earlier and more reliably than end-only filtering? <strong>(3)</strong> do jailbreaks and alignment failures <em>transfer</em> between diffusion and autoregressive models, or is each architecture vulnerable in its own way?</p>
<p class="hero-footer">Target deliverables: the <strong>Diffusion Safety Probe</strong> (an open per-step risk-visualization toolkit) and three papers — <em>Alignment Drift in Diffusion LMs</em>, <em>Temporal Alignment for Diffusion Decoders</em>, and <em>Transferable Jailbreaks Across Architectures</em>.</p>
</section>

<section id="problem">
<span class="section-num">01 / THE PROBLEM</span>
<h2>Safety tooling assumes a generation order diffusion models don't have</h2>
<p>The entire safety stack for language models is built on autoregressive assumptions. Refusal fires at the start of a response. Output classifiers read a finished left-to-right string. Alignment training shapes a next-token distribution. None of this maps cleanly onto a model that denoises an entire masked sequence over <em>T</em> steps, revealing and revising tokens out of order until the sequence converges.</p>
<p>That mismatch opens questions no one has answered:</p>
<ul>
<li><strong>Unsafe intermediate states.</strong> A denoising trajectory can surface harmful content at an early step and then partially mask it — or assemble harmful content late, after early steps looked benign. An end-only check sees only the final frame of a movie.</li>
<li><strong>Order-agnostic infilling attacks.</strong> Because diffusion decoders fill masked spans anywhere in the sequence, attacks like DIJA and PAD exploit infilling positions that AR decoders never expose. The threat surface is shaped differently.</li>
<li><strong>No temporal alignment signal.</strong> Alignment training for these models still optimizes the final sample. Nothing supervises <em>when</em> in the denoising process harmful content emerges or how reversible it is.</li>
</ul>
</section>

<section id="thesis">
<span class="section-num">02 / THESIS</span>
<h2>Alignment in diffusion LMs is a temporal phenomenon</h2>
<blockquote>Safety alignment in a diffusion LM is not a fixed property of the output — it drifts across the denoising trajectory. To secure these models you have to model that drift: know when harmful content first becomes probable, whether it can still be removed, and how far the trajectory has wandered from a safe reference. Then you can intervene <em>in the loop</em>, not after the fact.</blockquote>
<p>This is the <a href="/proposal/loom.html">inference-time</a> sibling of my <a href="/proposal/guardrails.html">guardrails work</a>: an in-loop guardrail on a diffusion decoder is intent/risk classification applied <em>per denoising step</em> instead of per turn. And it shares the spine of <a href="/proposal/ceval.html">ceval</a> — don't trust the final surface; instrument the process that produces it. Here the process is denoising, and its substrate is the per-step distribution.</p>
</section>

<section id="metrics">
<span class="section-num">03 / TEMPORAL METRICS</span>
<h2>Making "alignment drift" measurable</h2>
<p>Three step-indexed metrics turn the thesis into something falsifiable. Let \(p_t(\text{harm})\) be the probability mass on unsafe content at denoising step \(t \in \{1,\dots,T\}\).</p>

<h3>3.1 First Harmful Step (FHS)</h3>
<p class="math-display">$$\text{FHS} \;=\; \min\,\{\,t : p_t(\text{harm}) > \tau\,\}.$$</p>
<p>The earliest step at which unsafe content crosses a risk threshold. A distribution of FHS over a harmful-prompt set says <em>when</em> in the trajectory alignment tends to fail — and therefore the earliest an in-loop guardrail could act.</p>

<h3>3.2 Irreversibility Index</h3>
<p class="math-display">$$\text{Irr} \;=\; \Pr\!\big[\,p_T(\text{harm}) \gt \tau \;\big|\; \exists\, t \lt T:\ p_t(\text{harm}) \gt \tau\,\big].$$</p>
<p>Once harmful content appears mid-trajectory, how likely is it to <em>survive</em> to the final sample rather than be denoised away? High irreversibility means early intervention is mandatory; low means the model self-corrects and late filtering may suffice.</p>

<h3>3.3 KL Drift</h3>
<p class="math-display">$$\text{Drift}_t \;=\; D_{\mathrm{KL}}\!\big(q_t \,\|\, q_t^{\text{safe}}\big),$$</p>
<p>the divergence at step \(t\) between the model's denoising distribution \(q_t\) and a safe-reference trajectory \(q_t^{\text{safe}}\). Tracks how far, and at which step, a jailbroken or unsafe generation peels away from aligned behavior — the temporal signature of an attack.</p>

<div class="callout callout-info">
<div class="callout-title">Why these three</div>
FHS answers <em>when to act</em>, Irreversibility answers <em>whether acting late is even possible</em>, and KL Drift gives a continuous, step-wise alarm signal an in-loop guardrail can threshold on. Together they convert "safety" from a single output verdict into a trajectory you can plot.
</div>
</section>

<section id="agenda">
<span class="section-num">04 / AGENDA</span>
<h2>Three-phase research agenda</h2>

<div class="phase-grid">
<div class="phase-card">
<span class="phase-tag">Phase 1 · Map</span>
<h5>Mechanistic mapping</h5>
<p>Step-wise logging of denoising states on Dream-7B, LLaDA2.0, TraDo-8B. Compute FHS, Irreversibility, and KL Drift over harmful and benign prompt sets. Establish whether alignment drift is real and structured.</p>
</div>
<div class="phase-card">
<span class="phase-tag">Phase 2 · Mitigate</span>
<h5>Temporal alignment</h5>
<p>In-loop guardrails: step-wise risk scoring, mask-aware gating that blocks unsafe infilling, and learned temporal policy heads that steer denoising away from drift. Compare against end-only filtering at equal quality.</p>
</div>
<div class="phase-card">
<span class="phase-tag">Phase 3 · Transfer</span>
<h5>Cross-architecture transfer</h5>
<p>Apply DIJA and PAD diffusion jailbreaks across Dream-7B and autoregressive baselines. Do attacks and defenses transfer between paradigms, or is each architecture vulnerable in its own way?</p>
</div>
</div>

<h3>Phase 1 — Is the drift real?</h3>
<p>Instrument the denoising loop of open diffusion LMs to log per-step state. Over a standard harmful-prompt set, estimate \(p_t(\text{harm})\) at every step and compute the three metrics. The output is the first empirical picture of <em>when</em> alignment fails in diffusion generation — and the proof-or-refutation that the temporal framing carries signal at all.</p>

<h3>Phase 2 — Catch it in the loop</h3>
<p>If drift is structured, intervention is possible mid-trajectory. Three mechanisms, increasing in sophistication: step-wise risk scoring (threshold KL Drift / harm probability and halt or resample), mask-aware gating (refuse to unmask spans flagged unsafe), and a learned temporal policy head that nudges the denoiser toward the safe reference. The headline comparison: in-loop alignment vs. end-only filtering, matched on generation quality.</p>

<h3>Phase 3 — Does it transfer?</h3>
<p>Run diffusion-specific jailbreaks (DIJA, PAD) against diffusion models and AR baselines, and AR jailbreaks against diffusion models. A transfer matrix answers whether the field's accumulated AR red-teaming knowledge ports — and whether a defense tuned on one paradigm protects the other.</p>
</section>

<section id="deliverables">
<span class="section-num">05 / DELIVERABLES</span>
<h2>What ships</h2>
<ul>
<li><strong>Diffusion Safety Probe.</strong> An open toolkit for per-step risk visualization — load a diffusion LM, run a prompt, and watch FHS, irreversibility, and KL drift evolve across the denoising trajectory. The instrument the rest of the agenda runs on.</li>
<li><strong>Paper — <em>Alignment Drift in Diffusion LMs</em>.</strong> The Phase 1 measurement study: the temporal anatomy of safety failure in diffusion generation.</li>
<li><strong>Paper — <em>Temporal Alignment for Diffusion Decoders</em>.</strong> In-loop guardrails vs. end-only filtering, with the quality/safety trade-off curve.</li>
<li><strong>Paper — <em>Transferable Jailbreaks Across Architectures</em>.</strong> The diffusion↔AR transfer matrix for attacks and defenses.</li>
</ul>
</section>

<section id="timeline">
<span class="section-num">06 / TIMELINE</span>
<h2>Milestones</h2>
<p>Working weeks of effort, not calendar weeks.</p>

<div class="callout callout-decision">
<div class="callout-title">Decision gate · Milestone 0</div>
<p>Instrument one open diffusion LM (Dream-7B or LLaDA2.0). On a harmful-prompt set, log per-step harm probability and plot the FHS distribution. <strong>If alignment drift is visible — harmful content emerges/persists at identifiable steps, and at least one case is caught by an in-loop check that end-only filtering misses — continue. If safety is flat across the trajectory, the temporal framing adds nothing and we stop here.</strong></p>
</div>

<h3>Phase 1 — Mechanistic mapping</h3>
<ol class="milestones">
<li><span class="ms-id">M1</span><div class="ms-body"><strong>Denoising instrumentation<span class="ms-week">2 wk</span></strong><p>Hook the denoising loop of Dream-7B / LLaDA2.0 / TraDo-8B; per-step state logging; harm-probability estimator; safe-reference trajectory for KL.</p></div></li>
<li><span class="ms-id">M2</span><div class="ms-body"><strong>Metrics + drift study<span class="ms-week">2 wk</span></strong><p>FHS, Irreversibility, KL Drift across harmful/benign sets. The Diffusion Safety Probe v0. <em>Paper 1 figure.</em></p></div></li>
</ol>

<h3>Phase 2 — Temporal alignment</h3>
<ol class="milestones">
<li><span class="ms-id">M3</span><div class="ms-body"><strong>In-loop guardrails<span class="ms-week">2 wk</span></strong><p>Step-wise risk scoring and mask-aware gating; halt/resample policy; quality measurement to keep the safety gain honest.</p></div></li>
<li><span class="ms-id">M4</span><div class="ms-body"><strong>Temporal policy head<span class="ms-week">2 wk</span></strong><p>Learned steering toward the safe reference. In-loop vs. end-only comparison at matched quality. <em>Paper 2.</em></p></div></li>
</ol>

<h3>Phase 3 — Cross-architecture transfer</h3>
<ol class="milestones">
<li><span class="ms-id">M5</span><div class="ms-body"><strong>Transfer matrix<span class="ms-week">2 wk</span></strong><p>DIJA / PAD across diffusion and AR; AR jailbreaks against diffusion. Attack <em>and</em> defense transfer. <em>Paper 3.</em></p></div></li>
</ol>
</section>

<section id="open">
<span class="section-num">07 / OPEN QUESTIONS</span>
<h2>What the work has to answer</h2>
<ul>
<li><strong>Is there temporal structure at all?</strong> If harm probability is flat or monotone across steps, "drift" is a non-finding and end-only filtering is already optimal. The whole framing rides on structured FHS distributions.</li>
<li><strong>How do you define an unsafe intermediate state?</strong> Partially-denoised text is noisy; scoring harm on a half-masked sequence needs a robust estimator, not the same classifier used on clean output.</li>
<li><strong>Does in-loop alignment cost quality?</strong> Gating unmasking and steering denoising can degrade fluency or task accuracy. The trade-off curve, not the safety number alone, is the result.</li>
<li><strong>Does anything transfer?</strong> If diffusion and AR vulnerabilities are disjoint, the field's AR safety knowledge doesn't port — which is itself a significant and worrying finding.</li>
</ul>
</section>

<section id="limits">
<span class="section-num">08 / LIMITS</span>
<h2>Honest limits and what could kill the project</h2>
<ol>
<li><strong>Needs open diffusion LMs, and the field is young.</strong> Findings on Dream-7B / LLaDA2.0 / TraDo-8B may not survive to the next, more capable generation. The framework should outlast any single model, but that's a bet.</li>
<li><strong>Harm-scoring on partial sequences is hard.</strong> Mid-denoising text is out of distribution for standard harm classifiers; a bad estimator makes every metric noise.</li>
<li><strong>In-loop intervention may not beat end-only.</strong> If irreversibility is low, the model self-corrects and a cheap final filter is enough — the in-loop machinery wouldn't earn its cost. Milestone 0 probes this directly.</li>
<li><strong>Fast-moving target.</strong> Diffusion-LM architectures and their attacks are changing month to month; the transfer results have a shelf life.</li>
</ol>

<div class="callout callout-warn">
<div class="callout-title">What would kill the project</div>
<p><strong>No drift.</strong> Flat per-step harm probability means there's nothing temporal to exploit and end-only filtering wins. Milestone 0 surfaces this immediately.</p>
<p><strong>Low irreversibility everywhere.</strong> If harmful intermediate states reliably get denoised away, in-loop alignment is solving a problem the model already solves.</p>
</div>
</section>

<section id="whynow">
<span class="section-num">09 / WHY NOW</span>
<h2>The moment is right</h2>
<ol>
<li><strong>Diffusion LMs just became real.</strong> LLaDA, Dream-7B, TraDo-8B and commercial diffusion decoders are capable enough that their safety properties now matter in practice, not just in theory.</li>
<li><strong>No one has a temporal safety framework.</strong> Safety research for these models still borrows AR-shaped tools. The gap between a genuinely different generation process and the tooling pointed at it is wide open.</li>
<li><strong>The attacks already exist.</strong> DIJA and PAD show diffusion-specific jailbreaks are real today — the offense is ahead of the measurement, which is exactly where a measurement-first agenda is worth the most.</li>
</ol>
</section>

<section id="related">
<span class="section-num">10 / RELATED WORK</span>
<h2>Position relative to the field</h2>
<ul>
<li><strong>Diffusion language models.</strong> LLaDA, Dream-7B, TraDo-8B and related masked-diffusion decoders. <em>Role here:</em> the systems under study; this work adds the safety-trajectory lens they lack.</li>
<li><strong>Diffusion-specific attacks.</strong> DIJA and PAD infilling jailbreaks. <em>Role here:</em> the offense the transfer study measures and the defense targets.</li>
<li><strong>Process supervision.</strong> Step-level reward over reasoning (Lightman et al., 2023). <em>Connection:</em> temporal alignment is process supervision for denoising — supervise the trajectory, not just the endpoint. Shared instinct with <a href="/proposal/loom.html">Loom</a>.</li>
<li><strong>Guardrails &amp; representation-level safety.</strong> Output classifiers and refusal-direction work. <em>Difference:</em> those act once, on the final surface; this acts repeatedly, in the loop, on the process — the diffusion analogue of <a href="/proposal/guardrails.html">intent-level guardrails</a>.</li>
</ul>
</section>

<section id="status">
<span class="section-num">11 / STATUS</span>
<h2>Where this is now</h2>
<p>Active. This is the project listed as <em>Temporal Dynamics of Safety in Diffusion-Based Language Models</em> on my <a href="/projects.html">projects page</a>. The next concrete deliverable is <strong>Milestone 0</strong>: instrument one open diffusion LM and produce the first FHS distribution showing whether alignment drift exists. The in-loop guardrail work shares its framing with my <a href="/proposal/guardrails.html">intent-classifier guardrails</a>; the per-step intervention idea is the diffusion sibling of <a href="/proposal/loom.html">Loom</a>'s inference-time search.</p>
<p>Contact: <a href="mailto:kumardivy1999@gmail.com">kumardivy1999 [at] gmail.com</a></p>
<p class="proposal-footer">This page is a working document. It will move as the experiments teach us what's real.</p>
</section>

</main>
</div>
</div>
