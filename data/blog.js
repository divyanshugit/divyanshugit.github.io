// ===== BLOG POSTS DATA =====
// Centralized blog post information for easy maintenance

const blogPosts = [
    {
        id: "ai-safety-benchmarks-survey",
        title: "A Survey of Safety Benchmarks for AI and AI-Agent Systems",
        description: "A comprehensive survey of over two dozen safety benchmarks for large language models and AI-agent systems, covering robustness, alignment, and misuse-resilience.",
        date: "2025-07-26",
        readTime: "15 min read",
        tags: ["AI Safety", "Benchmarking", "Responsible AI", "LLMs", "AI Agents"],
        category: "AI Safety",
        excerpt: "Over the past three years researchers have released more than two dozen dedicated benchmarks that probe the robustness, alignment and misuse-resilience of large language models (LLMs) and agentic systems.",
        featured: true, // Shows on homepage
        slug: "ai-safety-benchmarks-survey",
        content: "Full content would be loaded from markdown file"
    },
    {
        id: "sgd-to-dpsgd",
        title: "From SGD to DP-SGD: Reproducing the Foundations of Private Deep Learning",
        description: "Blog #4 in the series of Inception of Differential Privacy",
        date: "2025-05-25",
        readTime: "12 min read",
        tags: ["Differential Privacy", "Deep Learning", "Privacy", "SGD"],
        category: "PETs",
        excerpt: "Every day, deep learning models touch data that can be deeply personal—medical records, financial statements, or private messages. This post explores how DP-SGD provides mathematically rigorous privacy guarantees.",
        featured: true, // Shows on homepage
        slug: "sgd-to-dpsgd",
        series: "Inception of Differential Privacy",
        seriesNumber: 4,
        content: "Full content would be loaded from markdown file"
    },
    {
        id: "art-of-controlled-noise",
        title: "The Art of Controlled Noise: Laplace and Exponential Mechanisms in Differential Privacy",
        description: "Blog #3 in the series of Inception of Differential Privacy",
        date: "2025-03-09",
        readTime: "10 min read",
        tags: ["Differential Privacy", "Laplace Mechanism", "Exponential Mechanism", "Privacy"],
        category: "PETs",
        excerpt: "These methods allow us to inject noise in a mathematically principled way, ensuring privacy while preserving as much utility as possible.",
        featured: true, // Shows on homepage
        slug: "art-of-controlled-noise",
        series: "Inception of Differential Privacy",
        seriesNumber: 3,
        content: "Full content would be loaded from markdown file"
    },
    {
        id: "dp-guarantee-in-action",
        title: "DP Guarantee in Action: A Practical Implementation Guide",
        description: "Blog #2 in the series of Inception of Differential Privacy",
        date: "2025-03-02",
        readTime: "8 min read",
        tags: ["Differential Privacy", "Implementation", "Privacy Guarantees"],
        category: "PETs",
        excerpt: "A practical guide to implementing differential privacy guarantees in real-world applications.",
        featured: false, // Only on blog page
        slug: "dp-guarantee-in-action",
        series: "Inception of Differential Privacy",
        seriesNumber: 2,
        content: "Full content would be loaded from markdown file"
    },
    {
        id: "differential-privacy-but-why",
        title: "Differential Privacy!! But Why?",
        description: "Blog #1 in the series of Inception of Differential Privacy",
        date: "2025-02-16",
        readTime: "6 min read",
        tags: ["Differential Privacy", "Privacy", "Data Protection"],
        category: "PETs",
        excerpt: "There is no denying that data powering everything from AI models to decision making, the challenge is clear: how do we extract meaningful insights without compromising individual privacy?",
        featured: false, // Only on blog page
        slug: "differential-privacy-but-why",
        series: "Inception of Differential Privacy",
        seriesNumber: 1,
        content: "Full content would be loaded from markdown file"
    },
    {
        id: "llm-quantization-exploration",
        title: "Exploring Llama.cpp with Llama Models",
        description: "Quantizing models for fun and exploring vulnerability aspects of model quantization.",
        date: "2024-08-25",
        readTime: "8 min read",
        tags: ["LLMs", "Quantization", "Llama.cpp", "Model Compression"],
        category: "Language Models",
        excerpt: "While thinking about what to do this weekend, I decided to revisit and update the paper on Fine-Tuning, Quantization, and LLMs: Navigating Unintended Outcomes with the latest models and additional insights.",
        featured: true, // Shows on homepage
        slug: "llm-quantization-exploration",
        content: "Full content would be loaded from markdown file"
    },
    {
        id: "interrogate-llm-truth",
        title: "🔍 InterrogateLLM: In Search of Truth",
        description: "Explore how InterrogateLLM addresses AI hallucination in a straightforward manner.",
        date: "2024-05-01",
        readTime: "5 min read",
        tags: ["LLMs", "Hallucinations", "AI Safety", "Truth Detection"],
        category: "Language Models",
        excerpt: "In the world of LLMs, one big puzzle is hallucination. It's when LLM makes up stuff that isn't true, and it's been confusing experts for a long time.",
        featured: false, // Only on blog page
        slug: "interrogate-llm-truth",
        content: "Full content would be loaded from markdown file"
    }
];

// Helper functions for blog management
function getFeaturedBlogPosts(limit = 3) {
    return blogPosts.filter(post => post.featured).slice(0, limit);
}

function getAllBlogPosts() {
    return blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getBlogPostsByCategory(category) {
    return blogPosts.filter(post => post.category === category);
}

function getBlogPostsByTag(tag) {
    return blogPosts.filter(post => post.tags.includes(tag));
}

function getBlogPostById(id) {
    return blogPosts.find(post => post.id === id);
}

function getBlogPostBySlug(slug) {
    return blogPosts.find(post => post.slug === slug);
}

function getBlogPostsByYear() {
    const grouped = {};
    blogPosts.forEach(post => {
        const year = new Date(post.date).getFullYear();
        if (!grouped[year]) {
            grouped[year] = [];
        }
        grouped[year].push(post);
    });
    return grouped;
}

function getBlogSeries() {
    const series = {};
    blogPosts.forEach(post => {
        if (post.series) {
            if (!series[post.series]) {
                series[post.series] = [];
            }
            series[post.series].push(post);
        }
    });

    // Sort each series by series number
    Object.keys(series).forEach(seriesName => {
        series[seriesName].sort((a, b) => (a.seriesNumber || 0) - (b.seriesNumber || 0));
    });

    return series;
}

function getAllTags() {
    const tags = new Set();
    blogPosts.forEach(post => {
        post.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
}

function getAllCategories() {
    const categories = new Set();
    blogPosts.forEach(post => {
        categories.add(post.category);
    });
    return Array.from(categories).sort();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        blogPosts,
        getFeaturedBlogPosts,
        getAllBlogPosts,
        getBlogPostsByCategory,
        getBlogPostsByTag,
        getBlogPostById,
        getBlogPostBySlug,
        getBlogPostsByYear,
        getBlogSeries,
        getAllTags,
        getAllCategories
    };
}
