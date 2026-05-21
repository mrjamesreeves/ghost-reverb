/**
 * Public Works Reader
 * Slide-deck navigation for Public Works project pages.
 *
 * Per-slide chrome:
 *   - data-caption on the slide → caption capsule text. Hidden when empty.
 *   - Counter capsule between chevrons → "current / total" within the
 *     current project's deck (resets per-project since each project
 *     page has its own total).
 *   - Watermark + index button are anchors, navigation handled by the
 *     browser; no JS hooks needed.
 *
 * Navigation:
 *   - Prev / next buttons, keyboard arrows, horizontal trackpad swipe,
 *     clicking the slide image. All call into next() / prev() which
 *     hand off to goTo() with an explicit direction so the animation
 *     knows which way to slide.
 *   - Cross-project rollthrough is Phase 2d. For now prev/next disable
 *     at the deck boundary; keyboard/image-click no-op there too.
 *
 * Animation:
 *   - Direction-aware via CSS @keyframes. JS adds an animating-* class
 *     to the incoming slide (which fires pw-slide-in-{right|left}) and
 *     adds animating-out to the outgoing (which fires pw-fade-out).
 *     After the animation duration, the animating-* classes are cleaned
 *     up and .is-active state is swapped.
 *   - Why keyframes instead of transitions: transitions need a "before"
 *     and "after" computed-style snapshot, and a JS reflow trick to
 *     fire reliably. Chrome occasionally collapses the trick into a
 *     single state change, missing the animation. Keyframes fire on
 *     class-add unconditionally.
 *
 * Init:
 *   - Hash deep-linking: #last or #N to land on a specific slide.
 *     Activates immediately, no animation on first load.
 */

(function () {
  'use strict';

  const reader = document.getElementById('archiveReader');
  if (!reader) return;

  const entries = Array.from(reader.querySelectorAll('.archive-entry'));
  if (!entries.length) return;

  const captionEl = document.getElementById('archiveCaption');
  const counterEl = document.getElementById('archiveCounter');
  const prevBtn   = document.getElementById('archivePrev');
  const nextBtn   = document.getElementById('archiveNext');

  const total      = entries.length;
  let current      = 0;
  let navigating   = false;
  let swipeAccum   = 0;
  let swipeTimer   = null;
  const ANIM_MS    = 500;    // matches the @keyframes duration in CSS
  const THRESHOLD  = 60;     // px of accumulated deltaX before swipe fires

  // ── Caption / counter / nav state ───────────────────────────────────

  function updateCaption(entry) {
    if (!captionEl) return;
    const cap = entry.getAttribute('data-caption') || '';
    captionEl.textContent = cap;
    captionEl.hidden = !cap;
  }

  function updateCounter() {
    if (!counterEl) return;
    counterEl.textContent = (current + 1) + ' / ' + total;
  }

  function updateNav() {
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === total - 1;
  }

  // ── Slide change with direction-aware keyframe animation ────────────

  function goTo(idx, direction) {
    if (navigating || idx < 0 || idx >= total || idx === current) return;
    navigating = true;

    const outgoing = entries[current];
    const incoming = entries[idx];
    const inClass = direction === 'prev' ? 'animating-in-left' : 'animating-in-right';

    // Strip leftover animation classes from a possibly-interrupted prior
    // change so the new animations start clean.
    ['animating-in-right', 'animating-in-left', 'animating-out'].forEach(function (c) {
      outgoing.classList.remove(c);
      incoming.classList.remove(c);
    });

    // Fire animations. Both elements need to be "visible" for the
    // keyframes to play — for the incoming we add .is-active immediately
    // so the keyframe takes over from its first frame (opacity 0 → 1
    // is baked into pw-slide-in-*).
    outgoing.classList.add('animating-out');
    outgoing.classList.remove('is-active');

    incoming.classList.add(inClass);
    incoming.classList.add('is-active');

    current    = idx;
    swipeAccum = 0;

    updateCounter();
    updateNav();
    updateCaption(incoming);

    setTimeout(function () {
      outgoing.classList.remove('animating-out');
      incoming.classList.remove(inClass);
      navigating = false;
    }, ANIM_MS);
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

  // ── Clicking the slide image: advance, OR play video ────────────────
  //
  // On regular slides, image click advances to next. On video slides
  // (.archive-entry--video), the first click plays the video by
  // swapping the poster + button for a Vimeo iframe with autoplay.
  // Once playing, the slide is no longer click-to-advance — the user
  // interacts with the iframe directly. Navigate away via the chevrons,
  // keyboard, or swipe.

  function playVideo(slide) {
    const vimeoId = slide.getAttribute('data-vimeo-id');
    if (!vimeoId) return;
    const container = slide.querySelector('.archive-entry-image--full');
    if (!container) return;
    const iframe = document.createElement('iframe');
    iframe.className = 'pw-video-iframe';
    iframe.src =
      'https://player.vimeo.com/video/' + vimeoId +
      '?autoplay=1&title=0&byline=0&portrait=0&dnt=1';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    container.appendChild(iframe);
    slide.classList.add('is-playing');
  }

  reader.querySelectorAll('.archive-entry-image').forEach(function (img) {
    img.addEventListener('click', function () {
      const slide = img.closest('.archive-entry');
      if (
        slide &&
        slide.classList.contains('archive-entry--video') &&
        !slide.classList.contains('is-playing')
      ) {
        playVideo(slide);
        return;
      }
      next();
    });
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
  // on initial load — swap is-active directly, then let normal goTo()
  // handle subsequent changes.
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

  updateCounter();
  updateNav();
  updateCaption(entries[current]);
})();
