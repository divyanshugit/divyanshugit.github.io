// "Research Agenda" — provable invariance, the definition drawn.
// Left, input space: one input x and six rewrites T(x), one per shift class
// in the agenda's table (serialization, modality, surface form, non-causal
// intervention, denoising trajectory, resampling). They land far apart.
// Right, output space: f maps every one of them inside the ε-ball around
// f(x), i.e. d(f(T(x)), f(x)) ≤ ε for all T. The positions are fixed draws.
const SHIFTS = ["serialization", "modality", "surface form", "intervention", "denoising", "resampling"];
const EPS = 74;   // ε-ball radius, in px

module.exports = {
  slug: "invariance",
  title: "Provable invariance: many rewrites, one answer",
  desc: "On the left, an input x and six rewrites of it, one for each shift class in the agenda: serialization, modality, surface form, non-causal intervention, denoising trajectory and resampling. They lie far apart in input space. An arrow labelled f leads to the right, where all six outputs fall inside a small ball of radius epsilon around f(x).",
  caption: "The agenda in one picture. Six kinds of rewrite move the input a long way (serialization, modality, surface form, intervention, denoising, resampling); an invariant <i>f</i> keeps every answer within <i>ε</i> of <i>f</i>(<i>x</i>).",
  draw(k) {
    const { t, p, ln, circ, arrow, rng, r1 } = k;
    let s = "";
    const R = rng(11);

    // input space
    const X = [300, 262];
    s += t(40, 52, "input", "l");
    const pts = SHIFTS.map((name, i) => {
      const a = -Math.PI / 2 + (i + 0.35) * (2 * Math.PI / SHIFTS.length);
      const r = 128 + 46 * R();
      return { name, x: X[0] + r * Math.cos(a), y: X[1] + r * 0.92 * Math.sin(a) };
    });
    pts.forEach((q) => {
      s += ln(X[0], X[1], q.x, q.y, "hf d");
      s += circ(q.x, q.y, 4.5, "fp s2");
      const right = q.x >= X[0];
      s += t(q.x + (right ? 12 : -12), q.y + 6, q.name, "n x", right ? "start" : "end");
    });
    s += circ(X[0], X[1], 5, "f2");
    s += t(X[0] + 12, X[1] + 26, "x", "m");
    s += t(pts[0].x + 12, pts[0].y - 16, "T(x)", "m x");

    // the map
    s += arrow(560, 262, 720, 262, "s2");
    s += t(640, 244, "f", "m", "middle");

    // output space: everything inside the ε-ball
    const F = [900, 262];
    s += t(780, 52, "output", "l");
    s += `<g class="reveal">` + circ(F[0], F[1], EPS, "ik") + `</g>`;
    SHIFTS.forEach(() => {
      const a = R() * 2 * Math.PI, r = EPS * (0.3 + 0.5 * R());
      s += circ(F[0] + r * Math.cos(a), F[1] + r * Math.sin(a), 4.5, "fp s2");
    });
    s += circ(F[0], F[1], 5, "f2");
    s += t(F[0] + 12, F[1] - 12, "f(x)", "m x");
    // the radius, marked
    s += ln(F[0], F[1], F[0] + EPS * 0.707, F[1] + EPS * 0.707, "s3 dt");
    s += t(F[0] + EPS + 14, F[1] + EPS * 0.9, "ε", "mi");
    s += t(F[0], F[1] + EPS + 62, "d ≤ ε for every T", "n", "middle");
    return s;
  }
};
