/**
 * Install Reader
 * Slide-deck navigation for Art Installations.
 *
 * Differences from archive-reader.js:
 *  - Each slide has a data-caption attribute. The controls bar shows the
 *    caption (centered) only when a media slide is active.
 *  - Navigation stays WITHIN the current project's deck. At the first or
 *    last slide, prev/next disable (no cross-project rollthrough). Each
 *    installation is its own sealed section.
 */

(function () {
  'use strict';

  const reader    = document.getElementById('archiveReader');
  if (!reader) return;

  const entries   = Array.from(reader.querySelectorAll('.archive-entry'));
  if (!entries.length) return;

  const counterEl = document.getElementById('archiveCounter');
  const captionEl = document.getElementById('archiveCaption');
  const prevBtn   = document.getElementById('archivePrev');
  const nextBtn   = document.getElementById('archiveNext');
  const toggleBtn = document.getElementById('archiveToggleIndex');
  const indexEl   = document.getElementById('archiveIndex');
  const closeBtn  = document.getElementById('archiveIndexClose');

  const total      = entries.length;
  let current      = 0;
  let navigating   = false;
  let swipeAccum   = 0;
  let swipeTimer   = null;
  const COOLDOWN   = 600;
  const THRESHOLD  = 60;

  // --- Counter / nav state ---

  function updateCounter(idx) {
    if (counterEl) counterEl.textContent = (idx + 1) + ' / ' + total;
  }

  function updateNav(idx) {
    // Disable at boundaries — no cross-project rollthrough.
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === total - 1;
  }

  function updateCaption(entry) {
    if (!captionEl) return;
    const cap = entry.getAttribute('data-caption') || '';
    captionEl.textContent = cap;
  }

  // --- Go to slide (fade) ---

  function goTo(idx) {
    if (navigating || idx < 0 || idx >= total) return;

    navigating = true;
    entries[current].classList.remove('is-active');
    entries[idx].classList.add('is-active');
    current    = idx;
    swipeAccum = 0;

    updateCounter(current);
    updateNav(current);
    updateCaption(entries[current]);

    setTimeout(function () { navigating = false; }, COOLDOWN);
  }

  // --- Horizontal wheel / trackpad swipe ---

  reader.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();

    swipeAccum += e.deltaX;
    clearTimeout(swipeTimer);
    swipeTimer = setTimeout(function () { swipeAccum = 0; }, 300);

    if      (swipeAccum >  THRESHOLD) goTo(current + 1);
    else if (swipeAccum < -THRESHOLD) goTo(current - 1);
  }, { passive: false });

  // --- Prev / next buttons ---

  if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });

  // --- Index overlay ---

  function openIndex() {
    if (!indexEl) return;
    indexEl.classList.add('is-open');
    indexEl.setAttribute('aria-hidden', 'false');
  }
  function closeIndex() {
    if (!indexEl) return;
    indexEl.classList.remove('is-open');
    indexEl.setAttribute('aria-hidden', 'true');
  }

  if (toggleBtn) toggleBtn.addEventListener('click', openIndex);
  if (closeBtn)  closeBtn.addEventListener('click', closeIndex);

  // Watermark in the corner doubles as a TOC trigger.
  const watermark = reader.querySelector('.archive-watermark');
  if (watermark) watermark.addEventListener('click', openIndex);

  // Clicking the slide image advances to the next slide. On public works,
  // this also rolls through to the next project at the deck boundary.
  reader.querySelectorAll('.archive-entry-image').forEach(function (img) {
    img.addEventListener('click', function () { goTo(current + 1); });
  });

  // --- Keyboard ---

  document.addEventListener('keydown', function (e) {
    if (indexEl && indexEl.classList.contains('is-open')) {
      if (e.key === 'Escape') closeIndex();
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      goTo(current + 1);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      goTo(current - 1);
    }
  });

  // --- Init ---

  // Hash deep-linking: #last → land on the final slide; #N → land on slide N.
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

  updateCounter(current);
  updateNav(current);
  updateCaption(entries[current]);

})();
