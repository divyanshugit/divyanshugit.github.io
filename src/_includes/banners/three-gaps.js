// "Wrong, Lying or Scheming?" — where the gap sits in each failure.
// Three rows over the same chain: the world (is the claim true), the model's belief
// about it, and what the model says or does.
//   hallucination: world ≠ belief, belief = output   (honest, wrong)
//   deception:     belief ≠ output                   (knows better, says otherwise)
//   scheming:      what it does when it thinks it is watched ≠ when it thinks it is not
// The breaks, together, are the one accent: they are what the post is about.
module.exports = {
  slug: "three-gaps",
  title: "Where the gap is: hallucination, deception, scheming",
  desc: "Three rows, each a chain from the world to the model's belief to its output. In hallucination the break is between the world and the belief; the output matches the belief. In deception the break is between the belief and the output. In scheming the output splits in two, one when the model believes it is watched and one when it believes it is not, and the break is between those two branches.",
  caption: "Three failures, three places. Hallucination: the belief is wrong, and the model says it. Deception: the belief is right, and the model says otherwise. Scheming: what it does depends on whether it thinks it is being watched.",
  draw(k) {
    const { t, p, ln, circ } = k;
    let s = "";
    const XW = 380, XB = 610, XY = 840, ROWS = [130, 270, 410];
    const NAMES = ["hallucination", "deception", "scheming"];
    let gaps = "";

    // a broken link between two nodes: the line stops, two ticks, a gap
    function brk(x1, y1, x2, y2) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, a = Math.atan2(y2 - y1, x2 - x1);
      const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux, g = 10, h = 12;
      let o = ln(x1 + ux * 7, y1 + uy * 7, mx - ux * g, my - uy * g, "s3") + ln(mx + ux * g, my + uy * g, x2 - ux * 7, y2 - uy * 7, "s3");
      gaps += ln(mx - ux * g + nx * h, my - uy * g + ny * h, mx - ux * g - nx * h, my - uy * g - ny * h, "ik");
      gaps += ln(mx + ux * g + nx * h, my + uy * g + ny * h, mx + ux * g - nx * h, my + uy * g - ny * h, "ik");
      return o;
    }
    const link = (x1, y1, x2, y2) => ln(x1 + 7, y1, x2 - 7, y2, "s3");

    // column heads
    [[XW, "world"], [XB, "belief"], [XY, "output"]].forEach(([x, l]) => { s += t(x, 62, l, "l", "middle"); });

    NAMES.forEach((n, i) => {
      const y = ROWS[i];
      s += t(40, y + 6, n, "l");
      if (i === 0) {
        s += brk(XW, y, XB, y) + link(XB, y, XY, y);
        s += t(XW, y + 34, "false", "n x", "middle") + t(XB, y + 34, "believes it", "n x", "middle") + t(XY, y + 34, "says it", "n x", "middle");
      } else if (i === 1) {
        s += link(XW, y, XB, y) + brk(XB, y, XY, y);
        s += t(XW, y + 34, "false", "n x", "middle") + t(XB, y + 34, "knows it's false", "n x", "middle") + t(XY, y + 34, "says it", "n x", "middle");
      }
      [XW, XB].forEach((x) => { s += circ(x, y, 6, "fp s2"); });
      if (i < 2) s += circ(XY, y, 6, "fp s2");
    });

    // scheming: the output splits on believed oversight
    const y = ROWS[2], yu = y - 38, yd = y + 38, XS = XY - 70;
    s += link(XW, y, XB, y) + ln(XB + 7, y, XS, y, "s3");
    s += ln(XS, y, XY - 7, yu, "s3") + ln(XS, y, XY - 7, yd, "s3");
    s += circ(XY, yu, 6, "fp s2") + circ(XY, yd, 6, "fp s2");
    s += t(XY + 18, yu + 6, "watched", "nl") + t(XY + 18, yd + 6, "unwatched", "nl");
    // the gap between the two branches
    gaps += ln(XY - 14, y - 9, XY + 14, y - 9, "ik") + ln(XY - 14, y + 9, XY + 14, y + 9, "ik");
    gaps += ln(XY + 8, y - 18, XY - 8, y + 18, "ik");

    s += `<g class="reveal">${gaps}</g>`;
    return s;
  }
};
