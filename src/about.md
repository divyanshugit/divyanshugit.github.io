---
layout: about.njk
title: About
permalink: /about.html
description: "About Divyanshu Kumar, AI Research Engineer at Anaconda. I work on making AI systems efficient, secure and private: quantization, inference, guardrails, red-teaming and differential privacy."
pageJs:
  - /js/about.js
subtitle: "Research engineer. I work on making AI systems efficient, secure and private, and on what breaks when they are none of those."
figCaption: "The author, illustrated."
epsHint: "Lower ε and this page releases the portrait, the plates and one line of particulars under calibrated Laplace noise. The prose stays as written."
workHeading: "What I work on"
# "Where this happened". Place names are linked to their plates automatically.
journey: |
  I am from Berai, a village in Sarai, Bihar. Since then I have lived in Patna, Kolkata, Delhi and Bangalore, in that order. Kolkata is where I studied electronics and communication engineering, at Narula Institute of Technology, until 2022. Bangalore is where IISc and Enkrypt happened. Singapore is where I presented our AAAI-26 workshop papers, in person. Malaysia, the Philippines and Bali are where I wander around.
---
<!--
  The homepage prose. Everything above "more" is the lede on the title page;
  everything below it is §1. Footnotes ([^x]) become margin notes.
  A note may start with a small label:  [^x]: see | text
  Keep sentences plain: "Ask this page" answers by quoting them.
-->

I am an AI Research Engineer at [Anaconda](https://www.anaconda.com/), which acquired Enkrypt AI this August.[^acq] Most of my work sits on one stack: making models smaller and faster to run, finding out how they fail, building the guardrails that catch it, and keeping the data they learned from private. The stack keeps getting taller, which I don’t mind.

<!-- more -->

Quantization is how you get a large model onto hardware you can afford. In 2024 we found it also makes the model easier to talk out of its rules.[^quant] I think about that result a lot, because it is the pattern. Efficiency, security and privacy are usually treated as separate subjects, and they are not. Change one and the other two move.

At Enkrypt I was the founding ML research engineer. I built the adversarial testing pipelines we ran against about 300 foundation models,[^models] and the production guardrails that came after. Guardrails are not free. Every refusal you add costs something in usefulness, and measuring that trade is most of the job.[^nfl]

Before that I was a Research Associate at IISc Bangalore with Prof. Prathosh A.P., on machine translation for Indic languages, machine unlearning in generative models, and privacy-preserving ML. That is where differential privacy got hold of me. I later wrote a four-part series on it, from the definition to DP-SGD.[^dp]

Two questions are on my desk now. With Fabrizio Frasca at Technion: does an LLM’s answer about a graph change when you only change how the graph is written down?[^graph] And in diffusion language models, which write by denoising rather than left to right: is there a step at which the output turns harmful, and can the model take it back?[^diff]

My first research was text summarization at Helppr AI, in 2020. Outside work I read more code than I write, tinker with Go and ssh at weekends, and this June I finished BlueDot Impact’s Technical AI Safety course. If any of this is your problem too, <a href="/about.html#contact" data-email="kumardivy1999 [at] gmail [dot] com">write to me</a>.

[^acq]: source | [Anaconda acquires Enkrypt AI](https://www.anaconda.com/blog/anaconda-acquires-enkrypt-ai) <span class="venue">Announcement, August 2026</span>

[^quant]: see | [<cite>Increased LLM Vulnerabilities from Fine-tuning and Quantization</cite>](https://arxiv.org/abs/2404.04392) <span class="venue">arXiv, April 2024</span> For fun, the same year: [Exploring llama.cpp with Llama models](/blog/llm-quantization.html).

[^models]: checked | about 300 models, 2023–26. <span class="dry">The reviewer asked for a number. This is the number.</span>

[^nfl]: see | [<cite>No Free Lunch with Guardrails</cite>](https://arxiv.org/abs/2504.00441) <span class="venue">arXiv, 2025</span>

[^dp]: see | <cite>Inception of Differential Privacy</cite> <span class="venue">Four posts, February–May 2025: [i](/blog/differential-privacy-but-why.html), [ii](/blog/dp-guarantee-in-action.html), [iii](/blog/art-of-controlled-noise.html), [iv](/blog/sgd-to-dpsgd.html)</span>

[^graph]: see | [<cite>Lost in Serialization</cite>](https://openreview.net/forum?id=SnzUcNsaXY) <span class="venue">GCLR @ AAAI 2026 · GFM @ ICML 2026 · co-first</span>

[^diff]: in progress | [Temporal dynamics of safety in diffusion LMs](/projects.html). Working terms: <i>first harmful step</i>, <i>irreversibility index</i>.

