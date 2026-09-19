'use strict';

/**
 * Club haze on the hero only.
 * Idle: slow floor smoke. Music: machine bursts from the sides and floor.
 * All nodes come from the global DOM object.
 */
(function () {
  var canvas;
  var ctx;
  var width = 0;
  var height = 0;
  var particles = [];
  var rafId = 0;
  var running = false;
  var reduced = false;
  var inHero = false;
  var live = false;
  var nextSpawn = 0;

  function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  function cap() {
    if (live) return isMobile() ? 26 : 46;
    return isMobile() ? 10 : 18;
  }

  function resize() {
    canvas = DOM.smokeCanvas.get(0);
    if (!canvas || !DOM.heroSection.length) return;
    var box = DOM.heroSection.get(0).getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.floor(box.width));
    height = Math.max(1, Math.floor(box.height));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(kind) {
    var fromLeft = Math.random() > 0.5;
    var dark = document.documentElement.classList.contains('dark');
    var floor = kind === 'floor' || (!live && Math.random() > 0.35);
    var x;
    var y;
    var vx;
    var vy;

    if (floor) {
      x = width * (0.08 + Math.random() * 0.84);
      y = height + 40 + Math.random() * 50;
      vx = (Math.random() - 0.5) * (live ? 0.55 : 0.22);
      vy = -(0.28 + Math.random() * (live ? 0.85 : 0.38));
    } else {
      x = fromLeft ? -70 : width + 70;
      y = height * (0.35 + Math.random() * 0.55);
      vx = (fromLeft ? 1 : -1) * (0.35 + Math.random() * (live ? 0.9 : 0.35));
      vy = -(0.18 + Math.random() * (live ? 0.55 : 0.22));
    }

    particles.push({
      x: x,
      y: y,
      r: (isMobile() ? 32 : 48) + Math.random() * (live ? (isMobile() ? 70 : 110) : (isMobile() ? 36 : 58)),
      grow: 0.06 + Math.random() * 0.12,
      vx: vx,
      vy: vy,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.01 + Math.random() * 0.02,
      a: live ? 0.14 + Math.random() * 0.1 : 0.07 + Math.random() * 0.05,
      fade: live ? 0.0007 + Math.random() * 0.001 : 0.0011 + Math.random() * 0.0014,
      hue: live && Math.random() > 0.55
        ? (Math.random() > 0.5 ? '232,121,249' : '34,211,238')
        : (dark ? '226,230,236' : '90,88,96')
    });
  }

  function burst() {
    var n = isMobile() ? 6 : 10;
    var i;
    for (i = 0; i < n; i += 1) {
      spawn(i % 3 === 0 ? 'side' : 'floor');
    }
  }

  function scheduleSpawn(now) {
    nextSpawn = now + (live
      ? (isMobile() ? 90 : 55) + Math.random() * 120
      : (isMobile() ? 480 : 320) + Math.random() * 500);
  }

  function render(now) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (reduced || !inHero) return;

    if (now >= nextSpawn && particles.length < cap()) {
      spawn(Math.random() > 0.4 ? 'floor' : 'side');
      if (live) spawn('side');
      scheduleSpawn(now);
    }

    ctx.globalCompositeOperation = 'lighter';
    particles.forEach(function (p) {
      p.wobble += p.wobbleSpeed;
      p.x += p.vx + Math.sin(p.wobble) * (live ? 0.55 : 0.28);
      p.y += p.vy;
      p.r += p.grow;
      p.a -= p.fade;
      p.vy *= 0.998;

      if (p.a <= 0.01) return;

      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, 'rgba(' + p.hue + ',' + p.a + ')');
      g.addColorStop(0.35, 'rgba(' + p.hue + ',' + p.a * 0.45 + ')');
      g.addColorStop(1, 'rgba(' + p.hue + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.r * 1.15, p.r * 0.72, p.wobble * 0.25, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';

    particles = particles.filter(function (p) {
      return p.a > 0.01 && p.y + p.r > -40 && p.x > -160 && p.x < width + 160;
    });
  }

  function tick(now) {
    if (!running) return;
    render(now);
    rafId = window.requestAnimationFrame(tick);
  }

  function startLoop() {
    if (running || reduced) return;
    running = true;
    scheduleSpawn(performance.now());
    rafId = window.requestAnimationFrame(tick);
  }

  function stopLoop() {
    running = false;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    particles = [];
    if (ctx) ctx.clearRect(0, 0, width, height);
  }

  function setInHero(next) {
    inHero = next;
    DOM.smokeLayer.toggleClass('is-active', next);
    if (next && !reduced) {
      resize();
      if (!particles.length) {
        var i;
        for (i = 0; i < (isMobile() ? 3 : 5); i += 1) spawn('floor');
      }
      startLoop();
    } else if (!next) {
      stopLoop();
    }
  }

  function setLive(next) {
    var wasLive = live;
    live = Boolean(next);
    DOM.smokeLayer.toggleClass('is-live', live);
    if (live && inHero && !wasLive && !reduced) burst();
  }

  function init() {
    canvas = DOM.smokeCanvas.get(0);
    if (!canvas || !DOM.smokeLayer.length || !DOM.heroSection.length) return;

    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resize();
    window.addEventListener('resize', resize);

    var observer = new IntersectionObserver(
      function (entries) {
        setInHero(Boolean(entries[0] && entries[0].isIntersecting && entries[0].intersectionRatio > 0.12));
      },
      { threshold: [0, 0.12, 0.4] }
    );
    observer.observe(DOM.heroSection.get(0));

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopLoop();
      else if (inHero && !reduced) startLoop();
    });

    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (event) {
      reduced = event.matches;
      if (reduced) stopLoop();
      else if (inHero) startLoop();
    });
  }

  window.Smoke = {
    init: init,
    setLive: setLive
  };
})();
