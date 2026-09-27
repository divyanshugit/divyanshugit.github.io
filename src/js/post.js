/* post.js — a blog post (layout blog-post.njk, styles css/pages/post.css).
   · code blocks: every <pre> gets Prism's copy button (bare blocks become language-none)
   · images: charts become plates with a caption; missing images fold away quietly
   · [1]-style references become margin notes (data: #ref-data, from front matter)
   · Figure 1 of the DP series follows the site's privacy budget (window.eps)
   Runs before Prism (which is deferred) and after site.js / eps.js.        */
(function () {
  'use strict';
  var text = document.getElementById('text');
  if (!text) return;
  var WIDE = window.matchMedia('(min-width: 1081px)');
  var site = window.site || { bind: function () {}, schedule: function () {} };

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // the child of #text that contains node
  function blockOf(node) { while (node && node.parentElement !== text) node = node.parentElement; return node; }

  /* ---------- code: a copy button on every block ---------- */
  text.querySelectorAll('pre > code').forEach(function (c) {
    if (!/\blang(uage)?-/.test(c.className)) c.classList.add('language-none');
    c.parentElement.setAttribute('tabindex', '0');     // scrollable blocks are reachable by keyboard
  });

  /* ---------- images ---------- */
  var figNo = 0;
  // an empty paragraph or <br> left beside a folded image would read as a gap
  function tidy(node) {
    [node && node.previousElementSibling, node && node.nextElementSibling].forEach(function (n) {
      if (n && n.tagName === 'P' && !n.textContent.trim() && !n.querySelector('img, iframe, svg, video')) n.remove();
    });
  }
  function lost(holder, img) {
    if (holder.__lost) return; holder.__lost = true;
    tidy(holder);
    // the first block of the text proper (a banner plate may stand above it)
    var lead = text.firstElementChild;
    while (lead && lead.classList.contains('bn')) lead = lead.nextElementSibling;
    var first = blockOf(holder) === lead;
    // with a banner above the text, a dead image in the opening (before the first heading) was the
    // post's lead image: the banner has replaced it, so it folds away rather than leaving a note
    if (!first && text.querySelector(':scope > .bn')) {
      var n = blockOf(holder);
      first = true;
      while ((n = n.previousElementSibling)) if (/^H[23]$/.test(n.tagName)) { first = false; break; }
    }
    if (first || !img.alt) { holder.hidden = true; holder.classList.add('is-lost'); site.schedule(); return; }
    var p = el('p', 'img-lost noindent', '<span class="lab">figure</span>' + esc(img.alt.replace(/^"|"$/g, '')) + '<span class="img-lost__why"> · image not available</span>');
    holder.replaceWith(p);
    site.schedule();
  }
  function watch(holder, img) {
    var fail = function () { lost(holder, img); };
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
    else img.addEventListener('error', fail, { once: true });
    img.addEventListener('load', function () { site.schedule(); }, { once: true });
  }
  // legacy Bootstrap wrappers: <div class="row"><div class="col-sm"><img class="img-fluid">
  text.querySelectorAll('.row').forEach(function (row) {
    row.classList.add('post-img');
    row.querySelectorAll('img').forEach(function (img) { watch(row, img); });
  });
  // a paragraph that is only an image becomes a tipped-in plate with its alt as caption
  text.querySelectorAll('p > img:only-child').forEach(function (img) {
    var p = img.parentElement;
    if (p.textContent.trim()) return;
    var cap = (img.getAttribute('title') || img.alt || '').replace(/^"|"$/g, '');
    var fig = el('figure', 'plate post-plate');
    fig.setAttribute('data-fig', '');
    fig.innerHTML = '<div class="plate__mount"><div class="plate__c"></div><div class="plate__img"></div></div>';
    fig.querySelector('.plate__img').appendChild(img);
    if (cap) fig.appendChild(el('figcaption', '', '<span class="pl"></span>' + esc(cap)));
    p.replaceWith(fig);
    img.decoding = 'async';   // not lazy: a missing file must fold away before anyone scrolls to it
    watch(fig, img);
  });
  // OCR figures: pointing at a box or a line lights up its partner
  text.querySelectorAll('.ocr').forEach(function (f) {
    // the arrow draws itself the first time the figure scrolls into view
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { f.classList.add('is-seen'); io.disconnect(); } }); }, { threshold: 0.4 });
      io.observe(f);
    } else f.classList.add('is-seen');
    function set(i, on) { f.querySelectorAll('[data-i="' + i + '"]').forEach(function (n) { n.classList.toggle('is-on', on); }); }
    ['pointerover', 'pointerout'].forEach(function (t) {
      f.addEventListener(t, function (e) {
        var n = e.target.closest && e.target.closest('[data-i]');
        if (n && f.contains(n)) set(n.getAttribute('data-i'), t === 'pointerover');
      });
    });
  });
  text.querySelectorAll('[data-fig], .dpfig').forEach(function (f) {
    var pl = f.querySelector('figcaption .pl'); figNo++;
    if (pl) pl.textContent = 'Fig. ' + figNo;
  });

  /* ---------- references as margin notes ---------- */
  var refs = {};
  try { refs = JSON.parse((document.getElementById('ref-data') || {}).textContent || '{}'); } catch (e) {}
  function pretty(u) {
    try {
      var x = new URL(u, location.href);
      var s = x.hostname.replace(/^www\./, '') + x.pathname.replace(/\/$/, '');
      return s.length > 44 ? s.slice(0, 42) + '…' : s;
    } catch (e) { return u; }
  }
  var made = {};
  text.querySelectorAll('a.inline-ref').forEach(function (a) {
    var n = (a.getAttribute('href') || '').replace(/^#ref/, '');
    a.textContent = n;
    a.setAttribute('aria-label', 'Reference ' + n);
    var prev = a.previousSibling;
    if (prev && prev.nodeType === 1 && prev.classList.contains('inline-ref')) a.before(el('span', 'ref-sep', ','));
    var r = refs[n];
    if (!r || made[n]) return;
    made[n] = true;
    var id = 'r' + n;
    a.id = 'snref-' + id;
    a.classList.add('m');
    a.setAttribute('aria-controls', 'sn-' + id);
    a.setAttribute('aria-expanded', 'false');
    var inner = r.t
      ? '<span class="lab">see</span><a href="' + esc(r.u) + '"><cite>' + esc(r.t) + '</cite></a><span class="venue">Earlier in this series</span>'
      : '<span class="lab">source</span><a href="' + esc(r.u) + '" rel="noopener">' + esc(pretty(r.u)).replace(/\//g, '/<wbr>') + '</a>';
    var note = el('aside', 'note note--ref', '<div class="note__in"><span class="n">' + esc(n) + '</span>' + inner + '</div>');
    note.id = 'sn-' + id; note.setAttribute('data-anchor', a.id); note.setAttribute('role', 'note');
    var at = blockOf(a);
    while (at.nextElementSibling && at.nextElementSibling.classList.contains('note')) at = at.nextElementSibling;
    at.after(note);
    // the note is right here: open it instead of jumping to the list at the end
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });
  // own posts in the list at the end: link them by title too
  document.querySelectorAll('.refs__list p[id^="ref"] a').forEach(function (a) {
    var n = a.parentElement.id.replace('ref', ''), r = refs[n];
    if (r && r.t) { a.textContent = r.t; a.href = r.u; a.removeAttribute('target'); }
    else a.textContent = pretty(a.getAttribute('href'));
  });
  // series descriptions ("Blog #2 in the series …") are not repeated as margin labels
  document.querySelectorAll('.note--ref .venue').forEach(function (v) {
    if (!document.getElementById('series')) v.remove();
  });

  site.bind();
  site.schedule();
  // MathJax, fonts and late images all change line positions: re-place the notes
  if (window.ResizeObserver) new ResizeObserver(function () { site.schedule(); }).observe(text);

  /* ---------- Figure 1 (DP series): the Laplace mechanism on a count ---------- */
  var fig = document.querySelector('[data-dpfig]');
  if (!fig || !window.eps) return;
  var N = +fig.getAttribute('data-n') || 1000, R = +fig.getAttribute('data-range') || 10;
  var X0 = 20, X1 = 540, BASE = 150, TOP = 14, H = BASE - TOP;
  var PX = (X1 - X0) / (2 * R);
  var U = [0.83, 0.21, 0.64, 0.07, 0.46];         // five fixed draws: stable and monotone in ε
  var q = function (s) { return fig.querySelector(s); };
  var area = q('.dpfig__area'), dCurve = q('.dpfig__d'), nbCurve = q('.dpfig__nb'), relG = q('.dpfig__rel');
  var bOut = q('[data-dp="b"]'), rOut = q('[data-dp="ratio"]'), dOut = q('[data-dp="draws"]'), live = q('[data-dp="live"]'), desc = fig.querySelector('desc');
  var xOf = function (v) { return X0 + (v - N + R) * PX; };
  var fmtN = function (v) { return Math.round(v).toLocaleString('en'); };
  var NS = 'http://www.w3.org/2000/svg';

  function curve(center, b, ymax) {
    // sample densely, and exactly at the peak so narrow curves keep their tip
    var xs = [], i, k = 360;
    for (i = 0; i <= k; i++) xs.push(N - R + 2 * R * i / k);
    xs.push(center); xs.sort(function (p, r) { return p - r; });
    return xs.map(function (v, j) {
      var f = Math.exp(-Math.abs(v - center) / b) / (2 * b);
      return (j ? 'L' : 'M') + xOf(v).toFixed(1) + ',' + (BASE - H * Math.min(1, f / ymax)).toFixed(1);
    }).join('');
  }
  var liveT;
  function render(e) {
    var inf = e === Infinity, b = inf ? 0 : 1 / e;
    if (inf) {
      var sp = 'M' + xOf(N) + ',' + BASE + ' L' + xOf(N) + ',' + TOP;
      area.setAttribute('d', sp); dCurve.setAttribute('d', sp);
      nbCurve.setAttribute('d', 'M' + xOf(N + 1) + ',' + BASE + ' L' + xOf(N + 1) + ',' + TOP);
    } else {
      var ymax = Math.max(1 / (2 * b), 0.2);   // fixed below ε = 0.4, so a falling ε visibly flattens the curve
      var d = curve(N, b, ymax);
      dCurve.setAttribute('d', d);
      area.setAttribute('d', d + 'L' + X1 + ',' + BASE + ' L' + X0 + ',' + BASE + 'Z');
      nbCurve.setAttribute('d', curve(N + 1, b, ymax));
    }
    // the releases, as a dot plot on the axis (equal values stack)
    var rel = U.map(function (u) { return N + Math.round(eps.laplace(u) * b); });
    var stack = {};
    relG.textContent = '';
    rel.forEach(function (v) {
      var out = v < N - R || v > N + R, cv = Math.max(N - R, Math.min(N + R, v));
      var k = stack[cv] = (stack[cv] || 0) + 1;
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', xOf(cv).toFixed(1)); c.setAttribute('cy', String(BASE - 5 - (k - 1) * 9)); c.setAttribute('r', '3.6');
      if (out) c.setAttribute('class', 'out');
      relG.appendChild(c);
    });
    bOut.textContent = inf ? '0' : b >= 10 ? b.toFixed(0) : b.toFixed(2);
    rOut.textContent = inf ? '∞' : Math.exp(e) >= 100 ? fmtN(Math.exp(e)) : Math.exp(e).toFixed(2);
    dOut.textContent = rel.map(fmtN).join(' · ');
    var sentence = inf
      ? 'At ε = ∞ nothing is added: every release is exactly ' + fmtN(N) + ', and the neighbouring dataset’s release is exactly ' + fmtN(N + 1) + '.'
      : 'At ε = ' + eps.fmt(e) + ' the noise scale is b = ' + bOut.textContent + '. Five releases: ' + rel.map(fmtN).join(', ') + '. The two curves differ by at most a factor of ' + rOut.textContent + '.';
    desc.textContent = sentence;
    clearTimeout(liveT);
    liveT = setTimeout(function () { live.textContent = sentence; }, 900);   // announce once the dial rests
    fig.classList.toggle('is-exact', inf);
  }
  eps.subscribe(render);
})();
