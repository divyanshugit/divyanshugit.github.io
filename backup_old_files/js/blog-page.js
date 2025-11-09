// ===== BLOG PAGE FUNCTIONALITY =====

class BlogPage {
    constructor() {
        this.currentFilter = 'all';
        this.currentSort = 'date-desc';
        this.init();
    }

    init() {
        this.renderBlogPosts();
        this.renderBlogSeries();
        this.renderTagsCloud();
        this.renderArchive();
        this.initializeFilters();
        this.initializeModal();
    }

    renderBlogPosts() {
        const container = document.getElementById('blogPostsContainer');
        const filteredPosts = this.getFilteredPosts();
        const sortedPosts = this.getSortedPosts(filteredPosts);

        container.innerHTML = '';

        if (sortedPosts.length === 0) {
            container.innerHTML = '<p class="no-results">No blog posts found matching the current filter.</p>';
            return;
        }

        sortedPosts.forEach(post => {
            const postElement = this.createBlogPostElement(post);
            container.appendChild(postElement);
        });
    }

    createBlogPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = `blog-post-item ${post.featured ? 'featured' : ''}`;
        postDiv.dataset.id = post.id;

        const featuredBadge = post.featured ? '<span class="featured-badge">Featured</span>' : '';
        const seriesBadge = post.series ? `<span class="series-badge">${post.series} #${post.seriesNumber}</span>` : '';

        // Format date
        const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        postDiv.innerHTML = `
            <div class="blog-post-header">
                <div class="blog-post-meta">
                    <span class="blog-post-date">${formattedDate}</span>
                    <span class="blog-post-category">${post.category}</span>
                    <span class="blog-post-read-time">${post.readTime}</span>
                </div>
                <div class="blog-post-badges">
                    ${featuredBadge}
                    ${seriesBadge}
                </div>
            </div>
            <h3 class="blog-post-title">${post.title}</h3>
            <p class="blog-post-excerpt">${post.excerpt}</p>
            <div class="blog-post-tags">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <div class="blog-post-actions">
                <a href="blog/${post.slug}.html" class="btn-secondary">Read Full Post</a>
                <button class="btn-secondary" onclick="blogPage.showDetails('${post.id}')">
                    Quick Preview
                </button>
            </div>
        `;

        return postDiv;
    }

    renderBlogSeries() {
        const container = document.getElementById('seriesContainer');
        const series = getBlogSeries();

        container.innerHTML = '';

        if (Object.keys(series).length === 0) {
            container.innerHTML = '<p class="no-series">No blog series available.</p>';
            return;
        }

        Object.entries(series).forEach(([seriesName, posts]) => {
            const seriesDiv = document.createElement('div');
            seriesDiv.className = 'series-item';

            seriesDiv.innerHTML = `
                <h4 class="series-title">${seriesName}</h4>
                <p class="series-description">${posts.length} posts in this series</p>
                <div class="series-posts">
                    ${posts.map(post => `
                        <div class="series-post" onclick="window.location.href='blog/${post.slug}.html'">
                            <span class="series-post-number">#${post.seriesNumber}</span>
                            <span class="series-post-title">${post.title}</span>
                            <span class="series-post-date">${new Date(post.date).toLocaleDateString()}</span>
                        </div>
                    `).join('')}
                </div>
            `;

            container.appendChild(seriesDiv);
        });
    }

    renderTagsCloud() {
        const container = document.getElementById('blogTagsCloud');
        const tags = getAllTags();

        container.innerHTML = '';

        tags.forEach(tag => {
            const tagCount = getBlogPostsByTag(tag).length;
            const tagElement = document.createElement('span');
            tagElement.className = 'tag-cloud-item';
            tagElement.textContent = `${tag} (${tagCount})`;
            tagElement.onclick = () => this.filterByTag(tag);
            container.appendChild(tagElement);
        });
    }

    renderArchive() {
        const container = document.getElementById('archiveContainer');
        const postsByYear = getBlogPostsByYear();

        container.innerHTML = '';

        Object.keys(postsByYear)
            .sort((a, b) => b - a) // Sort years descending
            .forEach(year => {
                const yearDiv = document.createElement('div');
                yearDiv.className = 'archive-year';

                const posts = postsByYear[year].sort((a, b) => new Date(b.date) - new Date(a.date));

                yearDiv.innerHTML = `
                    <h4 class="archive-year-title">${year} (${posts.length} posts)</h4>
                    <div class="archive-posts">
                        ${posts.map(post => `
                            <div class="archive-post" onclick="window.location.href='blog/${post.slug}.html'">
                                <span class="archive-post-title">${post.title}</span>
                                <span class="archive-post-date">${new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                        `).join('')}
                    </div>
                `;

                container.appendChild(yearDiv);
            });
    }

    getFilteredPosts() {
        if (this.currentFilter === 'all') {
            return getAllBlogPosts();
        }

        if (this.currentFilter === 'featured') {
            return getFeaturedBlogPosts();
        }

        return getBlogPostsByCategory(this.currentFilter);
    }

    getSortedPosts(posts) {
        const sorted = [...posts];

        switch (this.currentSort) {
            case 'date-desc':
                return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
            case 'date-asc':
                return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
            case 'title':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            default:
                return sorted;
        }
    }

    initializeFilters() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderBlogPosts();
            });
        });

        // Sort dropdown
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderBlogPosts();
        });
    }

    filterByTag(tag) {
        // Custom filter implementation for tags
        const container = document.getElementById('blogPostsContainer');
        const filteredPosts = getBlogPostsByTag(tag);

        // Update UI to show tag filter
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));

        container.innerHTML = '';

        if (filteredPosts.length === 0) {
            container.innerHTML = `<p class="no-results">No posts found with tag: ${tag}</p>`;
            return;
        }

        const headerDiv = document.createElement('div');
        headerDiv.className = 'filter-header';
        headerDiv.innerHTML = `<h3>Posts tagged: ${tag}</h3>`;
        container.appendChild(headerDiv);

        filteredPosts.forEach(post => {
            const postElement = this.createBlogPostElement(post);
            container.appendChild(postElement);
        });
    }

    initializeModal() {
        const modal = document.getElementById('modalOverlay');
        const closeBtn = document.getElementById('modalClose');

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    showDetails(postId) {
        const post = getBlogPostById(postId);
        if (!post) return;

        document.getElementById('modalTitle').textContent = post.title;

        // Meta information
        const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        document.getElementById('modalMeta').innerHTML = `
            <div class="modal-blog-meta">
                <span class="modal-date">${formattedDate}</span>
                <span class="modal-category">${post.category}</span>
                <span class="modal-read-time">${post.readTime}</span>
            </div>
        `;

        document.getElementById('modalExcerpt').textContent = post.excerpt;

        // Tags
        const tagsContainer = document.getElementById('modalTags');
        tagsContainer.innerHTML = `
            <h4>Tags</h4>
            <div class="modal-tags-list">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        `;

        // Series information
        const seriesContainer = document.getElementById('modalSeries');
        if (post.series) {
            seriesContainer.innerHTML = `
                <h4>Part of Series</h4>
                <div class="modal-series-info">
                    <strong>${post.series}</strong> - Part ${post.seriesNumber}
                </div>
            `;
        } else {
            seriesContainer.innerHTML = '';
        }

        // Links
        const linksContainer = document.getElementById('modalLinks');
        linksContainer.innerHTML = `
            <h4>Read Full Post</h4>
            <div class="modal-blog-links">
                <a href="blog/${post.slug}.html" class="btn-primary">Read Full Post</a>
                <button class="btn-secondary" onclick="blogPage.copyLink('${post.slug}')">Copy Link</button>
            </div>
        `;

        document.getElementById('modalOverlay').style.display = 'flex';
    }

    copyLink(slug) {
        const url = `${window.location.origin}/blog/${slug}`;
        navigator.clipboard.writeText(url).then(() => {
            // Could add a toast notification here
            console.log('Link copied to clipboard');
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.blogPage = new BlogPage();
});
