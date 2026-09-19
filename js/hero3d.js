'use strict';

/**
 * Hero vinyl deck: click to drop the needle, spin the platter, and play Afterglow.
 * All nodes come from the global DOM object.
 */
(function () {
  var playing = false;
  var reduced = false;
  var angle = 0;
  var velocity = 0;
  var lastTime = 0;
  var rafId = 0;
  var maxVelocity = 360 / 1800;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function audioEl() {
    return DOM.vinylAudio.length ? DOM.vinylAudio.get(0) : null;
  }

  function setHint(text) {
    if (DOM.vinylHint.length) DOM.vinylHint.text(text);
  }

  function applyAngle() {
    if (!DOM.vinylDisc.length) return;
    DOM.vinylDisc.get(0).style.transform = 'rotate(' + angle.toFixed(2) + 'deg)';
  }

  function tick(now) {
    if (!lastTime) lastTime = now;
    var dt = Math.min(now - lastTime, 40);
    lastTime = now;

    var target = playing && !reduced ? maxVelocity : 0;
    var ease = playing ? 0.045 : 0.028;
    velocity += (target - velocity) * ease;
    if (Math.abs(velocity) < 0.00008) velocity = 0;

    angle = (angle + velocity * dt) % 360;
    applyAngle();

    if (playing || velocity > 0) {
      rafId = window.requestAnimationFrame(tick);
    } else {
      rafId = 0;
      lastTime = 0;
    }
  }

  function startSpin() {
    if (rafId || reduced) return;
    lastTime = 0;
    rafId = window.requestAnimationFrame(tick);
  }

  function stopMixes() {
    DOM.mixPlayBtns.each(function () {
      var btn = $(this);
      var audio = btn.closest('.mix-card').find('audio').get(0);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      btn.attr('aria-pressed', 'false').find('.mix-play-label').text('Play');
      btn.closest('.mix-card').removeClass('is-playing');
    });
  }

  function playSong() {
    var el = audioEl();
    if (!el) return;
    var playPromise = el.play();
    if (playPromise && playPromise.then) {
      playPromise.then(function () {
        if (window.Lighting && Lighting.attachAudio) Lighting.attachAudio(el);
      }).catch(function () {
        setPlaying(false, true);
      });
    } else if (window.Lighting && Lighting.attachAudio) {
      Lighting.attachAudio(el);
    }
  }

  function pauseSong(reset) {
    var el = audioEl();
    if (!el) return;
    el.pause();
    if (reset) el.currentTime = 0;
  }

  function setPlaying(next, fromAudioError) {
    playing = next;
    DOM.vinylDeck.toggleClass('is-playing', playing);
    DOM.vinylDeck.attr('aria-pressed', playing ? 'true' : 'false');
    DOM.vinylDeck.attr(
      'aria-label',
      playing ? 'Pause Afterglow' : 'Play Afterglow'
    );
    DOM.heroWaveform.toggleClass('is-playing', playing);
    DOM.heroSection.toggleClass('vinyl-live', playing);

    if (window.Smoke && Smoke.setLive) Smoke.setLive(playing);
    if (window.Lighting && Lighting.setLive) Lighting.setLive(playing);

    if (playing) {
      setHint('Afterglow — playing');
      stopMixes();
      playSong();
      if (!reduced) startSpin();
    } else {
      setHint('Afterglow — click to play');
      if (!fromAudioError) pauseSong(false);
      if (!reduced) startSpin();
    }
  }

  function toggle(event) {
    if (event) event.preventDefault();
    setPlaying(!playing);
  }

  function onEnded() {
    pauseSong(true);
    setPlaying(false, true);
  }

  function init() {
    if (!DOM.vinylDeck.length || !DOM.vinylDisc.length) return;

    reduced = prefersReducedMotion();
    if (reduced) {
      DOM.heroSection.addClass('is-reduced-3d');
      setHint('Afterglow — click to play');
    }

    DOM.vinylDeck.on('click', toggle);
    if (DOM.vinylAudio.length) {
      DOM.vinylAudio.on('ended', onEnded);
    }

    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (event) {
      reduced = event.matches;
      DOM.heroSection.toggleClass('is-reduced-3d', reduced);
      if (reduced) {
        velocity = 0;
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
      } else if (playing) {
        startSpin();
      }
    });
  }

  window.Hero3D = {
    init: init,
    stop: function () {
      if (playing) setPlaying(false);
    }
  };
})();
