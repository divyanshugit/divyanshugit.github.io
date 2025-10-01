// ===== PROJECTS PAGE FUNCTIONALITY =====

class ProjectsPage {
    constructor() {
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.renderProjects();
        this.initializeFilters();
        this.initializeModal();
    }

    renderProjects() {
        const container = document.getElementById('projectsContainer');
        const filteredProjects = this.getFilteredProjects();

        container.innerHTML = '';

        if (filteredProjects.length === 0) {
            container.innerHTML = '<p class="no-results">No projects found matching the current filter.</p>';
            return;
        }

        filteredProjects.forEach(project => {
            const projectElement = this.createProjectElement(project);
            container.appendChild(projectElement);
        });
    }

    createProjectElement(project) {
        const projectDiv = document.createElement('div');
        projectDiv.className = `project-card ${project.status}`;
        projectDiv.dataset.id = project.id;

        const statusBadge = this.getStatusBadge(project.status);
        const featuredBadge = project.featured ? '<span class="featured-badge">Featured</span>' : '';

        projectDiv.innerHTML = `
            <div class="project-header">
                <div class="project-title-section">
                    <h3 class="project-title">${project.title}</h3>
                    <div class="project-badges">
                        ${statusBadge}
                        ${featuredBadge}
                    </div>
                </div>
            </div>
            <div class="project-description">${project.description}</div>
            ${this.createTechnologiesHtml(project.technologies)}
            ${this.createCollaborationHtml(project.collaboration)}
            <div class="project-actions">
                <button class="btn-secondary" onclick="projectsPage.showDetails('${project.id}')">
                    View Details
                </button>
                ${this.createLinksHtml(project.links)}
            </div>
        `;

        return projectDiv;
    }

    getStatusBadge(status) {
        const badges = {
            'active': '<span class="status-badge active">Active</span>',
            'completed': '<span class="status-badge completed">Completed</span>',
            'on-hold': '<span class="status-badge on-hold">On Hold</span>'
        };
        return badges[status] || '';
    }

    createTechnologiesHtml(technologies) {
        if (!technologies || technologies.length === 0) return '';

        return `
            <div class="project-technologies">
                <strong>Technologies:</strong>
                ${technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
            </div>
        `;
    }

    createCollaborationHtml(collaboration) {
        if (!collaboration) return '';

        return `
            <div class="project-collaboration">
                <strong>Collaboration:</strong> ${collaboration}
            </div>
        `;
    }

    createLinksHtml(links) {
        if (!links) return '';

        return Object.entries(links)
            .filter(([type, url]) => type !== 'main') // Exclude main link as it's handled by details
            .map(([type, url]) => `<a href="${url}" class="project-link" target="_blank">${type}</a>`)
            .join(' / ');
    }

    getFilteredProjects() {
        if (this.currentFilter === 'all') {
            return projects;
        }

        if (this.currentFilter === 'featured') {
            return getFeaturedProjects();
        }

        if (this.currentFilter === 'active') {
            return getActiveProjects();
        }

        return projects.filter(project => project.status === this.currentFilter);
    }

    initializeFilters() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderProjects();
            });
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

    showDetails(projectId) {
        const project = getProjectById(projectId);
        if (!project) return;

        document.getElementById('modalTitle').textContent = project.title;
        document.getElementById('modalStatus').innerHTML = this.getStatusBadge(project.status);
        document.getElementById('modalDescription').textContent = project.fullDescription || project.description;

        // Project-specific details
        const detailsContainer = document.getElementById('modalDetails');
        let detailsHtml = '';

        if (project.achievements) {
            detailsHtml += `
                <div class="modal-section">
                    <h4>Key Achievements</h4>
                    <ul>
                        ${project.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (project.experiments) {
            detailsHtml += `
                <div class="modal-section">
                    <h4>Experiments</h4>
                    ${project.experiments.map(exp => `
                        <div class="experiment-item">
                            <h5>${exp.name}</h5>
                            <p>${exp.description}</p>
                            <div class="experiment-status">Status: <strong>${exp.status}</strong></div>
                            ${exp.technologies ? `<div class="experiment-tech">Tech: ${exp.technologies.join(', ')}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (project.contributions) {
            detailsHtml += `
                <div class="modal-section">
                    <h4>Contributions</h4>
                    <ul>
                        ${project.contributions.map(contribution => `<li>${contribution}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (project.currentWork) {
            detailsHtml += `
                <div class="modal-section">
                    <h4>Current Work</h4>
                    <ul>
                        ${project.currentWork.map(work => `<li>${work}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        detailsContainer.innerHTML = detailsHtml;

        // Technologies
        const techContainer = document.getElementById('modalTechnologies');
        if (project.technologies) {
            techContainer.innerHTML = `
                <h4>Technologies Used</h4>
                <div class="tech-tags">
                    ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                </div>
            `;
        }

        // Links
        const linksContainer = document.getElementById('modalLinks');
        if (project.links) {
            linksContainer.innerHTML = `
                <h4>Project Links</h4>
                <div class="project-links">
                    ${Object.entries(project.links)
                    .map(([type, url]) => `<a href="${url}" class="btn-primary" target="_blank">${type}</a>`)
                    .join('')}
                </div>
            `;
        }

        document.getElementById('modalOverlay').style.display = 'flex';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.projectsPage = new ProjectsPage();
});
