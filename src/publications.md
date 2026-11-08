---
layout: simple.njk
title: Publications
description: "Papers by Divyanshu Kumar on making AI systems efficient, secure and private: quantization, red-teaming, guardrails, evaluation and graph reasoning."
permalink: /publications.html
mascot: true
---
<div class="g-head">{% guide { w: 72, wp: 64, cls: "g-h1", poses: ["look"], data: { look: ".list li" } } %}<h1 class="title">Publications</h1></div>

<p class="muted">{{ collation.total }} papers since {{ collation.from }}, at NeurIPS, AAAI and ICML workshops and on arXiv. * marks shared first authorship. Each title opens the paper’s page, with the abstract, links and BibTeX. Also on <a href="https://scholar.google.com/citations?user=KdLbMkYAAAAJ&hl=en">Google Scholar</a>.</p>

{%- for y in pubYears %}
<h2 class="year">{{ y.year }}</h2>
<ul class="list">
{%- for p in y.items %}
  <li><a href="/publications/{{ p.id }}.html">{{ p.title }}</a><br>
    <span class="venue">{{ p.authors | authorList | safe }} · {{ p.venueShort }}</span>{% if p.firstish %}<span class="tag">{{ "co-first" if p.coFirst else "first author" }}</span>{% endif %}</li>
{%- endfor %}
</ul>
{%- endfor %}
