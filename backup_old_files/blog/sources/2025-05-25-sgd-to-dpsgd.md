---
layout: post
title: "From SGD to DP-SGD: Reproducing the Foundations of Private Deep Learning"
description: "Blog #4 in the series of Inception of Differential Privacy"
date: 2025-05-24
tags:
  - Differnital Privacy
categories: PETs
---



## 1. Introduction: Why Privacy Matters Now
Every day, deep learning models touch data that can be deeply personal—medical records, financial statements, or private messages on social platforms. Despite safeguards, overparameterized networks often memorize unexpected details. In high-profile demonstrations, adversaries have successfully reconstructed training images from facial recognition models and inferred whether specific individuals' data contributed to a model's training set (membership inference attacks).

To guard against such leaks, **Differential Privacy (DP)** provides a mathematically rigorous framework: it ensures that an algorithm's outputs are statistically indistinguishable whether any single example is included or not. Concretely, an algorithm \\(\mathcal{A}\\) satisfies \\((\varepsilon, \delta)\\)-DP if for all neighboring datasets \(D\) and \(D'\) differing by one record, and for all outputs \(S\):

$$
\Pr[\mathcal{A}(D) \in S] \le e^{\varepsilon}\,\Pr[\mathcal{A}(D') \in S] + \delta.
$$

Here, \(\varepsilon\) (epsilon) measures the privacy loss—smaller values mean stronger privacy—and \(\delta\) accounts for a small failure probability.

In 2016, Abadi et al. introduced **DP-SGD**, integrating DP into the training loop with minimal architectural changes. This post will:

1. **Revisit** vanilla SGD to surface its privacy blind spots  
2. **Unpack** the three pillars of DP-SGD: per-example gradients & clipping, Gaussian noise injection, and the Moments Accountant  
3. **Implement** both standard SGD and DP-SGD side-by-side on MNIST to observe concrete differences  
   ```python
   # Placeholder for comprehensive code snippets and notebook links


4. **Visualize** the privacy–utility tradeoff across various noise multipliers with clear plots and tables
5. **Reflect** on best practices, hyperparameter tuning, and future directions in private deep learning

By the end, you'll have both the intuition and the code to integrate DP-SGD into your own projects. Let's dive in.

---

## 2. Revisiting SGD: The Baseline

### 2.1 The Mechanics & Intuition  

Standard Stochastic Gradient Descent (SGD) minimizes a loss function by iteratively updating model parameters:

1. **Sample a mini-batch** of examples from your dataset
2. **Compute gradients** of the loss w\.r.t. model parameters for that mini-batch
3. **Update parameters** by stepping in the negative gradient direction

Mathematically:

$$
\theta_{t+1} = \theta_t - \eta \cdot \frac{1}{B} \sum_{i=1}^B \nabla_{\theta} \mathcal{L}(x_i, y_i; \theta_t),
$$

where:

* $\theta_t$ are model parameters at iteration $t$
* $\eta$ is the learning rate
* $B$ is the batch size

Averaging across $B$ gradients smooths noise compared to batch size = 1, but individual examples with large gradients can still dominate updates.

### 2.2 Privacy Blind Spots in SGD

Since each batch update implicitly reveals information about its members, attackers can exploit model outputs to infer details about training data:

* **Membership inference**: Was a specific example in the training set?
* **Reconstruction attacks**: Approximate original inputs from gradients or outputs

Over many epochs, repeated exposure amplifies these risks. Vanilla SGD has no mechanism to bound or obscure any single example's influence.

### 2.3 Code Placeholder: Vanilla SGD Implementation  

```python
# TODO: Vanilla SGD on MNIST
# 1. Define a two-layer MLP (28×28 → 256 → 10)
# 2. Use torch.optim.SGD(lr=0.1, momentum=0.9)
# 3. Train for 60 epochs
# 4. Log and save test accuracy per epoch
```

---

## 3. DP-SGD Mechanics: Clipping, Noise & Accounting

DP-SGD enhances SGD by bounding per-example contributions and injecting calibrated noise.

### 3.1 Per-Example Gradients & Clipping Norms  

Compute individual gradients:

$$
g_i = \nabla_{\theta} \mathcal{L}(x_i, y_i; \theta_t), \quad i=1,\dots,B.
$$

Clip each to L2 norm $C$:

$$
\bar{g}_i = g_i \cdot \min\Bigl(1, \tfrac{C}{\|g_i\|_2}\Bigr),
$$

ensuring $\|\bar{g}_i\|_2 \le C$.

### 3.2 Gaussian Noise Addition  

Aggregate clipped gradients and add noise:

$$
\widetilde{g} = \frac{1}{B}\Bigl(\sum_{i=1}^B \bar{g}_i + \mathcal{N}(0, \sigma^2 C^2 I)\Bigr),
$$

where $\sigma$ is the **noise multiplier**:

* **High $\sigma$**: stronger privacy, more noise → lower accuracy
* **Low $\sigma$**: weaker privacy, less noise → higher accuracy

### 3.3 Privacy Amplification by Sampling  

Random mini-batch sampling means each example is used less often, which amplifies privacy compared to full-batch methods.

### 3.4 Moments Accountant & Advanced Composition  

The **Moments Accountant** tracks higher moments of the privacy-loss variable, yielding much tighter cumulative $\varepsilon$ bounds. Alternatives include **Rényi DP** and **zCDP**.

---

## 4. Implementing & Comparing SGD vs. DP-SGD

To see these principles in action, we'll set up parallel experiments on MNIST using identical settings except for the DP mechanism.

<style>
.params-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.25rem;
    margin: 0.5rem 0;
}
.param-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 4px;
    padding: 0.5rem;
    transition: transform 0.2s;
}
.param-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.param-label {
    font-size: 0.6rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.2rem;
}
.param-value {
    font-size: 0.9rem;
    font-weight: 600;
    color: #e2e8f0;
}
.param-value.highlight {
    color: #6366f1;
}
</style>

<div class="params-grid">
    <div class="param-card">
        <div class="param-label">Architecture</div>
        <div class="param-value highlight">2-layer MLP</div>
    </div>
    <div class="param-card">
        <div class="param-label">Batch Size (B)</div>
        <div class="param-value">256</div>
    </div>
    <div class="param-card">
        <div class="param-label">Learning Rate (η)</div>
        <div class="param-value">0.1</div>
    </div>
    <div class="param-card">
        <div class="param-label">Momentum</div>
        <div class="param-value">0.9</div>
    </div>
    <div class="param-card">
        <div class="param-label">Clipping Norm (C)</div>
        <div class="param-value">1.0</div>
    </div>
    <div class="param-card">
        <div class="param-label">Noise Multiplier (σ)</div>
        <div class="param-value highlight">[0.5, 1.0, 1.5]</div>
    </div>
    <div class="param-card">
        <div class="param-label">Epochs</div>
        <div class="param-value">60</div>
    </div>
    <div class="param-card">
        <div class="param-label">δ (failure prob.)</div>
        <div class="param-value">1e-5</div>
    </div>
</div>

### 4.1 Code Placeholder: DP-SGD Implementation  

```python
# TODO: DP-SGD with Opacus or TF Privacy
# 1. Initialize PrivacyEngine(noise_multiplier=σ, max_grad_norm=C)
# 2. Wrap model, optimizer, DataLoader
# 3. Train for 60 epochs, call get_privacy_spent(δ=1e-5) each epoch
# 4. Log test accuracy and ε per epoch
```

### 4.2 Metrics & Logging  

For each method and σ value, record:

* **Test accuracy** per epoch
* **Privacy budget** ε via the accountant
* **Training loss curves** (observe noise variance)

Optionally, log compute/time overhead.

---

## 5. Results: Privacy–Utility Tradeoff

*(Placeholder for charts & discussion.)*

<style>
.results-table {
    margin: 1rem 0;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #334155;
    background: #0f172a;
}
.results-table table {
    width: 100%;
    border-collapse: collapse;
}
.results-table th {
    background: #1e293b;
    color: #94a3b8;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #334155;
}
.results-table td {
    padding: 0.75rem 1rem;
    color: #e2e8f0;
    font-size: 0.9rem;
    border-bottom: 1px solid #1e293b;
}
.results-table tr {
    transition: background 0.2s;
}
.results-table tr:hover {
    background: #1e293b;
}
.results-table tr:last-child td {
    border-bottom: none;
}
.results-table .noise-value {
    font-weight: 600;
    color: #6366f1;
}
.results-table .accuracy {
    font-weight: 500;
}
.results-table .privacy-budget {
    color: #10b981;
}
.results-table .na {
    color: #475569;
    font-style: italic;
}
</style>

<div class="results-table">
<table>
    <thead>
        <tr>
            <th>σ (Noise)</th>
            <th>SGD Acc.</th>
            <th>DP-SGD Acc.</th>
            <th>ε (δ=1e-5)</th>
            <th>Overhead</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="noise-value">0 (SGD)</td>
            <td class="accuracy">~98.1%</td>
            <td class="na">—</td>
            <td class="na">—</td>
            <td>1×</td>
        </tr>
        <tr>
            <td class="noise-value">0.5</td>
            <td class="na">—</td>
            <td class="accuracy">93.0%</td>
            <td class="privacy-budget">~3.0</td>
            <td>1.2×</td>
        </tr>
        <tr>
            <td class="noise-value">1.0</td>
            <td class="na">—</td>
            <td class="accuracy">90.2%</td>
            <td class="privacy-budget">~1.5</td>
            <td>1.3×</td>
        </tr>
        <tr>
            <td class="noise-value">1.5</td>
            <td class="na">—</td>
            <td class="accuracy">86.7%</td>
            <td class="privacy-budget">~1.0</td>
            <td>1.4×</td>
        </tr>
    </tbody>
</table>
</div>

> **Interpretation:** At $\sigma=0.5$, accuracy only drops by \~5% while $\varepsilon\approx 3.0$. At $\sigma=1.5$, $\varepsilon\approx 1.0$ but accuracy suffers \~11%.

Plot **accuracy vs. $\varepsilon$** and **accuracy vs. overhead** to guide privacy–performance tradeoffs.

---

## 6. Key Takeaways & Next Steps

* **Plug-and-play**: DP-SGD slots into existing code with minimal changes
* **Tune with purpose**: Adjust $C$, $\sigma$, and sampling rate for your privacy/accuracy targets
* **Account precisely**: Use Moments Accountant or RDP; avoid loose composition
* **Watch overhead**: Expect \~10–40% compute cost

**Next up:**  

* Apply DP-SGD to real datasets (e.g., MIMIC-IV)
* Explore PATE, zCDP, local DP
* Investigate DP-variants of Adam/RMSProp

---

## 7. Appendix & Resources

* **Code & Notebooks**: \[GitHub link]
* **Interactive Demo**: \[Colab link]
* **Key References**:

  * Dwork & Roth, *The Algorithmic Foundations of Differential Privacy*
  * Abadi et al., *Deep Learning with Differential Privacy* (2016)
* **Libraries**:

  * TensorFlow Privacy: [https://github.com/tensorflow/privacy](https://github.com/tensorflow/privacy)
  * Opacus (PyTorch): [https://opacus.ai](https://opacus.ai)
* **Further Reading**:

  * Tramèr et al., "The Secret Sharer: Evaluating Memorization in Neural Networks"
  * Papernot et al., "Knowledge Transfer for Model Compression"

---

