---
layout: projects-page.njk
title: Projects
pageTitle: Projects
overline: "Projects · in progress and finished"
description: "Projects by Divyanshu Kumar: the temporal dynamics of safety in diffusion language models, and earlier work on real-time diarization, edge computer vision, readability and RAG validation."
permalink: /projects.html
intro: "One question on my desk now, and the things I built before it."
# Glosses for the working terms of the lead project. They appear as one margin
# note beside the methodology line that names them. (Owner: check the wording.)
metrics:
  - term: "First Harmful Step"
    gloss: "the earliest denoising step at which the partial output already reads as harmful."
  - term: "Irreversibility Index"
    gloss: "once that step is reached, how often the final text stays harmful."
  - term: "KL Drift"
    gloss: "how far the token distribution moves from one step to the next."
figCaption: "Schematic, not data. Risk of the partial output at each denoising step, from pure noise (T) to the finished text (0). The first harmful step is where it first crosses the line; irreversibility asks whether it ever comes back under."
collaborate: "If you work on diffusion language models, or on guardrails that have to run inside a decoder, I would like to compare notes."
---
