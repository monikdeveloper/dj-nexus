'use strict';

/**
 * Scroll-triggered smoke / fog.
 * Layered SVG textures are CSS-animated; this canvas adds slow drifting
 * particles while #smoke-layer is in view. Particle count drops on mobile.
 */
(function () {
  var canvas;
  var ctx;
  var width = 0;
  var height = 0;
  var particles = [];
  var rafId = 0;
  var running = false;
  var visible = false;
  var reduced = false;

  function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  function cap() {
    return isMobile() ? 16 : 40;
  }

  function resize() {
    canvas = DOM.smokeCanvas.get(0);
    if (!canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || 280;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(count) {
    var i;
    for (i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: height * (0.55 + Math.random() * 0.55),
        r: 24 + Math.random() * (isMobile() ? 48 : 78),
        vx: (Math.random() - 0.5) * 0.32,
        vy: -0.12 - Math.random() * 0.28,
        a: 0.035 + Math.random() * 0.07,
        hue: Math.random() > 0.45 ? '232,121,249' : '34,211,238'
      });
    }
  }

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (!visible || reduced) return;

    if (particles.length < cap() && Math.random() > 0.55) {
      spawn(1);
    }

    particles.forEach(function (p) {
      p.x += p.vx;
      p.y += p.vy;
      p.a *= 0.9965;
      var gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      gradient.addColorStop(0, 'rgba(' + p.hue + ',' + p.a + ')');
      gradient.addColorStop(1, 'rgba(' + p.hue + ',0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    particles = particles.filter(function (p) {
      return p.y + p.r > -30 && p.a > 0.012;
    });
  }

  function tick() {
    if (!running) return;
    render();
    rafId = window.requestAnimationFrame(tick);
  }

  function start() {
    if (running || reduced) return;
    running = true;
    tick();
  }

  function stop() {
    running = false;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (ctx) ctx.clearRect(0, 0, width, height);
  }

  function setVisible(next) {
    visible = next;
    DOM.smokeLayer.toggleClass('is-active', next);
    if (next && !reduced) {
      if (!particles.length) spawn(Math.min(10, cap()));
      start();
    } else if (!next) {
      stop();
      particles = [];
    }
  }

  function init() {
    canvas = DOM.smokeCanvas.get(0);
    if (!canvas || !DOM.smokeLayer.length) return;

    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resize();
    window.addEventListener('resize', resize);

    var observer = new IntersectionObserver(
      function (entries) {
        setVisible(Boolean(entries[0] && entries[0].isIntersecting));
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    );
    observer.observe(DOM.smokeLayer.get(0));

    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (event) {
      reduced = event.matches;
      if (reduced) {
        stop();
        DOM.smokeLayer.removeClass('is-active');
      } else if (visible) {
        start();
        DOM.smokeLayer.addClass('is-active');
      }
    });
  }

  window.Smoke = {
    init: init
  };
})();
