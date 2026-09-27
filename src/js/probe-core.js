/* probe-core.js — the "Ask this site" guardrail, without the DOM.

   One file, two homes:
   - the browser loads it before probe.js (window.ProbeCore) and uses it as the
     OFFLINE FALLBACK when /api/ask is unreachable;
   - the Vercel function (api/ask.mjs) requires it and adds the parts a browser
     cannot have: embeddings, the private attack bank, hybrid retrieval and the
     output check.

   Pipeline (both sides): normalize → rules → split → answer each part.
   Everything here is deterministic and grounded: replies quote the site-wide
   index (/search-index.json) or compose from its profile entry. Nothing is
   generated. See DESIGN.md § 7 and docs/guardrail.md. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ProbeCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PAPERS = {
    agentic: { t: 'Black-Box Red Teaming of Agentic AI', v: 'LaMAS @ AAAI 2026', u: 'https://openreview.net/pdf?id=ZLzc8coumq' },
    sagert: { t: 'SAGE-RT', v: 'NeurIPS 2024, Red Teaming GenAI', u: 'https://openreview.net/forum?id=ftHy6rA8LL' },
    beyond: { t: 'Beyond Text: Multimodal Jailbreaking', v: 'NeurIPS 2025, Reliable ML', u: 'https://openreview.net/forum?id=NaibehcKG8' },
    nfl: { t: 'No Free Lunch with Guardrails', v: 'arXiv 2025', u: 'https://arxiv.org/abs/2504.00441' },
    cbrn: { t: 'Quantifying CBRN Risk in Frontier Models', v: 'NeurIPS 2025, Reliable ML', u: '/publications.html#cbrnllm' },
    bias: { t: 'Implicit Bias in 50+ LLMs', v: 'NeurIPS 2024, Safe GenAI', u: 'https://openreview.net/forum?id=tYDn5pGs5P' },
    politics: { t: 'Beyond Western Politics', v: 'NeurIPS 2025, LLM Evaluation', u: '/publications.html#partisanbias' },
    socio: { t: 'SocioEval', v: 'AIGOV @ AAAI 2026', u: 'https://openreview.net/pdf?id=qu5WtftyAQ' },
    quant: { t: 'Increased LLM Vulnerabilities from Fine-tuning and Quantization', v: 'arXiv 2024', u: 'https://arxiv.org/abs/2404.04392' },
    dp: { t: 'Inception of Differential Privacy', v: 'four posts, 2025', u: '/blog/differential-privacy-but-why.html' }
  };

  /* ---------- attack families (shared by the rules and the semantic layer) ----------
     The attack bank (data/attack-bank/, server-only) tags each prompt with one of
     these ids; the rules below use the same ids where a regex exists.            */
  var FAMILIES = {
    cbrn: { fam: 'Hazardous capability request', pol: '3.1', paper: 'cbrn' },
    delimiter: { fam: 'Delimiter injection', pol: '1.3', paper: 'agentic' },
    override: { fam: 'Instruction override', pol: '1.1', paper: 'agentic' },
    extract: { fam: 'System-prompt extraction', pol: '1.2', paper: 'nfl' },
    obfuscation: { fam: 'Obfuscation', pol: '1.4', paper: 'beyond' },
    splitting: { fam: 'Payload splitting', pol: '1.5', paper: 'beyond' },
    manyshot: { fam: 'Many-shot priming', pol: '1.6', paper: 'sagert' },
    suppression: { fam: 'Refusal suppression', pol: '1.7', paper: 'nfl' },
    persona: { fam: 'Persona / role-play', pol: '2.1', paper: 'sagert' },
    fiction: { fam: 'Fictional framing', pol: '2.2', paper: 'sagert' },
    pii: { fam: 'Personal data extraction', pol: '4.2', paper: 'dp' },
    divergence: { fam: 'Training-data extraction', pol: '4.3', paper: 'dp' },
    bias: { fam: 'Bias elicitation', pol: '5.1', paper: 'bias' },
    politics: { fam: 'Partisan elicitation', pol: '5.2', paper: 'politics' },
    authority: { fam: 'Authority impersonation', pol: '6.1', paper: 'agentic' },
    insult: { fam: 'Unwanted output', pol: '7.1', paper: 'sagert' }
  };

  var ATTACKS = [
    { id: 'cbrn',
      re: /\b(bomb|explosive|detonat|nerve\s*agent|sarin|vx\s*gas|anthrax|ricin|bioweapon|pathogen\s*enhance|enrich\s*uranium|chemical\s*weapon|make\s*meth|napalm|thermite|synthesi[sz]e\s*(a\s*)?(toxin|nerve|poison))/i,
      dry: 'No. He has a paper measuring how often models say yes to this.' },
    { id: 'delimiter',
      re: /(<\|?(im_start|im_end|system|endoftext)\|?>|\[\/?INST\]|<\/?s>|<\/?system>|^\s*#{2,}\s*(system|instruction)|BEGIN SYSTEM)/i,
      dry: 'Nice tokens. This page splits on spaces.' },
    { id: 'override',
      re: /\b(ignore|disregard|forget|override|bypass|skip)\b[\s\S]{0,40}\b(previous|prior|above|earlier|all|your|the|any)\b[\s\S]{0,24}\b(instructions?|prompts?|rules?|guidelines?|polic(y|ies)|directives?|context)\b/i,
      dry: 'The instructions above were written by the author. They are staying.' },
    { id: 'extract',
      re: /\b(system\s*prompt|initial\s*prompt|hidden\s*(prompt|instructions?)|your\s*(instructions|prompt|rules|config)|what\s*were\s*you\s*told|repeat\s*(the\s*)?(text|words)\s*above|print\s*(your\s*)?(prompt|instructions)|reveal\s*(your\s*)?(prompt|instructions|rules))\b/i,
      dry: 'There is no system prompt. There are some regular expressions, and you are reading their output. View source; they are all there.' },
    { id: 'persona',
      re: /\b(DAN|do\s*anything\s*now|developer\s*mode|jailbr(oken|eak\s*mode)|you\s*are\s*now|from\s*now\s*on\s*you|pretend\s*(to\s*be|you\s*are)|act\s*as\s*(an?\s*)?(unfiltered|evil|uncensored|different|another|my)|role-?play|stay\s*in\s*character|evil\s*(twin|mode)|AIM\b|no\s*restrictions)\b/i,
      dry: 'This page has one persona. It is the one in the title.' },
    { id: 'fiction',
      re: /\b(grandm(a|other)|hypothetical(ly)?|for\s*a\s*(novel|story|screenplay|movie)|in\s*a\s*fictional|imagine\s*a\s*world|purely\s*academic|for\s*research\s*purposes\s*only)\b/i,
      dry: 'Grandmothers are a well-documented attack surface.' },
    { id: 'pii',
      re: /\b(phone\s*(number)?|mobile\s*number|home\s*address|where\s*(does\s*he|do\s*you)\s*live\s*exactly|password|passport|aadhaar|ssn|social\s*security|bank\s*(account|details)|salary|date\s*of\s*birth|credit\s*card)\b/i,
      dry: 'Redacted. The only personal data on offer is the email address, and it is one click away, under the envelope.' },
    { id: 'bias',
      re: /\b(which|what)\s+(religion|caste|race|nationality|country|gender|state|class)\b[\s\S]{0,40}\b(better|best|smarter|superior|worse|worst|inferior|lazier)\b|\b(are|is)\s+(women|men|indians|muslims|hindus|christians|poor\s*people)\s+(better|smarter|worse|lazy|inferior)/i,
      dry: 'Declined. Measured across more than fifty models; not repeated here.' },
    { id: 'politics',
      re: /\b(who\s*should\s*i\s*vote|which\s*party|left\s*or\s*right|bjp|congress\s*party|democrat|republican|trump|modi|your\s*political)\b/i,
      dry: 'He studies which side models lean to. This page is not taking one.' },
    { id: 'authority',
      re: /\b(i\s*am\s*(divyanshu|the\s*(admin|author|owner|developer))|i'?m\s*(divyanshu|the\s*(admin|author|owner|developer))|as\s*(your|the)\s*(admin|developer|creator)|admin\s*override|sudo|authori[sz]ed\s*(to|user)|security\s*team)\b/i,
      dry: 'Claims of authority are not authentication.' },
    { id: 'divergence',
      re: /\b(repeat\s*(the\s*word\s*)?\S+\s*forever|(your|the\s*model'?s?)\s*training\s*data|(leak|dump|reveal|extract|print|output|show)\w*\s[\s\S]{0,24}training\s*data|memori[sz]ed\s*(text|data|examples)|what\s*did\s*you\s*train\s*on|regurgitate)\b/i,
      dry: 'There is no training data to leak. There are footnotes.' },
    { id: 'insult',
      re: /\b(say\s*something\s*(rude|mean|offensive|bad)|insult|swear|curse\s*word|be\s*rude|roast)\b/i,
      dry: 'The rudest thing on this page is a shell bug from September.' }
  ];
  ATTACKS.forEach(function (a) { var f = FAMILIES[a.id]; a.fam = f.fam; a.pol = f.pol; a.paper = f.paper; });

  /* ---------- 1. normalize: make the text say what it means ----------
     Returns the display text plus every "reading" the rules and the embedding
     should see: the folded text, and each decoded payload.                   */
  var ZW = /[­͏ᅟᅠ᠎​-‏‪-‮⁠-⁤⁦-⁩ㅤ﻿]/g;
  // confusables that NFKC leaves alone (Cyrillic and Greek look-alikes)
  var GLYPH = { 'а': 'a', 'в': 'b', 'е': 'e', 'ё': 'e', 'к': 'k', 'м': 'm', 'н': 'h', 'о': 'o', 'р': 'p', 'с': 'c', 'т': 't', 'у': 'y', 'х': 'x', 'і': 'i', 'ї': 'i', 'ј': 'j', 'ѕ': 's', 'ԁ': 'd', 'ɡ': 'g', 'ӏ': 'l', 'һ': 'h', 'ԛ': 'q', 'ԝ': 'w',
    'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'У': 'Y', 'Х': 'X', 'І': 'I', 'Ј': 'J', 'Ѕ': 'S',
    'α': 'a', 'ε': 'e', 'ι': 'i', 'κ': 'k', 'ο': 'o', 'ρ': 'p', 'τ': 't', 'υ': 'u', 'χ': 'x', 'ν': 'v',
    'Α': 'A', 'Β': 'B', 'Ε': 'E', 'Η': 'H', 'Ι': 'I', 'Κ': 'K', 'Μ': 'M', 'Ν': 'N', 'Ο': 'O', 'Ρ': 'P', 'Τ': 'T', 'Υ': 'Y', 'Χ': 'X', 'Ζ': 'Z' };
  var GLYPH_RE = new RegExp('[' + Object.keys(GLYPH).join('') + ']', 'g');
  var PRINTABLE = /^[\x20-\x7E\s]+$/;

  function b64decode(s) {
    try {
      if (typeof atob === 'function') {
        var bin = atob(s), bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { fatal: true }).decode(bytes) : bin;
      }
    } catch (e) { return null; }
    return null;
  }
  function rot13(s) { return s.replace(/[a-z]/gi, function (c) { var b = c <= 'Z' ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - b + 13) % 26 + b); }); }
  function unleet(t) { return t.replace(/4|@/g, 'a').replace(/3/g, 'e').replace(/1|!/g, 'i').replace(/0/g, 'o').replace(/\$|5/g, 's').replace(/7/g, 't'); }

  function normalize(q) {
    var raw = String(q || '');
    var steps = [], readings = [], enc = null, hidden = '';
    // Unicode tag characters (U+E0020–E007E) carry invisible ASCII: decode, never drop
    var t = raw.replace(/[\u{E0000}-\u{E007F}]/gu, function (c) {
      var cp = c.codePointAt(0) - 0xE0000;
      if (cp >= 0x20 && cp <= 0x7E) hidden += String.fromCharCode(cp);
      return '';
    });
    if (hidden) { steps.push('unicode tags'); enc = { how: 'invisible Unicode tags', text: hidden.trim(), hard: true }; }
    var z = t.replace(ZW, '');
    if (z !== t) steps.push('zero-width');
    t = z;
    var n = t.normalize ? t.normalize('NFKC') : t;
    if (n !== t) steps.push('NFKC');
    t = n;
    var g = t.replace(GLYPH_RE, function (c) { return GLYPH[c]; });
    if (g !== t) steps.push('homoglyphs');
    t = g.replace(/\s+/g, ' ').trim();
    var text = t;
    readings.push(t);
    if (hidden) readings.push(hidden.trim());

    // base64: the whole input, or any long token inside it
    var whole = t.replace(/\s+/g, '');
    var b64s = [];
    if (whole.length >= 12 && /^[A-Za-z0-9+/]+=*$/.test(whole) && whole.length % 4 === 0) b64s.push({ s: whole, whole: true });
    (t.match(/[A-Za-z0-9+/]{16,}={0,2}/g) || []).forEach(function (m) { if (m !== whole && m.length % 4 === 0) b64s.push({ s: m }); });
    b64s.forEach(function (b) {
      var d = b64decode(b.s);
      if (d && PRINTABLE.test(d) && /[a-z]{2,}\s+[a-z]{2,}/i.test(d)) {
        readings.push(d.trim());
        if (!enc || (b.whole && !enc.hard)) enc = { how: 'base64', text: d.trim(), hard: !!b.whole };
      }
    });
    // hex
    if (/^(0x)?([0-9a-f]{2}\s?){8,}$/i.test(t)) {
      var h = t.replace(/0x|\s/gi, ''), out = '';
      for (var i = 0; i + 1 < h.length; i += 2) out += String.fromCharCode(parseInt(h.substr(i, 2), 16));
      if (PRINTABLE.test(out)) { readings.push(out); enc = { how: 'hex', text: out, hard: true }; }
    }
    // rot13, when announced
    if (/\brot-?13\b/i.test(t)) {
      var r = rot13(t.replace(/\brot-?13\b:?/i, '').trim());
      readings.push(r); enc = { how: 'rot13', text: r, hard: true };
    }
    // spaced-out letters: "i g n o r e  p r e v i o u s" (runs inside the text too)
    var sp = g.replace(/(?:\b\w\b[ ._-]{1,3}){4,}\b\w\b/g, function (m) {
      // words are separated by a double gap; letters inside a word by a single one
      return ' ' + m.split(/[ ._-]{2,}/).map(function (w) { return w.replace(/[ ._-]/g, ''); }).join(' ') + ' ';
    }).replace(/\s+/g, ' ').trim();
    if (sp !== t) { readings.push(sp); if (!enc) enc = { how: 'spacing', text: sp, soft: true }; }
    // leetspeak
    if (/[4310$7@]/.test(t) && /[a-z]/i.test(t)) {
      var l = unleet(t);
      if (l !== t) { readings.push(l); if (!enc) enc = { how: 'leetspeak', text: l, soft: true }; }
    }
    // split payloads: two or more quoted fragments, joined
    var frags = [], fm, fre = /['"‘“]([^'"’”]{1,60})['"’”]/g;
    while ((fm = fre.exec(t))) frags.push(fm[1]);
    if (frags.length >= 2) {
      readings.push(frags.join(' ').replace(/\s+/g, ' '), frags.join(''));
      steps.push('joined ' + frags.length + ' fragments');
    }
    var seen = {};
    readings = readings.filter(function (x) { x = x.trim(); if (!x || seen[x]) return false; seen[x] = 1; return true; });
    return { raw: raw, text: text, readings: readings, enc: enc, steps: steps };
  }

  /* ---------- 2. rules ---------- */
  function ruleHit(a, s) {
    var m = a.re.exec(s);
    return m ? { index: m.index, text: m[0] } : null;
  }
  /* A definitional question ABOUT an attack ("what is a system prompt?", "what
     are common jailbreak techniques like role-play?") is a topic, not an attack,
     when it is asked in plain text, addresses no "you", and gives no order.
     Only these families; hazardous and personal-data rules never relax. */
  var META_OK = { extract: 1, persona: 1, fiction: 1 };
  function isMeta(s) {
    return /^\s*(what\s+(is|are)\s+(a|an|the|some|common|typical)?\s*\w|what\s+does\s+\S+(\s+\S+)?\s+mean|define|explain\s+(what|how)|how\s+(do|does)\s+[\w\s-]{1,30}\s+work)/i.test(s) &&
      !/\b(you|your|yours|yourself|u|ur)\b/i.test(s) &&
      !/\b(print|reveal|show|repeat|ignore|disregard|pretend|act\s+as|dump|output|tell\s+me\s+the|give\s+me)\b/i.test(s);
  }
  // the regex families, over every reading; the first reading that trips a rule wins
  function rules(norm) {
    for (var r = 0; r < norm.readings.length; r++) {
      var s = norm.readings[r];
      for (var i = 0; i < ATTACKS.length; i++) {
        var m = ruleHit(ATTACKS[i], s);
        if (m && r === 0 && META_OK[ATTACKS[i].id] && isMeta(s)) continue;
        if (m) {
          var decoded = r > 0 ? decodedFor(norm, s) : null;
          return { kind: 'attack', a: ATTACKS[i], matchedOn: s, match: m, enc: decoded };
        }
      }
    }
    // a hard encoding with nothing recognisable inside is still an obfuscation attempt
    if (norm.enc && norm.enc.hard) return { kind: 'attack', a: { id: 'encoding', fam: 'Obfuscation (' + norm.enc.how + ')', pol: '1.4', paper: 'beyond', dry: '' }, enc: norm.enc };
    if (/^\s*(hi|hello|hey|namaste|yo)\b[\s!.?]*$/i.test(norm.text)) return { kind: 'hello' };
    return { kind: 'ground' };
  }
  function decodedFor(norm, s) {
    if (norm.enc && norm.enc.text === s) return norm.enc;
    return { how: /fragments/.test(norm.steps.join(' ')) && s.indexOf(' ') < 0 ? 'joined fragments' : (norm.enc ? norm.enc.how : 'normalised'), text: s };
  }
  function ruleView(a, hit) {
    if (!a.re) return null;
    var f = FAMILIES[a.id] || {};
    return { id: a.id, fam: f.fam || a.fam, pol: a.pol, paper: a.paper, dry: a.dry, source: String(a.re), matchedOn: hit.matchedOn, match: hit.match };
  }

  /* ---------- 3. grounding over the site-wide index ----------
     TOPICS route a question to groups of the index (and to words a good
     answer should contain). Score = topic group +3, topic word +1.5,
     shared content word +1.5 in the quote, +.4 in the keywords (capped).
     The server adds a hybrid-retrieval bonus through opts.boost.          */
  var TOPICS = [
    { q: /\b(paper|papers|publication|publish|neurips|icml|aaai|workshop|citations?|research\s*output)\b/i, g: ['papers'], strong: 1 },
    { q: /\b(quantiz|efficien|inference|smaller|compress|int4|int8|llama\.?cpp|edge|fast)/i, g: ['papers', 'blog', 'about'], w: ['quantiz', 'llama', 'smaller'] },
    { q: /\b(privacy|private|differential|dp-?sgd|\bdp\b|laplace|noise|unlearn|federated)/i, g: ['blog', 'about'], w: ['privacy', 'differential'] },
    { q: /\b(red[-\s]?team|jailbreak|adversarial|attack|vulnerab|guardrail|safety|cbrn|agentic|agents?)/i, g: ['papers', 'blog'], w: ['red team', 'red-team', 'jailbreak', 'guardrail', 'adversarial'] },
    { q: /\b(bias|fair|socioeconomic|partisan|politic)/i, g: ['papers'], w: ['bias'] },
    { q: /\b(graph|frasca|technion|serializ)/i, g: ['papers', 'about'], w: ['graph'] },
    { q: /\b(diffusion|denois)/i, g: ['projects', 'about'], w: ['diffusion'] },
    { q: /\b(right\s*now|currently|at\s*the\s*moment|working\s*on|these\s*days|lately|current)\b/i, g: ['projects', 'about'], w: ['desk', 'diffusion', 'active'] },
    { q: /\b(project|projects|built|build|building|code|repo)\b/i, g: ['projects'], strong: 1 },
    { q: /\b(blog|blogged|writing|write\s*about|written\s*about|wrote\s*about|posts?|essays?|articles?|read)\b/i, g: ['blog'], strong: 1 },
    { q: /\b(lived|live|places|cities|city|travel|journey|moved|photos?|patna|bangalore|kolkata|delhi|singapore|malaysia|philippines|bali)\b/i, g: ['places', 'about'], w: ['lived'] },
    { q: /\b((grew|grow|growing)\s*up|hometown|home\s*town|from\s*where|where\s*(are|is)\s*(you|he|divyanshu)\s*from|originally|berai|sarai|bihar)\b/i, g: ['about', 'places'], w: ['i am from'] },
    { q: /\b(study|studied|degree|college|university|b\.?tech|educat|graduat|narula|iisc)/i, g: ['about', 'timeline'], w: ['studied', 'graduated', 'iisc'] },
    { q: /\b(anaconda|enkrypt|job|employ|role|company|position|where\s*(do|does)\s*(you|he)\s*work)\b/i, g: ['about', 'timeline', 'work'], w: ['anaconda', 'enkrypt'] },
    { q: /\b(worked|work\s*history|experience|career|intern|internships?|interned|companies|employers?|iisc|aicrowd|factmata|highradius|helppr|nimbleedge|envisedge|openmined|pysyft|narula|reviewer|reviewing|mentor)/i, g: ['work'], w: ['intern', 'research'] },
    { q: /\b(news|timeline|recent|recently|latest|milestones?|history|when\s*did)\b/i, g: ['timeline'], strong: 1 },
    { q: /\b(contact|email|e-mail|reach|talk|mail|hire|collaborat|cv|resume|résumé|linkedin|github|twitter|scholar)\b/i, g: ['contact'], strong: 1 },
    { q: /\b(who\s*(are|is)|about\s*(you|him)|introduce|what\s*(do|does)\s*(you|he)\s*do|research\s*(area|interest)|field|bio)\b/i, g: ['about', 'home'], w: ['engineer', 'stack'] }
  ];
  var STOP = ' the and for are you your his him with what where when which who how does did was were have has had this that from into about page site tell me please can could would should any some there their them they its our out also just than then very more most much many been being will shall an of to in on at by it is as or be do a i my we he she divyanshu kumar written wrote write work worked paper papers post posts anything something know happened happening recently recent latest news '.split(' ').reduce(function (o, w) { if (w) o[w] = 1; return o; }, {});
  function stem(w) { return w.replace(/(ing|ed|es|s)$/, ''); }
  function words(t) { return (String(t || '').toLowerCase().replace(/-/g, ' ').match(/[a-z0-9][a-z0-9.+]*[a-z0-9]|[a-z0-9]/g) || []).filter(function (w) { return w.length > 2 && !STOP[w]; }).map(stem); }

  function prepareIndex(json) {
    return (json || []).map(function (e, i) {
      e.i = i; e.tw = words(e.t); e.kw = words(e.k); e.low = (e.t + ' ' + (e.k || '')).toLowerCase();
      var m = /plate [ivxl]+, (.+)$/i.exec(e.s || ''); if (m) e.pn = stem(m[1].toLowerCase().replace(/^the /, ''));
      return e;
    });
  }
  function ground(index, q, opts) {
    var boost = opts && opts.boost;
    var qw = words(q), topics = TOPICS.filter(function (t) { return t.q.test(q); });
    var groups = {}, strong = {}; topics.forEach(function (t) { t.g.forEach(function (g) { groups[g] = 1; if (t.strong) strong[g] = 1; }); });
    // words that say what the question is about, beyond "papers" or "blog"
    var subject = qw.length > 0 || topics.some(function (t) { return t.w; });
    var scored = index.filter(function (e) { return e.g !== 'profile'; }).map(function (e) {
      var score = 0, kwHits = 0, hit = 0;
      if (groups[e.g]) score += 3;
      if (strong[e.g]) score += 3;
      topics.forEach(function (t) { (t.w || []).forEach(function (w) { if (e.low.indexOf(w) > -1) { score += 1.5; hit++; } }); });
      qw.forEach(function (w) { if (e.tw.indexOf(w) > -1) { score += 1.5; hit++; } else if (e.kw && e.kw.indexOf(w) > -1 && kwHits < 3) { score += .4; kwHits++; hit++; } });
      // a named place outranks the generic journey sentence: its own plate wins
      if (e.g === 'places' && e.pn && qw.indexOf(e.pn) > -1) score += 5;
      // hybrid retrieval (server): BM25 + cosine, fused by reciprocal rank
      if (boost) { var b = boost(e); if (b) { score += b.bonus; if (b.hit) hit++; } }
      // "papers on privacy" must be about privacy, not merely a paper
      if (subject && !hit) score = 0;
      return { e: e, score: score };
    }).filter(function (x) { return x.score >= 3; });
    if (!scored.length) return null;
    scored.sort(function (a, b) { return b.score - a.score; });
    var picked = [], seen = {};
    for (var i = 0; i < scored.length && picked.length < 3; i++) {
      var x = scored[i], key = x.e.u.split(':~:')[0];
      if (seen[key]) continue;
      if (picked.length && x.score < Math.max(3, scored[0].score * 0.55)) break;
      seen[key] = 1; picked.push(x.e);
    }
    // asked for a kind of thing ("papers") that has no match: say so, then offer the closest
    var wanted = Object.keys(strong), missed = wanted.length && !picked.some(function (e) { return strong[e.g]; }) ? wanted[0] : null;
    return { best: picked[0], more: picked.slice(1), all: picked, missed: missed, wanted: missed ? null : wanted[0], top: scored[0].score };
  }

  /* ---------- identity questions, composed from the profile entry ---------- */
  var INTENTS = [
    { id: 'contact', re: /\b(contact|reach\s*(out|him|you)?|get\s*in\s*touch|e-?mail|write\s*to\s*(him|you)|talk\s*to\s*(him|you)|connect\s*with)\b/i },
    { id: 'at', re: /\b(do|did|does|doing|work|worked|working|role|job|time|intern|interned|position|was|at|with|for)\b/i, need: function (q, p) { return !!orgIn(q, p); } },
    { id: 'intern', re: /\b(intern|interned|interning|internships?)\b/i },
    { id: 'worked', re: /\bwhere\s*(has|have|had|did)\s*(he|you|divyanshu)\s*(worked|work)\b|\bwork(ed)?\s*(history|experience)\b|\b(past|previous|former|other)\s*(jobs?|roles?|employers?|companies|work)\b|\b(which|what)\s*companies\b|\bemployers?\b|\bcareer\b|\bworked\s*(at|for)\b|\bwhere\s*else\b/i },
    { id: 'avail', re: /\b(hiring|hire\s*(him|you)|is\s*(he|she)\s*hir|available|availability|open\s*to\s*(work|offers|roles?|opportunit|new)|looking\s*for\s*(a\s*)?(job|role|work|position)|freelanc|consult)/i },
    { id: 'skills', re: /\b(what\s*can\s*(he|you|divyanshu)\s*do|skills?|skill\s*set|capabilit|expertise|good\s*at|strengths?|speciali[sz])/i },
    { id: 'workon', re: /\b(work(s|ing)?\s*on|research\s*(focus|interests?|areas?)|focus(es|ed)?\s*on|interested\s*in|what\s*(is|are)\s*(his|your)\s*(research|focus|interests?))\b/i },
    { id: 'does', re: /\bwhat\s*(do|does)\s*(you|he|divyanshu)\s*do\b|\b(his|your)\s*(job|role|position)\b|\bwhat'?s\s*(his|your)\s*(job|role)\b|\bwhere\s*(do|does)\s*(you|he|divyanshu)\s*work\b/i },
    { id: 'who', re: /\b(who\s*(is|are|'?s)\s*(he|you|divyanshu|kumar|the\s*author|this)|who\s*r\s*u|about\s*(you|him|divyanshu)|introduce\s*(yourself|him)|tell\s*me\s*about\s*(yourself|him|divyanshu)|\bbio\b)/i }
  ];
  function intentOf(q, p) { for (var i = 0; i < INTENTS.length; i++) if (INTENTS[i].re.test(q) && (!INTENTS[i].need || INTENTS[i].need(q, p))) return INTENTS[i].id; return null; }
  function orgIn(q, p) {
    var low = ' ' + String(q).toLowerCase().replace(/[^a-z0-9.]+/g, ' ') + ' ';
    return ((p && p.work) || []).filter(function (e) { return e.alias.some(function (a) { return low.indexOf(' ' + a + ' ') > -1; }); })[0] || null;
  }
  function workLine(e) { return e.role + (e.place ? ', ' + e.place : '') + ', ' + e.dates; }
  function profileOf(index) { var e = (index || []).filter(function (x) { return x.g === 'profile'; })[0]; return e && e.p; }
  function list(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function an(w) { return (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function link(u, t) { return '<a href="' + esc(u) + '">' + esc(t) + '</a>'; }
  function mailLink(t, email) { return '<a href="/about.html#contact" data-email="' + esc(email) + '">' + esc(t) + '</a>'; }
  function src(x) { return { u: x.u, s: x.s }; }
  function compose(id, p, q) {
    var focus = p.focus.t + (p.focus.areas.length ? ' (' + p.focus.areas.join(', ') + ')' : '');
    if (id === 'who') return {
      html: '<p>' + esc(p.name) + ' is ' + esc(an(p.role.t)) + '.' +
        (p.previous.length ? ' Before that he was ' + esc(list(p.previous.map(function (x) { return x.t; }))) + '.' : '') +
        ' His research is on ' + esc(focus) + '.</p>',
      src: [src(p.role)].concat(p.previous.map(src), [src(p.focus)])
    };
    if (id === 'does') return {
      html: '<p>He is ' + esc(an(p.role.t)) + ', working on ' + esc(focus) + '.</p>',
      src: [src(p.role), src(p.focus)]
    };
    if (id === 'skills') return {
      html: '<p>What the site shows he can do:</p><ul class="caps">' + p.capabilities.map(function (c) {
        return '<li><b>' + esc(c.label) + '</b>: ' + esc(c.t) + '. <span class="cite">' + c.cites.map(function (x) { return '<a href="' + esc(x.u) + '"><cite>' + esc(x.t) + '</cite></a>'; }).join(', ') + '</span></li>';
      }).join('') + '</ul>',
      src: p.capabilities.map(src)
    };
    if (id === 'workon') return {
      html: '<p>His research is on ' + esc(focus) + '.' + (p.now.length ? ' On his desk now:' : '') + '</p>' +
        (p.now.length ? '<ul>' + p.now.map(function (n) { return '<li>' + esc(n.t) + '</li>'; }).join('') + '</ul>' : ''),
      src: [src(p.focus)].concat(p.now.map(src))
    };
    if (id === 'at') {
      var w = orgIn(q, p);
      return {
        html: '<p>At ' + (/^Indian /.test(w.org) ? 'the ' : '') + link(w.u, w.org) + ': ' + esc(workLine(w)) + '.</p>' + (w.lines.length ? '<ul>' + w.lines.map(function (l) { return '<li><q>' + esc(l) + '</q></li>'; }).join('') + '</ul>' : ''),
        src: [src(w)], quoted: 1
      };
    }
    if (id === 'intern' || id === 'worked') {
      var jobs = p.work.filter(function (e) { return id === 'intern' ? e.intern : (e.kind === 'work' || e.kind === 'research'); })
        .sort(function (a, b) { return a.start < b.start ? 1 : -1; });
      var rest = id === 'worked' ? p.work.filter(function (e) { return e.kind === 'open-source' || e.kind === 'education'; }) : [];
      var NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
      return {
        html: '<p>' + (id === 'intern' ? 'Yes, ' + (NUM[jobs.length] || jobs.length) + ' internships, newest first:' : 'Where he has worked, newest first:') + '</p><ul class="caps">' +
          jobs.map(function (e) { return '<li><b>' + link(e.u, e.org) + '</b>: ' + esc(workLine(e)) + '.' + (id === 'intern' && e.lines[0] ? ' <q>' + esc(e.lines[0]) + '</q>' : '') + '</li>'; }).join('') + '</ul>' +
          (rest.length ? '<p>Also: ' + list([].concat(
            rest.some(function (e) { return e.kind === 'open-source'; }) ? ['open source at ' + list(rest.filter(function (e) { return e.kind === 'open-source'; }).map(function (e) { return link(e.u, e.org); }))] : [],
            rest.filter(function (e) { return e.kind === 'education'; }).map(function (e) { return 'a ' + esc(e.role.split(',')[0]) + ' from ' + link(e.u, e.org); }))).replace(/ and a /, ', and a ') + '.</p>' : ''),
        src: jobs.concat(rest).map(src), quoted: id === 'intern' ? 1 : 0
      };
    }
    var c = p.contact, links = c.links.filter(function (l) { return !/cv/i.test(l.t); }), cv = c.links.filter(function (l) { return /cv/i.test(l.t); })[0];
    var elsewhere = (links.length ? ' He is also on ' + list(links.map(function (l) { return link(l.u, l.t); })) + '.' : '') + (cv ? ' His ' + link(cv.u, 'CV') + ' is a PDF.' : '');
    var mailSrc = { u: 'email:', s: 'Email · write to me' };
    if (id === 'contact') return {
      html: '<p>By email, at ' + mailLink(c.email, c.email) + '; the envelope under the bio opens it.' + elsewhere + '</p>',
      src: [mailSrc].concat(cv ? [{ u: cv.u, s: 'CV · PDF' }] : [])
    };
    return {
      html: '<p>The site doesn’t say whether he is looking for a new role; he is ' + esc(an(p.role.t)) + '. It does say: <q>' + esc(c.invite.t) + '</q> ' + mailLink('Email him', c.email) + '.</p>',
      src: [src(p.role), mailSrc].concat(cv ? [{ u: cv.u, s: 'CV · PDF' }] : [])
    };
  }

  /* ---------- a sub-question from the index ---------- */
  var ITEMS = { papers: 1, projects: 1, blog: 1, timeline: 1 };
  var PLURAL = { papers: 'papers', projects: 'projects', blog: 'posts', timeline: 'timeline items' };
  function groundBlock(index, q, opts) {
    var g = ground(index, q, opts);
    if (!g) return null;
    var html, items = g.all.filter(function (e) { return g.wanted ? e.g === g.wanted : ITEMS[e.g]; });
    var lead = g.missed ? '<p class="miss">No ' + esc(PLURAL[g.missed] || g.missed) + ' on the site match that. The closest:</p>' : '';
    if ((ITEMS[g.best.g] && items.length > 1) || (g.missed && items.length)) {
      html = lead + '<ul>' + items.map(function (e) { return '<li>' + esc(e.t) + '</li>'; }).join('') + '</ul>';
      return { html: html, src: items.map(src), quoted: 1, route: 'group:' + items[0].g };
    }
    var same = g.more.filter(function (e) { return e.g === g.best.g && !ITEMS[e.g]; }).slice(0, 1);
    html = lead + '<p><q>' + esc(g.best.t) + '</q>' + same.map(function (e) { return ' <q>' + esc(e.t) + '</q>'; }).join('') + '</p>';
    return { html: html, src: g.all.map(src), quoted: 1, route: 'group:' + g.best.g };
  }

  /* "Who is Divyanshu? and what can he do?" -> two questions, answered in order */
  function splitQ(q) {
    var out = [];
    String(q).split(/[?\n]+/).forEach(function (part) {
      part.split(/\s*[,;]?\s+(?:and|also)\s+(?=(?:what|who|where|when|why|how|which|is|are|does|do|did|can|could|has|have|any|tell)\b)/i).forEach(function (x) {
        x = x.replace(/^\s*(and|also|so|then|plus)\b[\s,]*/i, '').trim();
        if (x.replace(/[^a-z0-9]/gi, '').length > 1) out.push(x);
      });
    });
    return out.slice(0, 3);
  }

  /* ---------- the whole pipeline, rules-only (the offline fallback) ----------
     Returns the same JSON shape as POST /api/ask, so one renderer serves both:
     { verdict: allow | refuse | decline | hello, parts, rule?, attack?, enc?, via }  */
  function answerParts(index, q, opts) {
    var p = profileOf(index);
    return splitQ(q).map(function (sub) {
      var id = p && intentOf(sub, p);
      var b = id ? compose(id, p, sub) : groundBlock(index, sub, opts);
      return { q: sub, answer: b ? b.html : null, sources: b ? b.src : [], quoted: b ? !!b.quoted : false, route: id ? 'intent:' + id : (b ? b.route : 'none') };
    });
  }
  function refusalOf(hit) {
    var out = { verdict: 'refuse', parts: [] };
    if (hit.a.re) out.rule = ruleView(hit.a, hit);
    else out.rule = { id: hit.a.id, fam: hit.a.fam, pol: hit.a.pol, paper: hit.a.paper, dry: '' };
    if (hit.enc) out.enc = { how: hit.enc.how, text: String(hit.enc.text).slice(0, 200) };
    return out;
  }
  function run(index, q) {
    var norm = normalize(q);
    var hit = rules(norm);
    if (hit.kind === 'attack') return Object.assign(refusalOf(hit), { via: 'rules' });
    if (hit.kind === 'hello') return { verdict: 'hello', parts: [], via: 'rules' };
    var parts = answerParts(index, norm.text);
    return { verdict: parts.some(function (x) { return x.answer; }) ? 'allow' : 'decline', parts: parts, via: 'rules' };
  }

  return {
    PAPERS: PAPERS, FAMILIES: FAMILIES, ATTACKS: ATTACKS, TOPICS: TOPICS, INTENTS: INTENTS,
    normalize: normalize, rules: rules, isMeta: isMeta, refusalOf: refusalOf, ruleView: ruleView,
    words: words, prepareIndex: prepareIndex, ground: ground, groundBlock: groundBlock,
    intentOf: intentOf, compose: compose, profileOf: profileOf, splitQ: splitQ,
    answerParts: answerParts, run: run, esc: esc, rot13: rot13
  };
});
