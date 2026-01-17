# Notebook Page - Implementation Guide

**Project:** Chronological notebook page with scanned journal images and text entries  
**Date:** December 29, 2025  
**Status:** Ready for implementation

## Project Overview

Create a notebook page that displays scanned journal pages alongside chronological text entries, with a featured pages grid at the top. Images and text are independent streams that flow chronologically together.

## Files to Create

1. `/content/themes/reverb/page-notebook.hbs` - Ghost page template
2. `/content/themes/reverb/assets/js/notebook.js` - JavaScript to load markdown files and images
3. `/content/themes/reverb/style.css` - Add scoped CSS for notebook page

## Data Structure

### Markdown Files
**Location:** `/content/themes/reverb/assets/notes/`
**Naming:** `26-01.md`, `25-12.md`, etc. (year-month)

**Structure:**
```markdown
# January 2026

### Monday, January 23
Lorem ipsum text entry here...

### Monday, January 23
Another entry for same day...

### Wednesday, January 17
Entry text...
```

### Notebook Scans
**Location:** `/content/themes/reverb/assets/notes/`
**Naming:** `26-01-1.webp`, `26-01-2.webp`, `25-12-1.webp`, etc. (year-month-page)

**Rounded Corners:**
- **First image of month:** `border-radius: 20px 20px 0 0`
- **Last image of month:** `border-radius: 0 0 20px 20px`

## Page Structure
```
┌─────────────────────────────────────────────┐
│ Header (from default.hbs)                   │
├─────────────────────────────────────────────┤
│                                             │
│  NOTEBOOK    [Featured] [Featured]          │
│       │      [Featured] [Featured]          │
│       │                                     │
├───────┼─────────────────────────────────────┤
│                                             │
│            JANUARY 2026                     │
│                                             │
├──────────────┬──────────────────────────────┤
│              │                              │
│  [notebook]  │  MONDAY, JANUARY 23          │
│  [scan]      │  Entry text...               │
│  [images]    │                              │
│              │  MONDAY, JANUARY 23          │
│  [stacked]   │  Entry text...               │
│              │                              │
│              │  WEDNESDAY, JANUARY 17       │
│              │  Entry text...               │
│              │                              │
├──────────────┼──────────────────────────────┤
│              │                              │
│            DECEMBER 2025                    │
│              │                              │
├──────────────┼──────────────────────────────┤
│  [notebook]  │  WEDNESDAY, FEBRUARY 15      │
│  [scans]     │  Entry text...               │
│              │                              │
└──────────────┴──────────────────────────────┘
```

## Technical Requirements

### Featured Pages Grid (Hardcoded)

**Four cards with:**
- Weather
- Notes on God  
- Art Diary
- Favorite Things (link to /favorites)

**HTML structure from homepage:**
```handlebars
<article>
    <a href="{{@site.url}}/weather" class="post-card-link">
        <div class="post-card bg-dark bg-full">
            <img src="{{asset 'img/reeves-weather.webp'}}" 
                class="post-card-image bg-full-image bg-fade-in"
                alt="Weather" />
        </div>
        <div class="grid-text">
            <span class="grid-title">Weather</span>
            <p>Reports from the Late Heavy Bombardment...</p>
            <span class="grid-date">November 2025</span>
        </div>
    </a>
</article>
```

### JavaScript Logic

**Key functions:**
```javascript
// 1. Load all markdown files
async function loadNotebookEntries() {
  // Get list of .md files in /assets/notes/
  // Sort by filename DESC (26-01, 25-12, etc.)
  // Parse each file
}

// 2. Parse markdown to objects
function parseMarkdown(text) {
  // Extract month/year header (# January 2026)
  // Extract date entries (### Monday, January 23)
  // Return structured objects
}

// 3. Load all notebook images
async function loadNotebookImages() {
  // Get list of .webp files in /assets/notes/
  // Group by month (26-01-1, 26-01-2, etc.)
  // Identify first/last for border-radius
}

// 4. Render notebook layout
function renderNotebook(entries, images) {
  // Group by month
  // Render month header
  // Left column: stacked images for that month
  // Right column: text entries for that month
  // Add connecting lines
}
```

### Automatic File Discovery

Since we don't know in advance which .md and .webp files exist, the JavaScript needs to:

**Option 1: Manifest file** (Recommended)
Create `/assets/notes/manifest.json`:
```json
{
  "months": [
    {
      "file": "26-01.md",
      "images": ["26-01-1.webp", "26-01-2.webp", "26-01-3.webp"]
    },
    {
      "file": "25-12.md",
      "images": ["25-12-1.webp", "25-12-2.webp"]
    }
  ]
}
```

**Option 2: Generate manifest** 
Create a simple script that scans `/assets/notes/` and generates manifest.json automatically.

## Design Specifications

### Layout
```css
.notebook-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 60px;
  max-width: 1400px;
}

.notebook-images {
  /* Left column */
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.notebook-entries {
  /* Right column */
  max-width: 900px;
}

.notebook-entry {
  margin-bottom: 100px;
}
```

### Connecting Lines
```
NOTEBOOK ─────┐
              │
    ┌─────────┤
    │         │
    │  TEXT   │
    │         │
    └─────────┘
```

Use `border-left` and `::before`/`::after` pseudo-elements to create connecting lines.

### Typography
```css
/* Month headers */
h2.month-header {
  font-family: var(--font-big);
  font-size: var(--type-h2);
  text-transform: uppercase;
  margin: 80px 0 40px;
}

/* Entry dates */
h3.entry-date {
  font-family: var(--font-sans);
  font-size: var(--type-label);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--color-text-muted);
  margin-bottom: 10px;
}

/* Entry text */
.entry-text {
  font-family: var(--font-serif);
  font-size: var(--type-body);
  line-height: 1.6;
  color: var(--color-text);
}
```

### Images
```css
.notebook-scan {
  width: 100%;
  height: auto;
  display: block;
}

/* First image of month */
.notebook-scan.first {
  border-radius: 20px 20px 0 0;
}

/* Last image of month */
.notebook-scan.last {
  border-radius: 0 0 20px 20px;
}
```

### Responsive Breakpoints
```css
/* Images scale down */
@media (max-width: 1024px) {
  .notebook-layout {
    grid-template-columns: 300px 1fr;
  }
}

/* Images disappear, text only */
@media (max-width: 720px) {
  .notebook-layout {
    grid-template-columns: 1fr;
  }
  
  .notebook-images {
    display: none;
  }
}
```

## Implementation Steps

### 1. Create page-notebook.hbs
```handlebars
{{!< default}}

<main id="main" class="content outer page-notebook">
    <div class="inner-wide">
        
        <!-- Top Section: Title + Featured Pages -->
        <div class="notebook-header">
            <div class="notebook-title">
                <h1>Notebook</h1>
                <div class="title-connector"></div>
            </div>
            
            <div class="featured-grid">
                <!-- 2x2 grid of featured pages (hardcoded) -->
                <article>
                    <a href="{{@site.url}}/weather" class="post-card-link">
                        <div class="post-card bg-dark bg-full">
                            <img src="{{asset 'img/reeves-weather.webp'}}" 
                                class="post-card-image bg-full-image bg-fade-in"
                                alt="Weather" />
                        </div>
                        <div class="grid-text">
                            <span class="grid-title">Weather</span>
                            <p>Reports from the Late Heavy Bombardment...</p>
                            <span class="grid-date">November 2025</span>
                        </div>
                    </a>
                </article>
                <!-- Repeat for God, Art, Favorites -->
            </div>
        </div>

        <!-- Chronological Notebook Content -->
        <div id="notebook-container">
            <!-- JavaScript will populate this -->
        </div>

    </div>
</main>

<script src="{{asset "js/notebook.js"}}"></script>
```

### 2. Create notebook.js
```javascript
// Load manifest
async function loadManifest() {
  const response = await fetch('/assets/notes/manifest.json');
  return await response.json();
}

// Load and parse markdown file
async function loadMarkdownFile(filename) {
  const response = await fetch(`/assets/notes/${filename}`);
  const text = await response.text();
  return parseMarkdown(text, filename);
}

// Parse markdown structure
function parseMarkdown(text, filename) {
  const lines = text.split('\n');
  const result = {
    month: '',
    entries: []
  };
  
  let currentEntry = null;
  
  for (const line of lines) {
    if (line.startsWith('# ')) {
      result.month = line.slice(2).trim();
    } else if (line.startsWith('### ')) {
      if (currentEntry) {
        result.entries.push(currentEntry);
      }
      currentEntry = {
        date: line.slice(4).trim(),
        text: ''
      };
    } else if (currentEntry && line.trim()) {
      currentEntry.text += line + '\n';
    }
  }
  
  if (currentEntry) {
    result.entries.push(currentEntry);
  }
  
  return result;
}

// Render notebook layout
function renderNotebook(manifest) {
  const container = document.getElementById('notebook-container');
  
  for (const month of manifest.months) {
    // Create month section
    const monthSection = document.createElement('div');
    monthSection.className = 'month-section';
    
    // Month header
    const header = document.createElement('h2');
    header.className = 'month-header';
    header.textContent = month.monthName; // From parsed markdown
    monthSection.appendChild(header);
    
    // Two-column layout
    const layout = document.createElement('div');
    layout.className = 'notebook-layout';
    
    // Left: Images
    const imagesCol = document.createElement('div');
    imagesCol.className = 'notebook-images';
    month.images.forEach((img, idx) => {
      const image = document.createElement('img');
      image.src = `/assets/notes/${img}`;
      image.className = 'notebook-scan';
      if (idx === 0) image.classList.add('first');
      if (idx === month.images.length - 1) image.classList.add('last');
      imagesCol.appendChild(image);
    });
    layout.appendChild(imagesCol);
    
    // Right: Entries
    const entriesCol = document.createElement('div');
    entriesCol.className = 'notebook-entries';
    month.entries.forEach(entry => {
      const entryDiv = document.createElement('div');
      entryDiv.className = 'notebook-entry';
      
      const date = document.createElement('h3');
      date.className = 'entry-date';
      date.textContent = entry.date;
      
      const text = document.createElement('div');
      text.className = 'entry-text';
      text.innerHTML = entry.text; // Allows for basic HTML
      
      entryDiv.appendChild(date);
      entryDiv.appendChild(text);
      entriesCol.appendChild(entryDiv);
    });
    layout.appendChild(entriesCol);
    
    monthSection.appendChild(layout);
    container.appendChild(monthSection);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  const manifest = await loadManifest();
  
  // Load all markdown files
  for (const month of manifest.months) {
    const data = await loadMarkdownFile(month.file);
    month.monthName = data.month;
    month.entries = data.entries;
  }
  
  renderNotebook(manifest);
});
```

### 3. Create manifest.json

Manually create `/content/themes/reverb/assets/notes/manifest.json`:
```json
{
  "months": [
    {
      "file": "26-01.md",
      "images": ["26-01-1.webp", "26-01-2.webp", "26-01-3.webp"]
    },
    {
      "file": "25-12.md",
      "images": ["25-12-1.webp", "25-12-2.webp"]
    }
  ]
}
```

**Update this file whenever you add new months.**

### 4. Add CSS to style.css

**Location:** After favorites page styles
```css
/* NOTEBOOK PAGE
----------------------------- */

.page-notebook {
  /* Base styles */
}

.notebook-header {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 60px;
  margin-bottom: 100px;
  position: relative;
}

.notebook-title h1 {
  font-family: var(--font-big);
  font-size: var(--type-h1);
}

.title-connector {
  position: absolute;
  top: 50px;
  left: 300px;
  width: 60px;
  height: 1px;
  background: var(--color-text-muted);
}

.featured-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

/* Month sections */
.month-section {
  margin-bottom: 120px;
}

.month-header {
  font-family: var(--font-big);
  font-size: var(--type-h2);
  text-transform: uppercase;
  text-align: center;
  margin: 80px 0 40px;
  color: var(--color-hover);
}

/* Two-column layout */
.notebook-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 60px;
  position: relative;
}

/* Connecting line */
.notebook-layout::before {
  content: '';
  position: absolute;
  top: 0;
  left: 400px;
  width: 1px;
  height: 100%;
  background: var(--color-text-muted);
}

/* Left column: Images */
.notebook-images {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.notebook-scan {
  width: 100%;
  height: auto;
  display: block;
}

.notebook-scan.first {
  border-radius: 20px 20px 0 0;
}

.notebook-scan.last {
  border-radius: 0 0 20px 20px;
}

/* Right column: Entries */
.notebook-entries {
  max-width: 900px;
  padding-left: 60px;
}

.notebook-entry {
  margin-bottom: 100px;
  position: relative;
}

/* Connecting line to entry */
.notebook-entry::before {
  content: '';
  position: absolute;
  top: 5px;
  left: -60px;
  width: 60px;
  height: 1px;
  background: var(--color-text-muted);
}

.entry-date {
  font-family: var(--font-sans);
  font-size: var(--type-label);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--color-text-muted);
  margin-bottom: 10px;
}

.entry-text {
  font-family: var(--font-serif);
  font-size: var(--type-body);
  line-height: 1.6;
  color: var(--color-text);
}

.entry-text p {
  margin-top: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .notebook-layout {
    grid-template-columns: 300px 1fr;
    gap: 40px;
  }
  
  .notebook-entries {
    padding-left: 40px;
  }
  
  .notebook-entry::before {
    left: -40px;
    width: 40px;
  }
}

@media (max-width: 720px) {
  .notebook-header {
    grid-template-columns: 1fr;
  }
  
  .featured-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .notebook-layout {
    grid-template-columns: 1fr;
  }
  
  .notebook-images {
    display: none;
  }
  
  .notebook-layout::before {
    display: none;
  }
  
  .notebook-entries {
    padding-left: 0;
  }
  
  .notebook-entry::before {
    display: none;
  }
}
```

## File Locations
```
/content/themes/reverb/
├── page-notebook.hbs
├── assets/
│   ├── js/
│   │   └── notebook.js
│   ├── notes/
│   │   ├── manifest.json
│   │   ├── 26-01.md
│   │   ├── 26-01-1.webp
│   │   ├── 26-01-2.webp
│   │   ├── 25-12.md
│   │   └── 25-12-1.webp
│   └── img/
│       ├── reeves-weather.webp
│       ├── god.webp
│       ├── reeves-art.webp
│       └── favorites-thumb.webp
```

## Adding New Months

1. Create markdown file: `/assets/notes/26-02.md`
2. Add notebook scans: `/assets/notes/26-02-1.webp`, `26-02-2.webp`, etc.
3. Update `manifest.json`:
```json
{
  "months": [
    {
      "file": "26-02.md",
      "images": ["26-02-1.webp", "26-02-2.webp"]
    },
    // ... existing months
  ]
}
```

## Testing Checklist

- [ ] Markdown files load and parse correctly
- [ ] Month headers display properly
- [ ] Entries render with correct dates and text
- [ ] Notebook images display in left column
- [ ] First/last images have rounded corners
- [ ] Connecting lines appear correctly
- [ ] Chronological order (newest first)
- [ ] Featured pages grid displays correctly
- [ ] Responsive: images scale down to 300px
- [ ] Responsive: images disappear below 720px
- [ ] Matches site aesthetic

## Notes

- Manifest file must be manually updated when adding new months
- Consider creating a script to auto-generate manifest.json
- Notebook scans should be optimized/compressed
- Text entries can include basic HTML for links/formatting
- Keep scan image size reasonable (~200-300px wide in final display)

---

**Status:** Ready for implementation  
**Next Step:** Build with Claude Code