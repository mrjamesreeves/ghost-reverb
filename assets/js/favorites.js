/**
 * Favorites Page - CSV Loading and Filtering
 * Loads favorite things from CSV, displays with category filtering
 * Images positioned absolutely with SVG connector lines
 */

(function() {
  'use strict';

  let allFavorites = [];
  let resizeTimeout = null;

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
      const timestamp = new Date().getTime();
      const response = await fetch(`/assets/csv/favorites.csv?v=${timestamp}`);
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
   * Draw SVG connector lines from text entries to their images
   */
  function drawConnectorLines() {
    const svg = document.querySelector('.connector-lines');
    const textColumn = document.querySelector('.favorites-text-column');
    const imageColumn = document.querySelector('.favorites-image-column');

    if (!svg || !textColumn || !imageColumn) return;

    // Clear existing lines
    svg.innerHTML = '';

    // Get all text entries with images
    const entries = textColumn.querySelectorAll('.favorite-entry[data-has-image="true"]');

    entries.forEach(entry => {
      const entryId = entry.dataset.entryId;
      const image = imageColumn.querySelector(`.favorite-image[data-entry-id="${entryId}"]`);

      if (!image) return;

      // Get positions relative to the layout container
      const layoutRect = document.querySelector('.favorites-layout').getBoundingClientRect();
      const entryRect = entry.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();

      // Gap width (should match CSS margin-left on .favorites-image-column)
      const gapWidth = 120;
      const midPoint = gapWidth / 2;

      // Calculate line coordinates
      const startY = (entryRect.top + entryRect.height / 2) - layoutRect.top;
      const endY = (imageRect.top + imageRect.height / 2) - layoutRect.top;

      // Create horizontal line from text to midpoint
      const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hLine.setAttribute('x1', '0');
      hLine.setAttribute('y1', startY);
      hLine.setAttribute('x2', midPoint);
      hLine.setAttribute('y2', startY);
      svg.appendChild(hLine);

      // If image is at different height, draw connecting path
      if (Math.abs(startY - endY) > 5) {
        // Vertical line
        const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vLine.setAttribute('x1', midPoint);
        vLine.setAttribute('y1', startY);
        vLine.setAttribute('x2', midPoint);
        vLine.setAttribute('y2', endY);
        svg.appendChild(vLine);

        // Horizontal line to image
        const hLine2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hLine2.setAttribute('x1', midPoint);
        hLine2.setAttribute('y1', endY);
        hLine2.setAttribute('x2', gapWidth);
        hLine2.setAttribute('y2', endY);
        svg.appendChild(hLine2);
      } else {
        // Straight horizontal line
        const hLineEnd = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hLineEnd.setAttribute('x1', midPoint);
        hLineEnd.setAttribute('y1', startY);
        hLineEnd.setAttribute('x2', gapWidth);
        hLineEnd.setAttribute('y2', startY);
        svg.appendChild(hLineEnd);
      }
    });

    // Update SVG height to match content
    const layoutHeight = document.querySelector('.favorites-layout').offsetHeight;
    svg.setAttribute('height', layoutHeight);
  }

  /**
   * Position images absolutely aligned to their text entries
   */
  function positionImages() {
    const textColumn = document.querySelector('.favorites-text-column');
    const imageColumn = document.querySelector('.favorites-image-column');

    if (!textColumn || !imageColumn) return;

    // Check if we're in mobile view
    if (window.innerWidth <= 768) {
      // Reset to static positioning on mobile
      const images = imageColumn.querySelectorAll('.favorite-image');
      images.forEach(img => {
        img.style.top = '';
      });
      return;
    }

    const entries = textColumn.querySelectorAll('.favorite-entry[data-has-image="true"]');
    let lastImageBottom = 0;

    entries.forEach(entry => {
      const entryId = entry.dataset.entryId;
      const image = imageColumn.querySelector(`.favorite-image[data-entry-id="${entryId}"]`);

      if (!image) return;

      // Get entry position relative to text column
      const entryTop = entry.offsetTop;

      // Position image to align with text entry, but don't overlap previous image
      const targetTop = Math.max(entryTop, lastImageBottom + 20);
      image.style.top = targetTop + 'px';

      // Track bottom of this image for next iteration
      lastImageBottom = targetTop + image.offsetHeight;
    });

    // Ensure image column is tall enough to contain all images (prevents footer overlap)
    if (lastImageBottom > 0) {
      imageColumn.style.minHeight = lastImageBottom + 'px';
    }

    // After positioning, draw connector lines
    drawConnectorLines();
  }

  /**
   * Render all favorites
   */
  function renderFavorites(category = 'all') {
    const container = document.getElementById('favorites-container');
    if (!container) {
      console.error('Container #favorites-container not found');
      return;
    }

    const textColumn = container.querySelector('.favorites-text-column');
    const imageColumn = container.querySelector('.favorites-image-column');

    if (!textColumn || !imageColumn) {
      console.error('Text or image column not found');
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
      // Clear columns but preserve SVG
      textColumn.innerHTML = '';
      const svg = imageColumn.querySelector('.connector-lines');
      imageColumn.innerHTML = '';
      if (svg) imageColumn.appendChild(svg);

      // Track images to load
      const imagesToLoad = [];

      // Render each item
      items.forEach((item, index) => {
        const hasImage = item.Image && item.Image.trim() !== '';
        const hasLink = item.Link && item.Link.trim() !== '';
        const entryId = `entry-${index}`;

        // Create text entry
        const entryDiv = document.createElement('div');
        entryDiv.className = 'favorite-entry';
        entryDiv.dataset.entryId = entryId;
        entryDiv.dataset.hasImage = hasImage ? 'true' : 'false';

        const textDiv = document.createElement('div');
        textDiv.className = 'favorite-text';

        // Title (with link if available)
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

        // Blurb
        const blurb = document.createElement('div');
        blurb.className = 'favorite-blurb';
        blurb.innerHTML = item.Blurb || '';
        textDiv.appendChild(blurb);

        entryDiv.appendChild(textDiv);
        textColumn.appendChild(entryDiv);

        // Create image if exists
        if (hasImage) {
          const imageDiv = document.createElement('div');
          imageDiv.className = 'favorite-image';
          imageDiv.dataset.entryId = entryId;

          const img = document.createElement('img');
          img.src = `/assets/img/favorites/${item.Image}`;
          img.alt = item.Title ? item.Title.replace(/<[^>]*>/g, '') : '';
          img.loading = 'lazy';

          imagesToLoad.push(img);

          if (hasLink) {
            const imageLink = document.createElement('a');
            imageLink.href = item.Link;
            imageLink.className = 'favorite-image-link';
            imageLink.appendChild(img);
            imageDiv.appendChild(imageLink);
          } else {
            imageDiv.appendChild(img);
          }

          imageColumn.appendChild(imageDiv);
        }
      });

      // Fade in
      container.style.opacity = '1';

      // Position images after they load
      if (imagesToLoad.length > 0) {
        let loadedCount = 0;
        imagesToLoad.forEach(img => {
          if (img.complete) {
            loadedCount++;
            if (loadedCount === imagesToLoad.length) {
              positionImages();
            }
          } else {
            img.addEventListener('load', () => {
              loadedCount++;
              if (loadedCount === imagesToLoad.length) {
                positionImages();
              }
            });
            img.addEventListener('error', () => {
              loadedCount++;
              if (loadedCount === imagesToLoad.length) {
                positionImages();
              }
            });
          }
        });
      }

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

    document.querySelectorAll('.favorite-entry').forEach(item => {
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
   * Handle window resize
   */
  function setupResize() {
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        positionImages();
      }, 150);
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
    setupResize();
    initFromHash();
  });

})();
