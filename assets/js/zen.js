/**
 * Zen — all client behavior in one place.
 *
 * 1. Mobile menu       — header + footer burgers toggle body.menu-open
 *    (full-screen menu, burger→X morph, scroll lock).
 * 2. Episode numbers   — spans[data-ep] carry internal tag slugs
 *    (hash-mr-N); the matching span gets its number as text.
 * 3. MR grid covers    — each tile resolves /assets/mr/MR{NN}.webp
 *    from its hidden internal-tag spans (zero-padded digits,
 *    uppercased rerun suffixes like 23r → MR23R).
 * 4. Subnav            — marks the entry matching the current URL
 *    (or the first entry on channel pages) and wires the meta-line
 *    prev/next arrows from its neighbors.
 * 5. Marginalia        — on MR posts, clones the Download/Podcast
 *    anchors out of the post's first h4 into the right rail, adds a
 *    Tracklist anchor when the post has an <ol>, and fades the rail
 *    out on scroll-down / back in on scroll-up.
 * 6. Nav active state  — the top nav link for the current section
 *    runs black with an underline (.is-active).
 * 7. About page        — folds the /instructions/ post's content into
 *    the [data-instructions] marker placed in the About editor.
 */

(function () {
  'use strict';

  var MR_TAG_RE = /^hash-mr-([0-9a-z]+)$/i;

  // Scripted scrolls (smooth scrollIntoView) jump instantly for
  // visitors who prefer reduced motion; CSS handles the transitions.
  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- 1. Mobile menu (burger) ---------------------------------------------
  // Both burgers (header + footer) toggle body.menu-open, which shows
  // the full-screen menu and morphs the burger into an X. Scrolling
  // locks while open; Esc closes.

  (function menuToggle() {
    var burgers = document.querySelectorAll('.nav-burger');
    if (!burgers.length) return;

    function setOpen(open) {
      document.body.classList.toggle('menu-open', open);
      burgers.forEach(function (b) {
        b.setAttribute('aria-expanded', String(open));
      });
      // No scrollTo: the menu is a fixed overlay and body.menu-open's
      // overflow:hidden freezes the page where the reader left it.
    }

    burgers.forEach(function (b) {
      b.addEventListener('click', function () {
        setOpen(!document.body.classList.contains('menu-open'));
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  })();

  // ---- 2. Episode numbers ------------------------------------------------

  document.querySelectorAll('.episode-number').forEach(function (el) {
    var m = (el.getAttribute('data-ep') || '').match(MR_TAG_RE);
    if (m) el.textContent = m[1].toUpperCase();
  });

  // ---- 3. MR grid covers ---------------------------------------------------

  document.querySelectorAll('.mr-grid-tile').forEach(function (tile) {
    var img = tile.querySelector('.mr-grid-cover');
    if (!img) return;
    var part = null;
    tile.querySelectorAll('[data-ep]').forEach(function (span) {
      var m = (span.getAttribute('data-ep') || '').match(MR_TAG_RE);
      if (m && !part) part = m[1];
    });
    if (!part) { tile.remove(); return; }
    if (/^\d+$/.test(part)) part = part.padStart(2, '0');
    // 300px thumbs — the grid renders tiles at ~130px; full covers
    // live in /assets/mr/ for the hero.
    img.src = '/assets/mr/thumb/MR' + part.toUpperCase() + '.webp';
  });

  // ---- 3b. Subnav list numbering -------------------------------------------
  // Numbered lists count newest = N … oldest = 1 (no arithmetic in
  // handlebars).

  document.querySelectorAll('[data-archive-count]').forEach(function (list) {
    var nums = list.querySelectorAll('.archive-num');
    nums.forEach(function (el, i) { el.textContent = nums.length - i; });
  });

  // ---- 4. Subnav: current entry + prev/next arrows -------------------------
  // Every post page (and channel page) ends with its section's full
  // index — the 3-column list, the Art thumb grid, or the MR cover
  // grid. All entries carry data-slug, newest-first.

  (function subnav() {
    var entries = Array.from(document.querySelectorAll(
      '.subnav-list a[data-slug], .subnav-grid a[data-slug], .mr-grid a[data-slug]'
    ));
    if (!entries.length) return;

    // Current = the entry whose pathname matches the page URL.
    // Channel pages (/radio/ etc.) match nothing — they show the
    // latest post, i.e. the first entry.
    var here = window.location.pathname.replace(/\/+$/, '');
    var idx = entries.findIndex(function (a) {
      return new URL(a.href).pathname.replace(/\/+$/, '') === here;
    });
    if (idx === -1) idx = 0;

    var current = entries[idx];
    current.classList.add('is-current');
    current.setAttribute('aria-current', 'page');

    // Prev/next arrows: entries are newest-first, so ← (rev) goes
    // older (down the list) and → (fwd) goes newer (up the list).
    var wrap = document.getElementById('postArrows');
    var prev = document.getElementById('arrowPrev');
    var next = document.getElementById('arrowNext');
    if (!wrap || !prev || !next) return;

    var older = entries[idx + 1];
    var newer = entries[idx - 1];
    if (older) prev.href = older.href; else prev.hidden = true;
    if (newer) next.href = newer.href; else next.hidden = true;
    if (older || newer) wrap.hidden = false;
  })();

  // ---- 4a. Marginalia alignment --------------------------------------------
  // The rail is an absolute spanner whose TOP must sit exactly at the
  // first paragraph of copy. Layout shifts as images load, so align
  // now, again on full load, and on any layout change.

  (function alignRail() {
    var rail = document.getElementById('marginalia');
    if (!rail) return;
    var article = rail.closest('article');
    var content = article && article.querySelector('.post-content');
    if (!article || !content) return;

    function align() {
      rail.style.top =
        (content.getBoundingClientRect().top - article.getBoundingClientRect().top) + 'px';
    }

    align();
    window.addEventListener('load', align);
    window.addEventListener('resize', align);
    // Any layout change inside <main> (lazy images, embeds, font
    // swaps, injected players) can move the copy top after the
    // event-based aligns have fired — re-align on every size change.
    // align() is cheap and idempotent; RO batches per frame.
    if ('ResizeObserver' in window) {
      var mainEl = document.querySelector('.site-main');
      if (mainEl) new ResizeObserver(function () { align(); }).observe(mainEl);
    }
    // Typekit swap can reflow the layout above the copy — re-align
    // once fonts settle.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { align(); });
    }
  })();

  // ---- 4b. Comments fold ---------------------------------------------------
  // Comments stay collapsed behind the meta-line toggle; clicking
  // expands them in place (and scrolls them into view).

  (function commentsFold() {
    document.querySelectorAll('[data-comments-toggle]').forEach(function (btn) {
      var article = btn.closest('article');
      var body = article && article.querySelector('[data-comments-body]');
      if (!body) return;
      btn.addEventListener('click', function () {
        body.hidden = !body.hidden;
        btn.setAttribute('aria-expanded', String(!body.hidden));
        if (!body.hidden) {
          body.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth', block: 'start' });
        }
      });
    });
  })();

  // ---- 5a. Signup modal ----------------------------------------------------
  // Every [data-signup] trigger opens the modal; Esc or clicking the
  // blurred overlay closes it. The form itself is Ghost's members API.

  (function signupModal() {
    var overlay = document.getElementById('signupOverlay');
    if (!overlay) return;   // member — modal not rendered

    var lastTrigger = null;
    function open() {
      lastTrigger = document.activeElement;
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      var input = overlay.querySelector('.signup-input');
      if (input) setTimeout(function () { input.focus(); }, 300);
    }
    function close() {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      // Hand focus back to the button that opened the modal.
      if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
      lastTrigger = null;
    }

    document.querySelectorAll('[data-signup]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        open();
      });
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });
  })();

  // ---- 5. Marginalia -------------------------------------------------------

  (function marginalia() {
    var rail = document.getElementById('marginalia');
    var slot = document.getElementById('marginaliaLinks');
    if (!rail || !slot) return;

    var content = document.querySelector('.post-content');
    if (content) {
      // Download / Podcast live in the post's first h4 (author habit
      // carried over from reverb — one h4, pipe-separated links).
      var h4 = content.querySelector('h4');
      if (h4) {
        h4.querySelectorAll('a').forEach(function (a) {
          var clone = a.cloneNode(true);
          slot.appendChild(clone);
        });
      }
      // Tracklist: first ol in the post gets an anchor.
      var ol = content.querySelector('ol');
      if (ol) {
        ol.id = 'tracklist';
        var t = document.createElement('a');
        t.href = '#tracklist';
        t.textContent = 'Tracklist';
        slot.appendChild(t);
      }
    }

    // Not sticky: the rail sits at its anchored spot and scrolls with
    // the page. Fade OUT once the reader has scrolled well past the
    // point where the rail was last at rest (so a small nudge doesn't
    // dismiss it); fade back IN when they scroll up AND the rail's
    // block is on screen again.
    var GRACE = 400;
    var inner = rail.querySelector('.marginalia-inner');
    var lastY = window.scrollY;
    var restY = window.scrollY;   // where the rail last sat visible
    function fade() {
      var y = window.scrollY;
      var down = y > lastY + 2;
      var up = y < lastY - 2;
      if (down) {
        // Anchor-relative grace: count from where the rail settles
        // near the viewport top, never the page top.
        var anchor = rail.getBoundingClientRect().top + y - 48;
        if (y > Math.max(restY, anchor) + GRACE) rail.classList.add('is-hidden');
      } else if (up) {
        if (inner) {
          var r = inner.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) {
            rail.classList.remove('is-hidden');
          }
        }
        // While visible, the rest point follows the reader up so the
        // next down-scroll gets a fresh grace distance.
        if (!rail.classList.contains('is-hidden')) restY = y;
      }
      lastY = y;
    }
    window.addEventListener('scroll', fade, { passive: true });
  })();

  // ---- 6. Nav active state -------------------------------------------------
  // The current section's nav link runs black with an underline.
  // Channel + about pages match by path prefix; post pages match the
  // article's tag class (data-tag on the link ↔ post_class on the
  // article); unsectioned articles light up Notes. Design posts and
  // the homepage light nothing.

  (function navActive() {
    var links = Array.from(document.querySelectorAll('.site-nav-link'));
    if (!links.length) return;

    var path = window.location.pathname.replace(/\/+$/, '') + '/';
    var article = document.querySelector('article[data-slug]');
    var active = null;

    links.forEach(function (a) {
      if (active) return;
      var p = new URL(a.href).pathname;
      if (p !== '/' && path.indexOf(p) === 0) active = a;
    });

    if (!active && article) {
      links.forEach(function (a) {
        if (active) return;
        var tag = a.getAttribute('data-tag');
        if (tag && article.classList.contains(tag)) active = a;
      });
      // No section tag → it's a note (skip pages and unlisted Design
      // posts).
      if (!active &&
          article.classList.contains('post') &&
          !article.classList.contains('post--page') &&
          !article.classList.contains('tag-design')) {
        active = links.find(function (a) {
          return new URL(a.href).pathname === '/notebook/';
        }) || null;
      }
    }

    if (active) {
      active.classList.add('is-active');
      active.setAttribute('aria-current', 'page');
    }
  })();

  // ---- 7. About page: fold in /instructions/ -------------------------------
  // page-about.hbs renders the Instructions post hidden after the bio;
  // move it into the <div data-instructions></div> HTML-card marker
  // (placed in the About editor) and unhide. Without the marker it
  // simply unhides in place, after the page content.

  (function aboutInstructions() {
    var block = document.getElementById('aboutInstructions');
    if (!block) return;
    var marker = document.querySelector('[data-instructions]');
    if (marker) marker.appendChild(block);
    block.hidden = false;
  })();

  // ---- 8. Auto hairline underline ------------------------------------------
  // Any TEXT link whose computed text-decoration is none gets the
  // sliding hairline on hover (.u-slide, styled in zen.css) — so new
  // no-underline links (marginalia, h5 links, subnav lists, etc.)
  // pick it up without being enumerated. Skips links that already
  // carry a background effect (the class-based sliding underlines),
  // links wrapping images, and contexts with their own hover language
  // (top nav, image grids, wordmark, title, Ghost kg-* cards).

  (function autoUnderline() {
    var SKIP = '.site-nav, .subnav-grid, .mr-grid, .wordmark, .post-title, [class*="kg-"]';
    document.querySelectorAll('a').forEach(function (a) {
      if (a.closest(SKIP)) return;
      if (a.querySelector('img, svg')) return;
      if (!a.textContent.trim()) return;
      var cs = getComputedStyle(a);
      if (cs.textDecorationLine !== 'none') return;
      if (cs.backgroundImage !== 'none') return;
      a.classList.add('u-slide');
    });
  })();

})();
