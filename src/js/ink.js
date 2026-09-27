/* ink.js — the ink portrait draws itself, once per session.
   The SVG (partials/portrait-ink.njk) is a set of strokes grouped by feature
   (data-g, already in drawing order): face outline, eyes (the wink), nose,
   mouth and grin, beard, hair, collar, the cord, then the leaves. Each group
   gets a slot on a ~2.3s timeline; inside it the strokes follow one another
   in proportion to their length, like a pen. pathLength="1" is set here, so
   the markup stays small and a no-JS page simply shows the finished drawing.
   <head> sets html.ink-pending (not yet drawn this session, motion allowed);
   without it, nothing happens. Documented in /DESIGN.md ("The ink portrait"). */
(function () {
  'use strict';
  var root = document.documentElement;
  var svgs = Array.prototype.slice.call(document.querySelectorAll('svg[data-ink]'));
  var done = function () { root.classList.remove('ink-pending'); };
  if (!svgs.length || !root.classList.contains('ink-pending')) { done(); return; }

  var T = 2.35;
  var PLAN = {                       // [start, end] in seconds
    face: [0, .6], eyes: [.4, 1.0], nose: [.85, 1.15], mouth: [1.0, 1.4],
    beard: [1.25, 1.75], hair: [1.45, 2.05], collar: [1.8, 2.2], cord: [2.0, 2.25], bg: [2.05, T]
  };

  function arm(svg) {
    svg.querySelectorAll('g[data-g]').forEach(function (g) {
      var span = PLAN[g.getAttribute('data-g')] || [0, T], dur = span[1] - span[0];
      var ps = Array.prototype.slice.call(g.querySelectorAll('path'));
      var lens = ps.map(function (p) { try { return p.getTotalLength() || 1; } catch (e) { return 10; } });
      var tot = lens.reduce(function (a, b) { return a + b; }, 0), acc = 0;
      ps.forEach(function (p, i) {
        var t = Math.max(.14, Math.min(dur * .7, dur * 2.2 * lens[i] / tot));
        var d = span[0] + (dur - t) * (acc / tot);
        acc += lens[i];
        p.setAttribute('pathLength', '1');
        p.style.setProperty('--d', d.toFixed(3) + 's');
        p.style.setProperty('--t', t.toFixed(3) + 's');
      });
    });
    svg.classList.add('is-drawing');
    svg.querySelectorAll('path').forEach(function (p) { p.style.animationPlayState = 'paused'; });
  }
  function play(svg) {
    if (svg._inkPlayed) return;
    svg._inkPlayed = true;
    try { sessionStorage.setItem('ink.drawn', '1'); } catch (e) {}
    svg.querySelectorAll('path').forEach(function (p) { p.style.animationPlayState = ''; });
    setTimeout(function () {                 // settle into a plain, static drawing
      svg.classList.remove('is-drawing');
      svg.querySelectorAll('path').forEach(function (p) { p.removeAttribute('style'); });
    }, (T + .5) * 1000);
  }

  svgs.forEach(arm);
  done();                                     // armed (strokes hidden), so unhide in the same frame
  if (!('IntersectionObserver' in window)) { svgs.forEach(play); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); play(en.target); } });
  }, { threshold: .35 });
  svgs.forEach(function (s) { io.observe(s); });
})();
