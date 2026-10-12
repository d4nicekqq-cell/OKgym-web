(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Mobile menu ---------- */
  const burger = $('#burger');
  const nav = $('#nav');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  matchMedia('(max-width: 1040px)').addEventListener('change', () => setMenu(false));

  /* ---------- Dropdown ---------- */
  const hover = matchMedia('(hover: hover) and (min-width: 1041px)');
  $$('.dd').forEach((dd) => {
    const btn = $('.dd__btn', dd);
    const set = (open) => { dd.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open); };
    // With a mouse the menu is already open from hover, so a click must not toggle it shut.
    btn.addEventListener('click', () => set(hover.matches ? true : !dd.classList.contains('is-open')));
    dd.addEventListener('pointerenter', () => { if (hover.matches) set(true); });
    dd.addEventListener('pointerleave', () => { if (hover.matches) set(false); });
    dd.addEventListener('focusout', (e) => { if (!dd.contains(e.relatedTarget)) set(false); });
    document.addEventListener('click', (e) => { if (!dd.contains(e.target)) set(false); });
    dd.addEventListener('keydown', (e) => { if (e.key === 'Escape') { set(false); btn.focus(); } });
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Scroll reveal ---------- */
  const reveal = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('is-in');
    reveal.unobserve(en.target);
  }), { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
  $$('.rv').forEach((el) => reveal.observe(el));

  /* ---------- Missing images keep their box, hide the broken icon ---------- */
  $$('img').forEach((img) => {
    const mark = () => img.classList.add('is-broken');
    if (img.complete && !img.naturalWidth && img.currentSrc) mark();
    img.addEventListener('error', mark);
  });

  /* ---------- Open / closed right now (Europe/Prague) ----------
     Hours come from data-week / data-weekend attributes, e.g. "9:00–12:00, 14:00–21:00". */
  const toMin = (t) => { const [h, m] = t.trim().split(':').map(Number); return h * 60 + m; };
  const parse = (s) => s.split(',').map((slot) => slot.split(/[–-]/).map(toMin));
  const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const pragueNow = () => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Prague', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
    return { day, key: day === 0 || day === 6 ? 'weekend' : 'week', mins: (+p.hour % 24) * 60 + +p.minute };
  };
  const updateStatus = () => {
    const { day, key, mins } = pragueNow();
    $$('[data-floor]').forEach((el) => {
      const slots = parse(el.dataset[key]);
      const open = slots.find(([a, b]) => mins >= a && mins < b);
      const next = slots.find(([a]) => mins < a);
      const label = $('[data-status]', el);
      if (label) {
        label.classList.toggle('is-open', !!open);
        label.textContent = open ? `Otevřeno do ${fmt(open[1])}` : next ? `Zavřeno, otevíráme v ${fmt(next[0])}` : 'Dnes už zavřeno';
      }
      $$('[data-days]', el).forEach((row) => row.classList.toggle('is-today', row.dataset.days === key));
    });
    $$('.day').forEach((d) => d.classList.toggle('is-today', +d.dataset.day === day));
  };
  updateStatus();
  setInterval(updateStatus, 60_000);

  /* ---------- Pricing table of contents ---------- */
  const toc = $$('.toc a');
  if (toc.length) {
    const spy = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      toc.forEach((a) => a.classList.toggle('is-current', a.hash === `#${en.target.id}`));
    }), { rootMargin: '-20% 0px -70% 0px' });
    $$('.pblock').forEach((b) => spy.observe(b));
  }
})();
