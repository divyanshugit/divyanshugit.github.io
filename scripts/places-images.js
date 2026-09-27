// ============================================================================
// Place photos: originals -> clean masters -> responsive variants.
//
//   src/assets/places/originals/<id>-<n>.jpg|png   (git-ignored; your camera roll)
//        │  sharp: auto-orient, cap at 2400px, a very light grade, ALL metadata stripped
//        ▼
//   src/assets/places/masters/<id>-<n>.jpg          (committed; no EXIF, no GPS)
//        │  sharp: 360w + 720w + 1200w, AVIF + WebP (each one re-checked: no metadata)
//        ▼
//   <output dir>/assets/places/<id>-<n>-<w>.<fmt>   (Eleventy's configured output, e.g. --output; _site by default)
//
// Runs on every build (eleventy.before). Work is skipped when outputs are newer
// than inputs, so it is cheap after the first run. HEIC is not supported by
// sharp's prebuilt binaries: export JPEG or PNG from Photos first.
// ============================================================================
const fs = require("fs");
const path = require("path");
// Use the same sharp instance as @11ty/eleventy-img so libvips is loaded once.
let sharp;
try { sharp = require(require.resolve("sharp", { paths: [path.dirname(require.resolve("@11ty/eleventy-img"))] })); }
catch (e) { sharp = require("sharp"); }

const ROOT = path.join(__dirname, "..");
const ORIGINALS = path.join(ROOT, "src/assets/places/originals");
const MASTERS = path.join(ROOT, "src/assets/places/masters");
const WIDTHS = [360, 720, 1200];     // Home/Timeline thumbs · About plates · leaf (see places.js)
// The grade is deliberately light: the owner's photos stay natural, and the
// page's --photo-filter does the rest so every plate sits on the same paper.
// Bump GRADE whenever the recipe below changes: every master is then rebuilt.
const GRADE = "v2: saturation .95, no contrast curve";

// Refuse any file that still carries EXIF, XMP, IPTC or an embedded GPS block.
async function assertClean(file) {
  const meta = await sharp(file).metadata();
  const buf = fs.readFileSync(file);
  const bad = meta.exif || meta.xmp || meta.iptc || buf.includes("Exif\0\0") || buf.includes("http://ns.adobe.com/xap");
  if (bad) { fs.unlinkSync(file); throw new Error(`[places] metadata survived in ${file}; refusing to keep it`); }
  return meta;
}

const newer = (a, b) => !fs.existsSync(b) || fs.statSync(a).mtimeMs > fs.statSync(b).mtimeMs;

async function toMaster(file, regrade) {
  const src = path.join(ORIGINALS, file);
  const base = path.basename(file, path.extname(file));
  const dst = path.join(MASTERS, `${base}.jpg`);
  if (!regrade && !newer(src, dst)) return base;
  await sharp(src)
    .rotate()                                   // apply EXIF orientation, then drop it
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .modulate({ saturation: 0.95 })             // the grade: a shade quieter, nothing more (night shots untouched otherwise)
    .toColourspace("srgb")
    .jpeg({ quality: 86, mozjpeg: true })       // sharp writes NO metadata unless asked
    .toFile(dst);
  const meta = await assertClean(dst);
  console.log(`[places] master  ${path.relative(ROOT, dst)}  (${meta.width}×${meta.height}, metadata stripped)`);
  return base;
}

async function run({ output } = {}) {
  // the configured output dir (eleventy.before passes it through), never a hard-coded _site
  const OUT = path.join(path.resolve(ROOT, output || "_site"), "assets/places");
  fs.mkdirSync(MASTERS, { recursive: true });
  let prev = {};
  try { prev = JSON.parse(fs.readFileSync(path.join(MASTERS, "manifest.json"), "utf8")); } catch (e) {}
  const regrade = prev._grade !== GRADE;
  if (fs.existsSync(ORIGINALS)) {
    for (const file of fs.readdirSync(ORIGINALS)) {
      if (file.startsWith(".")) continue;
      const ext = path.extname(file).toLowerCase();
      if (ext === ".heic" || ext === ".heif") { console.warn(`[places] ${file}: HEIC is not supported; export it as JPEG.`); continue; }
      if (![".jpg", ".jpeg", ".png"].includes(ext)) continue;
      await toMaster(file, regrade);
    }
  }
  const manifest = { _grade: GRADE };
  const masters = fs.readdirSync(MASTERS).filter(f => f.endsWith(".jpg"));
  if (masters.length) fs.mkdirSync(OUT, { recursive: true });
  for (const m of masters) {
    const base = path.basename(m, ".jpg");
    const src = path.join(MASTERS, m);
    const meta = await assertClean(src);
    manifest[base] = { w: meta.width, h: meta.height };
    for (const w of WIDTHS) {
      for (const fmt of ["avif", "webp"]) {
        const dst = path.join(OUT, `${base}-${w}.${fmt}`);
        if (!newer(src, dst)) continue;
        const img = sharp(src).resize({ width: w, withoutEnlargement: false });
        await (fmt === "avif" ? img.avif({ quality: 52 }) : img.webp({ quality: 78 })).toFile(dst);
        await assertClean(dst);
      }
    }
  }
  fs.writeFileSync(path.join(MASTERS, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
}

module.exports = run;
if (require.main === module) run().catch(e => { console.error(e); process.exit(1); });
