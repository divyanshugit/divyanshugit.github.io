# Blog Post Authoring Guide

This directory contains markdown source files for blog posts. The build system automatically converts these markdown files to HTML with proper styling, reference management, and all the features of the website.

## Quick Start

1. **Create a new markdown file** in this directory (e.g., `my-post.md`)
2. **Write your post** using the format described below
3. **Build the HTML** by running:
   ```bash
   npm run build:post blog/sources/my-post.md
   ```
4. **Preview** the generated HTML at `blog/my-post.html`

## Markdown Format

### Frontmatter

Every blog post must start with YAML frontmatter containing metadata:

```yaml
---
title: Your Blog Post Title
description: A brief description of your post
date: January 15, 2025
tags:
  - Tag 1
  - Tag 2
  - Tag 3
emailSubject: Custom Email Subject (optional)
---
```

**Required fields:**
- `title`: The main title of your blog post
- `description`: A short description (shown in the header)
- `date`: Publication date (any readable format)
- `tags`: List of tags for categorization

**Optional fields:**
- `emailSubject`: Custom subject for the email link (defaults to the title)

### Content

Write your content using standard markdown syntax:

```markdown
## Section Heading

Regular paragraph text with **bold** and *italic* formatting.

- Bullet point 1
- Bullet point 2

### Subsection

More content here...
```

### References

The new reference system makes citations much cleaner and easier to maintain!

#### Inline Citations

Use simple bracket notation to cite references:

```markdown
## SALAD-Bench [1,2,3,4]

This benchmark is widely used [1] and has been validated [2,3].
```

**Supported formats:**
- `[1]` - Single reference
- `[1,2,3]` - Multiple references (comma-separated)
- `[1-4]` - Range notation (expands to [1,2,3,4])

These will automatically be converted to clickable inline links: [1][2][3][4]

#### Reference Definitions

At the end of your markdown file, define all references using this format:

```markdown
## References

[1]: https://example.com/paper1
[2]: https://example.com/paper2
[3]: https://arxiv.org/abs/1234.5678
[4]: https://github.com/username/repo
```

The build system will:
1. Extract these definitions
2. Remove them from the content
3. Generate a properly formatted "References" section at the bottom
4. Link all inline citations to their corresponding reference

## Example Post

Here's a complete example:

```markdown
---
title: Understanding Neural Networks
description: A beginner's guide to neural networks and deep learning
date: March 10, 2025
tags:
  - Machine Learning
  - Deep Learning
  - Neural Networks
emailSubject: Neural Networks Guide
---

Neural networks have revolutionized machine learning [1,2]. This post explores their fundamental concepts.

## What are Neural Networks? [1]

Neural networks are computational models inspired by biological neurons. They consist of layers of interconnected nodes [3].

## Key Concepts [2,3,4]

- **Layers**: Input, hidden, and output layers
- **Weights**: Parameters that are learned during training
- **Activation Functions**: Non-linear transformations [4]

## Conclusion

Understanding these basics is essential for working with modern AI systems [1-4].

## References

[1]: https://www.nature.com/articles/nature14539
[2]: https://arxiv.org/abs/1409.1556
[3]: https://www.deeplearningbook.org
[4]: https://cs231n.github.io
```

## Build Commands

### Build a single post:
```bash
npm run build:post blog/sources/your-post.md
```

Or directly:
```bash
node build-blog.js blog/sources/your-post.md
```

### Output

The generated HTML file will be placed in the `blog/` directory with the same filename:
- Input: `blog/sources/my-post.md`
- Output: `blog/my-post.html`

## Features

### Automatic Processing

The build system automatically:
- ✅ Converts markdown to HTML
- ✅ Processes inline reference citations
- ✅ Generates clickable reference links
- ✅ Creates a formatted references section
- ✅ Applies proper styling and layout
- ✅ Includes MathJax for equations
- ✅ Includes Prism.js for code highlighting
- ✅ Maintains theme toggle functionality
- ✅ Preserves all navigation and site features

### Styling

Reference links are styled to be:
- **Compact**: Minimal spacing between multiple citations
- **Readable**: Clear visual hierarchy
- **Interactive**: Hover effects for better UX
- **Theme-aware**: Works in both light and dark modes

## Tips

1. **Keep references organized**: Number them sequentially (1, 2, 3...)
2. **Use range notation**: For consecutive references, use `[1-5]` instead of `[1,2,3,4,5]`
3. **Test locally**: Always preview your generated HTML before publishing
4. **Update blog.js**: Remember to add your post metadata to `data/blog.js` for it to appear on the blog listing page

## Troubleshooting

### References not showing up?
- Check that reference definitions use the exact format: `[N]: URL`
- Ensure there's a blank line before the `## References` heading

### Inline citations not converting?
- Make sure you're using square brackets: `[1,2,3]`
- Avoid spaces inside brackets: `[1, 2, 3]` won't work (use `[1,2,3]`)

### Build errors?
- Verify your frontmatter YAML is valid
- Check that all required fields are present
- Ensure the markdown file is in the correct directory

## Migration Guide

To convert an existing HTML blog post to markdown:

1. **Extract the content** from the `<div class="blog-content">` section
2. **Convert HTML to markdown**:
   - `<h2>` → `##`
   - `<strong>` → `**text**`
   - `<em>` → `*text*`
   - `<ul><li>` → `- item`
3. **Simplify references**:
   - Replace `<sup><a href="#ref1">[1]</a><a href="#ref2">[2]</a></sup>` with `[1,2]`
4. **Extract reference URLs** from the bottom of the HTML
5. **Add frontmatter** at the top
6. **Build and test** the new markdown version

## Support

For questions or issues with the blog build system, contact the maintainer or check the main README.md file in the project root.

