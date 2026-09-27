/* dmark.js — the site mark: the D as a private histogram (variant b).
   Documented in /DESIGN.md ("Mark"). Loaded after eps.js; any
   <svg data-dmark data-s="26"> is mounted on DOMContentLoaded and redraws
   from the global ε. The build prints the exact D into the same <svg>
   (shortcode `dmark` in .eleventy.js), so it shows before and without JS.

   The D is sampled into N rows. Each row's true width is a count (in units
   of 1/32 of the mark box, Δ = 1 unit). The released width is
   count + z_i · Δ/ε, where z_i is one fixed unit-Laplace draw per row made
   with the same hash + laplace as src/js/eps.js, so the draws are stable and
   the noise grows monotonically as ε falls. A soft clip (±L units, tanh)
   keeps the D inside its box; clipping after the mechanism is
   post-processing, so the release stays ε-DP.

   DMark.render({ S, N, eps, variant, snap })  → SVG children (string)
     S        box size in px (the SVG is S×S, viewBox 0 0 S S)
     N        rows (default: 6; the 16px cut always uses 5)
     eps      ε (Infinity = exact D)
     variant  'a' true ticks · 'b' one released row · 'c' every row, excess in madder · 'd' error whiskers
     snap     snap to the pixel grid (default: S ≤ 64)
   Classes: .mi ink fill, .ma madder fill.                                    */
(function (root) {
  'use strict';

  // identical to eps.js
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  function laplace(u) { var d = Math.max(-0.48, Math.min(0.48, u - 0.5)); return -Math.sign(d) * Math.log(1 - 2 * Math.abs(d)); }

  var SEED = 'dvynsh-mark/142/row';   // tag 142 of 400 tried: outer rows small, the largest draw on a bowl row
  var P = 2.1;             // superellipse exponent of the bowl (squarer than a circle, holds the row ends)
  var DELTA = 1;           // sensitivity, in count units
  function z(i) { return laplace(hash(SEED + i + '#ε')); }
  function se(t) { t = Math.min(1, Math.abs(t)); return Math.pow(1 - Math.pow(t, P), 1 / P); }

  function geometry(S, N, snap) {
    if (S <= 20) N = 5;                       // dedicated 16px cut
    var T = S * 0.875, gap, pitch, bar;
    if (snap) {
      gap = S <= 40 ? 1 : Math.max(1, Math.round(S * 0.034));
      pitch = Math.round((T + gap) / N);
      bar = pitch - gap;
    } else {
      pitch = T / (N - 0.21); gap = pitch * 0.21; bar = pitch - gap;
    }
    var H = N * bar + (N - 1) * gap;
    var W = S <= 20 ? 12 : 0.80 * H;
    if (snap) W = Math.round(W);
    var r = snap ? Math.round : function (v) { return v; };
    var x0 = r((S - W) / 2 + S * 0.01), top = snap ? Math.floor((S - H) / 2) : (S - H) / 2;
    var s = S <= 20 ? 3 : bar * 1.18;          // stem: a touch heavier than a row, the usual vertical correction
    var bowl = S <= 20 ? 3 : bar * 1.30;       // bowl stroke at the waist
    if (snap) { s = Math.max(2, Math.round(s)); bowl = Math.max(2, Math.round(bowl)); }
    var run = W * 0.30, Rx = W - run, cy = top + H / 2;
    var cTop = top + bar + gap, cBot = top + H - bar - gap, cH = (cBot - cTop) / 2;
    var rows = [];
    for (var i = 0; i < N; i++) {
      var y = top + i * (bar + gap), y2 = y + bar;
      // optical coverage: outer edge sampled at the band edge nearest the waist,
      // inner edge at the band edge farthest from it (shoulders stay heavy, counter stays open)
      var near = Math.abs(y - cy) < Math.abs(y2 - cy) ? y : y2;
      if (y < cy && y2 > cy) near = cy;
      var far = near === y ? y2 : y;
      var ys = near * 0.62 + (y + y2) / 2 * 0.38;          // lean toward the waist, not all the way
      var out = run + Rx * se((ys - cy) / (H / 2));
      var row = { i: i, y: y, h: bar, split: i > 0 && i < N - 1, out: r(out) };
      if (row.split) {
        var inn = run + (Rx - bowl) * se((far - cy) / (cH + gap));
        inn = Math.max(s + (snap ? 2 : bar * 0.6), Math.min(inn, out - bowl));
        row.inn = r(inn);
      }
      rows.push(row);
    }
    if (S <= 20 && snap) {
      // hand-cut 16px rows (px from x0): short bowl pieces hug the right side so
      // they read as one curve against the continuous stem (long ones read as an E)
      var cut = [[0, 9], [7, 10], [8, 11], [7, 10], [0, 9]];
      rows.forEach(function (row, k) { var c = cut[k] || cut[4]; row.out = c[1]; if (row.split) row.inn = c[0]; });
    }
    return { S: S, N: N, x0: x0, top: top, H: H, W: W, s: s, bar: bar, gap: gap, rows: rows, snap: snap };
  }

  // released width of row i (px from x0)
  function release(g, row, eps) {
    if (eps === Infinity) return row.out;
    var u = g.S / 32, b = DELTA / eps;               // noise scale in units
    var L = 0.16 * g.W / u;                          // soft clip, in units
    var n = L * Math.tanh(z(row.i) * b / L);
    var w = row.out + n * u;
    var lo = row.split ? row.inn + Math.max(1, g.bar * 0.5) : g.s + g.bar;
    var hi = g.S - g.x0 - (g.snap ? 1 : g.S * 0.02);
    w = Math.max(lo, Math.min(hi, w));
    return g.snap ? Math.round(w) : w;
  }

  function f(v) { return +(+v).toFixed(2); }
  function rect(x, y, w, h, c) { return w > 0 && h > 0 ? '<rect class="' + c + '" x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '"/>' : ''; }

  // the row with the largest positive draw among split rows (variant b)
  function pickRow(g) {
    var best = -1, bz = -Infinity;
    g.rows.forEach(function (r) { if (r.split && z(r.i) > bz) { bz = z(r.i); best = r.i; } });
    return best;
  }

  function render(o) {
    var S = o.S, snap = o.snap == null ? true : o.snap;
    var g = geometry(S, o.N || 6, snap), eps = o.eps == null ? Infinity : o.eps, v = o.variant || 'c';
    var x0 = g.x0, out = '', R = snap ? Math.round : function (x) { return x; };
    var small = S <= 40, tiny = S <= 20;
    var hair = Math.max(1, R(S / 88));
    var hot = v === 'b' ? pickRow(g) : -1;
    // at 16px the stem is one continuous column (the histogram's axis): the row gaps
    // would otherwise chop the D into a comb
    if (tiny) out += rect(x0, g.top, g.s, g.H, 'mi');
    g.rows.forEach(function (r) {
      var rel = release(g, r, eps), tru = r.out;
      var start = r.split ? r.inn : 0;
      if (r.split && !tiny) out += rect(x0, r.y, g.s, r.h, 'mi');
      if (v === 'a') {
        out += rect(x0 + start, r.y, rel - start, r.h, 'mi');
        if (eps !== Infinity && Math.abs(rel - tru) >= (snap ? 1 : 0.01)) {
          var ext = small ? 0 : R(g.gap * 0.45);
          out += rect(x0 + tru - (rel > tru ? hair : 0), r.y - ext, hair, r.h + 2 * ext, 'ma');
        }
      } else if (v === 'b') {
        // at ε = ∞ nothing is released, so the row is ink like the rest
        if (r.i === hot) out += rect(x0 + start, r.y, rel - start, r.h, eps === Infinity && !o.accentAtInf ? 'mi' : 'ma');
        else out += rect(x0 + start, r.y, tru - start, r.h, 'mi');
      } else if (v === 'c') {
        var m = Math.min(rel, tru);
        out += rect(x0 + start, r.y, m - start, r.h, 'mi');
        if (rel > tru) out += rect(x0 + tru, r.y, rel - tru, r.h, 'ma');
      } else if (v === 'd') {
        out += rect(x0 + start, r.y, tru - start, r.h, 'mi');
        if (eps !== Infinity && Math.abs(rel - tru) >= (snap ? 1 : 0.01)) {
          var wt = Math.max(1, R(r.h * 0.2)), a = Math.min(rel, tru), bb = Math.max(rel, tru);
          var cap = small ? r.h : R(r.h * 0.62);
          var cyr = snap ? r.y + Math.floor((r.h - wt) / 2) : r.y + (r.h - wt) / 2;
          out += rect(x0 + a, cyr, bb - a, wt, 'ma');
          out += rect(x0 + rel - (rel > tru ? hair : 0), r.y + (small ? 0 : R((r.h - cap) / 2)), hair, cap, 'ma');
        }
      } else {
        out += rect(x0 + start, r.y, rel - start, r.h, 'mi');
      }
    });
    return out;
  }

  // Live binding for the site: redraws an <svg> from the global ε.
  // Uses window.eps.subscribe when present, else the eps:change event.
  // Draws are fixed per row, so moving ε only scales them: no flicker, and
  // nothing animates on its own (ε's own tween already respects reduced motion).
  function mount(el, o) {
    o = o || {};
    var S = o.S || 32, last = null;
    el.setAttribute('viewBox', '0 0 ' + S + ' ' + S);
    el.setAttribute('shape-rendering', 'crispEdges');
    var draw = function (e) {
      if (e === last) return; last = e;
      el.innerHTML = render({ S: S, N: o.N || 6, eps: e, variant: o.variant || el.getAttribute('data-variant') || 'c' });
    };
    if (typeof window !== 'undefined' && window.eps && window.eps.subscribe) return window.eps.subscribe(draw);
    var h = function (ev) { draw(ev.detail.eps); };
    draw(Infinity);
    document.addEventListener('eps:change', h);
    return function () { document.removeEventListener('eps:change', h); };
  }

  function svg(o, cls) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + o.S + ' ' + o.S + '" width="' + (o.display || o.S) + '" height="' + (o.display || o.S) + '"' +
      (cls ? ' class="' + cls + '"' : '') + ' shape-rendering="crispEdges"' + ' aria-hidden="true">' + render(o) + '</svg>';
  }

  // auto-mount every <svg data-dmark> (eps.js registers its boot first, so ε is current)
  if (typeof document !== 'undefined') {
    var init = function () {
      document.querySelectorAll('svg[data-dmark]').forEach(function (el) {
        mount(el, { S: +el.getAttribute('data-s') || 32, variant: el.getAttribute('data-variant') || 'b' });
      });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  }

  var api = { render: render, mount: mount, svg: svg, geometry: geometry, release: release, z: z, SEED: SEED, DELTA: DELTA, hash: hash, laplace: laplace };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DMark = api;
})(typeof window !== 'undefined' ? window : this);
