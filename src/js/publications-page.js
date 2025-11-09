// ===== PUBLICATIONS PAGE FUNCTIONALITY =====

class PublicationsPage {
    constructor() {
        this.currentFilter = 'all';
        this.currentSort = 'year-desc';
        this.init();
    }

    init() {
        this.renderPublications();
        this.renderStatistics();
        this.renderTagsCloud();
        this.initializeFilters();
        this.initializeModal();
    }

    renderPublications() {
        const container = document.getElementById('publicationsContainer');
        const filteredPubs = this.getFilteredPublications();
        const sortedPubs = this.getSortedPublications(filteredPubs);

        container.innerHTML = '';

        if (sortedPubs.length === 0) {
            container.innerHTML = '<p class="no-results">No publications found matching the current filter.</p>';
            return;
        }

        // Group by year for better organization
        const groupedByYear = {};
        sortedPubs.forEach(pub => {
            if (!groupedByYear[pub.year]) {
                groupedByYear[pub.year] = [];
            }
            groupedByYear[pub.year].push(pub);
        });

        Object.keys(groupedByYear)
            .sort((a, b) => b - a)
            .forEach(year => {
                const yearSection = document.createElement('div');
                yearSection.className = 'year-section';
                yearSection.innerHTML = `<h3 class="year-header">${year}</h3>`;

                groupedByYear[year].forEach(pub => {
                    const pubElement = this.createPublicationElement(pub);
                    yearSection.appendChild(pubElement);
                });

                container.appendChild(yearSection);
            });
    }

    createPublicationElement(pub) {
        const pubDiv = document.createElement('div');
        pubDiv.className = `publication-item ${pub.status}`;
        pubDiv.dataset.id = pub.id;

        const statusBadge = this.getStatusBadge(pub.status);
        const authorsHtml = pub.authors.map(author =>
            author === 'Divyanshu Kumar' ? `<strong>${author}</strong>` : author
        ).join(', ');

        pubDiv.innerHTML = `
            <div class="pub-header">
                <div class="pub-title-section">
                    <h4 class="pub-title">${pub.title}</h4>
                    ${statusBadge}
                </div>
            </div>
            <div class="pub-authors">${authorsHtml}</div>
            <div class="pub-venue">${pub.venue}, ${pub.year}</div>
            <div class="pub-description">${pub.description}</div>
            <div class="pub-tags">
                ${pub.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <div class="pub-actions">
                <button class="btn-secondary" onclick="publicationsPage.showDetails('${pub.id}')">
                    View Details
                </button>
                ${this.createLinksHtml(pub.links)}
            </div>
        `;

        return pubDiv;
    }

    getStatusBadge(status) {
        const badges = {
            'under-review': '<span class="status-badge under-review">Under Review</span>',
            'preprint': '<span class="status-badge preprint">Preprint</span>',
            'published': '<span class="status-badge published">Published</span>'
        };
        return badges[status] || '';
    }

    createLinksHtml(links) {
        if (!links) return '';

        const iconMap = {
            'paper': '📄',
            'arxiv': '📝',
            'openreview': '📋',
            'github': '💻',
            'code': '💻',
            'demo': '🚀',
            'website': '🌐',
            'slides': '📊',
            'poster': '🖼️',
            'video': '🎥',
            'dataset': '📊',
            'blog': '✍️'
        };

        return Object.entries(links)
            .map(([type, url]) => {
                const icon = iconMap[type.toLowerCase()] || '🔗';
                const displayName = type.charAt(0).toUpperCase() + type.slice(1);
                return `<a href="${url}" class="pub-link" target="_blank">${icon} ${displayName}</a>`;
            })
            .join(' ');
    }

    getFilteredPublications() {
        if (this.currentFilter === 'all') {
            return publications;
        }

        if (this.currentFilter === 'featured') {
            return getFeaturedPublications();
        }

        return publications.filter(pub => pub.status === this.currentFilter);
    }

    getSortedPublications(pubs) {
        const sorted = [...pubs];

        switch (this.currentSort) {
            case 'year-desc':
                return sorted.sort((a, b) => b.year - a.year);
            case 'year-asc':
                return sorted.sort((a, b) => a.year - b.year);
            case 'title':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            default:
                return sorted;
        }
    }

    renderStatistics() {
        const totalPubs = publications.length;
        const underReviewPubs = publications.filter(pub => pub.status === 'under-review').length;
        const publishedPubs = publications.filter(pub => pub.status === 'published').length;

        // Count unique collaborators
        const allAuthors = new Set();
        publications.forEach(pub => {
            pub.authors.forEach(author => {
                if (author !== 'Divyanshu Kumar') {
                    allAuthors.add(author);
                }
            });
        });

        document.getElementById('totalPubs').textContent = totalPubs;
        document.getElementById('underReviewPubs').textContent = underReviewPubs;
        document.getElementById('publishedPubs').textContent = publishedPubs;
        document.getElementById('collaborators').textContent = allAuthors.size;
    }

    renderTagsCloud() {
        const tagCounts = {};
        publications.forEach(pub => {
            pub.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        const tagsContainer = document.getElementById('tagsCloud');
        tagsContainer.innerHTML = '';

        Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .forEach(([tag, count]) => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag-cloud-item';
                tagElement.textContent = `${tag} (${count})`;
                tagElement.onclick = () => this.filterByTag(tag);
                tagsContainer.appendChild(tagElement);
            });
    }

    initializeFilters() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderPublications();
            });
        });

        // Sort dropdown
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderPublications();
        });
    }

    filterByTag(tag) {
        // Custom filter implementation for tags
        const container = document.getElementById('publicationsContainer');
        const filteredPubs = getPublicationsByTag(tag);

        // Update UI to show tag filter
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));

        container.innerHTML = '';
        const yearSection = document.createElement('div');
        yearSection.className = 'year-section';
        yearSection.innerHTML = `<h3 class="year-header">Publications tagged: ${tag}</h3>`;

        filteredPubs.forEach(pub => {
            const pubElement = this.createPublicationElement(pub);
            yearSection.appendChild(pubElement);
        });

        container.appendChild(yearSection);
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

    showDetails(pubId) {
        const pub = getPublicationById(pubId);
        if (!pub) return;

        document.getElementById('modalTitle').textContent = pub.title;
        document.getElementById('modalAuthors').textContent = pub.authors.join(', ');
        document.getElementById('modalVenue').textContent = `${pub.venue}, ${pub.year}`;
        document.getElementById('modalAbstract').textContent = pub.abstract || 'Abstract not available.';

        // Tags
        const tagsContainer = document.getElementById('modalTags');
        tagsContainer.innerHTML = pub.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

        // Links
        const linksContainer = document.getElementById('modalLinks');
        if (pub.links) {
            const iconMap = {
                'paper': '📄',
                'arxiv': '📝',
                'openreview': '📋',
                'github': '💻',
                'code': '💻',
                'demo': '🚀',
                'website': '🌐',
                'slides': '📊',
                'poster': '🖼️',
                'video': '🎥',
                'dataset': '📊',
                'blog': '✍️'
            };

            linksContainer.innerHTML = Object.entries(pub.links)
                .map(([type, url]) => {
                    const icon = iconMap[type.toLowerCase()] || '🔗';
                    const displayName = type.charAt(0).toUpperCase() + type.slice(1);
                    return `<a href="${url}" class="btn-primary" target="_blank">${icon} ${displayName}</a>`;
                })
                .join('');
        }

        document.getElementById('modalOverlay').style.display = 'flex';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.publicationsPage = new PublicationsPage();
});
