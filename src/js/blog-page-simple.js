// ===== SIMPLIFIED BLOG PAGE FUNCTIONALITY =====
// Works with server-rendered HTML from 11ty collections

class BlogPage {
    constructor() {
        this.currentFilter = 'all';
        this.currentSort = 'date-desc';
        this.allPosts = [];
        this.init();
    }

    init() {
        // Get all blog post elements that were server-rendered
        this.allPosts = Array.from(document.querySelectorAll('.blog-post-item'));
        this.initializeFilters();
        this.initializeSort();
    }

    initializeFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Apply filter
                this.currentFilter = button.dataset.filter;
                this.applyFiltersAndSort();
            });
        });
    }

    initializeSort() {
        const sortSelect = document.getElementById('sort-select');

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.applyFiltersAndSort();
            });
        }
    }

    applyFiltersAndSort() {
        // Filter posts
        this.allPosts.forEach(post => {
            const shouldShow = this.shouldShowPost(post);
            post.style.display = shouldShow ? 'block' : 'none';
        });

        // Sort visible posts
        const container = document.getElementById('blogPostsContainer');
        const visiblePosts = this.allPosts.filter(post => post.style.display !== 'none');

        visiblePosts.sort((a, b) => this.comparePost(a, b));

        // Re-append in sorted order
        visiblePosts.forEach(post => container.appendChild(post));
    }

    shouldShowPost(postElement) {
        const filter = this.currentFilter;

        if (filter === 'all') return true;
        if (filter === 'featured') return postElement.dataset.featured === 'true';

        // Check if filter matches any tag
        const tags = postElement.dataset.tags || '';
        return tags.split(',').some(tag => tag.trim().toLowerCase() === filter.toLowerCase());
    }

    comparePost(a, b) {
        switch (this.currentSort) {
            case 'date-desc':
                return new Date(b.dataset.date) - new Date(a.dataset.date);
            case 'date-asc':
                return new Date(a.dataset.date) - new Date(b.dataset.date);
            case 'title':
                const titleA = a.querySelector('.blog-post-title').textContent;
                const titleB = b.querySelector('.blog-post-title').textContent;
                return titleA.localeCompare(titleB);
            default:
                return 0;
        }
    }
}

// Initialize when DOM is ready
if (document.getElementById('blogPostsContainer')) {
    document.addEventListener('DOMContentLoaded', () => {
        window.blogPage = new BlogPage();
    });
}

