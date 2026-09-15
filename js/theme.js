'use strict';

/**
 * Dark / light theme toggle.
 * Default is dark. Choice is persisted in localStorage and applied
 * via Tailwind's `dark` class on <html>.
 */
(function ($) {
  var STORAGE_KEY = 'nexus-theme';

  function currentTheme() {
    return DOM.html.hasClass('dark') ? 'dark' : 'light';
  }

  function syncToggleUi(theme) {
    var isDark = theme === 'dark';
    DOM.themeToggleBtn.attr({
      'aria-pressed': String(!isDark),
      'aria-label': isDark ? 'Switch to light theme' : 'Switch to dark theme'
    });
    DOM.themeIconSun.toggleClass('hidden', !isDark);
    DOM.themeIconMoon.toggleClass('hidden', isDark);
  }

  function applyTheme(theme) {
    var isDark = theme !== 'light';
    DOM.html.toggleClass('dark', isDark);
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch (err) {
      /* private mode / blocked storage — theme still works for this session */
    }
    syncToggleUi(isDark ? 'dark' : 'light');
  }

  function toggleTheme() {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  }

  function init() {
    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      saved = null;
    }
    if (saved === 'light' || saved === 'dark') {
      applyTheme(saved);
    } else {
      applyTheme('dark');
    }

    DOM.themeToggleBtn.on('click', function (event) {
      event.preventDefault();
      toggleTheme();
    });
  }

  window.Theme = {
    init: init,
    toggle: toggleTheme,
    apply: applyTheme
  };
})(jQuery);
