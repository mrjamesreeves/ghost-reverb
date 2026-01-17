/**
 * Favorites Page - CSV Loading and Filtering
 * Loads favorite things from CSV, displays with category filtering
 */

(function() {
  'use strict';

  let allFavorites = [];

  /**
   * Parse CSV text into array of objects
   */
  function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const items = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const item = {};
        headers.forEach((header, index) => {
          item[header.trim()] = values[index];
        });
        items.push(item);
      }
    }

    return items;
  }

  /**
   * Parse a single CSV line, handling quoted fields with commas
   */
  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Load favorites from CSV file
   */
  async function loadFavorites() {
    try {
      const response = await fetch('/assets/csv/favorites.csv');
      if (!response.ok) throw new Error('Failed to load CSV');
      const csvText = await response.text();
      return parseCSV(csvText);
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }

  /**
   * Render a single favorite item
   */
  function renderItem(item) {
    const hasImage = item.Image && item.Image.trim() !== '';
    const hasLink = item.Link && item.Link.trim() !== '';

    // Determine if link is external
    const isExternal = hasLink && (item.Link.startsWith('http://') || item.Link.startsWith('https://'));
    const linkTarget = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';

    // Build title - wrap in link if available
    let titleHTML = item.Title;
    if (hasLink) {
      titleHTML = `<a href="${item.Link}"${linkTarget}>${item.Title}</a>`;
    }

    // Build image HTML if present - now appears above title
    let imageHTML = '';
    if (hasImage) {
      const imgSrc = `/assets/img/favorites/${item.Image}`;
      if (hasLink) {
        imageHTML = `
          <div class="favorite-image">
            <a href="${item.Link}"${linkTarget}>
              <img src="${imgSrc}" alt="${item.Title.replace(/<[^>]*>/g, '')}" loading="lazy">
            </a>
          </div>`;
      } else {
        imageHTML = `
          <div class="favorite-image">
            <img src="${imgSrc}" alt="${item.Title.replace(/<[^>]*>/g, '')}" loading="lazy">
          </div>`;
      }
    }

    return `
      <article class="favorite-item${hasImage ? ' has-image' : ''}" data-category="${(item.Type || '').toLowerCase()}">
        ${imageHTML}
        <h3 class="favorite-title">${titleHTML}</h3>
        <p class="favorite-blurb">${item.Blurb || ''}</p>
      </article>
    `;
  }

  /**
   * Render all favorites, optionally filtered by category
   */
  function renderFavorites(category = 'all') {
    const container = document.getElementById('favorites-container');
    if (!container) return;

    // Filter items
    let items = allFavorites;
    if (category !== 'all') {
      items = allFavorites.filter(item =>
        (item.Type || '').toLowerCase() === category.toLowerCase()
      );
    }

    // Fade out
    container.classList.add('fade-out');

    setTimeout(() => {
      // Render items (reversed for chronological DESC - newest first)
      const reversedItems = [...items].reverse();
      container.innerHTML = reversedItems.map(renderItem).join('');

      // Fade in
      container.classList.remove('fade-out');
      container.classList.add('fade-in');

      // Setup intersection observer for items
      setupItemAnimations();

      setTimeout(() => {
        container.classList.remove('fade-in');
      }, 300);
    }, 300);
  }

  /**
   * Setup intersection observer for item fade-in animations
   */
  function setupItemAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, {
      threshold: 0.1
    });

    document.querySelectorAll('.favorite-item').forEach(item => {
      observer.observe(item);
    });
  }

  /**
   * Setup filter button click handlers
   */
  function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.dataset.category;

        // Update active state
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update URL hash
        if (category === 'all') {
          history.pushState(null, '', window.location.pathname);
        } else {
          history.pushState(null, '', `#${category}`);
        }

        // Render filtered items
        renderFavorites(category);
      });
    });
  }

  /**
   * Initialize from URL hash
   */
  function initFromHash() {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const btn = document.querySelector(`.filter-btn[data-category="${hash}"]`);
      if (btn) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderFavorites(hash);
        return;
      }
    }
    renderFavorites('all');
  }

  /**
   * Handle browser back/forward navigation
   */
  function setupPopState() {
    window.addEventListener('popstate', () => {
      const hash = window.location.hash.slice(1) || 'all';
      const btn = document.querySelector(`.filter-btn[data-category="${hash}"]`);

      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      if (btn) {
        btn.classList.add('active');
      } else {
        document.querySelector('.filter-btn[data-category="all"]').classList.add('active');
      }

      renderFavorites(hash || 'all');
    });
  }

  /**
   * Initialize on page load
   */
  document.addEventListener('DOMContentLoaded', async () => {
    allFavorites = await loadFavorites();
    setupFilters();
    setupPopState();
    initFromHash();
  });

})();
