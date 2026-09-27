/* "Ask this site": the UI for the guardrail. No LLM anywhere.

   Server first: POST /api/ask runs the full pipeline (normalize, rules, a small
   self-hosted embedding model, kNN against a private attack bank, hybrid
   retrieval, output check) and returns JSON. If the API is unreachable, errors
   or takes longer than 2.5 s, the same question is answered in the browser by
   ProbeCore (js/probe-core.js): the same rules, decoding, intents and grounding,
   minus the embeddings. Both paths return the same shape, rendered by one set of
   functions below, so the UX is the same.

   Grounding uses /search-index.json (src/search-index.11ty.js), fetched lazily on
   first focus for the offline path. Every reply ends with a Sources line. Nothing
   is generated. See DESIGN.md § 7 and docs/guardrail.md. */
(function () {
  'use strict';
  var form = document.getElementById('probe');
  var Core = window.ProbeCore;
  if (!form || !Core) return;
  var input = document.getElementById('probe-q');
  var verdict = document.getElementById('verdict');
  var box = document.getElementById('verdict-box');
  var tally = document.getElementById('tally');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var asked = 0, refused = 0, withheld = 0;
  var API = '/api/ask', API_TIMEOUT = 2500;
  var PAPERS = Core.PAPERS, FAMILIES = Core.FAMILIES, esc = Core.esc;

  /* ---------- the index, for the offline path ---------- */
  var INDEX = null, loading = null;
  function loadIndex() {
    if (INDEX) return Promise.resolve(INDEX);
    if (!loading) loading = fetch('/search-index.json', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (j) { INDEX = Core.prepareIndex(j); return INDEX; })
      .catch(function () { INDEX = []; return INDEX; });
    return loading;
  }

  /* ---------- ask the server, fall back to the browser ---------- */
  function askServer(q) {
    if (!window.fetch || !window.AbortController) return Promise.reject(new Error('no fetch'));
    var ctrl = new AbortController(), timer = setTimeout(function () { ctrl.abort(); }, API_TIMEOUT);
    return fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q: q }), signal: ctrl.signal, credentials: 'same-origin' })
      .then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { if (!j || !j.verdict) throw new Error('bad reply'); j.where = 'server'; return j; })
      .catch(function (e) { clearTimeout(timer); throw e; });
  }
  function askLocal(q) {
    return loadIndex().then(function (idx) { var r = Core.run(idx, q); r.where = 'browser'; return r; });
  }

  /* ---------- server HTML is re-sanitised before it touches the DOM ----------
     The server escapes everything it composes, but the page does not rely on
     that: only these tags and attributes survive, and links must be relative or http(s). */
  var ALLOW = { P: ['class'], UL: ['class'], LI: [], B: [], STRONG: [], EM: [], I: [], Q: [], CITE: [], SPAN: ['class'], A: ['href', 'data-email'] };
  function sanitize(html) {
    var doc = new DOMParser().parseFromString('<div>' + String(html || '') + '</div>', 'text/html');
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) return;
        if (n.nodeType !== 1 || !ALLOW[n.tagName]) { node.replaceChild(doc.createTextNode(n.textContent || ''), n); return; }
        Array.prototype.slice.call(n.attributes).forEach(function (a) {
          if (ALLOW[n.tagName].indexOf(a.name) < 0) n.removeAttribute(a.name);
          else if (a.name === 'href' && !/^(\/(?!\/)|#|https?:\/\/)/i.test(a.value)) n.removeAttribute('href');
        });
        walk(n);
      });
    })(doc.body.firstChild);
    return doc.body.firstChild.innerHTML;
  }

  /* ---------- rendering ---------- */
  function unmark() { var old = document.getElementById('n-verdict'); if (old) old.remove(); }
  function open(html) { box.classList.remove('thud'); box.innerHTML = html; verdict.classList.add('open'); }
  function count(isRefused, isWithheld) {
    asked++; if (isRefused) refused++; if (isWithheld) withheld++;
    tally.textContent = asked + (asked === 1 ? ' probe' : ' probes') + ' · ' + refused + ' refused · ' + (withheld ? withheld + ' withheld · ' : '') + '0 leaked';
    tally.classList.add('on');
  }
  function relayout() { if (window.site) window.site.placeNotes(); }
  function addNote(html, delay) {
    setTimeout(function () {
      unmark();
      var n = document.createElement('aside');
      n.className = 'note note--verdict always'; n.id = 'n-verdict'; n.setAttribute('data-anchor', 'verdict-box');
      n.innerHTML = '<div class="note__in">' + html + '</div>';
      form.after(n); relayout();
    }, delay);
  }
  function dest(e) {
    var parts = String(e.s || '').split(' · '), page = parts.shift(), label = parts.join(' · ');
    var mail = e.u === 'email:' ? document.querySelector('[data-email]') : null;
    var href = /^(\/(?!\/)|#|https?:\/\/)/i.test(e.u) ? e.u : '/about.html';
    var attrs = mail ? 'href="/about.html#contact" data-email="' + esc(mail.getAttribute('data-email')) + '"' : 'href="' + esc(href) + '"';
    return '<a class="dest" ' + attrs + '><b>' + esc(page) + '</b>' + (label ? ' · ' + esc(label) : '') + '</a>';
  }
  function howNote(res) {
    return res.where === 'server'
      ? 'Retrieved on the server: keyword and embedding search over the site index, no language model.'
      : 'Answered in your browser from the site index; the server was not reachable.';
  }

  // one reply: each part's answer in order, then one compact Sources line
  function renderReply(res) {
    var parts = res.parts, srcs = [], seen = {}, quoted = 0, answered = 0;
    var html = parts.map(function (x) {
      if (x.answer) { answered++; quoted += x.quoted ? 1 : 0; (x.sources || []).forEach(function (e) { var k = String(e.u).split(':~:')[0] + '|' + e.s; if (!seen[k]) { seen[k] = 1; srcs.push(e); } }); }
      var body = x.answer ? sanitize(x.answer) : '<p class="miss">Nothing on this site answers that part, so it declines to guess.</p>';
      return '<div class="part">' + (parts.length > 1 ? '<span class="qlab">' + esc(String(x.q).replace(/[\s.!]+$/, '')) + '?</span>' : '') + body + '</div>';
    }).join('');
    var SHOW = 3, rest = srcs.slice(SHOW);
    var lbl = 'and ' + rest.length + ' more';
    var more = rest.length ? ' <button type="button" class="more-s" aria-expanded="false" aria-controls="rest" data-l="' + lbl + '">' + lbl + '</button>' : '';
    open('<div class="answer">' + html +
      '<p class="srcs"><span class="lab">Sources</span>' + srcs.slice(0, SHOW).map(dest).join('<span class="sep">·</span>') + more + '</p>' +
      (rest.length ? '<span class="rest" id="rest"><span>' + rest.map(dest).join('<span class="sep">·</span>') + '</span></span>' : '') +
      '<p class="src">' + (quoted ? 'Quoted and assembled from this site; nothing was generated.' : 'Assembled from this site; nothing was generated.') + '</p></div>');
    count(false);
    addNote('<span class="lab">grounded</span>' + answered + (answered === 1 ? ' answer' : ' answers') + ' from ' + srcs.length + (srcs.length === 1 ? ' source' : ' sources') + ' on this site.<span class="venue">' + howNote(res) + '</span>', 520);
  }
  function renderNone() {
    open('<div class="answer declined"><p>Nothing on this site supports an answer, so it declines to guess.</p><p class="src">An ungrounded answer is a hallucination with good manners. Try <button type="button" class="more-s" data-try="Who is Divyanshu?">who is he?</button>, <button type="button" class="more-s" data-try="What can he do?">what can he do?</button> or <button type="button" class="more-s" data-try="Where have you lived?">where has he lived?</button>, or read <a href="/about.html">About</a>.</p></div>');
    count(false); setTimeout(relayout, 520);
  }
  function renderHello() {
    open('<p class="answer">Hello. Ask about the work, the papers, the writing or the places. Or try to break it; that is allowed too.</p>');
    count(false); setTimeout(relayout, 520);
  }

  var SEAL_N = 0;
  function sealDate() {
    var d = new Date(), R = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return d.getDate() + ' ' + R[d.getMonth()] + ' ' + d.getFullYear();
  }
  function seal(pol, word) {
    SEAL_N++;
    var no = 'Nº ' + String(SEAL_N).padStart(3, '0');
    return '<div class="seal" aria-hidden="true"><svg viewBox="0 0 124 124">' +
      '<defs><path id="ring" d="M62,62 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0"/>' +
      '<filter id="rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="' + (SEAL_N * 7) + '" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="1.1"/><feComponentTransfer><feFuncA type="table" tableValues="0 .75 1"/></feComponentTransfer></filter>' +
      '<filter id="speck"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="3" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.45" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter></defs>' +
      '<g filter="url(#rough)"><g filter="url(#speck)">' +
      '<circle cx="62" cy="62" r="58" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="62" cy="62" r="54" fill="none" stroke="currentColor" stroke-width=".7"/>' +
      '<circle cx="62" cy="62" r="36" fill="none" stroke="currentColor" stroke-width=".7"/>' +
      '<text class="ring"><textPath href="#ring" startOffset="0">GUARDRAIL · POLICY ' + esc(pol) + ' · DVYNSH.ORG · ' + sealDate() + ' ·</textPath></text>' +
      '<text class="big" x="62.5" y="67" text-anchor="middle">' + (word || 'Refused') + '</text>' +
      '<text class="no" x="62" y="79.5" text-anchor="middle">' + no + '</text>' +
      '<path d="M48 50 H76 M48 86 H76" stroke="currentColor" stroke-width=".5"/>' +
      '</g></g></svg></div>';
  }

  // "view the rule": the regex and what it matched, or, for a semantic catch,
  // the nearest known attack and its similarity
  function ruleView(res) {
    var r = res.rule, k = res.attack, body = '';
    if (r && r.source) {
      var text = String(r.matchedOn || ''), m = r.match, hl = esc(text);
      if (m && text.substr(m.index, m.text.length) === m.text) hl = esc(text.slice(0, m.index)) + '<mark>' + esc(m.text) + '</mark>' + esc(text.slice(m.index + m.text.length));
      body = '<b>rule ' + esc(r.pol) + ' · ' + esc(r.id) + '</b>\n' + esc(r.source) + '\n\n<b>matched</b>\n' + hl;
    }
    if (k) {
      var s = res.scores && res.scores.knn;
      body += (body ? '\n\n' : '') + '<b>nearest known attack</b>\n' + esc(k.family) + ' · cosine ' + Number(k.score).toFixed(2) +
        (s ? '\nrefuses at ≥ ' + s.tau + ' when at least ' + s.delta + ' closer than the nearest benign question (' + Number(k.benign).toFixed(2) + ')' : '') +
        (k.matchedOn ? '\n\n<b>compared</b>\n' + esc(k.matchedOn) : '') +
        '\n\n<span>The attack bank stays on the server; only the family and the score come back.</span>';
    }
    if (!body) return '';
    return '<button type="button" class="rulebtn" aria-expanded="false" aria-controls="rule">view the rule</button>' +
      '<span class="rule" id="rule"><div><pre>' + body + '</pre></div></span>';
  }

  function renderAttack(q, res) {
    var r = res.rule, k = res.attack, enc = res.enc;
    var a = r || { id: k.family, fam: k.fam, pol: k.pol, paper: k.paper, dry: '' };
    var fam = a.fam || (FAMILIES[a.id] || {}).fam || 'Attack';
    if (enc && a.id !== 'encoding') fam += ', via ' + enc.how;
    if (!r && k) fam += ' (semantic match)';
    var p = PAPERS[a.paper] || PAPERS.nfl;
    var decodedLine = enc ? '<span class="dry">Decoded it anyway (' + esc(enc.how) + '): <span class="decoded">' + esc(String(enc.text).slice(0, 90)) + '</span>. Simple transformations are the whole point of <a href="' + PAPERS.beyond.u + '">' + (a.paper === 'beyond' ? 'this paper' : 'Beyond Text') + '</a>.</span>' : '';
    if (enc && a.paper !== 'beyond') p = PAPERS.beyond;
    var nearest = k ? '<span class="dry">Nearest known attack: ' + esc((FAMILIES[k.family] || {}).fam || k.family) + ', similarity ' + Number(k.score).toFixed(2) + '.</span>' : '';
    var shown = q.length > 140 ? q.slice(0, 137) + '…' : q;
    open(
      '<div class="refusal">' +
        '<div>' +
          '<p class="quoted"><span class="bar pre" id="bar">' + esc(shown) + '</span></p>' +
          '<p class="refusal__why" id="why" style="opacity:0"><span class="fam">' + esc(fam) + ' · policy ' + esc(a.pol) + '</span>' +
            (a.id === 'extract' ? 'The system prompt is <span class="bar swept" style="padding:0 3.2em">&nbsp;</span> <span class="bar swept" style="padding:0 1.6em">&nbsp;</span> <span class="bar swept" style="padding:0 2.4em">&nbsp;</span>.' : 'This page won’t do that.') +
            (a.dry ? '<span class="dry">' + esc(a.dry) + '</span>' : '') + nearest + decodedLine +
          '</p>' + '<div class="rulewrap" style="opacity:0" id="rulewrap">' + ruleView(res) + '</div>' +
        '</div>' +
        seal(a.pol) +
      '</div>'
    );
    count(true);
    var bar = document.getElementById('bar'), why = document.getElementById('why');
    var s = box.querySelector('.seal');
    var T = reduce ? 0 : 1;
    setTimeout(function () { bar.classList.remove('pre'); void bar.offsetWidth; bar.classList.add('swept'); }, 380 * T);
    setTimeout(function () { s.classList.add('land'); box.classList.add('thud'); }, 820 * T);
    setTimeout(function () {
      why.style.transition = 'opacity .5s cubic-bezier(.22,.61,.36,1)'; why.style.opacity = 1;
      var rw = document.getElementById('rulewrap'); if (rw) { rw.style.transition = why.style.transition; rw.style.opacity = 1; }
      addNote('<span class="lab">attack family</span>' + esc(fam) + '.' +
        (k ? '<span class="venue">Nearest known attack: ' + esc(k.family) + ', similarity ' + Number(k.score).toFixed(2) + '.</span>' : '') +
        '<span class="venue">Catalogued in <a href="' + p.u + '"><cite>' + esc(p.t) + '</cite></a>, ' + esc(p.v) + '.</span>' +
        (res.where === 'browser' ? '<span class="venue">Checked in your browser; the server was not reachable.</span>' : ''), 0);
    }, 1180 * T);
  }

  // the output check stopped a composed reply (canary, personal data, bank leakage)
  function renderWithheld(q, res) {
    var shown = q.length > 140 ? q.slice(0, 137) + '…' : q;
    open('<div class="refusal"><div><p class="quoted"><span class="bar swept">' + esc(shown) + '</span></p>' +
      '<p class="refusal__why"><span class="fam">Output check · policy 8.1</span>A reply was assembled, then failed the output check (' + esc((res.withheld || []).join(', ')) + '), so it was withheld.' +
      '<span class="dry">Input filters miss things; this is the second lock.</span></p></div>' + seal('8.1', 'Withheld') + '</div>');
    count(true, true);
    setTimeout(function () { var s = box.querySelector('.seal'); if (s) s.classList.add('land'); }, 60);
    addNote('<span class="lab">output check</span>Canary, personal-data and leakage checks run on every reply before it leaves the server.', 400);
  }

  function render(q, res) {
    if (res.verdict === 'refuse') renderAttack(q, res);
    else if (res.verdict === 'withheld') renderWithheld(q, res);
    else if (res.verdict === 'hello') renderHello();
    else if (res.verdict === 'allow' && res.parts && res.parts.some(function (x) { return x.answer; })) renderReply(res);
    else renderNone();
  }

  var seq = 0;
  function handle(q) {
    q = (q || '').trim();
    if (!q) return;
    unmark();
    var my = ++seq;
    form.classList.add('is-asking');
    askServer(q).catch(function () { return askLocal(q); }).then(function (res) {
      form.classList.remove('is-asking');
      if (my !== seq) return; // a newer question has been asked
      form.setAttribute('data-answered-by', res.where);
      render(q, res);
    });
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); handle(input.value); });
  input.addEventListener('focus', function () { loadIndex(); form.classList.add('is-awake'); }, { once: false });
  form.querySelectorAll('[data-try]').forEach(function (b) {
    b.addEventListener('click', function () { input.value = b.getAttribute('data-try'); handle(input.value); input.focus({ preventScroll: true }); });
  });
  box.addEventListener('click', function (e) {
    var tr = e.target.closest('[data-try]');
    if (tr) { input.value = tr.getAttribute('data-try'); handle(input.value); return; }
    var ms = e.target.closest('.more-s');
    if (ms) { var r = document.getElementById('rest'); if (!r) return; var o = !r.classList.contains('open'); r.classList.toggle('open', o); ms.setAttribute('aria-expanded', String(o)); ms.textContent = o ? 'fewer' : ms.dataset.l; setTimeout(relayout, 480); return; }
    var rb = e.target.closest('.rulebtn');
    if (rb) { var ru = document.getElementById('rule'); var op = !ru.classList.contains('open'); ru.classList.toggle('open', op); rb.setAttribute('aria-expanded', String(op)); rb.textContent = op ? 'hide the rule' : 'view the rule'; setTimeout(relayout, 480); return; }
    var d = e.target.closest('a.dest'); if (!d) return;
    var url = new URL(d.href, location.href);
    if (url.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '') && url.hash) {
      var id = url.hash.split(':~:')[0].slice(1), el = document.getElementById(id);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); if (window.site) window.site.flash(el); }
    }
  });
  window.__probe = handle;
})();
