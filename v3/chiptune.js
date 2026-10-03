/* TOP APP GAMES - 8-bit epic theme. Original composition, synthesized live (2 pulse + triangle + noise). */
(function () {
  'use strict';
  var BPM = 96, STEP = 60 / BPM / 4, LOOK = 0.16;
  var CH = { Em: [52, 55, 59, 64], C: [48, 52, 55, 60], G: [55, 59, 62, 67], D: [50, 54, 57, 62], B: [47, 51, 54, 59], Am: [45, 48, 52, 57] };
  var ROOT = { Em: 40, C: 36, G: 43, D: 38, B: 35, Am: 33 };
  var A = {
    chords: ['Em', 'C', 'G', 'D', 'Em', 'C', 'D', 'B'],
    lead: [
      [64, -1, -1, -1, -1, -1, 67, -1, 71, -1, -1, -1, 76, -1, -1, -1],
      [74, -1, -1, -1, 72, -1, 71, -1, 72, -1, -1, -1, -1, -1, -1, -1],
      [71, -1, -1, -1, -1, -1, 74, -1, 79, -1, -1, -1, -1, -1, -1, -1],
      [78, -1, -1, -1, 76, -1, 74, -1, 69, -1, -1, -1, 74, -1, -1, -1],
      [76, -1, -1, -1, -1, -1, 78, -1, 79, -1, -1, -1, 83, -1, -1, -1],
      [81, -1, -1, -1, 79, -1, 76, -1, 72, -1, -1, -1, -1, -1, -1, -1],
      [74, -1, -1, -1, 78, -1, -1, -1, 81, -1, -1, -1, 78, -1, 74, -1],
      [75, -1, -1, -1, -1, -1, -1, -1, 78, -1, -1, -1, 71, -1, -1, -1]
    ]
  };
  var B = {
    chords: ['Am', 'Em', 'C', 'B', 'Am', 'Em', 'D', 'Em'],
    lead: [
      [69, -1, 72, -1, 76, -1, -1, -1, 81, -1, -1, -1, 79, -1, -1, -1],
      [76, -1, -1, -1, -1, -1, -1, -1, 79, -1, -1, -1, 83, -1, -1, -1],
      [84, -1, -1, -1, 83, -1, 81, -1, 79, -1, -1, -1, 76, -1, -1, -1],
      [78, -1, -1, -1, 75, -1, -1, -1, 71, -1, -1, -1, -1, -1, -1, -1],
      [69, -1, 72, -1, 76, -1, -1, -1, 81, -1, -1, -1, 83, -1, -1, -1],
      [83, -1, -1, -1, -1, -1, 79, -1, 76, -1, -1, -1, -1, -1, -1, -1],
      [78, -1, -1, -1, 81, -1, -1, -1, 86, -1, -1, -1, 81, -1, 78, -1],
      [76, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
    ]
  };
  var SONG = [A, A, B, B];
  var ARP = [0, -1, 1, -1, 2, -1, 3, -1, 2, -1, 1, -1, 0, -1, 1, -1];
  var GALLOP = { 0: 0, 3: 0, 6: 12, 8: 0, 11: 0, 14: 12 };
  var ctx, master, vol, comp, pulse25, pulse125, pulse50, timer, step, next, on = false;
  var hz = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  function pulseWave(d) {
    var n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (var k = 1; k < n; k++) { im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * d); }
    return ctx.createPeriodicWave(re, im);
  }
  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    vol = ctx.createGain(); vol.gain.value = 0;
    master = ctx.createGain(); master.gain.value = 0.75;
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.release.value = 0.3;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 8500;
    vol.connect(master); master.connect(lp); lp.connect(comp); comp.connect(ctx.destination);
    pulse25 = pulseWave(0.25); pulse125 = pulseWave(0.125); pulse50 = pulseWave(0.5);
  }
  function tone(t, f, dur, g, wave, env) {
    var o = ctx.createOscillator(), a = ctx.createGain();
    if (typeof wave === 'string') o.type = wave; else o.setPeriodicWave(wave);
    o.frequency.value = f;
    if (env && env.vib) { var l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.5; lg.gain.value = 9; l.connect(lg); lg.connect(o.detune); l.start(t + 0.15); l.stop(t + dur + 0.05); }
    if (env && env.det) o.detune.value = env.det;
    var atk = (env && env.atk) || 0.006, rel = (env && env.rel) || 0.03;
    a.gain.setValueAtTime(0.0001, t);
    a.gain.exponentialRampToValueAtTime(g, t + atk);
    a.gain.setValueAtTime(g, t + Math.max(atk, dur - rel));
    a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(a); a.connect(vol); o.start(t); o.stop(t + dur + 0.02);
  }
  /* iOS: Web Audio obeys the ring/silent switch unless an <audio> element is playing - loop a silent WAV to switch the session to playback */
  var unlock;
  function silentAudio() {
    var sr = 8000, n = sr, buf = new ArrayBuffer(44 + n), v = new DataView(buf), w = function (o, str) { for (var i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
    for (var i = 0; i < n; i++) v.setUint8(44 + i, 128);
    var a = document.createElement('audio'); a.src = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' })); a.loop = true; a.setAttribute('playsinline', ''); a.preload = 'auto'; return a;
  }
  var noiseBuf;
  function noise(t, dur, g, hp) {
    if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var s = ctx.createBufferSource(), a = ctx.createGain(), f = ctx.createBiquadFilter();
    s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
    a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(a); a.connect(vol); s.start(t); s.stop(t + dur + 0.01);
  }
  function kick(t) { var o = ctx.createOscillator(), a = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.14); a.gain.setValueAtTime(0.6, t); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(a); a.connect(vol); o.start(t); o.stop(t + 0.24); }
  function snare(t) { noise(t, 0.18, 0.3, 1400); tone(t, 180, 0.09, 0.2, 'triangle'); }
  function tom(t, f) { tone(t, f, 0.16, 0.3, 'triangle', { slide: 0 }); var o = ctx.createOscillator(), a = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(f * 1.4, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.08); a.gain.setValueAtTime(0.28, t); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(a); a.connect(vol); o.start(t); o.stop(t + 0.2); }
  function hat(t, acc) { noise(t, acc ? 0.06 : 0.03, acc ? 0.09 : 0.045, 7000); }
  function crash(t) { noise(t, 0.9, 0.16, 3500); }
  function schedule(i, t) {
    var bar = Math.floor(i / 16), s = i % 16, si = Math.floor(bar / 8) % SONG.length, sec = SONG[si], b = bar % 8, chord = sec.chords[b];
    var lead = sec.lead[b], n = lead[s];
    if (n > 0) {
      var len = 1; while (s + len < 16 && lead[s + len] === -1) len++;
      var dur = STEP * len * 0.95;
      tone(t, hz(n), dur, 0.16, pulse25, { vib: len >= 3, rel: 0.06 });
      tone(t + STEP * 3, hz(n), Math.min(dur, STEP * 3), 0.05, pulse25, { rel: 0.06 });
    }
    var ct = CH[chord];
    if (ARP[s] >= 0) tone(t, hz(ct[ARP[s]] + 12), STEP * 1.6, 0.05, pulse125);
    if (s === 0) { tone(t, hz(ct[0]), STEP * 16, 0.035, pulse50, { atk: 0.3, rel: 0.4, det: -6 }); tone(t, hz(ct[2]), STEP * 16, 0.03, pulse50, { atk: 0.3, rel: 0.4, det: 6 }); }
    if (GALLOP[s] !== undefined) { var r = ROOT[chord] + GALLOP[s]; tone(t, hz(r), STEP * (s === 3 || s === 11 ? 2.6 : 1.6), 0.32, 'triangle'); }
    if (s === 0 || s === 10) kick(t);
    if (s === 8) snare(t);
    if (b === 7 && s >= 12) tom(t, [220, 180, 150, 110][s - 12]);
    if (s % 2 === 0) hat(t, s % 8 === 0);
    if (s === 0 && b === 0) crash(t);
    if (s === 0 && b === 4 && si >= 2) crash(t);
  }
  function tick() { while (next < ctx.currentTime + LOOK) { schedule(step, next); next += STEP; step = (step + 1) % (16 * 8 * SONG.length); } }
  function start() {
    if (!ctx) init();
    if (ctx.state === 'suspended') ctx.resume();
    try { if (!unlock) unlock = silentAudio(); var p = unlock.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    if (timer) return;
    step = 0; next = ctx.currentTime + 0.05;
    vol.gain.cancelScheduledValues(ctx.currentTime); vol.gain.setValueAtTime(0.0001, ctx.currentTime); vol.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.2);
    timer = setInterval(tick, 30);
  }
  function stop() {
    if (!ctx || !timer) return;
    clearInterval(timer); timer = null;
    if (unlock) unlock.pause();
    vol.gain.cancelScheduledValues(ctx.currentTime); vol.gain.setValueAtTime(Math.max(vol.gain.value, 0.0001), ctx.currentTime); vol.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
    setTimeout(function () { if (!timer && ctx.state === 'running') ctx.suspend(); }, 800);
  }
  window.TAGChiptune = {
    toggle: function () { on = !on; if (on) start(); else stop(); return on; },
    set: function (v) { if (v !== on) this.toggle(); return on; },
    get playing() { return on; }
  };
  document.addEventListener('visibilitychange', function () { if (!ctx || !on) return; if (document.hidden) { ctx.suspend(); } else { ctx.resume(); if (unlock) { var p = unlock.play(); if (p && p.catch) p.catch(function () {}); } next = Math.max(next, ctx.currentTime + 0.05); } });
})();
