/* Swayam Jain — portfolio behaviour. No frameworks. */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const isPhone = () => innerWidth <= 809;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ------------------------------------------------------------
     Smooth scroll (wheel lerp, like the Framer smooth-scroll)
     ------------------------------------------------------------ */
  const smooth = (() => {
    const enabled = !coarse && !reduceMotion;
    let target = scrollY, current = scrollY, raf = null, lastT = 0;
    const max = () => document.documentElement.scrollHeight - innerHeight;
    function step(now) {
      // Frame-rate independent lerp (0.1 per 60fps frame).
      const dt = lastT ? Math.min(100, now - lastT) : 16.7;
      lastT = now;
      const k = 1 - Math.pow(0.9, dt / 16.7);
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.5) current = target;
      scrollTo(0, current);
      if (Math.abs(target - current) >= 0.5) raf = requestAnimationFrame(step); else { raf = null; lastT = 0; }
    }
    function go(y) {
      target = clamp(y, 0, max());
      if (!enabled) { scrollTo({ top: target, behavior: reduceMotion ? 'auto' : 'smooth' }); return; }
      if (!raf) raf = requestAnimationFrame(step);
    }
    if (enabled) {
      addEventListener('wheel', (e) => {
        if (e.ctrlKey) return;
        if (document.body.classList.contains('is-loading') || document.body.classList.contains('menu-open')) { e.preventDefault(); return; }
        e.preventDefault();
        const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
        target = clamp(target + d, 0, max());
        if (!raf) raf = requestAnimationFrame(step);
      }, { passive: false });
      addEventListener('scroll', () => {
        // Someone else moved the page (scrollbar, keyboard, anchor): resync.
        if (Math.abs(scrollY - current) > 1.5) { target = current = scrollY; }
      }, { passive: true });
    }
    return { go };
  })();

  // Anchor links
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      closeMenu();
      smooth.go(el.getBoundingClientRect().top + scrollY);
    });
  });

  /* ------------------------------------------------------------
     Clock (IST)
     ------------------------------------------------------------ */
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
  function tick() { const t = fmt.format(new Date()); $$('[data-clock]').forEach((e) => (e.textContent = t + ' IST')); }
  tick(); setInterval(tick, 15000);

  /* ------------------------------------------------------------
     Text scramble (decode effect on mono labels)
     ------------------------------------------------------------ */
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!<>-_\\/[]{}=+*^?#%;:$@';
  function scramble(el, duration = 1100) {
    if (reduceMotion) return;
    if (el.__scrambling) return;
    const text = el.dataset.text || (el.dataset.text = el.textContent);
    const n = text.length;
    const offsets = Array.from({ length: n }, () => Math.random() * 0.5);
    const t0 = performance.now();
    el.__scrambling = true;
    let last = 0;
    function frame(now) {
      const p = (now - t0) / duration;
      if (now - last > 40) {
        last = now;
        let out = '';
        for (let i = 0; i < n; i++) {
          const c = text[i];
          if (c === ' ' || c === '\n') { out += c; continue; }
          const local = (p * 1.4 - (i / n) * 0.55) - offsets[i] * 0.4;
          out += local >= 0.45 ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        el.textContent = out;
      }
      if (p < 1) requestAnimationFrame(frame); else { el.textContent = text; el.__scrambling = false; }
    }
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------
     Split helpers
     ------------------------------------------------------------ */
  function splitLetters(container) {
    // Wrap every character of every leaf text node in a .ch span.
    let i = 0;
    $$('.display, .script', container).forEach((seg) => {
      const text = seg.textContent;
      seg.textContent = '';
      for (const c of text) {
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = c;
        s.style.setProperty('--i', i++);
        seg.appendChild(s);
      }
    });
  }
  function splitFill(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    const letters = [];
    words.forEach((w, wi) => {
      const ws = document.createElement('span');
      ws.className = 'w';
      for (const c of w) { const l = document.createElement('span'); l.className = 'l'; l.textContent = c; ws.appendChild(l); letters.push(l); }
      el.appendChild(ws);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    el.__letters = letters;
  }

  $$('[data-reveal]').forEach(splitLetters);
  $$('[data-fill]').forEach(splitFill);

  /* ------------------------------------------------------------
     Observers: appear / reveal / scramble
     ------------------------------------------------------------ */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('is-in');
      if (el.hasAttribute('data-scramble')) scramble(el);
      $$('[data-scramble]', el).forEach((s, i) => setTimeout(() => scramble(s), i * 60));
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  function observeAll() {
    $$('[data-appear], [data-reveal], [data-fill]').forEach((el) => io.observe(el));
    // Scramble labels that are not inside an appear block
    $$('[data-scramble]').forEach((el) => { if (!el.closest('[data-appear], [data-hero]')) io.observe(el); });
  }

  /* ------------------------------------------------------------
     Letter fill on scroll
     ------------------------------------------------------------ */
  const fills = $$('[data-fill]');
  function updateFills() {
    const vh = innerHeight;
    fills.forEach((el) => {
      const top = el.getBoundingClientRect().top;
      const p = clamp((vh * 0.8 - top) / (vh * 0.6), 0, 1);
      const n = el.__letters.length, k = Math.round(p * n);
      if (el.__k === k) return;
      el.__k = k;
      el.__letters.forEach((l, i) => l.classList.toggle('on', i < k));
    });
  }

  /* ------------------------------------------------------------
     Theme flip: each section flips to its own theme when its top
     crosses the middle of the viewport, taking the previous section
     with it (exactly like the original's scroll variants).
     ------------------------------------------------------------ */
  const flips = $$('[data-own]').map((el) => ({ el, own: el.dataset.own }));
  let lastThemes = '';
  function updateTheme() {
    const mid = innerHeight / 2;
    let cur = -1;
    flips.forEach((f, i) => { if (f.el.getBoundingClientRect().top <= mid) cur = i; });
    const themes = flips.map((f, i) => {
      if (cur < 0) return i === 0 ? 'light' : flips[i - 1].own;
      if (i < cur) return flips[i + 1].own;
      if (i === cur) return f.own;
      return flips[i - 1].own;
    });
    const key = themes.join();
    if (key === lastThemes) return;
    lastThemes = key;
    themes.forEach((t, i) => { flips[i].el.dataset.theme = t; });
    document.body.style.background = themes[themes.length - 1] === 'dark' ? '#000' : '#fff';
    schedulePortrait();
  }

  /* ------------------------------------------------------------
     Nav: hides once you leave the hero
     ------------------------------------------------------------ */
  const nav = $('#nav');
  function updateNav() { nav.classList.toggle('is-hidden', scrollY > innerHeight * 0.9); }

  let rafScroll = null;
  function onScroll() {
    if (rafScroll) return;
    rafScroll = requestAnimationFrame(() => { rafScroll = null; updateFills(); updateTheme(); updateNav(); });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  /* ------------------------------------------------------------
     Phone menu
     ------------------------------------------------------------ */
  const burger = $('#burger'), menu = $('#menu');
  function closeMenu() {
    if (!menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open'); document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true');
  }
  burger.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open); document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-hidden', String(!open));
    if (open) $$('.menu__links .mono').forEach((s, i) => setTimeout(() => scramble(s, 800), i * 80));
  });

  /* ------------------------------------------------------------
     Cursor label ("VIEW LIVE", "SAY HELLO", ...)
     ------------------------------------------------------------ */
  const pill = $('#cursorPill');
  if (!coarse) {
    let mx = -200, my = -200, px = -200, py = -200, active = false, rafPill = null, lastP = 0;
    function loop(now) {
      const dt = lastP ? Math.min(100, now - lastP) : 16.7; lastP = now;
      const k = 1 - Math.pow(0.72, dt / 16.7);
      px += (mx + 12 - px) * k; py += (my - 32 - py) * k;
      pill.style.transform = `translate(${px}px, ${py}px)`;
      if (active || Math.abs(mx + 12 - px) > 0.5) rafPill = requestAnimationFrame(loop); else { rafPill = null; lastP = 0; }
    }
    addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; if (!rafPill) rafPill = requestAnimationFrame(loop); }, { passive: true });
    $$('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        pill.textContent = el.dataset.cursor;
        const sec = el.closest('[data-theme]');
        pill.classList.toggle('is-dark', !!sec && sec.dataset.theme === 'dark');
        pill.classList.add('is-on'); active = true;
        if (!rafPill) rafPill = requestAnimationFrame(loop);
      });
      el.addEventListener('mouseleave', () => { pill.classList.remove('is-on'); active = false; });
    });
  }

  /* ------------------------------------------------------------
     Work: hover to select, stacked image reveal, column / list view
     ------------------------------------------------------------ */
  const grid = $('#workGrid'), list = $('#workList');
  const items = $$('.work__item', list), imgs = $$('.work__img');
  function selectWork(k) {
    items.forEach((a) => a.classList.toggle('is-selected', +a.dataset.index === k));
    imgs.forEach((im) => im.classList.toggle('is-hidden', +im.dataset.i < k));
  }
  items.forEach((a) => {
    a.addEventListener('mouseenter', () => selectWork(+a.dataset.index));
    a.addEventListener('focus', () => selectWork(+a.dataset.index));
    if (a.dataset.live === 'false') a.addEventListener('click', (e) => { e.preventDefault(); scramble(a.querySelector('.work__title'), 700); });
  });
  list.addEventListener('mouseleave', () => selectWork(1));
  $$('[data-view-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.viewBtn;
      if (grid.dataset.view === view) return;
      $$('[data-view-btn]').forEach((b) => { b.classList.toggle('is-on', b === btn); b.setAttribute('aria-selected', String(b === btn)); });
      grid.classList.add('is-switching');
      setTimeout(() => {
        grid.dataset.view = view;
        selectWork(1);
        $$('.work__title', list).forEach((t, i) => setTimeout(() => scramble(t, 700), i * 50));
        requestAnimationFrame(() => grid.classList.remove('is-switching'));
      }, 260);
    });
  });

  /* ------------------------------------------------------------
     Contact form -> opens the mail app with everything filled in
     ------------------------------------------------------------ */
  const form = $('#contactForm'), note = $('#formNote');
  $$('.budget button', form).forEach((b) => {
    b.addEventListener('click', () => {
      $$('.budget button', form).forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', String(x === b)); });
      form.budget.value = b.dataset.budget;
      form.querySelector('.field--budget').classList.remove('is-invalid');
    });
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    const need = (input, valid) => { const f = input.closest('.field'); f.classList.toggle('is-invalid', !valid); if (!valid) ok = false; };
    need(form.name, form.name.value.trim().length > 1);
    need(form.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim()));
    need(form.project, form.project.value.trim().length > 3);
    need(form.budget, !!form.budget.value);
    note.hidden = false;
    if (!ok) { note.textContent = 'PLEASE FILL IN EVERY FIELD, INCLUDING A BUDGET.'; scramble(note, 700); return; }
    const subject = encodeURIComponent(`Project enquiry from ${form.name.value.trim()}`);
    const body = encodeURIComponent(`Name: ${form.name.value.trim()}\nEmail: ${form.email.value.trim()}\nBudget (USD): ${form.budget.value}\n\nWhat are you building?\n${form.project.value.trim()}\n`);
    note.textContent = 'OPENING YOUR MAIL APP. IF NOTHING HAPPENS, WRITE TO SWAYAMISGRAT@GMAIL.COM';
    scramble(note, 900);
    location.href = `mailto:swayamisgrat@gmail.com?subject=${subject}&body=${body}`;
  });
  $$('input, textarea', form).forEach((i) => i.addEventListener('input', () => i.closest('.field').classList.remove('is-invalid')));

  /* ------------------------------------------------------------
     Dithered portrait (canvas, ordered Bayer 4x4)
     ------------------------------------------------------------ */
  const portrait = $('#portrait'), portraitSrc = $('#portraitSrc');
  let portraitReady = false, portraitTimer = null;
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  function drawPortrait() {
    if (!portraitReady || !portrait.isConnected) return;
    const box = portrait.parentElement.getBoundingClientRect();
    const W = Math.max(1, Math.round(box.width)), H = Math.max(1, Math.round(box.height));
    const cell = 2; // dither cell size in CSS px
    const w = Math.ceil(W / cell), h = Math.ceil(H / cell);
    const off = document.createElement('canvas'); off.width = w; off.height = h;
    const octx = off.getContext('2d');
    // cover-fit the source
    const sw = portraitSrc.naturalWidth || 672, sh = portraitSrc.naturalHeight || 704;
    const s = Math.max(w / sw, h / sh);
    octx.drawImage(portraitSrc, (w - sw * s) / 2, (h - sh * s) / 2, sw * s, sh * s);
    const data = octx.getImageData(0, 0, w, h).data;
    const dark = (portrait.closest('[data-theme]') || {}).dataset?.theme === 'dark';
    const dpr = Math.min(devicePixelRatio || 1, 2);
    portrait.width = W * dpr; portrait.height = H * dpr;
    const ctx = portrait.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = dark ? '#000' : '#fff';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = dark ? '#e0e0e0' : '#242424';
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
        const th = (BAYER[y & 3][x & 3] + 0.5) / 16;
        const ink = dark ? lum > th : lum < th; // dark theme: light dots on black
        if (ink) ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }
  function schedulePortrait() { clearTimeout(portraitTimer); portraitTimer = setTimeout(drawPortrait, 60); }
  portraitSrc.addEventListener('load', () => { portraitReady = true; drawPortrait(); });
  if (portraitSrc.complete && portraitSrc.naturalWidth) { portraitReady = true; drawPortrait(); }
  addEventListener('resize', schedulePortrait);

  /* ------------------------------------------------------------
     Hero TV: flips through project "channels"
     ------------------------------------------------------------ */
  const tvScreen = $('#tvScreen');
  if (tvScreen) {
    const slides = $$('.tv__slides img', tvScreen), osd = $('#tvOsd');
    let ch = 0;
    const label = (n) => 'CH ' + String(n + 1).padStart(2, '0');
    osd.textContent = label(0);
    function flip() {
      const next = (ch + 1) % slides.length;
      tvScreen.classList.add('is-switching');
      setTimeout(() => {
        slides[ch].classList.remove('is-on');
        slides[next].classList.add('is-on');
        ch = next;
        osd.textContent = label(ch);
        tvScreen.classList.add('show-osd');
      }, 150);
      setTimeout(() => tvScreen.classList.remove('is-switching'), 420);
      setTimeout(() => tvScreen.classList.remove('show-osd'), 1700);
    }
    if (!reduceMotion) setInterval(flip, 4600);
  }

  /* ------------------------------------------------------------
     Loader: counter -> CRT switch-on -> TV shrinks into the hero
     ------------------------------------------------------------ */
  const loader = $('#loader'), stage = $('#loaderStage'), count = $('#loaderCount'), flash = $('#loaderFlash');
  const hero = $('#hero'), heroTv = $('#heroTv');
  const fmtCount = (n) => '0' + n + '%';

  function finishIntro() {
    document.body.classList.remove('is-loading');
    hero.classList.add('is-ready');
    setTimeout(() => nav.classList.add('is-ready'), 500);
    $$('[data-hero] [data-scramble]').forEach((s, i) => setTimeout(() => scramble(s), 600 + i * 120));
    observeAll();
    updateFills(); updateTheme(); updateNav();
  }

  async function runLoader() {
    if (reduceMotion) { loader.classList.add('is-done'); hero.classList.add('tv-ready'); finishIntro(); return; }
    const phone = isPhone();
    if (phone) $('.loader__tv').style.display = 'none';
    count.textContent = fmtCount(0);
    await sleep(1000);
    count.textContent = fmtCount(12 + ((Math.random() * 26) | 0));
    await sleep(1000);
    count.textContent = fmtCount(58 + ((Math.random() * 30) | 0));
    await sleep(1000);
    count.textContent = fmtCount(100);
    await sleep(650);

    // CRT switch-on: a bright line, then it fills the screen.
    count.style.opacity = '0';
    flash.classList.add('is-line');
    await sleep(140);
    flash.classList.add('is-fill');
    await sleep(420);

    if (phone) {
      loader.style.transition = 'opacity .5s ease';
      loader.style.opacity = '0';
      hero.classList.add('tv-ready');
      setTimeout(() => loader.classList.add('is-done'), 520);
      setTimeout(finishIntro, 150);
      return;
    }

    // Shrink the loader stage onto the hero TV (FLIP).
    loader.style.background = 'transparent';
    const from = stage.getBoundingClientRect();
    const to = heroTv.getBoundingClientRect();
    stage.style.transform = 'none';
    stage.style.left = from.left + 'px'; stage.style.top = from.top + 'px';
    stage.style.width = from.width + 'px'; stage.style.height = from.height + 'px';
    const sx = to.width / from.width, sy = to.height / from.height;
    const anim = stage.animate([
      { transform: 'translate(0px, 0px) scale(1, 1)' },
      { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${sx}, ${sy})` }
    ], { duration: 950, easing: 'cubic-bezier(.7, 0, .18, 1)', fill: 'forwards' });
    setTimeout(() => { hero.classList.add('tv-ready'); }, 700);
    setTimeout(() => { loader.style.transition = 'opacity .25s ease'; loader.style.opacity = '0'; }, 820);
    setTimeout(finishIntro, 400);
    await anim.finished.catch(() => {});
    await sleep(300);
    loader.classList.add('is-done');
  }

  // Start once fonts + hero TV image are ready (or after a short cap).
  const ready = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((r) => { const im = $('.tv__frame'); if (im.complete) r(); else { im.onload = r; im.onerror = r; } }),
    new Promise((r) => { const im = $('.loader__tv'); if (im.complete) r(); else { im.onload = r; im.onerror = r; } })
  ]);
  Promise.race([ready, sleep(2500)]).then(runLoader);

  // Keep videos playing (some browsers pause autoplay when offscreen)
  $$('video').forEach((v) => { v.play && v.play().catch(() => {}); });
})();
