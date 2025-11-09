const markdownIt = require("markdown-it");
const Image = require("@11ty/eleventy-img");
const path = require("path");
const htmlmin = require("html-minifier");
const { minify: terserMinify } = require("terser");
const CleanCSS = require("clean-css");
const crypto = require("crypto");

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
    eleventyConfig.addPassthroughCopy("src/data");
    eleventyConfig.addPassthroughCopy("src/CNAME");
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

    eleventyConfig.setLibrary("md", md);

    // ===== COLLECTIONS =====
    // Create collection for blog posts
    eleventyConfig.addCollection("blog", function (collectionApi) {
        return collectionApi.getFilteredByGlob("src/blog/*.md")
            .sort((a, b) => {
                // Sort by date, newest first
                return new Date(b.data.date) - new Date(a.data.date);
            });
    });

    // Collection for featured blog posts
    eleventyConfig.addCollection("featuredBlog", function (collectionApi) {
        return collectionApi.getFilteredByGlob("src/blog/*.md")
            .filter(post => post.data.featured === true)
            .sort((a, b) => new Date(b.data.date) - new Date(a.data.date));
    });

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
        templateFormats: ["md", "njk", "html"],
        markdownTemplateEngine: "njk",
        htmlTemplateEngine: "njk",
        dataTemplateEngine: "njk"
    };
};

