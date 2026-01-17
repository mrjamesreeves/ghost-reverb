/**
 * Notebook Page - Markdown and Image Loading
 * Loads notebook entries from markdown files and displays with scanned images
 */

(function() {
  'use strict';

  /**
   * Load manifest file
   */
  async function loadManifest() {
    try {
      const response = await fetch('/assets/notes/manifest.json');
      if (!response.ok) throw new Error('Failed to load manifest');
      return await response.json();
    } catch (error) {
      console.error('Error loading manifest:', error);
      return { months: [] };
    }
  }

  /**
   * Load and parse a markdown file
   */
  async function loadMarkdownFile(filename) {
    try {
      const response = await fetch(`/assets/notes/${filename}`);
      if (!response.ok) throw new Error(`Failed to load ${filename}`);
      const text = await response.text();
      return parseMarkdown(text);
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      return { month: '', entries: [] };
    }
  }

  /**
   * Parse markdown structure
   * Expected format:
   * # Month Year
   * ### Day, Month Date
   * Entry text...
   */
  function parseMarkdown(text) {
    const lines = text.split('\n');
    const result = {
      month: '',
      entries: []
    };

    let currentEntry = null;

    for (const line of lines) {
      if (line.startsWith('# ')) {
        // Month header
        result.month = line.slice(2).trim();
      } else if (line.startsWith('### ')) {
        // New entry date
        if (currentEntry) {
          result.entries.push(currentEntry);
        }
        currentEntry = {
          date: line.slice(4).trim(),
          text: ''
        };
      } else if (currentEntry) {
        // Entry text (preserve paragraphs)
        if (line.trim()) {
          if (currentEntry.text) {
            currentEntry.text += '</p><p>';
          }
          currentEntry.text += line.trim();
        }
      }
    }

    // Don't forget the last entry
    if (currentEntry) {
      result.entries.push(currentEntry);
    }

    return result;
  }

  /**
   * Render a single month section
   */
  function renderMonthSection(monthData) {
    const section = document.createElement('section');
    section.className = 'month-section';

    // Month header
    const header = document.createElement('h2');
    header.className = 'month-header';
    header.textContent = monthData.monthName;
    section.appendChild(header);

    // Two-column layout
    const layout = document.createElement('div');
    layout.className = 'notebook-layout';

    // Left column: Images
    const imagesCol = document.createElement('div');
    imagesCol.className = 'notebook-images';

    if (monthData.images && monthData.images.length > 0) {
      monthData.images.forEach((imgFile, idx) => {
        const img = document.createElement('img');
        img.src = `/assets/notes/${imgFile}`;
        img.alt = `Notebook scan ${idx + 1}`;
        img.className = 'notebook-scan';
        img.loading = 'lazy';

        // First and last image rounded corners
        if (idx === 0) img.classList.add('first');
        if (idx === monthData.images.length - 1) img.classList.add('last');
        // Single image gets both
        if (monthData.images.length === 1) {
          img.classList.add('first', 'last');
        }

        imagesCol.appendChild(img);
      });
    }

    layout.appendChild(imagesCol);

    // Right column: Entries
    const entriesCol = document.createElement('div');
    entriesCol.className = 'notebook-entries';

    if (monthData.entries && monthData.entries.length > 0) {
      monthData.entries.forEach(entry => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'notebook-entry';

        const dateEl = document.createElement('h3');
        dateEl.className = 'entry-date';
        dateEl.textContent = entry.date;

        const textEl = document.createElement('div');
        textEl.className = 'entry-text';
        textEl.innerHTML = `<p>${entry.text}</p>`;

        entryDiv.appendChild(dateEl);
        entryDiv.appendChild(textEl);
        entriesCol.appendChild(entryDiv);
      });
    }

    layout.appendChild(entriesCol);
    section.appendChild(layout);

    return section;
  }

  /**
   * Render the full notebook
   */
  function renderNotebook(months) {
    const container = document.getElementById('notebook-container');
    if (!container) return;

    // Clear any existing content
    container.innerHTML = '';

    // Render each month
    months.forEach(monthData => {
      const section = renderMonthSection(monthData);
      container.appendChild(section);
    });

    // Setup intersection observer for fade-in animations
    setupAnimations();
  }

  /**
   * Setup intersection observer for animations
   */
  function setupAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, {
      threshold: 0.1
    });

    // Observe month sections and entries
    document.querySelectorAll('.month-section, .notebook-entry').forEach(el => {
      observer.observe(el);
    });
  }

  /**
   * Initialize notebook page
   */
  async function init() {
    const manifest = await loadManifest();

    if (!manifest.months || manifest.months.length === 0) {
      console.warn('No notebook entries found in manifest');
      return;
    }

    // Load all markdown files and merge with manifest data
    const monthsData = await Promise.all(
      manifest.months.map(async (month) => {
        const parsed = await loadMarkdownFile(month.file);
        return {
          ...month,
          monthName: parsed.month,
          entries: parsed.entries
        };
      })
    );

    renderNotebook(monthsData);
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', init);

})();
