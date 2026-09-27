/* publications.js — the Publications page: index of subjects (a filter),
   show all/selected/published/preprints, newest/oldest order, abstracts that
   unfold in place. The list is server-rendered; this only hides, reorders and
   unfolds. State is mirrored to ?s=<subject>&show=<kind>&order=old. */
(function () {
  'use strict';
  var root = document.getElementById('pubs');
  if (!root) return;
  var items = Array.prototype.slice.call(root.querySelectorAll('.pub'));
  var years = Array.prototype.slice.call(root.querySelectorAll('.yr'));
  var showing = document.getElementById('showing');
  var empty = document.getElementById('pubs-empty');
  var subjBtns = Array.prototype.slice.call(document.querySelectorAll('[data-subject]'));
  var showBtns = Array.prototype.slice.call(document.querySelectorAll('[data-show]'));
  var sortBtns = Array.prototype.slice.call(document.querySelectorAll('[data-sort]'));
  var state = { s: null, show: 'all', order: 'new' };

  function label(id) { var b = subjBtns.filter(function (x) { return x.getAttribute('data-subject') === id; })[0]; return b ? b.textContent : id; }
  function matches(li) {
    if (state.s && (' ' + li.getAttribute('data-subjects') + ' ').indexOf(' ' + state.s + ' ') < 0) return false;
    if (state.show === 'featured') return li.hasAttribute('data-featured');
    if (state.show === 'published' || state.show === 'preprint') return li.getAttribute('data-status') === state.show;
    return true;
  }
  function press(list, attr, val) { list.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === val)); }); }

  function render(fromUser) {
    var n = 0;
    items.forEach(function (li) { var on = matches(li); li.hidden = !on; if (on) n++; });
    years.forEach(function (y) { y.hidden = !y.querySelector('.pub:not([hidden])'); });
    if (empty) empty.hidden = n > 0;

    // order: years and the items inside each year
    var dir = state.order === 'old' ? 1 : -1;
    var ys = years.slice().sort(function (a, b) { return dir * (a.getAttribute('data-year') - b.getAttribute('data-year')); });
    ys.forEach(function (y) {
      var ol = y.querySelector('ol');
      Array.prototype.slice.call(ol.children)
        .sort(function (a, b) { return dir * (a.getAttribute('data-ym') - b.getAttribute('data-ym')); })
        .forEach(function (li) { ol.appendChild(li); });
      root.insertBefore(y, empty);
      // the last visible paper of a year drops its rule, so bands never double up
      var vis = ol.querySelectorAll('.pub:not([hidden])');
      Array.prototype.forEach.call(ol.children, function (li) { li.classList.toggle('is-last', li === vis[vis.length - 1]); });
    });

    press(subjBtns, 'data-subject', state.s);
    press(showBtns, 'data-show', state.show);
    press(sortBtns, 'data-sort', state.order);

    var parts = [];
    if (state.s) parts.push('under “' + label(state.s) + '”');
    if (state.show === 'featured') parts.push('selected');
    if (state.show === 'published') parts.push('published');
    if (state.show === 'preprint') parts.push('preprints');
    showing.innerHTML = parts.length
      ? n + ' of ' + items.length + ' · ' + parts.join(', ') + ' <button type="button" class="linkish" data-reset>clear</button>'
      : '';

    if (fromUser) {
      try {
        var q = new URLSearchParams();
        if (state.s) q.set('s', state.s);
        if (state.show !== 'all') q.set('show', state.show);
        if (state.order !== 'new') q.set('order', state.order);
        var qs = q.toString();
        history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
      } catch (e) {}
    }
  }

  subjBtns.forEach(function (b) {
    b.addEventListener('click', function () { var id = b.getAttribute('data-subject'); state.s = state.s === id ? null : id; render(true); });
  });
  showBtns.forEach(function (b) {
    b.addEventListener('click', function () { state.show = b.getAttribute('data-show'); render(true); });
  });
  sortBtns.forEach(function (b) {
    b.addEventListener('click', function () { state.order = b.getAttribute('data-sort'); render(true); });
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-reset]')) { state.s = null; state.show = 'all'; render(true); }
  });

  /* abstracts unfold in place */
  function setOpen(btn, open) {
    var g = document.getElementById(btn.getAttribute('aria-controls'));
    if (!g) return;
    g.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'close abstract' : 'abstract';
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.pub__ab');
    if (b) setOpen(b, b.getAttribute('aria-expanded') !== 'true');
  });

  /* arriving at #<id>: make sure a filter never hides the target */
  document.addEventListener('site:arrive', function (e) {
    var el = e.detail && e.detail.el;
    if (el && el.classList.contains('pub') && el.hidden) { state.s = null; state.show = 'all'; render(true); el.scrollIntoView({ block: 'center' }); }
  });

  // initial state from the query string
  try {
    var q = new URLSearchParams(location.search);
    var s = q.get('s'); if (s && subjBtns.some(function (b) { return b.getAttribute('data-subject') === s; })) state.s = s;
    var sh = q.get('show'); if (['featured', 'published', 'preprint'].indexOf(sh) > -1) state.show = sh;
    if (q.get('order') === 'old') state.order = 'old';
  } catch (e) {}
  // a hash to a paper wins over a filter in the URL
  var target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)).split(':~:')[0]);
  if (target && target.classList.contains('pub')) { state.s = null; state.show = 'all'; }
  render(false);
})();
