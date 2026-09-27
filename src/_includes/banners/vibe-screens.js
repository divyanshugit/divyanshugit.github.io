// "How Much Can You Vibe?" — the stair of screens.
// The 21-step stair: each step is one step of the build and as tall as the
// Swift in the repo after it (224 → 9,499). Over the four steps that added a
// screen stands a phone showing it, drawn from the app's own screenshots in
// the post: the workout, the progress collage, the body map, the scan review.
// At the top landing, the full workout screen with the app's mark: 82.5 kg for 8,
// its plates computed. The madder stair climbs in, left to right.
delete require.cache[require.resolve("./_vibe-kit.js")];
const V = require("./_vibe-kit.js");

module.exports = {
  slug: "vibe-screens",
  title: "Twenty-one steps, and the screens the app gained on the way up",
  desc: `A staircase of 21 steps climbs from left to right, one per step of the build, each as tall as the lines of Swift after it, up to 9,499 lines and ${V.TESTS} tests. Over the steps that added a screen stand small phones drawn from the app: the workout screen at step 6 with its loaded bar, the progress collage at step 9 (days 1, 121 and 211, minus 8 kg), the body map at step 15 with the chest trained two days ago, and the scan review at step 19 with a CHECK tag. At the top stands the full phone with the Form mark: Barbell Bench Press, set 2 of 3, 82.5 kg for 8, a 20 kg bar with 25, 5 and 1.25 kg plates on each side.`,
  caption: `The app, screen by screen: 21 steps over a weekend, each as tall as the Swift after it. The workout, progress photos, a body map and board scanning on the way up to 9,499 lines and ${V.TESTS} tests.`,
  draw(k) {
    const { t, ln, circ } = k;
    const X0 = 90, X1 = 790, Y0 = 430, YT = 210;
    const { s: base, path, sx, sy, N } = V.stair(k, X0, X1, Y0, YT);
    let s = base;

    // a phone over each named step, on a leader down to its tread
    const MW = 82, MH = 150;
    for (const [c, name] of V.NAMED) {
      const i = c - 1, x = (sx(i) + sx(i + 1)) / 2, y = sy(V.SWIFT[i]);
      const clear = Math.min(y, sy(V.SWIFT[Math.min(i + 2, N - 1)]));
      const py = Math.max(34, clear - 24 - MH);
      s += ln(x, y - 6, x, py + MH + 4, "s3 dt");
      s += V.phone(k, x - MW / 2, py, MW, MH, { kind: name });
      s += t(x, py - 12, name, "n", "middle");
    }
    s += t(X1 - 12, Y0 - 52, "9,499 lines", "nl", "end");
    s += t(X1 - 12, Y0 - 24, V.TESTS + " tests", "n", "end");

    const PX = 860, PW = 190, PH = 400, PY = Y0 - PH, top = sy(V.SWIFT[N - 1]);
    s += V.phone(k, PX, PY, PW, PH, { full: true });
    s += `<g class="reveal">${path}${circ(sx(N), top, 4, "fi")}${ln(sx(N), top, PX - 10, top, "ikt d")}</g>`;
    return s;
  }
};
