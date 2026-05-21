/**
 * MR Landing — /radio/ index page.
 *
 * For every tile in #mrLandingGrid:
 *   1. Parse the hidden internal-tag spans to find the hash-mr-N tag,
 *      then set the cover img src to /assets/mr/index/MRI{NN}.webp.
 *      (Pure digits zero-pad to two; suffixed reruns like 23r strip the
 *      letter so they map to the same index image as the original.)
 *   2. Populate #mrFilterCount with the total tile count.
 *   3. Wire single-select filter pills: clicking a filter shows only
 *      tiles whose data-tags contains that slug; clicking "All Episodes"
 *      or the active filter again clears the filter and shows everything.
 *
 * Single-select keeps the UX simple — exactly one of {none, ambient,
 * slow-motion, spirituals, special-guest, running, death-prom} is
 * active at any time. No multi-select union/intersect to reason about.
 */

(function () {
  'use strict';

  // ---- 0. Conditional close button ----
  // Only show the top-right (×) close button if the visitor came from
  // another page on this site. Most common case: they were reading an
  // episode, clicked the reader's index/TOC icon, landed here, and may
  // want to return. For cold loads / search-engine referrers, the
  // button stays hidden because "back" would take them off-site.
  (function setupCloseButton() {
    var btn = document.getElementById('mrLandingClose');
    if (!btn) return;

    var ref = document.referrer;
    var sameOrigin = false;
    try {
      sameOrigin = !!ref && new URL(ref).origin === location.origin;
    } catch (e) { sameOrigin = false; }

    if (!sameOrigin) return;            // Leave the button hidden.

    btn.hidden = false;
    btn.addEventListener('click', function () {
      history.back();
    });
  })();

  const grid    = document.getElementById('mrLandingGrid');
  const filters = document.getElementById('mrFilters');
  const countEl = document.getElementById('mrFilterCount');
  if (!grid || !filters) return;

  const tiles   = Array.from(grid.querySelectorAll('.mr-landing-tile'));
  if (!tiles.length) return;

  const COVER_BASE = '/assets/mr/';
  const MR_TAG_RE  = /^hash-mr-(\d+)/;   // Leading digits after hash-mr-; trailing chars (e.g. "r") ignored.

  // ---- 1. Set cover img src + a unique view-transition-name per tile ----
  // The grid now pulls from /assets/mr/ (the same source the
  // filmstrip uses). Filename pattern: MR{NN}.webp, zero-padded, no
  // space. The old /assets/mr/index/MRI{NN}.webp small-thumb folder
  // can be retired once the grid is verified.
  //
  // The view-transition-name lets the browser snapshot each tile's
  // position before/after a filter change so it can interpolate the
  // movement. Names must be unique within the document at transition
  // time; mr-tile-{N} is plenty since this page is the only place
  // using them.

  tiles.forEach(function (tile, i) {
    tile.style.viewTransitionName = 'mr-tile-' + i;

    const img = tile.querySelector('.mr-landing-tile-cover');
    if (!img) return;

    const epSpans = tile.querySelectorAll('.mr-landing-tile-eptags [data-ep]');
    let digits = null;
    for (var j = 0; j < epSpans.length; j++) {
      const m = epSpans[j].getAttribute('data-ep').match(MR_TAG_RE);
      if (m) { digits = m[1]; break; }
    }
    if (!digits) return;

    img.src = COVER_BASE + 'MR' + digits.padStart(2, '0') + '.webp';
  });

  // ---- 2. Populate the "All Episodes" count ----

  if (countEl) countEl.textContent = String(tiles.length);

  // ---- 3. Single-select filter ----

  const pills = Array.from(filters.querySelectorAll('.mr-filter'));

  function doFilter(slug) {
    // Highlight the active pill (or fall back to All).
    pills.forEach(function (p) {
      p.classList.toggle('is-active', p.dataset.filter === slug);
    });
    if (!slug) {
      var allBtn = filters.querySelector('[data-filter=""]');
      if (allBtn) allBtn.classList.add('is-active');
    }

    // Show tiles whose data-tags includes the slug (or all if slug is "").
    tiles.forEach(function (tile) {
      if (!slug) {
        tile.hidden = false;
        return;
      }
      const tagsAttr = (tile.dataset.tags || '').trim();
      const tagList  = tagsAttr ? tagsAttr.split(/\s+/) : [];
      tile.hidden = !tagList.includes(slug);
    });
  }

  // Wrap the filter pass in a View Transition when the browser supports
  // it. Chrome/Edge/Safari 18+ animate the snapshot-before/snapshot-after
  // crossfade with per-tile position interpolation — tiles slide into
  // their new spots. Firefox (no API) falls through to instant.
  function applyFilter(slug) {
    if (document.startViewTransition) {
      document.startViewTransition(function () { doFilter(slug); });
    } else {
      doFilter(slug);
    }
  }

  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      const target = pill.dataset.filter || '';
      const isCurrentlyActive = pill.classList.contains('is-active') && target !== '';
      // Clicking the active filter again clears it. "All Episodes" always clears.
      applyFilter(isCurrentlyActive ? '' : target);
    });
  });

})();
