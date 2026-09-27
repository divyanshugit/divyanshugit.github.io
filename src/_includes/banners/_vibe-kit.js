// Shared drawing for the "How Much Can You Vibe?" banner (vibe-screens).
// The leading underscore keeps the banner registry from loading it.
//
// The build, step by step: the lines of Swift in the repo after each of the
// 21 steps (224 → 9,499). The first two steps are config and SQL, so the
// stair starts flat. Steps 1–11 were Saturday, 12–21 Sunday.
const SWIFT = [0, 0, 224, 1159, 1293, 2980, 4028, 4590, 6213, 6213, 6213, 6325, 6999, 6999, 7486, 7843, 8273, 8422, 8902, 9464, 9499];
const SAT = 11, TESTS = 68;
const NAMED = [[6, "workout"], [9, "photos"], [15, "body map"], [19, "board scan"]];

// Everything on the screens is from the app's own screenshots in the post:
// the workout screen (Barbell Bench Press, set 2 of 3, last 80 × 8, now 82.5 × 8,
// the 20 kg bar with 25 + 5 + 1.25 kg a side), the progress collage (day 1,
// 121, 211; −8 kg over 30 weeks), the Body tab (front and back, chest trained
// 2 days ago) and the scan review (Block A, a CHECK tag, a Create button).
const BAR = 20, PLATES = [25, 5, 1.25];
const PLATE = { 25: [70, 11], 5: [46, 7], 1.25: [28, 5] };   // [height, width] at a 190-wide phone

// the app's mark: a ring with a dot, then "form"
function logo(k, x, y, r, word = true) {
  const { circ, t } = k;
  return circ(x, y, r, "s2") + circ(x, y, r * 0.38, "f2") + (word ? t(x + r + 7, y + 7, "form", "nl") : "");
}

// a loaded bar centred on (cx, by), f = scale against a 190-wide phone
function loadedBar(k, cx, by, half, f) {
  const { ln, rect } = k;
  let s = ln(cx - half, by, cx + half, by, "s2");
  const sleeve = 48 * f;
  for (const side of [-1, 1]) {
    let px = cx + side * sleeve;
    s += ln(px, by - 12 * f, px, by + 12 * f, "s2");
    for (const kg of PLATES) {
      const [ph, pw] = PLATE[kg].map((v) => v * f);
      s += rect(side > 0 ? px + 2 * f : px - 2 * f - pw, by - ph / 2, pw, ph, kg === 25 ? "f2" : "s2", 1);
      px += side * (pw + 2 * f);
    }
  }
  return s;
}

// a very small person, front or back, with the chest (or back) shaded
function figure(k, x, y, u, shade) {
  const { circ, p, ln } = k;
  let s = circ(x, y - u * 1.05, u * 0.2, "s3");
  s += p(`M${x - u * 0.38},${y - u * 0.78} H${x + u * 0.38} L${x + u * 0.28},${y + u * 0.05} H${x - u * 0.28} Z`, "s3");
  s += ln(x - u * 0.4, y - u * 0.72, x - u * 0.6, y + u * 0.02, "s3") + ln(x + u * 0.4, y - u * 0.72, x + u * 0.6, y + u * 0.02, "s3");
  s += ln(x - u * 0.14, y + u * 0.05, x - u * 0.18, y + u * 0.95, "s3") + ln(x + u * 0.14, y + u * 0.05, x + u * 0.18, y + u * 0.95, "s3");
  if (shade) s += p(`M${x - u * 0.3},${y - u * 0.7} H${x + u * 0.3} V${y - u * 0.42} H${x - u * 0.3} Z`, "f2");
  return s;
}

// the screen each named step added, inside a phone of width w at (x, y)
function screen(k, kind, x, y, w, h) {
  const { t, ln, rect, circ } = k;
  const f = w / 190, cx = x + w / 2, pad = 10 * f + 6;
  let s = "";
  if (kind === "workout") {
    s += loadedBar(k, cx, y + h * 0.5, w / 2 - 6, f);
    s += t(cx, y + h - 22, "82.5 × 8", "n x", "middle");
  } else if (kind === "photos") {
    const g = 3, pw = (w - 2 * pad - 2 * g) / 3, ph = pw * 1.5, py = y + h * 0.3;
    [1, 121, 211].forEach((d, i) => {
      const px = x + pad + i * (pw + g);
      s += rect(px, py, pw, ph, "hf", 2);
      // a progress photo: head and shoulders, the same pose every time
      const hx = px + pw / 2, hr = pw * 0.17;
      s += circ(hx, py + ph * 0.3, hr, "s3");
      s += k.p(`M${(hx - pw * 0.38).toFixed(1)},${(py + ph).toFixed(1)} L${(hx - pw * 0.3).toFixed(1)},${(py + ph * 0.55).toFixed(1)} Q${hx.toFixed(1)},${(py + ph * 0.45).toFixed(1)} ${(hx + pw * 0.3).toFixed(1)},${(py + ph * 0.55).toFixed(1)} L${(hx + pw * 0.38).toFixed(1)},${(py + ph).toFixed(1)}`, "s3");
    });
    s += t(cx, y + h - 22, "−8 kg", "n x", "middle");
  } else if (kind === "body map") {
    const u = w * 0.2, fy = y + h * 0.48;
    s += figure(k, cx - w * 0.2, fy, u, true) + figure(k, cx + w * 0.2, fy, u, false);
    s += t(cx, y + h - 22, "chest · 2d", "n x", "middle");
  } else if (kind === "board scan") {
    s += t(x + pad, y + 44, "block a", "n x");
    [0, 1, 2].forEach((i) => {
      const ry = y + h * 0.4 + i * h * 0.16;
      s += circ(x + pad + 4, ry, 3.5, "f2");
      s += ln(x + pad + 14, ry, x + w - pad - (i === 0 ? 20 : 8), ry, "s3");
      if (i === 0) s += rect(x + w - pad - 16, ry - 5, 16, 10, "s3", 2);
    });
    s += rect(x + pad, y + h - 34, w - 2 * pad, 16, "s3", 8);
  }
  return s;
}

// a phone: outline, island, and either one feature screen or the full workout screen
function phone(k, x, y, w, h, { kind, full = false } = {}) {
  const { rect, ln, t } = k;
  const f = w / 190;
  let s = rect(x, y, w, h, full ? "s2" : "s3", Math.round(26 * f));
  s += rect(x + w / 2 - 26 * f, y + 10 * f, 52 * f, 11 * f, "fr", Math.round(6 * f));
  if (!full) return s + screen(k, kind, x, y, w, h);

  // the workout screen, with the app's mark in its header
  const cx = x + w / 2, L = x + 18, R = x + w - 18;
  s += logo(k, L + 8, y + 50, 8);
  s += rect(R - 44, y + 38, 44, 22, "s3", 11);
  s += t(R - 22, y + 54, "end", "l x", "middle");
  s += t(L, y + 92, "01 / 02 · chest", "l x");
  s += t(L, y + 116, "bench press", "nl x");
  s += ln(L, y + 132, R, y + 132, "hf");
  s += t(L, y + 156, "set 2 of 3", "l x");
  s += t(L, y + 180, "last 80 × 8", "n x");
  s += t(cx, y + 222, "82.5 kg", "r", "middle");
  s += t(cx, y + 248, "× 8", "n", "middle");
  const by = y + 296;
  s += loadedBar(k, cx, by, w / 2 - 10, f);
  s += t(cx, by + 48, `${BAR} + ${PLATES.join(" + ")} a side`, "n x", "middle");
  const bw = (R - L - 18) / 4;
  ["−5", "−2.5", "+2.5", "+5"].forEach((lab, i) => {
    const bx = L + i * (bw + 6), yy = y + h - 46;
    s += rect(bx, yy, bw, 28, "hf", 8);
    s += t(bx + bw / 2, yy + 19, lab, "n x", "middle");
  });
  return s;
}

// the stair, its wash, axis, day split and step ticks
function stair(k, X0, X1, Y0, YT) {
  const { t, p, ln, scale, line } = k;
  const N = SWIFT.length, sx = scale(0, N, X0, X1), sy = scale(0, 10000, Y0, YT);
  let s = "";
  s += ln(X0, Y0, X1, Y0, "h");
  [5000, 10000].forEach((v) => {
    s += ln(X0, sy(v), X1, sy(v), "hf d");
    s += t(X0 - 10, sy(v) + 6, v / 1000 + "k", "n x", "end");
  });
  const pts = [[sx(0), Y0]];
  SWIFT.forEach((v, i) => { pts.push([sx(i), sy(v)], [sx(i + 1), sy(v)]); });
  s += p(line([...pts, [sx(N), Y0]]) + " Z", "w");
  for (let i = 0; i <= N; i++) s += ln(sx(i), Y0, sx(i), Y0 + (i % 5 ? 5 : 9), "h");
  s += ln(sx(SAT), Y0 + 16, sx(SAT), Y0 + 44, "s3 dt");
  s += t((sx(0) + sx(SAT)) / 2, Y0 + 40, "saturday", "l", "middle");
  s += t((sx(SAT) + sx(N)) / 2, Y0 + 40, "sunday", "l", "middle");
  const path = p(line(pts), "ik");
  return { s, path, sx, sy, N };
}

module.exports = { SWIFT, SAT, TESTS, NAMED, logo, phone, stair };
