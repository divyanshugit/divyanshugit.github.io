// "Loom" — Milestone 0's search: beam_width = 3, max_depth = 6. The root
// question expands into 5 candidate steps; after that each live beam
// proposes 3. The Python oracle rejects some (crossed); of those that pass,
// the 3 best by score are kept (filled) and expanded. The verified path is
// the best leaf at depth 6, traced back to the root. Oracle verdicts and
// scores are fixed draws (pass rate 0.7).
const BEAM = 3, DEPTH = 6, FIRST = 5, BRANCH = 3, PASS = 0.7;

module.exports = {
  slug: "beam-tree",
  title: "Beam search over reasoning steps",
  desc: "A search tree six steps deep. The question expands into five candidate steps, then each of three live beams proposes three more at every step. Some candidates are rejected by the oracle and marked with a cross; three of the passing ones are kept and expanded. One path from the question to a final answer at step six is drawn in the accent colour: the verified reasoning path.",
  caption: "Milestone 0, as configured: beam width 3, depth 6. Each step, the oracle runs the candidate’s code and rejects what fails (×); the three best survivors are expanded. The answer is the end of the verified path.",
  draw(k) {
    const { t, p, ln, circ, line, rng } = k;
    let s = "";
    const R = rng(23);
    const X = (d) => 150 + d * 135, YT = 70, YB = 420;

    let live = [{ y: (YT + YB) / 2, d: 0, score: 0, parent: null }];
    const nodes = [], edges = [];
    for (let d = 1; d <= DEPTH; d++) {
      const kids = [];
      live.forEach((par) => { for (let j = 0; j < (d === 1 ? FIRST : BRANCH); j++) kids.push({ par }); });
      kids.forEach((c, i) => {
        c.d = d; c.y = YT + (kids.length === 1 ? 0.5 : i / (kids.length - 1)) * (YB - YT);
        c.ok = R() < PASS; c.score = c.par.score + R();
        edges.push(c);
      });
      const ok = kids.filter((c) => c.ok).sort((a, b) => b.score - a.score);
      ok.slice(0, BEAM).forEach((c) => { c.kept = true; });
      nodes.push(...kids);
      live = ok.slice(0, BEAM);
    }
    // the verified path: the best kept leaf, back to the root
    let best = live[0], path = [];
    for (let n = best; n; n = n.par) path.unshift([X(n.d), n.y]);

    edges.forEach((c) => { s += ln(X(c.d - 1), c.par.y, X(c.d), c.y, c.kept ? "s3" : "hf"); });
    s += `<g class="reveal">` + p(line(path), "ik") + `</g>`;
    nodes.forEach((c) => {
      const cx = X(c.d), cy = c.y;
      if (!c.ok) s += ln(cx - 4.5, cy - 4.5, cx + 4.5, cy + 4.5, "s3") + ln(cx - 4.5, cy + 4.5, cx + 4.5, cy - 4.5, "s3");
      else s += circ(cx, cy, 4.5, c.kept ? "f2" : "fp s3");
    });
    s += circ(X(0), (YT + YB) / 2, 6, "f2");
    s += circ(X(DEPTH), best.y, 6.5, "fi");
    s += t(X(0) - 14, (YT + YB) / 2 + 7, "question", "nl", "end");
    s += t(X(DEPTH) + 16, best.y + 6, "answer", "li");
    for (let d = 1; d <= DEPTH; d++) s += t(X(d), YB + 44, "step " + d, "n x", "middle");
    // legend
    s += ln(X(0) - 26, YB + 39, X(0) - 17, YB + 48, "s3 x") + ln(X(0) - 26, YB + 48, X(0) - 17, YB + 39, "s3 x");
    s += t(X(0) - 8, YB + 50, "oracle", "n x");
    return s;
  }
};
