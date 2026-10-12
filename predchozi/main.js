(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Top bar ---------- */
  const top = $('#topbar');
  const onScroll = () => top.classList.toggle('is-stuck', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $('#burger');
  const menu = $('#menu');
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  matchMedia('(max-width: 760px)').addEventListener('change', () => setMenu(false));

  /* ---------- Scroll reveal ---------- */
  const reveal = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('is-in');
    reveal.unobserve(en.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  $$('.rv').forEach((el) => reveal.observe(el));

  /* ---------- Open / closed right now (Europe/Prague) ---------- */
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
  const updateStatus = () => {
    const { key, mins } = pragueNow();
    Object.entries(HOURS).forEach(([floor, h]) => {
      const slots = h[key];
      const open = slots.find(([a, b]) => mins >= a && mins < b);
      const next = slots.find(([a]) => mins < a);
      const text = open ? `Otevřeno do ${fmt(open[1])}` : next ? `Otevíráme v ${fmt(next[0])}` : 'Dnes už zavřeno';
      $$(`[data-floor="${floor}"]`).forEach((el) => {
        el.classList.toggle('is-open', !!open);
        const label = $('.hrs__state, b', el);
        if (label) label.textContent = text;
        $$('.hrs__time', el).forEach((c) => c.classList.toggle('is-today', c.dataset.days === key));
      });
    });
  };
  updateStatus();
  setInterval(updateStatus, 60_000);
})();
