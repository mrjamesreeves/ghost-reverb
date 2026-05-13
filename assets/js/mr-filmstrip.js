/**
 * MR Filmstrip
 *
 * For each thumb in #mrFilmstrip:
 *   1. Parse the hidden internal-tag slugs to find the one matching
 *      `hash-mr-N` (or `hash-mr-23r`-style suffixed reruns).
 *   2. Build the cover path: /assets/mr/covers/MR{NN}.webp
 *      — digits get zero-padded to two; suffixed reruns uppercased.
 *   3. Set the thumb's <img class="mr-filmstrip-cover"> src.
 *
 * Then locate the thumb whose data-slug matches the current URL slug,
 * mark it .is-current, and scroll the strip so it sits centered.
 *
 * Done in JS rather than Handlebars because Ghost's match helper doesn't
 * reliably anchor regex, and there's no built-in zero-pad helper. The
 * tag-slug spans are emitted inside the thumb (hidden), so this runs
 * without waiting on the footer resolver.
 */

(function () {
  'use strict';

  // ---- 0. Clone the "Download | Podcast" link pair under the title ----
  // The writer drops an h4 near the bottom of the post body with two
  // anchors: "Download | Podcast". We clone it (don't move) so those
  // links appear both under the cover title AND at the bottom of the
  // post where they were authored.
  //
  // We match on the first h4 in the post body rather than an id —
  // Ghost auto-generates heading IDs by slugifying the heading text,
  // so the id ends up as "download-podcast" only if the writer used
  // exactly that wording in a markdown card. Variations like
  // "Subscribe | Download" or h4s authored in HTML cards (which don't
  // get auto-ids at all) silently miss. Since h4 isn't used for
  // anything else inside an MR episode body, "first h4" is reliable.
  (function cloneDownloadLinks() {
    var slot = document.getElementById('mrEpisodeLinksSlot');
    var original = document.querySelector('.mr-episode-content h4');
    if (!slot || !original) return;

    var clone = original.cloneNode(true);
    clone.removeAttribute('id');
    clone.classList.add('mr-episode-links-clone');
    slot.appendChild(clone);
  })();

  // ---- 0a. Cover-image click → next MR episode ----
  // Matches the image-click behavior of the other section readers
  // (Dreams/Art/Favorites): clicking the cover advances within the
  // section. The next URL is whatever Ghost's {{next_post in="primary_tag"}}
  // rendered into the .mr-episode-next anchor's href — section-safe.
  // At the last episode the next element is a <span>, not an <a>, so
  // the selector misses and the cover stays non-clickable.
  (function setupCoverClick() {
    var cover    = document.querySelector('.mr-episode-cover');
    var nextLink = document.querySelector('a.mr-episode-next');
    if (!cover || !nextLink || !nextLink.href) return;

    cover.style.cursor = 'pointer';
    cover.addEventListener('click', function (e) {
      // Let clicks on the download/podcast links (inside the cover
      // overlay) do their own thing — don't hijack to "next episode".
      if (e.target.closest('a')) return;
      window.location.href = nextLink.href;
    });
  })();

  const strip = document.getElementById('mrFilmstrip');
  if (!strip) return;

  const thumbs = Array.from(strip.querySelectorAll('.mr-filmstrip-thumb'));
  if (!thumbs.length) return;

  const COVER_BASE = '/assets/mr/covers/';
  const MR_TAG_RE  = /^hash-mr-([0-9a-z]+)$/i;

  // ---- 1. Resolve and set cover src per thumb ----

  thumbs.forEach(function (thumb) {
    const img = thumb.querySelector('.mr-filmstrip-cover');
    if (!img) return;

    const epSpans = thumb.querySelectorAll('.mr-filmstrip-tags [data-ep]');
    let part = null;
    for (var i = 0; i < epSpans.length; i++) {
      const m = epSpans[i].getAttribute('data-ep').match(MR_TAG_RE);
      if (m) { part = m[1]; break; }
    }
    if (!part) return;

    // Pure digits → zero-pad to 2. Mixed (e.g. "23r") → uppercase.
    if (/^\d+$/.test(part)) {
      part = part.padStart(2, '0');
    }
    part = part.toUpperCase();

    img.src = COVER_BASE + 'MR' + part + '.webp';
  });

  // ---- 2. Center the current thumb in the strip ----

  function pathSlug() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : '';
  }

  const currentSlug = pathSlug();
  if (!currentSlug) return;

  const current = thumbs.find(function (t) {
    return t.getAttribute('data-slug') === currentSlug;
  });
  if (!current) return;

  current.classList.add('is-current');

  function centerCurrent() {
    var offset = current.offsetLeft
               - (strip.clientWidth / 2)
               + (current.offsetWidth / 2);
    strip.scrollTo({ left: Math.max(0, offset), behavior: 'instant' });
  }

  centerCurrent();
  window.addEventListener('resize', centerCurrent);

})();
