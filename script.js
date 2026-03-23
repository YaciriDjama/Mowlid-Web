(function () {
  'use strict';

  // Current year in footer
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      toggle.classList.toggle('active');
      navLinks.classList.toggle('active');
      document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        toggle.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // Gallery carousel
  var carousel = document.querySelector('.carousel');
  if (!carousel) return;

  var track = carousel.querySelector('.carousel-track');
  var slides = Array.prototype.slice.call(carousel.querySelectorAll('.carousel-slide'));
  var prevBtn = carousel.querySelector('.carousel-btn.prev');
  var nextBtn = carousel.querySelector('.carousel-btn.next');
  var dotsContainer = carousel.querySelector('.carousel-dots');
  var current = 0;
  var autoplayMs = 12000;
  var interactionPauseMs = 8000;
  var timer = null;
  var resumeTimer = null;

  function renderDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    slides.forEach(function (_, idx) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot' + (idx === current ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to photo ' + (idx + 1));
      dot.addEventListener('click', function () {
        goTo(idx);
        restartAutoplay();
      });
      dotsContainer.appendChild(dot);
    });
  }

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    track.style.transform = 'translateX(-' + current * 100 + '%)';
    slides.forEach(function (slide, idx) {
      slide.classList.toggle('active', idx === current);
    });
    var dots = carousel.querySelectorAll('.carousel-dot');
    dots.forEach(function (dot, idx) {
      dot.classList.toggle('active', idx === current);
    });
  }

  function next() {
    goTo(current + 1);
  }

  function prev() {
    goTo(current - 1);
  }

  function startAutoplay() {
    timer = window.setInterval(next, autoplayMs);
  }

  function stopAutoplay() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function clearResumeTimer() {
    if (resumeTimer) {
      window.clearTimeout(resumeTimer);
      resumeTimer = null;
    }
  }

  function restartAutoplay() {
    stopAutoplay();
    clearResumeTimer();
    startAutoplay();
  }

  function pauseThenResume(delayMs) {
    stopAutoplay();
    clearResumeTimer();
    resumeTimer = window.setTimeout(function () {
      startAutoplay();
    }, Math.max(interactionPauseMs, delayMs || 0));
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { prev(); pauseThenResume(interactionPauseMs); });
  if (nextBtn) nextBtn.addEventListener('click', function () { next(); pauseThenResume(interactionPauseMs); });

  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', function () { pauseThenResume(interactionPauseMs); });
  carousel.addEventListener('click', function (event) {
    if (event.target && event.target.tagName === 'IMG') {
      pauseThenResume(interactionPauseMs);
    }
  });

  renderDots();
  goTo(0);
  startAutoplay();
})();
