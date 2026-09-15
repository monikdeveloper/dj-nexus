'use strict';

/**
 * Single source of truth for every DOM node the app touches.
 * Other modules must read elements through DOM.xxx — never re-query.
 */
const DOM = {
  // ----- shell -----
  html: $(document.documentElement),
  body: $('body'),
  scrollRoot: $('html, body'),
  scrollProgress: $('#scroll-progress'),

  // ----- nav -----
  header: $('#site-header'),
  navLinks: $('.nav-link'),
  menuToggle: $('#menu-toggle'),
  mobileMenu: $('#mobile-menu'),
  mobileNavLinks: $('#mobile-menu .nav-link'),

  // ----- theme -----
  themeToggleBtn: $('#theme-toggle'),
  themeIconSun: $('#theme-icon-sun'),
  themeIconMoon: $('#theme-icon-moon'),

  // ----- pwa -----
  installAppBtn: $('.install-app-btn'),

  // ----- hero -----
  heroSection: $('#hero'),
  heroCanvas: $('#hero-lighting-canvas'),
  listenCta: $('#listen-cta'),
  bookCta: $('#book-cta'),

  // ----- smoke -----
  smokeLayer: $('#smoke-layer'),
  smokeCanvas: $('#smoke-canvas'),

  // ----- journey -----
  journeySection: $('#journey'),
  journeyTimeline: $('#journey-timeline'),
  journeyItems: $('.journey-item'),

  // ----- projects -----
  projectsSection: $('#projects'),
  projectsGrid: $('#projects-grid'),
  projectCards: $('#projects-grid .project-card'),

  // ----- performances / gallery -----
  performancesSection: $('#performances'),
  performanceGallery: $('#performance-gallery'),
  galleryItems: $('.gallery-item'),
  mixCards: $('.mix-card'),
  mixPlayBtns: $('.mix-play-btn'),
  galleryTabs: $('.gallery-tab'),
  galleryPanels: $('.gallery-panel'),

  // ----- lightbox -----
  lightbox: $('#lightbox'),
  lightboxImage: $('#lightbox-image'),
  lightboxEmbed: $('#lightbox-embed'),
  lightboxCaption: $('#lightbox-caption'),
  lightboxClose: $('#lightbox-close'),
  lightboxPrev: $('#lightbox-prev'),
  lightboxNext: $('#lightbox-next'),

  // ----- contact -----
  contactSection: $('#contact'),
  contactForm: $('#contact-form'),
  formSuccess: $('#form-success'),
  formResetBtn: $('#form-reset-btn'),
  fieldName: $('#field-name'),
  fieldEmail: $('#field-email'),
  fieldDate: $('#field-date'),
  fieldMessage: $('#field-message'),
  formError: $('#form-error'),

  // ----- footer -----
  footer: $('#site-footer'),
  footerNavLinks: $('#site-footer .nav-link'),

  // ----- scroll spy -----
  sections: $('main section[id]'),
  revealItems: $('.reveal')
};
