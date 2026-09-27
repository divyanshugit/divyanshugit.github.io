// "Exploring Llama.cpp with Llama Models" — what quantization does to weights.
// Left: the transfer function of a b-bit block quantizer on weights scaled to
// the block's [min, max] (here [−1, 1]): ŵ = min + d·round((w − min)/d),
// d = (max − min)/(2^b − 1) — the scale-and-minimum form of llama.cpp's
// block formats. 16-bit is the diagonal; 8-bit (256 levels) is already
// indistinguishable from it at this size; 4-bit has 16 steps, 2-bit 4.
// Right: one block of 32 weights (seeded normal draws) before and after,
// with the rounding error of each weight marked.
const BITS = [16, 8, 4, 2];

module.exports = {
  slug: "quantization",
  title: "Weights snapped to 8-, 4- and 2-bit levels",
  desc: "Left: quantizer staircases mapping a weight to its stored value. The 16-bit and 8-bit maps lie on the diagonal; the 4-bit map has 16 steps and the 2-bit map 4. Right: one block of 32 weights stored at 16, 8, 4 and 2 bits, with each weight's rounding error drawn as a short tick; the error is invisible at 8 bits and grows at 4 and 2.",
  caption: "Quantizing a block of weights: each weight is rounded to one of 2<sup><i>b</i></sup> evenly spaced levels between the block’s minimum and maximum. At 8 bits the staircase is the diagonal; at 4 bits (as in Q4_K_M) it has 16 steps; at 2 bits, four.",
  draw(k) {
    const { t, p, ln, circ, line, scale, rng, gauss, r1 } = k;
    let s = "";
    const q = (w, b, lo = -1, hi = 1) => { const d = (hi - lo) / (2 ** b - 1); return lo + d * Math.round((w - lo) / d); };

    // ---- left: staircases ----
    const X0 = 70, X1 = 450, Y0 = 440, Y1 = 60;
    const xs = scale(-1, 1, X0, X1), ys = scale(-1, 1, Y0, Y1);
    s += `<rect x="${X0}" y="${Y1}" width="${X1 - X0}" height="${Y0 - Y1}" class="hf"/>`;
    s += ln(xs(0), Y0, xs(0), Y0 + 6, "h") + ln(X0 - 6, ys(0), X0, ys(0), "h");
    s += t(X1, Y0 + 30, "w", "m", "end") + t(X0 - 14, Y1 + 20, "ŵ", "m", "end");
    s += t(X0, Y0 + 30, "−1", "n x") + t(xs(0), Y0 + 30, "0", "n x", "middle");
    const stair = (b) => {
      const n = 2 ** b, d = 2 / (n - 1), pts = [[xs(-1), ys(-1)]];
      for (let i = 0; i < n - 1; i++) {
        const lv = -1 + i * d, edge = lv + d / 2;
        pts.push([xs(edge), ys(lv)], [xs(edge), ys(lv + d)]);
      }
      pts.push([xs(1), ys(1)]);
      return line(pts);
    };
    s += ln(xs(-1), ys(-1), xs(1), ys(1), "hf");       // 16-bit: the diagonal
    s += p(stair(8), "s3");
    s += p(stair(2), "s2");
    s += `<g class="reveal">` + p(stair(4), "ik") + `</g>`;
    // labels in the empty triangles either side of the diagonal
    s += t(xs(-0.9), ys(0.55), "4-bit", "li");
    s += t(xs(0.9), ys(-0.72), "2-bit", "l", "end");

    // ---- right: one block of 32 weights ----
    const rand = rng(32);
    const wts = Array.from({ length: 32 }, () => gauss(rand));
    const lo = Math.min(...wts), hi = Math.max(...wts);
    const R0 = 560, R1 = 1060, rowH = 96, top = 54, LAB = 110;
    const xw = (i) => R0 + LAB + (R1 - R0 - LAB) * (i + 0.5) / 32;
    BITS.forEach((b, r) => {
      const cy = top + rowH * r + rowH / 2, amp = rowH * 0.36;
      const yv = (w) => cy - amp * (2 * (w - lo) / (hi - lo) - 1);
      s += t(R0, cy + 7, b + "-bit", b === 4 ? "li" : "l");
      // the levels: all four at 2 bits; at 4 bits, sixteen ticks at the row's right end (lines would merge)
      for (let j = 0; b <= 4 && j < 2 ** b; j++) {
        const yl = yv(lo + j * (hi - lo) / (2 ** b - 1));
        s += b === 2 ? ln(R0 + LAB - 6, yl, R1, yl, "hf") : ln(R1 + 6, yl, R1 + 14, yl, "h");
      }
      s += ln(R0 + LAB - 6, yv(0), R1, yv(0), "hf");
      wts.forEach((w, i) => {
        const qw = b >= 16 ? w : q(w, b, lo, hi);
        const x = xw(i);
        s += ln(x, yv(0), x, yv(qw), "s3");
        if (b < 16 && Math.abs(yv(qw) - yv(w)) > 0.8) s += ln(x + 3.5, yv(w), x + 3.5, yv(qw), "ikt");
        s += circ(x, yv(qw), 2.6, b === 4 ? "fi" : "f2");
      });
    });
    s += t(R1, 36, "one block of 32 weights", "l x", "end");
    return s;
  }
};
