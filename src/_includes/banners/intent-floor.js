// "Guardrails as Intent Classifiers" — the Bayes floor is a property of the
// representation. Two classes, benign and harmful, with equal priors, drawn
// twice: as surface text (means ±0.55, σ = 1: heavy overlap) and as intent
// (means ±1.7, σ = 0.6: nearly separate). The shaded overlap is the Bayes
// error η* of each representation; the proposal's bet is
// η*(intent) < η*(surface). Parameters are illustrative, not measured.
const SURF = { mu: 0.55, sd: 1 }, INT = { mu: 1.7, sd: 0.6 };

module.exports = {
  slug: "intent-floor",
  title: "The same two classes, in two representations",
  desc: "Two pairs of bell curves for benign and harmful requests. Above, as surface text, they overlap heavily, and the shaded overlap (the Bayes error, eta-star) is large. Below, as intent, the curves are narrow and far apart and the overlap almost vanishes. Illustrative parameters.",
  caption: "The floor under the safety–usability tradeoff is the overlap between benign and harmful in the representation you classify (<i>η</i>*). As surface text the classes overlap heavily; as intent they barely touch. Illustrative curves, not measurements.",
  draw(k) {
    const { t, p, ln, line, sample, scale, normal } = k;
    let s = "";
    const x = scale(-4, 4, 150, 1050);
    const hy = 150 / normal(0, INT.sd)(0);          // one height scale for both panels

    function panel(P, base, name, accent) {
      const fb = normal(-P.mu, P.sd), fh = normal(P.mu, P.sd);
      const y = (v) => base - v * hy;
      const pts = (f, m) => sample(f, Math.max(-4, m - 3.6 * P.sd), Math.min(4, m + 3.6 * P.sd), 320).map(([u, v]) => [x(u), y(v)]);
      let g = "";
      // overlap = min of the two densities: the Bayes error at equal priors
      const ov = sample((u) => Math.min(fb(u), fh(u)), -4, 4, 320, [0]).map(([u, v]) => [x(u), y(v)]);
      g += p(line(ov) + ` L${x(4)},${base} L${x(-4)},${base} Z`, "w");
      g += ln(x(-4), base, x(4), base, "h");
      g += p(line(pts(fb, -P.mu)), "s3");
      const harm = p(line(pts(fh, P.mu)), accent ? "ik" : "s2");
      g += accent ? `<g class="reveal">${harm}</g>` : harm;
      g += t(40, base - 8, name, "l");
      g += t(x(-P.mu), y(fb(-P.mu)) - 12, "benign", "n x", "middle");
      g += t(x(P.mu), y(fh(P.mu)) - 12, "harmful", accent ? "ni x" : "n x", "middle");
      return g;
    }
    s += panel(SURF, 210, "surface", false);
    s += panel(INT, 450, "intent", true);
    // the floor, named once on each panel
    const fS = normal(SURF.mu, SURF.sd)(0);
    s += t(x(0), 210 - fS * hy * 0.35, "η*", "m", "middle");
    s += ln(x(0) + 4, 444, x(0) + 30, 400, "s3") + t(x(0) + 36, 398, "η*", "m");
    return s;
  }
};
