---
layout: simple.njk
title: Timeline
description: "A chronicle of Divyanshu Kumar's research milestones, 2022 to now: papers, talks, roles and courses."
permalink: /timeline.html
mascot: true
---
<h1 class="title">Timeline</h1>
<p class="dek">What happened, and when: papers, talks, jobs, a course.</p>
{%- for n in news %}{% set y = n.date | splitOn(" ") | last %}{% set py = (news[loop.index0 - 1].date | splitOn(" ") | last) if not loop.first else "" %}
{%- if y != py %}{% if not loop.first %}</ul>{% endif %}<h2 class="year">{{ y }}</h2><ul class="list">{% endif %}
  <li>{% if (n.date | splitOn(" ")).length > 1 %}<span class="d">{{ n.date | splitOn(" ") | first }}</span> {% endif %}{{ n.content | safe }}{% if n.links %} {% for k, v in n.links %}<a href="{{ v }}">{{ k }} ↗</a> {% endfor %}{% endif %}</li>
{%- if loop.last %}</ul>{% endif %}
{%- endfor %}

{% guide { w: 132, poses: ["pointUp"], data: { when: "view", steps: [["pointUp", { t: "Back to now ↑", top: true }, 3500]] } } %}
