/* eps.js — the privacy budget. One global ε, shared by every page.
   A real Laplace mechanism, applied ONLY to:
     • [data-f]         releasable particulars (facts in src/_data/particulars.js)
     • [data-eps-img]   photos (the place plates) and the ink portrait, whose
                        strokes are shaken rather than its pixels (see inkParams)
   Body prose is never noised. Default ε = ∞ (everything exact).
   Documented in /DESIGN.md ("ε API").

   window.eps = {
     get()                      → current ε (Infinity at ∞)
     set(ε, { animate })        → set ε (number or Infinity); kept for the session only
     subscribe(fn)              → fn(ε) now and on every change; returns unsubscribe
     laplace(u), hash(str)      → the seeded unit-Laplace draw used everywhere
     release({ value, delta, id }) → value + z·Δ/ε for a stable per-id draw z
     fmt(ε)                     → "∞", "0.30", …
   }
   Also dispatches `eps:change` on document with detail { eps }.           */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var qs = new URLSearchParams(location.search);
  var store = {
    // ε is per session: a returning visitor always starts at ∞
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    sget: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    sset: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- the ruler: position t ∈ [0,1] ↔ ε (log 0.01…10, then a detent at ∞) ---------- */
  var LOG_END = 0.84, SNAP = 0.92;
  function epsOf(t) { return t >= SNAP ? Infinity : Math.pow(10, -2 + 3 * Math.min(t, LOG_END) / LOG_END); }
  function tOf(e) { return e === Infinity ? 1 : Math.max(0, Math.min(LOG_END, (Math.log10(e) + 2) / 3 * LOG_END)); }
  function fmt(e) { return e === Infinity ? '∞' : e >= 10 ? '10' : e >= 1 ? e.toFixed(1) : e >= 0.1 ? e.toFixed(2) : e.toFixed(3); }

  /* ---------- seeded Laplace: one fixed draw per fact / pixel ---------- */
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  function laplace(u) { var d = Math.max(-0.48, Math.min(0.48, u - 0.5)); return -Math.sign(d) * Math.log(1 - 2 * Math.abs(d)); }
  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }

  /* ---------- releasable particulars ---------- */
  var FACTS = window.EPS_FACTS || {};
  var S = 1.6;
  var facts = [];
  function initFacts() {
    facts = Array.prototype.slice.call(document.querySelectorAll('[data-f]')).map(function (el) {
      var id = el.getAttribute('data-f'), def = FACTS[id];
      if (!def) return null;
      return { el: el, id: id, def: def, z: laplace(hash(id + '#ε')), last: el.textContent };
    }).filter(Boolean);
  }
  function releaseFact(f, e) {
    var b = e === Infinity ? 0 : 1 / e;
    if (f.def.levels) {
      var L = f.def.levels.length;
      var drop = Math.min(L - 1, Math.floor(Math.abs(f.z) * b * S));
      return { text: f.def.levels[drop], exact: drop === 0, level: drop, of: L - 1 };
    }
    var noise = f.z * (f.def.delta || 1) * b;
    var r = Math.round((f.def.value + noise) / (f.def.round || 1)) * (f.def.round || 1);
    var exact = b === 0;
    return { text: exact ? (f.def.exact || String(f.def.value)) : '≈' + Math.max(f.def.min == null ? 0 : f.def.min, r).toLocaleString('en'), exact: exact, noise: noise };
  }
  function renderFacts(e, animate) {
    var exact = 0;
    facts.forEach(function (f) {
      var r = releaseFact(f, e);
      if (r.exact) exact++;
      if (r.text !== f.last) {
        f.el.textContent = r.text; f.last = r.text;
        if (animate && !reduce) { f.el.classList.remove('settle'); void f.el.offsetWidth; f.el.classList.add('settle'); }
      }
      f.el.classList.toggle('noised', !r.exact);
      f.el.title = r.exact ? '' : (f.def.levels
        ? 'Generalised ' + r.level + ' of ' + r.of + ' levels at ε = ' + fmt(e)
        : 'Laplace noise ' + (r.noise >= 0 ? '+' : '−') + Math.abs(r.noise).toFixed(1) + ' at ε = ' + fmt(e));
    });
    return { exact: exact, total: facts.length };
  }

  /* ---------- photos released through the mechanism ----------
     At ∞ the real <img> shows (crisp, cheap). Below ∞ a canvas is created on
     demand over the image, drawn at data-eps-w px wide (default 480). */
  var imgs = [];
  function imgParams(e, W, mode) {
    if (e === Infinity) return { b: 0, amp: 0, bs: 1, desat: 0, anon: mode === 'anon' };
    var b = 1 / e, anon = mode === 'anon';
    var amp = Math.min(64, 13 * b);
    var bs = anon
      ? (b < 0.3 ? 1 : Math.min(48, Math.round(2 + 7 * Math.log2(1 + b) * (W / 400))))
      : (b < 0.45 ? 1 : Math.min(40, Math.round(1 + 4.2 * Math.log2(1 + b) * (W / 500))));
    var desat = anon ? Math.min(0.7, 0.2 * b) : Math.min(0.9, 0.3 * b);
    return { b: b, amp: amp, bs: bs, desat: desat, anon: anon };
  }
  function describe(e, W, mode) {
    if (e === Infinity) return 'released exactly';
    if (mode === 'ink') {                         // σ of the pen jitter, in px of a 400px-wide plate
      var k = inkParams(e, W);
      return (k.bs > 1 ? k.bs + 'px blocks · ' : '') + 'pen jitter σ≈' + Math.round(k.jit * Math.SQRT2 / 2) + 'px';
    }
    var p = imgParams(e, W || 400, mode);
    return (p.bs > 1 ? p.bs + 'px blocks · ' : '') + 'grain σ≈' + Math.round(p.amp * Math.SQRT2);
  }
  function prepare(h, cb) {
    if (h._st) return cb();
    if (h._loading) return;              // the pending load will draw at the then-current ε
    var img = h.querySelector('img'); if (!img) return;
    h._loading = true;
    var go = function () {
      var W = +(h.getAttribute('data-eps-w') || 480);
      var H = Math.round(W * (img.naturalHeight / img.naturalWidth || 0.5));
      var c = document.createElement('canvas');
      c.className = 'eps-canvas'; c.width = W; c.height = H; c.setAttribute('aria-hidden', 'true');
      (img.closest('.plate__img') || img.parentElement).appendChild(c);
      var ctx = c.getContext('2d', { willReadFrequently: true });
      try { ctx.drawImage(img, 0, 0, W, H); } catch (e) { return; }
      var orig = ctx.getImageData(0, 0, W, H);
      var n = new Float32Array(W * H), r = rng(Math.floor(hash(img.currentSrc || img.src) * 4294967295));
      for (var i = 0; i < n.length; i++) n[i] = laplace(r());
      h._st = { c: c, ctx: ctx, W: W, H: H, orig: orig, n: n, out: ctx.createImageData(W, H), last: null };
      cb();
    };
    if (img.complete && img.naturalWidth) go(); else img.addEventListener('load', go, { once: true });
  }
  function draw(h, e) {
    var st = h._st; if (!st || st.last === e) return;
    st.last = e;
    var p = imgParams(e, st.W, h.getAttribute('data-eps-mode'));
    var q = p.anon ? 22 : 0, grid = p.anon && p.bs >= 6;
    var o = st.orig.data, d = st.out.data, W = st.W, H = st.H, bs = p.bs, desat = p.desat, amp = p.amp, n = st.n;
    for (var by = 0; by < H; by += bs) {
      for (var bx = 0; bx < W; bx += bs) {
        var rr = 0, gg = 0, bb = 0, cnt = 0, ey = Math.min(H, by + bs), ex = Math.min(W, bx + bs), x, y, i;
        if (bs > 1) {
          for (y = by; y < ey; y += 2) for (x = bx; x < ex; x += 2) { i = (y * W + x) * 4; rr += o[i]; gg += o[i + 1]; bb += o[i + 2]; cnt++; }
          rr /= cnt; gg /= cnt; bb /= cnt;
          if (q) { rr = Math.round(rr / q) * q; gg = Math.round(gg / q) * q; bb = Math.round(bb / q) * q; }
        }
        for (y = by; y < ey; y++) for (x = bx; x < ex; x++) {
          var px = y * W + x; i = px * 4;
          var R = bs > 1 ? rr : o[i], G = bs > 1 ? gg : o[i + 1], B = bs > 1 ? bb : o[i + 2];
          var lum = .3 * R + .59 * G + .11 * B;
          R += (lum - R) * desat; G += (lum - G) * desat; B += (lum - B) * desat;
          if (!p.anon) { var tt = desat * .35; R += (lum * 1.06 + 8 - R) * tt; G += (lum * .98 + 2 - G) * tt; B += (lum * .86 - 6 - B) * tt; }
          if (grid && (x === bx || y === by)) { R *= .86; G *= .86; B *= .86; }
          var z = n[px] * amp;
          d[i] = R + z; d[i + 1] = G + z * .97; d[i + 2] = B + z * .92; d[i + 3] = 255;
        }
      }
    }
    st.ctx.putImageData(st.out, 0, 0);
  }
  /* ---------- the ink portrait (an SVG of strokes, not a photo) ----------
     A host whose plate holds svg[data-ink] is released by moving the pen, not the
     pixels. Every stroke anchor gets one seeded unit-Laplace draw per axis, and
     every feature group (data-g) one more, fixed for the page:
       anchor  += z · min(60, 4.5·b)     group += z · min(48, 3·b)     (b = 1/ε, in
     the 800 × 1200 drawing's units). A Bézier handle moves with its anchor, so the
     line gets shakier, never kinked; a short texture stroke (hair, beard) takes
     most of its shake as one piece. The draws are fixed, so it is monotone in ε.
     Below ε = 0.2 (b ≥ 5) the shaken drawing is also rasterised into the same
     coarse blocks as the photos. ∞ restores the drawing exactly as published. */
  function inkParams(e, W) {
    if (e === Infinity) return { b: 0, jit: 0, off: 0, bs: 1 };
    var b = 1 / e;
    return { b: b, jit: Math.min(60, 4.5 * b), off: Math.min(48, 3 * b),
      bs: b < 5 ? 1 : Math.min(40, Math.round(4 + 6 * Math.log2(b / 5 + 1) * ((W || 300) / 300))) };
  }
  function inkPrepare(h) {
    if (h._ink) return h._ink;
    var svg = h.querySelector('svg[data-ink]');
    var r = rng(Math.floor(hash('ink#portrait') * 4294967295)), groups = {}, paths = [];
    svg.querySelectorAll('path').forEach(function (p) {
      var d = p.getAttribute('d'), tok = d.match(/[MCQ]|-?\d*\.?\d+/g), segs = [], cur = null;
      tok.forEach(function (t) { if (/[MCQ]/.test(t)) { cur = { c: t, n: [] }; segs.push(cur); } else cur.n.push(+t); });
      var g = (p.closest('[data-g]') || svg).getAttribute('data-g') || '';
      if (!groups[g]) groups[g] = [laplace(r()), laplace(r())];
      var z = [];                                   // one (zx, zy) per anchor
      segs.forEach(function () { z.push(laplace(r()), laplace(r())); });
      paths.push({ el: p, d: d, segs: segs, z: z, g: groups[g], tex: /Q/.test(d) });
    });
    h._ink = { svg: svg, paths: paths, last: null, tok: 0 };
    return h._ink;
  }
  function inkShake(ink, p) {
    ink.paths.forEach(function (q) {
      if (!p.jit) { q.el.setAttribute('d', q.d); return; }
      var ox = q.g[0] * p.off, oy = q.g[1] * p.off, out = '', ax = 0, ay = 0;
      var f = function (v) { return Math.round(v * 10) / 10; };
      q.segs.forEach(function (s, k) {
        // a short texture stroke (Q: hair, beard) moves mostly as one, so it shakes instead of tangling
        var own = q.tex ? .35 : 1, sh = q.tex ? .8 : 0;
        var dx = (q.z[2 * k] * own + q.z[0] * sh) * p.jit + ox, dy = (q.z[2 * k + 1] * own + q.z[1] * sh) * p.jit + oy, n = s.n;
        if (s.c === 'M') out += 'M' + f(n[0] + dx) + ' ' + f(n[1] + dy);
        else if (s.c === 'C') out += 'C' + f(n[0] + ax) + ' ' + f(n[1] + ay) + ' ' + f(n[2] + dx) + ' ' + f(n[3] + dy) + ' ' + f(n[4] + dx) + ' ' + f(n[5] + dy);
        else out += 'Q' + f(n[0] + (ax + dx) / 2) + ' ' + f(n[1] + (ay + dy) / 2) + ' ' + f(n[2] + dx) + ' ' + f(n[3] + dy);
        ax = dx; ay = dy;
      });
      q.el.setAttribute('d', out);
    });
  }
  function inkBlocks(h, ink, p) {
    var W = +(h.getAttribute('data-eps-w') || 300), H = Math.round(W * 1.5), tok = ++ink.tok;
    var svg = ink.svg, cs = getComputedStyle(svg), well = getComputedStyle(svg.parentElement).backgroundColor;
    var sw = function (sel) { var q = svg.querySelector(sel + ' path'); return q ? getComputedStyle(q).strokeWidth : '4'; };
    var ikc = svg.querySelector('.ik path'); ikc = ikc ? getComputedStyle(ikc).stroke : cs.color;
    var css = 'path{fill:none;stroke:' + cs.color + ';stroke-linecap:round;stroke-linejoin:round}' +
      '.k path{stroke-width:' + sw('.k') + '}.d path{stroke-width:' + sw('.d') + '}.f path{stroke-width:' + sw('.f') + '}' +
      '.bg path{stroke-width:' + sw('.bg') + ';opacity:.5}.ik path{stroke:' + ikc + ';stroke-width:' + sw('.ik') + '}';
    var src = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200" width="' + W + '" height="' + H + '"><style>' + css + '</style>' +
      '<rect width="800" height="1200" fill="' + well + '"/>' + svg.innerHTML + '</svg>';
    var im = new Image();
    im.onload = function () {
      if (tok !== ink.tok || current === Infinity) return;
      var c = h._inkCanvas;
      if (!c) {
        c = h._inkCanvas = document.createElement('canvas');
        c.className = 'eps-canvas'; c.width = W; c.height = H; c.setAttribute('aria-hidden', 'true');
        svg.parentElement.appendChild(c);
      }
      var bs = p.bs, sw2 = Math.ceil(W / bs), sh2 = Math.ceil(H / bs);
      var tmp = document.createElement('canvas'); tmp.width = sw2; tmp.height = sh2;
      var tc = tmp.getContext('2d'); tc.imageSmoothingEnabled = true; tc.imageSmoothingQuality = 'high';
      tc.drawImage(im, 0, 0, sw2, sh2);
      var ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, W, H); ctx.drawImage(tmp, 0, 0, sw2 * bs, sh2 * bs);
      if (bs >= 6) {                                // the same faint block grid as the photos
        ctx.fillStyle = 'rgba(0,0,0,.08)';
        for (var x = 0; x < W; x += bs) ctx.fillRect(x, 0, 1, H);
        for (var y = 0; y < H; y += bs) ctx.fillRect(0, y, W, 1);
      }
      h.setAttribute('data-eps-live', '');
    };
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
  }
  function inkRender(h, e, force) {
    if (e === Infinity && !h._ink) return;          // never touched: already the published drawing
    var ink = inkPrepare(h), W = +(h.getAttribute('data-eps-w') || 300);
    if (ink.last === e && !force) return;
    ink.last = e;
    var p = inkParams(e, W);
    inkShake(ink, p);
    if (p.bs > 1) inkBlocks(h, ink, p);
    else { ink.tok++; h.removeAttribute('data-eps-live'); }
  }
  // Blocks are painted in the page's colours: repaint them when the proof changes.
  var reinkAll = function () { imgs.forEach(function (h) { if (h._ink && current !== Infinity) inkRender(h, current, true); }); };
  new MutationObserver(reinkAll).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  var darkMQ = window.matchMedia('(prefers-color-scheme: dark)');
  if (darkMQ.addEventListener) darkMQ.addEventListener('change', reinkAll);

  function renderImgs(e) {
    imgs.forEach(function (h) {
      if (h.querySelector('svg[data-ink]')) { inkRender(h, e); return; }
      if (e === Infinity) { h.removeAttribute('data-eps-live'); if (h._st) h._st.last = null; return; }
      prepare(h, function () {
        if (current === Infinity) return;
        draw(h, current); h.setAttribute('data-eps-live', '');
      });
    });
  }

  /* ---------- the instrument ---------- */
  var t = 1, current = Infinity;
  var listeners = [];
  var insts = [];
  function buildInstrument(host, idx) {
    var id = 'eps-body-' + idx;
    host.classList.add('eps');
    host.innerHTML =
      '<div class="eps__head"><span class="lab">Privacy budget</span>' +
        '<span class="eps__val"><i>ε</i><span class="eq">=</span><output aria-live="off">∞</output></span></div>' +
      '<button type="button" class="eps__toggle" aria-expanded="false" aria-controls="' + id + '">adjust</button>' +
      '<div class="eps__body" id="' + id + '"><div>' +
        '<div class="eps__rule" role="slider" tabindex="0" aria-label="Privacy budget, epsilon" aria-valuemin="0" aria-valuemax="100">' +
          '<svg viewBox="0 0 200 32" preserveAspectRatio="none" aria-hidden="true"></svg><div class="eps__needle"></div></div>' +
        '<div class="eps__read"><span class="rb">b = Δf/ε = 0</span><span class="rx"></span></div>' +
        '<p class="eps__hint">' + (host.getAttribute('data-hint') || 'Lower ε and the page releases the portrait, the plates and one line of particulars under calibrated Laplace noise. The prose stays as written.') +
        ' <button type="button" class="eps__reset" hidden>Release all</button></p>' +
      '</div></div>';
    var svg = host.querySelector('.eps__rule svg'), s = '';
    for (var dec = -2; dec <= 1; dec++) {
      var x0 = (dec + 2) / 3 * LOG_END * 200;
      s += '<line class="tk" x1="' + x0 + '" y1="0" x2="' + x0 + '" y2="10"/>';
      s += '<text x="' + x0 + '" y="26" text-anchor="' + (dec === -2 ? 'start' : 'middle') + '">' + ['0.01', '0.1', '1', '10'][dec + 2] + '</text>';
      if (dec < 1) for (var k = 2; k <= 9; k++) {
        var x = (dec + 2 + Math.log10(k)) / 3 * LOG_END * 200;
        s += '<line class="tk minor" x1="' + x + '" y1="0" x2="' + x + '" y2="' + (k === 5 ? 7 : 5) + '"/>';
      }
    }
    s += '<line class="tk" x1="200" y1="0" x2="200" y2="10"/><text class="inf" x="200" y="27" text-anchor="end">∞</text>';
    s += '<line class="tk minor" x1="' + (LOG_END * 200 + 6) + '" y1="3" x2="194" y2="3" stroke-dasharray="1 3"/>';
    svg.innerHTML = s;

    var rule = host.querySelector('.eps__rule');
    var fromX = function (clientX, release) {
      var r = rule.getBoundingClientRect();
      var nt = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      if (nt > LOG_END && nt < SNAP) nt = release ? (nt > (LOG_END + SNAP) / 2 ? 1 : LOG_END) : nt;
      setT(nt >= SNAP ? 1 : Math.min(nt, LOG_END), true);
    };
    rule.addEventListener('pointerdown', function (e) { rule.setPointerCapture(e.pointerId); fromX(e.clientX, false); });
    rule.addEventListener('pointermove', function (e) { if (rule.hasPointerCapture(e.pointerId)) fromX(e.clientX, false); });
    rule.addEventListener('pointerup', function (e) { fromX(e.clientX, true); });
    rule.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 0.1 : 0.028, base = t === 1 ? LOG_END : t, nt;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') nt = Math.max(0, base - step);
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') nt = t >= LOG_END - 1e-6 ? 1 : Math.min(LOG_END, t + step);
      else if (e.key === 'Home') nt = 0; else if (e.key === 'End') nt = 1; else return;
      e.preventDefault(); setT(nt, true);
    });
    host.querySelector('.eps__reset').addEventListener('click', function () { tweenTo(1, 700); });
    var tog = host.querySelector('.eps__toggle');
    tog.addEventListener('click', function () {
      var o = host.classList.toggle('open'); tog.setAttribute('aria-expanded', String(o)); tog.textContent = o ? 'close' : 'adjust';
      if (window.site) setTimeout(window.site.schedule, 460);
    });
    insts.push(host);
  }
  function paint(e, stats) {
    var b = e === Infinity ? 0 : 1 / e;
    insts.forEach(function (h) {
      h.querySelector('output').textContent = fmt(e);
      h.querySelector('.eps__needle').style.left = (t * 100) + '%';
      h.querySelector('.rb').textContent = 'b = Δf/ε = ' + (b === 0 ? '0' : b >= 10 ? b.toFixed(0) : b.toFixed(2));
      var portrait = document.querySelector('[data-eps-img][data-eps-mode="anon"]');
      h.querySelector('.rx').textContent = stats.total ? stats.exact + '/' + stats.total + ' exact' : (portrait ? describe(e, 300, portrait.querySelector('svg[data-ink]') ? 'ink' : 'anon') : '');
      var rule = h.querySelector('.eps__rule');
      rule.setAttribute('aria-valuenow', String(Math.round(t * 100)));
      rule.setAttribute('aria-valuetext', e === Infinity ? 'epsilon infinity, released in full' : 'epsilon ' + fmt(e));
      h.querySelector('.eps__reset').hidden = e === Infinity;
    });
    document.querySelectorAll('[data-eps-out]').forEach(function (el) { el.textContent = fmt(e); });
    document.querySelectorAll('[data-eps-read]').forEach(function (el) { el.textContent = describe(e, 400, el.getAttribute('data-eps-read')); });
    root.setAttribute('data-eps', e === Infinity ? 'inf' : 'finite');
  }
  function apply(animate) {
    current = epsOf(t);
    var stats = renderFacts(current, animate);
    renderImgs(current);
    paint(current, stats);
    listeners.forEach(function (fn) { try { fn(current); } catch (err) { console.error(err); } });
    document.dispatchEvent(new CustomEvent('eps:change', { detail: { eps: current } }));
  }
  function setT(nt, persist) { t = nt; apply(true); if (persist) store.set('eps.t', String(t)); }
  var tweenId = 0;
  function tweenTo(target, ms) {
    var id = ++tweenId, t0 = t, start = performance.now();
    if (reduce || ms <= 0) { setT(target, true); return; }
    var step = function (now) {
      if (id !== tweenId) return;
      var k = Math.min(1, (now - start) / ms), q = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      t = t0 + (Math.min(target, LOG_END) - t0) * q;
      if (k >= 1) t = target;
      apply(false);
      if (k < 1) requestAnimationFrame(step); else store.set('eps.t', String(t));
    };
    requestAnimationFrame(step);
  }

  /* ---------- boot ---------- */
  function boot() {
    initFacts();
    imgs = Array.prototype.slice.call(document.querySelectorAll('[data-eps-img]'));
    document.querySelectorAll('[data-eps-instrument]').forEach(buildInstrument);
    // One instrument per group lives in the DOM; it moves between its wide
    // (rail) and narrow (inline) dock as the breakpoint changes.
    var WIDE = window.matchMedia('(min-width: 1081px)');
    var dock = function () {
      document.querySelectorAll('[data-eps-docks]').forEach(function (h) {
        var g = h.getAttribute('data-eps-docks');
        var target = document.querySelector('[data-eps-dock="' + g + (WIDE.matches ? '-wide' : '-narrow') + '"]');
        if (target && h.parentElement !== target) target.appendChild(h);
      });
      if (window.site) window.site.schedule();
    };
    dock();
    if (WIDE.addEventListener) WIDE.addEventListener('change', dock);
    var saved = parseFloat(store.get('eps.t'));
    var q = qs.get('eps');
    t = q ? tOf(q === 'inf' ? Infinity : parseFloat(q)) : (isFinite(saved) ? Math.max(0, Math.min(1, saved)) : 1);
    apply(false);
    // Gentle discoverability: one soft pulse of the ε glyph, once per session.
    if (!reduce && insts.length && !store.sget('eps.hinted')) {
      store.sset('eps.hinted', '1');
      setTimeout(function () {
        insts.forEach(function (h) { var g = h.querySelector('.eps__val i'); if (g) { g.classList.add('pulse'); g.addEventListener('animationend', function () { g.classList.remove('pulse'); }, { once: true }); } });
      }, 1200);
    }
  }

  window.eps = {
    get: function () { return current; },
    set: function (e, opts) { var nt = tOf(e === Infinity || e === 'inf' ? Infinity : +e); if (opts && opts.animate) tweenTo(nt, 700); else setT(nt, true); },
    subscribe: function (fn) { listeners.push(fn); fn(current); return function () { var i = listeners.indexOf(fn); if (i > -1) listeners.splice(i, 1); }; },
    laplace: laplace, hash: hash, fmt: fmt, describe: describe,
    // Register photos added after boot (e.g. the leaf on About, cloned from a
    // <template>) and forget ones that left the DOM; they draw at the current ε.
    scan: function (scope) {
      imgs = imgs.filter(function (h) { return h.isConnected; });
      (scope || document).querySelectorAll('[data-eps-img]').forEach(function (h) { if (imgs.indexOf(h) < 0) imgs.push(h); });
      renderImgs(current);
    },
    release: function (o) { if (current === Infinity) return o.value; return o.value + laplace(hash(String(o.id || 'x') + '#ε')) * (o.delta || 1) / current; }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
