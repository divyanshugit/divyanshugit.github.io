/* about.js — About page: lifting a plate into the "leaf" (photo set + note). */
(function () {
  'use strict';
  var leaf = document.getElementById('leaf');
  if (!leaf) return;
  var openId = null, opener = null;
  function close() {
    leaf.hidden = true; leaf.innerHTML = '';
    if (opener) { opener.setAttribute('aria-expanded', 'false'); opener.focus({ preventScroll: true }); }
    openId = null; opener = null;
  }
  document.querySelectorAll('.plate__open').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-leaf');
      if (openId === id) return close();
      var tpl = document.getElementById('leaf-' + id);
      if (!tpl) return;
      if (opener) opener.setAttribute('aria-expanded', 'false');
      leaf.innerHTML = '<button type="button" class="leaf__close">close ×</button>';
      leaf.appendChild(tpl.content.cloneNode(true));
      leaf.hidden = false; openId = id; opener = btn;
      if (window.eps && window.eps.scan) window.eps.scan(leaf);   // the leaf's photos go through ε too
      btn.setAttribute('aria-expanded', 'true');
      leaf.querySelector('.leaf__close').addEventListener('click', close);
      var top = leaf.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openId) close(); });
  // /about.html#place-<id> (from the probe or the home page) opens that plate
  document.addEventListener('site:arrive', function (e) {
    var m = /^place-(.+)$/.exec(e.detail.id || ''); if (!m) return;
    var btn = document.querySelector('.plate__open[data-leaf="' + m[1] + '"]');
    if (btn) { if (openId !== m[1]) btn.click(); }
    else { var fig = document.getElementById('place-' + m[1]); if (fig) fig.scrollIntoView({ block: 'center' }); }
  });
})();
