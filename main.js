// Funny Bunny — меню, фільтр сценаріїв, вкладки прайсу, тиха поява блоків, форма заявки.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Мобільне меню ---------- */
  const burger = $('[data-burger]');
  const drawer = $('[data-drawer]');
  const setDrawer = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    drawer.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setDrawer(drawer.hidden));
  drawer.addEventListener('click', (e) => { if (e.target.closest('a')) setDrawer(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) setDrawer(false); });

  /* ---------- Шапка, активний пункт, плаваюча кнопка ---------- */
  const header = $('[data-header]');
  const links = $$('.nav a');
  const targets = links.map((a) => $(a.getAttribute('href')));
  const fab = $('[data-fab]');
  const booking = $('#booking');
  const onScroll = () => {
    header.classList.toggle('is-scrolled', scrollY > 8);
    const mid = innerHeight * 0.35;
    targets.forEach((t, i) => {
      const r = t.getBoundingClientRect();
      links[i].classList.toggle('is-active', r.top <= mid && r.bottom > mid);
    });
    const b = booking.getBoundingClientRect();
    fab.classList.toggle('is-visible', scrollY > innerHeight * 0.9 && !(b.top < innerHeight && b.bottom > 0));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Тиха поява блоків ---------- */
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    const groups = ['.section__head', '.facts > div', '.programs li', '.pricing', '.features li', '.loft__intro', '.loft__list li', '.event', '.steps li', '.booking > *', '.contacts > *', '.photo'];
    groups.forEach((sel) => $$(sel).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.setProperty('--d', `${(i % 4) * 0.06}s`);
      io.observe(el);
    }));
  }

  /* ---------- Фільтр сценаріїв ---------- */
  const filter = $('[data-filter]');
  filter.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-age]');
    if (!btn) return;
    $$('[data-age]', filter).forEach((b) => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-pressed', String(b === btn));
    });
    $$('[data-cards] li').forEach((li) => {
      const show = btn.dataset.age === 'all' || li.dataset.age.split(' ').includes(btn.dataset.age);
      li.classList.toggle('is-hidden', !show);
      if (show) li.classList.add('is-in');
    });
  });

  /* ---------- Вкладки прайсу ---------- */
  const ptabs = $('[data-ptabs]');
  ptabs.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (!tab) return;
    $$('[data-tab]', ptabs).forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
    $$('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== tab.dataset.tab; });
  });

  /* ---------- «Обрати сценарій» → у форму ---------- */
  const select = $('[data-program-select]');
  document.addEventListener('click', (e) => {
    const p = e.target.closest('[data-pick]');
    if (!p) return;
    const opt = [...select.options].find((o) => o.text === p.dataset.pick);
    if (opt) select.value = opt.value;
  });

  /* ---------- Дата не раніше сьогодні ---------- */
  const now = new Date();
  $('#f-date').min = new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  /* ---------- Тост ---------- */
  const toast = $('[data-toast]');
  let timer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-shown');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('is-shown'), 4000);
  };

  /* ---------- Форма ---------- */
  // Сайт статичний: збираємо заявку в текст, копіюємо й відкриваємо Telegram на номер лофту.
  const form = $('[data-form]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(form);
    let first = null;
    ['name', 'phone', 'date'].forEach((n) => {
      const v = String(d.get(n) || '').trim();
      const bad = !v || (n === 'phone' && v.replace(/\D/g, '').length < 10);
      form.elements[n].closest('.field').classList.toggle('is-error', bad);
      if (bad && !first) first = form.elements[n];
    });
    if (first) { first.focus(); showToast('Вкажіть ім\'я, телефон і дату'); return; }

    const when = new Date(d.get('date')).toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
    const text = [
      'Вітаю! Хочу забронювати свято у Funny Bunny.',
      `Ім'я: ${d.get('name')}`,
      `Телефон: ${d.get('phone')}`,
      `Дата: ${when}`,
      d.get('age') ? `Вік дитини: ${d.get('age')}` : '',
      d.get('guests') ? `Кількість дітей: ${d.get('guests')}` : '',
      `Формат: ${d.get('place')}`,
      `Сценарій: ${d.get('program') || 'допоможіть обрати'}`,
    ].filter(Boolean).join('\n');

    try { await navigator.clipboard.writeText(text); } catch {}
    showToast('Заявку скопійовано — вставте її в чат і надішліть');
    setTimeout(() => window.open('https://t.me/+380635707657', '_blank', 'noopener'), 700);
  });
  form.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('is-error'));

  $('[data-year]').textContent = new Date().getFullYear();
})();
