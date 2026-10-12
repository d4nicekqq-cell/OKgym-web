(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 860px)');
  const canHover = matchMedia('(hover: hover)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;

  const IMG = 'https://www.okgym.cz/images/';
  const BOOK = 'https://okgym.clubspire.cz/';

  const ACTS = [
    { t: 'Posilovna', f: '1. patro', img: 'fitness/vybaveni.webp',
      d: 'Klimatizovaná posilovna s kardiozónou, stroji, volnými vahami a funkční zónou. První trénink s trenérem zdarma.',
      facts: [[800, 'm²', 'plocha'], [90, '+', 'stanovišť'], [60, '', 'strojů']],
      links: [["Ceník", "#cenik-posilovna"]] },
    { t: 'Box', f: '1. patro', img: 'gallery/box.webp',
      d: 'Profesionální ring, pytle a lapy. Thajský box, kondiční tréninky v aerobním sále a spinning.',
      facts: [[700, 'm²', 'sál'], [6, 'cm', 'tatami']],
      links: [] },
    { t: 'Lezení', f: 'Přízemí', img: 'steny/lezecka.webp',
      d: 'Lezecká stěna s navijáky, boulder s Campus boardem a podsvícený MoonBoard. Půjčovna vybavení na místě.',
      facts: [[8, 'm', 'stěna'], ['3,8', 'm', 'boulder'], ['25–40', '°', 'MoonBoard']],
      links: [["Ceník", "#cenik-lezeni"]] },
    { t: 'Lekce', f: 'Přízemí', img: 'sal/bungee.webp',
      d: 'Bungee, H.E.A.T., Tabata, pilates a jóga v multifunkčním sále. Pro každý věk, bez předchozích zkušeností.',
      facts: [[5, '', 'druhů lekcí']],
      links: [["Rozvrh", "#cenik-rozvrh"], ["Ceník", "#cenik-lekce"]] },
    { t: 'Sauny', f: 'Přízemí', img: 'sauna/finska.webp',
      d: 'Finská, bio s bylinkami a infrasauna. Ochlazení, odpočinek a až dvě hodiny klidu.',
      facts: [[90, '°C', 'finská'], [70, '°C', 'bio'], [35, 'min', 'infra']],
      links: [["Ceník", "#cenik-sauny"]] },
    { t: 'Masáže', f: 'Přízemí', img: 'masaze/header.webp',
      d: 'Profesionální masáže po tréninku, lezení i sauně.',
      facts: [],
      links: [["Ceník", "#cenik-masaze"]] },
    { t: 'Solárium', f: '1. patro', img: 'solarium/2.webp',
      d: 'Ergoline Inspiration 400 Super Power s trubicemi podporujícími tvorbu kolagenu. Kosmetika na recepci.',
      facts: [],
      links: [["Ceník", "#cenik-solarium"]] },
  ];

  /* ---------- Variable-width fitting: stretch each word to fill its line ---------- */
  const setW = (el, v) => el.style.setProperty('--wdth', v);
  const widthOf = (el) => el.getBoundingClientRect().width;
  const fitWdth = (el, target) => {
    el.style.transition = 'none';
    let lo = 62, hi = 125, v;
    setW(el, hi);
    if (widthOf(el) <= target) v = hi;
    else {
      setW(el, lo);
      if (widthOf(el) >= target) v = lo;
      else {
        for (let i = 0; i < 14; i++) { v = (lo + hi) / 2; setW(el, v); if (widthOf(el) > target) hi = v; else lo = v; }
        v = lo;
      }
    }
    el.dataset.w = v.toFixed(2);
    return v;
  };
  const release = (el) => { void el.offsetWidth; el.style.transition = ''; };

  /* ---------- Hero ---------- */
  const hero = $('.hero');
  const title = $('.hero__title');
  const lines = $$('.hero .fit');
  const wraps = $$('.hero__line');
  const media = $('.hero__media');
  const slides = $$('.hero__media img');

  const layoutHero = (intro) => {
    const W = title.clientWidth;
    const H = hero.clientHeight - $('#topbar').offsetHeight - $('.hero__foot').offsetHeight - 28;
    let fs = H / 3 / 0.84;
    title.style.fontSize = `${fs}px`;
    lines.forEach((l) => { l.style.transition = 'none'; setW(l, 62); });
    const widest = Math.max(...lines.map(widthOf));
    if (widest > W) { fs *= W / widest; title.style.fontSize = `${fs}px`; }
    lines.forEach((l) => { const v = fitWdth(l, W); setW(l, intro && !reduced ? 62 : v); release(l); });
    if (intro && !reduced) {
      lines.forEach((l, i) => { l.style.transitionDelay = `${250 + i * 110}ms`; setW(l, l.dataset.w); });
      setTimeout(() => lines.forEach((l) => { l.style.transitionDelay = ''; }), 2200);
    }
  };

  let cur = -1, timer;
  const slide = (i) => {
    if (i === cur) return;
    slides.forEach((im, k) => { im.classList.toggle('is-prev', k === cur); im.classList.toggle('is-on', k === i); });
    lines.forEach((l, k) => l.classList.toggle('is-on', k === i));
    cur = i;
    clearTimeout(timer);
    timer = setTimeout(() => slide((cur + 1) % slides.length), 4200);
  };
  lines.forEach((l, i) => l.addEventListener('pointerenter', () => slide(i)));

  /* ---------- Closing CTA (width follows scroll) ---------- */
  const book = $('#book');
  const bookFit = $('.fit', book);
  const layoutBook = () => { fitWdth(bookFit, $('.book__line').clientWidth); bookFit.style.transition = 'color .4s'; };

  /* ---------- Scroll-linked motion ---------- */
  const top = $('#topbar');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    top.classList.toggle('is-stuck', y > vh * 0.6);
    if (!reduced && y < vh) {
      wraps.forEach((w, i) => { w.style.transform = `translate3d(${(i % 2 ? 1 : -1) * y * 0.14}px,0,0)`; });
      media.style.transform = `scale(${1 + (y / vh) * 0.14})`;
    }
    const r = book.getBoundingClientRect();
    if (r.top < vh && bookFit.dataset.w) {
      const p = reduced ? 1 : Math.min(Math.max((vh - r.top) / (r.height + 80), 0), 1);
      setW(bookFit, 62 + (bookFit.dataset.w - 62) * p);
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- Activities: list + detail panel / bottom sheet ---------- */
  const list = $('#list');
  const panel = $('#panel');
  const body = $('#panelBody');
  const layers = $$('.panel__img img');
  const FX = ['fxUp', 'fxCircle', 'fxWipe', 'fxSplit', 'fxDiag'];
  list.innerHTML = ACTS.map((a, i) => `
    <li class="rv" style="--i:${i}"><button class="row" type="button" data-i="${i}">
      <span class="row__name">${a.t}</span><span class="row__floor">${a.f}</span><span class="row__arrow" aria-hidden="true">→</span>
    </button></li>`).join('');
  const rows = $$('.row', list);

  const roll = (el, end) => {
    if (reduced) return;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min((t - t0) / 900, 1);
      el.firstChild.textContent = Math.round(end * (1 - Math.pow(1 - k, 4)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  let active = -1, flip = 0;
  const show = (i) => {
    if (i === active) return;
    active = i;
    const a = ACTS[i];
    rows.forEach((r, k) => r.classList.toggle('is-on', k === i));

    const next = layers[flip], prev = layers[flip ^ 1];
    flip ^= 1;
    next.style.setProperty('--fx', FX[i % FX.length]);
    next.src = IMG + a.img;
    prev.classList.remove('is-in');
    next.classList.remove('is-in');
    void next.offsetWidth;
    next.classList.add('is-in');

    $('#panelTitle').textContent = a.t;
    $('.panel__desc', body).textContent = a.d;
    $('.panel__facts', body).innerHTML = a.facts.map(([n, u, l]) => `<div><b>${n}<u>${u}</u></b><span>${l}</span></div>`).join('');
    $('.panel__links', body).innerHTML = [...a.links, ['Rezervace', BOOK]]
      .map(([l, h]) => (h[0] === '#' ? `<a href="${h}">${l} ↓</a>` : `<a href="${h}" target="_blank" rel="noopener">${l} ↗</a>`)).join('');
    $$('.panel__facts b', body).forEach((b, k) => { if (typeof a.facts[k][0] === 'number') roll(b, a.facts[k][0]); });
    body.classList.remove('is-swap');
    void body.offsetWidth;
    body.classList.add('is-swap');
  };

  const sheet = (open) => {
    panel.classList.toggle('is-open', open);
    root.classList.toggle('sheet-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    panel.style.removeProperty('--drag');
    if (open) panel.scrollTop = 0;
  };
  rows.forEach((r) => {
    const i = +r.dataset.i;
    if (canHover) r.addEventListener('pointerenter', () => { if (!mobile.matches) show(i); });
    r.addEventListener('focus', () => { if (!mobile.matches) show(i); });
    r.addEventListener('click', () => { show(i); if (mobile.matches) sheet(true); });
  });
  $('#panelClose').addEventListener('click', () => sheet(false));
  $('#scrim').addEventListener('click', () => sheet(false));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') sheet(false); });
  mobile.addEventListener('change', () => sheet(false));

  // Price lists expand in place; a "Ceník" link opens its list before the page scrolls to it
  const lists = $$('.acc');
  lists.forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) lists.forEach((o) => { if (o !== d) o.open = false; });
  }));
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#cenik-"]');
    if (!a) return;
    sheet(false);
    lists.forEach((d) => { d.open = `#${d.id}` === a.hash; });
  });

  // Drag the sheet down by its header to dismiss
  const head = $('.panel__head');
  let y0 = null, dy = 0;
  head.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    y0 = e.clientY; dy = 0;
    panel.classList.add('is-dragging');
    head.setPointerCapture(e.pointerId);
  });
  head.addEventListener('pointermove', (e) => {
    if (y0 === null) return;
    dy = Math.max(e.clientY - y0, 0);
    panel.style.setProperty('--drag', `${dy}px`);
  });
  const endDrag = () => {
    if (y0 === null) return;
    y0 = null;
    panel.classList.remove('is-dragging');
    if (dy > 90) sheet(false); else panel.style.removeProperty('--drag');
  };
  head.addEventListener('pointerup', endDrag);
  head.addEventListener('pointercancel', endDrag);

  show(0);
  const preload = () => ACTS.forEach((a) => { new Image().src = IMG + a.img; });
  (window.requestIdleCallback || setTimeout)(preload);

  /* ---------- Today timeline + live status (Europe/Prague) ---------- */
  const T0 = 6 * 60, T1 = 23 * 60;
  const pct = (m) => ((Math.min(Math.max(m, T0), T1) - T0) / (T1 - T0)) * 100;
  const HOURS = {
    patro: { week: [[7 * 60, 21 * 60 + 30]], weekend: [[9 * 60, 12 * 60], [14 * 60, 21 * 60]] },
    prizemi: { week: [[7 * 60 + 30, 22 * 60]], weekend: [[9 * 60, 12 * 60], [14 * 60, 21 * 60]] },
  };
  const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const pragueNow = () => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Prague', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { key: p.weekday === 'Sat' || p.weekday === 'Sun' ? 'weekend' : 'week', mins: (+p.hour % 24) * 60 + +p.minute };
  };
  $('[data-day]').textContent = new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', timeZone: 'Europe/Prague' }).format(new Date());
  const weekday = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Prague" })).getDay();
  $$("[data-weekday]").forEach((t) => t.classList.toggle("is-today", +t.dataset.weekday === weekday));

  // One "now" line running through both rows, with the current time above it
  const tls = $("#tls");
  const nowLine = $("#nowLine");
  let lastMins = null;
  const placeNow = (mins) => {
    lastMins = mins;
    const bars = $$(".tl__bar", tls);
    const first = bars[0], last = bars[bars.length - 1];
    // Rows can be their own offsetParent while their reveal transform is active, so sum offsets up to the wrapper
    const offset = (el) => { let x = 0, y = 0; for (; el && el !== tls; el = el.offsetParent) { x += el.offsetLeft; y += el.offsetTop; } return { x, y }; };
    const a = offset(first), b = offset(last);
    const top = a.y - 10;
    nowLine.style.left = `${a.x + (first.offsetWidth * pct(mins)) / 100 - 1}px`;
    nowLine.style.top = `${top}px`;
    nowLine.style.height = `${b.y + last.offsetHeight + 10 - top}px`;
    nowLine.dataset.time = fmt(mins);
    tls.classList.toggle("has-now", mins >= T0 && mins <= T1);
  };
  addEventListener("resize", () => { if (lastMins !== null) placeNow(lastMins); });
  let drawnKey = null;
  const updateStatus = () => {
    const { key, mins } = pragueNow();
    let anyOpen = false, nextOpen = null;
    Object.entries(HOURS).forEach(([floor, h]) => {
      const el = $(`.tl[data-floor="${floor}"]`);
      const bar = $('.tl__bar', el);
      const slots = h[key];
      if (drawnKey !== key) {
        $$('.tl__seg, .tl__t', bar).forEach((s) => s.remove());
        slots.forEach(([a, b]) => {
          const seg = document.createElement('span');
          seg.className = 'tl__seg';
          seg.style.left = `${pct(a)}%`;
          seg.style.width = `${pct(b) - pct(a)}%`;
          bar.prepend(seg);
          // Opening time under the start of the bar, closing time under its end
          [[a, ''], [b, ' tl__t--end']].forEach(([m, mod]) => {
            const t = document.createElement('span');
            t.className = `tl__t${mod}`;
            t.style.left = `${pct(m)}%`;
            t.textContent = fmt(m);
            bar.append(t);
          });
        });
      }
      const open = slots.find(([a, b]) => mins >= a && mins < b);
      const next = slots.find(([a]) => mins < a);
      anyOpen = anyOpen || !!open;
      if (next && (nextOpen === null || next[0] < nextOpen)) nextOpen = next[0];
      el.classList.toggle('is-open', !!open);
      $('.tl__state', el).textContent = open ? `Otevřeno do ${fmt(open[1])}` : next ? `Otevíráme v ${fmt(next[0])}` : 'Dnes už zavřeno';
    });
    drawnKey = key;
    placeNow(mins);
    root.classList.toggle('is-open-now', anyOpen);
    $('[data-status]').textContent = anyOpen ? 'Právě otevřeno' : nextOpen !== null ? `Otevíráme v ${fmt(nextOpen)}` : 'Teď zavřeno';
  };
  updateStatus();
  setInterval(updateStatus, 60_000);

  /* ---------- Reveal + current section ---------- */
  const reveal = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('is-in');
    reveal.unobserve(en.target);
  }), { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
  $$('.rv').forEach((el) => reveal.observe(el));

  const navLinks = $$('.top__nav a, .tabs a[href^="#"]');
  const spy = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle('is-current', a.hash === `#${en.target.id}`));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['top', 'aktivity', 'dnes', 'kontakt'].forEach((id) => spy.observe($(`#${id}`)));

  /* ---------- Boot ---------- */
  const boot = () => {
    if (root.classList.contains('is-ready')) return;
    layoutHero(true);
    layoutBook();
    onScroll();
    slide(0);
    if (lastMins !== null) placeNow(lastMins);
    root.classList.add('is-ready');
  };
  (document.fonts ? document.fonts.load('900 1em Archivo').then(() => document.fonts.ready) : Promise.resolve()).then(boot);
  setTimeout(boot, 1800);

  let rz;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => { layoutHero(false); layoutBook(); onScroll(); }, 120);
  });
})();
