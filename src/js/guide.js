// The guide: the straw-hat mascot, the owner's avatar, on the page's own rules.
// Markup comes from the {% guide %} shortcode (.eleventy.js): a box sized for
// every pose he'll use, the standing pose inlined, and the page's behaviour in
// data-* attributes. This file reads those; there's no page-specific code here.
//
//   data-when     load | view | event:<name>   when his moment plays (once)
//   data-steps    [[pose, caption, holdMs], ...] the moment
//   data-again    the same, for a page already seen this session (default: a nod)
//   data-appear   hidden until his moment (space stays reserved)
//   data-leave    hide again this long after the moment ends
//   data-hover    {sel, map: {href: [pose, caption]}} react to hovered links
//   data-look     selector: look toward the hovered item
//   data-next     [[url, label], ...] candidates for a caption's "next" link
//   data-suggest  [{u, t, r}, ...] candidates for a caption's "suggest" link
// A caption is "" (clear), null (keep), a string, or {t, u, top, next, suggest, req}.
//
// Motion is a port of the approved studio (scratchpad drawn/index.html):
// crossfades with staggered fades, a 70ms rise from lean to upright, gestures
// pulling in on the way back, and drawn sequences (hat, wave) as hard cuts of
// pre-mounted frames on a fixed clock. Reduced motion: instant swaps, no idle.
(function () {
  'use strict';
  var figs = document.querySelectorAll('[data-guide]');
  if (!figs.length) return;

  // from src/assets/mascot/meta.json
  var VW = 570, VH = 391, LEDGE = 383.3, HX = 246.0;
  var UP = ['wave', 'waveCa', 'waveR', 'waveO', 'raise', 'present', 'pointUp', 'lift2', 'hat', 'shrug'];
  var BASE = '/assets/mascot/small/';
  var SEQ = { hat: ['rest', 'reach', 'lift', 'lift2', 'hat'], wave: ['rest', 'raise', 'wave', 'waveO', 'waveCa', 'waveR'] };
  var HOLD_DEFAULT = 1400, INTENT = 250;

  var mm = function (q) { return window.matchMedia ? matchMedia(q) : { matches: false }; };
  var RM = mm('(prefers-reduced-motion: reduce)'), HOVER = mm('(hover: hover) and (pointer: fine)');
  var reduced = function () { return RM.matches; };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var nextFrame = function () { return new Promise(function (r) { requestAnimationFrame(r); }); };
  var isUp = function (p) { return UP.indexOf(p) >= 0; };
  var json = function (s, d) { try { return s ? JSON.parse(s) : d; } catch (e) { return d; } };

  // ---------- session memory: pages opened this session ----------
  function norm(u) {
    try { u = new URL(u, location.href).pathname; } catch (e) {}
    return String(u).replace(/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '') || '/';
  }
  var here = norm(location.pathname), visited = [];
  try { visited = (JSON.parse(sessionStorage.getItem('guide')) || {}).v || []; } catch (e) {}
  var again = visited.indexOf(here) >= 0;
  if (!again) { visited.push(here); try { sessionStorage.setItem('guide', JSON.stringify({ v: visited })); } catch (e) {} }
  var unseen = function (u) { return visited.indexOf(norm(u)) < 0; };

  // ---------- drawings: fetched once, cached ----------
  // A drawn sequence comes as one file (seq-<name>.svg): a <g data-frame> per frame, with
  // the paths frames share written once in <defs> and pointed at by <use>. It's split back
  // into one full drawing per frame, so the pool, the eyes and the hard cuts see plain SVGs.
  var SVG = {}, LOADING = {};
  var BUNDLE = { wave: 'wave', raise: 'wave', waveO: 'wave', waveCa: 'wave', waveR: 'wave', reach: 'hat', lift: 'hat', lift2: 'hat', hat: 'hat' };
  var OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 570 391" data-pose="';
  function unbundle(t) {
    var defs = {}, parts = t.split('<g data-frame="');
    parts[0].replace(/<path id="(s\d+)" ([^>]*)\/>/g, function (m, id, rest) { defs[id] = '<path ' + rest + '/>'; });
    parts.slice(1).forEach(function (part) {
      var name = part.slice(0, part.indexOf('"')), body = part.slice(part.indexOf('>') + 1).replace(/<\/svg>\s*$/, '').replace(/<\/g>$/, '');
      SVG[name] = OPEN + name + '">' + body.replace(/<use href="#(s\d+)"\/>/g, function (m, id) { return defs[id]; }) + '</svg>';
    });
  }
  function get(p) {
    if (SVG[p]) return Promise.resolve();
    var key = BUNDLE[p] ? 'seq-' + BUNDLE[p] : p;
    if (!LOADING[key]) LOADING[key] = fetch(BASE + key + '.svg').then(function (r) { if (!r.ok) throw 0; return r.text(); })
      .then(function (t) { if (BUNDLE[p]) unbundle(t); else SVG[p] = t; }).catch(function () { delete LOADING[key]; });
    return LOADING[key];
  }
  function need(list) { return Promise.all(list.filter(Boolean).map(get)); }
  function withSeq(list) { var out = []; list.forEach(function (p) { out.push(p); (SEQ[p] || []).forEach(function (q) { out.push(q); }); }); return out; }
  function layerOf(p) { var l = document.createElement('div'); l.className = 'g-layer'; l.dataset.pose = p; l.innerHTML = SVG[p]; return l; }
  var stage = function (el) { return el.querySelector('.g-stage'); };
  function topLayer(el) { var ls = stage(el).querySelectorAll(':scope > .g-layer'); return ls[ls.length - 1] || el.querySelector('.g-pool > .g-layer.on'); }

  // ---------- drawn sequences: every frame pre-mounted (hidden), hard cuts in one rAF ----------
  function ensurePool(el) {
    var pool = el.querySelector('.g-pool');
    if (!pool) { pool = document.createElement('div'); pool.className = 'g-pool'; stage(el).prepend(pool); }
    var frames = [].concat(SEQ.hat, SEQ.wave);
    frames.forEach(function (p) { if (SVG[p] && !pool.querySelector('[data-pose="' + p + '"]')) pool.appendChild(layerOf(p)); });
    return pool;
  }
  async function cutTo(el, pose) {
    var pool = ensurePool(el);
    await nextFrame();
    pool.querySelectorAll('.g-layer').forEach(function (x) { var on = x.dataset.pose === pose; x.classList.toggle('on', on); if (!on) x.getAnimations().forEach(function (a) { a.cancel(); }); });
    stage(el).querySelectorAll(':scope > .g-layer').forEach(function (x) { x.remove(); });
    el.dataset.pose = pose; reaim(el);
  }
  function materialize(el) {
    var on = el.querySelector('.g-pool > .g-layer.on');
    if (!on || stage(el).querySelector(':scope > .g-layer')) return;
    stage(el).appendChild(layerOf(on.dataset.pose)); on.classList.remove('on');
  }
  async function playCuts(el, list, tok) {
    var due = performance.now();                       // a fixed clock, so rAF latency doesn't stretch the holds
    for (var i = 0; i < list.length; i++) {
      if (tok !== el._tok) return false;
      await cutTo(el, list[i][0]);
      if (list[i][1]) { due += list[i][1]; await wait(Math.max(0, due - performance.now() - 4)); }
    }
    return tok === el._tok;
  }

  var ARM_SIDE = { present: 1, point: 1, pointUp: -1, wave: -1, raise: -1, hat: -1, hatdown: -1, thumbs: -1, shrug: 0 };

  async function swap(el, pose, o) {
    o = o || {};
    if (el.dataset.pose === pose && !o.force) return;
    if (!SVG[pose]) await get(pose);
    if (!SVG[pose]) return;
    var tok = (el._tok = (el._tok || 0) + 1), from = el.dataset.pose;
    if (!from || !topLayer(el)) { stage(el).appendChild(layerOf(pose)); el.dataset.pose = pose; reaim(el); return; }
    var anim = !reduced() && !o.instant;
    var hatSeq = anim && SVG.reach && SVG.lift && SVG.lift2 && SVG.rest;
    var waveSeq = anim && SVG.raise && SVG.rest;
    if (hatSeq && pose === 'hat' && from !== 'hat') {
      // tip of the hat: reach (the grip is held), lift, lift2, hat
      if (!await playCuts(el, [['reach', 130], ['lift', 85], ['lift2', 85], ['hat', 0]], tok)) return;
      settle(el);
    } else if (hatSeq && from === 'hat') {
      if (!await playCuts(el, [['lift2', 85], ['lift', 85], ['reach', 110]], tok)) return;
      if (pose === 'rest') await cutTo(el, 'rest'); else { materialize(el); await step(el, pose, 'reach', tok); }
    } else if (waveSeq && pose === 'wave' && from !== 'wave') {
      // anticipation dip, then the raise drawing, then the wave itself
      if (!isUp(from)) {
        var t = topLayer(el);
        if (t) await t.animate([{ transform: 'none' }, { transform: 'translateY(.9%) rotate(-.7deg)' }],
          { duration: 80, easing: 'cubic-bezier(.3,0,.5,1)', fill: 'forwards' }).finished.catch(function () {});
        if (tok !== el._tok) return;
      }
      if (!await playCuts(el, [['raise', 85], ['wave', 0]], tok)) return;
    } else if (waveSeq && from === 'wave') {
      // lower the arm through the raise drawing, pulling in toward the shoulder
      await cutTo(el, 'raise'); if (tok !== el._tok) return;
      pullIn(el, 'raise', 85);
      await wait(85); if (tok !== el._tok) return;
      if (pose === 'rest') await cutTo(el, 'rest'); else { materialize(el); await step(el, pose, 'raise', tok); }
    } else {
      materialize(el);
      await step(el, pose, from, tok, o);
    }
    if (tok !== el._tok || reduced()) return;
    if (pose === 'wave') waveCycle(el, tok);
    if (pose === 'nod') nodDip(el);
  }
  function pullIn(el, p, ms) {
    var l = topLayer(el); if (!l) return;
    var side = ARM_SIDE[p] || 0;
    l.style.transformOrigin = ((HX + side * 38) / VW * 100) + '% ' + ((LEDGE - 130) / VH * 100) + '%';
    l.animate([{ transform: 'none' }, { transform: 'translateX(' + (-side * 1.2) + '%) scale(.975)' }], { duration: ms, easing: 'ease-in' });
  }
  function settle(el) {
    var s = topLayer(el) && topLayer(el).querySelector('svg');
    if (s) s.animate([{ transform: 'scale(1.01,.99)' }, { transform: 'none' }], { duration: 160, easing: 'ease-out' });
  }

  // soft change: new 0 -> 1 over 0-90ms, old 1 -> 0 over 45-127ms (an upright gesture pulls its arm in)
  async function step(el, pose, from, tok, o) {
    o = o || {};
    el.dataset.pose = pose;
    var st = stage(el), olds = [].slice.call(st.querySelectorAll(':scope > .g-layer')), l = layerOf(pose);
    if (reduced() || o.instant) {
      st.appendChild(l); olds.forEach(function (x) { x.remove(); });
      el.querySelectorAll('.g-pool > .g-layer.on').forEach(function (x) { x.classList.remove('on'); });
      reaim(el); return;
    }
    var upFrom = isUp(from), upTo = isUp(pose);
    if (!upFrom && upTo && olds.length) {
      await olds[olds.length - 1].animate([{ transform: 'none' }, { transform: 'translateY(-1.4%) rotate(.9deg)' }],
        { duration: 70, easing: 'cubic-bezier(.3,0,.6,1)', fill: 'forwards' }).finished.catch(function () {});
      if (tok !== el._tok) return;
    }
    st.appendChild(l); reaim(el);
    l.animate([{ opacity: 0, transform: upTo && !upFrom ? 'translateY(-.8%) scale(1.006,.99)' : 'translateY(.5%) scale(1.008,.988)' },
      { opacity: 1, transform: 'none' }], { duration: 90, easing: 'cubic-bezier(.2,.7,.3,1)' });
    olds.forEach(function (x) {
      if (x._leaving) return; x._leaving = true;
      var side = ARM_SIDE[x.dataset.pose], withdraw = upFrom && side !== undefined;
      var cur = getComputedStyle(x).transform;
      if (withdraw) x.style.transformOrigin = ((HX + (side || 0) * 38) / VW * 100) + '% ' + ((LEDGE - 130) / VH * 100) + '%';
      var end = withdraw ? 'translateX(' + (-(side || 0) * 1.5) + '%) scale(.97)' : (cur === 'none' ? 'none' : cur);
      x.getAnimations().forEach(function (an) { an.cancel(); });
      x.animate([{ opacity: 1, transform: cur === 'none' ? 'none' : cur }, { opacity: 0, transform: end }],
        { duration: 82, delay: 45, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' }).finished.then(function () { x.remove(); }, function () { x.remove(); });
    });
    await wait(90);
  }

  // wave: O (held) - C0 - Ca - R (held) - Ca - C0 ..., 510ms a cycle, 2.5 cycles, ending on C0.
  // The head leans a touch toward the hand, one drawing behind. One blink mid-wave.
  var SWAY = { waveO: 1.5, wave: 0.8, waveCa: 0.4, waveR: 0 };
  async function waveCycle(el, tok) {
    var list;
    if (SVG.waveO && SVG.waveCa && SVG.waveR) {
      var U = [['waveO', 120], ['wave', 70], ['waveCa', 70], ['waveR', 110], ['waveCa', 70], ['wave', 70]];
      list = [['wave', 70]].concat(U, U, [['waveO', 120], ['wave', 0]]);
    } else return;
    var blinkAt = Math.floor(list.length / 2), pool = ensurePool(el);
    pool.style.transformOrigin = (HX / VW * 100) + '% ' + (LEDGE / VH * 100) + '%';
    var prev = 'wave', due = performance.now();
    for (var i = 0; i < list.length; i++) {
      if (tok !== el._tok) break;
      await cutTo(el, list[i][0]);
      pool.style.transition = 'transform 90ms ease-in-out';
      pool.style.transform = 'skewX(' + (SWAY[prev] || 0) + 'deg)';
      prev = list[i][0];
      if (i === blinkAt) blink(el);
      if (list[i][1]) { due += list[i][1]; await wait(Math.max(0, due - performance.now() - 4)); }
    }
    pool.style.transform = 'none';
  }
  function nodDip(el) {
    var s = topLayer(el) && topLayer(el).querySelector('svg'); if (!s) return;
    s.animate([{ transform: 'none' }, { transform: 'translateY(2%)', offset: .45 }, { transform: 'translateY(-.9%)', offset: .78 }, { transform: 'none' }],
      { duration: 400, easing: 'ease-in-out', delay: 40 });
  }
  function blink(el) { el.classList.add('blink'); setTimeout(function () { el.classList.remove('blink'); }, 110); }

  // ---------- eyes: follow the pointer, or hold on a target ----------
  var ptr = null;
  function aimAt(el, x, y) {
    var t = topLayer(el), s = t && t.querySelector('svg'); if (!s) return;
    s.querySelectorAll('#eyes .eye').forEach(function (eye) {
      var r = eye.getBoundingClientRect(), e = eye.querySelector('ellipse'), pu = eye.querySelector('.pupil');
      if (!e || !pu || !r.width) return;
      var dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 220);
      var max = (+e.getAttribute('rx')) - (+pu.getAttribute('r')) - 1.2;
      pu.style.transform = 'translate(' + (dx / d * k * max * .55).toFixed(2) + 'px,' + (dy / d * k * max * .45).toFixed(2) + 'px)';
    });
  }
  function reaim(el) {
    var g = el._g; if (!g) return;
    if (g.pin) { var r = g.pin.getBoundingClientRect(); aimAt(el, r.left + Math.min(r.width / 2, 160), r.top + r.height / 2); }
    else if (ptr) aimAt(el, ptr.x, ptr.y);
  }
  addEventListener('pointermove', function (e) {
    ptr = { x: e.clientX, y: e.clientY };
    G.forEach(function (g) { if (g.vis && !g.pin) aimAt(g.fig, ptr.x, ptr.y); });
  }, { passive: true });

  // ---------- captions ----------
  function setCap(g, c) {
    if (c === null || c === undefined) return;
    var cap = g.cap;
    cap.classList.remove('in');
    cap.textContent = '';
    if (c === '') return;
    if (typeof c === 'string') c = { t: c };
    var main = document.createElement(c.u || c.top ? 'a' : 'span');
    main.textContent = c.t;
    if (c.u) main.href = c.u;
    if (c.top) {
      main.href = '#';
      main.addEventListener('click', function (e) { e.preventDefault(); scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }); });
    }
    cap.appendChild(main);
    if (c.s) {
      var sub = document.createElement(c.su ? 'a' : 'span'); sub.className = 'g-sub'; sub.textContent = c.s;
      if (c.su) sub.href = c.su;
      cap.appendChild(sub);
    }
    requestAnimationFrame(function () { cap.classList.add('in'); });
  }
  // fill in a caption's "next" or "suggest" link; false if it asked for one and none is left
  function resolve(g, c) {
    if (!c || typeof c !== 'object') return c;
    c = Object.assign({}, c);
    if (c.suggest) {
      var list = json(g.el.dataset.suggest, []), pick = list.filter(function (x) { return x.r && unseen(x.u); })[0] || list.filter(function (x) { return !x.r && unseen(x.u); })[0];
      if (!pick) return c.req ? false : null;
      c.su = pick.u; c.s = pick.t + ' →';
    }
    if (c.next) {
      var nx = json(g.el.dataset.next, []).filter(function (x) { return unseen(x[0]); })[0];
      if (nx) { c.s = nx[1] + ' →'; c.su = nx[0]; } else if (c.req) return false;
    }
    return c;
  }

  // ---------- a moment: steps of [pose, caption, hold] ----------
  async function play(g, steps) {
    var tok = (g.run = (g.run || 0) + 1);
    g.busy = true;
    await need(withSeq(steps.map(function (s) { return s[0]; })).concat(g.home));
    ensurePool(g.fig);
    if (g.el.hasAttribute('data-appear')) { g.el.classList.add('g-on'); if (!reduced()) await wait(220); }
    for (var i = 0; i < steps.length; i++) {
      if (tok !== g.run) return;
      var s = steps[i], cap = resolve(g, s[1]);
      if (cap === false) break;
      var p = swap(g.fig, s[0]);
      if (cap !== null) setTimeout(function (c) { if (tok === g.run) setCap(g, c); }.bind(null, cap), reduced() ? 0 : 120);
      await p;
      if (i < steps.length - 1 || s[2]) await wait(s[2] || HOLD_DEFAULT);
    }
    if (tok !== g.run) return;
    if (g.home && steps.length && steps[steps.length - 1][2]) await swap(g.fig, g.home);
    g.busy = false;
    var leave = +g.el.dataset.leave;
    if (leave) { await wait(leave); if (tok === g.run) { g.el.classList.remove('g-on'); setCap(g, ''); } }
  }

  // ---------- reacting to hovered things, with a 250ms intent delay ----------
  function intent(g, targets, onEnter, onLeave) {
    var timer = 0, cur = null;
    targets.forEach(function (t) {
      t.addEventListener('pointerenter', function () {
        clearTimeout(timer);
        timer = setTimeout(function () { if (g.busy) return; cur = t; onEnter(t); }, INTENT);
      });
      t.addEventListener('pointerleave', function () {
        clearTimeout(timer);
        timer = setTimeout(function () { if (cur) { cur = null; onLeave(); } }, INTENT);
      });
    });
  }

  // ---------- idle: breathing, blinks, an occasional sway (only while seen, never under reduced motion) ----------
  function idleOn(g) { g.fig.classList.toggle('idle', g.vis && !reduced()); }
  (function blinks() {
    setTimeout(function () {
      if (!reduced() && !document.hidden) G.forEach(function (g) {
        if (!g.vis) return;
        blink(g.fig); if (Math.random() < .2) setTimeout(function () { blink(g.fig); }, 260);
      });
      blinks();
    }, 2600 + Math.random() * 3800);
  })();
  (function sways() {
    setTimeout(function () {
      if (!reduced() && !document.hidden) G.forEach(function (g) {
        if (!g.vis || g.busy) return;
        var t = topLayer(g.fig), s = t && t.querySelector('svg'); if (!s) return;
        var d = Math.random() < .5 ? 1 : -1;
        s.animate([{ transform: 'none' }, { transform: 'skewX(' + (-.9 * d) + 'deg)', offset: .35 }, { transform: 'skewX(' + (.5 * d) + 'deg)', offset: .72 }, { transform: 'none' }], { duration: 2400, easing: 'ease-in-out' });
      });
      sways();
    }, 7000 + Math.random() * 7000);
  })();

  // ---------- wire each guide from its attributes ----------
  var idle = window.requestIdleCallback || function (f) { setTimeout(f, 1200); };
  var G = [].map.call(figs, function (el) {
    var g = { el: el, fig: el.querySelector('.g-fig'), cap: el.querySelector('.g-cap'), home: el.dataset.pose !== undefined ? el.dataset.pose : 'rest', vis: false };
    g.fig._g = g;
    var inl = g.fig.querySelector('.g-layer');
    if (inl) { SVG[g.home] = inl.innerHTML; g.fig.dataset.pose = g.home; }
    var d = el.dataset, when = d.when || '';
    var steps = json(d.steps, []), againSteps = json(d.again, [['nod', null]]);
    var moment = again && when === 'load' ? againSteps : steps;
    var hover = HOVER.matches;

    // lazy drawings: the moment's poses now if it plays on load, the rest when the browser is idle
    var later = (d.poses || '').split(' ').concat(moment.map(function (s) { return s[0]; }), hover ? (d.hoverPoses || '').split(' ') : []).filter(Boolean);
    var start = function () {
      if (when === 'load') {
        setTimeout(function () { play(g, moment); }, reduced() ? 0 : 120);
      }
    };
    if (when === 'load') need(withSeq(moment.map(function (s) { return s[0]; }))).then(start);
    idle(function () { need(withSeq(later)).then(function () { if (!g.busy) ensurePool(g.fig); }); });

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) { g.vis = es[0].isIntersecting; idleOn(g); if (g.vis) reaim(g.fig); }).observe(el);
      if (when === 'view') {
        var io = new IntersectionObserver(function (es) {
          if (!es[0].isIntersecting) return;
          io.disconnect(); setTimeout(function () { play(g, moment); }, reduced() ? 0 : 250);
        }, { threshold: .6 });
        io.observe(el);
      }
    } else { g.vis = true; idleOn(g); if (when === 'view') play(g, moment); }
    if (when.indexOf('event:') === 0) document.addEventListener('guide:' + when.slice(6), function () { play(g, steps); });

    if (hover && d.hover) {
      var h = json(d.hover, {}), map = h.map || {};
      var ts = [].filter.call(document.querySelectorAll(h.sel || 'a'), function (a) { return map[a.getAttribute('href')]; });
      intent(g, ts, function (a) { var m = map[a.getAttribute('href')]; g.pin = a; swap(g.fig, m[0]).then(function () { reaim(g.fig); }); reaim(g.fig); setCap(g, m[1]); },
        function () { g.pin = null; swap(g.fig, g.home); setCap(g, ''); });
    }
    if (hover && d.look) {
      intent(g, [].slice.call(document.querySelectorAll(d.look)), function (t) { g.pin = t; swap(g.fig, 'look').then(function () { reaim(g.fig); }); reaim(g.fig); },
        function () { g.pin = null; swap(g.fig, g.home); });
    }
    return g;
  });
  // test hook: ?guide-play=1 plays the moment at once, wherever he is (screenshots of end states)
  var q = new URLSearchParams(location.search);
  if (q.get('guide-play')) G.forEach(function (g) { setTimeout(function () { play(g, json(g.el.dataset.steps, [])); }, 50); });
  window.Guide = { all: G, play: play, swap: swap };
})();
