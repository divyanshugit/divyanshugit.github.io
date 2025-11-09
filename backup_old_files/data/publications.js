// ===== PUBLICATIONS DATA =====
// Centralized data structure for easy maintenance

const publications = [
    {

        id: "socioeval",
        title: "SocioEval: A Template-Based Framework for Evaluating Socioeconomic Status Bias in Foundation Models",
        authors: ["Divyanshu Kumar", "Ishita Gupta", "Nitin Aravind Birur", "Tanay Baswa", "Sahil Agarwal", "Prashanth Harshangi"],
        venue: "3rd Workshop on AI Governance (AIGOV) at AAAI 2026",
        year: 2025,
        month: 11,
        status: "published",
        description: "SocioEval: A Template-Based Framework for Evaluating Socioeconomic Status Bias in Foundation Models",
        abstract: "As Large Language Models (LLMs) increasingly power decision-making systems across critical domains, understanding and mitigating their biases becomes essential for responsible AI deployment. Although bias assessment frameworks have proliferated for attributes such as race and gender, socioeconomic status bias remains significantly underexplored despite its widespread implications in the real world. We introduce SocioEval, a template-based framework for systematically evaluating socioeconomic bias in foundation models through decision-making tasks. Our hierarchical framework encompasses 8 themes and 18 topics, generating 240 prompts across 6 class-pair combinations. We evaluated 13 frontier LLMs on 3,120 responses using a rigorous three-stage annotation protocol, revealing substantial variation in bias rates (0.42%-33.75%). Our findings demonstrate that bias manifests differently across themes lifestyle judgments show 10x higher bias than education-related decisions and that deployment safeguards effectively prevent explicit discrimination but show brittleness to domain-specific stereotypes. SocioEval provides a scalable, extensible foundation for auditing class-based bias in language models.",
        tags: ["Socioeconomic Status", "Foundation Models", "NLP"],
        featured: false // Shows on homepage
    },
    {
        id: "graphreasoning",
        title: "Lost in Serialization: Invariance and Generalization of LLM Graph Reasoners",
        authors: ["Daniel Herbst*", "Lea Karbevska*", "Divyanshu Kumar*", "Akanksha Ahuja*", "Fatemeh Gholamzadeh Nasrabadi*", "Fabrizio Frasca"],
        venue: "5th Workshop on Graphs and Complex Structures for Learning and Reasoning (GCLR) at AAAI 2026",
        year: 2025,
        month: 11,
        status: "published",
        description: "Lost in Serialization: Invariance and Generalization of LLM Graph Reasoners",
        abstract: "While promising, graph reasoners based on Large Language Models (LLMs) lack built-in invariance to symmetries in graph representations. Operating on sequential graph serializations, LLMs can produce different outputs under node reindexing, edge reordering, or formatting changes, raising robustness concerns. We systematically analyze these effects, studying how fine-tuning impacts encoding sensitivity as well generalization on unseen tasks. We propose a principled decomposition of graph serializations into node labeling, computational structure, and surface encoding, and evaluate LLM robustness to variations of each of these factors on a comprehensive benchmarking suite. We also contribute a novel set of spectral tasks to further assess generalization abilities of fine-tuned reasoners. Results show that larger (non-fine-tuned) models are more robust, and fine-tuning reduces sensitivity to node relabeling but may increase it to variations in structure and format, while it does not consistently improve performance on unseen tasks.",
        tags: ["Graph Reasoning", "LLM", "NLP"],
        featured: true // Shows on homepage
    },
    {
        id: "agentredteaming",
        title: "Black-Box Red Teaming of Agentic AI: A Taxonomy-Driven Framework for Automated Risk Discovery",
        authors: ["Divyanshu Kumar", "Nitin Aravind Birur", "Tanay Baswa", "Sahil Agarwal", "Prashanth Harshangi"],
        venue: "arXiv preprint",
        year: 2025,
        month: 10,
        status: "preprint",
        description: "Black-Box Red Teaming of Agentic AI: A Taxonomy-Driven Framework for Automated Risk Discovery",
        abstract: "  Agentic systems are moving from prototypes to production, where they read untrusted inputs, call tools with real permissions, persist state, and act on a user's behalf, which expands the security and safety surface beyond chat-only models. Yet most standard evaluations remain single turn, for example multitask multiple choice and docstring-to-code tests, which are weak indicators of reliability in long-horizon settings where actions have consequences. Emerging agent benchmarks further show that interactive environments reveal qualitatively different failure modes compared with static leaderboards, underscoring the need for evaluations that track behavior over multi-step tasks and tool use. We present a systematic black-box framework for risk-aware agent evaluation that requires only basic system descriptions to initiate comprehensive red teaming. Our approach introduces: (1) a seven-domain taxonomy mapping observable behaviors to specific risk categories, (2) fully automated SAGE-RT powered red teaming producing 120 adversarial scenarios per domain without human intervention, and (3) human-in-the-loop evaluation of results where automated LLM judges provide initial scoring followed by expert validation of critical findings. Empirical validation across two production-ready agent architectures (single-agent CrewAI and multi-agent AutoGen) with four base models reveals alarming vulnerability patterns: 56.25\% average governance risk across all systems, 65\% privacy risk in multi-agent configurations, and critical agent behavior vulnerabilities reaching 85\% in specific model-architecture combinations. Notably, our black-box approach discovered 98\% of vulnerabilities identified by Unit 42's white-box analysis, while requiring 10x less manual effort. These findings demonstrate that systematic, taxonomy-guided evaluation can effectively identify architectural vulnerabilities without privileged access, providing a scalable path toward safer agent deployments.",
        tags: ["Agentic AI", "Red Teaming", "NLP"],
        featured: false // Shows on homepage
    },
    {
        id: "multimodalredteaming",
        title: "Beyond Text: Multimodal Jailbreaking of Vision-Language and Audio Models through Perceptually Simple Transformations",
        authors: ["Divyanshu Kumar*", "Shreyas Jena*", "Nitin Aravind Birur", "Tanay Baswa", "Sahil Agarwal", "Prashanth Harshangi"],
        venue: "NeurIPS Reliable ML from Unreliable Data Workshop",
        year: 2025,
        month: 10,
        status: "published",
        description: "Multimodal Jailbreaking of Vision-Language and Audio Models through Perceptually Simple Transformations",
        abstract: "Multimodal large language models (MLLMs) have achieved remarkable progress, yet remain critically vulnerable to adversarial attacks that exploit weaknesses in cross-modal processing. We present a systematic study of multimodal jailbreaks targeting both vision-language and audio-language models, showing that even simple perceptual transformations can reliably bypass state-of-the-art safety filters. Our evaluation spans 1,900 adversarial prompts across three high-risk safety categories harmful content, CBRN (Chemical, Biological, Radiological, Nuclear), and CSEM (Child Sexual Exploitation Material) tested against seven frontier models. We explore the effectiveness of attack techniques on MLLMs, including FigStep-Pro (visual keyword decomposition), Intelligent Masking (semantic obfuscation), and audio perturbations (Wave-Echo, Wave-Pitch, Wave-Speed). The results reveal severe vulnerabilities: models with almost perfect text-only safety (0\% ASR) suffer >75\% attack success under perceptually modified inputs, with FigStep-Pro achieving up to 89\% ASR in Llama-4 variants. Audio-based attacks further uncover provider-specific weaknesses, with even basic modality transfer yielding 25\% ASR for technical queries. These findings expose a critical gap between text-centric alignment and multimodal threats, demonstrating that current safeguards fail to generalize across cross-modal attacks. The accessibility of these attacks, which require minimal technical expertise, suggests that robust multimodal AI safety will require a paradigm shift toward boarder semantic-level reasoning to mitigate possible risks.",
        tags: ["Multimodal", "Jailbreaking", "Vision-Language", "Audio", "NLP"],
        featured: true // Shows on homepage

    },
    {
        id: "cbrnllm",
        title: "Quantifying CBRN Risk in Frontier Models",
        authors: ["Divyanshu Kumar", "Nitin Aravind Birur", "Tanay Baswa", "Sahil Agarwal", "Prashanth Harshangi"],
        venue: "NeurIPS Reliable ML from Unreliable Data Workshop",
        year: 2025,
        month: 10,
        status: "published",
        description: "Quantifying CBRN Risk in Frontier Models",
        abstract: "  Frontier Large Language Models (LLMs) pose unprecedented dual-use risks through the potential proliferation of chemical, biological, radiological, and nuclear (CBRN) weapons knowledge. We present the first comprehensive evaluation of 10 leading commercial LLMs against both a novel 200-prompt CBRN dataset and a 180-prompt subset of the FORTRESS benchmark, using a rigorous three-tier attack methodology. Our findings expose critical safety vulnerabilities: Deep Inception attacks achieve 86.0\% success versus 33.8\% for direct requests, demonstrating superficial filtering mechanisms; Model safety performance varies dramatically from 2\% (claude-opus-4) to 96\% (mistral-small-latest) attack success rates; and eight models exceed 70\% vulnerability when asked to enhance dangerous material properties. We identify fundamental brittleness in current safety alignment, where simple prompt engineering techniques bypass safeguards for dangerous CBRN information. These results challenge industry safety claims and highlight urgent needs for standardized evaluation frameworks, transparent safety metrics, and more robust alignment techniques to mitigate catastrophic misuse risks while preserving beneficial capabilities.",
        tags: ["CBRN", "Risk", "Frontier Models", "NLP"],
        featured: false // Shows on homepage


    },
    {
        id: "partisanbias",
        title: "Beyond Western Politics: Cross-Cultural Benchmarks for Evaluating Partisan Associations in LLMs",
        authors: ["Divyanshu Kumar*", "Isita Gupta*", "Nitin Aravind Birur", "Tanay Baswa", "Sahil Agarwal", "Prashanth Harshangi"],
        venue: "NeurIPS LLM Evaluation Workshop (Poster)",
        year: 2025,
        month: 9, // October
        status: "published",
        description: "Beyond Western Politics: Cross-Cultural Benchmarks for Evaluating Partisan Associations in LLMs",
        abstract: "Partisan bias in LLMs has been evaluated to assess political leanings, typically through a broad lens and largely in Western contexts. We move beyond identifying general leanings to examine harmful, adversarial representational associations around political leaders and parties. To do so, we create datasets \textit{NeutQA-440} (non-adversarial prompts) and \textit{AdverQA-440} (adversarial prompts), which probe models for comparative plausibility judgments across the USA and India. Results show high susceptibility to biased partisan associations and pronounced asymmetries (e.g., substantially more favorable associations for U.S. Democrats than Republicans) alongside mixed-polarity concentration around India's BJP, highlighting systemic risks and motivating standardized, cross-cultural evaluation.",
        tags: ["Partisan Bias", "Large Language Models", "NLP"],
        featured: false // Shows on homepage
    },
    {
        id: "kumar2025nfl",
        title: "No Free Lunch with Guardrails",
        authors: ["Divyanshu Kumar", "Nitin Aravind Birur", "Tanay Baswa", "Sahil Agarwal", "Prashanth Harshangi"],
        venue: "arXiv preprint",
        year: 2025,
        month: 4, // April
        status: "preprint",
        description: "Explores the tradeoffs between security and usability in AI guardrails, introducing a framework to evaluate different guardrail systems and proposing better design principles.",
        abstract: "As large language models (LLMs) and generative AI become widely adopted, guardrails have emerged as a key tool to ensure their safe use. However, adding guardrails isn't without tradeoffs; stronger security measures can reduce usability, while more flexible systems may leave gaps for adversarial attacks. In this work, we explore whether current guardrails effectively prevent misuse while maintaining practical utility. We introduce a framework to evaluate these tradeoffs, measuring how different guardrails balance risk, security, and usability, and build an efficient guardrail. Our findings confirm that there is no free lunch with guardrails; strengthening security often comes at the cost of usability. To address this, we propose a blueprint for designing better guardrails that minimize risk while maintaining usability.",
        links: {
            paper: "https://arxiv.org/abs/2504.00441",
            arxiv: "2504.00441"
        },
        tags: ["Guardrails", "AI Safety", "Security", "Usability", "LLMs"],
        featured: false // Shows on homepage
    },
    {
        id: "kumar2024investigating",
        title: "Investigating Implicit Bias in Large Language Models: A Large-Scale Study of Over 50 LLMs",
        authors: ["Divyanshu Kumar*", "Umang Jain*", "Sahil Agarwal", "Prashanth Harshangi"],
        venue: "NeurIPS Safe Generative AI Workshop (Poster)",
        year: 2024,
        month: 12, // December (setting to December to ensure it appears first)
        status: "published",
        description: "Large-scale empirical study investigating implicit biases across more than 50 different large language models, revealing systematic patterns in model behavior.",
        abstract: "We conduct a comprehensive investigation of implicit bias in large language models through systematic evaluation of over 50 different LLMs. Our study reveals concerning patterns of bias that persist across different model architectures, training methodologies, and deployment strategies. We provide insights into the sources of these biases and propose mitigation strategies for safer AI deployment.",
        links: {
            paper: "https://openreview.net/forum?id=tYDn5pGs5P",
            openreview: "tYDn5pGs5P"
        },
        tags: ["Bias", "Fairness", "LLMs", "Safety", "Evaluation"],
        featured: false // Shows on homepage
    },
    {
        id: "kumar2024sagert",
        title: "SAGE-RT: Synthetic Alignment data Generation for Safety Evaluation and Red Teaming",
        authors: ["Anurakt Kumar*", "Divyanshu Kumar*", "Jatan Loya", "Nitin Aravind Birur", "Tanay Baswa", "Sahil Agarwal", "Prashanth Harshangi"],
        venue: "NeurIPS Red Teaming GenAI Workshop (Poster)",
        year: 2024,
        month: 10, // October
        status: "published",
        description: "Novel framework for generating synthetic alignment data specifically designed for safety evaluation and red teaming of generative AI systems.",
        abstract: "We introduce SAGE-RT, a comprehensive framework for generating synthetic alignment data tailored for safety evaluation and red teaming of generative AI systems. Our approach addresses the critical need for diverse, high-quality evaluation datasets in AI safety research by providing automated generation of challenging test cases.",
        links: {
            paper: "https://openreview.net/forum?id=ftHy6rA8LL",
            openreview: "ftHy6rA8LL"
        },
        tags: ["Red Teaming", "AI Safety", "Synthetic Data", "Alignment", "Evaluation"],
        featured: true // Shows on homepage
    },
    {
        id: "baswa2024efficacy",
        title: "Efficacy of the SAGE-RT Dataset for Model Safety Alignment: A Comparative Study",
        authors: ["Tanay Baswa", "Nitin Aravind Birur", "Divyanshu Kumar", "Jatan Loya", "Anurakt Kumar", "Prashanth Harshangi", "Sahil Agarwal"],
        venue: "NeurIPS Pluralistic Alignment Workshop (Poster)",
        year: 2024,
        month: 10, // October
        status: "published",
        description: "Comprehensive evaluation of the SAGE-RT dataset's effectiveness for improving model safety alignment through comparative analysis across multiple models and metrics.",
        abstract: "This work presents a thorough evaluation of the SAGE-RT dataset's impact on model safety alignment. Through comparative studies across various model architectures and safety metrics, we demonstrate the dataset's effectiveness in improving alignment while maintaining model utility.",
        links: {
            paper: "https://openreview.net/forum?id=wl2vBu8jX4",
            openreview: "wl2vBu8jX4"
        },
        tags: ["Safety Alignment", "Dataset Evaluation", "Model Safety", "Comparative Study"],
        featured: false // Only on publications page
    },
    {
        id: "birur2024vera",
        title: "VERA: Validation and Enhancement for Retrieval Augmented Systems",
        authors: ["Nitin Aravind Birur", "Tanay Baswa", "Divyanshu Kumar", "Jatan Loya", "Sahil Agarwal", "Prashanth Harshangi"],
        venue: "arXiv preprint",
        year: 2024,
        month: 9, // September
        status: "preprint",
        description: "Framework for validating and enhancing retrieval-augmented generation systems, addressing key challenges in RAG system reliability and performance.",
        abstract: "We present VERA, a comprehensive framework for validation and enhancement of retrieval-augmented generation systems. Our approach addresses critical challenges in RAG system deployment including retrieval quality, generation consistency, and system reliability through systematic validation and enhancement techniques.",
        links: {
            paper: "https://arxiv.org/abs/2409.15364",
            arxiv: "2409.15364"
        },
        tags: ["RAG", "Retrieval Systems", "Validation", "Enhancement", "NLP"],
        featured: false // Only on publications page
    },
    {
        id: "kumar2024vulnerabilities",
        title: "Increased LLM Vulnerabilities from Fine-tuning and Quantization",
        authors: ["Divyanshu Kumar", "Anurakt Kumar", "Sahil Agarwal", "Prashanth Harshangi"],
        venue: "arXiv preprint",
        year: 2024,
        month: 4, // April
        status: "preprint",
        description: "Demonstrates how common efficiency techniques can significantly increase model vulnerability to adversarial attacks, challenging the assumption that compression is security-neutral.",
        abstract: "Model quantization and fine-tuning have become essential techniques for deploying large language models in resource-constrained environments. However, their impact on model security has been largely overlooked. In this work, we conduct the first systematic study of how quantization and fine-tuning affect adversarial robustness in LLMs. Through comprehensive experiments across multiple model families and quantization schemes, we demonstrate that aggressive quantization can increase attack success rates significantly compared to full-precision models.",
        links: {
            paper: "https://arxiv.org/abs/2404.04392",
            arxiv: "2404.04392"
        },
        tags: ["Quantization", "Adversarial Attacks", "Model Compression", "Security", "LLMs"],
        featured: false // Shows on homepage
    },
];

// Helper functions for data manipulation
function getFeaturedPublications() {
    return publications
        .filter(pub => pub.featured)
        .sort((a, b) => {
            // Sort by year (descending) and then by month (descending)
            if (a.year !== b.year) return b.year - a.year;
            return (b.month || 0) - (a.month || 0);
        });
}

function getPublicationsByYear() {
    // First, sort the publications by year and month
    const sortedPubs = [...publications].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return (b.month || 0) - (a.month || 0);
    });

    // Then group them by year
    const grouped = {};
    sortedPubs.forEach(pub => {
        if (!grouped[pub.year]) {
            grouped[pub.year] = [];
        }
        grouped[pub.year].push(pub);
    });
    return grouped;
}

function getPublicationsByTag(tag) {
    return publications
        .filter(pub => pub.tags.includes(tag))
        .sort((a, b) => {
            // Sort by year (descending) and then by month (descending)
            if (a.year !== b.year) return b.year - a.year;
            return (b.month || 0) - (a.month || 0);
        });
}

function getPublicationById(id) {
    return publications.find(pub => pub.id === id);
}

// Get all publications sorted by year and month
function getAllPublicationsSorted() {
    return [...publications].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return (b.month || 0) - (a.month || 0);
    });
}

// Format month as text
function getMonthName(monthNum) {
    const months = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
    ];
    return months[(monthNum || 1) - 1] || '';
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        publications,
        getFeaturedPublications,
        getPublicationsByYear,
        getPublicationsByTag,
        getPublicationById,
        getAllPublicationsSorted,
        getMonthName
    };
}
