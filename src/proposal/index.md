---
layout: page.njk
title: "Proposals — Research"
pageTitle: "Proposals"
subtitle: "What I'd build if I had to answer one question about AI evaluation."
permalink: /proposal/
extraCss:
  - proposal.css
eleventyExcludeFromCollections: true
sitemap:
  ignore: true
---

<div class="proposal">

<p class="proposal-meta">Divyanshu Kumar &middot; Working draft, last updated 2026-05-27 &middot; <a href="https://github.com/divyanshugit">github.com/divyanshugit</a></p>

<main class="proposal-body" style="max-width: 78ch; margin: 2rem auto 0 auto;">

<section class="proposal-hero" style="margin-top: 0;">
<h2>The question</h2>
<p class="lead">Are our evaluations measuring what we actually want them to measure, or only what's easy to count? And as systems improve, how do we keep them honest?</p>
<p>Every leading benchmark I look at is broken in the same shape. It rewards a correct output. It can't tell whether the correct output was produced for the right reason. It saturates as frontier models improve. It leaks into training data and contaminates. Two systems can sit a percentage point apart on the leaderboard and behave nothing alike in deployment.</p>
<p>I want to build evaluations that <strong>instrument what's underneath the output</strong>: mechanism at the language-model layer, trajectories and capability profiles at the agent layer. The thesis is the same at both layers. The instrumentation differs.</p>
</section>

<section style="border-top: none; padding-top: 1.5rem;">
<span class="section-num">THE THROUGH-LINE</span>
<h2>One problem, two layers</h2>

<p>The fundamental failure of current evaluation isn't taste, scoring rubric, or coverage. It is structural. Outputs alone underdetermine the system that produced them. Two models can tie on MMLU and use radically different machinery to get there. Two coding agents can score the same on SWE-bench and have wildly different cost, reliability, and failure-mode profiles. The leaderboard cannot see the difference. The buyer pays for it later, on the deployment distribution.</p>

<p>The response I'd build has two prongs, scoped tightly enough to make real progress:</p>

<div class="phase-grid" style="grid-template-columns: 1fr 1fr;">
<a href="/proposal/ceval.html" class="phase-card" style="text-decoration: none; color: inherit; display: block;">
<span class="phase-tag">Proposal · LM layer</span>
<h5>Causal evaluation of language models</h5>
<p>Treat every eval as a causal claim. Run do-interventions over features of the input and score the model on whether outputs change as the mechanism predicts. Calibrate behavioral interventions against activation-level ground truth on open-weight models, then apply the calibrated suite to closed frontier models with explicit confidence bounds.</p>
<p style="margin-top: 0.75rem; font-size: 0.85rem; color: var(--p-accent); font-family: var(--font-code); letter-spacing: 0.04em;">Read the proposal &rarr;</p>
</a>

<a href="/proposal/codingbench.html" class="phase-card" style="text-decoration: none; color: inherit; display: block;">
<span class="phase-tag">Proposal · Agent layer</span>
<h5>CodingAgentBench</h5>
<p>682 curated tasks across 35 production repos in 5 languages, verified against each repo's own test suite. The research agenda is beyond the leaderboard: difficulty calibration from agent traces (IRT), capability decomposition into measurable sub-skills, and a contamination-resistant rolling stream of fresh issues.</p>
<p style="margin-top: 0.75rem; font-size: 0.85rem; color: var(--p-accent); font-family: var(--font-code); letter-spacing: 0.04em;">Read the proposal &rarr;</p>
</a>
</div>

<p>These are not two separate ideas. They are the same idea at two layers of abstraction. <em>Causal evaluation</em> asks whether a language model gets the right answer for the right reason. <em>CodingAgentBench</em> asks the same question of an agent, where the "reason" is a trajectory of tool calls and the "test" is the repo's own test suite. The test-suite-as-oracle problem at the agent layer is just the right-for-the-wrong-reason problem at the model layer, with extra plumbing.</p>
</section>

<section>
<span class="section-num">CROSS-CUTTING</span>
<h2>What the program has to answer</h2>

<p>If both proposals run to completion, they together produce evidence for or against four claims I think the field needs:</p>

<ol>
<li><strong>Mechanism is measurable behaviorally, with calibration.</strong> Prompt-level interventions, validated against activation-level ground truth on small models, can yield trustworthy estimates of mechanism fidelity at the frontier, with explicit confidence bounds rather than vibes.</li>
<li><strong>Difficulty is empirical, not authored.</strong> IRT-style calibration on agent×task matrices recovers a more discriminative difficulty axis than human-labelled heuristics, and surfaces tasks that no current system can solve (the part of the benchmark that ages best).</li>
<li><strong>Capability is a profile, not a scalar.</strong> A 0.72 resolve rate at $0.20/task is a different product than a 0.72 resolve rate at $5.00/task. Trace-derived sub-skill scores (navigation, planning, edit precision, failure recovery) give downstream users a profile they can actually price.</li>
<li><strong>Benchmarks decay; rolling streams don't.</strong> A contamination-resistant fresh-issue stream is the only structurally durable response to training-data leakage as models continue to improve.</li>
</ol>

<p>None of these claims are guaranteed to hold. Each is an empirical question with a defined early decision gate (see the individual proposals). That's the point of writing the program down this way: to surface what could kill it before the expensive work starts.</p>
</section>

<section>
<span class="section-num">STATUS</span>
<h2>Where this is now</h2>
<p>Both repositories exist and are under active iteration. The next concrete deliverables are <strong>Milestone 0</strong> for ceval (GSM8K-Causal-20 across the SLM ladder, one figure plotting mechanism fidelity vs. parameter count) and the <strong>multi-agent v1 sweep</strong> for codingbench (3–5 agents on the full 682-task set, public leaderboard). Both repositories are private during early iteration.</p>
<p>Contact: <a href="mailto:kumardivy1999@gmail.com">kumardivy1999 [at] gmail.com</a></p>
<p class="proposal-footer">If you have leads on PhD opportunities, research collaborations, or just feedback on the framing, get in touch.</p>
</section>

</main>
</div>
