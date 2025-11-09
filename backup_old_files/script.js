// ===== MINIMAL ACADEMIC WEBSITE INTERACTIONS =====
// Following Jon Barron's philosophy of minimal JavaScript

document.addEventListener('DOMContentLoaded', function () {
    // Initialize dark mode
    initializeDarkMode();

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
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            this.style.backgroundColor = isDark ? '#2d3748' : '#fafafa';
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

// ===== DARK MODE FUNCTIONALITY =====
function initializeDarkMode() {
    console.log('Initializing dark mode...');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-toggle-icon');

    console.log('Theme toggle element:', themeToggle);
    console.log('Theme icon element:', themeIcon);

    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';

    // Apply the saved theme
    setTheme(savedTheme);

    // Add click event listener to toggle button
    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }
}

function setTheme(theme) {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);

    // Save preference to localStorage
    localStorage.setItem('theme', theme);
}

// Check system preference on page load
function checkSystemPreference() {
    if (!localStorage.getItem('theme')) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
    }
}

// Listen for system theme changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}