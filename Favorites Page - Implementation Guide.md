# Favorites Page - Implementation Guide

**Project:** Interactive Favorite Things page for Midnight Radio  
**Date:** December 29, 2025  
**Status:** Ready for implementation

## Project Overview

Create an interactive "Favorite Things" page that loads data from a CSV file and displays it with category filtering, smooth animations, and optional images.

## Files to Create

1. `/content/themes/reverb/page-favorites.hbs` - Ghost page template
2. `/content/themes/reverb/assets/js/favorites.js` - JavaScript for CSV loading and filtering
3. `/content/themes/reverb/style.css` - Add scoped CSS for favorites page

## CSV Data Structure

**Location:** `/content/themes/reverb/assets/csv/Favorite_Things.csv`

**Columns:**
- **Category:** music, books, movies, tv, art, objects, food
- **Title:** Plain text with optional HTML (`<em>` for italics)
- **Blurb:** Up to 200 words, may contain HTML links (`<a href="">`)
- **Link:** Internal or external URL
- **Image:** Filename only (some entries blank)

**Image Path:** `/content/themes/reverb/assets/img/favorites/`

## Technical Requirements

### Page Structure
```
┌─────────────────────────────────────┐
│ Header (from default.hbs)           │
├─────────────┬───────────────────────┤
│ Categories  │ Entries               │
│ (fixed)     │ (chronological DESC)  │
│             │                       │
│ MUSIC       │ Entry 1               │
│ BOOKS       │ Entry 2               │
│ ART         │ Entry 3               │
│ MOVIES      │ ...                   │
│ TV          │                       │
│ OBJECTS     │                       │
│ FOOD        │                       │
└─────────────┴───────────────────────┘
│ Footer (from default.hbs)           │
└─────────────────────────────────────┘
```

### Filtering Behavior

- **Default view:** Show all entries, chronological DESC
- **Category filters:** Click to filter with smooth fade animation
- **URL updates:** Append hash (`/favorites#movies`)
- **Active state:** Highlight selected category
- **"All" button:** Reset filter and remove hash
- **Browser back/forward:** Support navigation through filtered states

### Image Handling
```javascript
// Images are optional
if (item.Image && item.Image.trim() !== '') {
  imageHTML = `<img src="/assets/img/favorites/${item.Image}" alt="${item.Title}">`;
}
```

## Design Specifications

### Typography
```css
/* Page title */
font-family: var(--font-big);
font-size: var(--type-h1);

/* Entry titles */
font-family: var(--font-sans);
font-size: var(--type-h3);
color: var(--color-hover);

/* Category filters */
font-family: var(--font-sans);
font-size: var(--type-label);
text-transform: uppercase;

/* Blurbs */
font-family: var(--font-serif);
font-size: var(--type-body);
color: var(--color-text);
```

### Colors

- **Background:** Existing dark gradient
- **Text:** `var(--color-text)` default
- **Titles:** `var(--color-hover)`
- **Links:** `var(--color-text)`, hover to `var(--color-blue)`
- **Active filter:** `var(--color-hover)` or `var(--color-blue)`

### Layout

- **Container:** `.inner-wide` (max-width: 1400px, width: 90%)
- **Sidebar:** Fixed left, ~200px width, top padding ~150px
- **Content:** Right side, max-width 900px, left margin for sidebar
- **Entry spacing:** 60px between entries
- **Mobile (<700px):** Stack sidebar above content

### Animations
```css
/* Filter transitions */
.fade-out {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.fade-in {
  opacity: 1;
  transition: opacity 0.3s ease;
}

/* Reuse existing intersection observer pattern */
/* See: .footer-tag-item.is-visible in style.css */
```

## Implementation Steps

### 1. Create page-favorites.hbs

**Base structure on:** `page-radio.hbs`
```handlebars
{{!< default}}

<main id="main" class="content outer page-favorites">
    <div class="inner-wide">
        
        <!-- Page Title -->
        <header class="favorites-header">
            <h1>Favorite Things</h1>
        </header>

        <div class="favorites-layout">
            <!-- Left Sidebar: Category Filters -->
            <aside class="favorites-sidebar">
                <nav class="favorites-nav">
                    <button class="filter-btn active" data-category="all">All</button>
                    <button class="filter-btn" data-category="music">Music</button>
                    <button class="filter-btn" data-category="books">Books</button>
                    <button class="filter-btn" data-category="art">Art</button>
                    <button class="filter-btn" data-category="movies">Movies</button>
                    <button class="filter-btn" data-category="tv">TV</button>
                    <button class="filter-btn" data-category="objects">Things</button>
                    <button class="filter-btn" data-category="food">Food</button>
                </nav>
            </aside>

            <!-- Right Content: Entries -->
            <div class="favorites-content">
                <div id="favorites-container">
                    <!-- JavaScript will populate this -->
                </div>
            </div>
        </div>

    </div>
</main>

<script src="{{asset "js/favorites.js"}}"></script>
```

### 2. Create favorites.js

**Key functions:**
```javascript
// 1. Fetch and parse CSV
async function loadFavorites() {
  const response = await fetch('/assets/csv/Favorite_Things.csv');
  const csvText = await response.text();
  return parseCSV(csvText);
}

// 2. Parse CSV to objects
function parseCSV(text) {
  // Split by lines, parse headers, create objects
}

// 3. Render entries
function renderFavorites(items, category = 'all') {
  const container = document.getElementById('favorites-container');
  // Filter items
  // Create HTML for each entry
  // Handle optional images
}

// 4. Setup filter buttons
function setupFilters() {
  // Add click handlers
  // Update URL hash
  // Add active class
  // Trigger render with fade animation
}

// 5. Handle URL hash on load
function initFromHash() {
  const hash = window.location.hash.slice(1);
  // Filter based on hash if present
}

// 6. Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  const favorites = await loadFavorites();
  setupFilters(favorites);
  initFromHash();
});
```

### 3. Add CSS to style.css

**Location:** After the "About" section styles (~line 2500)

**Scope all styles:**
```css
/* FAVORITES PAGE
----------------------------- */

.page-favorites {
  /* Container styles */
}

.favorites-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 80px;
}

.favorites-sidebar {
  position: sticky;
  top: 150px;
  height: fit-content;
}

.favorites-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-btn {
  /* Button styles */
  /* Active state */
}

.favorites-content {
  max-width: 900px;
}

.favorite-item {
  margin-bottom: 60px;
  /* Entry styles */
}

/* Mobile responsive */
@media (max-width: 700px) {
  .favorites-layout {
    grid-template-columns: 1fr;
  }
  
  .favorites-sidebar {
    position: static;
  }
}
```

### 4. CSV Location

Place `Favorite_Things.csv` at:
```
/content/themes/reverb/assets/csv/Favorite_Things.csv
```

### 5. Images Location

Place images at:
```
/content/themes/reverb/assets/img/favorites/
```

### 6. Create Ghost Page

1. In Ghost admin, create new page
2. **Title:** "Favorite Things"
3. **URL:** `/favorites/`
4. **Template:** Select "favorites" from dropdown
5. **Publish**

## Testing Checklist

- [ ] CSV loads and parses correctly
- [ ] All entries display with proper formatting
- [ ] HTML in blurbs renders (links, italics in titles)
- [ ] Images display for entries that have them
- [ ] No broken images for entries without Image value
- [ ] Category filters work smoothly
- [ ] URL hash updates on filter click
- [ ] Back/forward buttons work with filters
- [ ] "All" filter resets view and removes hash
- [ ] Animations are smooth (no jank)
- [ ] Responsive on mobile (stacked layout)
- [ ] Matches site aesthetic (colors, fonts, spacing)
- [ ] Links open correctly (internal vs external)

## Reference Files

- **Template structure:** `page-radio.hbs`
- **CSS variables:** `style.css` (lines 1-100)
- **Animation patterns:** `.footer-tag-item.is-visible` in `style.css`
- **Responsive breakpoints:** Search for `@media (max-width: 700px)` in `style.css`

## Notes

- Use existing CSS variables for consistency
- Follow established animation patterns (fade-in, intersection observer)
- Maintain responsive behavior matching rest of site
- Keep JavaScript vanilla (no frameworks)
- Handle edge cases (missing images, long blurbs, HTML in content)

---

**Status:** Ready for implementation  
**Next Step:** Build with Claude Code