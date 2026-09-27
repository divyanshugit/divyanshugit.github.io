const markdownIt = require("markdown-it");
const Image = require("@11ty/eleventy-img");
const path = require("path");
const htmlmin = require("html-minifier");
const { minify: terserMinify } = require("terser");
const CleanCSS = require("clean-css");
const crypto = require("crypto");
const markdownItFootnote = require("markdown-it-footnote");
const placesImages = require("./scripts/places-images.js");
const fs = require("fs");

async function imageShortcode(src, alt, sizes = "100vw") {
    let metadata = await Image(src, {
        widths: [200, 400, 800],
        formats: ["avif", "webp", "jpeg"],
        outputDir: "./_site/img/",
        urlPath: "/img/",
        filenameFormat: function (id, src, width, format, options) {
            const extension = path.extname(src);
            const name = path.basename(src, extension);
            return `${name}-${width}w.${format}`;
        }
    });

    let imageAttributes = {
        alt,
        sizes,
        loading: "lazy",
        decoding: "async",
    };

    return Image.generateHTML(metadata, imageAttributes);
}

module.exports = function (eleventyConfig) {

    // ===== CACHE BUSTING =====
    // Generate a build hash for cache busting
    const buildHash = crypto.createHash('md5').update(Date.now().toString()).digest('hex').substring(0, 8);

    // Add global data for cache busting
    eleventyConfig.addGlobalData("cacheBust", buildHash);

    // Filter to add cache bust parameter to URLs
    eleventyConfig.addFilter("cacheBust", function (url) {
        return `${url}?v=${buildHash}`;
    });

    // ===== PASSTHROUGH COPY =====
    // Copy static assets without processing
    eleventyConfig.addPassthroughCopy("src/css");
    eleventyConfig.addPassthroughCopy("src/js");
    eleventyConfig.addPassthroughCopy("src/fonts");
    eleventyConfig.addPassthroughCopy("src/assets/optimized");
    eleventyConfig.addPassthroughCopy("src/assets/logo.svg");
    // favicons and the manifest (the mark, DESIGN.md "Mark")
    eleventyConfig.addPassthroughCopy("src/assets/favicon.ico");
    eleventyConfig.addPassthroughCopy("src/favicon.ico");   // crawlers ask for /favicon.ico at the root
    eleventyConfig.addPassthroughCopy("src/assets/apple-touch-icon.png");
    eleventyConfig.addPassthroughCopy("src/assets/icon-192.png");
    eleventyConfig.addPassthroughCopy("src/assets/icon-512.png");
    eleventyConfig.addPassthroughCopy("src/site.webmanifest");
    eleventyConfig.addPassthroughCopy("src/blog/assets");
    eleventyConfig.addPassthroughCopy("src/assets/og");
    eleventyConfig.addPassthroughCopy("src/data");
    eleventyConfig.addPassthroughCopy("src/.nojekyll");
    eleventyConfig.addPassthroughCopy("src/_headers");

    // ===== MARKDOWN CONFIGURATION =====
    // Configure markdown-it to preserve HTML and not escape special characters
    // This is crucial for MathJax ($...$) and inline HTML
    let markdownItOptions = {
        html: true,        // Enable HTML tags in source
        breaks: false,     // Don't convert \n to <br> (can interfere with math)
        linkify: true,     // Auto-convert URLs to links
        typographer: false // Disable to avoid conflicts with math symbols
    };

    let md = markdownIt(markdownItOptions);

    // Custom inline reference processing
    // Convert [1,2,3] to clickable reference links
    md.core.ruler.after('inline', 'process_references', function (state) {
        state.tokens.forEach(function (blockToken) {
            if (blockToken.type !== 'inline') return;

            let tokens = blockToken.children;
            let i = 0;

            while (i < tokens.length) {
                let token = tokens[i];

                if (token.type === 'text') {
                    // Match [1,2,3] or [1-4] patterns (but not markdown links)
                    let text = token.content;
                    let refPattern = /\[(\d+(?:,\d+)*(?:-\d+)?)\](?!\()/g;
                    let match;
                    let lastIndex = 0;
                    let newTokens = [];

                    while ((match = refPattern.exec(text)) !== null) {
                        // Add text before match
                        if (match.index > lastIndex) {
                            let textToken = new state.Token('text', '', 0);
                            textToken.content = text.slice(lastIndex, match.index);
                            newTokens.push(textToken);
                        }

                        // Process reference numbers
                        let refs = match[1];

                        // Handle range notation like [1-4]
                        if (refs.includes('-')) {
                            let [start, end] = refs.split('-').map(Number);
                            let numbers = [];
                            for (let j = start; j <= end; j++) {
                                numbers.push(j);
                            }
                            refs = numbers.join(',');
                        }

                        // Split comma-separated references
                        let refNumbers = refs.split(',').map(n => n.trim());

                        // Generate inline reference links
                        refNumbers.forEach((num, idx) => {
                            let linkOpen = new state.Token('link_open', 'a', 1);
                            linkOpen.attrSet('href', `#ref${num}`);
                            linkOpen.attrSet('class', 'inline-ref');
                            newTokens.push(linkOpen);

                            let linkText = new state.Token('text', '', 0);
                            linkText.content = `[${num}]`;
                            newTokens.push(linkText);

                            let linkClose = new state.Token('link_close', 'a', -1);
                            newTokens.push(linkClose);
                        });

                        lastIndex = refPattern.lastIndex;
                    }

                    // Add remaining text
                    if (lastIndex < text.length) {
                        let textToken = new state.Token('text', '', 0);
                        textToken.content = text.slice(lastIndex);
                        newTokens.push(textToken);
                    }

                    // Replace token if we made changes
                    if (newTokens.length > 0) {
                        tokens.splice(i, 1, ...newTokens);
                        i += newTokens.length;
                    } else {
                        i++;
                    }
                } else {
                    i++;
                }
            }
        });
    });

    // ===== FOOTNOTES AS SIDENOTES =====
    // [^n] footnotes render as margin notes: a marker button in the text and an
    // <aside class="note"> placed right after the paragraph that cites it.
    // site.js lifts the aside into the margin on wide screens; on narrow
    // screens it unfolds inline under its paragraph. Markup contract: DESIGN.md.
    md.use(markdownItFootnote);
    const fnName = (tokens, idx, options, env, slf) => slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);
    md.renderer.rules.footnote_ref = (tokens, idx, options, env, slf) => {
        const id = fnName(tokens, idx, options, env, slf);
        const n = tokens[idx].meta.id + 1;
        const sub = tokens[idx].meta.subId > 0 ? `-${tokens[idx].meta.subId}` : "";
        return `<button type="button" class="m" id="snref-${id}${sub}" aria-controls="sn-${id}" aria-expanded="false" aria-label="Note ${n}">${n}</button>`;
    };
    md.renderer.rules.footnote_block_open = () => '<ol class="sn-src" hidden>\n';
    md.renderer.rules.footnote_block_close = () => '</ol>\n';
    md.renderer.rules.footnote_open = (tokens, idx, options, env, slf) => `<li data-sn="${fnName(tokens, idx, options, env, slf)}">`;
    md.renderer.rules.footnote_close = () => '</li>\n';
    md.renderer.rules.footnote_anchor = () => '';

    function toSidenotes(html) {
        const block = html.match(/<ol class="sn-src" hidden>([\s\S]*?)<\/ol>\s*$/);
        if (!block) return html;
        html = html.slice(0, block.index);
        const items = [...block[1].matchAll(/<li data-sn="([^"]+)">([\s\S]*?)<\/li>/g)];
        items.forEach((m, i) => {
            const id = m[1];
            let body = m[2].trim();
            const single = body.match(/^<p>([\s\S]*)<\/p>$/);
            if (single && !single[1].includes("<p>")) body = single[1];
            // optional label:  [^1]: see | text   ->  <span class="lab">see</span>text
            body = body.replace(/^([a-z][a-z ]{1,22}?)\s*\|\s*/i, '<span class="lab">$1</span>');
            const aside = `<aside class="note" id="sn-${id}" data-anchor="snref-${id}" role="note"><div class="note__in"><span class="n">${i + 1}</span>${body}</div></aside>`;
            const ref = html.indexOf(`id="snref-${id}"`);
            if (ref < 0) { html += aside; return; }
            const ends = ["</p>", "</li>", "</blockquote>"].map(t => { const k = html.indexOf(t, ref); return k < 0 ? Infinity : k + t.length; });
            let at = Math.min(...ends);
            if (!isFinite(at)) { html += aside; return; }
            // keep notes of the same paragraph in order
            while (html.startsWith('<aside class="note"', at) || html.startsWith('\n<aside class="note"', at)) {
                at = html.indexOf("</aside>", at) + "</aside>".length;
            }
            html = html.slice(0, at) + aside + html.slice(at);
        });
        return html;
    }
    const baseRender = md.render.bind(md);
    // fresh env per render so footnote state never leaks between templates
    md.render = (src, env) => toSidenotes(baseRender(src, Object.assign({}, env, { footnotes: undefined })));

    eleventyConfig.setLibrary("md", md);

    // A plain renderer (no footnotes) for markdown held in data files.
    const mdPlain = markdownIt(markdownItOptions);
    eleventyConfig.addFilter("md", (str) => str ? mdPlain.render(String(str)) : "");
    eleventyConfig.addFilter("mdInline", (str) => str ? mdPlain.renderInline(String(str)) : "");

    // ===== COLLECTIONS =====
    // Create collection for blog posts
    // Robust to hand-written front matter: drafts (`draft: true`) and posts
    // without a permalink are left out; a missing/invalid date sorts last;
    // tags are always an array (see src/blog/blog.11tydata.js).
    const postTime = (p) => { const t = new Date(p.date || p.data.date).getTime(); return isNaN(t) ? 0 : t; };
    const publishedPosts = (collectionApi) => collectionApi.getFilteredByGlob("src/blog/*.md")
        .filter(post => post && post.data && !post.data.draft && post.url)
        .sort((a, b) => postTime(b) - postTime(a)); // newest first
    eleventyConfig.addCollection("blog", (collectionApi) => publishedPosts(collectionApi));

    // Collection for featured blog posts
    eleventyConfig.addCollection("featuredBlog", (collectionApi) => publishedPosts(collectionApi).filter(post => post.data.featured === true));

    // ===== FILTERS =====
    // Date formatting filter
    eleventyConfig.addFilter("readableDate", (dateObj) => {
        if (!dateObj) return '';
        if (typeof dateObj === 'string') {
            // If it's already a formatted string, return it
            return dateObj;
        }
        return new Date(dateObj).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    });

    // Calculate reading time from content
    eleventyConfig.addFilter("readingTime", (content) => {
        if (!content) return '5 min read';
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return `${minutes} min read`;
    });

    // Get first paragraph as excerpt
    eleventyConfig.addFilter("excerpt", (content) => {
        if (!content) return '';
        const firstParagraph = content.split('\n\n')[0];
        return firstParagraph.replace(/<[^>]*>/g, '').substring(0, 200) + '...';
    });

    // Fix broken reference links that markdown-it creates
    eleventyConfig.addTransform("fixReferences", function (content) {
        // Only process HTML files
        if (this.page.outputPath && this.page.outputPath.endsWith(".html")) {
            // Fix links like <a href="undefined">3</a> to proper reference links
            content = content.replace(/<a href="undefined">(\d+)<\/a>/g, '<a href="#ref$1" class="inline-ref">[$1]</a>');
        }
        return content;
    });

    // Minify HTML output
    eleventyConfig.addTransform("htmlmin", function (content) {
        if (this.page.outputPath && this.page.outputPath.endsWith(".html")) {
            return htmlmin.minify(content, {
                useShortDoctype: true,
                removeComments: true,
                collapseWhitespace: true,
                minifyCSS: true,
                minifyJS: true
            });
        }
        return content;
    });

    // Extract references from frontmatter and generate HTML
    eleventyConfig.addFilter("generateReferences", function (references) {
        if (!references || Object.keys(references).length === 0) {
            return '';
        }

        let html = '<h3>References</h3>\n';
        html += '<div style="font-size: 12px; line-height: 1.6;">\n';

        // Sort by reference number
        const sortedRefs = Object.entries(references).sort((a, b) => Number(a[0]) - Number(b[0]));

        for (const [num, url] of sortedRefs) {
            html += `    <p id="ref${num}">[${num}] <a href="${url}" target="_blank">${url}</a></p>\n`;
        }

        html += '</div>';

        return html;
    });

    // ===== DESIGN-SYSTEM FILTERS (see DESIGN.md) =====
    const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    eleventyConfig.addFilter("splitOn", (str, sep) => String(str || "").split(sep));
    eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
    eleventyConfig.addFilter("where", (arr, key, val) => (arr || []).filter(x => (val === undefined ? !!x[key] : x[key] === val)));
    // places with the author's own photographs -> "Plates I–II, VI–IX" (consecutive plates as a range)
    eleventyConfig.addFilter("plateRanges", (places) => {
      const idx = (places || []).map((p, i) => (p.own ? i : -1)).filter(i => i >= 0);
      if (!idx.length) return "";
      const runs = [];
      idx.forEach(i => { const r = runs[runs.length - 1]; if (r && i === r[1] + 1) r[1] = i; else runs.push([i, i]); });
      const pl = (i) => places[i].plate;
      const txt = runs.map(([a, b]) => (a === b ? pl(a) : `${pl(a)}${b === a + 1 ? ", " : "–"}${pl(b)}`)).join(", ");
      return `${idx.length > 1 ? "Plates" : "Plate"} ${txt}`;
    });
    eleventyConfig.addFilter("monthName", (m) => MONTHS[(m || 1) - 1] || "");
    eleventyConfig.addFilter("shortMonth", (m) => (MONTHS[(m || 1) - 1] || "").slice(0, 3));
    eleventyConfig.addFilter("isoDate", (d) => d ? new Date(d).toISOString().slice(0, 10) : "");
    eleventyConfig.addFilter("longDate", (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "");
    // a build-time moment (e.g. site.revised) in the owner's own time zone
    eleventyConfig.addFilter("localDate", (d, tz = "Asia/Kolkata") => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: tz }) : "");
    eleventyConfig.addFilter("monthYear", (d) => d ? new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }) : "");
    // "Divyanshu Kumar*" -> "<b>D. Kumar</b>*"; others -> initials + surname
    eleventyConfig.addFilter("authorList", (authors, self = "Divyanshu Kumar") => (authors || []).map(a => {
        const star = /\*$/.test(a); const name = a.replace(/\*$/, "").trim();
        const parts = name.split(/\s+/); const last = parts.pop();
        let out = parts.map(p => p[0] + ".").join(" ") + " " + last;
        if (name === self) out = `<b>${out}</b>`;
        return out + (star ? "*" : "");
    }).join(", "));
    // Post titles/descriptions: drop leading emoji and trailing [bracketed] editor notes
    eleventyConfig.addFilter("cleanTitle", (t) => String(t || "")
        .replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u, "")
        .replace(/\s*\[[^\]]*\]\s*$/, "").trim());
    // Wrap the first mention of each place name (in text, not tags) with
    // <span class="place" data-place="id"> so prose and plates light together.
    eleventyConfig.addFilter("placeSpans", (html, places) => {
        let out = String(html || "");
        (places || []).forEach(p => {
            const names = [p.name, p.name.replace(/^The /, "the ")];
            for (const nm of names) {
                const re = new RegExp(`(>[^<]*?)\\b(${nm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`);
                if (re.test(out)) { out = out.replace(re, `$1<span class="place" data-place="${p.id}">$2</span>`); break; }
            }
        });
        return out;
    });
    // One line for index rows: the first sentence, capped at ~120 characters on a word boundary.
    eleventyConfig.addFilter("oneLine", (t, max = 120) => {
        let s = String(t || "").replace(/<[^>]*>/g, "").replace(/^tl;dr\s*[-—:]*\s*/i, "").trim();
        const first = s.match(/^.*?[.!?](?=\s|$)/);
        if (first) s = first[0];
        if (s.length > max) s = s.slice(0, s.lastIndexOf(" ", max)).replace(/[,;:]$/, "") + "…";
        return s;
    });
    eleventyConfig.addFilter("stripHtml", (s) => String(s || "").replace(/<[^>]*>/g, ""));
    eleventyConfig.addFilter("json", (v) => JSON.stringify(v));

    // ===== PLACE PHOTOS: strip metadata, grade, make responsive variants =====
    // `directories.output` honours --output; the deprecated `dir` is only the config's default (_site)
    eleventyConfig.on("eleventy.before", async ({ directories, dir }) => { await placesImages({ output: (directories && directories.output) || (dir && dir.output) }); });
    eleventyConfig.addWatchTarget("src/assets/places/originals/");

    // ===== BANNER PLATES (src/_includes/banners/, DESIGN.md § 11) =====
    // Front matter `banner: <slug>` → an inline SVG figure above the first paragraph.
    // Social previews are pre-generated PNGs in src/assets/og/ (npm run og).
    const BANNERS = "./src/_includes/banners/index.js";
    eleventyConfig.addWatchTarget("src/_includes/banners/");
    eleventyConfig.addShortcode("banner", function (slug) {
        if (!slug) return "";
        delete require.cache[require.resolve(BANNERS)];
        const { banners, render } = require(BANNERS);
        const mod = banners[slug];
        if (!mod) { console.warn(`[banners] no banner "${slug}" (${this.page && this.page.inputPath})`); return ""; }
        return `<figure class="bn" id="plate" data-banner="${slug}">`
            + `<div class="bn__plate">${render(mod)}</div>`
            + `<figcaption><span class="pl">Frontispiece</span>${mod.caption}</figcaption>`
            + `</figure>`;
    });
    // ===== THE MARK (src/js/dmark.js, DESIGN.md "Mark") =====
    // Prints the exact D (ε = ∞) into an <svg data-dmark>, so it shows before and
    // without JS; dmark.js then mounts it on the global ε.
    const DMARK = "./src/js/dmark.js";
    eleventyConfig.addShortcode("dmark", function (size, cls) {
        delete require.cache[require.resolve(DMARK)];
        const S = +size || 26;
        return `<svg class="${cls || "mark"}" data-dmark data-s="${S}" data-variant="b" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"`
            + ` shape-rendering="crispEdges" aria-hidden="true" focusable="false">${require(DMARK).render({ S, variant: "b", eps: Infinity })}</svg>`;
    });
    // The social preview for a page: its banner's PNG if one has been generated, else the site card.
    eleventyConfig.addFilter("ogImage", function (slug) {
        if (slug && fs.existsSync(path.join(__dirname, "src/assets/og", `${slug}.png`))) return `/assets/og/${slug}.png`;
        return "/assets/og/site.png";
    });
    eleventyConfig.on("eleventy.before", () => {
        // a quiet reminder, never a failure: posts whose banner has no social preview yet
        try {
            const dir = path.join(__dirname, "src/blog");
            const missing = fs.readdirSync(dir).filter(f => f.endsWith(".md")).map(f => (fs.readFileSync(path.join(dir, f), "utf8").match(/^banner:\s*([\w-]+)/m) || [])[1])
                .filter(slug => slug && !fs.existsSync(path.join(__dirname, "src/assets/og", `${slug}.png`)));
            if (missing.length) console.warn(`[og] no social preview for: ${missing.join(", ")} — run \`npm run og\``);
        } catch (e) { /* never block a build on this */ }
    });

    // ===== SHORTCODES =====
    // Image optimization shortcode
    eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);
    eleventyConfig.addLiquidShortcode("image", imageShortcode);
    eleventyConfig.addJavaScriptFunction("image", imageShortcode);

    // Shortcode for email subject encoding
    eleventyConfig.addFilter("urlencode", function (str) {
        return encodeURIComponent(str || '');
    });

    // ===== WATCH TARGETS =====
    // Watch CSS and JS for changes
    eleventyConfig.addWatchTarget("src/css/");
    eleventyConfig.addWatchTarget("src/js/");

    // ===== SERVER OPTIONS =====
    eleventyConfig.setServerOptions({
        port: 8080,
        showAllHosts: true
    });

    // ===== RETURN CONFIG =====
    return {
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes",
            data: "_data"
        },
        templateFormats: ["md", "njk", "html", "11ty.js"],
        markdownTemplateEngine: "njk",
        htmlTemplateEngine: "njk",
        dataTemplateEngine: "njk"
    };
};

