// ===== FABRIZIO-STYLE TIMELINE PAGE =====
// Displays news items in a compact, inline text format like Fabrizio's timeline

class TimelinePage {
    constructor() {
        this.newsItems = [];
        this.years = [];
        this.init();
    }

    init() {
        this.loadNewsData();
        this.renderTimeline();
    }

    loadNewsData() {
        if (typeof news !== 'undefined') {
            // Process and sort news items
            this.newsItems = news.map(item => {
                const [month, year] = this.parseDate(item.date);
                return {
                    ...item,
                    parsedMonth: month,
                    parsedYear: parseInt(year),
                    monthNumber: this.getMonthNumber(month)
                };
            });

            // Sort by date (newest first)
            this.newsItems.sort((a, b) => {
                if (a.parsedYear !== b.parsedYear) {
                    return b.parsedYear - a.parsedYear;
                }
                return (b.monthNumber || 0) - (a.monthNumber || 0);
            });

            // Extract unique years
            this.years = [...new Set(this.newsItems.map(item => item.parsedYear))].sort((a, b) => b - a);
        }
    }

    renderTimeline() {
        const container = document.getElementById('timeline-entries');
        if (!container) return;

        container.innerHTML = '';

        if (this.newsItems.length === 0) {
            container.innerHTML = '<div class="minimal-timeline-empty">No timeline entries available.</div>';
            return;
        }

        // Group items by year
        const itemsByYear = {};
        this.newsItems.forEach(item => {
            if (!itemsByYear[item.parsedYear]) {
                itemsByYear[item.parsedYear] = [];
            }
            itemsByYear[item.parsedYear].push(item);
        });

        // Render items by year in Fabrizio's style
        Object.keys(itemsByYear)
            .sort((a, b) => b - a) // Sort years descending
            .forEach(year => {
                const yearSection = this.createYearSection(year, itemsByYear[year]);
                container.appendChild(yearSection);
            });
    }

    createYearSection(year, items) {
        const section = document.createElement('div');
        section.className = 'minimal-timeline-year-section';

        // Year header
        const yearHeader = document.createElement('div');
        yearHeader.className = 'minimal-timeline-year-header';

        const yearEl = document.createElement('h2');
        yearEl.className = 'minimal-timeline-year';
        yearEl.textContent = year;
        yearHeader.appendChild(yearEl);

        section.appendChild(yearHeader);

        // Add items for this year
        items.forEach(item => {
            const entry = this.createTimelineEntry(item);
            section.appendChild(entry);
        });

        return section;
    }

    createTimelineEntry(item) {
        const entry = document.createElement('div');
        entry.className = 'minimal-timeline-entry';

        const paragraph = document.createElement('p');

        // Create date span with better formatting
        const dateSpan = document.createElement('span');
        dateSpan.className = 'minimal-timeline-date';
        const formattedDate = this.formatDate(item.parsedMonth, item.parsedYear);
        dateSpan.textContent = formattedDate;

        // Create content span
        const contentSpan = document.createElement('span');
        contentSpan.className = 'minimal-timeline-content';

        // Enhanced content formatting
        let formattedContent = item.content;

        // Format bold text in square brackets
        formattedContent = formattedContent.replace(/\[([^\]]+)\]/g, '<strong>$1</strong>');

        // Format quotes and special text
        formattedContent = formattedContent.replace(/"([^"]+)"/g, '<em>"$1"</em>');

        // Clean up extra spaces
        formattedContent = formattedContent.replace(/\s+/g, ' ').trim();

        contentSpan.innerHTML = formattedContent;

        // Assemble the paragraph: date + content
        paragraph.appendChild(dateSpan);
        paragraph.appendChild(contentSpan);

        // Add links if available (inline with better formatting)
        if (item.links && Object.keys(item.links).length > 0) {
            const linksSpan = document.createElement('span');
            linksSpan.className = 'minimal-timeline-links';

            const linkEntries = Object.entries(item.links);
            linkEntries.forEach(([name, url], index) => {
                const link = document.createElement('a');
                link.href = url;
                link.textContent = this.formatLinkName(name);
                link.className = 'minimal-timeline-link';
                link.target = '_blank';
                linksSpan.appendChild(link);

                // Add separator between links (except for the last one)
                if (index < linkEntries.length - 1) {
                    const separator = document.createTextNode(' • ');
                    linksSpan.appendChild(separator);
                }
            });

            paragraph.appendChild(linksSpan);
        }

        entry.appendChild(paragraph);
        return entry;
    }

    formatDate(month, year) {
        if (!month) return year.toString();

        // Use consistent date format: "Month YYYY"
        const monthAbbreviations = {
            'January': 'Jan', 'February': 'Feb', 'March': 'Mar',
            'April': 'Apr', 'May': 'May', 'June': 'Jun',
            'July': 'Jul', 'August': 'Aug', 'September': 'Sep',
            'October': 'Oct', 'November': 'Nov', 'December': 'Dec'
        };

        const shortMonth = monthAbbreviations[month] || month;
        return `${shortMonth} ${year}`;
    }

    formatLinkName(name) {
        // Clean up link names for better presentation
        const nameMap = {
            'paper': 'Paper',
            'arxiv': 'arXiv',
            'code': 'Code',
            'website': 'Website',
            'demo': 'Demo',
            'slides': 'Slides',
            'video': 'Video'
        };

        return nameMap[name.toLowerCase()] || name;
    }

    // Helper methods for date handling
    parseDate(dateString) {
        const parts = dateString.split(' ');
        if (parts.length === 2) {
            return [parts[0], parts[1]]; // [month, year]
        }
        return ['', parts[0]]; // [empty, year]
    }

    getMonthNumber(monthName) {
        const months = {
            'Jan': 1, 'January': 1,
            'Feb': 2, 'February': 2,
            'Mar': 3, 'March': 3,
            'Apr': 4, 'April': 4,
            'May': 5,
            'Jun': 6, 'June': 6,
            'Jul': 7, 'July': 7,
            'Aug': 8, 'August': 8,
            'Sep': 9, 'Sept': 9, 'September': 9,
            'Oct': 10, 'October': 10,
            'Nov': 11, 'November': 11,
            'Dec': 12, 'December': 12
        };
        return months[monthName] || 1;
    }
}

// Initialize the timeline page
document.addEventListener('DOMContentLoaded', () => {
    new TimelinePage();
});