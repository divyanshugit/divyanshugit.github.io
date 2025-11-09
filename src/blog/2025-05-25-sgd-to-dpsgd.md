---
layout: blog-post.njk
title: "From SGD to DP-SGD: Reproducing the Foundations of Private Deep Learning"
description: "Blog #4 in the series of Inception of Differential Privacy"
date: 2025-05-24
tags:
  - Differential Privacy
  - PETs
  - Deep Learning
emailSubject: Differential Privacy Blog Series - DP-SGD
featured: false
permalink: /blog/sgd-to-dpsgd.html
---

## 1. Introduction: Why Privacy Matters Now
Every day, deep learning models touch data that can be deeply personal—medical records, financial statements, or private messages on social platforms. Despite safeguards, overparameterized networks often memorize unexpected details. In high-profile demonstrations, adversaries have successfully reconstructed training images from facial recognition models and inferred whether specific individuals' data contributed to a model's training set (membership inference attacks).

To guard against such leaks, **Differential Privacy (DP)** provides a mathematically rigorous framework: it ensures that an algorithm's outputs are statistically indistinguishable whether any single example is included or not. Concretely, an algorithm $\mathcal{A}$ satisfies $(\varepsilon, \delta)$-DP if for all neighboring datasets $D$ and $D'$ differing by one record, and for all outputs $S$:

$$
\Pr[\mathcal{A}(D) \in S] \le e^{\varepsilon}\,\Pr[\mathcal{A}(D') \in S] + \delta.
$$

Here, $\varepsilon$ (epsilon) measures the privacy loss—smaller values mean stronger privacy—and $\delta$ accounts for a small failure probability.

In 2016, Abadi et al. introduced **DP-SGD**, integrating DP into the training loop with minimal architectural changes. This post will:

1. **Revisit** vanilla SGD to surface its privacy blind spots  
2. **Unpack** the three pillars of DP-SGD: per-example gradients & clipping, Gaussian noise injection, and the Moments Accountant  
3. **Implement** both standard SGD and DP-SGD side-by-side on MNIST to observe concrete differences

---

## 2. The Privacy Vulnerabilities of Standard SGD

Standard Stochastic Gradient Descent operates by:

1. Sampling a mini-batch of examples
2. Computing gradients with respect to the loss
3. Updating model parameters in the direction that reduces loss

The privacy concern arises because gradients can leak information about the training data. Consider a simple example: if a model memorizes a specific training example, the gradient computed on that example will be significantly different from gradients computed on other examples.

### Gradient-Based Privacy Attacks

Several types of attacks exploit gradient information:

- **Membership Inference:** Determining whether a specific example was in the training set
- **Property Inference:** Learning global properties of the training data
- **Model Inversion:** Reconstructing training examples from model parameters

---

## 3. The Three Pillars of DP-SGD

### Pillar 1: Per-Example Gradient Computation and Clipping

Instead of computing gradients over entire mini-batches, DP-SGD computes gradients for each example individually. This allows for fine-grained control over the contribution of each example to the parameter update.

The gradient clipping step ensures that no single example can have an outsized influence on the model update:

$$
\tilde{g}_i = g_i / \max(1, \|g_i\|_2 / C)
$$

where $C$ is the clipping threshold and $g_i$ is the gradient for example $i$.

### Pillar 2: Gaussian Noise Injection

After clipping, Gaussian noise is added to the aggregated gradients:

$$
\tilde{g} = \frac{1}{|B|} \sum_{i} \tilde{g}_i + \mathcal{N}(0, \sigma^2 C^2 I)
$$

The noise scale $\sigma$ is calibrated to the sensitivity of the gradient computation and the desired privacy level.

### Pillar 3: Privacy Accounting with the Moments Accountant

The Moments Accountant provides a tight analysis of the privacy cost accumulated over multiple iterations of DP-SGD. This is crucial because privacy "budget" is consumed with each parameter update.

---

## 4. Implementation: SGD vs DP-SGD

Let's implement both algorithms to see the differences in practice:

```python
import torch
import torch.nn as nn
import torch.optim as optim
from opacus import PrivacyEngine

# Standard SGD training loop
def train_standard_sgd(model, dataloader, epochs=10):
    optimizer = optim.SGD(model.parameters(), lr=0.01)
    criterion = nn.CrossEntropyLoss()
    
    for epoch in range(epochs):
        for batch_idx, (data, target) in enumerate(dataloader):
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()

# DP-SGD training loop
def train_dp_sgd(model, dataloader, epochs=10, epsilon=1.0, delta=1e-5):
    optimizer = optim.SGD(model.parameters(), lr=0.01)
    privacy_engine = PrivacyEngine()
    
    model, optimizer, dataloader = privacy_engine.make_private(
        module=model,
        optimizer=optimizer,
        data_loader=dataloader,
        noise_multiplier=1.1,
        max_grad_norm=1.0,
    )
    
    criterion = nn.CrossEntropyLoss()
    
    for epoch in range(epochs):
        for batch_idx, (data, target) in enumerate(dataloader):
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()
            
        # Check privacy budget
        epsilon_spent = privacy_engine.get_epsilon(delta)
        print(f"Epoch {epoch}: ε = {epsilon_spent:.2f}")
```

---

## 5. Key Differences and Trade-offs

### Performance Impact

DP-SGD typically results in:

- **Slower convergence:** Noise injection slows down learning
- **Lower final accuracy:** Privacy comes at the cost of utility
- **Increased computational overhead:** Per-example gradient computation is expensive

### Privacy Guarantees

The privacy guarantee depends on three key parameters:

- **ε (epsilon):** Privacy budget - smaller values mean stronger privacy
- **δ (delta):** Failure probability - typically set to 1/n where n is dataset size
- **Noise multiplier:** Controls the amount of noise added to gradients

---

## 6. Practical Considerations

### Hyperparameter Tuning

DP-SGD introduces several new hyperparameters that require careful tuning:

- **Clipping threshold (C):** Too small hurts utility, too large hurts privacy
- **Noise multiplier (σ):** Must be calibrated to desired ε and δ
- **Batch size:** Larger batches can improve the privacy-utility trade-off

### When to Use DP-SGD

DP-SGD is most appropriate when:

- Training data contains sensitive personal information
- Regulatory requirements mandate privacy protection
- The utility cost is acceptable for the privacy benefit
- You have sufficient computational resources for per-example gradients

---

## 7. Conclusion

DP-SGD represents a fundamental shift from "privacy through obscurity" to mathematically rigorous privacy guarantees in deep learning. While it comes with computational and utility costs, it provides the strongest known privacy protection for training neural networks on sensitive data.

The key insight is that privacy is not binary—it's a spectrum that can be quantified and controlled through the choice of ε and δ. As privacy regulations become more stringent and public awareness of data protection grows, techniques like DP-SGD will become increasingly important for responsible AI development.

In the next post in this series, we'll explore advanced techniques for improving the privacy-utility trade-off in DP-SGD, including adaptive clipping and private aggregation methods.
