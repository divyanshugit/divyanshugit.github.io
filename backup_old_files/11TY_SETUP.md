# 11ty (Eleventy) Setup Guide

## Overview

This site has been migrated to use 11ty (Eleventy) static site generator. This allows you to write blog posts in markdown while maintaining all existing functionality including MathJax (math equations) and Prism.js (code syntax highlighting).

## ✅ What's Working

- ✅ **Markdown blog posts** with automatic HTML generation
- ✅ **Reference system**: `[1,2,3]` → clickable inline links
- ✅ **MathJax**: Full LaTeX support for equations (`$inline$` and `$$display$$`)
- ✅ **Prism.js**: Code syntax highlighting with all plugins
- ✅ **Theme toggle**: Dark/light mode switching
- ✅ **Hot reload**: Live updates during development
- ✅ **All CSS/JS**: Existing styling and functionality preserved

## Directory Structure

```
divyanshugit.github.io/
├── .eleventy.js          # 11ty configuration
├── .gitignore            # Ignores _site/ and node_modules/
├── package.json          # Dependencies and scripts
├── src/                  # SOURCE FILES (edit these)
│   ├── _includes/        # Layouts and templates
│   │   ├── base.njk     # Base HTML layout
│   │   └── blog-post.njk # Blog post template
│   ├── _data/           # Data files (future use)
│   ├── blog/            # BLOG POSTS (markdown)
│   │   └── *.md
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── *.js
│   ├── assets/
│   └── CNAME
└── _site/               # GENERATED OUTPUT (don't edit)
    └── [built files]
```

## Writing Blog Posts

### 1. Create Markdown File

Create a new file in `src/blog/your-post.md`:

```markdown
---
layout: blog-post.njk
title: Your Blog Post Title
description: A brief description
date: 2025-01-15
tags:
  - Tag1
  - Tag2
featured: true
permalink: /blog/your-post.html
references:
  1: https://example.com/paper1
  2: https://example.com/paper2
  3: https://arxiv.org/abs/1234.5678
---

Your content here with inline references [1,2,3].

## Section Heading

More content with a single reference [1].

### Math Example

Inline math: $E = mc^2$

Display math:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

### Code Example

```python
def hello_world():
    print("Hello, World!")
```

More content here [2,3].
```

### 2. Reference Syntax

**Inline citations:**
- `[1]` - Single reference
- `[1,2,3]` - Multiple references
- `[1-5]` - Range (expands to [1,2,3,4,5])

**Reference definitions** (in frontmatter):
```yaml
references:
  1: https://example.com
  2: https://arxiv.org/abs/1234.5678
```

The system automatically:
- Converts `[1,2,3]` to clickable links
- Generates a "References" section at the bottom
- Links inline citations to bibliography

### 3. Math Equations

**Inline math:** `$E = mc^2$`

**Display math:**
```
$$
\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

MathJax processes these after page load, just like before.

### 4. Code Blocks

Standard markdown code fences with language:

\`\`\`python
def factorial(n):
    return 1 if n == 0 else n * factorial(n-1)
\`\`\`

Prism.js handles syntax highlighting automatically.

## Building the Site

### Development (with live reload)

```bash
npm run serve
# or
npm start
```

Opens at `http://localhost:8080` with hot reload.

### Production Build

```bash
npm run build
```

Generates static files in `_site/` directory.

## Deployment

### GitHub Pages

1. Build the site: `npm run build`
2. The `_site/` directory contains your static site
3. Deploy `_site/` contents to your hosting

### Automated Deployment (Optional)

Create `.github/workflows/build.yml`:

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./_site
```

## Migrating Existing Blog Posts

To convert an existing HTML blog post:

1. Copy the markdown from `blog/sources/` to `src/blog/`
2. Update frontmatter:
   - Add `layout: blog-post.njk`
   - Convert date to YYYY-MM-DD format
   - Move references to frontmatter
3. Remove old `## References` section from content
4. Build and test

## Troubleshooting

### References not showing?
- Check frontmatter has `references:` section
- Ensure proper YAML indentation (2 spaces)

### Math not rendering?
- MathJax loads asynchronously - wait a moment
- Check browser console for errors
- Verify `$` symbols aren't escaped

### Code not highlighted?
- Prism loads after page - should highlight automatically
- Check language name is correct (python, javascript, etc.)

### Hot reload not working?
- Stop server (`Ctrl+C`) and restart
- Check no other process is using port 8080

## Scripts Reference

```bash
npm run build      # Build for production
npm run serve      # Dev server with hot reload
npm start          # Alias for serve
npm run build:old  # Old build system (deprecated)
```

## Key Features

### Automatic Reference Processing

The `.eleventy.js` config includes:
- Custom markdown-it plugin for `[1,2,3]` syntax
- Transform to fix markdown-generated links
- Filter to generate references HTML from frontmatter

### MathJax Integration

Included in `base.njk` layout for blog posts:
- Configured for `$...$` and `$$...$$`
- Processes after HTML generation
- No changes needed to existing math

### Prism.js Integration

Included in `base.njk` layout for blog posts:
- All plugins (autoloader, line numbers, copy-to-clipboard)
- Works with standard markdown code fences
- Theme-aware (light/dark mode)

## Next Steps

1. **Migrate remaining blog posts** from `blog/sources/` to `src/blog/`
2. **Convert static pages** (index, publications, etc.) to `.njk` templates
3. **Add blog listing page** using 11ty collections
4. **Set up automated deployment** with GitHub Actions

## Support

For issues or questions about the 11ty setup, refer to:
- [11ty Documentation](https://www.11ty.dev/docs/)
- [MathJax Documentation](https://docs.mathjax.org/)
- [Prism.js Documentation](https://prismjs.com/)

## Proof of Concept

The blog post `src/blog/ai-safety-benchmarks-survey.md` serves as a complete working example demonstrating:
- ✅ 57 inline reference links
- ✅ 65 references in bibliography
- ✅ MathJax support (ready for equations)
- ✅ Prism.js support (ready for code)
- ✅ All styling preserved
- ✅ Theme toggle working

Build it and view at `_site/blog/ai-safety-benchmarks-survey.html`!

