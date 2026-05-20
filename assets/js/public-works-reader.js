/**
 * Public Works Reader
 * Slide-deck navigation for Public Works project pages.
 *
 * Per-slide chrome:
 *   - data-caption on the slide → caption capsule text. Hidden when empty.
 *   - All other reader chrome (watermark, controls capsule, index link)
 *     lives in _deck.hbs and stays put across slide changes.
 *
 * Navigation:
 *   - Prev / next buttons, keyboard arrows, horizontal trackpad swipe,
 *     clicking the slide image (advances). All call into goTo() with an
 *     explicit direction so the animation knows which way to slide.
 *   - The TOC button is a real <a href="/public-works/"> in the markup,
 *     so it just navigates. No in-deck overlay.
 *   - Cross-project rollthrough is Phase 2d. For now the prev/next
 *     buttons disable at the deck boundary, and keyboard / image-click
 *     navigation no-ops there too.
 *
 * Animation:
 *   - Direction-aware slide-in. The incoming slide is positioned off-
 *     screen (enter-from-right / enter-from-left) before .is-active is
 *     added; CSS transition handles the rest.
 *   - Outgoing slide fades in place without horizontal movement.
 *     Cleaner than a synchronized shuffle, trivial to upgrade later.
 *
 * Init:
 *   - Hash deep-linking: #last or #N to land on a specific slide.
 *     Activates the slide immediately, no animation on first load.
 */

(function () {
  'use strict';

  const reader = document.getElementById('archiveReader');
  if (!reader) return;

  const entries = Array.from(reader.querySelectorAll('.archive-entry'));
  if (!entries.length) return;

  const captionEl = document.getElementById('archiveCaption');
  const prevBtn   = document.getElementById('archivePrev');
  const nextBtn   = document.getElementById('archiveNext');

  const total      = entries.length;
  let current      = 0;
  let navigating   = false;
  let swipeAccum   = 0;
  let swipeTimer   = null;
  const COOLDOWN   = 600;    // ms — guard against rapid double-fires
  const THRESHOLD  = 60;     // px of accumulated deltaX before swipe fires

  // ── Caption ─────────────────────────────────────────────────────────

  function updateCaption(entry) {
    if (!captionEl) return;
    const cap = entry.getAttribute('data-caption') || '';
    captionEl.textContent = cap;
    captionEl.hidden = !cap;
  }

  // ── Boundary disables (intra-deck only, until Phase 2d) ─────────────

  function updateNav() {
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === total - 1;
  }

  // ── Slide change with direction-aware animation ─────────────────────
  //
  // Three-step animation:
  //   1. Add enter-from-{left|right} to the incoming slide. Sets the
  //      initial transform offset while opacity is still 0 (invisible).
  //   2. Force a reflow so the browser commits the initial state.
  //      Without this, removing the class in the same tick would not
  //      produce a transition — the browser would just see the final
  //      state and skip the animation.
  //   3. Remove enter-from-*, add is-active on the incoming, remove
  //      is-active from the outgoing. Both transitions fire.

  function goTo(idx, direction) {
    if (navigating || idx < 0 || idx >= total || idx === current) return;
    navigating = true;

    const outgoing = entries[current];
    const incoming = entries[idx];
    const enterClass = direction === 'prev' ? 'enter-from-left' : 'enter-from-right';

    incoming.classList.add(enterClass);
    void incoming.offsetWidth;                       // force reflow
    outgoing.classList.remove('is-active');
    incoming.classList.remove(enterClass);
    incoming.classList.add('is-active');

    current    = idx;
    swipeAccum = 0;

    updateNav();
    updateCaption(incoming);

    setTimeout(function () { navigating = false; }, COOLDOWN);
  }

  function next() { goTo(current + 1, 'next'); }
  function prev() { goTo(current - 1, 'prev'); }

  // ── Wheel / trackpad swipe ──────────────────────────────────────────

  reader.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();

    swipeAccum += e.deltaX;
    clearTimeout(swipeTimer);
    swipeTimer = setTimeout(function () { swipeAccum = 0; }, 300);

    if      (swipeAccum >  THRESHOLD) next();
    else if (swipeAccum < -THRESHOLD) prev();
  }, { passive: false });

  // ── Prev / next buttons ─────────────────────────────────────────────

  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);

  // ── Clicking the slide image advances ───────────────────────────────

  reader.querySelectorAll('.archive-entry-image').forEach(function (img) {
    img.addEventListener('click', next);
  });

  // ── Keyboard ────────────────────────────────────────────────────────

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      next();
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      prev();
    }
  });

  // ── Init ────────────────────────────────────────────────────────────

  // Hash deep-linking: #last → final slide; #N → slide N. No animation
  // on initial load — just swap is-active and call it done.
  let initial = 0;
  if (window.location.hash === '#last') {
    initial = total - 1;
  } else {
    const m = window.location.hash.match(/^#(\d+)$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= 0 && n < total) initial = n;
    }
  }
  if (initial !== 0) {
    entries[0].classList.remove('is-active');
    entries[initial].classList.add('is-active');
    current = initial;
  }

  updateNav();
  updateCaption(entries[current]);
})();
