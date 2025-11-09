// ===== NEWS DATA =====
// Centralized news and announcements for easy maintenance

const news = [
    {
        id: "aaai-2026-workshops",
        date: "Nov 2025",
        content: "Two papers accepted to <b>AAAI 2026</b> workshops: one in AI Governance (AIGOV) and one in Graphs and Complex Structures for Learning and Reasoning (GCLR).",
        featured: true,
        links: {
            "AIGOV": "#",
            "GCLR": "#"
        }
    },
    {
        id: "neurips-2025-workshops",
        date: "Sep 2025",
        content: "Three papers accepted to <b>NeurIPS 2025</b> workshops: one at LLM Evaluation and two at Reliable ML from Unreliable Data.",
        featured: true,
        links: {
            "LLM Evaluation": "#",
            "Reliable ML from Unreliable Data": "#"
        }
    },
    {
        id: "logml",
        date: "July 2025",
        content: "[ONLINE] Participated in <b>LOGML 2025</b> (July 7–11), focusing on research in graph reasoning with large language models.",
        featured: true,
        links: {
            "LOGML": "https://logml.ai"
        }
    },
    {
        id: "neurips-2024-workshops",
        date: "Oct 2024",
        content: "Three papers accepted at <b>NeurIPS 2024</b> workshops: Safe Generative AI, Red Teaming GenAI, and Pluralistic Alignment",
        featured: true,
        links: {
            "Safe GenAI": "https://openreview.net/forum?id=tYDn5pGs5P",
            "Red Teaming": "https://openreview.net/forum?id=ftHy6rA8LL",
            "Pluralistic": "https://openreview.net/forum?id=wl2vBu8jX4"
        }
    },
    {
        id: "quantization-paper",
        date: "Apr 2024",
        content: "Published \"Increased LLM Vulnerabilities from Fine-tuning and Quantization\" on arXiv",
        featured: true,
        links: {
            "arXiv": "https://arxiv.org/abs/2404.04392"
        }
    },
    {
        id: "presentation-he",
        date: "Oct 2023",
        content: "Presented a work on Efficient Homemorphic Enkryption in LLMs at AI-ML Systems 2023."
    },
    {
        id: "ai-ml-systems-demo-track",
        date: "Oct 2023",
        content: "Enkrypt AI A Robust Model Rights Management Solution for Secure AI Deployment got accepted in Demo Track of AI-ML Systems 2023.",
        links: {
            "AI-ML Systems (Demo Track)": "https://www.aimlsystems.org/2023/accepted-demo-track/"
        }

    },
    {
        id: "enkrypt-join",
        date: "2023",
        content: "Joined Enkrypt AI as Founding ML Research Engineer",
        featured: true,
        links: {
            "Enkrypt AI": "https://enkryptai.com"
        }
    },
    // {
    //     id: "iisc-research",
    //     date: "2023",
    //     content: "Completed research associate position at IISc Bangalore working on Neural Machine Translation and Machine Unlearning",
    //     featured: false
    // },
    {
        id: "iisc-research",
        date: "2022",
        content: "Jonied IISc Bangalore as Research Associate. Will be working on Neural Machine Translation for Indic Languages under the gudidance of Prof. Prathosh AP.",
        featured: false
    },
    {
        id: "graduation",
        date: "2022",
        content: "Graduated from Narula Institute of Technology, Kolkata with a Bachelor of Technology in Electronics and Communication Engineering."

    }
];

// Helper functions
function getFeaturedNews(limit = 4) {
    return news.filter(item => item.featured).slice(0, limit);
}

function getAllNews() {
    return news;
}

function getNewsByYear() {
    const grouped = {};
    news.forEach(item => {
        const year = item.date.includes('2024') ? '2024' :
            item.date.includes('2023') ? '2023' : 'Other';
        if (!grouped[year]) {
            grouped[year] = [];
        }
        grouped[year].push(item);
    });
    return grouped;
}

function getNewsById(id) {
    return news.find(item => item.id === id);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        news,
        getFeaturedNews,
        getAllNews,
        getNewsByYear,
        getNewsById
    };
}
