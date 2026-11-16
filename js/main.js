/* =====================================================================
   THE ELYSIUM — homepage interactions
   GSAP + ScrollTrigger for the scroll choreography, Lenis for smooth scroll.

   How the scroll timelines work (plain version):
   Every scroll animation was measured on the Framer site at 1440px wide,
   in "scroll pixels" from the top of its section — e.g. "the hero shrinks
   between 2750px and 3650px of scrolling". `range()` below turns those
   design numbers into real pixels for the current screen size, so the same
   choreography plays at any width.
   ===================================================================== */
(() => {
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- design canvas helpers ---------- */
  const canvasW = () => (innerWidth >= 1024 ? 1440 : innerWidth >= 810 ? 810 : 390);
  const k = () => innerWidth / canvasW();      // design px → real px
  const u = (v) => v * k();                    // shorthand
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- smooth scroll ---------- */
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  /* ---------- split text into words (keeps <em> styling) ---------- */
  function splitWords(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(' '));
            else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    return $$('.w', el);
  }
  $$('.js-words').forEach(splitWords);

  /* ---------- scrubbed timeline over a section, positions in design px ----------
     range(section, from, to) → a paused GSAP timeline whose time axis IS
     "design scroll px from the top of the section". Add tweens with
     at(tl, start, end, target, vars). */
  const sectionTop = (el) => el.getBoundingClientRect().top + scrollY;
  function range(section, from, to, scrub = true) {
    const tl = gsap.timeline({ defaults: { ease: 'none' } });
    tl.set({}, {}, to - from); // fix the timeline length
    ScrollTrigger.create({
      animation: tl,
      start: () => sectionTop(section) + u(from),
      end: () => sectionTop(section) + u(to),
      scrub,
      invalidateOnRefresh: true,
    });
    tl._from = from;
    return tl;
  }
  const at = (tl, s, e, target, vars) => tl.to(target, { ...vars, duration: e - s }, s - tl._from);
  const atFrom = (tl, s, e, target, fromVars, toVars) => tl.fromTo(target, fromVars, { ...toVars, duration: e - s }, s - tl._from);

  /* =====================================================================
     LOADER (time based)
     ===================================================================== */
  const heroWords = [...$$('.hero__side .w'), ...$$('.hero__title .w')];
  gsap.set(heroWords, { opacity: 0, y: 10, filter: 'blur(10px)' });

  function runLoader() {
    const path = $('#loaderPath');
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.set('.loader__word span', { yPercent: 110 });

    const axis = innerWidth < 810 ? 'yPercent' : 'xPercent'; // phones split top/bottom
    const tl = gsap.timeline({ delay: 0.15 });
    tl.to('.loader__word span', { yPercent: 0, duration: 0.8, ease: 'power3.out' }, 0)
      .to(path, { strokeDashoffset: 0, duration: 2.8, ease: 'power1.inOut' }, 0.1)
      .to(path, { opacity: 0.55, duration: 0.5, ease: 'none' }, 2.6)
      // shutter opens: the two halves slide apart and dissolve
      .to('.loader__word span', { yPercent: -110, duration: 0.5, ease: 'power2.in' }, 3.0)
      .to('.loader__logo', { opacity: 0, scale: 0.94, duration: 0.6, ease: 'power2.inOut' }, 3.1)
      .to('.loader__panel--left', { [axis]: -100, duration: 1.0, ease: 'power3.inOut' }, 3.15)
      .to('.loader__panel--right', { [axis]: 100, duration: 1.0, ease: 'power3.inOut' }, 3.15)
      .to('.loader__panel', { opacity: 0.35, duration: 1.0, ease: 'power1.in' }, 3.15)
      // hero copy reveals word by word with a blur
      .to(heroWords, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out', stagger: 0.045 }, 3.6)
      .add(() => {
        $('#loader').remove();
        document.body.classList.remove('is-loading');
        lenis.start();
        ScrollTrigger.refresh();
      }, 4.3);
  }

  /* =====================================================================
     SCROLL CHOREOGRAPHY
     ===================================================================== */
  const mm = gsap.matchMedia();

  /* Per-breakpoint numbers, all in that breakpoint's design px, measured
     on the Framer site (desktop 1440, tablet 810, mobile 390). */
  const CFG = {
    desktop: {
      intro: { sketch: [500, 1000], render: [1900, 2800], titleScale: 2.26, hero: [2750, 3650], fade: [2800, 3700], strip: [3600, 4600], crafted: [3700, 4600], len: 4830 },
      inter: { stripX: -1614, strip: [0, 970], lastExtra: 498, lastLag: [376, 970], grow: [1326, 1826], growTo: [487 / 348, -60, -190],
               lobbyTop: 90, lobbyRise: [1716, 2526], marqY: 386, marqIn: [1916, 2430], marqX: [1517, -1483], marqMove: [2430, 3330],
               fade29: [3426, 3626], expand: [3486, 3926], expandW: 792, expandH: 1, len: 4000 },
      club: { zoom: [434, 1334], copy: [1000, 1334], para: [1150, 1450], len: 1650, grid: '#clubGrid', rows: 3 },
    },
    tablet: {
      intro: { sketch: [500, 1100], render: [2190, 3260], titleScale: 2.22, hero: [3270, 4400], fade: [3270, 4400], strip: [4380, 5480], crafted: [4380, 5480], len: 5784 },
      inter: { stripX: -1059, strip: [0, 770], lastExtra: 231, lastLag: [480, 770], grow: [1543, 2193], growTo: [1.3994, -33, -396],
               lobbyTop: 200, lobbyRise: [2036, 2916], marqY: 484, marqIn: [2320, 2916], marqX: [1490, -1910], marqMove: [2916, 3994],
               fade29: [4043, 4293], expand: [4230, 4700], expandW: 810, expandH: 0.6, len: 4800 },
      club: { zoom: [444, 1544], copy: [994, 1544], para: [1594, 1794], len: 1974, grid: '#clubGridP', rows: 3 },
    },
    mobile: {
      intro: { sketch: [420, 900], render: [1720, 2580], titleScale: 1.56, hero: [2560, 3480], fade: [2580, 3500], strip: [3420, 4320], crafted: [3430, 4280], len: 4533 },
      inter: { stripX: -691, strip: [0, 390], lastExtra: 42, lastLag: [310, 390], grow: [1161, 1661], growTo: [1.4, -36, -290],
               lobbyTop: 258, lobbyRise: [1693, 2279], marqY: 378, marqIn: [1813, 2279], marqX: [1412, -1988], marqMove: [2279, 3123],
               fade29: [3170, 3370], expand: [3311, 3811], expandW: 390, expandH: 0.6, len: 3900 },
      club: { zoom: [365, 1215], copy: [765, 1215], para: [1265, 1465], len: 1550, grid: '#clubGridP', rows: 3 },
    },
  };

  function build(C) {
    /* 1. Intro / hero ------------------------------------------------ */
    const I = C.intro;
    const intro = $('#intro');
    gsap.set('.hero__img', { scale: 1.6 });
    // The four strip images sit inside the hero frame. Final spacing: 40px gaps,
    // outer images 80% and inner 90% of the frame. They start shifted ±2400/±1400px
    // and at 40% size, so they sweep in from the sides as the frame shrinks.
    const strips = $$('.hero__strip');
    const W = () => innerWidth;
    const inner = () => W() / 2 + 0.45 * W() + u(40);
    const outer = () => inner() + 0.85 * W() + u(40);
    const endX = [() => -outer(), () => -inner(), () => inner(), () => outer()];
    const startX = [() => -outer() + u(2400), () => -inner() + u(1400), () => inner() - u(1400), () => outer() - u(2400)];
    strips.forEach((s, n) => gsap.set(s, { x: startX[n], scale: 0.4 }));

    const h = range(intro, 0, I.len);
    at(h, ...I.sketch, '.hero__img--sketch', { opacity: 1 });
    at(h, ...I.render, '.hero__img--render', { opacity: 1 });
    at(h, ...I.render, '.hero__img', { scale: 1 });
    at(h, ...I.render, '.hero__side', { opacity: 0 });
    at(h, ...I.render, '.hero__title', { scale: I.titleScale, y: () => u(-48) });
    at(h, ...I.hero, '#hero', { scale: 0.2998, rotation: 2 });
    at(h, ...I.fade, '.hero__title', { opacity: 0 });
    at(h, ...I.fade, '#heroLogo', { opacity: 0 });
    strips.forEach((s, n) => at(h, ...I.strip, s, { x: endX[n], scale: 1 }));
    atFrom(h, ...I.crafted, '.crafted__title', { opacity: 0, y: () => u(-80) }, { opacity: 1, y: 0 });
    atFrom(h, ...I.crafted, '.crafted__bottom', { opacity: 0, y: () => u(60) }, { opacity: 1, y: 0 });

    /* 5. Interiors --------------------------------------------------- */
    const N = C.inter;
    const inter = $('#interior');
    const items = $$('.istrip__item');
    const last = items[items.length - 1];
    const lastImg = $('.istrip__img', last);
    const i = range(inter, 0, N.len);
    at(i, ...N.strip, '#istrip', { x: () => u(N.stripX) });
    at(i, ...N.lastLag, last, { x: () => u(N.lastExtra) });          // the last image lags behind and parks
    at(i, ...N.grow, ['.interior__head', $('figcaption', last), ...items.slice(0, -1)], { opacity: 0 });
    at(i, ...N.grow, lastImg, { scale: N.growTo[0], x: () => u(N.growTo[1]), y: () => u(N.growTo[2]) });
    atFrom(i, ...N.lobbyRise, '#lobby', { y: () => innerHeight - u(N.lobbyTop) }, { y: 0 });
    atFrom(i, ...N.marqIn, '#marquee', { y: () => innerHeight - u(N.marqY), x: () => u(N.marqX[0]) }, { y: 0 });
    at(i, ...N.marqMove, '#marquee', { x: () => u(N.marqX[1]) });
    at(i, ...N.fade29, lastImg, { opacity: 0 });
    at(i, ...N.expand, '#lobby', { left: 0, top: 0, width: () => u(N.expandW), height: () => innerHeight * N.expandH, ease: 'power2.out' });

    /* 6. Lucent ------------------------------------------------------ */
    const l = range($('#lucent'), -100, 900);
    at(l, -100, 250, '.lucent__video', { scale: 1.05 });
    at(l, 700, 900, '.lucent__video', { scale: 1 });

    /* 8. Club house -------------------------------------------------- */
    const K = C.club;
    const club = $('#club');
    const tiles = $$(K.grid + ' .tile');
    const cols = K.grid === '#clubGrid' ? 3 : 2;
    const rx = [80, 75, 70];
    const sk = cols === 3 ? [5, 0, -5] : [5, -5];
    tiles.forEach((t, n) => gsap.set(t, { transformPerspective: 1700, rotationX: rx[Math.floor(n / cols)], skewX: sk[n % cols], opacity: 0 }));
    // tiles flip up into place once the section is well into view (time based, like Framer's "appear")
    gsap.to(tiles, { rotationX: 0, skewX: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.06,
      scrollTrigger: { trigger: club, start: 'top 45%', toggleActions: 'play none none reverse' } });
    const c = range(club, 0, K.len);
    at(c, ...K.zoom, K.grid, { scale: 1.3 });
    at(c, ...K.zoom, '.club__overlay', { opacity: 1 });
    at(c, ...K.zoom, '.club__copy', { scale: 1.3 });
    at(c, ...K.copy, '.club__copy', { opacity: 1 });
    atFrom(c, ...K.para, '.club__para', { opacity: 0, filter: 'blur(10px)' }, { opacity: 1, filter: 'blur(0px)' });
    // words reveal one by one (time based) once the copy is coming in
    const clubWords = $$('.club__copy .w');
    gsap.set(clubWords, { opacity: 0, filter: 'blur(10px)', y: 10 });
    ScrollTrigger.create({
      start: () => sectionTop(club) + u(K.copy[0] + (K.copy[1] - K.copy[0]) * 0.4),
      onEnter: () => gsap.to(clubWords, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.04, overwrite: true }),
      onLeaveBack: () => gsap.to(clubWords, { opacity: 0, filter: 'blur(10px)', y: 10, duration: 0.3, overwrite: true }),
    });
  }

  mm.add({ d: '(min-width: 1024px)', t: '(min-width: 810px) and (max-width: 1023.98px)', m: '(max-width: 809.98px)' }, (ctx) => {
    const { d, t } = ctx.conditions;
    build(d ? CFG.desktop : t ? CFG.tablet : CFG.mobile);
  });

  /* ---------------- shared, all sizes ---------------- */

  // Floor plans: the card nearest the middle shows its coloured 3D plan,
  // and the sticky label on the left follows the card in view.
  const tower = $('#planTower');
  const type = $('#planType');
  const setLabel = (card) => {
    if (tower.textContent === card.dataset.tower) return;
    gsap.to([tower, type], { opacity: 0, duration: 0.15, onComplete: () => {
      tower.textContent = card.dataset.tower; type.textContent = card.dataset.type;
      gsap.to([tower, type], { opacity: 1, duration: 0.3 });
    } });
  };
  $$('.plan').forEach((card) => {
    // desktop: only the card crossing the middle; tablet/phone: any card fully on screen
    ScrollTrigger.create({ trigger: card, toggleClass: 'is-active', invalidateOnRefresh: true,
      start: () => (innerWidth >= 1024 ? 'center 64%' : 'bottom bottom'),
      end: () => (innerWidth >= 1024 ? 'center 36%' : 'top top') });
    ScrollTrigger.create({ trigger: card, start: () => `top-=${u(40)} center`, end: () => `bottom+=${u(40)} center`,
      onEnter: () => setLabel(card), onEnterBack: () => setLabel(card) });
  });

  // Count-up numbers
  $$('.js-count').forEach((el) => {
    const from = +el.dataset.from, to = +el.dataset.to;
    el.textContent = from;
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => {
      const o = { v: from };
      gsap.to(o, { v: to, duration: 2, ease: 'power2.out', onUpdate: () => (el.textContent = Math.round(o.v)) });
    } });
  });

  // Videos only play while on screen
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) { const p = v.play(); if (p) p.catch(() => {}); } else v.pause();
  }), { threshold: 0.05 });
  $$('.js-video').forEach((v) => io.observe(v));

  /* ---------- start ---------- */
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => { ScrollTrigger.refresh(); runLoader(); });
  addEventListener('resize', () => ScrollTrigger.refresh());
})();
