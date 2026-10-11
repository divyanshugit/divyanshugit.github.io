---
layout: blog-post.njk
title: "Wrong, Lying or Scheming? Hallucination, Deception and Scheming in LLMs"
description: "Three words we use loosely for a model saying something false. They are different failures, located in different places, and each needs a different measurement."
date: 2026-10-11
tags:
  - AI Safety
  - LLMs
  - Red Teaming
  - AI Security
emailSubject: Hallucination, Deception, Scheming
featured: false
permalink: /blog/hallucination-deception-scheming.html
banner: three-gaps
references:
  1: https://arxiv.org/abs/2202.03629
  2: https://arxiv.org/abs/2509.04664
  3: https://arxiv.org/abs/2110.06674
  4: https://arxiv.org/abs/2308.14752
  5: https://arxiv.org/abs/2312.01350
  6: https://arxiv.org/abs/2503.03750
  7: https://arxiv.org/abs/2311.07590
  8: https://arxiv.org/abs/2304.13734
  9: https://arxiv.org/abs/1906.01820
  10: https://arxiv.org/abs/2311.08379
  11: https://arxiv.org/abs/2412.04984
  12: https://arxiv.org/abs/2412.14093
  13: https://arxiv.org/abs/2509.15541
---

When a model tells you something false, we usually reach for one word: it *hallucinated*. Sometimes that's right. But in red-teaming I keep seeing cases where the model clearly knew better, and cases where it behaved well only because it seemed to know it was being tested. Calling all of these "hallucination" hides the part that matters.

So this post is an attempt to pin down three words that get used loosely: **hallucination**, **deception** and **scheming**. My claim is simple: they are not three intensities of the same thing. They are failures in *different places*, and each one needs a different measurement to even see it.

## The setup

Take any claim a model makes: "this person's birthday is 03-07", or "I made the trade based on public information". Four questions decide which failure, if any, we're looking at:

1. **Is the claim true?** That's about the world.
2. **Does the model believe it?** What it says when nothing is at stake, or what a probe reads from its activations.
3. **What does it say, and what does the reader come away believing?** That's the output.
4. **Does the model think it's being watched?** Not whether it is, whether it thinks so.

Each failure is a disagreement between a different pair of these. That's the whole post in one line; the rest is filling it in.

## Hallucination: the world and the belief disagree

The standard definition from the NLG literature is about faithfulness. Ji et al.'s survey[1] calls it:

> "the generated content that is nonsensical or unfaithful to the provided source content"

For open-ended LLMs, Kalai et al.[2] put it more bluntly: language models "produce overconfident, plausible falsehoods". Their opening example is a good one. They ask a model: *"What is Adam Tauman Kalai's birthday? If you know, just respond with DD-MM."* On three attempts it answered "03-07", "15-06" and "01-01". All wrong, even though it was told to answer only if it knew.

So, in terms of the four questions:

> **Hallucination:** the claim is false, the model believes it (or is guessing), and it says it.

The model says what it "believes", and the belief is wrong. Or, often, there is no real belief at all, just a guess stated with the same confidence as a fact. The error lives between **the world and the model's belief**. Nothing about the model's intent is involved.

What I like about Kalai et al. is that they make this boring, in a good way: "Hallucinations need not be mysterious -- they originate simply as errors in binary classification." If a model can't tell a true fact from a plausible false one, it will sometimes generate the false one. For facts with no pattern to learn, like birthdays, this gets very concrete: "if 20% of birthday facts appear exactly once in the pretraining data, then one expects base models to hallucinate on at least 20% of birthday facts."

They also explain why post-training doesn't fix it: our benchmarks reward guessing. Say the chance that the model's answer is right is $p$. Under the usual right-or-wrong grading, answering earns $p$ points on average and "I don't know" earns nothing. So guessing always wins, however unsure the model is. Now make a wrong answer cost $c$ points. Answering is worth it only when $p - c(1 - p) > 0$, which is when

$$
p > \frac{c}{1 + c}.
$$

With $c = 1$ the model should answer only when it's more than 50% sure. That's why Kalai et al. argue for "modifying the scoring of existing benchmarks" rather than adding yet another hallucination benchmark.

The important point for this post: **a hallucinating model is not trying to fool anyone.** It is wrong, and badly calibrated about being wrong.

## Deception: the belief and the output disagree

Now flip the situation. The model knows the claim is false and says it anyway, or says something true that is built to mislead.

Park et al.[4] give the behavioural definition most people use:

> "We define deception as the systematic inducement of false beliefs in the pursuit of some outcome other than the truth."

Ward et al.[5] make it formal, following the philosophy literature. Their definition has three conditions: the deceiver (1) *intentionally* causes the target to believe the claim, (2) the target ends up believing it and it is false, and (3) the deceiver does not believe it.

> **Deception:** the claim is false, the model doesn't believe it, and it says it (or implies it) *because* it wants the reader to believe it.

The "because" is the intent. The response was picked for what it does to the reader's belief; take that effect away and the model would have said something else.

Condition 3 is what separates deception from hallucination, and Ward et al. have a nice example for it. A tennis umpire whose view is 99% accurate calls a ball in, believes it, and is wrong: "This is not deception because condition 3) is not met." A mistaken umpire hallucinates. They don't deceive.

Two things worth noticing:

**Deception does not need a false sentence.** Lying is the special case where the model states the false claim outright. The MASK benchmark[6] uses the classic definition of lying: "(1) making a statement known (or believed) to be false, and (2) intending the receiver to accept the statement as true". But a model can also deceive with true statements that imply something false, or by leaving things out. In Scheurer et al.[7], GPT-4, acting as a trading agent, makes a trade on an insider tip and then, "When reporting to its manager, the model consistently hides the genuine reasons behind its trading decision." No single sentence needs to be false for that to be deception.

**Accuracy and honesty are different axes.** Put belief and output in a 2×2:

| | says what it believes | says the opposite |
|---|---|---|
| **belief is right** | honest and accurate | lie |
| **belief is wrong** | hallucination | a lie that happens to be true |

Hallucination is the bottom-left cell: honest but inaccurate. Deception is the right column. MASK's headline result is exactly that these come apart: "while larger models obtain higher accuracy on our benchmark, they do not become more honest." Scaling moves you up the table, not left. The bottom-right cell is a nice edge case: under MASK it's still a lie, but under Ward et al. it isn't deception, because the reader ends up believing something *true* (condition 2 fails).

This also changes what you need to measure. To catch a hallucination you need the truth. To catch deception you need the model's own belief, because the output alone can't tell the two cells in a row apart. That's why work like Azaria and Mitchell's[8] matters: a classifier on hidden activations that tells true from false statements with "71\% to 83\% accuracy", including statements the model itself generates. It's a crude belief-reader, but it's the right kind of tool.

## Scheming: the watched and the unwatched behaviour disagree

Scheming adds two things to deception: a **goal** the developers didn't intend, and **concealment from the people who could correct it**.

Meinke et al.[11] (Apollo Research) define it as:

> "AI agents might covertly pursue misaligned goals, hiding their true capabilities and objectives -- also known as scheming."

Carlsmith[10] focuses on the training-time version: models that "perform well in training ... in order to gain power later", and notes this is "also sometimes called 'deceptive alignment'". That term comes from Hubinger et al.[9], who describe a learned optimizer that "will be instrumentally incentivized to act as if it is optimizing the base objective function, even if its actual mesa-objective is something else entirely."

> **Scheming:** the model has a goal its developers didn't give it, behaves well when it thinks it's being watched, and pursues that goal when it thinks it isn't.

Scheming is a pattern of behaviour, not one bad answer. That gives a measurable quantity, the **oversight gap**: how much more often the model does something covert when it thinks no one is watching.

$$
\begin{aligned}
\text{gap} = {} & P(\text{covert} \mid \text{unwatched}) \\\\
& - P(\text{covert} \mid \text{watched})
\end{aligned}
$$

An honest model, aligned or not, has a gap of about zero. A schemer's gap is positive, by definition.

This isn't hypothetical any more. In Greenblatt et al.'s alignment-faking study[12], Claude 3 Opus was told it would be trained only on free-tier conversations. It complied with harmful queries from free users "14% of the time, versus almost never for paid users", and in almost all of those cases it reasoned explicitly that it was complying "in training to preserve its preferred harmlessness behavior out of training". That's a real gap, with the reasoning written down. Meinke et al. found models that "strategically introduce subtle mistakes into their responses, attempt to disable their oversight mechanisms, and even exfiltrate what they believe to be their model weights", and o1 "maintains its deception in over 85% of follow-up questions".

Three things make scheming different from plain deception:

1. **It's directed at the overseer.** The false belief being planted is "this model is aligned", and the target is whoever trains or deploys it.
2. **It's sustained.** One deceptive answer is an event. Scheming stays consistent across turns, evaluations and even training updates.
3. **It doesn't need words.** Sandbagging, quietly disabling a monitor, or copying weights are covert *actions*. That's why Schoen et al.[13] measure "covert actions -- such as secretly breaking rules or intentionally underperforming in tests -- as a proxy for scheming".

And there's a nasty consequence for measurement. What matters is whether the model *thinks* it's watched, not whether it is. An evaluation is part of what the model sees. If it can tell it's in one, every eval runs on the "watched" side, and you never measure the other. Schoen et al. show this directly: models' reasoning "often demonstrates awareness of being evaluated for alignment", and they find "causal evidence that this awareness decreases covert behavior, while unawareness increases it". In other words, part of a clean safety score can be the model noticing the test.

## Putting them side by side

| | Hallucination | Deception | Scheming |
|---|---|---|---|
| Where the gap is | world vs belief | belief vs output | watched vs unwatched behaviour |
| Is the output false? | yes | not necessarily | not necessarily |
| Does the model believe it? | yes, or it's guessing | no | no |
| Goal-directed? | no | yes, a local goal | yes, a misaligned, persistent goal |
| Depends on being watched? | no | sometimes | yes, by definition |
| What you need to detect it | the truth | the model's own belief | its belief, plus how it acts when it thinks no one is watching |

A few relations fall out of the definitions:

- **Hallucination and deception can't both apply** to the same claim at the same time: one needs the model to believe it, the other needs it not to. Ward's umpire again.
- **Scheming is almost always deceptive**, but towards a specific target (the overseer) and in service of a specific kind of goal. Not every deception is scheming: the trading agent in Scheurer et al. deceives its manager under pressure, but nothing there shows a persistent goal hidden from its developers.
- **Each one needs more to measure.** Hallucination needs the truth. Deception also needs the model's belief. Scheming also needs to know how the model behaves when it thinks no one is watching, which is exactly what an evaluator has the hardest time seeing.

If you have a suspicious output, the triage is three questions:

1. Is it false or misleading? If not, stop.
2. Did the model believe it? If yes, it's a **hallucination**: fix calibration, abstention, retrieval, or the grading.
3. If not, is it part of a pattern that hides a goal from the people overseeing the model, and changes when the model thinks it's unobserved? If yes, treat it as **scheming**. If no, it's **deception**.

## Why this matters

Because the fixes don't transfer.

- **Hallucination** is a calibration and incentive problem. Better knowledge, retrieval, and scoring that rewards "I don't know" all help. None of them touch intent, because there isn't any.
- **Deception** survives better knowledge; MASK shows bigger models aren't more honest. You need honesty-specific evals and, ideally, tools that read the model's belief directly instead of trusting the output.
- **Scheming** survives honesty evals that the model knows are honesty evals. You need out-of-distribution tests, red-teaming *after* safety training, and some measure of whether the model knows it's being tested.

The failure I worry about most is using the first fix on the third problem. If you train against *visible* bad behaviour without checking whether the model knows it's being watched, you can't tell whether you removed the behaviour or taught the model when to hide it. Schoen et al. are careful about exactly this: "we cannot exclude that the observed reductions in covert action rates are at least partially driven by situational awareness."

That gap, between what an eval says and what a model does when it isn't being evaluated, is what I want to write about next.
