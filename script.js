// ===== MINIMAL ACADEMIC WEBSITE INTERACTIONS =====
// Following Jon Barron's philosophy of minimal JavaScript

document.addEventListener('DOMContentLoaded', function () {
    // Simple smooth scrolling for any anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add subtle hover effects to publications and projects
    const publications = document.querySelectorAll('.publication');
    const projects = document.querySelectorAll('.project');

    [...publications, ...projects].forEach(item => {
        item.addEventListener('mouseenter', function () {
            this.style.backgroundColor = '#fafafa';
        });

        item.addEventListener('mouseleave', function () {
            this.style.backgroundColor = '';
        });
    });

    // Simple click tracking for analytics (placeholder)
    document.addEventListener('click', function (e) {
        if (e.target.matches('a[href]')) {
            const href = e.target.getAttribute('href');
            if (href.startsWith('http') || href.endsWith('.pdf')) {
                console.log('External link clicked:', href);
                // Add your analytics tracking here
            }
        }
    });
});

// Minimal utility functions
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = section.style.display === 'none' ? 'block' : 'none';
    }
}

// Simple email obfuscation (if needed)
function revealEmail() {
    const emailElements = document.querySelectorAll('[data-email]');
    emailElements.forEach(element => {
        const email = element.dataset.email.replace(/\[at\]/g, '@').replace(/\[dot\]/g, '.');
        element.textContent = email;
        element.href = 'mailto:' + email;
    });
}