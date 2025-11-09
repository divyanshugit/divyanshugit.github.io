---
layout: blog-post.njk
title: "🔍 InterrogateLLM: In Search of Truth"
description: Explore how InterrogateLLM addresses AI hallucination in a straightforward manner.
date: 2024-04-28
tags:
  - LLMs
  - Hallucinations
  - AI Safety
emailSubject: InterrogateLLM Blog
featured: false
permalink: /blog/interrogate-llm.html
references:
  1: https://arxiv.org/abs/2403.02889
  2: https://itzikmalkiel.github.io/
---

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        <img src="/assets/img/interrogatellm.png" alt="InterrogateLLM" class="img-fluid rounded z-depth-1" loading="eager" />
    </div>
</div>

In the world of LLMs, one big puzzle is hallucination. It's when LLM makes up stuff that isn't true, and it's been confusing experts for a long time. This makes it hard to trust what LLM says. There is a new paper called InterrogateLLM[1] by Itzik Malkiel[2] and Yakir Yehuda that might help clear things up.


To identify hallucination in an answer, it does something simple: it asks the model a bunch of times to recreate the original question using the answer it generated, much like SelfCheckGPT, which examines hallucination in the response. Then, InterrogateLLM measures how much the new versions of the question differ from the original one. When there's a big difference, it suggests there might be a hallucination. Basically, if the model is making stuff up, it won't be able to stick to the original question when asked to repeat it. This way of questioning forms the core of our method for finding hallucinations in answers.

## Here's how the entire process works

**Step 1: Generating Answers from Query**

We start with asking the LLM to provide answers to a given question, saving the answers for later examination and reconstruction.

**Step 2: Reconstructing Queries from Answers**

This is where the real magic happens. Building on the answers from the previous step, InterrogateLLM uses a backward process to piece together the original question. By carefully comparing the generated answers with the intended question, the system reconstructs what was initially asked.

**Step 3: Generating Text Embeddings of Queries & Reconstructed Queries**

Now, with both the original question and its reconstructed version on hand, InterrogateLLM creates text embeddings for each. Text embeddings transform textual information into high-dimensional vectors, making it easier to compare and analyze them.

**Final Step: Predicting Hallucinations with SBERT**

The final piece of the puzzle involves using SBERT(Sentence-BERT). By comparing the text embeddings of the original question and its reconstruction, SBERT determines if there's any hallucination. If the similarity is below a certain threshold, suggesting significant deviation between the two, it raises a flag for potential hallucination.


While not a complete solution to the hallucination problem, InterrogateLLM represents a promising step toward more reliable and trustworthy language AI systems. Where it provides a systematic framework for identifying hallucination in any domain by assessing the discrepancy between the intended query and the generated response. As research in this area progresses, we can expect further improvements and innovations to solve the problem of Hallucinations.