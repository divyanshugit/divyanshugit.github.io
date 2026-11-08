// "How Much Can You Vibe?" — twenty-one steps to a working app.
// The stair: each step is one step of the build, in order, and its height
// is the lines of Swift in the repo after it (224 → 9,499). The first two steps
// are config and SQL, so the stair starts flat. At the top, the app it climbs
// to: the app's real workout screen, in the same ink. Saturday and Sunday under the axis.
const SWIFT = [0, 0, 224, 1159, 1293, 2980, 4028, 4590, 6213, 6213, 6213, 6325, 6999, 6999, 7486, 7843, 8273, 8422, 8902, 9464, 9499];
const SAT = 11;                      // steps 1–11 on Saturday, 12–21 on Sunday
const TESTS = 68;
const NAMED = { 6: "workout", 9: "photos", 15: "body map", 19: "board scan" };

// ---------- the real image, printed in the page's own ink ----------
// app-workout.jpg: the app's real workout screen, greyscale.
// A duotone filter maps its darks and lights onto the page tokens, so it
// sits in the paper in Day and Night proof. The page links the file; the
// social card (librsvg can't fetch URLs or resolve var()) gets it inline,
// with the Day proof hex values.
const APP = "/blog/assets/form/app-workout.jpg";
const DAY = { text: "#211D18", text2: "#574E44", paper: "#F5F1E8", paper2: "#EEE8DB" };
function href(k, file, mime) {
  if (!k.uid.startsWith("og-")) return file;
  const fs = require("fs"), path = require("path");
  return `data:${mime};base64,` + fs.readFileSync(path.join(__dirname, "../..", file)).toString("base64");
}
// out = lo + (hi − lo) · L, per channel, keeping the image's own alpha
function duotone(id, lo, hi, og) {
  const fl = (c, v) => og ? `<feFlood flood-color="${v}" result="${c}"/>` : `<feFlood class="${c}" result="${c}"/>`;
  return `<filter id="${id}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">`
    + `<feColorMatrix in="SourceGraphic" type="saturate" values="0" result="g"/>`
    + fl("lo", lo) + fl("hi", hi)
    + `<feComposite in="g" in2="hi" operator="arithmetic" k1="1" result="a"/>`
    + `<feComposite in="g" in2="lo" operator="arithmetic" k1="-1" k3="1" result="b"/>`
    + `<feComposite in="a" in2="b" operator="arithmetic" k2="1" k3="1" result="c"/>`
    + `<feComposite in="c" in2="SourceAlpha" operator="in"/></filter>`;
}

module.exports = {
  slug: "vibe",
  title: "Twenty-one steps up to a working iOS app",
  desc: "A staircase of 21 steps climbs from left to right, one per step of the build. Each step's height is the lines of Swift after it: flat for the first two setup steps, then rising through the workout screen and photos on Saturday, and the body map and board scanning on Sunday, to 9,499 lines and 68 tests. At the top stands a phone showing the app's real workout screen: Barbell Bench Press, 82.5 kg for 8, the loaded bar drawn below.",
  caption: "Claude Code and 21 steps over a weekend. Each step is as tall as the Swift in the repo after it, up to 9,499 lines, 68 tests and an app that runs on my phone.",
  draw(k) {
    const { t, p, ln, rect, scale } = k;
    let s = "";
    const N = SWIFT.length;
    const X0 = 90, X1 = 800, Y0 = 430, YT = 120;
    const sx = scale(0, N, X0, X1), sy = scale(0, 10000, Y0, YT);

    // the app screen follows the tokens, so it turns into a dark-mode screen at night
    const og = k.uid.startsWith("og-"), U = k.uid;
    if (!og) s += `<style>#${U}-fapp .lo{flood-color:var(--text)}#${U}-fapp .hi{flood-color:var(--paper)}</style>`;
    s += duotone(`${U}-fapp`, DAY.text, DAY.paper, og);

    // quiet grid: 0, 5k, 10k lines
    s += ln(X0, Y0, X1, Y0, "h");
    [5000, 10000].forEach((v) => {
      s += ln(X0, sy(v), X1, sy(v), "hf d");
      s += t(X0 - 10, sy(v) + 6, v / 1000 + "k", "n x", "end");
    });
    s += t(X0, YT - 30, "lines of swift", "l x");

    // the stair: one riser and tread per step, washed underneath
    const pts = [[sx(0), Y0]];
    SWIFT.forEach((v, i) => { pts.push([sx(i), sy(v)], [sx(i + 1), sy(v)]); });
    s += p(k.line([...pts, [sx(N), Y0]]) + " Z", "w");
    s += `<g class="reveal">` + p(k.line(pts), "ik") + `</g>`;

    // step ticks, the day split and a few named steps
    for (let i = 0; i <= N; i++) s += ln(sx(i), Y0, sx(i), Y0 + (i % 5 ? 5 : 9), "h");
    s += ln(sx(SAT), Y0 + 16, sx(SAT), Y0 + 44, "s3 dt");
    s += t((sx(0) + sx(SAT)) / 2, Y0 + 40, "saturday", "l", "middle");
    s += t((sx(SAT) + sx(N)) / 2, Y0 + 40, "sunday", "l", "middle");
    s += t(sx(0), Y0 + 62, "step 1", "n x");
    s += t(sx(N), Y0 + 62, "21", "n x", "end");
    for (const [c, name] of Object.entries(NAMED)) {
      // the name sits above its tread, lifted clear of the next step's riser
      const i = +c - 1, x = (sx(i) + sx(i + 1)) / 2, y = sy(SWIFT[i]);
      const ly = Math.min(y, sy(SWIFT[Math.min(i + 1, N - 1)])) - 30;
      s += ln(x, y - 6, x, ly + 8, "s3 x");
      s += t(x, ly, name, "n x", "middle");
    }

    // where the stair ends up, set in the wash under the top step
    s += t(X1 - 12, Y0 - 52, "9,499 lines", "nl", "end");
    s += t(X1 - 12, Y0 - 24, TESTS + " tests", "n", "end");

    // a phone on the landing: the app's real workout screen
    const PX = 860, PW = 190, PH = 380, PY = Y0 - PH;
    const top = sy(SWIFT[N - 1]);
    s += ln(sx(N), top, PX - 14, top, "s3 d");
    s += `<clipPath id="${U}-scr"><rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" rx="24"/></clipPath>`;
    s += `<image href="${href(k, APP, "image/jpeg")}" x="${PX}" y="${PY}" width="${PW}" height="${PH}" preserveAspectRatio="xMidYMin slice" clip-path="url(#${U}-scr)" filter="url(#${U}-fapp)"/>`;
    s += rect(PX, PY, PW, PH, "s2", 24);
    return s;
  }
};
