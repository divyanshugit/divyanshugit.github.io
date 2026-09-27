// "From SGD to DP-SGD" — the two steps that make a gradient step private,
// with the post's Opacus settings: max_grad_norm C = 1.0, noise_multiplier
// σ = 1.1. Left: per-example gradients g_i; those longer than C are scaled
// back to the circle ‖g‖ = C. Right: the sum of the clipped gradients, and
// the Gaussian noise N(0, σ²C²I) added to it (1σ and 2σ contours, and
// seeded draws from that exact distribution).
const C = 1.0, SIGMA = 1.1;
const NOISE_SEED = 3;   // the one noisy step shown; any seed is an honest draw
// nine per-example gradients (angle in degrees, norm), fixed so the build is stable
const G = [[18, 0.62], [34, 1.55], [5, 0.85], [52, 0.48], [26, 2.3], [-12, 1.2], [40, 0.9], [12, 1.8], [62, 1.05]];

module.exports = {
  slug: "dp-sgd",
  title: "Per-example clipping and Gaussian noise in DP-SGD",
  desc: "Left: nine per-example gradients drawn from a common origin, with the clipping circle of radius C = 1. Five of them are longer than C and are scaled back to the circle; their original lengths are shown dotted. Right: the sum of the clipped gradients, with Gaussian noise of standard deviation σC = 1.1 around its tip, drawn as 1σ and 2σ circles and forty sample draws.",
  caption: "The two steps of DP-SGD with the post’s settings. Each per-example gradient is clipped to norm C = 1.0; the clipped gradients are summed and Gaussian noise with σC = 1.1 is added, so no single example can move the step by more than C.",
  draw(k) {
    const { t, p, ln, circ, head, line, rng, gauss, r1 } = k;
    let s = "";
    const rad = (a) => (a * Math.PI) / 180;

    // ---- left: clipping ----
    const OX = 110, OY = 400, U = 128;           // origin and px per unit
    s += ln(OX - 30, OY, 520, OY, "hf") + ln(OX, OY + 30, OX, 60, "hf");
    // the circle ‖g‖ = C (upper-right quadrant region we use, drawn in full arc)
    const arc = []; for (let a = -25; a <= 95; a += 1) arc.push([OX + U * C * Math.cos(rad(a)), OY - U * C * Math.sin(rad(a))]);
    s += p(line(arc), "s3 d");
    s += t(OX + U * C * Math.cos(rad(96)) - 8, OY - U * C * Math.sin(rad(96)) - 10, "C", "m", "end");
    const clipped = G.map(([a, n]) => {
      const c = n / Math.max(1, n / C);
      const ux = Math.cos(rad(a)), uy = -Math.sin(rad(a));
      if (n > C) s += ln(OX + U * C * ux, OY + U * C * uy, OX + U * n * ux, OY + U * n * uy, "s3 dt");
      if (n > C) s += circ(OX + U * n * ux, OY + U * n * uy, 2.2, "f3");
      const ex = OX + U * c * ux, ey = OY + U * c * uy;
      s += ln(OX, OY, ex, ey, n > C ? "s2" : "s2") + head(ex, ey, Math.atan2(uy, ux), "s2", 8);
      if (n > C) s += circ(ex, ey, 3, "fi");
      return [c * ux, c * uy];
    });
    s += t(40, 42, "clip each example", "l");
    s += t(OX + U * 2.3 * Math.cos(rad(26)) + 8, OY - U * 2.3 * Math.sin(rad(26)) - 6, "g", "m x");

    // ---- right: sum + noise ----
    const sx = clipped.reduce((a, v) => a + v[0], 0), sy = clipped.reduce((a, v) => a + v[1], 0);
    const QX = 600, QY = 430, V = 48;               // origin and px per unit
    const TX = QX + V * sx, TY = QY + V * sy;
    s += ln(QX - 20, QY, 1070, QY, "hf");
    // noise: contours at 1σC and 2σC, and seeded draws
    s += circ(TX, TY, V * SIGMA * C * 2, "hf d");
    s += `<circle cx="${r1(TX)}" cy="${r1(TY)}" r="${r1(V * SIGMA * C)}" class="w"/>` + circ(TX, TY, V * SIGMA * C, "h");
    const rand = rng(1100);
    for (let i = 0; i < 40; i++) {
      const nx = gauss(rand) * SIGMA * C, ny = gauss(rand) * SIGMA * C;
      s += circ(TX + V * nx, TY + V * ny, 1.9, "f3");
    }
    // the sum of clipped gradients, as a chain of the nine, then the resultant
    let cx = QX, cy = QY;
    clipped.forEach(([ux, uy]) => { const nx = cx + V * ux, ny = cy + V * uy; s += ln(cx, cy, nx, ny, "hf"); cx = nx; cy = ny; });
    s += `<g class="reveal">` + ln(QX, QY, TX, TY, "ik") + head(TX, TY, Math.atan2(TY - QY, TX - QX), "ik", 11) + `</g>`;
    // one noisy step (a fixed draw)
    const nr = rng(NOISE_SEED), ex = gauss(nr) * SIGMA * C, ey = gauss(nr) * SIGMA * C;
    s += ln(TX, TY, TX + V * ex, TY + V * ey, "ikt d") + circ(TX + V * ex, TY + V * ey, 4, "fi");
    s += t(TX - V * SIGMA * C * 2 * 0.74 - 6, TY - V * SIGMA * C * 2 * 0.74 - 4, "N(0, σ²C²I)", "m x", "end");
    s += k.sub(QX + (TX - QX) * 0.55 + 14, QY + (TY - QY) * 0.55 + 30, "Σ g̃", "i", "mi");
    s += t(1060, 42, "sum, then add noise", "l", "end");
    s += t(1060, 72, "C = 1.0 · σ = 1.1", "n x", "end");
    return s;
  }
};
