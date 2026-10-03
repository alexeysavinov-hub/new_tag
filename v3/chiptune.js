/* TOP APP GAMES - 8-bit epic theme. Original composition, synthesized live (2 pulse + triangle + noise). */
(function () {
  'use strict';
  var BPM = 152, STEP = 60 / BPM / 4, LOOK = 0.14;
  var CH = { Em: [52, 55, 59, 64], C: [48, 52, 55, 60], G: [55, 59, 62, 67], D: [50, 54, 57, 62], B: [47, 51, 54, 59] };
  var ROOT = { Em: 40, C: 36, G: 43, D: 38, B: 35 };
  var A = {
    chords: ['Em', 'C', 'G', 'D', 'Em', 'C', 'D', 'Em'],
    lead: [
      [64, -1, 67, -1, 71, -1, 76, -1, 74, -1, 71, -1, 67, -1, 71, -1],
      [72, -1, 71, -1, 72, -1, 76, -1, 79, -1, -1, -1, 76, -1, 74, -1],
      [71, -1, 74, -1, 79, -1, 74, -1, 71, -1, 67, -1, 71, -1, 74, -1],
      [74, -1, -1, -1, 78, -1, 81, -1, 78, -1, 74, -1, 69, -1, 74, -1],
      [76, -1, -1, -1, 71, -1, 76, -1, 79, -1, 78, -1, 76, -1, 74, -1],
      [72, -1, -1, -1, 67, -1, 72, -1, 76, -1, 74, -1, 72, -1, 71, -1],
      [69, -1, 71, -1, 74, -1, 78, -1, 81, -1, -1, -1, 78, -1, 74, -1],
      [76, -1, -1, -1, -1, -1, -1, -1, 71, -1, 67, -1, 64, -1, -1, -1]
    ]
  };
  var B = {
    chords: ['Em', 'D', 'C', 'D', 'Em', 'D', 'C', 'B'],
    lead: [
      [76, 76, -1, 79, -1, 76, -1, 83, -1, 79, -1, 76, 74, -1, 71, -1],
      [74, 74, -1, 78, -1, 74, -1, 81, -1, 78, -1, 74, 72, -1, 69, -1],
      [72, 72, -1, 76, -1, 72, -1, 79, -1, 76, -1, 72, 71, -1, 67, -1],
      [74, -1, 78, -1, 81, -1, 83, -1, 81, -1, 78, -1, 74, -1, 78, -1],
      [79, -1, -1, -1, 76, -1, -1, -1, 83, -1, -1, -1, 79, -1, 76, -1],
      [78, -1, -1, -1, 74, -1, -1, -1, 81, -1, -1, -1, 78, -1, 74, -1],
      [76, -1, 79, -1, 84, -1, 83, -1, 81, -1, 79, -1, 76, -1, 72, -1],
      [75, -1, 78, -1, 83, -1, -1, -1, -1, -1, -1, -1, 78, -1, 75, -1]
    ]
  };
  var SONG = [A, A, B, B];
  var ARP = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3];
  var ctx, master, vol, comp, pulse25, pulse125, timer, step, next, on = false;
  var hz = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  function pulseWave(d) {
    var n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (var k = 1; k < n; k++) { re[k] = 0; im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * d); }
    return ctx.createPeriodicWave(re, im, { disableNormalization: false });
  }
  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    vol = ctx.createGain(); vol.gain.value = 0;
    master = ctx.createGain(); master.gain.value = 0.8;
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000;
    vol.connect(master); master.connect(lp); lp.connect(comp); comp.connect(ctx.destination);
    pulse25 = pulseWave(0.25); pulse125 = pulseWave(0.125);
  }
  function tone(t, f, dur, g, wave, env) {
    var o = ctx.createOscillator(), a = ctx.createGain();
    if (typeof wave === 'string') o.type = wave; else o.setPeriodicWave(wave);
    o.frequency.value = f;
    if (env && env.vib) { var l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 6; lg.gain.value = 7; l.connect(lg); lg.connect(o.detune); l.start(t + 0.08); l.stop(t + dur + 0.05); }
    if (env && env.slide) { o.frequency.setValueAtTime(env.slide, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.1); }
    a.gain.setValueAtTime(0.0001, t);
    a.gain.exponentialRampToValueAtTime(g, t + 0.006);
    a.gain.setValueAtTime(g, t + Math.max(0.006, dur - 0.025));
    a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(a); a.connect(vol); o.start(t); o.stop(t + dur + 0.02);
  }
  var noiseBuf;
  function noise(t, dur, g, hp) {
    if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var s = ctx.createBufferSource(), a = ctx.createGain(), f = ctx.createBiquadFilter();
    s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
    a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(a); a.connect(vol); s.start(t); s.stop(t + dur + 0.01);
  }
  function kick(t) { var o = ctx.createOscillator(), a = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.11); a.gain.setValueAtTime(0.55, t); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); o.connect(a); a.connect(vol); o.start(t); o.stop(t + 0.18); }
  function snare(t) { noise(t, 0.13, 0.28, 1600); tone(t, 190, 0.07, 0.18, 'triangle'); }
  function hat(t, acc) { noise(t, acc ? 0.05 : 0.025, acc ? 0.11 : 0.06, 6500); }
  function schedule(i, t) {
    var bar = Math.floor(i / 16), s = i % 16, sec = SONG[Math.floor(bar / 8) % SONG.length], b = bar % 8, chord = sec.chords[b];
    var lead = sec.lead[b], n = lead[s];
    if (n > 0) { var len = 1; while (s + len < 16 && lead[s + len] === -1) len++; tone(t, hz(n), STEP * len * 0.92, 0.17, pulse25, { vib: len > 2 }); }
    var ct = CH[chord]; tone(t, hz(ct[ARP[s]]), STEP * 0.8, 0.065, pulse125);
    var r = ROOT[chord]; tone(t, hz(s % 2 ? r + 12 : r), STEP * 0.85, 0.3, 'triangle');
    if (s === 0 || s === 8 || (s === 6 && b % 2) || (s === 11 && b % 4 === 3)) kick(t);
    if (s === 4 || s === 12 || (b === 7 && s === 14)) snare(t);
    hat(t, s % 4 === 0);
    if (b === 7 && s >= 12 && sec === B) noise(t, 0.08, 0.14, 2500);
  }
  function tick() { while (next < ctx.currentTime + LOOK) { schedule(step, next); next += STEP; step = (step + 1) % (16 * 8 * SONG.length); } }
  function start() {
    if (!ctx) init();
    if (ctx.state === 'suspended') ctx.resume();
    if (timer) return;
    step = 0; next = ctx.currentTime + 0.05;
    vol.gain.cancelScheduledValues(ctx.currentTime); vol.gain.setValueAtTime(0.0001, ctx.currentTime); vol.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 0.8);
    timer = setInterval(tick, 25);
  }
  function stop() {
    if (!ctx || !timer) return;
    clearInterval(timer); timer = null;
    vol.gain.cancelScheduledValues(ctx.currentTime); vol.gain.setValueAtTime(vol.gain.value, ctx.currentTime); vol.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    setTimeout(function () { if (!timer && ctx.state === 'running') ctx.suspend(); }, 600);
  }
  window.TAGChiptune = {
    toggle: function () { on = !on; if (on) start(); else stop(); return on; },
    set: function (v) { if (v !== on) this.toggle(); return on; },
    get playing() { return on; }
  };
  document.addEventListener('visibilitychange', function () { if (!ctx || !on) return; if (document.hidden) { ctx.suspend(); } else { ctx.resume(); next = Math.max(next, ctx.currentTime + 0.05); } });
})();
