Quantization is how you get a large model onto hardware you can afford. In 2024 we found it also makes the model easier to talk out of its rules.[^quant] I think about that result a lot, because it is the pattern. Efficiency, security and privacy are usually treated as separate subjects, and they are not. Change one and the other two move.

At Enkrypt I was the founding ML research engineer. I built the adversarial testing pipelines we ran against more than 250 foundation models,[^models] and the production guardrails that came after. Guardrails are not free. Every refusal you add costs something in usefulness, and measuring that trade is most of the job.[^nfl]

Before that I was a Research Associate at IISc Bangalore with Prof. Prathosh A.P., on machine translation for Indic languages, machine unlearning in generative models, and privacy-preserving ML. That is where differential privacy got hold of me. I later wrote a four-part series on it, from the definition to DP-SGD.[^dp]

Two questions are on my desk now. With Fabrizio Frasca at Technion: does an LLM’s answer about a graph change when you only change how the graph is written down?[^graph] And in diffusion language models, which write by denoising rather than left to right: is there a step at which the output turns harmful, and can the model take it back?[^diff]

My first research was text summarization at Helppr AI, in 2020. Outside work I read more code than I write, tinker with Go and ssh at weekends, and this June I finished BlueDot Impact’s Technical AI Safety course. If any of this is your problem too, <a href="/about.html#contact" data-email="kumardivy1999 [at] gmail [dot] com">write to me</a>.

[^quant]: see | [<cite>Increased LLM Vulnerabilities from Fine-tuning and Quantization</cite>](https://arxiv.org/abs/2404.04392) <span class="venue">arXiv, April 2024</span> For fun, the same year: [Exploring llama.cpp with Llama models](/blog/llm-quantization.html).

[^models]: checked | 250+ models, 2023–26. <span class="dry">The reviewer asked for a number. This is the number.</span>

[^nfl]: see | [<cite>No Free Lunch with Guardrails</cite>](https://arxiv.org/abs/2504.00441) <span class="venue">arXiv, 2025</span>

[^dp]: see | <cite>Inception of Differential Privacy</cite> <span class="venue">Four posts, February–May 2025: [i](/blog/differential-privacy-but-why.html), [ii](/blog/dp-guarantee-in-action.html), [iii](/blog/art-of-controlled-noise.html), [iv](/blog/sgd-to-dpsgd.html)</span>

[^graph]: see | [<cite>Lost in Serialization</cite>](https://openreview.net/forum?id=SnzUcNsaXY) <span class="venue">GCLR @ AAAI 2026 · GFM @ ICML 2026 · co-first</span>

[^diff]: in progress | [Temporal dynamics of safety in diffusion LMs](/projects.html). Working terms: <i>first harmful step</i>, <i>irreversibility index</i>.

