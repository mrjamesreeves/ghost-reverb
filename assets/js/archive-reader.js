/**
 * Archive Reader
 * Horizontal swipe + fade navigation for Dreams and Art Diary pages.
 * Handles: fade on horizontal swipe, prev/next nav, index overlay toggle, keyboard nav.
 */

(function () {
  'use strict';

  const reader    = document.getElementById('archiveReader');
  if (!reader) return;

  const entries   = Array.from(reader.querySelectorAll('.archive-entry'));
  const counterEl = document.getElementById('archiveCounter');
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
  const COOLDOWN   = 600;   // ms between navigations
  const THRESHOLD  = 60;    // px of accumulated deltaX before firing

  // --- Counter / nav state ---

  function updateCounter(idx) {
    if (counterEl) counterEl.textContent = (idx + 1) + ' / ' + total;
  }

  function updateNav(idx) {
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === total - 1;
  }

  // --- Go to entry (fade) ---

  function goTo(idx) {
    if (navigating || idx < 0 || idx >= total) return;
    navigating = true;

    entries[current].classList.remove('is-active');
    entries[idx].classList.add('is-active');
    current    = idx;
    swipeAccum = 0;

    updateCounter(current);
    updateNav(current);

    setTimeout(function () { navigating = false; }, COOLDOWN);
  }

  // --- Horizontal wheel / trackpad swipe ---

  reader.addEventListener('wheel', function (e) {
    // Only respond to predominantly horizontal movement
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

  // Clicking the entry image advances to the next entry.
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

  // If the URL points at a specific entry's canonical slug (e.g.
  // /mountain-man/ landing on the Dreams reader via post.hbs dispatch),
  // activate that entry instead of falling back to the first.
  function pathSlug() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : '';
  }
  var initialSlug = pathSlug();
  if (initialSlug) {
    var idx = entries.findIndex(function (e) {
      return e.getAttribute('data-slug') === initialSlug;
    });
    if (idx > 0) {
      entries[0].classList.remove('is-active');
      entries[idx].classList.add('is-active');
      current = idx;
    }
  }

  updateCounter(current);
  updateNav(current);

})();
