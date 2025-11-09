// ===== MINIMAL ACADEMIC WEBSITE INTERACTIONS =====
// Following Jon Barron's philosophy of minimal JavaScript

document.addEventListener('DOMContentLoaded', function () {
    // Initialize dark mode
    initializeDarkMode();

    // Initialize macOS-style code block controls
    initializeCodeBlockControls();

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

// ===== MACOS-STYLE CODE BLOCK CONTROLS =====
function initializeCodeBlockControls() {
    // Add clickable dots to each code block
    const codeBlocks = document.querySelectorAll('pre[class*="language-"]');

    codeBlocks.forEach((block, index) => {
        // Create control buttons container
        const controls = document.createElement('div');
        controls.className = 'code-window-controls';
        controls.innerHTML = `
            <button class="code-control-btn code-close" aria-label="Close code block" title="Hide code block">
                <span class="control-dot"></span>
            </button>
            <button class="code-control-btn code-minimize" aria-label="Minimize code block" title="Collapse code block">
                <span class="control-dot"></span>
            </button>
            <button class="code-control-btn code-maximize" aria-label="Maximize code block" title="Expand code block">
                <span class="control-dot"></span>
            </button>
        `;

        // Insert controls at the beginning of the code block
        block.insertBefore(controls, block.firstChild);

        // Get the code element
        const codeElement = block.querySelector('code');

        // Store original height for maximize/restore
        let originalHeight = null;
        let isMinimized = false;
        let isMaximized = false;

        // Helper function to reset all states
        const resetCodeState = function () {
            codeElement.style.transition = 'max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease';
            codeElement.style.maxHeight = '';
            codeElement.style.opacity = '1';
            codeElement.style.overflow = '';
            codeElement.style.paddingTop = '';
            codeElement.style.paddingBottom = '';
        };

        // Close button (red) - toggles visibility of code content
        let isClosed = false;
        controls.querySelector('.code-close').addEventListener('click', function () {
            if (!isClosed) {
                // Hide the code content
                codeElement.style.transition = 'max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease';
                codeElement.style.maxHeight = '0';
                codeElement.style.opacity = '0';
                codeElement.style.overflow = 'hidden';
                codeElement.style.paddingTop = '0';
                codeElement.style.paddingBottom = '0';
                isClosed = true;
                isMinimized = false;
                isMaximized = false;
            } else {
                // Restore the code content
                resetCodeState();
                isClosed = false;
            }
        });

        // Minimize button (yellow) - collapses to show only first few lines
        controls.querySelector('.code-minimize').addEventListener('click', function () {
            if (!isMinimized) {
                // Reset any other states first
                if (isClosed) {
                    resetCodeState();
                    isClosed = false;
                }
                // Apply minimize
                codeElement.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';
                codeElement.style.maxHeight = '100px';
                codeElement.style.opacity = '1';
                codeElement.style.overflow = 'hidden';
                codeElement.style.paddingTop = '';
                codeElement.style.paddingBottom = '';
                isMinimized = true;
                isMaximized = false;
            } else {
                // Restore to normal
                resetCodeState();
                isMinimized = false;
            }
        });

        // Maximize button (green) - expands to full height or toggles fullscreen-like view
        controls.querySelector('.code-maximize').addEventListener('click', function () {
            if (!isMaximized) {
                // Reset any other states first
                if (isClosed) {
                    resetCodeState();
                    isClosed = false;
                }
                // Apply maximize
                codeElement.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';
                codeElement.style.maxHeight = '600px';
                codeElement.style.opacity = '1';
                codeElement.style.overflow = 'auto';
                codeElement.style.paddingTop = '';
                codeElement.style.paddingBottom = '';
                isMaximized = true;
                isMinimized = false;
            } else {
                // Restore to normal
                resetCodeState();
                isMaximized = false;
            }
        });
    });
}