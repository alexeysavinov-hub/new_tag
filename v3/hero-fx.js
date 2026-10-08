// Hero FX: confetti burst + ambient gold, magic sparkles from the sorceress staff
(function () {
  'use strict';
  var cv = document.getElementById('hs-fx'), par = document.querySelector('.hs-par-fg'), hero = document.querySelector('.hero');
  if (!cv || !par || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var ctx = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 1.5), W = 0, H = 0, ox = 0, oy = 0, pw = 0, ph = 0;
  var mob = matchMedia('(max-width:700px)').matches, AMB = mob ? 14 : 34;
  var GOLD = ['#FFD36A', '#F2B33D', '#FFE9A8', '#E79A1F', '#FFF4CF'], ACC = ['#FF6FB1', '#6FE3FF', '#B98CFF'];
  var conf = [], spk = [], run = false, vis = true, last = 0, ambT = 0, spT = 0, t0 = 0;

  var glow = document.createElement('canvas'); glow.width = glow.height = 32;
  (function () { var g = glow.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(200,240,255,.85)'); r.addColorStop(1, 'rgba(120,200,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); })();

  function size() {
    var r = cv.getBoundingClientRect(), p = par.getBoundingClientRect();
    W = r.width; H = r.height; ox = p.left - r.left; oy = p.top - r.top; pw = p.width; ph = p.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function at(px, py) { return [ox + pw * px, oy + ph * py]; }
  function piece(x, y, vx, vy) {
    var acc = Math.random() < .14;
    return { x: x, y: y, vx: vx, vy: vy, w: 6 + Math.random() * 7, h: 3 + Math.random() * 4, a: Math.random() * 6.28, va: (Math.random() - .5) * .25, f: Math.random() * 6.28, vf: .08 + Math.random() * .14, sw: Math.random() * 6.28, c: (acc ? ACC : GOLD)[Math.floor(Math.random() * (acc ? 3 : 5))], life: 0 };
  }
  function burst() {
    var o = at(.56, .1), n = mob ? 50 : 110;
    for (var i = 0; i < n; i++) { var ang = -Math.PI / 2 + (Math.random() - .5) * 2.2, sp = 6 + Math.random() * 9; conf.push(piece(o[0], o[1], Math.cos(ang) * sp, Math.sin(ang) * sp)); }
  }
  function amb() { if (conf.length < AMB + 10) conf.push(piece(W * (.34 + Math.random() * .7), -20, (Math.random() - .5) * .6, 1 + Math.random() * 1.2)); }
  function spark() {
    var o = at(.421, .352);
    spk.push({ x: o[0] + (Math.random() - .5) * 8, y: o[1], vx: (Math.random() - .5) * 2.2, vy: -2.4 - Math.random() * 2.6, l: 0, m: 50 + Math.random() * 40, s: 4 + Math.random() * 8 });
  }

  function frame(t) {
    if (!run) return;
    var dt = Math.min(2.5, (t - (last || t)) / 16.67); last = t;
    if (t - t0 > 2600) { ambT += dt; if (ambT > (mob ? 40 : 20)) { ambT = 0; amb(); } }
    if (t - t0 > 1400) { spT += dt; while (spT > 2.2) { spT -= 2.2; spark(); } }
    ctx.clearRect(0, 0, W, H);
    for (var i = conf.length - 1; i >= 0; i--) {
      var p = conf[i]; p.life += dt;
      p.vx *= Math.pow(.985, dt); p.vy = p.vy * Math.pow(.985, dt) + .12 * dt; if (p.vy > 2.6) p.vy = 2.6;
      p.sw += .04 * dt; p.x += (p.vx + Math.sin(p.sw) * .7) * dt; p.y += p.vy * dt; p.a += p.va * dt; p.f += p.vf * dt;
      if (p.y > H + 30) { conf.splice(i, 1); continue; }
      var fl = Math.cos(p.f);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.scale(1, fl);
      ctx.fillStyle = p.c; ctx.globalAlpha = .92; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      if (fl > .6) { ctx.globalAlpha = .5; ctx.fillStyle = '#fff'; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * .35); }
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'lighter';
    for (var j = spk.length - 1; j >= 0; j--) {
      var s = spk[j]; s.l += dt; if (s.l > s.m) { spk.splice(j, 1); continue; }
      s.vy += .06 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      var k = s.l / s.m, a = k < .15 ? k / .15 : 1 - (k - .15) / .85, z = s.s * (1 - k * .5);
      ctx.globalAlpha = a; ctx.drawImage(glow, s.x - z, s.y - z, z * 2, z * 2);
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  function play() { if (run || !vis || document.hidden) return; run = true; last = 0; requestAnimationFrame(frame); }
  function stop() { run = false; }

  size();
  var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(size, 120); }, { passive: true });
  new IntersectionObserver(function (e) { vis = e[0].isIntersecting; vis ? play() : stop(); }).observe(hero);
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : play(); });
  t0 = performance.now();
  setTimeout(function () { size(); burst(); }, 1150);
  play();
})();
