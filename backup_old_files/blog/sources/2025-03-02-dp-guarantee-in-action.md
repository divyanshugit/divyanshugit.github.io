---
layout: post
title: "DP Guarantee in Action"
description: "Blog #2 in the series of Inception of Differential Privacy"
date: 2025-03-02
tags:
  - Differnital Privacy
categories: PETs
---

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/dp_blog/2.png" title="example image" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

In the previous blog[^1], we discussed why traditional encryption and anonymization methods often fall short when balancing **privacy and utility**. We also introduced **Differential Privacy** as a promising solution to this challenge. Now, let's take a deeper dive into understanding how its privacy guarantees actually work:

## DP in Action: A formal Proof
Differential privacy (DP) is one of the most robust frameworks for ensuring data privacy in machine learning and data analytics. A key strength of DP is that *post-processing does not weaken privacy guarantees*. In simple terms, if you start with a differentially private mechanism and then apply any additional function to its output, the result remains differentially private.

In this one, we will formally prove that if a randomized mechanism $$M$$ is ($$\epsilon, \delta$$)-differentially private, then any further randomized transformation $$f$$ of its output does not degrade its privacy properties.

## Understanding the problem in hand
Let's define the terms formally:

We have a randomized algorithm (also called a mechanism)

$$  M : \mathbb{N}^{|X|} \to R $$

that satisfies ($$\epsilon, \delta$$)-differential privacy. This means that for all neighboring datasets $$D$$ and $$D'$$ (datasets that differ by at most one entry), and for all measurable subsets $$S \subseteq \mathbb{R}$$, we have:

$$\Pr[(f \circ M)(D) \in S_0] = \int_{\mathcal{R}} \Pr[f(r) \in S_0] \cdot \Pr[M(D) \in dx]$$

where $$Pr$$ represents the probability measure over the randomness in $$M$$.

We then define an *arbitrary randomized function*

$$  f: R \to R_0 $$

which transforms the output of $$M$$. Our goal is to show that the composed function:

$$   f \circ M : \mathbb{N}^{|X|} \to R_0 $$ 

is still ($$\epsilon, \delta$$)-differentially private.

## The Formal Proof
In other word, the the composite function can be defined as:

$$(f \circ M)(D) = f(M(D))$$

which means we first apply $$M$$ to $$$$ to get an intermediate result in $$$$, and then apply $$f$$ to transform that result into $$R_0$$.

We need to show that for any measurable set $$S_0 \subseteq  R_0$$, the mechanism $$f \circ M$$ satisfies:

$$\Pr[(f \circ M)(D) \in S_0] \leq e^{\varepsilon} \Pr[(f \circ M)(D') \in S_0] + \delta.$$

Using the law of total probability:

$$\Pr[f(M(D)) \in S_0] = \int_{\mathcal{R}} \Pr[f(r) \in S_0] \cdot \Pr[M(D) = r] \, dr.$$

Similarly, for $$D'$$

$$\Pr[f(M(D')) \in S_0] = \int_{\mathcal{R}} \Pr[f(r) \in S_0] \cdot \Pr[M(D') = r] \, dr.$$

By the differential privacy assumption for $$$$, we know:

$$\Pr[M(D) = r] \leq e^{\varepsilon} \Pr[M(D') = r] + \delta.$$

Multiplying both sides by $$\Pr[f(r) \in S_0]$$ (which is always non-negative) and integrating:

$$\int_{\mathcal{R}} \Pr[f(r) \in S_0] \cdot \Pr[M(D) = r] \, dr

\leq \int_{\mathcal{R}} \Pr[f(r) \in S_0] \cdot (e^{\varepsilon} \Pr[M(D') = r] + \delta) \, dr.$$


Since probabilities are at most 1, the last integral is at most 1, giving:

$$\Pr[f(M(D)) \in S_0] \leq e^{\varepsilon} \Pr[f(M(D')) \in S_0] + \delta.$$

This shows that applying $$$$ to the output of a differentially private mechanism does not increase the distinguishability between $$M(D)$$ and $$M(D')$$. Since $$f$$ does not have access to $$D$$ itself, it cannot extract additional information beyond what is already present in $$M(D)$$.

## But! Why Does This Matter?
This result, known as post-processing invariance, is crucial in privacy-preserving machine learning and data analysis because:

1. It allows us to safely process differentially private outputs: Once data has been privatized, further transformations (e.g., machine learning, reporting, visualization) do not weaken privacy.

2. It simplifies DP system design: We don't need to re-evaluate privacy guarantees at every stage if the input is DP, so is the output.

3. It ensures privacy-preserving AI models remain secure: Even if a DP mechanism is used as input to a complex algorithm, the final result will still respect the original DP guarantees.

## What's Next?
In the upcoming blogs[^2], we'll explore different privacy-preserving mechanisms, such as the Laplace Mechanism and the Exponential Mechanism, diving into how they inject randomness to ensure differential privacy. We'll break down their mathematical foundations, practical applications, and trade-offs, helping us understand when and how to use each effectively.

---

<div style="text-align: center;">
    <p><strong>Found this article helpful or have questions? 💡</strong></p>
    <p>I'm always happy to discuss Differential Privacy, answer your questions, or hear your feedback.</p>
    <p><strong><a href="mailto:kumardivy1999@gmail.com?subject=Discussion:%20Differential%20Privacy%20Blog%20Series">📧 Click here to send me an email</a></strong></p>
</div>

---

## References

[^1]: Kumar, D. (2025). [Differential Privacy!! But Why?](https://dvynsh.org/blog/2025/differential-privacy-but-why/)

[^2]: Kumar, D. (2025). [Upcoming topics in this series / Inception of DP](https://github.com/divyanshugit/Inception-of-DP)
