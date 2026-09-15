'use strict';

/**
 * App bootstrap: navigation, scroll reveal, gallery lightbox,
 * mix players, contact form, and PWA install prompt.
 * Every element is reached through the global DOM object.
 */
(function ($) {
  var galleryIndex = 0;
  var deferredPrompt = null;
  var lastFocused = null;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ----- smooth-scroll nav ----- */
  function scrollToHash(hash) {
    var target = DOM.sections.filter(hash);
    if (!target.length) return;
    var headerH = DOM.header.outerHeight() || 72;
    var top = target.offset().top - headerH + 1;
    DOM.scrollRoot.animate({ scrollTop: top }, prefersReducedMotion() ? 0 : 520);
  }

  function bindNav() {
    DOM.navLinks.on('click', function (event) {
      var href = $(this).attr('href');
      if (!href || href.charAt(0) !== '#') return;
      event.preventDefault();
      scrollToHash(href);
      closeMobileMenu();
    });

    DOM.listenCta.add(DOM.bookCta).on('click', function (event) {
      var href = $(this).attr('href');
      if (!href || href.charAt(0) !== '#') return;
      event.preventDefault();
      scrollToHash(href);
    });
  }

  function openMobileMenu() {
    DOM.mobileMenu.addClass('is-open').attr('aria-hidden', 'false');
    DOM.menuToggle.attr('aria-expanded', 'true');
  }

  function closeMobileMenu() {
    DOM.mobileMenu.removeClass('is-open').attr('aria-hidden', 'true');
    DOM.menuToggle.attr('aria-expanded', 'false');
  }

  function bindMobileMenu() {
    DOM.menuToggle.on('click', function () {
      if (DOM.mobileMenu.hasClass('is-open')) closeMobileMenu();
      else openMobileMenu();
    });
  }

  /* ----- header + progress + spy ----- */
  function onScroll() {
    var scrollTop = $(window).scrollTop();
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    var progress = docH > 0 ? scrollTop / docH : 0;
    DOM.scrollProgress.css('transform', 'scaleX(' + progress + ')');
    DOM.header.toggleClass('is-scrolled', scrollTop > 24);

    var headerH = DOM.header.outerHeight() || 72;
    var currentId = null;
    DOM.sections.each(function () {
      var top = this.offsetTop - headerH - 48;
      if (scrollTop >= top) currentId = this.id;
    });
    DOM.navLinks.removeClass('is-active');
    if (currentId) {
      DOM.navLinks.filter('[href="#' + currentId + '"]').addClass('is-active');
    }
  }

  /* ----- reveal-on-scroll ----- */
  function bindReveal() {
    if (prefersReducedMotion()) {
      DOM.revealItems.addClass('is-visible');
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            $(entry.target).addClass('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
    );
    DOM.revealItems.each(function () {
      observer.observe(this);
    });
  }

  /* ----- gallery tabs ----- */
  function bindTabs() {
    DOM.galleryTabs.on('click', function () {
      var tab = $(this);
      var panelId = tab.attr('data-panel');
      DOM.galleryTabs.removeClass('is-active').attr('aria-selected', 'false');
      tab.addClass('is-active').attr('aria-selected', 'true');
      DOM.galleryPanels.addClass('hidden');
      DOM.galleryPanels.filter('#' + panelId).removeClass('hidden');
    });
  }

  /* ----- lightbox ----- */
  function gallerySrc(index) {
    var item = DOM.galleryItems.eq(index);
    return {
      src: item.attr('data-full') || item.find('img').attr('src'),
      caption: item.attr('data-caption') || item.find('img').attr('alt') || '',
      embed: item.attr('data-embed') || ''
    };
  }

  function showGallery(index) {
    var total = DOM.galleryItems.length;
    if (!total) return;
    galleryIndex = (index + total) % total;
    var data = gallerySrc(galleryIndex);

    DOM.lightboxEmbed.empty().addClass('hidden');
    if (data.embed) {
      DOM.lightboxImage.addClass('hidden').attr({ src: '', alt: '' });
      DOM.lightboxEmbed
        .removeClass('hidden')
        .html(
          '<iframe class="w-full aspect-video rounded-xl" src="' +
            data.embed +
            '" title="' +
            data.caption +
            '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
        );
    } else {
      DOM.lightboxImage.removeClass('hidden').attr({ src: data.src, alt: data.caption });
    }
    DOM.lightboxCaption.text(data.caption + ' · ' + (galleryIndex + 1) + ' / ' + total);
  }

  function openLightbox(index) {
    lastFocused = document.activeElement;
    showGallery(index);
    DOM.lightbox.addClass('is-open').attr('aria-hidden', 'false');
    DOM.body.addClass('overflow-hidden');
    DOM.lightboxClose.trigger('focus');
  }

  function closeLightbox() {
    DOM.lightbox.removeClass('is-open').attr('aria-hidden', 'true');
    DOM.body.removeClass('overflow-hidden');
    DOM.lightboxEmbed.empty();
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function bindLightbox() {
    DOM.galleryItems.on('click', function () {
      openLightbox(DOM.galleryItems.index(this));
    });
    DOM.galleryItems.on('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(DOM.galleryItems.index(this));
      }
    });
    DOM.lightboxClose.on('click', closeLightbox);
    DOM.lightboxPrev.on('click', function () {
      showGallery(galleryIndex - 1);
    });
    DOM.lightboxNext.on('click', function () {
      showGallery(galleryIndex + 1);
    });
    DOM.lightbox.on('click', function (event) {
      if (event.target === this) closeLightbox();
    });
    $(document).on('keydown', function (event) {
      if (!DOM.lightbox.hasClass('is-open')) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') showGallery(galleryIndex - 1);
      if (event.key === 'ArrowRight') showGallery(galleryIndex + 1);
    });
  }

  /* ----- mix players (visual + optional audio) ----- */
  function stopMixes(exceptBtn) {
    DOM.mixPlayBtns.each(function () {
      var btn = $(this);
      if (exceptBtn && btn.get(0) === exceptBtn.get(0)) return;
      var audio = btn.closest('.mix-card').find('audio').get(0);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      btn.attr('aria-pressed', 'false').find('.mix-play-label').text('Play');
      btn.closest('.mix-card').removeClass('is-playing');
    });
  }

  function bindMixes() {
    DOM.mixPlayBtns.on('click', function () {
      var btn = $(this);
      var card = btn.closest('.mix-card');
      var audio = card.find('audio').get(0);
      var playing = card.hasClass('is-playing');

      stopMixes(btn);

      if (playing) {
        card.removeClass('is-playing');
        btn.attr('aria-pressed', 'false').find('.mix-play-label').text('Play');
        if (audio) audio.pause();
        return;
      }

      card.addClass('is-playing');
      btn.attr('aria-pressed', 'true').find('.mix-play-label').text('Pause');
      if (audio) {
        var playPromise = audio.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(function () {
            /* placeholder file may be missing — visual play state still stands */
          });
        }
      }
    });
  }

  /* ----- contact form ----- */
  function bindForm() {
    DOM.contactForm.on('submit', function (event) {
      event.preventDefault();
      var name = $.trim(DOM.fieldName.val() || '');
      var email = $.trim(DOM.fieldEmail.val() || '');
      var message = $.trim(DOM.fieldMessage.val() || '');
      var validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!name || !validEmail || !message) {
        DOM.formError.removeClass('hidden').text('Please add your name, a valid email, and a short message.');
        return;
      }

      DOM.formError.addClass('hidden').text('');
      DOM.contactForm.addClass('hidden');
      DOM.formSuccess.removeClass('hidden');
    });

    DOM.formResetBtn.on('click', function () {
      DOM.contactForm.trigger('reset').removeClass('hidden');
      DOM.formSuccess.addClass('hidden');
    });
  }

  /* ----- PWA install ----- */
  function hideInstall() {
    DOM.installAppBtn.attr('hidden', true);
  }

  function showInstall() {
    DOM.installAppBtn.removeAttr('hidden');
  }

  function bindPwa() {
    hideInstall();

    if (window.matchMedia('(display-mode: standalone)').matches) {
      hideInstall();
    }

    window.addEventListener('beforeinstallprompt', function (event) {
      event.preventDefault();
      deferredPrompt = event;
      showInstall();
    });

    DOM.installAppBtn.on('click', function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () {
        deferredPrompt = null;
        hideInstall();
      });
    });

    window.addEventListener('appinstalled', hideInstall);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(function () {
        /* file:// or unsupported context — site still runs */
      });
    }
  }

  $(function () {
    Theme.init();
    Lighting.init();
    Smoke.init();
    bindNav();
    bindMobileMenu();
    bindReveal();
    bindTabs();
    bindLightbox();
    bindMixes();
    bindForm();
    bindPwa();
    $(window).on('scroll resize', onScroll);
    onScroll();
  });
})(jQuery);
