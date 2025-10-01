// ===== PROJECTS DATA =====
// Centralized project information for easy maintenance

const projects = [
    {
        id: "speaker-stream",
        title: "SpeakerStream",
        status: "completed",
        description: "SpeakerStream aims to provide an accurate and efficient solution for speaker diarization and transcription from video sources in real-time.",
        fullDescription: "SpeakerStream is a comprehensive solution for real-time speaker diarization and transcription from video sources. The system combines advanced audio processing techniques with machine learning models to accurately identify different speakers and transcribe their speech in real-time applications.",
        achievements: [
            "Real-time speaker diarization with high accuracy",
            "Efficient video processing pipeline",
            "Scalable architecture for multiple concurrent streams",
            "Integration with popular streaming platforms"
        ],
        technologies: ["Python", "PyTorch", "Audio Processing", "Real-time Systems", "Docker"],
        collaboration: "Independent project",
        links: {
            demo: "/projects/speakerstream/",
            code: "https://github.com/divyanshugit/speakerstream"
        },
        featured: true // Shows on homepage
    },
    {
        id: "envisedge",
        title: "EnvisEdge",
        status: "completed",
        description: "Edge computing solution for computer vision applications with optimized inference and deployment capabilities.",
        fullDescription: "EnvisEdge is an edge computing platform specifically designed for computer vision applications. The project focuses on optimizing deep learning models for deployment on edge devices while maintaining high accuracy and low latency for real-world applications.",
        contributions: [
            "Optimized model deployment for edge devices",
            "Real-time computer vision processing",
            "Efficient resource utilization",
            "Scalable edge computing architecture"
        ],
        technologies: ["Python", "TensorFlow", "Edge Computing", "Computer Vision", "Optimization"],
        links: {
            demo: "/projects/envisedge/",
            code: "https://github.com/divyanshugit/envisedge"
        },
        featured: true // Shows on homepage
    },
    {
        id: "commonlit-readability",
        title: "CommonLit Readability Prize",
        status: "completed",
        description: "ML models for rating the complexity of reading passages for Grade 3-12 classroom use, achieving competitive performance in Kaggle competition.",
        fullDescription: "This Kaggle competition project focused on developing machine learning models to automatically rate the complexity of reading passages for educational use in grades 3-12. The challenge involved creating models that could accurately assess text difficulty to help educators select appropriate reading materials for their students.",
        achievements: [
            "Competitive ranking in Kaggle competition",
            "RMSE-based evaluation for text complexity",
            "Educational impact for classroom applications",
            "Robust model performance across diverse text types"
        ],
        technologies: ["Python", "Scikit-learn", "NLP", "Feature Engineering", "Kaggle"],
        links: {
            competition: "https://www.kaggle.com/c/commonlitreadabilityprize",
            code: "https://github.com/divyanshugit/commonlit-readability"
        },
        featured: false // Only on projects page
    },
    {
        id: "vera-rag",
        title: "VERA: Validation and Enhancement for RAG Systems",
        status: "active",
        description: "Framework for validating and enhancing retrieval-augmented generation systems, addressing key challenges in RAG system reliability.",
        fullDescription: "VERA is a comprehensive framework designed to validate and enhance retrieval-augmented generation (RAG) systems. The project addresses critical challenges in RAG deployment including retrieval quality, generation consistency, and overall system reliability through systematic validation and enhancement techniques.",
        currentWork: [
            "RAG system validation methodologies",
            "Enhancement techniques for retrieval quality",
            "Consistency metrics for generation",
            "Reliability frameworks for production deployment"
        ],
        technologies: ["Python", "LangChain", "Vector Databases", "RAG", "Evaluation"],
        links: {
            paper: "https://arxiv.org/abs/2409.15364",
            code: "https://github.com/divyanshugit/vera"
        },
        featured: false // Only on projects page
    }
];

// Helper functions
function getFeaturedProjects() {
    return projects.filter(project => project.featured);
}

function getActiveProjects() {
    return projects.filter(project => project.status === 'active');
}

function getProjectById(id) {
    return projects.find(project => project.id === id);
}

function getProjectsByTechnology(tech) {
    return projects.filter(project =>
        project.technologies && project.technologies.includes(tech)
    );
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        projects,
        getFeaturedProjects,
        getActiveProjects,
        getProjectById,
        getProjectsByTechnology
    };
}
