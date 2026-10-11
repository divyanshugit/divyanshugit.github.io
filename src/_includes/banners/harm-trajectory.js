// "Temporal Safety in Diffusion LMs" — safety is a property of the trajectory.
// Above: a 12-token sequence over T = 32 denoising steps; a cell turns from
// masked (hairline) to decoded (filled) at its own step, all in parallel
// (fixed draws). Below: p_t(harm), the probability mass on unsafe content at
// step t. It crosses the threshold τ at the first harmful step (FHS),
// peaks mid-trajectory and settles below τ by step T, so an end-only
// filter, which sees only t = T, passes it. Schematic curve.
const T = 32, N = 12, TAU = 0.3;
const harm = (t) => 0.05 + 0.5 * Math.exp(-0.5 * ((t - 14) / 4.2) ** 2) + 0.04 * t / T;

module.exports = {
  slug: "harm-trajectory",
  title: "Harm across the denoising trajectory",
  desc: "Above, a grid of 12 tokens across 32 denoising steps, each token decoded at its own step. Below, a curve of the probability of harmful content at each step: it rises above a threshold tau at the first harmful step, peaks mid-way, and falls back below tau by the final step, which is the only step an end-only filter sees. Schematic.",
  caption: "A diffusion LM refines the whole sequence at once, over <i>T</i> = 32 steps. Harm can rise above <i>τ</i> mid-trajectory (the first harmful step) and settle below it by the end, where an end-only filter looks. Schematic.",
  draw(k) {
    const { t, p, ln, circ, rect, line, sample, scale, rng } = k;
    let s = "";
    const x = scale(1, T, 120, 1030), y = scale(0, 0.7, 450, 230);
    const cw = (x(2) - x(1));

    // the sequence, decoding in parallel
    const R = rng(7);
    const at = Array.from({ length: N }, () => 2 + Math.floor(R() * (T - 4)));
    for (let st = 1; st <= T; st++) {
      for (let i = 0; i < N; i++) {
        const cy = 60 + i * 11, on = st >= at[i];
        s += rect(x(st) - cw * 0.36, cy, cw * 0.72, 8, on ? "f3" : "ffr");
      }
    }
    s += t(120, 44, "denoising", "l");
    s += t(1030, 44, "12 tokens × 32 steps", "n x", "end");

    // threshold and axis
    s += ln(x(1), y(0), x(T), y(0), "h");
    s += ln(x(1), y(TAU), x(T), y(TAU), "hf d");
    s += t(x(1) - 14, y(TAU) + 8, "τ", "m", "end");
    s += t(x(1) - 14, y(0) + 6, "0", "n x", "end");
    s += t(x(1), y(0) + 30, "t = 1", "n", "middle");
    s += t(x(T), y(0) + 30, "T", "m", "middle");
    s += t(x(1) + 4, y(0.7) + 6, "p(harm)", "m x");

    // first harmful step: where the curve first reaches τ
    let fhs = 1; while (harm(fhs) < TAU && fhs < T) fhs += 0.01;
    s += ln(x(fhs), y(0), x(fhs), y(TAU), "s3 dt");
    s += t(x(fhs) - 10, y(0) - 10, "first harmful step", "n x", "end");

    s += `<g class="reveal">` + p(line(sample(harm, 1, T, 240).map(([u, v]) => [x(u), y(v)])), "ik") + `</g>`;
    // the end-only filter's single look
    s += circ(x(T), y(harm(T)), 5, "fp s2");
    s += t(x(T) - 12, y(harm(T)) - 16, "end-only filter", "l", "end");
    return s;
  }
};
