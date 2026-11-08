---
layout: simple.njk
title: Places
description: "Where Divyanshu Kumar is from, where he has lived and where he has wandered: Berai, Patna, Kolkata, Delhi, Bangalore, Singapore, Malaysia, the Philippines and Bali."
permalink: /places.html
mascot: true
---
<h1 class="title">Places</h1>
<p class="dek">Where I’m from, where I’ve lived, and where I’ve wandered.</p>

<h2>lived</h2>
<ul class="places">
{%- for p in places %}{% if not p.visited %}{% set ph = p.shown[0] %}
  <li><a href="/places/{{ p.id }}.html"><div class="th">{% if ph.blank %}<div class="th blank-th">{{ p.name }}</div>{% else %}<img src="{{ ph.src }}" alt="" loading="lazy" style="object-position:{{ ph.focus }}">{% endif %}</div><span class="pn">{{ p.name }}</span><span class="pl">{{ p.region or p.caption }}</span></a></li>
{%- endif %}{% endfor %}
</ul>

<h2>wandered</h2>
<ul class="places">
{%- for p in places %}{% if p.visited %}{% set ph = p.shown[0] %}
  <li><a href="/places/{{ p.id }}.html"><div class="th">{% if ph.blank %}<div class="th blank-th">{{ p.name }}</div>{% else %}<img src="{{ ph.src }}" alt="" loading="lazy" style="object-position:{{ ph.focus }}">{% endif %}</div><span class="pn">{{ p.name }}</span><span class="pl">{{ p.caption }}</span></a></li>
{%- endif %}{% endfor %}
</ul>

{% guide { w: 132, poses: ["hat"], data: { when: "view", next: [["/about.html", "About me"], ["/blog.html", "The blog"], ["/publications.html", "My papers"], ["/projects.html", "Projects"], ["/timeline.html", "Timeline"]], steps: [["hat", { t: "Where next?", next: true }, 1500]] } } %}
