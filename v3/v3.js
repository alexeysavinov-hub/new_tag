// TOP APP GAMES v3 - behaviour
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* nav state */
  var nav = document.querySelector('.nav');
  var onScroll = function () { nav.classList.toggle('solid', window.scrollY > 24); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* mobile menu */
  var burger = document.querySelector('.burger');
  burger.addEventListener('click', function () {
    var open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('.menu a').forEach(function (a) {
    a.addEventListener('click', function () { document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); });
  });

  /* reveal on scroll */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

  /* active nav link */
  var links = Array.prototype.slice.call(document.querySelectorAll('[data-navlink]'));
  var so = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('section[id], header[id]').forEach(function (s) { so.observe(s); });

  /* hero loop: fade the video in once it plays; pause when offscreen */
  var lite = window.matchMedia('(max-width:767px)').matches || (navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || '')));
  function loopVid(hv) {
    if (reduced || lite) { hv.remove(); return; }
    hv.src = hv.getAttribute('data-src'); hv.preload = 'auto';
    hv.addEventListener('playing', function () { hv.classList.add('on'); }, { once: true });
    hv.addEventListener('error', function () { hv.remove(); });
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { hv.play().catch(function () {}); } else { hv.pause(); } });
    }, { threshold: 0.05 }).observe(hv);
  }
  Array.prototype.forEach.call(document.querySelectorAll('.hero-vid,.g-vid,.mlogo-fx'), loopVid);

  /* marquees: clone children once for a seamless loop */
  document.querySelectorAll('[data-marquee]').forEach(function (track) {
    Array.prototype.slice.call(track.children).forEach(function (k) {
      var c = k.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c);
    });
  });

  /* character select */
  var tiles = Array.prototype.slice.call(document.querySelectorAll('.rt'));
  var rp = document.querySelector('.rp');
  function pick(t) {
    tiles.forEach(function (x) { x.setAttribute('aria-pressed', String(x === t)); });
    var d = t.dataset;
    var img = rp.querySelector('.rp-img'); img.src = d.img; img.alt = d.name;
    rp.querySelector('.rp-name').textContent = d.name;
    rp.querySelector('.rp-tag').textContent = d.role;
    rp.querySelector('.rp-bio').textContent = d.bio;
    var li = rp.querySelector('.rp-li');
    if (d.li) { li.href = d.li; li.hidden = false; } else { li.hidden = true; }
    var xp = rp.querySelector('.rp-xp');
    if (d.xp) { xp.hidden = false; xp.querySelector('b').style.width = Math.min(100, d.xp / 25 * 100) + '%'; xp.querySelector('em').textContent = d.xp + ' yrs'; }
    else { xp.hidden = true; }
    if (!reduced) { rp.classList.remove('swap'); void rp.offsetWidth; rp.classList.add('swap'); }
  }
  tiles.forEach(function (t) { t.addEventListener('click', function () { pick(t); }); });
  var grid = document.querySelector('.rgrid');
  grid.addEventListener('keydown', function (e) {
    var i = tiles.indexOf(document.activeElement);
    if (i < 0 || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    e.preventDefault();
    var n = tiles[(i + (e.key === 'ArrowRight' ? 1 : tiles.length - 1)) % tiles.length];
    n.focus(); pick(n);
  });

  /* Title No.3 - looping retro loader */
  var bar = document.querySelector('.ld-bar b');
  var pct = document.querySelector('.ld-text i');
  if (bar && pct) {
    if (reduced) { bar.style.width = '73%'; pct.textContent = '73%'; }
    else {
      var DUR = 8000, last = -1;
      var frame = function (t) {
        var ph = (t % DUR) / DUR, p;
        if (ph < 0.5) p = ph / 0.5 * 78;
        else if (ph < 0.88) p = 78 + (ph - 0.5) / 0.38 * 21;
        else p = 99;
        p = Math.floor(p);
        if (p !== last) { last = p; bar.style.width = p + '%'; pct.textContent = p + '%'; }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }
  }

  /* mascot eyes follow the cursor (idle look-around when it is still) */
  var mas = document.querySelector('.cmascot');
  if (mas && !reduced) {
    var pl = mas.querySelector('.pupil-l'), pr = mas.querySelector('.pupil-r');
    var tx = 0, ty = 0, cx = 0, cy = 0, eyesOn = false, eraf = 0, lastMove = 0, idleT = 0;
    var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    var step = function () {
      cx += (tx - cx) * 0.14; cy += (ty - cy) * 0.14;
      pr.style.setProperty('--px', cx.toFixed(2) + 'px'); pr.style.setProperty('--py', cy.toFixed(2) + 'px');
      pl.style.setProperty('--px', (cx * 0.55).toFixed(2) + 'px'); pl.style.setProperty('--py', Math.min(cy * 0.4, mas.offsetWidth * 0.003).toFixed(2) + 'px');
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) eraf = requestAnimationFrame(step); else eraf = 0;
    };
    var kick = function () { if (!eraf) eraf = requestAnimationFrame(step); };
    var lookAt = function (x, y) {
      var r = pr.getBoundingClientRect();
      var ex = r.left + r.width / 2 - cx, ey = r.top + r.height / 2 - cy;
      var dx = x - ex, dy = y - ey, d = Math.hypot(dx, dy) || 1;
      var range = mas.offsetWidth * 0.016, k = Math.min(1, d / 240);
      tx = dx / d * k * range; ty = dy / d * k * range * 0.8; kick();
    };
    var wander = function () {
      var a = Math.random() * Math.PI * 2, range = mas.offsetWidth * 0.013 * (0.4 + Math.random() * 0.6);
      tx = Math.cos(a) * range; ty = Math.sin(a) * range * 0.7; kick();
    };
    if (fine) document.addEventListener('pointermove', function (e) { if (!eyesOn) return; lastMove = Date.now(); lookAt(e.clientX, e.clientY); });
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        eyesOn = e.isIntersecting;
        clearInterval(idleT);
        if (eyesOn) idleT = setInterval(function () { if (Date.now() - lastMove > 2500) wander(); }, 1800);
        else { tx = ty = 0; kick(); }
      });
    }, { threshold: 0.2 }).observe(mas);
  }

  /* contact form (Web3Forms) */
  var form = document.querySelector('.form');
  var ENDPOINT = 'https://api.web3forms.com/submit';
  var KEY = '6756f6e3-d77c-425b-81d7-dc29d43e9e7f';
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (form.classList.contains('sending')) return;
    var ok = true;
    [['name', function (v) { return v.trim().length > 1; }],
     ['email', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }],
     ['message', function (v) { return v.trim().length > 4; }]
    ].forEach(function (pair) {
      var f = form.querySelector('[name="' + pair[0] + '"]');
      var valid = pair[1](f.value);
      f.closest('.field').classList.toggle('err', !valid);
      if (!valid) ok = false;
    });
    if (!ok) return;
    var btn = form.querySelector('.gbtn'), label = btn.textContent;
    form.classList.add('sending'); btn.textContent = 'Sending\u2026';
    var fail = form.querySelector('.form-fail'); if (fail) fail.remove();
    fetch(ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: KEY,
        name: form.querySelector('[name="name"]').value.trim(),
        email: form.querySelector('[name="email"]').value.trim(),
        message: form.querySelector('[name="message"]').value.trim(),
        subject: 'New message from topapp.games website'
      })
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function () { form.classList.add('sent'); })
      .catch(function () {
        var p = document.createElement('p'); p.className = 'form-fail';
        p.innerHTML = 'Couldn\u2019t send right now \u2014 please email us at <a href="mailto:info@topapp.games">info@topapp.games</a>.';
        btn.insertAdjacentElement('afterend', p);
      })
      .finally(function () { form.classList.remove('sending'); btn.textContent = label; });
  });
  form.querySelectorAll('input, textarea').forEach(function (f) {
    f.addEventListener('input', function () { f.closest('.field').classList.remove('err'); });
  });
})();
