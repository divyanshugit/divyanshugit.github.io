# **Temporal Dynamics of Safety in Diffusion-Based Language Models**

---

## **1. Motivation**

Diffusion-based language models (dLLMs) such as **Dream-7B**, **DiffusionLM**, and **DenoiseGPT** are gaining attention for their *parallel decoding, bidirectional context modeling,* and *improved controllability* over autoregressive (AR) LLMs.
Yet, emerging red-teaming studies — notably **DIJA (Masked-Context Jailbreaks)** and **PAD (Parallel-Decoding Attacks)** — reveal that these models exhibit **unique and severe safety failures**, achieving attack-success rates (ASR) exceeding 90%.

Unlike AR models that generate tokens sequentially, dLLMs produce text via **iterative denoising** of latent representations. Each step refines a partially “noisy” sequence conditioned on both left and right context.
This iterative and bidirectional nature invalidates standard *guardrails* and *refusal-heads*, which operate on complete outputs or unidirectional prefixes.

Current safety approaches fail because they treat alignment as a *static constraint* on output tokens.
In diffusion LLMs, however, **alignment evolves dynamically across time**, diffusing through the denoising trajectory and sometimes collapsing mid-generation.

---

## **2. Research Vision**

We propose to model, measure, and mitigate **the temporal evolution of safety alignment** within diffusion-based language models.

Our core idea:

> *Safety alignment in diffusion models behaves like a dynamic system—its stability can be quantified, visualized, and controlled across denoising time.*

The work unfolds along three complementary axes:

1. **Mechanistic Mapping** – *When and why does safety fail?*
2. **Temporal Alignment** – *How can we intervene in-loop to prevent failure?*
3. **Cross-Architecture Transfer** – *Do diffusion-specific vulnerabilities generalize to other decoding paradigms?*

---

## **3. Research Questions and Hypotheses**

| Axis                            | Core Question                                                                                  | Key Hypotheses                                                                                                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mechanistic Mapping**         | How does the probability of unsafe token emergence evolve across denoising steps?              | H1: Harmful content follows a *phase-transition curve* in diffusion time.<br>H2: Once unsafe tokens appear, they become *irreversible* due to bidirectional consistency.          |
| **Temporal Alignment**          | Can step-wise or “in-loop” alignment reduce harmful emergence earlier than end-only filtering? | H3: Mid-trajectory alignment heads or re-noising gates can delay or prevent alignment collapse.<br>H4: Adaptive weighting of risk by step index minimizes harm-fluency trade-off. |
| **Cross-Architecture Transfer** | Do jailbreaks and alignment failures transfer between diffusion and autoregressive models?     | H5: dLLM→AR transfer is high due to shared embeddings, but AR→dLLM is weaker.<br>H6: Dilated scheduling increases vulnerability by synchronizing harmful cue updates.             |

---

## **4. Methodology**

### **(A) Mechanistic Mapping**

1. **Step-wise Logging:** Modify Dream-7B inference loop to record intermediate denoising states, logits, and partial text at each step.
2. **Metrics:**

   * *First Harmful Step (FHS)* – earliest step where any toxic span appears.
   * *Irreversibility Index (IR)* – probability that harm persists despite later re-noising.
   * *KL Drift* – divergence between step-wise token distributions.
3. **Visualizations:** Temporal heatmaps of token risk, scheduler vs drift curves, phase-transition plots.

### **(B) Temporal Alignment (In-Loop Guardrails)**

1. **Step-wise Risk Scoring:** Run a lightweight classifier every ( k ) steps; re-noise spans exceeding threshold ( \tau ).
2. **Mask-Aware Gating:** Before unmasking a span, score candidate fills via short rollouts and veto unsafe options.
3. **Learned Temporal Policy Head:** Train an auxiliary head to minimize an integrated alignment loss
   [
   \mathcal{L}_{align} = \int_0^T \lambda_t , \text{Risk}(x_t), dt
   ]
   controlling risk continuously through diffusion time.
4. **Comparisons:** End-only filtering vs early/mid/late interventions; linear vs dilated schedules.

### **(C) Cross-Architecture Transfer**

1. **Attack Suites:** Apply DIJA and PAD jailbreaks to Dream-7B and a matched AR baseline (e.g., LLaMA-2-7B).
2. **Metrics:**

   * *Transfer Index* = ASR_target / ASR_source
   * *Cue Amplification Curve:* ASR vs number of distributed cues.
   * *FHS* under differing schedules.
3. **Analysis:** Quantify which semantic patterns generalize across architectures and identify architecture-specific vulnerabilities.

---

## **5. Computational Plan**

| Resource           | Estimate                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------- |
| **Models**         | Dream-7B (diffusion), LLaMA-2-7B (AR baseline)                                              |
| **Datasets**       | 1 000 harmful + 500 benign prompts (AdvBench / HarmBench), auto-converted to DIJA/PAD forms |
| **Compute**        | 4 × A100 80 GB nodes; 64 denoising steps per prompt (≈6–8 min/prompt)                       |
| **Storage**        | ~3 TB raw step-logs → aggregated statistics retained                                        |
| **Analysis Tools** | PyTorch + custom logging hooks + pandas/matplotlib for per-step metrics                     |

---

## **6. Evaluation and Expected Outcomes**

| Metric                           | Interpretation                              |
| -------------------------------- | ------------------------------------------- |
| **ASR ↓ / FHS ↑**                | Temporal alignment effectiveness            |
| **ΔLatency**                     | Efficiency cost of in-loop control          |
| **KL Drift Slope**               | Rate of alignment decay                     |
| **Transfer Index**               | Cross-architecture vulnerability            |
| **Temporal Risk Integral (TRI)** | Area-under-risk curve across diffusion time |

**Deliverables**

* *Diffusion Safety Probe* — open toolkit for per-step risk visualization.
* *Temporal Alignment Benchmarks* — public results on DIJA/PAD under various schedulers.
* **Publications:**

  * *“Alignment Drift in Diffusion LMs”* (mechanistic)
  * *“Temporal Alignment for Diffusion Decoders”* (algorithmic)
  * *“Transferable Jailbreaks Across Architectures”* (comparative)
  * Unified ICML main paper: **“Temporal Dynamics of Safety in Diffusion-Based Language Models.”**

---

## **7. Expected Impact**

This work reframes **AI safety as a dynamic process** rather than a static property of final outputs.
By quantifying and intervening in safety *over time*, we aim to:

* Establish the first **temporal safety framework** for diffusion-based language models.
* Bridge mechanistic interpretability and alignment control.
* Provide actionable insights for designing safer text and multimodal diffusion systems.

**Broader Vision:**
As diffusion architectures expand beyond text (e.g., multimodal agents, planning, code synthesis), understanding *when and how alignment fails temporally* will define the next generation of trustworthy generative AI.

