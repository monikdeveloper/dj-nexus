'use strict';

/**
 * Concert lighting on the hero canvas.
 * Idle: slow beams. Live (music): faster sweeps, bass pulse, strobes.
 * All nodes come from the global DOM object.
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
  var live = false;
  var audioCtx = null;
  var analyser = null;
  var freqData = null;
  var bass = 0;
  var mid = 0;
  var strobe = 0;

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

  function attachAudio(audioEl) {
    if (!audioEl || reduced) return;
    try {
      if (!audioCtx) {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtx = new Ctx();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.72;
        freqData = new Uint8Array(analyser.frequencyBinCount);
        var source = audioCtx.createMediaElementSource(audioEl);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (err) {
      analyser = null;
    }
  }

  function readAudio() {
    bass = 0;
    mid = 0;
    if (!live || !analyser || !freqData) return;
    analyser.getByteFrequencyData(freqData);
    var i;
    var b = 0;
    var m = 0;
    for (i = 0; i < 6; i += 1) b += freqData[i];
    for (i = 6; i < 18; i += 1) m += freqData[i];
    bass = b / (6 * 255);
    mid = m / (12 * 255);
  }

  function drawBeam(x, y, angle, length, beamWidth, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalCompositeOperation = 'lighter';
    var gradient = ctx.createLinearGradient(0, 0, 0, length);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, color.replace(/[\d.]+\)$/, '0.08)'));
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-beamWidth * 0.32, 0);
    ctx.lineTo(beamWidth * 0.32, 0);
    ctx.lineTo(beamWidth * 2.6, length);
    ctx.lineTo(-beamWidth * 2.6, length);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    readAudio();

    var energy = live ? 1.05 + bass * 1.15 + mid * 0.45 : 0.22;
    var pulse = live
      ? 0.72 + Math.sin(time * 7.2) * 0.32 + bass * 0.4
      : 0.7 + Math.sin(time * 1.4) * 0.12;
    var gain = energy * pulse;

    var beams = [
      { x: width * 0.16, y: -36, base: 0.46, color: 'rgba(232,121,249,' + (live ? 0.28 + gain * 0.42 : 0.08 + gain * 0.12) + ')', w: 24 },
      { x: width * 0.5, y: -56, base: 0.06, color: 'rgba(34,211,238,' + (live ? 0.24 + gain * 0.4 : 0.07 + gain * 0.1) + ')', w: 34 },
      { x: width * 0.84, y: -30, base: -0.42, color: 'rgba(232,121,249,' + (live ? 0.26 + gain * 0.38 : 0.07 + gain * 0.1) + ')', w: 22 },
      { x: width * 0.06, y: height * 0.06, base: 1.08, color: 'rgba(34,211,238,' + (live ? 0.16 + gain * 0.24 : 0.04) + ')', w: 16 },
      { x: width * 0.94, y: height * 0.1, base: -1.12, color: 'rgba(192,38,211,' + (live ? 0.18 + gain * 0.26 : 0.04) + ')', w: 14 }
    ];

    if (live) {
      beams.push(
        { x: width * 0.32, y: -20, base: 0.28, color: 'rgba(255,255,255,' + (0.08 + bass * 0.2) + ')', w: 12 },
        { x: width * 0.68, y: -22, base: -0.3, color: 'rgba(255,240,180,' + (0.08 + mid * 0.18) + ')', w: 12 }
      );
    }

    beams.forEach(function (beam, index) {
      var sweepAmt = reduced ? 0 : Math.sin(time * (live ? 2.4 : 1) + index * 0.85) * (live ? 0.38 : 0.22);
      drawBeam(
        beam.x,
        beam.y,
        beam.base + sweepAmt,
        height * (1.05 + bass * 0.12),
        beam.w * gain * (1 + bass * 0.8),
        beam.color
      );
    });

    if (live) {
      ctx.globalCompositeOperation = 'lighter';
      var wash = ctx.createRadialGradient(width * 0.5, height * 0.08, 10, width * 0.5, height * 0.2, height * 0.85);
      wash.addColorStop(0, 'rgba(255,255,255,' + (0.06 + bass * 0.14).toFixed(3) + ')');
      wash.addColorStop(0.45, 'rgba(232,121,249,' + (0.04 + mid * 0.08).toFixed(3) + ')');
      wash.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
    }

    if (live && bass > 0.48) {
      strobe = Math.min(1, strobe + 0.45);
    }
    strobe *= 0.78;
    if (strobe > 0.04) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,255,255,' + (strobe * 0.22).toFixed(3) + ')';
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  function tick() {
    if (!running) return;
    time += live ? 0.018 : 0.0075;
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

  function setLive(next) {
    live = Boolean(next);
    DOM.heroSection.toggleClass('vinyl-live', live);
    if (live && audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
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
    stop: stop,
    setLive: setLive,
    attachAudio: attachAudio
  };
})();
