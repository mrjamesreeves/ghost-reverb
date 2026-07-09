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

  // Scripted scrolls (dial glide, smooth scrollIntoView) jump
  // instantly for visitors who prefer reduced motion; CSS handles
  // the transitions.
  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  // ---- 3b. Archive list numbering ------------------------------------------
  // The archive index numbers its rows newest = N … oldest = 1, same
  // scheme as the numbered dials (no arithmetic in handlebars).

  document.querySelectorAll('[data-archive-count]').forEach(function (list) {
    var nums = list.querySelectorAll('.archive-num');
    nums.forEach(function (el, i) { el.textContent = nums.length - i; });
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
    current.setAttribute('aria-current', 'page');

    // Center the current entry by scrolling the window (not a CSS
    // transform) — long lists stay natively wheel-scrollable, with
    // the edge fades as the affordance. The slim end buffers mean the
    // target clamps near the list's ends — first/last entries rest
    // just clear of the fades rather than dead center.
    var win = list.parentElement;

    // Unhurried glide with ease-in-out — the native smooth scroll is
    // too zippy and its curve isn't tunable.
    var glideId = null;
    function glide(to) {
      cancelAnimationFrame(glideId);
      if (REDUCED_MOTION) { win.scrollTop = to; return; }
      var from = win.scrollTop;
      var delta = to - from;
      if (Math.abs(delta) < 1) return;
      var DURATION = 700;
      var start = null;
      function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / DURATION);
        win.scrollTop = from + delta * easeInOutCubic(p);
        if (p < 1) glideId = requestAnimationFrame(step);
      }
      glideId = requestAnimationFrame(step);
    }

    function center(smooth) {
      var top = current.offsetTop + (current.offsetHeight / 2) - (win.clientHeight / 2);
      top = Math.max(0, Math.min(top, win.scrollHeight - win.clientHeight));
      if (smooth) glide(top);
      else win.scrollTop = top;
    }

    // Scroll-aware top fade: --fade-top (the mask's dissolve height)
    // grows with the amount of list above the window, capped short of
    // the current entry's centered position so it never dims the
    // entry itself. Rides the scroll event, so the glide animates it.
    function updateFade() {
      var f = Math.min(72 + win.scrollTop, win.clientHeight * 0.5 - 40);
      win.style.setProperty('--fade-top', Math.max(72, f) + 'px');
    }
    win.addEventListener('scroll', updateFade, { passive: true });

    center();
    updateFade();
    window.addEventListener('resize', function () { center(); updateFade(); });

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
        current.removeAttribute('aria-current');
        current = link;
        current.classList.add('is-current');
        current.setAttribute('aria-current', 'page');
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
            target.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth', block: 'start' });
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
        // comp — earlier titles float above it, fading out). With the
        // slim end buffers the centering scroll CLAMPS near the
        // list's ends, so measure where the entry actually sits in
        // the window instead of assuming dead center. Clamped so
        // short headers don't push the rail above the page.
        var win = dialEl.querySelector('.dial-window');
        var cur = dialEl.querySelector('.dial-list a.is-current');
        var mainRect = mainEl.getBoundingClientRect();

        // Start from the natural (80vh) window on every pass.
        if (win) win.style.maxHeight = '';

        function railTop() {
          var offset = 0;
          if (win && cur) {
            offset = cur.offsetTop + (cur.offsetHeight / 2) - win.scrollTop - 14;
          } else if (win) {
            offset = (win.clientHeight / 2) - 14;
          }
          return Math.max(0, contentTop - mainRect.top - offset);
        }

        var top = railTop();

        // SHORT POSTS: the window must not outgrow its runway (rail
        // top → end of main) — the overflow is invisible but adds
        // phantom scroll space below the footer. Cap the window,
        // re-center, re-measure; capping moves the anchor a touch,
        // so iterate until it fits.
        if (win && cur) {
          for (var pass = 0; pass < 3; pass++) {
            var avail = Math.floor(mainRect.height - top);
            if (win.clientHeight <= avail) break;
            win.style.maxHeight = Math.max(160, avail) + 'px';
            win.scrollTop = cur.offsetTop + (cur.offsetHeight / 2) - (win.clientHeight / 2);
            top = railTop();
          }
        }

        dialEl.style.top = top + 'px';
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
    // Typekit swap can reflow the layout above the copy (a title that
    // wraps in the fallback font but not in condensed Bebas moves
    // everything up) — re-align once fonts settle.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { align(); });
    }

    // The dial stays invisible (CSS: opacity 0 until .is-ready) until
    // the first feature image has laid out — it's the only thing
    // above the copy top whose height arrives late, so aligning
    // before it loads flashes the dial at the wrong spot.
    var dialEl = document.getElementById('dial');
    if (dialEl) {
      var reveal = function () {
        align();
        dialEl.classList.add('is-ready');
      };
      var firstImg = document.querySelector('.post-image img, .mr-hero-art');
      if (firstImg && !firstImg.complete) {
        firstImg.addEventListener('load', reveal);
        firstImg.addEventListener('error', reveal);
      } else {
        reveal();
      }
    }
  })();

  // ---- 4b. Comments fold ---------------------------------------------------
  // Comments stay collapsed behind the meta-line toggle; clicking
  // expands them in place (and scrolls them into view).

  (function commentsFold() {
    // Bind every toggle to ITS OWN post's fold — stacked category
    // pages carry one per article.
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
    // the page. Fade OUT once the reader has scrolled ~200px past the
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
        // Same anchor-relative grace as the dial: count from where
        // the rail settles near the viewport top, never the page top.
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

  // ---- 5b. Dial scroll fade (experiment) -----------------------------------
  // Mirror of the marginalia fade: the dial sleeps after ~400px of
  // downward travel and wakes on any scroll-up (it's sticky, so it's
  // always "in view"). Uses .is-asleep — .is-hidden belongs to the
  // grid/footer observer. To retire the experiment, delete this IIFE
  // and the .is-asleep rules in zen.css.

  (function dialFade() {
    var dialEl = document.getElementById('dial');
    if (!dialEl) return;
    var GRACE = 400;
    var lastY = window.scrollY;
    var restY = window.scrollY;
    function fade() {
      var y = window.scrollY;
      var down = y > lastY + 2;
      var up = y < lastY - 2;
      if (down) {
        // Grace counts from where the dial SETTLES (its anchor
        // reaching the 48px pin), never from the page top — measured
        // live because alignment shifts as images load. Without this
        // a dial far down the page uses up its grace before it has
        // even scrolled into view.
        var anchor = dialEl.getBoundingClientRect().top + y - 48;
        if (y > Math.max(restY, anchor) + GRACE) dialEl.classList.add('is-asleep');
      } else if (up) {
        dialEl.classList.remove('is-asleep');
        restY = y;
      }
      lastY = y;
    }
    window.addEventListener('scroll', fade, { passive: true });
  })();

  // ---- 6. Auto hairline underline ------------------------------------------
  // Any TEXT link whose computed text-decoration is none gets the
  // sliding hairline on hover (.u-slide, styled in zen.css) — so new
  // no-underline links (marginalia, h5 links, etc.) pick it up
  // without being enumerated. Skips links that already carry a
  // background effect (the class-based sliding underlines), links
  // wrapping images, and contexts with their own hover language
  // (dial, wordmark, title permalinks, Ghost kg-* cards).

  (function autoUnderline() {
    var SKIP = '.dial, .wordmark, .post-title, [class*="kg-"]';
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
