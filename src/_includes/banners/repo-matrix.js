// "CodingAgentBench" — the task set's frame, exactly as the proposal lists it:
// 5 languages × 7 repositories = 35 repos, 682 tasks, about 140 per language.
// The marked cell is the proposal's worked example, a django task
// (django/django PR #19331) scored by the repo's own tests going red → green.
const LANGS = [
  { name: "Python", repos: ["vllm", "transformers", "pytorch", "fastapi", "langchain", "pydantic", "django"] },
  { name: "Rust", repos: ["ruff", "polars", "candle", "tauri", "swc", "uv", "axum"] },
  { name: "Go", repos: ["kubernetes", "prometheus", "terraform", "etcd", "docker-compose", "gh-cli", "fiber"] },
  { name: "TypeScript", repos: ["next.js", "vscode", "prisma", "trpc", "excalidraw", "svelte", "shadcn/ui"] },
  { name: "C / C++", repos: ["llama.cpp", "redis", "curl", "jq", "neovim", "tmux", "unleashed-firmware"] }
];
const EXAMPLE = ["Python", "django"];

module.exports = {
  slug: "repo-matrix",
  title: "Five languages, seven repositories each",
  desc: "A grid of 35 repositories: columns for Python, Rust, Go, TypeScript and C/C++, seven production repositories in each, from vllm and django to kubernetes, next.js and llama.cpp. 682 tasks in all, about 140 per language. The django cell is marked: the proposal's example task, judged by the repository's own test suite going from red to green.",
  caption: "682 tasks from 35 production repositories, seven in each of five languages (about 140 tasks per language). Marked: the worked example, a django fix scored by django’s own tests going red → green.",
  draw(k) {
    const { t, rect, ln } = k;
    let s = "";
    const X0 = 24, CW = 200, GAP = 8, Y0 = 96, RH = 44;
    LANGS.forEach((L, i) => {
      const x = X0 + i * (CW + GAP);
      s += t(x, Y0 - 24, L.name, "l");
      L.repos.forEach((r, j) => {
        const y = Y0 + j * RH, ex = L.name === EXAMPLE[0] && r === EXAMPLE[1];
        s += rect(x, y, CW, RH - 8, ex ? "fp" : "fp2");
        if (ex) s += `<g class="reveal">` + rect(x, y, CW, RH - 8, "ik") + `</g>`;
        else s += rect(x, y, CW, RH - 8, "hf");
        s += t(x + 12, y + 24, r, ex ? "ci x" : "c x");
      });
    });
    // the example's verdict, under the grid
    const yb = Y0 + 7 * RH + 26;
    s += ln(X0, yb - 16, X0 + 5 * CW + 4 * GAP, yb - 16, "hf");
    s += t(X0, yb + 14, "django/django #19331", "ci x");
    s += t(X0 + 5 * CW + 4 * GAP, yb + 14, "tests: red → green", "n", "end");
    return s;
  }
};
