'use strict';

/**
 * Concert lighting — canvas spotlight beams sweeping the hero.
 * Uses transform-friendly canvas drawing only. Frozen to a static
 * frame when prefers-reduced-motion is set.
 */
(function () {
  var canvas;
  var ctx;
  var width = 0;
  var height = 0;
  var time = 0;
  var rafId = 0;
  var running = false;
  var reduced = false;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function resize() {
    canvas = DOM.heroCanvas.get(0);
    if (!canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawBeam(x, y, angle, length, beamWidth, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalCompositeOperation = 'lighter';
    var gradient = ctx.createLinearGradient(0, 0, 0, length);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.55, color.replace(/[\d.]+\)$/, '0.05)'));
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-beamWidth * 0.35, 0);
    ctx.lineTo(beamWidth * 0.35, 0);
    ctx.lineTo(beamWidth * 2.4, length);
    ctx.lineTo(-beamWidth * 2.4, length);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    var pulse = 0.82 + Math.sin(time * 1.8) * 0.18;
    var beams = [
      { x: width * 0.18, y: -30, base: 0.42, color: 'rgba(232,121,249,0.32)', w: 22 },
      { x: width * 0.5, y: -50, base: 0.08, color: 'rgba(34,211,238,0.26)', w: 28 },
      { x: width * 0.82, y: -24, base: -0.38, color: 'rgba(232,121,249,0.28)', w: 20 },
      { x: width * 0.08, y: height * 0.08, base: 1.05, color: 'rgba(34,211,238,0.12)', w: 16 },
      { x: width * 0.94, y: height * 0.12, base: -1.1, color: 'rgba(192,38,211,0.14)', w: 14 }
    ];

    beams.forEach(function (beam, index) {
      var sweep = reduced ? 0 : Math.sin(time + index * 0.85) * 0.22;
      drawBeam(
        beam.x,
        beam.y,
        beam.base + sweep,
        height * 1.05,
        beam.w * pulse,
        beam.color
      );
    });
  }

  function tick() {
    if (!running) return;
    time += 0.0075;
    render();
    rafId = window.requestAnimationFrame(tick);
  }

  function start() {
    stop();
    running = true;
    tick();
  }

  function stop() {
    running = false;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function onVisibility() {
    if (document.hidden || reduced) {
      stop();
      render();
      return;
    }
    start();
  }

  function init() {
    canvas = DOM.heroCanvas.get(0);
    if (!canvas) return;

    reduced = prefersReducedMotion();
    resize();
    render();

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);

    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (event) {
      reduced = event.matches;
      if (reduced) {
        stop();
        render();
      } else if (!document.hidden) {
        start();
      }
    });

    if (!reduced) start();
  }

  window.Lighting = {
    init: init,
    stop: stop
  };
})();
