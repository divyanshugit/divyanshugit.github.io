// Dynamic header visibility based on scroll position
document.addEventListener('DOMContentLoaded', function () {
    const contentHeader = document.querySelector('.content-header');
    const sidebarName = document.querySelector('.name');
    const sidebarTitle = document.querySelector('.title');
    const profileContent = document.querySelector('.profile-content');
    const scrollThreshold = 200; // Pixels to scroll before switching

    // Initially show content header and hide sidebar elements
    if (contentHeader) {
        contentHeader.classList.remove('hidden');
    }
    if (sidebarName) {
        sidebarName.classList.remove('visible');
    }
    if (sidebarTitle) {
        sidebarTitle.classList.remove('visible');
    }
    if (profileContent) {
        profileContent.classList.add('compact');
    }

    // Handle scroll events
    window.addEventListener('scroll', function () {
        const scrollPosition = window.scrollY;

        // Only apply this behavior on desktop (screen width >= 768px)
        if (window.innerWidth >= 768) {
            if (scrollPosition > scrollThreshold) {
                // Scrolled down - hide content header, show sidebar elements
                if (contentHeader) {
                    contentHeader.classList.add('hidden');
                }
                if (sidebarName) {
                    sidebarName.classList.add('visible');
                }
                if (sidebarTitle) {
                    sidebarTitle.classList.add('visible');
                }
                if (profileContent) {
                    profileContent.classList.remove('compact');
                }
            } else {
                // At top - show content header, hide sidebar elements
                if (contentHeader) {
                    contentHeader.classList.remove('hidden');
                }
                if (sidebarName) {
                    sidebarName.classList.remove('visible');
                }
                if (sidebarTitle) {
                    sidebarTitle.classList.remove('visible');
                }
                if (profileContent) {
                    profileContent.classList.add('compact');
                }
            }
        } else {
            // On mobile, always show content header and hide sidebar
            if (contentHeader) {
                contentHeader.classList.remove('hidden');
            }
            if (sidebarName) {
                sidebarName.classList.remove('visible');
            }
            if (sidebarTitle) {
                sidebarTitle.classList.remove('visible');
            }
            if (profileContent) {
                profileContent.classList.remove('compact');
            }
        }
    });

    // Handle window resize to ensure proper behavior
    window.addEventListener('resize', function () {
        const scrollPosition = window.scrollY;

        if (window.innerWidth >= 768) {
            // Desktop behavior
            if (scrollPosition > scrollThreshold) {
                if (contentHeader) contentHeader.classList.add('hidden');
                if (sidebarName) sidebarName.classList.add('visible');
                if (sidebarTitle) sidebarTitle.classList.add('visible');
                if (profileContent) profileContent.classList.remove('compact');
            } else {
                if (contentHeader) contentHeader.classList.remove('hidden');
                if (sidebarName) sidebarName.classList.remove('visible');
                if (sidebarTitle) sidebarTitle.classList.remove('visible');
                if (profileContent) profileContent.classList.add('compact');
            }
        } else {
            // Mobile behavior - always show content header
            if (contentHeader) {
                contentHeader.classList.remove('hidden');
            }
            if (sidebarName) {
                sidebarName.classList.remove('visible');
            }
            if (sidebarTitle) {
                sidebarTitle.classList.remove('visible');
            }
            if (profileContent) {
                profileContent.classList.remove('compact');
            }
        }
    });
});
