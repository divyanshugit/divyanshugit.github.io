// ===== HOMEPAGE DYNAMIC CONTENT =====
// Automatically loads featured content from data files

class Homepage {
    constructor() {
        this.init();
    }

    init() {
        this.loadFeaturedPublications();
        this.loadFeaturedProjects();
        this.loadRecentNews();
        this.loadFeaturedBlogPosts();
    }

    loadFeaturedPublications() {
        const container = document.getElementById('featured-publications');
        if (!container) return;

        // Get featured publications from data
        const featuredPubs = getFeaturedPublications();

        container.innerHTML = '';

        featuredPubs.forEach(pub => {
            const pubElement = this.createPublicationElement(pub);
            container.appendChild(pubElement);
        });
    }

    createPublicationElement(pub) {
        const pubDiv = document.createElement('div');
        pubDiv.className = 'publication';

        // Format authors with bold for Divyanshu Kumar
        const authorsHtml = pub.authors.map(author =>
            author.includes('Divyanshu Kumar') ? `<strong>${author}</strong>` : author
        ).join(', ');

        // Create links HTML
        const linksHtml = this.createLinksHtml(pub.links);

        pubDiv.innerHTML = `
            <div class="pub-title">${pub.title}</div>
            <div class="pub-authors">${authorsHtml}</div>
            <div class="pub-venue">${pub.venue}, ${pub.year}</div>
            <div class="pub-description">${pub.description}</div>
            ${linksHtml ? `<div class="pub-links">${linksHtml}</div>` : ''}
        `;

        return pubDiv;
    }

    loadFeaturedProjects() {
        const container = document.getElementById('featured-projects');
        if (!container) return;

        // Get featured projects from data
        const featuredProjects = getFeaturedProjects();

        container.innerHTML = '';

        featuredProjects.slice(0, 2).forEach(project => { // Show only top 2 on homepage
            const projectElement = this.createProjectElement(project);
            container.appendChild(projectElement);
        });
    }

    createProjectElement(project) {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'project';

        // Create links HTML
        const linksHtml = this.createLinksHtml(project.links);

        // Handle different project data structures
        let descriptionHtml = project.description;

        // If project has experiments, highlight them
        if (project.experiments && project.experiments.length > 0) {
            const experimentsText = project.experiments
                .map(exp => `<strong>${exp.name}</strong> (${exp.description})`)
                .join(', ');
            descriptionHtml = `${project.description}: ${experimentsText}`;
        }

        // If project has achievements, show key ones
        if (project.achievements && project.achievements.length > 0) {
            const keyAchievement = project.achievements[0]; // Show first achievement
            descriptionHtml += ` ${keyAchievement}`;
        }

        projectDiv.innerHTML = `
            <div class="project-title">${project.title}</div>
            <div class="project-description">${descriptionHtml}</div>
            ${linksHtml ? `<div class="project-links">${linksHtml}</div>` : ''}
        `;

        return projectDiv;
    }

    createLinksHtml(links) {
        if (!links || Object.keys(links).length === 0) return '';

        return Object.entries(links)
            .map(([type, url]) => `<a href="${url}" target="_blank">${type}</a>`)
            .join(' / ');
    }

    loadRecentNews() {
        const container = document.getElementById('recent-news');
        if (!container) return;

        // Get featured news from data
        const recentNews = getFeaturedNews(4); // Show top 4 news items

        container.innerHTML = '';

        recentNews.forEach(newsItem => {
            const newsElement = this.createNewsElement(newsItem);
            container.appendChild(newsElement);
        });
    }

    createNewsElement(newsItem) {
        const newsDiv = document.createElement('div');
        newsDiv.className = 'news-item';

        // Create links if they exist
        let contentHtml = newsItem.content;
        if (newsItem.links && Object.keys(newsItem.links).length > 0) {
            const linksHtml = Object.entries(newsItem.links)
                .map(([text, url]) => `<a href="${url}" target="_blank">${text}</a>`)
                .join(', ');
            contentHtml += ` [${linksHtml}]`;
        }

        newsDiv.innerHTML = `
            <span class="news-date">${newsItem.date}</span>
            <span class="news-text">${contentHtml}</span>
        `;

        return newsDiv;
    }

    loadFeaturedBlogPosts() {
        const container = document.getElementById('featured-blog-posts');
        if (!container) return;

        // Get featured blog posts from data
        const featuredBlogPosts = getFeaturedBlogPosts(3); // Show top 3 blog posts

        container.innerHTML = '';

        featuredBlogPosts.forEach(post => {
            const blogElement = this.createBlogPostElement(post);
            container.appendChild(blogElement);
        });
    }

    createBlogPostElement(post) {
        const blogDiv = document.createElement('div');
        blogDiv.className = 'blog-post-preview';

        // Format date
        const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const seriesBadge = post.series ? ` • ${post.series} #${post.seriesNumber}` : '';

        blogDiv.innerHTML = `
            <div class="blog-preview-header">
                <span class="blog-preview-date">${formattedDate}</span>
                <span class="blog-preview-category">${post.category}${seriesBadge}</span>
            </div>
            <h4 class="blog-preview-title">
                <a href="blog/${post.slug}.html">${post.title}</a>
            </h4>
            <p class="blog-preview-excerpt">${post.excerpt}</p>
            <div class="blog-preview-meta">
                <span class="blog-preview-read-time">${post.readTime}</span>
                <a href="blog/${post.slug}.html" class="blog-preview-link">Read more</a>
            </div>
        `;

        return blogDiv;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the homepage (has featured-publications element)
    if (document.getElementById('featured-publications')) {
        new Homepage();
    }
});
