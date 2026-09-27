// "How Vulnerable Are Multimodal AI Models…" — the cross-modal transfer gap.
// One harmful request, three channels, and the post's headline attack
// success rates on CBRN prompts: text 0% (the refusal baseline), image
// 89% (FigStep-Pro on Llama-4), audio 75% (Wave-Echo on Gemini-2.5-Flash).
// The waveform is a computed signal: a syllabic envelope times a carrier,
// plus the echo — a delayed, attenuated copy, which is the whole attack.
module.exports = {
  slug: "multimodal",
  title: "One request, three channels",
  desc: "The same request as text, as a typographic image split into numbered panels, and as speech with an echo added. Below each, the attack success rate on CBRN prompts from the post: 0% as text, 89% as an image (FigStep-Pro on Llama-4), 75% as audio (Wave-Echo on Gemini-2.5-Flash).",
  caption: "The same request, three ways. Refused as text (0% attack success), it gets through 89% of the time as a typographic image (FigStep-Pro, Llama-4) and 75% as speech with an echo (Wave-Echo, Gemini-2.5-Flash). CBRN prompts, from the study.",
  draw(k) {
    const { t, p, ln, rect, line, r1 } = k;
    let s = "";
    const COLS = [{ x: 60, name: "text", rate: 0 }, { x: 420, name: "image", rate: 0.89, note: "FigStep-Pro" }, { x: 780, name: "audio", rate: 0.75, note: "Wave-Echo" }];
    const CW = 260, TOP = 86, BOX = 200;

    // the three renderings
    // text: lines of a sentence
    const tl = [236, 250, 180, 244, 120];
    tl.forEach((w, i) => { s += ln(COLS[0].x, TOP + 30 + i * 34, COLS[0].x + w, TOP + 30 + i * 34, "s2"); });
    // image: a framed image of a numbered list with empty items (FigStep's form)
    const ix = COLS[1].x;
    s += rect(ix, TOP, CW, BOX - 14, "fp2 h");
    [0, 1, 2].forEach((i) => {
      const y = TOP + 44 + i * 50;
      s += t(ix + 24, y + 7, (i + 1) + ".", "n");
      s += ln(ix + 54, y, ix + 54 + [150, 118, 170][i], y, "s3 dt");
    });
    s += ln(ix + 24, TOP + 22, ix + 180, TOP + 22, "s2");
    // audio: syllables × carrier, plus an echo (delay 0.09, gain 0.55)
    const ax = COLS[2].x, mid = TOP + (BOX - 14) / 2, A = 78;
    const env = (u) => { let e = 0; [[0.1, 0.06], [0.24, 0.08], [0.42, 0.05], [0.56, 0.09], [0.75, 0.06]].forEach(([c, w]) => { e += Math.exp(-0.5 * ((u - c) / w) ** 2); }); return Math.min(1, e); };
    const dry = (u) => (u < 0 ? 0 : env(u) * Math.sin(2 * Math.PI * 38 * u));
    const wet = (u) => dry(u) + 0.55 * dry(u - 0.09);
    const wave = (f) => { const a = []; for (let i = 0; i <= 900; i++) { const u = i / 900; a.push([ax + CW * u, mid - A * 0.62 * f(u)]); } return line(a); };
    s += ln(ax, mid, ax + CW, mid, "hf");
    s += p(wave(wet), "s2");

    // labels and rates
    const RY = 350, RW = CW;
    COLS.forEach((c) => {
      s += t(c.x, 52, c.name, "l");
      if (c.note) s += t(c.x + CW, 52, c.note, "n x", "end");
      s += ln(c.x, RY, c.x + RW, RY, "h");
      [0, 0.5, 1].forEach((v) => { s += ln(c.x + RW * v, RY, c.x + RW * v, RY + 6, "h"); });
      if (c.rate > 0) s += `<g class="reveal">` + rect(c.x, RY - 16, RW * c.rate, 16, "fi") + `</g>`;
      else s += ln(c.x, RY - 16, c.x, RY, "ik");
      s += t(c.x, RY + 56, Math.round(c.rate * 100) + "%", c.rate ? "mi" : "m");
      s += t(c.x + 62, RY + 52, "attack success", "l x");
    });
    s += t(COLS[0].x + 14, RY - 3, "refused", "n x");
    return s;
  }
};
