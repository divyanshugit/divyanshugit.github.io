// "InterrogateLLM" — ask for the question back.
// Left: the loop — a question q, the model's answer a, five questions
// reconstructed from a, each embedded (SBERT) and compared with q.
// Right: the comparison in embedding space, drawn as unit vectors whose
// angle to q is arccos(cosine similarity). A grounded answer brings the
// questions back close to q; a made-up one scatters them. The mean
// cosine is computed from the angles drawn; the shaded cone is the
// threshold τ = 0.8 (half-angle arccos 0.8 ≈ 36.9°).
const TAU = 0.8;
const GROUNDED = [-9, 4, 12, -5, 7];        // degrees from q
const MADE_UP = [41, -55, 18, -33, 64];

const meanCos = (a) => a.reduce((s, d) => s + Math.cos((d * Math.PI) / 180), 0) / a.length;

module.exports = {
  slug: "interrogate",
  title: "Reconstructed questions, close and scattered",
  desc: "Left: a question q gets an answer a, and the model is asked five times to reconstruct the question from the answer. Right: each reconstruction as a vector compared with q. For a grounded answer the five lie close to q, mean cosine similarity 0.99, inside the threshold cone of 0.8. For a hallucinated answer they scatter, mean cosine 0.71, below the threshold, so the answer is flagged.",
  caption: "InterrogateLLM asks the model to rebuild the question from its own answer, five times. Rebuilt questions that stay close to the original (cosine ≥ τ) suggest a grounded answer; scattered ones flag a hallucination.",
  draw(k) {
    const { t, p, ln, arrow, line, r1 } = k;
    let s = "";
    const rad = (d) => (d * Math.PI) / 180;

    // ---- left: the loop ----
    const LX = 70;
    s += t(LX, 92, "q", "mi");
    s += t(LX + 28, 92, "the question", "l x");
    s += arrow(LX + 6, 108, LX + 6, 158, "s3");
    s += t(LX, 192, "a", "m");
    s += t(LX + 28, 192, "the answer", "l x");
    s += arrow(LX + 6, 208, LX + 6, 258, "s3");
    s += t(LX + 24, 238, "ask for the question back, ×5", "l x");
    [0, 1, 2, 3, 4].forEach((i) => { s += t(LX + i * 40, 292, "q̂", "m"); });
    s += arrow(LX + 6, 308, LX + 6, 358, "s3");
    s += t(LX + 24, 338, "embed each, compare", "l x");
    s += t(LX, 392, "cos(q, q̂) ≥ τ ?", "m");

    // ---- right: two fans ----
    const fan = (cx, cy, R, offs, label, flag) => {
      let g = "";
      const half = Math.acos(TAU);
      // the threshold cone around q (pointing straight up)
      const a0 = -Math.PI / 2 - half, a1 = -Math.PI / 2 + half;
      g += `<path d="M${cx},${cy} L${r1(cx + R * Math.cos(a0))},${r1(cy + R * Math.sin(a0))} A${R},${R} 0 0 1 ${r1(cx + R * Math.cos(a1))},${r1(cy + R * Math.sin(a1))} Z" class="w"/>`;
      const arc = []; for (let d = -80; d <= 80; d += 2) arc.push([cx + R * Math.sin(rad(d)), cy - R * Math.cos(rad(d))]);
      g += p(line(arc), "hf");
      offs.forEach((d) => {
        const inside = Math.cos(rad(d)) >= TAU;
        g += ln(cx, cy, cx + R * Math.sin(rad(d)), cy - R * Math.cos(rad(d)), inside ? "s2" : "s2 d");
      });
      g += `<g class="reveal">` + ln(cx, cy, cx, cy - R - 16, "ik") + `</g>`;
      g += t(cx, cy - R - 26, "q", "mi", "middle");
      g += ln(cx - R - 10, cy, cx + R + 10, cy, "hf");
      g += t(cx, cy + 36, label, "l", "middle");
      g += t(cx, cy + 66, "mean cos " + meanCos(offs).toFixed(2), flag ? "ni" : "n", "middle");
      return g;
    };
    s += fan(560, 390, 168, GROUNDED, "grounded", false);
    s += fan(880, 390, 168, MADE_UP, "made up · flagged", true);
    // name the threshold on the grounded fan's cone edge
    const hs = Math.sin(Math.acos(TAU)), hc = TAU;
    s += t(560 + 168 * hs + 10, 390 - 168 * hc - 8, "τ = 0.8", "n x");
    return s;
  }
};
