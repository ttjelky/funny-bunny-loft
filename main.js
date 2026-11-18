// Funny Bunny — мінімум JS: тема, навігація, фільтр, поява, форма заявки.
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  };

  /* ---------- Тема ---------- */
  $('[data-theme-toggle]')?.addEventListener('click', () => {
    const dark = root.dataset.theme
      ? root.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    store.set('fb-theme', root.dataset.theme);
  });

  /* ---------- Менше анімації ---------- */
  const motionBtn = $('[data-motion-toggle]');
  const syncMotion = () => { if (motionBtn) motionBtn.textContent = root.dataset.motion === 'reduced' ? 'Більше анімації' : 'Менше анімації'; };
  motionBtn?.addEventListener('click', () => {
    if (root.dataset.motion === 'reduced') delete root.dataset.motion; else root.dataset.motion = 'reduced';
    store.set('fb-motion', root.dataset.motion || 'full');
    syncMotion();
  });
  syncMotion();

  /* ---------- Бургер ---------- */
  const burger = $('[data-burger]');
  const drawer = $('[data-drawer]');
  const setDrawer = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    drawer.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger?.addEventListener('click', () => setDrawer(drawer.hidden));
  drawer?.addEventListener('click', (e) => { if (e.target.closest('a')) setDrawer(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) setDrawer(false); });

  /* ---------- Індикатор навігації, що переїжджає ---------- */
  const nav = $('[data-nav]');
  const pill = $('[data-nav-pill]');
  const links = $$('a', nav);
  const movePill = (a) => {
    if (!a) { pill.style.opacity = 0; links.forEach((l) => l.classList.remove('is-active')); return; }
    links.forEach((l) => l.classList.toggle('is-active', l === a));
    pill.style.opacity = 1;
    pill.style.width = a.offsetWidth + 'px';
    pill.style.transform = `translateX(${a.offsetLeft}px)`;
  };
  const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const spy = () => {
    const y = innerHeight * 0.4;
    let current = null;
    sections.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) current = links[i];
    });
    movePill(current);
  };

  /* ---------- Плаваюча кнопка ---------- */
  const fab = $('[data-fab]');
  const booking = $('#booking');
  const onScroll = () => {
    spy();
    const b = booking.getBoundingClientRect();
    const nearBooking = b.top < innerHeight && b.bottom > 0;
    fab.classList.toggle('is-visible', scrollY > innerHeight * 0.7 && !nearBooking);
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', spy);
  onScroll();

  /* ---------- Поява при прокрутці ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  // stagger для сусідів в одній сітці
  $$('.reveal').forEach((el) => {
    const siblings = $$(':scope > .reveal', el.parentElement);
    const i = siblings.indexOf(el);
    if (siblings.length > 2) el.style.setProperty('--stagger', `${(i % 4) * 0.08}s`);
    io.observe(el);
  });

  /* ---------- Фільтр сценаріїв за віком ---------- */
  const filter = $('[data-filter]');
  filter?.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-age]');
    if (!chip) return;
    $$('[data-age]', filter).forEach((c) => {
      c.classList.toggle('is-active', c === chip);
      c.setAttribute('aria-pressed', String(c === chip));
    });
    const age = chip.dataset.age;
    $$('[data-programs] .program').forEach((p) => {
      const show = age === 'all' || p.dataset.ages.split(' ').includes(age);
      p.classList.toggle('is-hidden', !show);
      if (show) p.classList.add('is-in');
    });
  });

  /* ---------- Вибір сценарію / пакета → у форму ---------- */
  const select = $('[data-program-select]');
  const pick = (value) => {
    const opt = [...select.options].find((o) => o.text === value);
    if (opt) select.value = opt.value || opt.text;
  };
  document.addEventListener('click', (e) => {
    const p = e.target.closest('[data-pick]');
    const pk = e.target.closest('[data-pick-package]');
    if (p) pick(p.dataset.pick);
    if (pk) pick(`Пакет «${pk.dataset.pickPackage}»`);
  });

  /* ---------- Повзунок гостей ---------- */
  const guests = $('[data-guests]');
  const guestsOut = $('[data-guests-out]');
  guests?.addEventListener('input', () => { guestsOut.textContent = guests.value; });

  /* ---------- Дата: не раніше сьогодні ---------- */
  const date = $('#f-date');
  if (date) {
    const d = new Date();
    date.min = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  /* ---------- Тост ---------- */
  const toast = $('[data-toast]');
  let toastTimer;
  const showToast = (text) => {
    toast.textContent = text;
    toast.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-shown'), 4200);
  };

  /* ---------- Форма заявки ---------- */
  // Сайт статичний (GitHub Pages), тож заявку збираємо в текст і відкриваємо Telegram.
  // Після запуску можна підключити бота, який надсилатиме заявки власниці напряму.
  const form = $('[data-form]');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const required = ['name', 'phone', 'date'];
    let ok = true;
    required.forEach((n) => {
      const field = form.elements[n].closest('.field');
      const bad = !String(data.get(n) || '').trim() || (n === 'phone' && String(data.get(n)).replace(/\D/g, '').length < 10);
      field.classList.toggle('is-error', bad);
      if (bad && ok) { form.elements[n].focus(); ok = false; }
    });
    if (!ok) { showToast('Заповніть, будь ласка, ім\'я, телефон і дату'); return; }

    const dateStr = new Date(data.get('date')).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', weekday: 'long' });
    const text = [
      'Вітаю! Хочу забронювати свято у Funny Bunny 🐰',
      `Ім'я: ${data.get('name')}`,
      `Телефон: ${data.get('phone')}`,
      `Дата: ${dateStr}`,
      data.get('age') ? `Вік дитини: ${data.get('age')}` : '',
      `Дітей: ${data.get('guests')}`,
      `Сценарій: ${data.get('program') || 'допоможіть обрати'}`,
    ].filter(Boolean).join('\n');

    try { await navigator.clipboard.writeText(text); } catch {}
    showToast('Заявку скопійовано — вставте її в чат Telegram і надішліть');
    setTimeout(() => window.open('https://t.me/+380635707657', '_blank', 'noopener'), 700);
  });
  form?.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('is-error'));

  /* ---------- Рік у футері ---------- */
  const y = $('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
