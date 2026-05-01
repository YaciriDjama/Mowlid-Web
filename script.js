(function () {
  'use strict';

  // Current year in footer
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');
  var bookDropdown = document.getElementById('book-dropdown');
  var bookBtn = document.getElementById('book-dropdown-btn');
  var bookPanel = document.getElementById('book-dropdown-panel');

  function closeBookDropdown() {
    if (!bookDropdown || !bookBtn || !bookPanel) return;
    bookDropdown.classList.remove('is-open');
    bookBtn.setAttribute('aria-expanded', 'false');
    bookPanel.setAttribute('aria-hidden', 'true');
  }

  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      toggle.classList.toggle('active');
      navLinks.classList.toggle('active');
      document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    function closeMobileNav() {
      toggle.classList.remove('active');
      navLinks.classList.remove('active');
      document.body.style.overflow = '';
      closeBookDropdown();
    }

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        var href = (link.getAttribute('href') || '').trim();
        if (/^mailto:/i.test(href) || /^tel:/i.test(href)) {
          window.setTimeout(closeMobileNav, 150);
          return;
        }
        closeMobileNav();
      });
    });
  }

  if (bookDropdown && bookBtn && bookPanel) {
    bookBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !bookDropdown.classList.contains('is-open');
      bookDropdown.classList.toggle('is-open', open);
      bookBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      bookPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
    });

    document.addEventListener('click', function (e) {
      if (bookDropdown.contains(e.target)) return;
      closeBookDropdown();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && bookDropdown.classList.contains('is-open')) {
        closeBookDropdown();
        bookBtn.focus();
      }
    });
  }

  // Force reliable email action for all email links (bottom/footer included)
  function buildGmailComposeUrl(email) {
    return 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(email);
  }

  function openInNewTab(url) {
    var win = window.open(url, '_blank', 'noopener');
    if (!win) {
      // Popup blocked: keep current tab unchanged and notify user.
      window.alert('Please allow pop-ups for this site to open email in a new tab.');
    }
  }

  document.querySelectorAll('a[href^="mailto:"], .js-email-link').forEach(function (emailLink) {
    emailLink.addEventListener('click', function (e) {
      var href = (emailLink.getAttribute('href') || '').trim();
      if (!href) return;

      var mailMatch = href.match(/^mailto:([^?]+)/i);
      if (mailMatch && mailMatch[1]) {
        e.preventDefault();
        openInNewTab(buildGmailComposeUrl(mailMatch[1]));
        return;
      }

      if (emailLink.classList.contains('js-email-link')) {
        e.preventDefault();
        openInNewTab(href);
      }
    });
  });

  function revealBooking() {
    var bookingSection = document.getElementById('booking');
    if (!bookingSection) return;
    bookingSection.removeAttribute('hidden');
  }

  function scrollToBooking() {
    var el = document.getElementById('booking');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function initBookingReveal() {
    var bookingSection = document.getElementById('booking');
    if (!bookingSection) return;

    if (window.location.hash === '#booking') {
      revealBooking();
    }

    document.querySelectorAll('a[href="#booking"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        revealBooking();
        if (window.history.replaceState) {
          window.history.replaceState(null, '', '#booking');
        } else {
          window.location.hash = 'booking';
        }
        window.requestAnimationFrame(function () {
          scrollToBooking();
        });
      });
    });

    window.addEventListener('hashchange', function () {
      if (window.location.hash === '#booking') {
        revealBooking();
        window.requestAnimationFrame(scrollToBooking);
      }
    });
  }

  initBookingReveal();

  // Limited-time promo: one deadline per browser session (sessionStorage), does not reset on reopen
  var PROMO_STORAGE_KEY = 'brightPromo15Dismissed';
  var PROMO_DEADLINE_KEY = 'brightPromo15DeadlineMs';
  var PROMO_WINDOW_MS = 30 * 60 * 1000;
  var promoModal = document.getElementById('promo-modal');
  var promoFab = document.getElementById('promo-fab');
  var promoTimerEl = document.getElementById('promo-timer');
  var promoTimerInterval = null;
  var promoDeadline = 0;

  function readDeadlineFromStorage() {
    try {
      var s = sessionStorage.getItem(PROMO_DEADLINE_KEY);
      if (!s) return null;
      var t = parseInt(s, 10);
      return isNaN(t) ? null : t;
    } catch (e) {
      return null;
    }
  }

  function getOrCreateDeadline() {
    var existing = readDeadlineFromStorage();
    if (existing !== null) return existing;
    var d = Date.now() + PROMO_WINDOW_MS;
    try {
      sessionStorage.setItem(PROMO_DEADLINE_KEY, String(d));
    } catch (e) {}
    return d;
  }

  function showPromoFab() {
    if (!promoFab) return;
    promoFab.removeAttribute('hidden');
    updatePromoFabAppearance();
  }

  function hidePromoFab() {
    if (!promoFab) return;
    promoFab.setAttribute('hidden', '');
  }

  function updatePromoFabAppearance() {
    if (!promoFab) return;
    var d = readDeadlineFromStorage();
    if (d === null) return;
    var active = Date.now() <= d;
    promoFab.classList.toggle('promo-fab--expired', !active);
    var hint = promoFab.querySelector('.promo-fab__hint');
    var badge = promoFab.querySelector('.promo-fab__badge');
    if (hint && badge) {
      if (active) {
        badge.textContent = '15% off';
        hint.textContent = 'Book in 30 min';
      } else {
        badge.textContent = 'Offer ended';
        hint.textContent = 'Tap for details';
      }
    }
  }

  function updatePromoModalExpiredState() {
    if (!promoModal) return;
    var expired = Date.now() > promoDeadline;
    var panel = promoModal.querySelector('.promo-modal__panel');
    var expiredEl = document.getElementById('promo-expired');
    var desc = document.getElementById('promo-desc');
    if (panel) panel.classList.toggle('promo-modal__panel--expired', expired);
    if (expiredEl) expiredEl.hidden = !expired;
    if (desc) desc.hidden = expired;
  }

  function promoBodyOverflow() {
    var navOpen = navLinks && navLinks.classList.contains('active');
    document.body.style.overflow = navOpen ? 'hidden' : '';
  }

  function stopPromoTimer() {
    if (promoTimerInterval) {
      window.clearInterval(promoTimerInterval);
      promoTimerInterval = null;
    }
  }

  function tickPromoTimer() {
    if (!promoTimerEl || !promoModal || promoModal.hasAttribute('hidden')) return;
    var left = Math.max(0, promoDeadline - Date.now());
    var m = Math.floor(left / 60000);
    var s = Math.floor((left % 60000) / 1000);
    promoTimerEl.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    updatePromoModalExpiredState();
    if (left <= 0) stopPromoTimer();
  }

  function startPromoTimer() {
    stopPromoTimer();
    promoDeadline = getOrCreateDeadline();
    tickPromoTimer();
    promoTimerInterval = window.setInterval(tickPromoTimer, 1000);
  }

  function openPromoModal() {
    if (!promoModal) return;
    hidePromoFab();
    promoModal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    startPromoTimer();
    var closeBtn = promoModal.querySelector('.promo-modal__close');
    if (closeBtn) closeBtn.focus();
  }

  function closePromoModal() {
    if (!promoModal) return;
    promoModal.setAttribute('hidden', '');
    try {
      sessionStorage.setItem(PROMO_STORAGE_KEY, '1');
    } catch (e) {}
    stopPromoTimer();
    promoBodyOverflow();
    showPromoFab();
    if (promoFab) promoFab.focus();
  }

  if (promoModal) {
    try {
      if (!sessionStorage.getItem(PROMO_STORAGE_KEY)) {
        window.setTimeout(openPromoModal, 450);
      } else {
        showPromoFab();
      }
    } catch (e) {
      window.setTimeout(openPromoModal, 450);
    }

    if (promoFab) {
      promoFab.addEventListener('click', function () {
        openPromoModal();
      });
    }

    promoModal.querySelectorAll('[data-promo-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        closePromoModal();
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && promoModal && !promoModal.hasAttribute('hidden')) {
        closePromoModal();
      }
    });
  }

  var bookingForm = document.querySelector('.booking-form');
  if (bookingForm) {
    function setBookingStatus(statusEl, message, isError) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.classList.toggle('booking-status--error', !!isError);
    }

    function setBookingStatusHtml(statusEl, html, isError) {
      if (!statusEl) return;
      statusEl.innerHTML = html;
      statusEl.classList.toggle('booking-status--error', !!isError);
    }

    function submitBooking(endpoint, formData) {
      var timeoutMs = 12000;
      var timeoutPromise = new Promise(function (_, reject) {
        window.setTimeout(function () {
          reject(new Error('Submit timed out'));
        }, timeoutMs);
      });
      var requestPromise = fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json'
        }
      }).then(function (res) {
        return res.json().catch(function () {
          return { success: false };
        });
      });
      return Promise.race([requestPromise, timeoutPromise]);
    }

    function buildMailtoFallbackUrl(formData, email) {
      var lines = ['Booking request fallback submission', ''];
      formData.forEach(function (value, key) {
        lines.push(key + ': ' + value);
      });
      var subject = 'New Bright Photo Booth booking request (fallback)';
      var body = lines.join('\n');
      return 'mailto:' + encodeURIComponent(email) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    }

    bookingForm.addEventListener('invalid', function () {
      var statusEl = document.getElementById('booking-status');
      setBookingStatus(statusEl, 'Please complete all required fields before submitting.', true);
    }, true);

    bookingForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var meta = document.getElementById('promo-booking-meta');
      var deadlineMeta = document.getElementById('promo-deadline-meta');
      var statusEl = document.getElementById('booking-status');
      var submitBtn = bookingForm.querySelector('.booking-submit');
      var primaryEndpoint = (bookingForm.getAttribute('data-primary-endpoint') || bookingForm.getAttribute('action') || '').trim();
      var fallbackEndpoint = (bookingForm.getAttribute('data-fallback-endpoint') || '').trim();
      var fallbackEmail = (bookingForm.getAttribute('data-fallback-email') || '').trim();
      var hasPrimaryEndpoint = !!primaryEndpoint && !/YOUR_|REPLACE_ME|REPLACE_WITH/i.test(primaryEndpoint);
      var hasFallbackEndpoint = !!fallbackEndpoint && !/YOUR_|REPLACE_ME/i.test(fallbackEndpoint);
      var d = readDeadlineFromStorage();
      var within = d !== null && Date.now() <= d;
      if (meta) meta.value = within ? 'yes' : 'no';
      if (deadlineMeta) deadlineMeta.value = d !== null ? new Date(d).toISOString() : '';
      if (within) {
        try {
          sessionStorage.setItem('brightPromo15SubmittedInWindow', String(Date.now()));
        } catch (e2) {}
      }

      var formData = new FormData(bookingForm);
      setBookingStatus(statusEl, 'Sending your booking request...', false);
      if (submitBtn) {
        submitBtn.disabled = true;
      }

      if (!hasPrimaryEndpoint) {
        if (fallbackEmail) {
          var configFallbackUrl = buildMailtoFallbackUrl(formData, fallbackEmail);
          setBookingStatusHtml(
            statusEl,
            'Online booking endpoint is not configured yet. <a href="' + configFallbackUrl + '">Tap here to email your booking details now</a>.',
            true
          );
          window.location.href = configFallbackUrl;
        } else {
          setBookingStatus(statusEl, 'Online booking endpoint is not configured yet.', true);
        }
        if (submitBtn) {
          submitBtn.disabled = false;
        }
        return;
      }

      submitBooking(primaryEndpoint, formData)
        .then(function (res) {
          if (res && res.success) {
            setBookingStatus(statusEl, 'Thanks! Your booking request was sent. We will contact you soon.', false);
            bookingForm.reset();
            return;
          }
          throw new Error('Primary submit failed');
        })
        .catch(function () {
          if (!hasFallbackEndpoint) throw new Error('No fallback endpoint');
          setBookingStatus(statusEl, 'Primary submit unavailable. Retrying with backup...', true);
          return submitBooking(fallbackEndpoint, formData).then(function (res) {
            if (res && res.success) {
              setBookingStatus(statusEl, 'Sent through backup form service. We will contact you soon.', false);
              bookingForm.reset();
              return;
            }
            throw new Error('Backup submit failed');
          });
        })
        .catch(function () {
          if (fallbackEmail) {
            var fallbackUrl = buildMailtoFallbackUrl(formData, fallbackEmail);
            window.location.href = fallbackUrl;
            setBookingStatusHtml(
              statusEl,
              'Could not reach the form service. If your email app did not open, <a href="' + fallbackUrl + '">tap here to open your prefilled email</a> or email Photoboothbright@gmail.com.',
              true
            );
          } else {
            setBookingStatus(
              statusEl,
              'We could not submit right now. Please email Photoboothbright@gmail.com or call/text 651-420-3713.',
              true
            );
          }
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
          }
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
