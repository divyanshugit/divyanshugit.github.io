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
// Only an explicit choice (localStorage 'theme') is ever applied or stored.
// On a first visit nothing is written, so the system preference keeps winning.
// The masthead toggle itself lives in /js/site.js; this only keeps the legacy
// stylesheet (which keys off [data-theme]) in step with the system on old pages.
function initializeDarkMode() {
    var saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) {}
    if (saved === 'light' || saved === 'dark') {
        document.documentElement.setAttribute('data-theme', saved);
        return;
    }
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    var follow = function () {
        var stored = null;
        try { stored = localStorage.getItem('theme'); } catch (e) {}
        if (stored) return;
        if (document.body.classList.contains('legacy')) {
            document.documentElement.setAttribute('data-theme', mq && mq.matches ? 'dark' : 'light');
        }
    };
    follow();
    if (mq && mq.addEventListener) mq.addEventListener('change', follow);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
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