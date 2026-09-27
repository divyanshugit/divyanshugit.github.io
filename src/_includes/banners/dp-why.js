// "Differential Privacy!! But Why?" — two neighbouring datasets, one row apart,
// and the Laplace-noised counts they release. The counts differ by the
// sensitivity (1); the densities overlap so much that the output cannot tell
// which table it came from. ε = 1, b = Δf/ε = 1.
module.exports = {
  slug: "dp-why",
  title: "Two neighbouring datasets and their noisy counts",
  desc: "Left: dataset D with nine rows, five of them marked, and its neighbour D′, identical except that one marked row is removed. Right: the Laplace mechanism with ε = 1 releases the count of marked rows. The release densities for D (centred at 5) and D′ (centred at 4) overlap heavily; at every output their ratio stays within e¹ ≈ 2.72.",
  caption: "Neighbouring datasets D and D′ differ in one row. Their noisy counts, 5 + Lap(1) and 4 + Lap(1), overlap almost entirely: at any output, one density is at most e<sup><i>ε</i></sup> times the other.",
  draw(k) {
    const { t, p, ln, rect, circ, arrow, line, sample, scale, laplace } = k;
    let s = "";

    // ---- the two tables ----
    const rows = [1, 0, 1, 1, 0, 1, 0, 1, 0];     // 1 = has the attribute; count = 5
    const gone = 5;                                 // D′ lacks this (marked) row
    const TY = 96, RH = 34, TW = 150;
    const table = (x, name, drop) => {
      let g = t(x, 62, name, "m");
      rows.forEach((v, i) => {
        const y = TY + i * RH;
        if (drop && i === gone) {
          g += rect(x, y + 5, TW, RH - 10, "hf d");
          return;
        }
        g += ln(x, y + RH, x + TW, y + RH, "hf");
        g += ln(x + 10, y + RH / 2, x + (v ? 92 : 108) - (i % 3) * 14, y + RH / 2, "h");
        g += v ? circ(x + TW - 16, y + RH / 2, 4.2, i === gone ? "fi" : "f2") : circ(x + TW - 16, y + RH / 2, 4.2, "s3");
      });
      g += ln(x, TY, x + TW, TY, "h");
      return g;
    };
    s += table(40, "D", false);
    s += table(232, "D′", true);
    // the missing row, called out
    const gy = TY + gone * RH + RH / 2;
    s += ln(40 + TW + 6, gy, 232 - 6, gy, "ikt d");
    s += t(236 + TW / 2, TY + 9 * RH + 38, "one row apart", "li", "middle");
    s += t(40, TY + 9 * RH + 38, "count = 5", "n x");
    s += ln(232 + TW / 2, TY + 9 * RH + 12, 232 + TW / 2, TY + 9 * RH + 18, "h x");

    // ---- the mechanism ----
    s += arrow(412, 250, 486, 250, "s3");
    s += t(449, 236, "M", "m", "middle");

    // ---- release densities ----
    const X0 = 520, X1 = 1060, BASE = 410, TOP = 70;
    const xs = scale(-1, 10, X0, X1);
    const b = 1, peak = 0.5;
    const ys = scale(0, peak, BASE, TOP + 20);
    const fD = laplace(5, b), fN = laplace(4, b);
    const pts = (f, mu) => sample(f, -1, 10, 440, [mu]).map(([x, y]) => [xs(x), ys(y)]);
    const dD = line(pts(fD, 5)), dN = line(pts(fN, 4));
    // overlap (the min of the two) as a wash
    const ov = sample((x) => Math.min(fD(x), fN(x)), -1, 10, 440, [4.5]).map(([x, y]) => [xs(x), ys(y)]);
    s += p(line(ov) + ` L${X1},${BASE} L${X0},${BASE} Z`, "w");
    // axis with integer ticks
    s += ln(X0, BASE, X1, BASE, "h");
    for (let v = 0; v <= 9; v++) {
      s += ln(xs(v), BASE, xs(v), BASE + (v === 4 || v === 5 ? 7 : 5), "h");
      if (v === 4 || v === 5 || v === 0 || v === 9) s += t(xs(v), BASE + 30, String(v), v === 4 || v === 5 ? "n" : "n x", "middle");
    }
    s += `<g class="reveal">` + p(dN, "s2 d") + p(dD, "ik") + `</g>`;
    // labels
    s += t(xs(5) + 34, ys(fD(5)) + 8, "M(D)", "mi");
    s += t(xs(4) - 34, ys(fN(4)) + 8, "M(D′)", "m", "end");
    s += t(X1, 44, "released count", "l", "end");
    s += t(X1, BASE - 12, "ε = 1", "n x", "end");
    return s;
  }
};
