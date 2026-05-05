/**
 * Archive Reader
 * Scroll-snap fade reader for Dreams and Art Diary pages.
 * Handles: fade on scroll, prev/next nav, index overlay toggle, keyboard nav.
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

  const total = entries.length;
  let current = 0;

  // --- Counter ---

  function updateCounter(idx) {
    if (counterEl) counterEl.textContent = `${idx + 1} / ${total}`;
  }

  function updateNav(idx) {
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === total - 1;
  }

  // --- Scroll to entry ---

  function goTo(idx) {
    if (idx < 0 || idx >= total) return;
    entries[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // --- Intersection Observer: fade in/out on snap ---

  const observer = new IntersectionObserver(
    (observed) => {
      observed.forEach((item) => {
        if (item.isIntersecting) {
          item.target.classList.add('is-active');
          current = parseInt(item.target.dataset.index, 10);
          updateCounter(current);
          updateNav(current);
        } else {
          item.target.classList.remove('is-active');
        }
      });
    },
    { root: reader, threshold: 0.5 }
  );

  entries.forEach((entry) => observer.observe(entry));

  // --- Prev / next buttons ---

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

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

  // --- Keyboard ---

  document.addEventListener('keydown', (e) => {
    if (indexEl && indexEl.classList.contains('is-open')) {
      if (e.key === 'Escape') closeIndex();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(current + 1);
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(current - 1);
    }
  });

  // --- Init ---

  updateCounter(0);
  updateNav(0);

})();
