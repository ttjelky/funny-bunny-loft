// Funny Bunny — меню, фільтр сценаріїв, перемикач прайсу 31 грудня, поява, форма заявки.
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

  /* ---------- Активний пункт меню + плаваюча кнопка ---------- */
  const navLinks = $$('.nav a');
  const sections = navLinks.map((a) => $(a.getAttribute('href')));
  const fab = $('[data-fab]');
  const booking = $('#booking');
  const onScroll = () => {
    const y = innerHeight * 0.35;
    sections.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      navLinks[i].classList.toggle('is-active', r.top <= y && r.bottom > y);
    });
    const b = booking.getBoundingClientRect();
    fab.classList.toggle('is-visible', scrollY > innerHeight * 0.8 && !(b.top < innerHeight && b.bottom > 0));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Поява при прокрутці ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach((el) => {
    const sibs = $$(':scope > .reveal', el.parentElement);
    if (sibs.length > 2) el.style.setProperty('--d', `${(sibs.indexOf(el) % 4) * 0.07}s`);
    io.observe(el);
  });

  /* ---------- Фільтр сценаріїв ---------- */
  const filter = $('[data-filter]');
  filter.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-age]');
    if (!btn) return;
    $$('[data-age]', filter).forEach((b) => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-pressed', String(b === btn));
    });
    const age = btn.dataset.age;
    $$('[data-cards] .card').forEach((c) => {
      const show = age === 'all' || c.dataset.age.split(' ').includes(age);
      c.classList.toggle('is-hidden', !show);
      if (show) c.classList.add('is-in');
    });
  });

  /* ---------- 31 грудня: Експрес / Люкс ---------- */
  const seg = $('[data-seg]');
  seg.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-plan]');
    if (!btn) return;
    $$('[data-plan]', seg).forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
    $$('[data-slots] b').forEach((b) => {
      b.textContent = `${b.dataset[btn.dataset.plan]} ₴`;
      b.classList.remove('is-flip'); void b.offsetWidth; b.classList.add('is-flip');
    });
  });

  /* ---------- «Обрати» → у форму ---------- */
  const select = $('[data-program-select]');
  document.addEventListener('click', (e) => {
    const p = e.target.closest('[data-pick]');
    if (!p) return;
    const opt = [...select.options].find((o) => o.text === p.dataset.pick);
    if (opt) select.value = opt.value;
  });

  /* ---------- Повзунок гостей, мінімальна дата ---------- */
  const guests = $('[data-guests]');
  const out = $('[data-guests-out]');
  guests.addEventListener('input', () => { out.textContent = guests.value; });
  const date = $('#f-date');
  const now = new Date();
  date.min = new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  /* ---------- Тост ---------- */
  const toast = $('[data-toast]');
  let t;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-shown');
    clearTimeout(t);
    t = setTimeout(() => toast.classList.remove('is-shown'), 4200);
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
    if (first) { first.focus(); showToast('Заповніть, будь ласка, ім\'я, телефон і дату 🐰'); return; }

    const when = new Date(d.get('date')).toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
    const text = [
      'Вітаю! Хочу забронювати свято у Funny Bunny 🐰',
      `Ім'я: ${d.get('name')}`,
      `Телефон: ${d.get('phone')}`,
      `Дата: ${when}`,
      d.get('age') ? `Вік дитини: ${d.get('age')}` : '',
      `Дітей: ${d.get('guests')}`,
      `Програма: ${d.get('program') || 'допоможіть обрати'}`,
      `Де: ${d.get('place')}`,
    ].filter(Boolean).join('\n');

    try { await navigator.clipboard.writeText(text); } catch {}
    showToast('Заявку скопійовано — вставте її в чат і надішліть 💌');
    setTimeout(() => window.open('https://t.me/+380635707657', '_blank', 'noopener'), 700);
  });
  form.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('is-error'));

  $('[data-year]').textContent = new Date().getFullYear();
})();
