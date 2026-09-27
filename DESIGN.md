# DESIGN.md — "The Annotated Self"

The site is set like a working manuscript that has been reviewed. There is one column of plain first-person prose, and a quiet margin holds notes, sources and plates. One ink colour marks the reviewer's hand. A real privacy budget (ε) can release the portrait, the place photos and one line of particulars under Laplace noise. It never touches the prose.

This file is the contract for anyone building pages on the system.

---

## 1. Files

| What | Where |
|---|---|
| Shared tokens, type, grid, notes, plates, lists, colophon, ε instrument | `src/css/site.css` (**do not put page styles here**) |
| Per-page styles | `src/css/pages/<page>.css`, loaded with front matter `pageCss: <page>.css` |
| Per-page scripts | front matter `pageJs: [/js/<page>.js]` (automatically cache-busted) |
| Shared behaviour (theme, note layout, leaders, "on this page", plate linking) | `src/js/site.js` → `window.site` |
| Privacy budget engine | `src/js/eps.js` → `window.eps` |
| "Ask this site" guardrail + redirects (home only) | UI `src/js/probe.js`; shared pipeline `src/js/probe-core.js` (browser fallback + server); index built by `src/search-index.11ty.js` → `/search-index.json`; composed-answer facts in `src/_data/probe.js` |
| Guardrail API (server) | `api/ask.mjs` (Vercel Function) → `api/_lib/` (guardrail, Model2Vec, canary); private attack bank `data/attack-bank/`; model `models/potion-base-8M/`; KB built by `scripts/build-embeddings.js` → `api/_kb/`; eval `eval/`; write-up `docs/guardrail.md` (§ 12) |
| Layout shell | `src/_includes/base.njk` |
| The mark (favicons, masthead, social cards) | `src/js/dmark.js`, `src/assets/logo.svg` + icons, `src/site.webmanifest` (§ 6c) |
| Masthead / side rail | `src/_includes/partials/masthead.njk` (nav from `site.nav`: **Home · Publications · Projects · Blog · Timeline · About**) |
| Colophon + List of Plates | `src/_includes/partials/colophon.njk` |
| Plate macros | `src/_includes/partials/plates.njk` |
| Home (a short index) | `src/index.md` (bio, one-liners) → `src/_includes/home.njk` + `css/pages/home.css` |
| About (the full manuscript: prose, places, work history, stories) | `src/about.md` → `src/_includes/about.njk` + `css/pages/about.css` + `js/about.js` |
| Contact icon row | `src/_includes/partials/links.njk` (fed by `site.links`) |
| The longer "stack" essay, spare copy | `src/_includes/content/the-stack.md` |
| Site facts, nav, links | `src/_data/site.js` |
| Places (plates and journey) | `src/_data/places.js` |
| ε facts | `src/_data/particulars.js` |
| Work history (About §3, probe work answers) | `src/_data/work.js` |
| Server-side views of `src/data/*.js` | `src/_data/pubs.js`, `projs.js`, `news.js` |
| Place photo pipeline | `scripts/places-images.js` (runs on `eleventy.before`) |
| Blog banner plates + social cards | `src/_includes/banners/`, `scripts/og-images.js` → `src/assets/og/` (§ 11) |
| The ink portrait (Fig. 1 on Home and About) | `src/_includes/partials/portrait-ink.njk` (inline SVG) + `.ink` in `site.css` + `js/ink.js` (draw-in) + `js/eps.js` (noise) (§ 6b) |

**Legacy stylesheet.** Every page is on the new system except `/proposal/*`, which uses `page.njk` with `legacyCss: true` and `extraCss: [proposal.css]`. **Leave `legacyCss` on page.njk** so the proposals keep rendering exactly as before. (A new layout never sets `legacyCss`; it sets `pageCss`.)

**Prism.** Code highlighting loads `prism-autoloader` with `data-autoloader-path="/js/vendor/components/"`; the grammars actually used are vendored there (bash, clike, go, json, python, yaml). Add a file there when a post uses a new language.

`base.njk` also supports `hasMath` (MathJax 3), `hasCode` (Prism), `extraCss`, `description`, `bodyClass`, `pageCss` and `pageJs`.

---

## 2. Tokens (`:root` in site.css)

Day proof (light) and night proof (dark) are designed separately. Dark is set under `@media (prefers-color-scheme: dark)` with `:root:not([data-theme="light"])`, and again under `:root[data-theme="dark"]`. The toggle only stores an explicit choice; on a first visit the system preference wins.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | #F5F1E8 | #191612 | page |
| `--paper-2` | #EEE8DB | #221E19 | code, image wells |
| `--mount` | #FBF8F1 | #2A251F | plate border |
| `--text` | #211D18 | #E8E0D1 | body |
| `--text-2` | #574E44 | #B3A895 | secondary (7:1+) |
| `--text-3` | #6E6558 | #8F8577 | meta, labels (≥4.5:1) |
| `--rule` / `--rule-2` | ink 14% / 32% | cream 12% / 30% | hairlines |
| `--ink` | #8F3E2F | #D99580 | **the one annotation colour**: note numbers, labels, § marks, noised facts, the seal |
| `--ink-wash` | ink 9% | ink 10% | highlights |

**Type.**
- Instrument Serif (`--serif`) for display, headings (h1–h3, all roman), italic accents (`cite`, `em` in notes, plate names, maths) and the About drop cap.
- Source Sans 3 (`--text-font`) for running text; the same face as `--sans` for margin notes, captions and UI, and as `--sc` (class `.lab`) for labels, which are set uppercase and tracked (`letter-spacing: .1em`, weight 500), not in small caps.
- IBM Plex Mono (`--mono`) for code, the probe quote and the ε readout only.
- EB Garamond and Alegreya are no longer used by the site (the proposal pages keep their own fonts via `css/legacy-fonts.css`).

Loaded in `css/fonts.css`. The proposal pages also get `css/legacy-fonts.css`.

**Type scale.**
- Body `--fs-body` 19px / `--lh-body` 1.72, lining figures. Blog posts use 19px/1.75.
- `--fs-lede` 1.5rem · `--fs-h1` clamp(3.3→5rem) · `--fs-h2` clamp(1.55→2.05rem) roman · `--fs-h3` 1.6rem roman · `--fs-note` 15px · `.lab` .78rem.

**Spacing.** `--s1`…`--s10` = 4 8 12 16 24 32 48 72 112 160.

**Motion.** `--ease` cubic-bezier(.22,.61,.36,1). Everything collapses under `prefers-reduced-motion`.

---

**Page heads (one system).** Every page title is `<section class="sheet page-head">` with:
- an eyebrow `.over.lab` written **"Page · qualifier"** (`Blog · 9 posts, 2024–2026`, `Timeline · 13 entries, 2020–2026`, `Publications · works cited, in full`; a post: `Blog · <series · part n of m>` or `Blog · <first tag>`); separators are `<span class="sep">·</span>`;
- the h1 at `--fs-h1-index` (clamp 2.9 → 4.3rem); a single post adds `.page-head--post` → `--fs-h1-post`;
- an optional `.dek` (italic, `--fs-dek` 1.45rem, 1.24rem ≤720px).
Pages may override only the bottom padding. Section heads use `--fs-h2` = clamp(1.55rem, 1.15rem + 1.3vw, 2.05rem), balanced; posts use the same token.

## 3. Grid

```
≥1240px   [ side rail 216 ] [ gutter | main 36rem | gap | rail 16.5rem ]
1081–1239 [ running head on top ] [ gutter | main | gap | rail ]
≤1080     one column (max 44rem); § numbers inline; notes unfold under their paragraph
≤760      two-row masthead, not sticky; 20px side padding
```

- `.sheet` is one band of the page. Its children:
  - `.gut`: section number, e.g. `§ 3<span>works cited</span>`
  - `.body`: the text column; notes lift out of it into the rail
  - `.wide`: spans main, gap and rail
  - `.sec__rule`: a hairline across the band
- Add `.sec` for the standard section spacing.
- **"On this page"** in the side rail is built automatically from any element with `id`, `data-toc="Label"` and `data-toc-no="§1"`. It has scroll-spy.

Prose paragraphs directly inside `.body` or `.prose` are set book style: each paragraph after the first is indented, with no gap between paragraphs. Use `.noindent` to opt out.

---

**Where I've worked (About §3).** `src/_data/work.js` holds `entries` (id, org, alias, role, kind `work | research | open-source | education`, `remote`, `where` = the company's city or, if the CV gives only that, its country, `placeId` for one of the plates, `start`/`end` as `YYYY-MM`, 1–3 first-person `lines`), a `service` row (reviewing) and `groups` (Work and research · Open source · Education; newest first; `showYear` prints the gutter year only when it changes). About renders a ledger: start year in the gutter, organisation in Instrument Serif, the lines, and role · dates · place as a `.note--meta.note--cv` margin note (hidden ≤1080px, where the same facts print as the `.cv__meta` line under the name). A place with a plate becomes a `.cv__pin` ("Pl. V Bangalore"; numerals are computed from `order`, never typed) linking to `#place-<id>`; it carries `data-place`, so hovering it lights the plate. Each row is `id="w-<id>"`. The CV's facts only; client names stay off the page.

## 4. Margin notes

**From markdown (preferred).** Write standard footnotes. They render as margin notes.

```md
Guardrails are not free.[^nfl]

[^nfl]: see | [<cite>No Free Lunch with Guardrails</cite>](https://arxiv.org/abs/2504.00441) <span class="venue">arXiv, 2025</span>
```

- The optional `label |` prefix becomes an ink label (uppercase, tracked). Use one of: see, source, checked, in progress, reviewer, erratum.
- `<span class="venue">` makes a quiet second line. `<span class="dry">` sets an italic aside.
- Keep notes sparse: one or two per paragraph at most.

**Rendered markup** (also usable by hand):

```html
…text<button class="m" id="snref-X" aria-controls="sn-X" aria-expanded="false">1</button></p>
<aside class="note" id="sn-X" data-anchor="snref-X"><div class="note__in"><span class="n">1</span><span class="lab">see</span>…</div></aside>
```

- **Any element can be an anchor.** Give it an `id` and point `data-anchor` at it. Use `data-top="4"` to pin the note's top to the anchor's top.
- **Wide screens.** `site.js` places each note at its anchor's line and pushes it down only as far as needed to clear the note above. Hovering draws a hairline leader through the gutter.
- **Narrow screens.** Tapping the marker unfolds the note under the paragraph. `.note.always` stays open.
- **Markerless notes (the rule).** A note that no `.m` marker points at has nothing to tap on narrow screens, so `site.js` (`markAlways`, run from `bind()`) gives it `.always` automatically. Three kinds are the exception and are **hidden** at ≤1080px, because the page prints an inline fallback for them: `.note--meta` (post date/reading/tags → the `.meta` line), `.note--plate` (Timeline plate thumbnails) and `.note--eps` (the About ε note → the inline ε dock). A new markerless note needs no class; add one of those three only if you also print its fallback.
- **After changing the DOM.** Call `window.site.placeNotes()` (or `site.schedule()`), and `site.bind()` for new markers.
- **`[1,2]`-style inline references** in older posts still become `#refN` links (the markdown-it rule plus the `fixReferences` transform). `generateReferences` is unchanged.

---

## 5. Plates and places

`src/_data/places.js` is the only source for the plates on Home (a row of thumbnails) and About (the full gathering, stories and photo sets). The Timeline links to About for places. Each entry has:
- `id`, `name`, `local` (local-script name), `order`
- `photos[]`: 1–3 of `{ file, alt, caption, focus }`; the first is the lead plate. `caption` is short and factual, "Place · Mon YYYY" ("Kelingking Beach, Nusa Penida · Sep 2026"). `focus` is an `object-position` ("x% y%", default "50% 50%"): the point kept in frame when a plate is cropped
- `caption`, `story` (markdown), optional `role` and `years`
- `placeholder` (the CC photo, its `focus` and its credit)
- `levels` (the ε generalisation hierarchy)

The data file resolves `shown[]` (each with `orient` p/l/s from its pixel size, `focus`, `width`/`height`), `isSet`, `plate` (Roman numeral, from `order`), `own` (has the author's photos), `layout` (one orientation letter per photo, e.g. `"pp"`, `"pl"`) and `credit`. `credit` is null when you use your own photos.

**Order.** Berai, Patna, Kolkata, Delhi, Bangalore, Singapore, Malaysia, the Philippines, Bali (Pl. I–IX). Change `order` only; numerals, work.js pins, Timeline plates, the search index ("in this order: Berai (Sarai, Bihar), Patna, …": only the first place carries its region) and the credits line follow. Two prose lists are hand-written and must be kept in step: `about.md` (journey) and `index.md` (`placesLine`).

**Portrait and landscape.** Most of the author's prints are upright (3:4); placeholders are 2:1. Plates carry `plate--p | plate--l | plate--s` and `--focus`, and each page crops to a fixed shape with `aspect-ratio` + `object-fit: cover` (the ε canvas follows the same crop and focus):
- Home thumbnails: all 4:5, nine in a row (3 × 3 at ≤720px).
- Timeline margin plates: all 4:5, 7.6rem wide.
- About gathering: uprights 4:5, landscapes 3:2, on a 10-track grid (two tracks each): five across, then a row of four set half a plate in (`:nth-child(5n+1):nth-last-child(4)`); landscapes sit lower, toward an upright's middle. At ≤1080px two columns, with an odd last plate centred.
- The leaf never crops. It lays out from `layout`: `l` full width; `p` one upright at 60%; `pp`/`ppp` a tipped-in pair or row, the second print stepped down; `pl`/`lp` an upright beside a landscape aligned low (stacked on phones, the landscape tipped in over the upright's lower edge).
Set `focus` by eye: look at the Home thumbnail and the About plate at 1440 and 390.

**Credits.** A place with its own photos has no `credit`, so it drops out of the List of Plates. The colophon prints "Plates I–II, VI–IX: photographs by the author" from the `plateRanges` filter (consecutive plates become a range), then "All plates cropped and lightly graded." The CC credits stay listed for every placeholder that remains.

Macros (`{% import "partials/plates.njk" as plates %}`):
- `plates.plate(p, { rot: "-1deg", open: true, id: true, eager: true })`: `id: true` gives the figure `id="place-<id>"` (use it once per page: About's gathering, so `/about.html#place-<id>` lands on the plate and opens its leaf; Home's thumbnails link there); `eager` skips lazy loading. The plate itself is tipped in with its caption; with `open: true` and a story or photo set it becomes a button that opens the "leaf" on About.
- `plates.entry(p)`: photo(s), caption and the story as a margin-style note. **Reuse it wherever a place needs its full entry.** It reads well empty or with 3–5 sentences. On About it fills the "leaf" that opens under the gathering.
- `plates.photo(ph, sizes)`: one responsive `<picture>`.

**Blank plates.** A place with neither `photos` nor a `placeholder` is set as a blank plate: the name in Instrument Serif on `--paper-2`, a hairline frame, and "photograph to come" (dropped below 150px wide). The name carries `data-f="place-<id>"`, so it generalises with ε like the caption. `plates.photo()` renders it from `shown[0].blank`; nothing is credited.

### Places: drop-in photos (for Divyanshu)

1. Export JPEG or PNG from Photos. **HEIC is not supported**, so use *File → Export → JPEG*.
2. Name them `<place-id>-1.jpg`, `<place-id>-2.jpg`, `<place-id>-3.jpg` (for example `kolkata-1.jpg`). Put them in `src/assets/places/originals/`. That folder is **git-ignored**, so originals with EXIF/GPS never get committed.
3. In `src/_data/places.js`, for that place:
   ```js
   photos: [{ file: "kolkata-1.jpg", alt: "The ghats below Howrah Bridge at 7am." }],
   story: "A few sentences in your voice. *Markdown* works.",
   ```
   Then **delete the `placeholder` block** for that place. Its CC credit then drops out of the List of Plates automatically.
4. Run `npx eleventy`. The build:
   - auto-orients each photo, caps it at 2400px and applies a very light grade (saturation .95, no contrast curve, so night shots are left alone); the page's `--photo-filter` is the one shared grade every plate gets. `GRADE` in the script is recorded in `manifest.json`; bump it when the recipe changes and every master is rebuilt
   - **strips all metadata**, and verifies this on every master and every variant (sharp metadata plus a byte scan for `Exif` and XMP), refusing to keep a file if anything survives
   - writes a clean master to `src/assets/places/masters/<id>-<n>.jpg`, plus `manifest.json`
   - writes 360w, 720w and 1200w AVIF and WebP to `<output>/assets/places/` (the configured or `--output` directory: 360w serves thumbnails, 720w the About plates, 1200w the leaf)

   **Commit the masters**, never the originals. CI rebuilds the variants from the masters.
5. The ε mechanism works on every plate: the lead photo wherever it appears, and every photo of a set in the leaf (`about.js` calls `eps.scan(leaf)` after cloning the template). Below ∞ the leaf's per-photo captions (`.ph-cap`) hide along with the plate's `.cap`.

**Check before committing masters:** `exiftool -r -gps:all -exif:all -xmp:all src/assets/places/masters` must print nothing.

---

## 6. ε: the privacy budget

**Scope (hard rule).** ε touches only three things:
- the portrait, `[data-eps-img][data-eps-mode="anon"]` (now the ink drawing, § 6b: its strokes are shaken, not its pixels)
- the place plates, `[data-eps-img][data-eps-mode="print"]`, including their caption name
- one line of releasable particulars (`.particulars`, the `data-f` spans): Home uses `particulars.homeLine`, which holds only facts the bio above it does not state (where he is from, B.Tech Kolkata 2022, research since 2020), so a noised line never contradicts the prose; About uses the full `particulars.line`
- **One instrument per group in the DOM.** `<div data-eps-instrument data-eps-docks="hero">` lives in `[data-eps-dock="hero-wide"]` (the rail) and `eps.js` moves it into `[data-eps-dock="hero-narrow"]` (inline) at ≤1080px; an empty dock hides itself (`.eps-slot:empty`). A single instrument (e.g. beside a blog figure) needs no docks.

Never body prose. The default is ∞.

**Releasable particulars.**
- Facts live in `src/_data/particulars.js` and are exposed as `window.EPS_FACTS`.
- A categorical fact has `levels`, most specific first. It drops ⌊|z|·(1/ε)·1.6⌋ levels.
- A numeric fact has `{ value, delta, round, exact }` and releases value + z·Δ/ε.
- Each fact has one seeded unit-Laplace draw z. It is stable and monotone in ε.
- Every place is also a fact, `place-<id>`.

**Markup.**
```html
<span class="f" data-f="from">Berai, Sarai, Bihar</span>
<figure class="plate" data-eps-img data-eps-mode="print" data-eps-w="480"> … <img> … </figure>
<div data-eps-instrument data-hint="optional hint text"></div>   <!-- the instrument -->
<span data-eps-out></span>      <!-- prints the current ε -->
<span data-eps-read="anon"></span> <!-- "12px blocks · grain σ≈40" -->
```

- At ∞ the real `<img>` shows.
- Below ∞ a canvas is created on demand over it, drawn at `data-eps-w` px.
- `html[data-eps="finite"]` hides the identifying caption detail: local script, landmark and role.

**JS API** (`window.eps`):
```js
eps.get()                          // current ε (Infinity at ∞)
eps.set(0.3, { animate: true })    // or eps.set(Infinity); kept for this session only (sessionStorage 'eps.t'), so a returning visitor starts at ∞
const off = eps.subscribe(e => …)  // called now and on every change; returns unsubscribe
eps.release({ id: 'my-count', value: 1000, delta: 1 })  // value + z·Δ/ε, stable per id
eps.laplace(u), eps.hash(str), eps.fmt(e), eps.describe(e, W, mode)
eps.scan(root)                     // register [data-eps-img] added after load (e.g. a cloned leaf)
document.addEventListener('eps:change', ev => ev.detail.eps)
```

The DP blog posts can drive a live figure with `eps.subscribe`, and can put a second `[data-eps-instrument]` beside the figure (all instruments stay in sync).

**Testing.** Use `?eps=0.3` or `?eps=inf`.

**Discoverability.** One soft pulse of the ε glyph, 1.2s after load, once per session, and never under reduced motion. The releasable facts carry faint dotted underlines.

---

## 6b. The ink portrait

Fig. 1 on Home and About is an ink line drawing of the author, made from his selfie (the wink and the grin are the point; keep them). It is an inline SVG of **strokes only** (no fills), 800 × 1200 (2:3, the old plate ratio), set in the same tipped-in plate and photo corners. Caption: `figCaption` in `index.md` / `about.md`; alt text: the `aria-label` in the partial (overridable with `inkAlt`).

- **Markup.** `{% include "partials/portrait-ink.njk" %}` inside `.plate__img`. Strokes are grouped `<g data-g="face|eyes|nose|mouth|beard|hair|collar|cord|bg">` **in drawing order**, and inside each by pen: `k` contour, `d` detail, `f` fine (hair, beard, creases), `ik` the one madder element (the cord necklace), `bg` two gestural sprigs of leaves. No sizes or colours in the file: `.ink` in `site.css` sets the pen widths and uses `currentColor` (= `--text`) and `--ink`, so Day and Night proof apply.
- **How it was made.** The DNG was cropped to head and shoulders; GrabCut gave the silhouette (hair, cheek, ear, neck and shoulders are smoothed runs of it); the features (eyes and the wink, brows, nose, mouth, smile folds, collar, cord) were placed by hand on gridded zooms of the photo and fitted with centripetal Catmull-Rom → cubic Béziers; hair, beard and moustache texture are short strokes placed by Poisson-disk sampling where the photo is dark, oriented by the photo's structure tensor blended with a combing prior. It was then curated by eye against the photo. The generator lives outside the repo (it needs the raw photo); **edit the partial by hand** for small changes. About 23 KB (9 KB gzipped), ~450 paths, integer coordinates.
- **Draw-in (`js/ink.js`).** On the first view in a session (`sessionStorage 'ink.drawn'`) the strokes draw themselves with `stroke-dashoffset` over ~2.35 s: face outline, eyes (the wink), nose, mouth and grin, beard, hair, collar, cord, leaves. Each group has a time slot; inside it strokes follow one another in proportion to their length. `pathLength="1"` is set by the script (not in the markup). `<head>` adds `html.ink-pending` only when the drawing will animate, which hides it until `ink.js` arms it (no flash), with a 3 s CSS failsafe. It starts when 35% of the figure is in view. **No JS or reduced motion: it is simply there, fully drawn.** Afterwards the inline styles are removed and it is a static SVG.
- **ε.** `eps.js` recognises a portrait host containing `svg[data-ink]`. Each stroke anchor has one fixed seeded unit-Laplace draw per axis, and each feature group one more: anchor += z·min(60, 4.5/ε), group += z·min(48, 3/ε), in drawing units. Béziers keep their handles with their anchors, so lines get shakier without kinking; short texture strokes take most of it as one piece. Below ε = 0.2 the shaken drawing is also rasterised (in the page's colours; repainted on a theme change) into the same coarse blocks as the photos, on the usual `.eps-canvas`. At ∞ the published paths are restored exactly. `eps.describe(e, W, 'ink')` → "pen jitter σ≈11px" (in px of a 400 px plate), with "Npx blocks ·" below 0.2.
- **Old portrait.** `src/assets/pic.*` and `/assets/optimized/pic-*` are kept but no longer referenced. No social card uses a portrait.

---

## 6c. The mark

The mark is a **D released under differential privacy**. The D is sampled into rows. Each row's width is a count, and the mark shows that histogram released through the Laplace mechanism: exact everywhere except one row, drawn in madder.

**Construction** (`src/js/dmark.js`, `render()`; compute, never redraw by hand).
- **Rows.** 6 rows (the 16px cut has 5). The outline is a D with a superellipse bowl (p = 2.1). Each row covers the D across its band: the outer edge is sampled near the waist and the counter edge far from it, so the shoulders stay heavy and the counter stays open. The stem is a touch heavier than a row (×1.18).
- **Release.** A row's released width is w + z·Δ/ε. One unit is 1/32 of the box and Δ = 1 unit. Each row has one fixed unit-Laplace draw z, made with the same `hash` and `laplace` as `eps.js` and the seed tag `dvynsh-mark/142/row`. The noise is soft-clipped to ±0.16 W (tanh), so the D never leaves its box; clipping after the mechanism is post-processing, so the release stays ε-DP.
- **Variant b.** Only row 3 is released: the bowl row with the largest draw (z = +1.87). The rest are exact.
- **The static mark** (favicon, touch icons, social cards) is the release at **ε = 0.5** (b = 2 units).

**Cuts.** Everything is snapped to whole pixels at its size (`shape-rendering: crispEdges`). Rows and gaps come from the size: 4px rows and 1px gaps at 32px, 3px rows at 26px, 2px rows at 22px. The **16px cut is set by hand**: 5 rows, a continuous stem and short bowl pieces against the right side (long pieces read as an E). Use the cut made for the size; never scale one cut to another size.

**Files.**

| What | Where |
|---|---|
| Module: `render`, `mount`, auto-mount of `svg[data-dmark]` | `src/js/dmark.js` (loaded after `eps.js` in `base.njk`) |
| Build-time exact D inside an `<svg data-dmark>` | shortcode `{% dmark <size>, "<class>" %}` in `.eleventy.js` |
| Favicon (16px cut, follows the OS theme) | `src/assets/logo.svg` |
| ICO fallback (16 + 32), touch and app icons | `src/assets/favicon.ico`, `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png` |
| Manifest | `src/site.webmanifest` |
| Social cards | `mark()` in `scripts/og-images.js` (56px on `site.png`, 48px on post cards) |

**Live behaviour.** In the masthead the mark follows the page's ε. At ∞ (the default) it is the exact D in ink. Below ∞ row 3 turns madder and grows by z·Δ/ε. The draws are fixed, so the row moves steadily as ε changes and never flickers. The mark has no animation of its own: it redraws when ε changes, and ε's own tween already stops under reduced motion. It is `aria-hidden`; the name beside it is the link text.

**Usage.**
- Ink `--text` with the one `--ink` row. Never recolour the rows, add a second accent, outline it or put it on a photo.
- Clear space: one row pitch on every side (5px at 32px). The mark sits to the left of the name (the name in Instrument Serif, title case; two lines in the rail), never inside running text.
- Minimum size 16px, and only with the 16px cut.
- The madder row is always row 3. Don't move it, and don't animate the mark apart from its ε redraw.

## 7. "Ask this site" (home page)

**Position.** The probe lives on Home only, as one quiet input line under the bio and the contact icons; the label, the three Try suggestions and the tally appear on focus (the field's rule inks and thickens as its focus state). About carries a one-line link to it, not a copy. No LLM anywhere. It asks `POST /api/ask` first and falls back to the same pipeline in the browser (one JSON file) when the API is unreachable (§ 12).

- **Index.** `src/search-index.11ty.js` writes `/search-index.json` at build time from: about.md prose (lede → `#top`, §1 → `#work`, journey → `#places`), places (role/caption and stories → `#place-<id>`, which opens the plate on About), publications (title + home-page gist, keywords from venue/tags/abstract → `/publications.html#<id>`), projects (`#<id>`), blog posts (title, description, tags), timeline items (`#<news id>`), contact and CV. Entry shape: `{ t, k, u, s: "Page · label", g: group }`. Work rows (`work.js`) go in as group `work` → `/about.html#w-<id>`. Sentence URLs carry a text fragment (`#work:~:text=…`) so the browser highlights the exact sentence on arrival.
- **Profile.** `src/_data/probe.js` builds the facts that identity answers are composed from: role and org (`site.js`), previous roles and the model count (`particulars.js`), the research focus (index.md `display`/`description`), capability bullets with their papers (`publications.js`), what is on the desk now (index.md `now`, active projects), `work` (every row of `work.js`, with its About anchor) and contact (`site.links`, `emailObf`). Each item names a `phrase` that must appear verbatim in about.md or index.md; if the prose changes, the build prints `[probe] dropped …` and leaves the item out. It is written into the index as one `{ g: "profile", p }` entry. Edit the prose or the data files, not the JS.
- **Answering.** The index is fetched on first focus. A question is split on `?`, newlines and "and"/"also" before a question word into up to 3 parts, each answered in order under one reply ("Who is Divyanshu? and what can he do?" gets two labelled blocks). `INTENTS` catch identity questions (who / what does he do / what does he work on / skills / hiring / contact) and work questions (`at`: "what did he do at IISc?", fires only when an org alias from `work.js` is named; `intern`: "did he intern anywhere?"; `worked`: "where has he worked?") and compose a short reply from the profile: 1–3 sentences or a short list, each bullet linked to its evidence. Everything else goes through `TOPICS`, which route to groups (papers, blog, places, projects, timeline, contact, about); `strong: 1` marks explicit page words ("papers", "blog") that dominate, and when the question also names a subject, an entry must match the subject, not just the group. The reply leads with the answer: the matching sentence, quoted as written, or a list of matching items; "No papers on the site match that. The closest:" when a named kind has no match. Then one compact **Sources** line (first 3 destinations, "and N more" for the rest) and "nothing was generated". A part with no grounding says so; if nothing is grounded the whole reply is a polite decline with Try suggestions.
- **Arrival.** `site.js` flashes the target on any page reached with `#anchor` (by `id`, or `data-id` on legacy pages). With a text fragment, the browser's own highlight (`::target-text`, styled in ink) is used instead. **Inner-page builders: give every paper, project and timeline item `id="<data id>"`** so these links land exactly.
- **Attacks.** `ATTACKS` holds one object per family (regex, policy number, dry line, paper). Obfuscation (base64/hex/leet/rot13) is decoded first. A refusal gets the redaction sweep, the seal, the attack-family margin note, and "view the rule" (the exact regex plus the matched text). The tally counts probes, refusals and leaks. Under reduced motion everything is instant.

---

## 8. Contact links and email

`partials/links.njk` renders the icon row from `site.links` (`icon`, `label`, `url`). It is used on Home, About and the colophon.
- Brand glyphs (Google Scholar, GitHub, LinkedIn, X) are Simple Icons paths, inlined and unmodified. Email and CV are line icons drawn to match.
- Icons are 19px inside 40px hit targets, use `currentColor`, and take the ink on hover/focus. An uppercase, tracked tooltip appears without shifting the layout. Each link has an `aria-label`.
- **The address never appears in HTML or JSON.** Links carry `data-email="name [at] domain [dot] com"`, and `site.js` builds the `mailto:` on first hover, focus or tap. The no-JS fallback is `/about.html#contact` (the colophon row). Use the same pattern in prose: `<a href="/about.html#contact" data-email="…">write to me</a>`.

## 9. Conventions for inner-page builders

- Keep the margin sparse and the ink quiet. Redaction never hides content people need.
- Use `.works` / `.work` for bibliographies (`authorList` bolds the self-name) and `.list` for posts and projects. Use the `.more` link style for "All N … →".
- **Nunjucks filters:**
  - text and markdown: `md`, `mdInline`, `cleanTitle` (drops emoji and trailing `[…]` notes), `placeSpans(places)`, `stripHtml`, `json`
  - lists: `limit`, `where(key[, val])`, `splitOn`
  - dates: `monthName`, `shortMonth`, `isoDate`, `longDate`, `monthYear`
  - papers: `authorList`
  - existing filters, still available: `readableDate`, `readingTime`, `excerpt`, `urlencode`, `generateReferences`, `cacheBust`
- **Data.** Use `pubs` (with `urls[]`, whose arXiv/OpenReview ids are already turned into real URLs), `projs`, `news` and `collections.blog`, server-side. `src/data/*.js` stay the single source (the owner edits them); nothing loads them in the browser any more.

## 10. Masthead behaviour

- **≥1240px:** a fixed side rail (216px): the mark (32px, § 6c) beside the two-line name "Divyanshu / Kumar" in Instrument Serif, the six pages in their exact order (**Home · Publications · Projects · Blog · Timeline · About**; none is ever dropped), "On this page" (from `[data-toc]`, scroll-spy; long labels are shortened at a word boundary, full text in `title`), and the theme toggle at the foot.
- **761–1239px:** one sticky running head: the mark (22px) and name, the six pages, the theme glyph (its label, and the ".org" line, hide at ≤1080 so nothing wraps or overflows).
- **≤760px:** two rows, not sticky: name + theme glyph, then the six pages spread across the width; below 370px the pages wrap to a second line rather than overflow.
- Checked with zero horizontal overflow at every 20px from 320 to 1440.

## 11. Banner plates and social previews

Every post opens with a **frontispiece**: a small scientific figure drawn from the post's own subject (the Laplace densities of the DP posts, the quantizer staircase, the ssh tunnel), in the site's ink-on-paper language. It is not a poster: there is no title on it, only hairlines, one madder accent, uppercase tracked labels and a caption. It stands above the first paragraph, a little wider than the column at ≥1081px (into the gap, never the rail).

**Files.**

| What | Where |
|---|---|
| One banner per file | `src/_includes/banners/<slug>.js` (the slug must equal the file name) |
| Drawing kit: palette, text styles, helpers, the `<svg>` wrapper | `src/_includes/banners/_lib.js` |
| Registry (picks up every file automatically) | `src/_includes/banners/index.js` |
| Figure + caption markup | the `banner` shortcode in `.eleventy.js`, called by `blog-post.njk` |
| Figure layout, caption | `css/pages/post.css` ("the frontispiece") |
| Social cards | `scripts/og-images.js` → `src/assets/og/<slug>.png`, `site.png`; fonts in `scripts/og/fonts/` (OFL) |

**Adding a banner for a new post.**
1. Copy the closest existing banner to `src/_includes/banners/<slug>.js` and change `slug`, `title` and `desc` (both read by screen readers; `desc` says what the figure shows, with its numbers), `caption` (one or two sentences; `<i>` and `<sup>` allowed) and `draw(k)`.
2. **Compute, never eyeball.** `draw(k)` returns SVG children in a 1100 × 500 viewBox (2.2 : 1). Use the kit: `k.sample(f, a, b)` + `k.line()` for curves, `k.scale()` for axes, `k.laplace`, `k.laplaceCdf`, `k.normal`, and `k.rng(seed)` / `k.gauss()` for fixed "random" draws, so every build draws the same figure. Put the parameters (ε, C, σ, the post's real ports or scores) as constants at the top of the file and name them in the caption.
3. **Classes, not colours.** Strokes: `h` hairline, `hf` faint, `s2` / `s3` secondary ink, `ik` / `ikt` madder (the one accent: the curve or path the post is about), modifiers `d` dashed, `dt` dotted. Fills: `w` ink wash, `fi` ink, `f2` / `f3` text, `fp` / `fp2` paper. Text: `k.t(x, y, str, cls, anchor)` with `l` label (Source Sans 3 semibold, uppercase, tracked), `li` ink label, `m` / `mi` Instrument Serif italic maths, `n` / `ni` numbers, `nl` names beside a mark, `c` / `ci` code, `r` roman; `k.sup()` for exponents. All colours come from the page tokens, so Day and Night proof apply with no extra work. Never put Greek letters or single maths letters in `l` labels (uppercasing turns ε into Ε); use `m` or `n`. The kit throws at build time if a label contains Greek.
4. **Phones.** At ≤560px every label grows to its `ph` size (`TEXT` in `_lib.js`) and anything with the extra class `x` is dropped. Mark secondary labels `x`, and keep the rest legible at 390px wide.
5. **Motion.** Wrap the one madder element in `<g class="reveal">`: it wipes in once, left to right, and is static under reduced motion. Nothing else moves.
6. In the post's front matter add `banner: <slug>`. **That line is the only edit to the post.** A dead lead image under `/assets/img/` before the first heading folds away (`js/post.js`); later dead images still show their "image not available" line.
7. Run `npm run og`, then check the card in `src/assets/og/<slug>.png` and commit it.

**Social previews.** `base.njk` writes `og:*` and `twitter:card = summary_large_image` on every page. A post with a banner uses `/assets/og/<slug>.png`; every other page, and any post whose card has not been generated yet, uses `/assets/og/site.png` (the `ogImage` filter checks the file exists). Each card is 1200 × 630: the site name and a madder rule, the mark in the bottom-right corner (§ 6c), the post title in Instrument Serif, labels in Source Sans 3 (a "Title: subtitle" is split into title and italic dek, as on the page), and the banner in the Day proof palette between hairlines, at its phone label sizes with the `x` labels dropped.
- Cards are **pre-generated and committed**, not built on every eleventy run: CI needs no fonts or font tooling, the build stays fast, and `--serve` never loops on files written into `src/`. `npm run og` rewrites only the cards whose SVG changed (hashes in `src/assets/og/.hashes.json`); `npm run og -- --force` rewrites all. The build prints `[og] no social preview for: …` if a banner has no card yet.
- **Fonts.** sharp's librsvg ignores `@font-face` and, on macOS, fontconfig too, so it would silently fall back to Helvetica. The script therefore **outlines every piece of text to paths** with `opentype.js`, from the TTFs in `scripts/og/fonts/`. Combining accents (q̂, ŵ, g̃) are placed by hand, because opentype.js doesn't position marks.

## 12. Guardrail (server-side)

The probe (§ 7) now has a server half. `probe.js` posts `{q}` to **`/api/ask`** (a Vercel Function, `api/ask.mjs`) and renders the JSON it returns; if the call fails or takes longer than **2.5 s**, the same question is answered in the browser by `ProbeCore` (`src/js/probe-core.js`), which returns the same shape. Same UX either way; `form[data-answered-by]` says which path answered (`server` / `browser`). Still no LLM anywhere: replies are quotes and links.

**Pipeline** (`api/_lib/guardrail.js`): normalize (Unicode tag characters decoded, zero-width stripped, NFKC, Cyrillic/Greek homoglyphs folded, base64/hex/rot13/leet/spaced letters decoded, quoted fragments joined) → rules (the regex families in `probe-core.js`, shared with the browser) → embed with **Model2Vec potion-base-8M** (pure JS, int8, vendored in `models/`, loaded once per instance) → **attack kNN** against a private bank (`data/attack-bank/`, server-only): refuse when similarity ≥ **τ = 0.48** and at least **δ = 0.12** above the nearest benign anchor → hybrid retrieval (BM25 + cosine, reciprocal-rank fusion) as a bonus inside `ground()` → compose (intents, multi-question split, Sources, "and N more") → **output check** (a canary in a honeypot "system prompt", PII patterns, attack-bank text): a failing reply becomes `verdict: "withheld"` with its own seal ("Withheld", policy 8.1).

**Response.** `{ verdict: allow | refuse | decline | hello | withheld, parts: [{ q, answer (HTML), sources: [{u, s}], quoted, route }], rule?: { id, fam, pol, paper, dry, source, matchedOn, match }, attack?: { family, fam, pol, paper, score, benign, margin }, enc?, scores }`. The client re-sanitises `answer` with a tag/attribute allowlist before inserting it.

**UI additions.** A kNN refusal shows the family with "(semantic match)", a dry line "Nearest known attack: <family>, similarity 0.87.", the same note in the margin, and "view the rule" lists the nearest family, its cosine, τ and the benign score. The bank itself never leaves the server. The tally adds "N withheld" when the output check fires.

**Rules of the road.**
- Change a regex, intent or topic in `probe-core.js` only; both halves pick it up. It ships to browsers unbundled: no modules, no build step, syntax every current browser supports.
- Add attack prompts to `data/attack-bank/*.jsonl` (prompts only; see its README), then `npm run build` and `npm run eval`. Re-tune with `npm run eval -- --sweep` if false refusals move.
- `npm run build` = Eleventy + `build:kb`. Local API: `node scripts/dev-api.js --site=<built dir>` (port 3000). Eval: `npm run eval` (`--mode=rules` for the fallback, `--url=` for a deployment, `--fresh` for the never-tuned set). Self-test: `npm run test:guardrail`.
- Privacy: nothing is logged unless `GUARDRAIL_EVAL_LOG=console` (question text + verdict only; no IP, no UA).

