/**
 * Zen — all client behavior in one place.
 *
 * 1. Mobile menu       — header + footer burgers toggle body.menu-open
 *    (full-screen menu, burger→X morph, scroll lock). Desktop
 *    hover-nav stays pure CSS.
 * 2. Episode numbers   — spans[data-ep] carry internal tag slugs
 *    (hash-mr-N); the matching span gets its number as text.
 * 3. MR grid covers    — each tile resolves /assets/mr/MR{NN}.webp
 *    from its hidden internal-tag spans (zero-padded digits,
 *    uppercased rerun suffixes like 23r → MR23R).
 * 4. Dial              — marks the entry matching the current URL
 *    (or the first entry on channel pages), centers it in the 60vh
 *    window, and wires prev/next arrows from its neighbors.
 * 5. Marginalia        — on MR posts, clones the Download/Podcast
 *    anchors out of the post's first h4 into the right rail, adds a
 *    Tracklist anchor when the post has an <ol>, and fades the rail
 *    out on scroll-down / back in on scroll-up.
 */

(function () {
  'use strict';

  var MR_TAG_RE = /^hash-mr-([0-9a-z]+)$/i;

  // ---- 1. Mobile menu (burger) ---------------------------------------------
  // Both burgers (header + footer) toggle body.menu-open, which shows
  // the full-screen menu and morphs the burger into an X. Scrolling
  // locks while open; Esc closes. Desktop hover-nav is pure CSS and
  // ignores all of this.

  (function menuToggle() {
    var burgers = document.querySelectorAll('.nav-burger');
    if (!burgers.length) return;

    function setOpen(open) {
      document.body.classList.toggle('menu-open', open);
      burgers.forEach(function (b) {
        b.setAttribute('aria-expanded', String(open));
      });
      if (open) window.scrollTo({ top: 0 });
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
    img.src = '/assets/mr/MR' + part.toUpperCase() + '.webp';
  });

  // ---- 4. Dial -------------------------------------------------------------

  (function dial() {
    var list = document.getElementById('dialList');
    if (!list) return;

    var links = Array.from(list.querySelectorAll('a'));
    if (!links.length) return;

    // MR: prefix each entry with its episode number — "49. The Shimmer".
    // The hidden data-ep spans only exist when the caller's #get
    // included tags (the Midnight Radio queries do).
    links.forEach(function (a) {
      var span = a.querySelector('[data-ep]');
      if (!span) return;
      var m = (span.getAttribute('data-ep') || '').match(MR_TAG_RE);
      if (m) a.insertBefore(document.createTextNode(m[1].toUpperCase() + '. '), a.firstChild);
    });

    // Numbered sections (dreams / art / favorites): positional prefix,
    // oldest = 1 — the list arrives newest-first.
    if (list.hasAttribute('data-numbered')) {
      links.forEach(function (a, i) {
        a.insertBefore(document.createTextNode((links.length - i) + '. '), a.firstChild);
      });
    }

    // Current = the link whose pathname matches the page URL. Channel
    // pages (/radio/ etc.) match nothing → the first (latest) entry is
    // the one being shown.
    var here = window.location.pathname.replace(/\/+$/, '');
    var idx = links.findIndex(function (a) {
      return new URL(a.href).pathname.replace(/\/+$/, '') === here;
    });
    if (idx === -1) idx = 0;

    var current = links[idx];
    current.classList.add('is-current');

    // Center the current entry by scrolling the window (not a CSS
    // transform) — long lists stay natively wheel-scrollable, with
    // the edge fades as the affordance.
    var win = list.parentElement;
    function center(smooth) {
      var top = current.offsetTop + (current.offsetHeight / 2) - (win.clientHeight / 2);
      if (smooth) win.scrollTo({ top: top, behavior: 'smooth' });
      else win.scrollTop = top;
    }
    center();
    window.addEventListener('resize', function () { center(); });

    // ── Scrollspy (stacked channel pages) ─────────────────────────
    // When several articles share the page, the dial highlights the
    // one crossing the reading line. Dial clicks smooth-scroll to
    // the in-page article instead of navigating.
    var articles = Array.from(document.querySelectorAll('article.post[data-slug]'));
    if (articles.length > 1) {
      var bySlug = {};
      links.forEach(function (a) { bySlug[a.getAttribute('data-slug')] = a; });

      function setCurrent(link) {
        if (!link || link === current) return;
        current.classList.remove('is-current');
        current = link;
        current.classList.add('is-current');
        center(true);
      }

      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setCurrent(bySlug[entry.target.getAttribute('data-slug')]);
          }
        });
      }, { rootMargin: '-35% 0px -55% 0px' });
      articles.forEach(function (a) { spy.observe(a); });

      links.forEach(function (a) {
        a.addEventListener('click', function (e) {
          var target = articles.find(function (art) {
            return art.getAttribute('data-slug') === a.getAttribute('data-slug');
          });
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
    }

    // Prev/next arrows: list is newest-first, so ← (rev) goes older
    // (down the list) and → (fwd) goes newer (up the list).
    var wrap = document.getElementById('postArrows');
    var prev = document.getElementById('arrowPrev');
    var next = document.getElementById('arrowNext');
    if (!wrap || !prev || !next) return;

    var older = links[idx + 1];
    var newer = links[idx - 1];
    if (older) prev.href = older.href; else prev.hidden = true;
    if (newer) next.href = newer.href; else next.hidden = true;
    if (older || newer) wrap.hidden = false;

    // The dial is fixed; the MR cover grid scrolls up underneath it.
    // Fade the dial out while the grid (or footer) is on screen so
    // they never visually collide.
    var dialEl = document.getElementById('dial');
    var below = document.querySelector('.mr-grid') || document.querySelector('.site-footer');
    if (dialEl && below && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        dialEl.classList.toggle('is-hidden', entries[0].isIntersecting);
      }, { threshold: 0.05 }).observe(below);
    }
  })();

  // ---- 4a. Rail alignment --------------------------------------------------
  // The dial + marginalia are absolute spanners whose TOP must sit
  // exactly at the first paragraph of copy. Layout shifts as images
  // load, so align now, again on full load, and on resize.

  (function alignRails() {
    var content = document.querySelector('.post-content');
    if (!content) return;

    function align() {
      var contentTop = content.getBoundingClientRect().top;

      var dialEl = document.getElementById('dial');
      if (dialEl) {
        var mainEl = document.querySelector('.site-main');
        // The CURRENT dial entry aligns with the copy top (per the
        // comp — earlier titles float above it, fading out). The
        // current sits at the window's vertical center after the
        // centering scroll, so pull the spanner up by half the
        // window height — plus whatever sits above the window inside
        // the sticky block (the section title). Clamped so short
        // headers don't push the rail above the page.
        var win = dialEl.querySelector('.dial-window');
        var sticky = dialEl.querySelector('.dial-sticky');
        var headH = (win && sticky)
          ? win.getBoundingClientRect().top - sticky.getBoundingClientRect().top
          : 0;
        var offset = win ? headH + (win.clientHeight / 2) - 14 : 0;
        var top = contentTop - mainEl.getBoundingClientRect().top - offset;
        dialEl.style.top = Math.max(0, top) + 'px';
      }

      var rail = document.getElementById('marginalia');
      if (rail) {
        var article = rail.closest('article');
        if (article) {
          rail.style.top = (contentTop - article.getBoundingClientRect().top) + 'px';
        }
      }
    }

    align();
    window.addEventListener('load', align);
    window.addEventListener('resize', align);
  })();

  // ---- 4b. Comments fold ---------------------------------------------------
  // Comments stay collapsed behind the meta-line toggle; clicking
  // expands them in place (and scrolls them into view).

  (function commentsFold() {
    var btn = document.querySelector('[data-comments-toggle]');
    var body = document.querySelector('[data-comments-body]');
    if (!btn || !body) return;
    btn.addEventListener('click', function () {
      body.hidden = !body.hidden;
      btn.setAttribute('aria-expanded', String(!body.hidden));
      if (!body.hidden) {
        body.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  })();

  // ---- 5a. Signup modal ----------------------------------------------------
  // Every [data-signup] trigger opens the modal; Esc or clicking the
  // blurred overlay closes it. The form itself is Ghost's members API.

  (function signupModal() {
    var overlay = document.getElementById('signupOverlay');
    if (!overlay) return;   // member — modal not rendered

    function open() {
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      var input = overlay.querySelector('.signup-input');
      if (input) setTimeout(function () { input.focus(); }, 300);
    }
    function close() {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
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
    // the page. Fade OUT once the reader has scrolled ~200px past the
    // point where the rail was last at rest (so a small nudge doesn't
    // dismiss it); fade back IN when they scroll up AND the rail's
    // block is on screen again.
    var GRACE = 200;
    var inner = rail.querySelector('.marginalia-inner');
    var lastY = window.scrollY;
    var restY = window.scrollY;   // where the rail last sat visible
    function fade() {
      var y = window.scrollY;
      var down = y > lastY + 2;
      var up = y < lastY - 2;
      if (down) {
        if (y > restY + GRACE) rail.classList.add('is-hidden');
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

})();
