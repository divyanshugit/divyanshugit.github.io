---
layout: simple.njk
title: Blog
description: "Writing by Divyanshu Kumar on differential privacy, red-teaming and AI safety, quantization, and the tools he builds."
permalink: /blog.html
---
<h1 class="title">Blog</h1>
<p class="dek">Notes from the work, and around it: privacy, red-teaming, quantization, and the odd weekend tool.</p>
{%- set posts = collections.blog or [] %}
{%- for p in posts %}{% set y = p.date.getFullYear() %}{% set py = posts[loop.index0 - 1].date.getFullYear() if not loop.first else "" %}
{%- if y != py %}{% if not loop.first %}</ul>{% endif %}<h2 class="year">{{ y }}</h2><ul class="list posts">{% endif %}
  <li><span class="d">{{ p.date | monthYear }}</span> <a href="{{ p.url }}">{{ p.data.title | cleanTitle }}</a>{% if p.data.series %} <span class="tag">{{ p.data.series.name }}</span>{% endif %}</li>
{%- if loop.last %}</ul>{% endif %}
{%- endfor %}
