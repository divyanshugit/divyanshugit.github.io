/* projects.js — the Projects page: each project's detail unfolds in place.
   Arriving at /projects.html#<id> opens that project's detail. */
(function () {
  'use strict';
  function setOpen(btn, open) {
    var d = document.getElementById(btn.getAttribute('aria-controls'));
    if (!d) return;
    d.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'close' : 'details';
  }
  document.querySelectorAll('.pj__more').forEach(function (b) {
    b.addEventListener('click', function () { setOpen(b, b.getAttribute('aria-expanded') !== 'true'); });
  });
  document.addEventListener('site:arrive', function (e) {
    var el = e.detail && e.detail.el;
    var b = el && el.classList.contains('pj') && el.querySelector('.pj__more');
    if (b) setOpen(b, true);
  });
})();
