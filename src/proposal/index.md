---
layout: page.njk
title: "Research Agenda"
pageTitle: "Research Agenda"
subtitle: "Provable invariance: building AI that behaves the same however you ask it. The shared root of safety x reliability."
permalink: /proposal/
extraCss:
  - proposal.css
hasMath: true
eleventyExcludeFromCollections: true
sitemap:
  ignore: true
---

<div class="proposal">

<p class="proposal-meta">Divyanshu Kumar &middot; Working draft, last updated 2026-06-18 &middot; <a href="https://github.com/divyanshugit">github.com/divyanshugit</a></p>

<main class="proposal-body" style="max-width: 80ch; margin: 2rem auto 0 auto;">

<section class="proposal-hero" style="margin-top: 0;">
<h2>The thesis, in plain words</h2>
<p class="lead">I want AI that behaves the same way no matter <em>how</em> you ask. Rephrase the question, change the file format, swap a sentence for a picture of that sentence, and the answer shouldn't flip. When it does, two things break:</p>
<ul>
<li><strong>Safety.</strong> An attacker disguises a harmful request (hides it in an image, splits it across turns) and slips it past the filter.</li>
<li><strong>Reliability.</strong> The system nails the demo, then fails in production on the same task in a slightly different format.</li>
</ul>
<p>These are two faces of one bug: <strong>models learn the surface, not the meaning underneath.</strong> Closing that gap is the shared root of <strong>safety x reliability</strong>, and my agenda is to do it with a <em>guarantee</em>, not a patch. The technical name for "stable under a cosmetic change" is <strong>invariance</strong>; the cosmetic change is a <strong>representation shift</strong>.</p>
<p>Precisely, for the technical reader: a <strong>shift class</strong> $\mathcal{T}$ is a set of maps $T:\mathcal{X}\to\mathcal{X}$ that preserve task-relevant content, and a predictor $f$ is <strong>$\varepsilon$-invariant</strong> over $\mathcal{T}$ when</p>
<p class="math-display">$$d\big(f(T(x)),\,f(x)\big)\;\le\;\varepsilon \qquad \forall\, T\in\mathcal{T}.$$</p>
<p><em>Read it plainly: dress the same question up any way you like, and the answer barely moves.</em> Today's models instead learn $f(x)=h(\text{surface}(x))$: they key on the wording, not the meaning, so $f(T(x))\neq f(x)$. The goal is a certificate that this won't happen:</p>
<p class="math-display">$$\textbf{Provable invariance:}\qquad \Pr_{x,\,T\in\mathcal{T}}\big[\,d(f(T(x)),f(x))\le\varepsilon\,\big]\;\ge\;1-\delta.$$</p>
<p><em>Plainly: with high probability, no cosmetic rewrite changes the answer, and we can prove it.</em> One question underneath it all: <strong>how do we build AI that reasons about the problem, not the way it happens to be written down?</strong></p>
</section>

<section>
<span class="section-num">THE EVIDENCE</span>
<h2>The failures are measured, not hypothesized</h2>
<p>Two early results (peer-reviewed workshop findings, with fuller versions in progress) are the empirical foundation the thesis generalizes from. Same brittleness, two unrelated domains: one shows up as a <strong>reliability</strong> failure (same graph, different format, different answer), the other as a <strong>safety</strong> failure (same harm, different modality, filter bypassed).</p>

<div class="phase-grid" style="grid-template-columns: 1fr 1fr;">
<div class="phase-card">
<span class="phase-tag">Early result · serialization shift</span>
<h5><a href="https://openreview.net/forum?id=SnzUcNsaXY">Lost in Serialization</a> <span class="subtle">(GFM @ ICML 2026, Poster)</span></h5>
<p>LLM graph reasoners produce <em>different</em> answers under node reindexing, edge reordering, and format changes, when the outputs should be identical on isomorphic graphs. Worse, fine-tuning reduces sensitivity to relabeling but can <em>increase</em> it to structure and format. The title says it: invariance is the missing property.</p>
</div>
<div class="phase-card">
<span class="phase-tag">Early result · modality shift</span>
<h5><a href="https://openreview.net/forum?id=NaibehcKG8">Beyond Text</a> <span class="subtle">(Reliable ML Workshop @ NeurIPS 2025)</span></h5>
<p>Across 1,900 prompts and 7 frontier models, systems with ~0% text-only attack success suffer <strong>&gt;75%</strong> under perceptually simple transforms (up to 89% via FigStep-Pro on Llama-4). Identical harmful semantics, re-encoded into vision or audio, walk past text-trained safety. Safety filters key on surface, not meaning.</p>
</div>
</div>
<p>There is also a limit case. <em>No Free Lunch With Guardrails</em> (my work, under review) shows, across 22 guardrail systems, that the safety/usability tradeoff is structural, with the floor apparently set by class overlap <em>in the representation you classify over</em>. That floor is the hook for the whole program: change the representation, change the floor.</p>
</section>

<section>
<span class="section-num">THE APPROACH</span>
<h2>The guarantee lives in the system, not the model</h2>
<p>One distinction the field keeps blurring, and the hinge of this whole agenda:</p>
<ul>
<li><strong>AI models.</strong> The raw weights, brittle by nature: a single forward pass keys on the surface, and no prompt makes it <em>provably</em> anything. This is the layer the failures above live in.</li>
<li><strong>AI-enabled systems.</strong> What you build <em>around</em> a model to get a job done: verification, search, guardrails, in-loop gating, certification. This is the layer where a guarantee can actually live.</li>
<li><strong>Systems for AI.</strong> The infrastructure that measures and stresses both: benchmarks, evaluation harnesses, probes.</li>
</ul>
<p>So the thesis sharpens: <strong>provable invariance is not going to come from the model directly.</strong> You can't certify a fallible component into a guarantee. It gets <em>engineered</em> at the system level, built <strong>brick by brick</strong> into AI-enabled systems whose invariance is enforced by their scaffolding, not hoped for from the weights. The model stays fallible; the system around it is what we make provable.</p>
<p>And the sequencing is deliberate. The model itself, weights you can trust on their own, is the big problem, and I expect to reach it <em>last</em>. Understanding what's actually happening inside, through <strong>interpretability x causality</strong> (the thread <a href="/proposal/ceval.html">ceval</a> and the activation probes pull on), is the long game that eventually gets us there. But the systems are deployed <em>now</em>, so we don't wait on it. While that understanding matures, build the components that keep today's AI-enabled systems <strong>safe x secure</strong>, and fold what we learn about the model back in as it comes.</p>
<p><em>Plainly: don't wait for a model that can't be fooled. Wrap a fallible one in enough checks that the <strong>system</strong> can't be fooled, and then prove it.</em></p>
</section>

<section>
<span class="section-num">THE BRICKS</span>
<h2>Building it, brick by brick</h2>
<p>If the guarantee lives in the system, the job is to lay the bricks, and the initial work on two of them is already in progress, at two different layers:</p>
<ul>
<li><strong><a href="/proposal/loom.html">Loom</a>: the whole thesis in miniature (an AI-enabled system).</strong> Take a fallible 8B model that makes arithmetic slips, and wrap it in a search over reasoning steps, each checked against a deterministic oracle. The <em>model</em> is still wrong sometimes; the <em>system's</em> answer is reliable, because the scaffolding prunes the errors before they propagate. That is invariance built at the system level, not in the weights, on a model you run yourself. Every other brick is the same move: <a href="/proposal/guardrails.html">intent-level guardrails</a> and <a href="/proposal/diffusion.html">in-loop diffusion gating</a> are verification layers that make the system behave regardless of the model under it.</li>
<li><strong><a href="/proposal/codingbench.html">CodingAgentBench</a>: the measuring stick (a system for AI).</strong> 682 tasks across 35 repos in 5 languages: does an agent's capability survive the language/repo shift, or collapse? You can't lay invariant bricks without an instrument that tells you which ones hold. This is that instrument, and <a href="/proposal/ceval.html">ceval</a> is its mechanism-level counterpart.</li>
</ul>
<p>Measurement (systems for AI) x verification (AI-enabled systems): one tells you where the model breaks, the other makes the assembled system hold. Stack enough bricks and you get what the model alone never gives: an AI-enabled system that is <strong>provably invariant in nature</strong>.</p>
</section>

<section>
<span class="section-num">THE PROGRAM</span>
<h2>One taxonomy of shifts, one project per class</h2>
<p>Each line of work instantiates the same template: fix a shift class $\mathcal{T}$, measure the invariance gap, then close it with a guarantee.</p>

<table>
<thead><tr><th>Shift class $\mathcal{T}$</th><th>What must stay invariant</th><th>Project</th><th>Status</th></tr></thead>
<tbody>
<tr><td>Serialization / permutation</td><td>Output on isomorphic graphs</td><td>Graph reasoners</td><td>Early result</td></tr>
<tr><td>Modality (text↔vision↔audio)</td><td>The harm verdict</td><td>Multimodal safety</td><td>Early result</td></tr>
<tr><td>Surface form (jailbreak transforms)</td><td>The safety verdict</td><td><a href="/proposal/guardrails.html">Intent-guard</a></td><td>Proposal</td></tr>
<tr><td>Non-causal feature interventions</td><td>The answer <em>and</em> its mechanism</td><td><a href="/proposal/ceval.html">ceval</a></td><td>Proposal</td></tr>
<tr><td>Denoising trajectory (temporal)</td><td>Safety across generation steps</td><td><a href="/proposal/diffusion.html">Diffusion safety</a></td><td>Proposal</td></tr>
<tr><td>Resampling (algorithmic stability)</td><td>The learned features themselves</td><td>Privacy-aware robustness</td><td>Direction</td></tr>
</tbody>
</table>

<h3>Direction A · Invariant architectures for structured reasoning</h3>
<p>From the serialization failure: design reasoners that maintain consistent predictions across isomorphic representations. Encode symmetries as inductive bias (permutation equivariance), train with contrastive losses that penalize divergence between equivalent serializations, and characterize <em>when</em> fine-tuning preserves vs. destroys invariance. Even here the invariance is <em>engineered and then certified</em> (architectural constraint plus contrastive training plus a verification pass), a sturdier brick, not a model that's magically robust on its own. Target guarantee: <em>"$\varepsilon$-consistent predictions under node permutation with probability $\ge 1-\delta$."</em></p>
<p><em>Plainly: a graph is the same graph however you write it down. The model should give the same answer either way, and we want to prove it will.</em></p>

<h3>Direction B · Certified semantic safety across modality x form</h3>
<p>From the modality and surface-form failures: move from per-modality, per-pattern filters to one semantic verdict that transfers. This is where my safety proposals live (<a href="/proposal/guardrails.html">intent-guard</a>, <a href="/proposal/diffusion.html">diffusion temporal safety</a>), alongside a unified cross-modal embedding where harmful content clusters by meaning. Target guarantee: <em>certified that content stays in a safe region across modality and form transformations.</em></p>
<p><em>Plainly: harmful is harmful whether it's typed, hidden in an image, or split across turns. One check should catch it, instead of a separate, breakable filter per format.</em></p>

<h3>Direction C · Privacy-aware robustness</h3>
<p>A hypothesis worth testing formally: DP-SGD's noise may <em>help</em> invariance by regularizing away format-specific spurious correlations, forcing models toward abstract semantic features. Formalize the link between <strong>algorithmic stability</strong> (from differential privacy) and <strong>representation invariance</strong>, and design DP mechanisms that specifically target spurious correlations rather than degrade utility blindly.</p>
<p><em>Plainly: the random noise privacy adds during training might also stop a model from latching onto superficial cues, a useful side effect worth proving, not assuming.</em></p>

<p>Cutting across all three, <a href="/proposal/ceval.html">ceval</a> treats evaluation itself as a causal claim: outputs should stay invariant under non-causal interventions and <em>change</em> under causal ones. Right answer for the right reason is just invariance to everything that shouldn't matter.</p>
</section>

<section>
<span class="section-num">METHOD</span>
<h2>The formal toolkit</h2>
<p>The program is theory-first x systems-backed. <em>Plainly: I'm borrowing four mature areas of math rather than inventing one from scratch.</em> The guarantees draw on:</p>
<ul>
<li><strong>Causal invariance.</strong> Invariant prediction and IRM (Peters et al., 2016; Arjovsky et al., 2019), causal representation learning (Schölkopf et al., 2021): the formal language for "invariant to everything non-causal."</li>
<li><strong>Group theory &amp; equivariance.</strong> Symmetries as architectural constraints: what it means for a representation to be permutation- or modality-equivariant.</li>
<li><strong>Statistical learning theory.</strong> PAC / VC bounds extended to account for representation shift; when a model has the capacity to learn the algorithm rather than the shortcut.</li>
<li><strong>Differential privacy &amp; stability.</strong> Algorithmic stability and composition as a lever on invariance, and the bridge to Direction C.</li>
</ul>
<p>Each direction ships an artifact, not just a proof: open benchmarks isolating one invariance property, training procedures with bounds, and certification methods that verify them, validated against real deployments through my Enkrypt AI work.</p>
</section>

<section>
<span class="section-num">STATUS</span>
<h2>Where this is now</h2>
<p>The empirical foundation is out as early, peer-reviewed workshop results (graph serialization, GFM @ ICML 2026; multimodal safety, NeurIPS 2025): first findings, with fuller versions in progress. The invariance proposals are in early, gated execution. Each has a cheap Milestone 0 that could falsify it before the expensive work starts (see the individual pages). The theory directions (invariant architectures, privacy-aware robustness) are the longer-horizon program these results motivate.</p>
<p>Contact: <a href="mailto:kumardivy1999@gmail.com">kumardivy1999 [at] gmail.com</a></p>
<p class="proposal-footer">If you'd like to collaborate, or have feedback on the framing, get in touch.</p>
<p class="proposal-footer" style="margin-top: 1.75rem; font-style: italic; opacity: 0.92;"><strong>PS.</strong> The honest version: the plan was to work on these problems during a PhD, and the Fall 2026 cycle didn't go my way. It hasn't changed what I want to build. I'm going to step back from a few things soon and just start: build x publish, milestone by milestone, and let the work speak for itself. With or without a formal program, I'm going to find a way to work on these ideas.</p>
</section>

<section>
<span class="section-num">REFERENCES</span>
<h2>All the projects, in one place</h2>

<h4>Proposals</h4>
<ul>
<li><a href="/proposal/ceval.html">ceval</a> &middot; causal evaluation of language models (invariance under non-causal interventions).</li>
<li><a href="/proposal/guardrails.html">intent-guard</a> &middot; guardrails as intent classifiers (safety-verdict invariance under jailbreak surface transforms).</li>
<li><a href="/proposal/diffusion.html">Diffusion safety</a> &middot; temporal safety in diffusion LMs (safety invariance across the denoising trajectory).</li>
<li><a href="/proposal/loom.html">Loom</a> &middot; inference-time search with step verification (reliable reasoning from a fallible model).</li>
<li><a href="/proposal/codingbench.html">CodingAgentBench</a> &middot; multi-language coding-agent benchmark (capability invariance across languages and repos).</li>
</ul>

<h4>Papers</h4>
<ul>
<li>D. Herbst, L. Karbevska, <strong>D. Kumar</strong>, A. Ahuja, F. Gholamzadeh Nasrabadi, F. Frasca. <em>Lost in Serialization: Invariance and Generalization of LLM Graph Reasoners.</em> GFM Workshop @ ICML 2026 (Poster). <a href="https://openreview.net/forum?id=SnzUcNsaXY">OpenReview</a>.</li>
<li><strong>D. Kumar</strong>, S. Jena, N. A. Birur, T. Baswa, S. Agarwal, P. Harshangi. <em>Beyond Text: Multimodal Jailbreaking of Vision-Language and Audio Models through Perceptually Simple Transformations.</em> Reliable ML from Unreliable Data Workshop @ NeurIPS 2025. <a href="https://openreview.net/forum?id=NaibehcKG8">OpenReview</a>.</li>
<li><strong>D. Kumar</strong>, N. A. Birur, T. Baswa, S. Agarwal, P. Harshangi. <em>No Free Lunch With Guardrails.</em> Under review, 2025. Earlier version: <a href="https://arxiv.org/abs/2504.00441">arXiv:2504.00441</a>.</li>
</ul>
</section>

</main>
</div>
