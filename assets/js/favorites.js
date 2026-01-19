/**
 * Favorites Page - CSV Loading and Filtering
 * Loads favorite things from CSV, displays with category filtering
 */

(function() {
  'use strict';

  let allFavorites = [];

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
   * Load favorites from CSV file
   */
  async function loadFavorites() {
    try {
      const response = await fetch('/assets/csv/favorites.csv');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const csvText = await response.text();
      console.log('CSV loaded, length:', csvText.length);
      const parsed = parseCSV(csvText);
      console.log('Parsed favorites:', parsed.length, 'items');
      return parsed;
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }

  /**
   * Render all favorites in grid layout
   */
  function renderFavorites(category = 'all') {
    const container = document.getElementById('favorites-container');
    if (!container) {
      console.error('Container #favorites-container not found');
      return;
    }

    // Filter items
    let items = allFavorites;
    if (category !== 'all') {
      items = allFavorites.filter(item =>
        (item.Type || '').toLowerCase() === category.toLowerCase()
      );
    }

    console.log('Rendering', items.length, 'items for category:', category);

    // Fade out
    container.style.opacity = '0';

    setTimeout(() => {
      container.innerHTML = '';

      // Render each item
      items.forEach(item => {
        const itemDiv = document.createElement('div');
        const hasImage = item.Image && item.Image.trim() !== '';
        const hasLink = item.Link && item.Link.trim() !== '';
        itemDiv.className = hasImage ? 'favorite-item has-image' : 'favorite-item';

        // Text column
        const textDiv = document.createElement('div');
        textDiv.className = 'favorite-text';

        // Title (with HTML support for italics, wrapped in link if available)
        if (hasLink) {
          const titleLink = document.createElement('a');
          titleLink.href = item.Link;
          titleLink.className = 'favorite-title-link';
          
          const title = document.createElement('h3');
          title.className = 'favorite-title';
          title.innerHTML = item.Title || '';
          
          titleLink.appendChild(title);
          textDiv.appendChild(titleLink);
        } else {
          const title = document.createElement('h3');
          title.className = 'favorite-title';
          title.innerHTML = item.Title || '';
          textDiv.appendChild(title);
        }

        // Blurb (with HTML support for links)
        const blurb = document.createElement('div');
        blurb.className = 'favorite-blurb';
        blurb.innerHTML = item.Blurb || '';
        textDiv.appendChild(blurb);

        itemDiv.appendChild(textDiv);

        // Gap column
        const gapDiv = document.createElement('div');
        gapDiv.className = 'favorite-gap';
        itemDiv.appendChild(gapDiv);

        // Image column (wrapped in link if available)
        const imageDiv = document.createElement('div');
        imageDiv.className = 'favorite-image';

        if (hasImage) {
          if (hasLink) {
            const imageLink = document.createElement('a');
            imageLink.href = item.Link;
            imageLink.className = 'favorite-image-link';
            
            const img = document.createElement('img');
            img.src = `/assets/img/favorites/${item.Image}`;
            img.alt = item.Title ? item.Title.replace(/<[^>]*>/g, '') : '';
            img.loading = 'lazy';
            
            imageLink.appendChild(img);
            imageDiv.appendChild(imageLink);
          } else {
            const img = document.createElement('img');
            img.src = `/assets/img/favorites/${item.Image}`;
            img.alt = item.Title ? item.Title.replace(/<[^>]*>/g, '') : '';
            img.loading = 'lazy';
            imageDiv.appendChild(img);
          }
        }

        itemDiv.appendChild(imageDiv);
        container.appendChild(itemDiv);
      });

      // Fade in
      container.style.opacity = '1';

      // Setup animations
      setupItemAnimations();
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
        document.querySelector('.filter-btn[data-category="all"]')?.classList.add('active');
      }

      renderFavorites(hash || 'all');
    });
  }

  /**
   * Initialize on page load
   */
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('Favorites page initializing...');
    allFavorites = await loadFavorites();
    console.log('Loaded', allFavorites.length, 'favorites');
    
    if (allFavorites.length === 0) {
      console.error('No favorites loaded! Check CSV file path and format.');
    }
    
    setupFilters();
    setupPopState();
    initFromHash();
  });

})();