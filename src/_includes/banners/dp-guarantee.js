// "DP Guarantee in Action" — post-processing invariance.
// Left: the Laplace release densities p_D (centre 0) and p_D′ (centre 1),
// b = 1/ε with ε = 1. The band between e^{-ε}·p_D′ and e^{ε}·p_D′ is the
// guarantee; p_D never leaves it. Right: an arbitrary post-processing f
// (here, rounding the release into five bins) gives two discrete
// distributions whose bin-by-bin ratios are still within e^ε — computed
// exactly from the Laplace CDF.
const EPS = 1, B = 1 / EPS;
const CUTS = [-Infinity, -1.5, -0.25, 1.25, 2.5, Infinity];   // f: the release → one of five bins

module.exports = {
  slug: "dp-guarantee",
  title: "The e^ε band, before and after post-processing",
  desc: "Left: two Laplace densities for neighbouring datasets, centred at 0 and 1 with ε = 1, and the band between e^−ε and e^ε times the second density; the first density stays inside the band everywhere. Right: after rounding the output into five bins, each pair of bin probabilities still differs by at most a factor of e ≈ 2.72.",
  caption: "Left, the guarantee: M(D) stays inside the band between e<sup>−<i>ε</i></sup> and e<sup><i>ε</i></sup> times M(D′). Right, after any post-processing <i>f</i> (here, rounding into five bins), every pair of probabilities is still within e<sup><i>ε</i></sup>.",
  draw(k) {
    const { t, p, ln, rect, arrow, line, sample, scale, laplace, laplaceCdf, r1 } = k;
    let s = "";
    const fD = laplace(0, B), fN = laplace(1, B);

    // ---- left: densities and the ratio band ----
    const X0 = 40, X1 = 540, BASE = 420, TOP = 60;
    const xs = scale(-3.5, 4.5, X0, X1), ys = scale(0, Math.exp(EPS) * 0.5, BASE, TOP);
    const cap = (v) => v;
    const up = sample((x) => cap(Math.exp(EPS) * fN(x)), -3.5, 4.5, 400, [1]).map(([x, y]) => [xs(x), ys(y)]);
    const lo = sample((x) => Math.exp(-EPS) * fN(x), -3.5, 4.5, 400, [1]).map(([x, y]) => [xs(x), ys(y)]);
    s += p(line(up) + " " + line(lo.slice().reverse()).replace(/^M/, "L") + " Z", "w");
    s += p(line(up), "hf");
    s += p(line(lo), "hf");
    s += ln(X0, BASE, X1, BASE, "h");
    [-3, -2, -1, 0, 1, 2, 3, 4].forEach((v) => { s += ln(xs(v), BASE, xs(v), BASE + 5, "h"); });
    s += t(xs(0), BASE + 30, "0", "n", "middle") + t(xs(1), BASE + 30, "1", "n", "middle");
    const dD = line(sample(fD, -3.5, 4.5, 400, [0]).map(([x, y]) => [xs(x), ys(y)]));
    const dN = line(sample(fN, -3.5, 4.5, 400, [1]).map(([x, y]) => [xs(x), ys(y)]));
    s += `<g class="reveal">` + p(dN, "s2 d") + p(dD, "ik") + `</g>`;
    s += t(xs(0) - 26, ys(fD(0)) - 2, "M(D)", "mi", "end");
    s += t(xs(1) + 24, ys(fN(1)) + 30, "M(D′)", "m");
    // label the band where it is widest on the right tail
    // the band's edges, named where they are widest apart
    s += k.sup(xs(1) + 58, ys(Math.exp(EPS) * fN(1.62)) - 8, "e", "ε", "m x") ;
    s += t(X0, 38, "the guarantee", "l");

    // ---- f ----
    s += arrow(576, 250, 648, 250, "s3");
    s += t(612, 234, "f", "m", "middle");
    s += t(612, 284, "any", "l x", "middle");

    // ---- right: binned probabilities ----
    const cD = laplaceCdf(0, B), cN = laplaceCdf(1, B);
    const bins = CUTS.slice(0, -1).map((a, i) => {
      const bnd = CUTS[i + 1];
      const pr = (c) => (bnd === Infinity ? 1 : c(bnd)) - (a === -Infinity ? 0 : c(a));
      return { d: pr(cD), n: pr(cN) };
    });
    const R0 = 690, R1 = 1060, BW = (R1 - R0) / bins.length;
    const yb = scale(0, 0.62, BASE, TOP + 40);
    s += ln(R0, BASE, R1, BASE, "h");
    bins.forEach((bn, i) => {
      const cx = R0 + BW * (i + 0.5), w = 20;
      s += rect(cx - w - 2, yb(bn.n), w, BASE - yb(bn.n), "s2 d");
      s += rect(cx + 2, yb(bn.d), w, BASE - yb(bn.d), "fi");
      const ratio = Math.max(bn.d / bn.n, bn.n / bn.d);
      s += t(cx, Math.min(yb(bn.n), yb(bn.d)) - 14, "×" + ratio.toFixed(2), "n x", "middle");
      s += ln(cx, BASE, cx, BASE + 5, "h");
    });
    s += t(R0 + BW * 0.5, BASE + 30, "bin 1", "n x", "middle");
    s += t(R1 - BW * 0.5, BASE + 30, "bin 5", "n x", "middle");
    s += t(R1, 38, "post-processed", "l", "end");
    s += t(R1, 68, "each pair within ×2.72", "li x", "end");
    return s;
  }
};
