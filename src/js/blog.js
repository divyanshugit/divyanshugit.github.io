/* blog.js — the blog index (layout blog-list-page.njk, css/pages/blog.css).
   A quiet topic filter and a newest/oldest toggle over the server-rendered
   list. ?tag=<Tag> (used by the tags on each post) preselects a topic.
   Without JavaScript the full list simply shows.                          */
(function () {
  'use strict';
  var filter = document.getElementById('filter');
  var years = document.getElementById('years');
  if (!filter || !years) return;
  var entries = Array.prototype.slice.call(years.querySelectorAll('.entry'));
  var count = document.getElementById('filter-count');
  var empty = document.getElementById('empty');
  var order = document.getElementById('order');
  var current = '';

  function tagsOf(li) { return (li.getAttribute('data-tags') || '').split('|').filter(Boolean); }
  function matches(li, tag) {
    if (!tag) return true;
    if (tag === '__featured') return li.hasAttribute('data-featured');
    return tagsOf(li).indexOf(tag) > -1;
  }
  function buttons() { return Array.prototype.slice.call(document.querySelectorAll('[data-tag]')); }

  function apply(tag, push) {
    current = tag || '';
    // a topic from a post's tag that is not one of the chips gets a chip of its own
    if (current && current !== '__featured' && !filter.querySelector('.filter__b[data-tag="' + CSS.escape(current) + '"]')) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'filter__b is-extra'; b.setAttribute('data-tag', current); b.textContent = current;
      filter.insertBefore(b, filter.querySelector('.filter__foot'));
      b.addEventListener('click', onClick);
    }
    // counts are in posts: a series counts each of its parts
    var shown = 0, total = 0;
    entries.forEach(function (li) { var n = +(li.getAttribute('data-parts') || 1); total += n; var ok = matches(li, current); li.hidden = !ok; if (ok) shown += n; });
    years.querySelectorAll('.yr').forEach(function (sec) { sec.hidden = !sec.querySelector('.entry:not([hidden])'); });
    filter.querySelectorAll('.filter__b').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-tag') === current)); });
    var label = current === '__featured' ? 'selected' : current;
    count.textContent = current ? shown + ' of ' + total + (total === 1 ? ' post' : ' posts') + ' · ' + label : '';
    empty.hidden = shown > 0;
    if (push) {
      var u = new URL(location.href);
      if (current) u.searchParams.set('tag', current); else u.searchParams.delete('tag');
      try { history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) {}
    }
    if (window.site) window.site.schedule();
  }
  function onClick(e) { apply(e.currentTarget.getAttribute('data-tag'), true); }
  buttons().forEach(function (b) { b.addEventListener('click', onClick); });

  // newest first (as rendered) ↔ oldest first
  order.addEventListener('click', function () {
    var oldest = order.getAttribute('aria-pressed') !== 'true';
    Array.prototype.slice.call(years.children).reverse().forEach(function (sec) { years.appendChild(sec); });
    years.querySelectorAll('.entries').forEach(function (ol) { Array.prototype.slice.call(ol.children).reverse().forEach(function (li) { ol.appendChild(li); }); });
    order.setAttribute('aria-pressed', String(oldest));
    order.textContent = oldest ? 'newest first' : 'oldest first';
    order.setAttribute('aria-label', oldest ? 'Show newest first' : 'Show oldest first');
  });

  filter.hidden = false;
  var q = new URLSearchParams(location.search).get('tag');
  apply(q || '', false);
})();
