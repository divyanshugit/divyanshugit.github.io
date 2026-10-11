// "The Gap Between Passing an Eval and Being Safe" — one clean number,
// three readings. Left: covert-action rates on 26 out-of-distribution evals,
// before and after deliberative-alignment training, on a log axis
// (o3 13% → 0.4%, o4-mini 8.7% → 0.3%: about 30× fewer). Right: what the
// clean result could mean — the model is safe, it knows it's being tested,
// or the behaviour is still there and just harder to trigger.
const RATES = [
  { name: "o3", before: 13, after: 0.4, accent: true },
  { name: "o4-mini", before: 8.7, after: 0.3 }
];
const LO = 0.1, HI = 30;  // % on the log axis

module.exports = {
  slug: "eval-gap",
  title: "A 30× drop, and three ways to read it",
  desc: "A log-scale slope chart of covert-action rates on 26 out-of-distribution evals, before and after anti-scheming training: o3 falls from 13% to 0.4%, o4-mini from 8.7% to 0.3%. From the low end, three dashed branches lead to three readings of the clean result: the model is safe, the model knows it is being tested, or the behaviour is still there but harder to trigger.",
  caption: "Covert actions on 26 out-of-distribution evals fall about 30× after anti-scheming training (o3 13% → 0.4%, o4-mini 8.7% → 0.3%). The low number has three readings, and today's evals can't tell them apart.",
  draw(k) {
    const { t, p, ln, circ, line, scale } = k;
    let s = "";
    const AX = 92, X0 = 262, X1 = 500, TOP = 60, BOT = 410;
    const y = scale(Math.log10(LO), Math.log10(HI), BOT, TOP);
    const Y = (v) => y(Math.log10(v));

    // log axis
    s += ln(AX, TOP, AX, BOT, "h");
    [0.1, 1, 10].forEach((v) => {
      s += ln(AX, Y(v), AX + 6, Y(v), "h");
      s += ln(AX + 6, Y(v), X1 + 20, Y(v), "hf d");
      s += t(AX - 10, Y(v) + 6, v + "%", "n", "end");
    });
    s += t(AX, TOP - 26, "covert actions", "l");

    // before / after columns
    [[X0, "before"], [X1, "after"]].forEach(([x, lab]) => {
      s += ln(x, BOT, x, BOT + 6, "h");
      s += t(x, BOT + 40, lab, "l", "middle");
    });
    s += t((X0 + X1) / 2, BOT + 40, "training", "l x", "middle");

    // the slopes; o3 is the accent
    RATES.forEach((r, i) => {
      const a = [X0, Y(r.before)], b = [X1, Y(r.after)];
      const seg = p(line([a, b]), r.accent ? "ik" : "s3");
      s += r.accent ? `<g class="reveal">${seg}</g>` : seg;
      s += circ(a[0], a[1], 4, r.accent ? "fi" : "f3") + circ(b[0], b[1], 4, r.accent ? "fi" : "f3");
      s += t(X0 - 14, a[1] + (i === 0 ? -4 : 16), r.before + "%", r.accent ? "ni" : "n", "end");
      s += t(X0 - 70, a[1] + (i === 0 ? -4 : 16), r.name, "nl x", "end");
      s += t(X1 + 10, b[1] + (i === 0 ? -14 : 28), r.after + "%", r.accent ? "ni" : "n");
    });
    s += t((X0 + X1) / 2 + 26, (Y(13) + Y(0.4)) / 2 - 18, "≈30× fewer", "m");

    // the fork: one low number, three readings
    const FX = X1 + 40, fy = (Y(0.4) + Y(0.3)) / 2, RX = 690;
    const rows = [
      { y: 150, lab: "safe", note: "the behaviour is gone" },
      { y: 260, lab: "knows it's tested", note: "awareness causally lowers the rate" },
      { y: 370, lab: "hidden", note: "planted goal still triggers" }
    ];
    s += ln(X1 + 10, fy, FX, fy, "s3");
    rows.forEach((r, i) => {
      const c = [[FX, fy], [FX + 60, fy], [RX - 70, r.y], [RX - 14, r.y]];
      s += p(`M${c[0][0]},${c[0][1]} C${c[1][0]},${c[1][1]} ${c[2][0]},${c[2][1]} ${c[3][0]},${c[3][1]}`, "s3 d");
      s += t(RX, r.y - 4, (i + 1) + ".", "n");
      s += t(RX + 28, r.y + 2, r.lab, "l");
      s += t(RX + 28, r.y + 32, r.note, "n x");
    });
    s += t(RX, 70, "a clean result means …", "m x");
    return s;
  }
};
