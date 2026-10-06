/* TOP APP GAMES - 8-bit royal fanfare. Original composition, synthesized live (2 pulse + triangle + noise). */
(function () {
  'use strict';
  var BPM = 84, STEP = 60 / BPM / 4, LOOK = 0.16;
  var CH = { D: [50, 54, 57, 62], G: [55, 59, 62, 67], A: [57, 61, 64, 69], Bm: [47, 50, 54, 59], Em: [52, 55, 59, 64], Fs: [54, 58, 61, 66] };
  var ROOT = { D: 38, G: 43, A: 45, Bm: 35, Em: 40, Fs: 42 };
  var H3 = { D: [62, 66, 69], G: [67, 71, 74], A: [69, 73, 76], Bm: [66, 71, 74], Em: [67, 71, 76], Fs: [66, 70, 73] };
  var _ = -1;
  var INTRO = {
    chords: ['D', 'D'], intro: true,
    lead: [
      [69, _, _, 69, 69, _, _, 69, 69, _, 69, _, 74, _, _, _],
      [78, _, _, _, _, _, _, _, 81, _, _, _, _, _, _, _]
    ]
  };
  var A = {
    chords: ['D', 'G', 'D', 'A', 'D', 'G', 'Em', 'A'],
    lead: [
      [74, _, _, 74, 78, _, _, _, 81, _, _, _, 78, _, 74, _],
      [79, _, _, _, _, _, 78, _, 76, _, _, _, 74, _, _, _],
      [78, _, _, 78, 81, _, _, _, 86, _, _, _, 81, _, 78, _],
      [76, _, _, _, _, _, _, _, 69, _, 73, _, 76, _, 79, _],
      [78, _, _, 78, 81, _, _, _, 86, _, _, 86, 85, _, 83, _],
      [83, _, _, _, _, _, 81, _, 79, _, _, _, 83, _, _, _],
      [81, _, _, _, 79, _, 78, _, 76, _, _, _, 79, _, 78, _],
      [76, _, _, _, _, _, _, _, 73, _, 76, _, 81, _, _, _]
    ]
  };
  var B = {
    chords: ['G', 'A', 'Fs', 'Bm', 'G', 'A', 'D', 'D'], drive: true,
    lead: [
      [83, _, _, _, 81, _, 79, _, 83, _, _, _, 86, _, _, _],
      [85, _, _, _, _, _, 83, _, 81, _, _, _, 76, _, _, _],
      [82, _, _, _, 81, _, 78, _, 82, _, _, _, 85, _, _, _],
      [86, _, _, _, _, _, _, _, 83, _, 81, _, 78, _, 74, _],
      [79, _, _, 79, 83, _, _, _, 86, _, _, _, 91, _, _, _],
      [88, _, _, _, _, _, 86, _, 85, _, _, _, 81, _, 85, _],
      [86, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
      [81, _, 81, _, 81, _, 86, _, 81, _, _, _, 74, _, _, _]
    ]
  };
  var SONG = [INTRO, A, A, B, A];
  var BARS = [];
  SONG.forEach(function (sec, si) { sec.chords.forEach(function (c, b) { BARS.push({ sec: sec, b: b, chord: c, lead: sec.lead[b], last: b === sec.chords.length - 1, si: si }); }); });
  var LOOP_FROM = INTRO.chords.length * 16;
  var ARP = [0, -1, 1, -1, 2, -1, 3, -1, 2, -1, 3, -1, 2, -1, 1, -1];
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
    master = ctx.createGain(); master.gain.value = 0.72;
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.release.value = 0.3;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 8500;
    var dl = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain(), dlp = ctx.createBiquadFilter();
    dl.delayTime.value = STEP * 3; fb.gain.value = 0.28; wet.gain.value = 0.22; dlp.type = 'lowpass'; dlp.frequency.value = 2600;
    vol.connect(master); vol.connect(dl); dl.connect(dlp); dlp.connect(fb); fb.connect(dl); dlp.connect(wet); wet.connect(master);
    master.connect(lp); lp.connect(comp); comp.connect(ctx.destination);
    pulse25 = pulseWave(0.25); pulse125 = pulseWave(0.125); pulse50 = pulseWave(0.5);
  }
  function tone(t, f, dur, g, wave, env) {
    var o = ctx.createOscillator(), a = ctx.createGain();
    if (typeof wave === 'string') o.type = wave; else o.setPeriodicWave(wave);
    o.frequency.value = f;
    if (env && env.vib) { var l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(14, t + 0.35); l.connect(lg); lg.connect(o.detune); l.start(t); l.stop(t + dur + 0.05); }
    if (env && env.det) o.detune.value = env.det;
    var atk = (env && env.atk) || 0.006, rel = (env && env.rel) || 0.03;
    a.gain.setValueAtTime(0.0001, t);
    a.gain.exponentialRampToValueAtTime(g, t + atk);
    a.gain.setValueAtTime(g, t + Math.max(atk, dur - rel));
    a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(a); a.connect(vol); o.start(t); o.stop(t + dur + 0.02);
  }
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
  function timp(t, m, g) { var o = ctx.createOscillator(), a = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(hz(m) * 1.5, t); o.frequency.exponentialRampToValueAtTime(hz(m), t + 0.06); a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); o.connect(a); a.connect(vol); o.start(t); o.stop(t + 0.52); }
  function kick(t) { var o = ctx.createOscillator(), a = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16); a.gain.setValueAtTime(0.55, t); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.26); o.connect(a); a.connect(vol); o.start(t); o.stop(t + 0.28); }
  function snare(t, g) { noise(t, 0.16, g || 0.26, 1500); tone(t, 190, 0.07, 0.16, 'triangle'); }
  function crash(t) { noise(t, 1.3, 0.15, 3500); }
  function schedule(i, t) {
    var bar = BARS[Math.floor(i / 16)], s = i % 16, sec = bar.sec, chord = bar.chord, lead = bar.lead, n = lead[s];
    if (n > 0) {
      var len = 1; while (s + len < 16 && lead[s + len] === -1) len++;
      var dur = STEP * len * 0.94, long = len >= 3;
      tone(t, hz(n), dur, 0.15, pulse25, { vib: long, rel: 0.06 });
      var h = H3[chord], hn = -1;
      for (var k = 0; k < 3; k++) { var c = h[k]; while (c + 12 < n) c += 12; while (c > n - 3) c -= 12; if (c > hn) hn = c; }
      if (sec.intro || long || sec.drive) tone(t, hz(hn), dur, 0.07, pulse50, { vib: long, rel: 0.06, det: 4 });
    }
    var ct = CH[chord];
    if (!sec.intro && ARP[s] >= 0) tone(t, hz(ct[ARP[s]] + 12), STEP * 1.5, 0.04, pulse125);
    if (s === 0) { tone(t, hz(ct[0]), STEP * 16, 0.03, pulse50, { atk: 0.25, rel: 0.4, det: -6 }); tone(t, hz(ct[2]), STEP * 16, 0.026, pulse50, { atk: 0.25, rel: 0.4, det: 6 }); }
    var r = ROOT[chord];
    if (sec.intro) {
      if (s % 4 === 0) tone(t, hz(r), STEP * 3.4, 0.3, 'triangle');
      if (bar.b === 1 && s >= 8) snare(t, 0.08 + (s - 8) * 0.025);
      if (bar.b === 1 && s === 0) timp(t, 38, 0.5);
      if (s === 0 && bar.b === 0) timp(t, 38, 0.45);
      return;
    }
    if (s % 4 === 0) tone(t, hz(s % 8 === 0 ? r : r + 7), STEP * 3.2, 0.32, 'triangle');
    if (sec.drive && s % 4 === 2) tone(t, hz(r + 12), STEP * 1.4, 0.18, 'triangle');
    if (s === 0 || (sec.drive && s === 8)) kick(t);
    if (s === 0) timp(t, r < 40 ? r + 12 : r, 0.34);
    if (s === 4 || s === 12) snare(t);
    if (s === 14 || s === 15) snare(t, 0.12);
    if (bar.last && s >= 8) snare(t, 0.1 + (s - 8) * 0.03);
    if (bar.last && (s === 8 || s === 12)) timp(t, 45, 0.3);
    if (s % 2 === 0) noise(t, s % 8 === 0 ? 0.05 : 0.025, s % 8 === 0 ? 0.07 : 0.035, 7500);
    if (s === 0 && (bar.b === 0 || bar.b === 4)) crash(t);
  }
  function tick() { while (next < ctx.currentTime + LOOK) { schedule(step, next); next += STEP; step++; if (step >= BARS.length * 16) step = LOOP_FROM; } }
  function start() {
    if (!ctx) init();
    if (ctx.state === 'suspended') ctx.resume();
    try { if (!unlock) unlock = silentAudio(); var p = unlock.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    if (timer) return;
    step = 0; next = ctx.currentTime + 0.05;
    vol.gain.cancelScheduledValues(ctx.currentTime); vol.gain.setValueAtTime(0.0001, ctx.currentTime); vol.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 0.8);
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
