// "Causal Evaluation of Language Models" — causal_score = accuracy ×
// mechanism_fidelity, as a plane. Contours are the hyperbolas
// accuracy · fidelity = c (c = 0.2 … 0.8). Two models tie at accuracy 0.80:
// one reasons (fidelity 0.90 → score 0.72), one pattern-matches (fidelity
// 0.30 → score 0.24). A leaderboard sees only the x coordinate.
// The two models are illustrative, the contours exact.
const ACC = 0.8, A = 0.9, B = 0.3;

module.exports = {
  slug: "causal-score",
  title: "Same accuracy, different mechanism",
  desc: "A plane with accuracy on the x axis and mechanism fidelity on the y axis, with contour curves where accuracy times fidelity equals 0.2, 0.4, 0.6 and 0.8. Two models sit at the same accuracy, 0.80: one with fidelity 0.90 (causal score 0.72), one with fidelity 0.30 (causal score 0.24). Beside it, their accuracy bars are equal while their causal-score bars differ. Illustrative models.",
  caption: "Two models tie at 0.80 accuracy; the one that reasons (fidelity 0.90) scores 0.72, the one that pattern-matches (fidelity 0.30) scores 0.24. Causal score = accuracy × mechanism fidelity; contours at 0.2–0.8. Illustrative models.",
  draw(k) {
    const { t, p, ln, circ, rect, line, sample, scale } = k;
    let s = "";
    const x = scale(0, 1, 110, 590), y = scale(0, 1, 440, 60);

    // axes
    s += ln(x(0), y(0), x(1), y(0), "h") + ln(x(0), y(0), x(0), y(1), "h");
    [0, 0.5, 1].forEach((v) => {
      s += ln(x(v), y(0), x(v), y(0) + 6, "h") + t(x(v), y(0) + 28, v.toFixed(1), "n x", "middle");
      s += ln(x(0) - 6, y(v), x(0), y(v), "h") + t(x(0) - 12, y(v) + 6, v.toFixed(1), "n x", "end");
    });
    s += t(x(1), y(0) - 12, "accuracy", "l", "end");
    s += t(x(0) + 12, y(1) + 6, "mechanism fidelity", "l");

    // contours of the product
    [0.2, 0.4, 0.6, 0.8].forEach((c) => {
      s += p(line(sample((u) => c / u, c, 1, 120).map(([u, v]) => [x(u), y(v)])), "hf");
      s += t(x(1) + 8, y(c) + 6, c.toFixed(1), "n x");
    });

    // the tie, and the gap a leaderboard can't see
    s += ln(x(ACC), y(0), x(ACC), y(1), "s3 dt");
    s += `<g class="reveal">` + ln(x(ACC), y(B), x(ACC), y(A), "ik") + `</g>`;
    s += circ(x(ACC), y(A), 5.5, "f2") + circ(x(ACC), y(B), 5.5, "fp s2");
    s += t(x(ACC) - 14, y(A) + 6, "reasons", "nl", "end");
    s += t(x(ACC) - 14, y(B) + 6, "pattern-matches", "nl", "end");

    // bars: equal accuracy, unequal causal score
    const bx = scale(0, 1, 700, 1040), rows = [
      { lab: "accuracy", a: ACC, b: ACC, y: 150 },
      { lab: "causal score", a: ACC * A, b: ACC * B, y: 320 }
    ];
    rows.forEach((r) => {
      s += t(bx(0), r.y - 44, r.lab, "l");
      s += rect(bx(0), r.y - 26, bx(r.a) - bx(0), 16, "f2");
      s += rect(bx(0), r.y + 4, bx(r.b) - bx(0), 16, "fp s2");
      s += t(bx(r.a) + 10, r.y - 12, r.a.toFixed(2), "n");
      s += t(bx(r.b) + 10, r.y + 18, r.b.toFixed(2), "n");
      s += ln(bx(0), r.y - 34, bx(0), r.y + 28, "h");
    });
    return s;
  }
};
