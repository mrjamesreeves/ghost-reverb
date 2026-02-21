(function () {
  'use strict';

  // ── Asset Base Path (set by Ghost template, empty string for standalone) ──
  var BASE = window.STATIC_ASSET_BASE || '';

  // ── Config ──
  var TOTAL = 24;
  var PRELOAD = 2;
  var DURATION = 800;
  var SWIPE_MIN = 50;
  var WHEEL_THRESHOLD = 80;
  var HIDE_DELAY = 3000;

  // ── Slide Titles ──
  var TITLES = [
    '',                  // 1: Title
    '',                  // 2: Epigraph
    'Introduction',      // 3
    'The Sound',         // 4
    'The Story',         // 5
    'The Story',         // 6
    '',                  // 7: Radio Interstitial
    'The Characters',    // 8: Kay
    'The Characters',    // 9: Father Jim
    'The Characters',    // 10: Carly Dee
    'The Characters',    // 11: Tanner Whitney
    'The Characters',    // 12: Eddie, Gold, Silver
    'The Characters',    // 13: Manager, Zed, Ruby
    'Black Sunshine',    // 14
    'Structure',         // 15
    'Location',          // 16
    'Location',          // 17
    'Location',          // 18
    'Style',             // 19
    'Mood Video',        // 20
    'Soundtrack',        // 21
    '',                  // 22: Radio Interstitial
    'About the Creators',// 23
    ''                   // 24: Contact
  ];

  // ── State ──
  var current = 0;
  var transitioning = false;
  var touchX = 0;
  var touchY = 0;
  var wheelAcc = 0;
  var wheelTimer = null;
  var hideTimer = null;

  // ── DOM ──
  var deck = document.getElementById('deck');
  var slides = deck.querySelectorAll('.slide');
  var counter = document.getElementById('slideCounter');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var tocBtn = document.getElementById('tocToggle');
  var tocOverlay = document.getElementById('tocOverlay');
  var tocBackdrop = tocOverlay.querySelector('.toc-overlay__backdrop');
  var tocLinks = tocOverlay.querySelectorAll('a[data-slide]');
  var topbar = document.getElementById('topbar');
  var navTitle = document.getElementById('navTitle');
  var navSep = document.getElementById('navSep');
  var navHome = document.getElementById('navHome');

  // ── Background Loading ──
  var loaded = {};

  function loadBg(i) {
    if (i < 0 || i >= TOTAL || loaded[i]) return;
    var s = slides[i];
    var src = s.getAttribute('data-bg');
    var col = s.getAttribute('data-bg-color');
    var bg = s.querySelector('.slide__bg');
    if (src) {
      var fullSrc = BASE + src;
      var img = new Image();
      img.onload = function () {
        bg.style.backgroundImage = "url('" + fullSrc + "')";
        loaded[i] = true;
      };
      img.src = fullSrc;
    } else if (col) {
      bg.style.backgroundColor = col;
      loaded[i] = true;
    }
  }

  function preload(i) {
    for (var n = i - PRELOAD; n <= i + PRELOAD; n++) loadBg(n);
  }

  // ── Top Bar Auto-Hide ──
  function showBar() {
    topbar.classList.remove('is-hidden');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideBar, HIDE_DELAY);
  }

  function hideBar() {
    if (tocOverlay.classList.contains('is-open')) return;
    topbar.classList.add('is-hidden');
  }

  function resetHideTimer() {
    showBar();
  }

  document.addEventListener('mousemove', resetHideTimer);
  document.addEventListener('touchstart', resetHideTimer, { passive: true });

  // ── Navigation ──
  function goTo(i, instant) {
    if (i < 0 || i >= TOTAL) return;
    if (transitioning && !instant) return;
    if (i === current && !instant) return;

    transitioning = true;
    var prev = slides[current];
    prev.classList.remove('is-active');
    prev.classList.add('is-prev');

    current = i;
    var next = slides[current];
    next.classList.add('is-active');

    updateCounter();
    preload(current);
    showBar();

    setTimeout(function () {
      prev.classList.remove('is-prev');
      transitioning = false;
    }, instant ? 0 : DURATION);

    history.replaceState(null, '', '#slide-' + (current + 1));
  }

  function advance()  { if (current < TOTAL - 1) goTo(current + 1); }
  function retreat()   { if (current > 0) goTo(current - 1); }

  function updateCounter() {
    var n = String(current + 1);
    if (n.length < 2) n = '0' + n;
    counter.textContent = n + ' / ' + TOTAL;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === TOTAL - 1;

    var title = TITLES[current] || '';
    navTitle.textContent = title;
    navSep.textContent = title ? ':' : '';
  }

  // ── Keyboard ──
  document.addEventListener('keydown', function (e) {
    if (tocOverlay.classList.contains('is-open')) {
      if (e.key === 'Escape') closeToc();
      return;
    }
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown':
        e.preventDefault(); advance(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
        e.preventDefault(); retreat(); break;
      case 'Home': e.preventDefault(); goTo(0); break;
      case 'End':  e.preventDefault(); goTo(TOTAL - 1); break;
      case 'Escape': break;
    }
  });

  // ── Touch / Swipe ──
  deck.addEventListener('touchstart', function (e) {
    touchX = e.changedTouches[0].screenX;
    touchY = e.changedTouches[0].screenY;
  }, { passive: true });

  deck.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].screenX - touchX;
    var dy = e.changedTouches[0].screenY - touchY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_MIN) {
      if (dx < 0) advance(); else retreat();
    }
  }, { passive: true });

  // ── Scroll Wheel ──
  deck.addEventListener('wheel', function (e) {
    // Allow native scroll inside scrollable panels
    var el = e.target;
    while (el && el !== deck) {
      if (el.classList && (el.classList.contains('character__text') || el.classList.contains('glass-panel--full') || el.classList.contains('glass-panel'))) {
        var canScroll = el.scrollHeight > el.clientHeight;
        if (canScroll) {
          var atTop = el.scrollTop <= 0 && e.deltaY < 0;
          var atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2 && e.deltaY > 0;
          if (!atTop && !atBottom) return; // let native scroll happen
        }
      }
      el = el.parentElement;
    }

    e.preventDefault();
    wheelAcc += e.deltaY;

    if (Math.abs(wheelAcc) >= WHEEL_THRESHOLD) {
      if (wheelAcc > 0) advance(); else retreat();
      wheelAcc = 0;
    }

    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(function () { wheelAcc = 0; }, 200);
  }, { passive: false });

  // ── Arrow Buttons ──
  prevBtn.addEventListener('click', retreat);
  nextBtn.addEventListener('click', advance);

  // ── Click to advance (forward only) ──
  deck.addEventListener('click', function (e) {
    // Don't advance if clicking buttons, links, panels, etc.
    if (e.target.closest('button, a, .glass-panel, .character__text, .video-embed, .toc-overlay, .topbar, .tracklist')) return;
    advance();
  });

  // ── Home link in topbar ──
  navHome.addEventListener('click', function (e) {
    e.preventDefault();
    goTo(0);
  });

  // ── TOC ──
  function openToc() {
    tocOverlay.classList.add('is-open');
    tocOverlay.setAttribute('aria-hidden', 'false');
    tocBtn.classList.add('is-open');
    showBar();
  }

  function closeToc() {
    tocOverlay.classList.remove('is-open');
    tocOverlay.setAttribute('aria-hidden', 'true');
    tocBtn.classList.remove('is-open');
    showBar();
  }

  tocBtn.addEventListener('click', function () {
    if (tocOverlay.classList.contains('is-open')) closeToc(); else openToc();
  });

  tocBackdrop.addEventListener('click', closeToc);

  for (var t = 0; t < tocLinks.length; t++) {
    tocLinks[t].addEventListener('click', function (e) {
      e.preventDefault();
      var target = parseInt(this.getAttribute('data-slide'), 10);
      closeToc();
      setTimeout(function () { goTo(target); }, 250);
    });
  }

  // ── Vimeo Lazy Embed ──
  var videoPlaceholder = document.getElementById('videoPlaceholder');
  var videoEmbed = document.getElementById('videoEmbed');

  if (videoPlaceholder && videoEmbed) {
    videoPlaceholder.addEventListener('click', function () {
      videoPlaceholder.style.display = 'none';
      var iframe = document.createElement('iframe');
      iframe.src = 'https://player.vimeo.com/video/794341994?autoplay=1&color=00ffff&title=0&byline=0&portrait=0';
      iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');
      videoEmbed.appendChild(iframe);
    });
  }

  // ── Init ──
  function init() {
    var start = 0;
    var hash = window.location.hash;
    if (hash && hash.indexOf('#slide-') === 0) {
      var num = parseInt(hash.replace('#slide-', ''), 10);
      if (num >= 1 && num <= TOTAL) start = num - 1;
    }

    slides[start].classList.add('is-active');
    current = start;
    updateCounter();
    preload(start);
    showBar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
