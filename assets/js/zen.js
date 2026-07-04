/**
 * Zen — all client behavior in one place.
 *
 * 1. Touch nav toggle  — hover has no meaning on touch; tapping the
 *    wordmark toggles the nav instead of navigating home. Desktop
 *    hover stays pure CSS.
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

  // ---- 1. Touch nav toggle ------------------------------------------------

  (function navToggle() {
    var top = document.getElementById('siteTop');
    var mark = document.getElementById('wordmark');
    if (!top || !mark) return;

    var touch = window.matchMedia('(hover: none)').matches;
    if (!touch) return;

    mark.addEventListener('click', function (e) {
      if (!top.classList.contains('is-open')) {
        e.preventDefault();          // first tap opens the nav
        top.classList.add('is-open');
      }                              // second tap on the wordmark goes home
    });

    document.addEventListener('click', function (e) {
      if (!top.contains(e.target)) top.classList.remove('is-open');
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

    // Center the current entry in the dial window.
    var win = list.parentElement;
    function center() {
      var offset = (win.clientHeight / 2) - (current.offsetTop + current.offsetHeight / 2);
      list.style.transform = 'translateY(' + offset + 'px)';
    }
    center();
    window.addEventListener('resize', center);

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

    // Fade out on scroll down, back in on scroll up.
    var lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y > lastY + 5 && y > 120) rail.classList.add('is-hidden');
      else if (y < lastY - 5) rail.classList.remove('is-hidden');
      lastY = y;
    }, { passive: true });
  })();

})();
