// "Where AI Agent Safety Benchmarks Stand Today" — a geological section.
// The post's three layers of agent risk as strata (intent over action over
// knowledge), with the ten benchmarks it reviews drawn as cores sampled in
// their layer. The madder borehole is the post's worst case: one agent
// that is compromised at all three layers at once. Boundaries are smooth
// sums of sines (fixed), not hand-drawn.
const LAYERS = [
  { name: "intent", no: "i", cores: ["SALAD-Bench", "h4rm3l", "WildJailbreak"] },
  { name: "action", no: "ii", cores: ["Agent-SafetyBench", "ToolEmu", "AgentHarm", "PrivacyLens"] },
  { name: "knowledge", no: "iii", cores: ["ChemSafetyBench", "RedCode", "SafeAgentBench"] }
];

module.exports = {
  slug: "agent-strata",
  title: "A section through agent risk: intent, action, knowledge",
  desc: "A geological cross-section with three strata, labelled intent, action and knowledge from top to bottom. Short cores mark the benchmarks sampled in each layer: SALAD-Bench, h4rm3l and WildJailbreak in intent; Agent-SafetyBench, ToolEmu, AgentHarm and PrivacyLens in action; ChemSafetyBench, RedCode and SafeAgentBench in knowledge. A single borehole passes through all three layers: the worst case of an agent failing at every layer at once.",
  caption: "Agent risk as strata. Each benchmark samples one layer; the borehole is the post’s worst case, a jailbroken agent with tools and domain knowledge, failing at all three at once.",
  draw(k) {
    const { t, p, ln, rect, circ, line } = k;
    let s = "";
    const X0 = 40, X1 = 1060;
    // boundaries: y(x) = base + Σ a·sin(f·x + φ)
    const bound = (base, parts) => (x) => base + parts.reduce((a, [amp, f, ph]) => a + amp * Math.sin(f * x / 100 + ph), 0);
    const B = [
      bound(92, [[5, 0.9, 0.4], [3, 2.1, 1.3]]),
      bound(208, [[9, 0.7, 2.0], [4, 1.9, 0.2]]),
      bound(318, [[11, 0.6, 4.1], [4, 1.7, 2.6]]),
      bound(446, [[4, 0.8, 1.1], [2, 2.3, 0.5]])
    ];
    const pts = (f) => { const a = []; for (let x = X0; x <= X1; x += 6) a.push([x, f(x)]); if (a[a.length - 1][0] !== X1) a.push([X1, f(X1)]); return a; };
    // strata fills: top plain, middle hatched, bottom stippled
    const band = (fa, fb) => line(pts(fa)) + " " + line(pts(fb).reverse()).replace(/^M/, "L") + " Z";
    const id = k.uid;
    s += `<defs>
<pattern id="${id}-hatch" width="14" height="7" patternUnits="userSpaceOnUse"><line x1="0" y1="3.5" x2="14" y2="3.5" class="hf"/></pattern>
<pattern id="${id}-dots" width="16" height="14" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.1" class="fr"/><circle cx="12" cy="11" r="1.1" class="fr"/></pattern>
<clipPath id="${id}-c1"><path d="${band(B[1], B[2])}"/></clipPath>
<clipPath id="${id}-c2"><path d="${band(B[2], B[3])}"/></clipPath>
</defs>`;
    s += `<rect x="${X0}" y="0" width="${X1 - X0}" height="500" fill="url(#${id}-hatch)" clip-path="url(#${id}-c1)"/>`;
    s += `<rect x="${X0}" y="0" width="${X1 - X0}" height="500" fill="url(#${id}-dots)" clip-path="url(#${id}-c2)"/>`;
    B.forEach((f, i) => { s += p(line(pts(f)), i === 0 || i === 3 ? "h" : "s3"); });
    s += ln(X0, B[0](X0), X0, B[3](X0), "h") + ln(X1, B[0](X1), X1, B[3](X1), "h");

    // layer names, in the left margin of each stratum
    LAYERS.forEach((L, i) => {
      const x = 62, y = (B[i](x) + B[i + 1](x)) / 2;
      s += t(x, y - 4, L.no, "m");
      s += t(x, y + 22, L.name, "l");
    });

    // cores: evenly spread through the section, each in its own layer
    const all = [];
    LAYERS.forEach((L, i) => L.cores.forEach((c) => all.push({ c, i })));
    // spread x positions by layer so labels do not collide
    const XS = [[300, 560, 800], [200, 430, 640, 830], [330, 570, 790]];
    LAYERS.forEach((L, i) => L.cores.forEach((c, j) => {
      const x = XS[i][j], top = B[i](x), bot = B[i + 1](x);
      const y0 = top + (bot - top) * 0.2, y1 = top + (bot - top) * 0.8;
      s += rect(x - 4, y0, 8, y1 - y0, "fp s3");
      s += t(x + 14, (y0 + y1) / 2 + 7, c, "nl x");
    }));

    // the borehole through all three
    const bx = 1004, by0 = B[0](bx) - 26, by1 = B[3](bx);
    s += `<g class="reveal">` + ln(bx, by0, bx, by1 - 2, "ik") + `</g>`;
    [1, 2].forEach((i) => { s += circ(bx, B[i](bx), 3.4, "fi"); });
    s += circ(bx, by1 - 2, 3.4, "fi");
    s += t(bx - 12, by0 + 4, "worst case", "li", "end");
    s += t(X0, 44, "surface", "l x");
    return s;
  }
};
