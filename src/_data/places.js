// ============================================================================
// PLACES — the single source for the homepage plates and the Timeline journey.
//
// To add your own photos for a place (see DESIGN.md, "Places: drop-in photos"):
//   1. Put JPEG/PNG originals (not HEIC) in  src/assets/places/originals/
//      named  <id>-1.jpg, <id>-2.jpg, <id>-3.jpg   (up to 3 per place).
//      That folder is git-ignored: originals never leave your machine.
//   2. List them under `photos` below (order = order shown; the first is the
//      lead plate), with alt text, a short caption ("Place · Mon YYYY") and an
//      optional `focus` ("x% y%", default "50% 50%"): the point kept in frame
//      when a plate is cropped to a fixed shape (Home thumbnails 4:5, Timeline
//      margin 4:5, About gathering 4:5 portrait / 3:2 landscape). The leaf on
//      About always shows the whole photograph. Portrait and landscape both
//      work; see DESIGN.md § 5.
//   3. Run `npx eleventy`. The build strips ALL metadata (EXIF/GPS), grades,
//      and writes a clean master to src/assets/places/masters/ (commit those)
//      plus responsive AVIF/WebP into _site.
//   4. Delete the `placeholder` block for that place: its CC credit then drops
//      out of the List of Plates automatically. A place with neither photos
//      nor a placeholder is set as a blank plate.
//   5. Write `story` (markdown, a few sentences, in your voice). Empty is fine.
// ============================================================================
const fs = require("fs");
const path = require("path");

const MASTERS = path.join(__dirname, "../assets/places/masters");
const WIDTHS = [360, 720, 1200];
let MANIFEST = {};
try { MANIFEST = JSON.parse(fs.readFileSync(path.join(MASTERS, "manifest.json"), "utf8")); } catch (e) {}

const places = [
  {
    // Home (where he is from).
    id: "berai", name: "Berai", local: "बेराई", order: 1,
    region: "Sarai, Bihar",
    caption: "Sarai, Bihar.",
    story: "",
    photos: [
      { file: "berai-1.jpg", focus: "50% 72%", caption: "Berai, Sarai, Bihar · Sep 2024",
        alt: "A narrow village lane between dense trees and a leaning electricity pole, under a cloudy evening sky with a faint rainbow above the treeline." }
    ],
    levels: ["Berai", "a village in Bihar", "Bihar", "North India", "South Asia"]
  },
  {
    // A place he lived (not the hometown).
    id: "patna", name: "Patna", local: "पटना", order: 2,
    region: "Bihar",
    caption: "Patna Junction.",
    story: "",
    photos: [
      { file: "patna-1.jpg", focus: "62% 50%", caption: "Patna Junction · Nov 2018",
        alt: "Patna Junction railway station at night, its facade strung with coloured lights and a lit sign, cars and people in the forecourt." }
    ],
    levels: ["Patna", "a city in Bihar", "Bihar", "North India", "South Asia"]
  },
  {
    id: "kolkata", name: "Kolkata", local: "কলকাতা", order: 3,
    role: "B.Tech, 2022",
    caption: "Howrah Bridge.",
    story: "",
    photos: [],
    placeholder: {
      src: "/assets/optimized/places/kolkata.webp", focus: "40% 50%",
      alt: "Howrah Bridge spanning the Hooghly river in grey light.",
      credit: { by: "rajaraman sundaram", license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0", source: "https://commons.wikimedia.org/wiki/File:Cantilever_howrah_bridge%5E_kolkatta_-_panoramio.jpg", subject: "Howrah Bridge" }
    },
    levels: ["Kolkata", "a city in West Bengal", "a city on the Hooghly", "East India", "South Asia"]
  },
  {
    id: "delhi", name: "Delhi", local: "दिल्ली", order: 4,
    caption: "India Gate.",
    story: "",
    photos: [],
    placeholder: {
      src: "/assets/optimized/places/delhi.webp", focus: "66% 50%",
      alt: "India Gate in Delhi seen from the west, trees to the left.",
      credit: { by: "Nikhilb239", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:India_Gate,_New_Delhi_from_West.jpg", subject: "India Gate" }
    },
    levels: ["Delhi", "the capital territory", "a city on the Yamuna", "North India", "South Asia"]
  },
  {
    id: "bangalore", name: "Bangalore", local: "ಬೆಂಗಳೂರು", order: 5,
    role: "IISc, then Enkrypt AI",
    caption: "Vidhana Soudha.",
    story: "",
    photos: [],
    placeholder: {
      src: "/assets/optimized/places/bangalore.webp", focus: "50% 50%",
      alt: "Vidhana Soudha in Bangalore, stone facade under cloud.",
      credit: { by: "Moheen Reeyad", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Vidhana_Soudha,_front_(01).jpg", subject: "Vidhana Soudha" }
    },
    levels: ["Bangalore", "a city in Karnataka", "a city on the Deccan plateau", "South India", "South Asia"]
  },
  {
    id: "singapore", visited: true, name: "Singapore", local: "新加坡", order: 6,
    role: "AAAI-26", years: "Jan 2026",
    caption: "The Civic District.",
    story: "",
    photos: [
      { file: "singapore-1.jpg", focus: "62% 72%", caption: "The Civic District, Singapore · Mar 2026",
        alt: "A wide pavement beside a colonnaded colonial facade, the green dome of the National Gallery and the towers of the business district beyond, under a blue sky with cumulus clouds." },
      { file: "singapore-2.jpg", focus: "58% 70%", caption: "Supertrees, Gardens by the Bay · Mar 2026",
        alt: "The Supertrees at Gardens by the Bay at night, their steel canopies lit red and pink against a black sky." }
    ],
    levels: ["Singapore", "a city-state on a strait", "an island off the Malay peninsula", "Southeast Asia", "Asia"]
  },
  {
    id: "malaysia", visited: true, name: "Malaysia", local: "ماليزيا", order: 7,
    caption: "Johor.",
    story: "",
    photos: [
      { file: "malaysia-1.jpg", focus: "62% 62%", caption: "Johor · Mar 2026",
        alt: "Sunset over a sandy beach, a tall tower silhouetted against an orange horizon, strings of lights among the palms." },
      { file: "malaysia-2.jpg", focus: "45% 68%", caption: "Johor · Mar 2026",
        alt: "A curved waterfront building lit at night beside a glass dome glowing pink and gold, dark lawns in the foreground." }
    ],
    levels: ["Malaysia", "a country on the Malay peninsula", "a country on the Strait of Malacca", "Southeast Asia", "Asia"]
  },
  {
    id: "philippines", visited: true, name: "The Philippines", local: "Pilipinas", order: 8,
    caption: "Cebu.",
    story: "",
    photos: [
      { file: "philippines-1.jpg", focus: "45% 82%", caption: "Cebu · Aug 2026",
        alt: "A brick path through a park beside a clipped hedge, low towers on the skyline under a heavy, cloudy sky." }
    ],
    levels: ["The Philippines", "an archipelago on the Pacific", "7,641 islands", "Southeast Asia", "Asia"]
  },
  {
    id: "bali", visited: true, name: "Bali", local: "ᬩᬮᬶ", order: 9,
    caption: "Kelingking Beach, Nusa Penida.",
    story: "",
    photos: [
      { file: "bali-1.jpg", focus: "38% 78%", caption: "Kelingking Beach, Nusa Penida · Sep 2026",
        alt: "Looking down on Kelingking Beach: a steep green headland running out into turquoise water, a curve of white sand below and open sea to the horizon." },
      { file: "bali-2.jpg", focus: "40% 62%", caption: "Sea cliffs, Nusa Penida · Sep 2026",
        alt: "Limestone sea cliffs on Nusa Penida, deep blue water breaking white against the rocks under a bright sky." }
    ],
    levels: ["Bali", "an island in Indonesia", "an island east of Java", "Southeast Asia", "Asia"]
  }
];

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

// orientation of a photo from its pixel size: p(ortrait), l(andscape), s(quare)
const orient = (w, h) => (h > w * 1.05 ? "p" : w > h * 1.05 ? "l" : "s");

// Resolve what is actually shown: owned photos with a clean master win;
// otherwise the placeholder (and only then does a credit exist).
module.exports = places
  .sort((a, b) => a.order - b.order)
  .map((p, i) => {
    const owned = (p.photos || [])
      .slice(0, 3)
      .map(ph => {
        const base = path.basename(ph.file, path.extname(ph.file));
        const master = path.join(MASTERS, `${base}.jpg`);
        const originals = path.join(__dirname, "../assets/places/originals", ph.file);
        if (!fs.existsSync(master) && !fs.existsSync(originals)) {
          console.warn(`[places] ${p.id}: ${ph.file} not found in originals/ or masters/; using placeholder.`);
          return null;
        }
        const m = MANIFEST[base];
        const height = m ? Math.round(1200 * m.h / m.w) : 800;
        return {
          owned: true,
          src: `/assets/places/${base}-1200.webp`,
          srcset: {
            avif: WIDTHS.map(w => `/assets/places/${base}-${w}.avif ${w}w`).join(", "),
            webp: WIDTHS.map(w => `/assets/places/${base}-${w}.webp ${w}w`).join(", ")
          },
          width: 1200,
          height,
          orient: orient(1200, height),
          focus: ph.focus || "50% 50%",
          alt: ph.alt || `${p.name}.`,
          caption: ph.caption || ""
        };
      })
      .filter(Boolean);

    // no photo and no CC placeholder: a blank plate (the name, set on paper)
    const shown = owned.length
      ? owned
      : p.placeholder
        ? [{ owned: false, src: p.placeholder.src, srcset: null, width: 1200, height: 600, orient: "l", focus: p.placeholder.focus || "50% 50%", alt: p.placeholder.alt, caption: "" }]
        : [{ owned: false, blank: true, name: p.name, id: p.id, orient: "l", focus: "50% 50%", alt: `${p.name}: photograph to come.`, caption: "" }];

    return {
      ...p,
      plate: ROMAN[i],
      shown,
      own: owned.length > 0,
      isSet: shown.length > 1,
      // the set's shape, one letter per photo ("p", "pl", "pp", "l" …): the leaf lays itself out from it
      layout: shown.map(s => s.orient).join(""),
      credit: owned.length ? null : (p.placeholder && p.placeholder.credit) || null
    };
  });

module.exports.WIDTHS = WIDTHS;
