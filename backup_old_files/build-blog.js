const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

// Configure marked options
marked.setOptions({
    breaks: true,
    gfm: true
});

/**
 * Process inline reference citations like [1,2,3] or [1-4]
 * Convert them to clickable HTML links
 */
function processInlineReferences(text) {
    // Match patterns like [1,2,3] or [1-4] but not markdown links [text](url)
    const refPattern = /\[(\d+(?:,\d+)*(?:-\d+)?)\](?!\()/g;

    return text.replace(refPattern, (match, refs) => {
        // Handle range notation like [1-4]
        if (refs.includes('-')) {
            const [start, end] = refs.split('-').map(Number);
            const numbers = [];
            for (let i = start; i <= end; i++) {
                numbers.push(i);
            }
            refs = numbers.join(',');
        }

        // Split comma-separated references
        const refNumbers = refs.split(',').map(n => n.trim());

        // Generate inline reference links
        const links = refNumbers.map(num =>
            `<a href="#ref${num}" class="inline-ref">[${num}]</a>`
        ).join('');

        return links;
    });
}

/**
 * Extract reference definitions from markdown
 * Format: [1]: URL
 */
function extractReferences(markdown) {
    const references = {};
    const refDefPattern = /^\[(\d+)\]:\s*(.+)$/gm;
    let match;

    while ((match = refDefPattern.exec(markdown)) !== null) {
        const [, num, url] = match;
        references[num] = url.trim();
    }

    return references;
}

/**
 * Remove reference definitions from markdown content
 */
function removeReferenceDefinitions(markdown) {
    // Remove reference definitions [N]: URL
    let cleaned = markdown.replace(/^\[(\d+)\]:\s*.+$/gm, '');

    // Remove the "## References" heading and any content after it
    // This prevents duplicate reference sections
    cleaned = cleaned.replace(/^##\s+References\s*$/m, '');

    return cleaned.trim();
}

/**
 * Generate HTML for the references section
 */
function generateReferencesHTML(references) {
    if (Object.keys(references).length === 0) {
        return '';
    }

    const sortedRefs = Object.entries(references).sort((a, b) => Number(a[0]) - Number(b[0]));

    let html = '<h3>References</h3>\n';
    html += '<div style="font-size: 12px; line-height: 1.6;">\n';

    for (const [num, url] of sortedRefs) {
        html += `    <p id="ref${num}">[${num}] <a href="${url}" target="_blank">${url}</a></p>\n`;
    }

    html += '</div>';

    return html;
}

/**
 * Convert markdown file to HTML
 */
function convertMarkdownToHTML(markdownPath, outputPath, templatePath) {
    console.log(`Converting ${markdownPath}...`);

    // Read markdown file
    const markdownContent = fs.readFileSync(markdownPath, 'utf-8');

    // Parse frontmatter
    const { data: frontmatter, content } = matter(markdownContent);

    // Extract references before processing
    const references = extractReferences(content);

    // Remove reference definitions from content
    let cleanContent = removeReferenceDefinitions(content);

    // Process inline references BEFORE markdown conversion
    cleanContent = processInlineReferences(cleanContent);

    // Convert markdown to HTML
    let htmlContent = marked.parse(cleanContent);

    // Generate references section
    const referencesHTML = generateReferencesHTML(references);

    // Read template
    const template = fs.readFileSync(templatePath, 'utf-8');

    // Generate tags HTML
    const tagsHTML = frontmatter.tags
        ? frontmatter.tags.map(tag => `<span class="tag">${tag}</span>`).join('\n                    ')
        : '';

    // Replace placeholders in template
    let finalHTML = template
        .replace(/\{\{title\}\}/g, frontmatter.title || 'Untitled')
        .replace(/\{\{description\}\}/g, frontmatter.description || '')
        .replace(/\{\{date\}\}/g, frontmatter.date || '')
        .replace(/\{\{tags\}\}/g, tagsHTML)
        .replace(/\{\{emailSubject\}\}/g, encodeURIComponent(frontmatter.emailSubject || frontmatter.title || 'Blog Post'))
        .replace(/\{\{content\}\}/g, htmlContent)
        .replace(/\{\{references\}\}/g, referencesHTML);

    // Write output file
    fs.writeFileSync(outputPath, finalHTML, 'utf-8');

    console.log(`✓ Generated ${outputPath}`);
}

/**
 * Main function
 */
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage: node build-blog.js <markdown-file>');
        console.log('Example: node build-blog.js blog/sources/ai-safety-benchmarks-survey.md');
        process.exit(1);
    }

    const markdownPath = args[0];
    const templatePath = path.join(__dirname, 'blog', 'template.html');

    // Determine output path
    const filename = path.basename(markdownPath, '.md');
    const outputPath = path.join(__dirname, 'blog', `${filename}.html`);

    // Check if files exist
    if (!fs.existsSync(markdownPath)) {
        console.error(`Error: Markdown file not found: ${markdownPath}`);
        process.exit(1);
    }

    if (!fs.existsSync(templatePath)) {
        console.error(`Error: Template file not found: ${templatePath}`);
        process.exit(1);
    }

    // Convert
    try {
        convertMarkdownToHTML(markdownPath, outputPath, templatePath);
        console.log('\n✨ Blog post generated successfully!');
    } catch (error) {
        console.error('Error during conversion:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { convertMarkdownToHTML, processInlineReferences, extractReferences };

