---
layout: simple.njk
title: Projects
description: "Projects by Divyanshu Kumar: the temporal dynamics of safety in diffusion language models, and earlier work on real-time diarization, edge computer vision, readability and RAG validation."
permalink: /projects.html
mascot: true
---
<div class="g-head">{% guide { pose: "look", w: 72, wp: 64, cls: "g-h1" } %}<h1 class="title">Projects</h1></div>
<p class="dek">One question on my desk now, and the things I built before it.</p>

<h2>now</h2>
<ul class="list">
{%- for p in projs %}{% if p.status == "active" %}
  <li><a href="/project/{{ p.id }}.html">{{ p.title }}</a><br><span class="venue">{{ p.description }}</span></li>
{%- endif %}{% endfor %}
</ul>

<h2>before</h2>
<ul class="list">
{%- for p in projs %}{% if p.status != "active" %}
  <li><a href="/project/{{ p.id }}.html">{{ p.title }}</a><br><span class="venue">{{ p.description }}</span></li>
{%- endif %}{% endfor %}
</ul>

<p class="small muted">If you work on diffusion language models, or on guardrails that have to run inside a decoder, I would like to compare notes: <a href="/about.html#contact">write to me</a>.</p>
