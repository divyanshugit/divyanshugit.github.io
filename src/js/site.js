/* site.js — shared behaviour for every page on the new design system.
   Theme toggle · running-head hairline · margin-note layout, leaders and
   inline unfolding · plate ↔ place linking. Documented in /DESIGN.md.
   Public: window.site.placeNotes() — call after inserting/removing notes. */
(function () {
  'use strict';
  var root = document.documentElement;
  var WIDE = window.matchMedia('(min-width: 1081px)');
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- theme: "Day proof" / "Night proof" ---------- */
  function current() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function paintThemeButton(btn) {
    var dark = current() === 'dark';
    var l = btn.querySelector('.lbl');
    if (l) l.textContent = dark ? 'Day proof' : 'Night proof';
    btn.setAttribute('aria-label', dark ? 'Switch to day proof (light theme)' : 'Switch to night proof (dark theme)');
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) { m.setAttribute('content', dark ? '#191612' : '#F5F1E8'); });
  }
  document.querySelectorAll('.theme').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      paintThemeButton(btn);
    });
    paintThemeButton(btn);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { paintThemeButton(btn); });
  });

  /* ---------- running head hairline ---------- */
  var head = document.getElementById('head');
  function onScroll() { if (head) head.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- margin notes ----------
     Each .note names its anchor (data-anchor). On wide screens it is placed in
     the rail at the anchor's first line, pushed down just enough to clear the
     note above. The container (the note's offset parent, normally .body) grows
     to fit the last note. */
  var GAP = 22;
  // The rect of the text line an anchor sits on. A footnote marker is raised,
  // so for markers we measure the last glyph before it instead.
  function lineRectOf(a) {
    if (a.classList.contains('m')) {
      var prev = a.previousSibling;
      while (prev && prev.nodeType === 3 && !prev.textContent.trim()) prev = prev.previousSibling;
      if (prev) {
        var range = document.createRange();
        if (prev.nodeType === 3) { var L = prev.length; range.setStart(prev, Math.max(0, L - 1)); range.setEnd(prev, L); }
        else range.selectNodeContents(prev);
        var rs = range.getClientRects();
        if (rs.length) return rs[rs.length - 1];
      }
    }
    var rects = a.getClientRects();
    return rects.length ? rects[0] : a.getBoundingClientRect();
  }
  function containerOf(n) { return n.closest('.body, .prose') || n.parentElement; }
  function placeNotes() {
    var groups = new Map();
    document.querySelectorAll('.note[data-anchor]').forEach(function (n) {
      var c = containerOf(n); if (!groups.has(c)) groups.set(c, []); groups.get(c).push(n);
    });
    groups.forEach(function (notes, body) {
      if (!WIDE.matches) {
        notes.forEach(function (n) { n.style.top = ''; n.classList.add('is-placed'); });
        body.style.minHeight = '';
        return;
      }
      var bRect = body.getBoundingClientRect();
      var floor = -Infinity, lowest = 0;
      notes.forEach(function (n) {
        var a = document.getElementById(n.getAttribute('data-anchor'));
        var y = 0;
        if (a) {
          var r = lineRectOf(a);
          var noteLH = parseFloat(getComputedStyle(n).lineHeight) || 22;
          // centre the note's first line on the anchor's line
          y = r.top + r.height / 2 - bRect.top - noteLH / 2;
          if (n.hasAttribute('data-top')) y = r.top - bRect.top + (parseFloat(n.getAttribute('data-top')) || 0);
        }
        var top = Math.max(y, floor);
        n.style.top = Math.round(top) + 'px';
        n.classList.add('is-placed');
        var h = n.offsetHeight;
        floor = top + h + GAP;
        lowest = Math.max(lowest, top + h);
      });
      body.style.minHeight = Math.ceil(lowest) + 'px';
    });
  }
  var raf;
  function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(placeNotes); }
  window.addEventListener('resize', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  window.addEventListener('load', schedule);
  document.addEventListener('eps:img', schedule);
  schedule();

  /* ---------- leaders: one SVG per container, one path per note ---------- */
  function anchorFor(n) { return n && document.getElementById(n.getAttribute('data-anchor')); }
  function leader(n, on) {
    if (!WIDE.matches) return;
    var a = anchorFor(n), body = containerOf(n);
    if (!a || !body) return;
    var svg = body.querySelector(':scope > svg.leader');
    if (!svg) { svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'leader'); svg.setAttribute('aria-hidden', 'true'); body.appendChild(svg); }
    var p = svg.querySelector('path[data-for="' + n.id + '"]');
    if (!p) { p = document.createElementNS(NS, 'path'); p.setAttribute('data-for', n.id); svg.appendChild(p); }
    if (!on) { p.classList.remove('on'); return; }
    var b = body.getBoundingClientRect();
    var rects = a.getClientRects(); var last = rects[rects.length - 1] || a.getBoundingClientRect();
    var nr = n.getBoundingClientRect();
    var x1 = b.width + 10, y1 = last.top - b.top + last.height * .55;
    var xEdge = b.width + 22;
    var x2 = nr.left - b.left - 16, y2 = nr.top - b.top + 11;
    p.setAttribute('d', 'M' + x1 + ' ' + y1 + ' L' + xEdge + ' ' + y1 + ' L' + (x2 - 6) + ' ' + y2 + ' L' + x2 + ' ' + y2);
    var len = Math.ceil(p.getTotalLength ? p.getTotalLength() : 600);
    p.style.setProperty('--len', len);
    p.classList.remove('on'); void p.getBoundingClientRect(); p.classList.add('on');
  }
  function lite(n, on) {
    if (!n) return;
    n.classList.toggle('is-lit', on);
    var a = anchorFor(n);
    if (a) {
      a.classList.toggle('is-lit', on);
      // a footnote marker lights the text run just before it
      if (a.classList.contains('m')) { var s = a.previousElementSibling; if (s && s.classList.contains('a')) s.classList.toggle('is-lit', on); }
    }
    leader(n, on);
  }
  function bindNote(n) {
    if (n.__bound) return; n.__bound = true;
    n.addEventListener('mouseenter', function () { lite(n, true); });
    n.addEventListener('mouseleave', function () { lite(n, false); });
  }
  function bindMarker(m) {
    if (m.__bound) return; m.__bound = true;
    var n = document.getElementById(m.getAttribute('aria-controls'));
    if (!n) return;
    m.addEventListener('mouseenter', function () { lite(n, true); });
    m.addEventListener('mouseleave', function () { lite(n, false); });
    m.addEventListener('focus', function () { lite(n, true); });
    m.addEventListener('blur', function () { lite(n, false); });
    m.addEventListener('click', function () {
      if (WIDE.matches) { lite(n, true); return; }
      var open = !n.classList.contains('open');
      n.classList.toggle('open', open);
      m.setAttribute('aria-expanded', String(open));
    });
  }
  /* Markerless notes (no .m points at them) have nothing to tap on narrow
     screens. The rule: .note--meta, .note--plate and .note--eps are hidden
     there because the page prints an inline fallback; every other markerless
     note is made .always, so it stays open under its paragraph. */
  var HIDDEN_NARROW = ['note--meta', 'note--plate', 'note--eps'];
  function markAlways() {
    document.querySelectorAll('.note').forEach(function (n) {
      if (n.id && document.querySelector('.m[aria-controls="' + n.id + '"]')) return;
      if (HIDDEN_NARROW.some(function (c) { return n.classList.contains(c); })) return;
      n.classList.add('always');
    });
  }
  function bindAll() {
    markAlways();
    document.querySelectorAll('.m[aria-controls]').forEach(bindMarker);
    document.querySelectorAll('.note').forEach(bindNote);
    document.querySelectorAll('.note[data-anchor]').forEach(function (n) {
      var a = anchorFor(n);
      if (!a || a.__bound || a.tagName === 'H1' || a.classList.contains('m')) return;
      a.__bound = true;
      a.addEventListener('mouseenter', function () { if (WIDE.matches) lite(n, true); });
      a.addEventListener('mouseleave', function () { if (WIDE.matches) lite(n, false); });
    });
  }
  bindAll();

  /* ---------- places <-> plates ---------- */
  document.querySelectorAll('[data-place]').forEach(function (el) {
    var key = el.getAttribute('data-place');
    var set = function (on) { document.querySelectorAll('[data-place="' + key + '"]').forEach(function (x) { x.classList.toggle('is-lit', on); }); };
    el.addEventListener('mouseenter', function () { set(true); });
    el.addEventListener('mouseleave', function () { set(false); });
  });

  /* ---------- "On this page": built from [data-toc], with scroll-spy ----------
     <section id="work" data-toc="What I work on" data-toc-no="§1"> …        */
  var toc = document.getElementById('toc');
  var tocItems = Array.prototype.slice.call(document.querySelectorAll('[data-toc][id]'));
  if (toc && tocItems.length > 1) {
    var ol = toc.querySelector('ol');
    tocItems.forEach(function (el) {
      var li = document.createElement('li');
      var full = el.getAttribute('data-toc'), label = full;
      // long headings are shortened at a word boundary, never mid-word
      if (label.length > 46) { label = label.slice(0, label.lastIndexOf(' ', 44)).replace(/[,:;–—-]+$/, '') + '…'; }
      li.innerHTML = '<a href="#' + el.id + '"' + (label !== full ? ' title="' + full.replace(/"/g, '&quot;') + '"' : '') + '><span class="no">' + (el.getAttribute('data-toc-no') || '') + '</span><span>' + label + '</span></a>';
      ol.appendChild(li);
    });
    toc.hidden = false;
    var links = Array.prototype.slice.call(ol.querySelectorAll('a'));
    var queued = false;
    var spy = function () {
      queued = false;
      var line = window.innerHeight * 0.4, active = null;
      tocItems.forEach(function (el, i) { if (el.getBoundingClientRect().top <= line) active = links[i]; });
      links.forEach(function (a) { a.setAttribute('aria-current', a === active ? 'true' : 'false'); });
    };
    window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(spy); } }, { passive: true });
    window.addEventListener('resize', spy);
    spy();
  }

  /* ---------- obfuscated email: assembled only when someone reaches for it ---------- */
  function armEmail(a) {
    if (a.__armed) return; a.__armed = true;
    var addr = a.getAttribute('data-email').replace(/\s*\[at\]\s*/i, '@').replace(/\s*\[dot\]\s*/gi, '.');
    var subj = a.getAttribute('data-subject');
    a.href = 'mailto:' + addr + (subj ? '?subject=' + encodeURIComponent(subj) : '');
  }
  document.addEventListener('pointerdown', function (e) { var a = e.target.closest && e.target.closest('a[data-email]'); if (a) armEmail(a); }, true);
  document.addEventListener('focusin', function (e) { var a = e.target.closest && e.target.closest('a[data-email]'); if (a) armEmail(a); });
  document.addEventListener('mouseover', function (e) { var a = e.target.closest && e.target.closest('a[data-email]'); if (a) armEmail(a); });
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[data-email]'); if (a) armEmail(a); }, true);

  /* ---------- arriving at #anchor: flash the target once ----------
     Works for ids and for legacy pages that render items with data-id.
     (Text fragments, #…:~:text=, are highlighted natively by the browser.) */
  function flash(el) {
    if (!el) return;
    // a whole section is too big to wash: flash its heading instead
    if (el.offsetHeight > 320) { var h = el.querySelector('h1, h2, h3, .work__t, .t'); if (h) el = h; }
    el.classList.remove('arrived'); void el.offsetWidth; el.classList.add('arrived');
    setTimeout(function () { el.classList.remove('arrived'); }, 2400);
  }
  function arrive() {
    var id = decodeURIComponent((location.hash || '').slice(1)).split(':~:')[0];
    if (!id) return;
    // arriving with a text fragment (#…:~:text=): the browser highlights the sentence itself
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    var hasFragment = !!(nav && nav.name && nav.name.indexOf(':~:') > -1);
    var tries = 0;
    (function look() {
      var el = document.getElementById(id) || document.querySelector('[data-id="' + id.replace(/"/g, '') + '"]');
      if (el) {
        document.dispatchEvent(new CustomEvent('site:arrive', { detail: { id: id, el: el } }));
        if (!document.getElementById(id)) el.scrollIntoView({ block: 'center' });
        if (!hasFragment) flash(el);
      } else if (++tries < 12) setTimeout(look, 150);
      else document.dispatchEvent(new CustomEvent('site:arrive', { detail: { id: id, el: null } }));
    })();
  }
  if (document.readyState === 'complete') arrive(); else window.addEventListener('load', arrive);
  window.addEventListener('hashchange', arrive);

  window.site = { placeNotes: placeNotes, schedule: schedule, bind: bindAll, lite: lite, flash: flash };
})();
