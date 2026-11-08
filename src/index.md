---
layout: simple.njk
title: Home
permalink: /index.html
mascot: true
description: "Divyanshu Kumar, AI Research Engineer at Anaconda. I make AI systems efficient, secure and private: quantization, inference, red-teaming, guardrails and differential privacy."
hello: "Divyanshu here."
lead: "I make AI systems efficient, secure and private, and find out what breaks when they are."
# Papers shown on the home page, in this order (ids from src/data/publications.js)
selected: [graphreasoning, agentredteaming, multimodalredteaming, cbrnllm, kumar2025nfl, kumar2024sagert, kumar2024vulnerabilities]
newsCount: 5
---
<section class="hero" id="hero">
  <div>
    <div class="g-head">{% guide { w: 104, wp: 76, cls: "g-h1 g-hello", data: { when: "load", steps: [["wave", "Yo!", 2700]], again: [["nod", null, 1200]], hover: { sel: ".nav a", map: { "/publications.html": ["look", "my papers"], "/projects.html": ["look", "things I built"], "/blog.html": ["look", "what I write"], "/timeline.html": ["look", "my years so far"], "/places.html": ["look", "where I’ve been"], "/about.html": ["look", "about me"] } } } } %}<h1 class="hello">{{ hello }}</h1></div>
    <p class="lead">{{ lead }}</p>
  </div>
</section>


<h2 id="about">about</h2>

I’m an AI Research Engineer at [Anaconda](https://www.anaconda.com/), which [acquired Enkrypt AI](https://www.anaconda.com/blog/anaconda-acquires-enkrypt-ai) in August 2026. At Enkrypt I was the founding ML research engineer and its lead AI safety and security researcher. Before that I was a Research Associate at [IISc Bangalore](https://iisc.ac.in/), and I’ve been doing research since 2020. [More about me →](/about.html)

<h2 id="research">research</h2>

I work on making AI systems <span class="w">efficient</span>, <span class="w">secure</span> and <span class="w">private</span>, and on what breaks when they are made so: how quantization and fine-tuning weaken a model’s safety, red-teaming models across text, image and audio, and guardrails, differentially private fine-tuning and encrypted inference.

I maintained a public [LLM safety leaderboard](https://www.enkryptai.com/llm-safety-leaderboard) of about 300 models. My papers have appeared at NeurIPS, AAAI and ICML workshops.

<h2 id="papers">selected papers</h2>

<ul class="list">
{%- for id in selected %}{% set p = pubItems | where("id", id) | first %}{% if p %}
  <li><a href="/publications/{{ p.id }}.html">{{ p.title }}</a> <span class="venue">({{ p.venueShort }}{% if not (p.year | string) in p.venueShort %}, {{ p.year }}{% endif %})</span></li>
{%- endif %}{% endfor %}
</ul>
<p class="small"><a href="/publications.html">All {{ pubItems.length }} papers →</a></p>

<h2 id="news">news</h2>

<ul class="list">
{%- for n in news | limit(newsCount) %}
  <li><span class="d">[{{ n.date }}]</span> {{ n.content | safe }}</li>
{%- endfor %}
</ul>
<p class="small"><a href="/timeline.html">Everything, by date →</a></p>
