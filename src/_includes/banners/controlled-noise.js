// "The Art of Controlled Noise" — the two mechanisms side by side.
// Left: Laplace mechanism on a count, N + Lap(1/ε) with ε = 0.5 (the post's
// example, Lap(2)); the central 90% interval is ±b·ln 10 ≈ ±4.6.
// Right: exponential mechanism choosing the most popular film, scores
// 50, 45, 41, 38, 30, Δu = 1, ε = 0.5: Pr[r] ∝ exp(ε·u / 2Δu). The post's
// 50-vs-45 pair comes out at a ratio of e^{1.25} ≈ 3.49.
const EPS = 0.5, B = 1 / EPS;
const SCORES = [50, 45, 41, 38, 30];

module.exports = {
  slug: "controlled-noise",
  title: "The Laplace and exponential mechanisms",
  desc: "Left: the Laplace mechanism releases a count N plus Laplace noise of scale 2 (ε = 0.5); 90% of releases fall within about ±4.6 of N. Right: the exponential mechanism picks one of five films with scores 50, 45, 41, 38 and 30; with ε = 0.5 their selection probabilities are about 69%, 20%, 7%, 3.4% and 0.5%.",
  caption: "Two ways to add noise at ε = 0.5. The Laplace mechanism blurs a number: N + Lap(2). The exponential mechanism blurs a choice: films scoring 50, 45, 41, 38 and 30 are picked with probability ∝ exp(<i>ε</i>·<i>u</i>/2).",
  draw(k) {
    const { t, p, ln, rect, line, sample, scale, laplace, r1 } = k;
    let s = "";

    // ---- left: Laplace on a count ----
    const X0 = 40, X1 = 500, BASE = 420, TOP = 90;
    const xs = scale(-10, 10, X0, X1), ys = scale(0, 1 / (2 * B), BASE, TOP);
    const f = laplace(0, B);
    const half = B * Math.log(10);          // P(|X| ≤ half) = 0.9
    const band = sample(f, -half, half, 200, [0]).map(([x, y]) => [xs(x), ys(y)]);
    s += p(line(band) + ` L${r1(xs(half))},${BASE} L${r1(xs(-half))},${BASE} Z`, "w");
    s += ln(X0, BASE, X1, BASE, "h");
    [-10, -5, 0, 5, 10].forEach((v) => { s += ln(xs(v), BASE, xs(v), BASE + (v ? 5 : 8), "h"); });
    s += t(xs(0), BASE + 32, "N", "m", "middle");
    s += t(xs(-10), BASE + 30, "N − 10", "n x", "start");
    s += t(xs(10), BASE + 30, "N + 10", "n x", "end");
    s += ln(xs(-half), ys(f(half)) , xs(-half), BASE, "hf");
    s += ln(xs(half), ys(f(half)), xs(half), BASE, "hf");
    s += `<g class="reveal">` + p(line(sample(f, -10, 10, 400, [0]).map(([x, y]) => [xs(x), ys(y)])), "ik") + `</g>`;
    s += t(xs(0) + 22, ys(f(0)) + 6, "N + Lap(2)", "mi");
    s += t(xs(0), BASE - 40, "90%", "ni", "middle");
    s += t(X0, 42, "laplace · a number", "l");

    // ---- divider ----
    s += ln(550, 70, 550, 440, "hf");

    // ---- right: exponential mechanism ----
    const w = SCORES.map((u) => Math.exp(EPS * u / 2));
    const Z = w.reduce((a, b) => a + b, 0);
    const pr = w.map((v) => v / Z);
    const R0 = 600, R1 = 1060, rowH = 58, Y0 = 108;
    const xu = scale(0, 50, R0 + 70, R0 + 250);      // score bar
    const xp = scale(0, 1, R0 + 290, R1);             // probability bar
    s += t(R0, 42, "exponential · a choice", "l");
    s += t(xu(0), 80, "score", "l x");
    s += t(xp(0), 80, "probability", "l x");
    SCORES.forEach((u, i) => {
      const y = Y0 + i * rowH;
      s += t(R0, y + 7, ["i", "ii", "iii", "iv", "v"][i], "m");
      s += ln(xu(0), y, xu(u), y, "s2");
      s += t(xu(u) + 8, y + 6, String(u), "n x");
      s += ln(xp(0), y - 12, xp(0), y + 12, "hf");
      s += `<g class="reveal">` + rect(xp(0), y - 7, Math.max(1.5, xp(pr[i]) - xp(0)), 14, "fi") + `</g>`;
      const pct = pr[i] >= 0.1 ? Math.round(pr[i] * 100) + "%" : (pr[i] * 100).toFixed(1) + "%";
      s += t(xp(pr[i]) + 10, y + 6, pct, i === 0 ? "ni" : "n");
    });
    return s;
  }
};
