(function () {
  'use strict';

  const _tg = window.Telegram && window.Telegram.WebApp;
  const tg = _tg && (_tg.initData || (_tg.platform && _tg.platform !== 'unknown')) ? _tg : null;
  const BOOKS = window.BOOK_DATA || [];
  const book = BOOKS[0];
  const $ = (s, r = document) => r.querySelector(s);
  const view = $('#view');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------- icons ---------------- */
  const I = {
    home: '<path d="M4 5h6v14H4zM10 5h10v14H10"/><path d="M13 9h4M13 12h4"/>',
    dict: '<path d="M4 5h9M8.5 3v2M6 5c0 4 2.5 7 6 8"/><path d="M11 5c-.5 3.5-3 7-7 9"/><path d="M13 21l4-10 4 10M14.5 17.5h5"/>',
    cards: '<rect x="3" y="7" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 012 2v12"/>',
    book: '<path d="M4 4h7a3 3 0 013 3v13a2 2 0 00-2-2H4z"/><path d="M20 4h-3a3 3 0 00-3 3"/><path d="M20 4v14h-6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    page: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    handshake: '<path d="M11 17l2 2a1.4 1.4 0 002-2"/><path d="M14 14l2.5 2.5a1.4 1.4 0 002-2L15 11"/><path d="M21 11l-5-5-4 1-3 3a1.4 1.4 0 002 2l2.5-2"/><path d="M3 11l5-5 3 1"/><path d="M5 13l4 4a1.4 1.4 0 002-2"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.8.3 5 2.7 5 5.8"/>',
    map: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
    utensils: '<path d="M7 3v8M4.5 3v5a2.5 2.5 0 005 0V3M7 11v10"/><path d="M17 21V3c-2.2 1.3-3.5 3.8-3.5 7v3H17"/>',
    plane: '<path d="M10.5 13.5L3 11l1.5-1.5 7.5.5 4.5-4.5a2 2 0 013 3L15 13l.5 7.5L14 22l-2.5-7.5z"/>',
    moon: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
    coffee: '<path d="M4 9h13v5a5 5 0 01-5 5H9a5 5 0 01-5-5z"/><path d="M17 11h1.5a2.5 2.5 0 010 5H17M8 3v3M12 3v3"/>',
    share: '<path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6"/>'
  };
  const svg = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${I[n] || ''}</svg>`;

  /* ---------------- storage (Telegram CloudStorage + local fallback) ---------------- */
  const KEY = 'huna_state_v1';
  const state = { done: {}, theme: 'auto', scale: 1, harakat: true, fcChapter: 'all', fcMode: 'new', cards: {} };
  function loadLocal() { try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {} }
  function save() {
    const s = JSON.stringify(state);
    try { localStorage.setItem(KEY, s); } catch (e) {}
    try { if (tg && tg.CloudStorage && tg.isVersionAtLeast && tg.isVersionAtLeast('6.9')) tg.CloudStorage.setItem(KEY, s, () => {}); } catch (e) {}
  }
  function loadCloud(cb) {
    try {
      if (tg && tg.CloudStorage && tg.isVersionAtLeast && tg.isVersionAtLeast('6.9')) {
        tg.CloudStorage.getItem(KEY, (err, v) => { if (!err && v) { try { Object.assign(state, JSON.parse(v)); } catch (e) {} } cb(); });
        return;
      }
    } catch (e) {}
    cb();
  }

  /* ---------------- helpers ---------------- */
  const HARAKAT = /[\u064B-\u0652\u0670]/g;
  const ar = (s) => state.harakat ? s : String(s).replace(HARAKAT, '');
  const allDialogues = () => book.chapters.flatMap(c => c.dialogues.map(d => ({ ...d, ch: c })));
  const findDialogue = (id) => allDialogues().find(d => d.id === id);
  const chapterVocab = (c) => {
    const seen = new Set(), out = [];
    c.dialogues.flatMap(d => d.vocab || []).concat(c.vocab || []).forEach(v => {
      const k = v[0].replace(/[\u064B-\u0652\u0670\s]/g, '');
      if (!seen.has(k)) { seen.add(k); out.push({ ar: v[0], ru: v[1], ch: c.n }); }
    });
    return out;
  };
  const allVocab = () => book.chapters.flatMap(chapterVocab);
  const vkey = (a) => String(a).replace(/[\u064B-\u0652\u0670\s]/g, '');
  function labeledSections(ch) {
    const tot = {}, cnt = {};
    ch.sections.forEach(s => { tot[s.ru] = (tot[s.ru] || 0) + 1; });
    return ch.sections.map(s => { cnt[s.ru] = (cnt[s.ru] || 0) + 1; return { ...s, label: tot[s.ru] > 1 ? `${s.ru} ${cnt[s.ru]}` : s.ru }; });
  }
  function dialogueMaterials(d) {
    const ch = d.ch, ds = ch.dialogues, i = ds.findIndex(x => x.id === d.id);
    const end = ds[i + 1] ? ds[i + 1].page : Infinity;
    return labeledSections(ch).filter(s => s.page > d.page && s.page < end && s.type !== 'prac');
  }
  const matRow = (s) => `<button class="mat" data-p="${s.page}" data-t="${esc(s.label)}"><span>${esc(s.label)}</span><small>стр. ${s.page}</small>${svg('right')}</button>`;
  const pageSrc = (n) => `${n}.webp`;
  const haptic = (t = 'light') => { try { tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred(t); } catch (e) {} };
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1800); }

  function applyTheme() {
    let theme = state.theme;
    if (theme === 'auto' && tg && tg.colorScheme) theme = tg.colorScheme;
    if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--ar-scale', state.scale);
    try {
      if (tg) {
        tg.setHeaderColor && tg.setHeaderColor('#001a33');
        tg.setBackgroundColor && tg.setBackgroundColor(getComputedStyle(document.body).backgroundColor);
        tg.setBottomBarColor && tg.setBottomBarColor('#00254a');
      }
    } catch (e) {}
  }

  /* ---------------- router ---------------- */
  const TABS = [
    { id: 'home', label: book.title, icon: 'home' },
    { id: 'dict', label: 'Словарь', icon: 'dict' },
    { id: 'cards', label: 'Карточки', icon: 'cards' },
    { id: 'book', label: 'Книга', icon: 'book' },
    { id: 'settings', label: 'Настройки', icon: 'settings' }
  ];
  function renderTabs(active) {
    $('#tabbar').innerHTML = TABS.map(t => `<button class="tab ${t.id === active ? 'active' : ''}" data-tab="${t.id}">${svg(t.icon)}<span>${esc(t.label)}</span></button>`).join('');
  }
  $('#tabbar').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    haptic(); location.hash = b.dataset.tab === 'home' ? '#/' : '#/' + b.dataset.tab;
  });

  function setChrome(title, tab, canBack) {
    $('#title').textContent = title;
    renderTabs(tab);
    $('#backBtn').hidden = !canBack || !!tg;
    try {
      if (tg && tg.BackButton) canBack ? tg.BackButton.show() : tg.BackButton.hide();
    } catch (e) {}
  }
  function goBack() { if (history.length > 1) history.back(); else location.hash = '#/'; }
  $('#backBtn').addEventListener('click', goBack);

  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const [name, arg] = h.split('/');
    window.scrollTo(0, 0);
    if (name === 'd' && arg) return renderDialogue(decodeURIComponent(arg));
    if (name === 'p' && arg) return renderPages(arg.split(',').map(Number), decodeURIComponent(h.split('/')[2] || ''));
    if (name === 'w' && arg) return renderWords(Number(arg));
    if (name === 'dict') return renderDict();
    if (name === 'cards') return renderCards();
    if (name === 'book') return renderBook(Number(arg) || 1);
    if (name === 'settings') return renderSettings();
    renderHome();
  }

  /* ---------------- home ---------------- */
  function renderHome() {
    setChrome(book.title, 'home', false);
    const ds = allDialogues();
    const done = ds.filter(d => state.done[d.id]).length;
    const pct = ds.length ? Math.round(done / ds.length * 100) : 0;
    let html = `
      <section class="intro">
        <img src="${pageSrc(book.cover)}" alt="Обложка учебника">
        <div>
          <div class="ar">${esc(book.titleAr)}</div>
          <p>Курс арабского языка · 8 глав, ${ds.length} диалогов</p>
          <div class="progress"><i style="width:${pct}%"></i></div>
          <small>Пройдено ${done} из ${ds.length}</small>
        </div>
      </section>`;
    html += book.chapters.map(ch => {
      const cards = ch.dialogues.map(d => {
        const first = d.lines && d.lines[0] ? `<div class="first">${esc(ar(d.lines[0][1]))}</div>` : '';
        return `<button class="dcard" data-d="${d.id}">
          <span class="pill">${ch.n}.${d.n}. Диалог</span>
          ${state.done[d.id] ? `<span class="done">${svg('check')}</span>` : ''}
          ${first}
          <div class="sub">${esc(d.ru || ar(d.ar))}</div>
        </button>`;
      }).join('');
      const dots = ch.dialogues.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('');
      const secs = labeledSections(ch);
      const nW = chapterVocab(ch).length;
      const tools = `<div class="ch-tools">
          ${nW ? `<button class="tool" data-w="${ch.n}">${svg('dict')}<span>Слова главы<small>${nW} слов</small></span></button>` : ''}
          <button class="tool" data-mat="${ch.n}" aria-expanded="false">${svg('page')}<span>Материалы<small>${secs.length} разделов</small></span></button>
        </div>
        <div class="mats" id="mats-${ch.n}" hidden>${secs.map(matRow).join('')}</div>`;
      return `<article class="chapter">
        <div class="ch-head">
          <div class="hex">${ch.n}</div>
          <div class="ch-title"><span class="ar">${esc(ar(ch.ar))}</span><span class="ru">${esc(ch.ru)}</span></div>
          <div class="ch-icon">${svg(ch.icon)}</div>
        </div>
        <div class="carousel-wrap">
          <button class="arrow l" aria-label="Предыдущий диалог" disabled>${svg('left')}</button>
          <div class="carousel">${cards}</div>
          <button class="arrow r" aria-label="Следующий диалог" ${ch.dialogues.length < 2 ? 'disabled' : ''}>${svg('right')}</button>
          <div class="dots">${dots}</div>
        </div>
        ${tools}
      </article>`;
    }).join('');
    view.innerHTML = html;

    view.querySelectorAll('.carousel-wrap').forEach(w => {
      const c = $('.carousel', w), l = $('.arrow.l', w), r = $('.arrow.r', w), dots = [...w.querySelectorAll('.dots i')];
      const idx = () => Math.round(c.scrollLeft / (c.firstElementChild.offsetWidth + 10));
      const upd = () => { const i = idx(); l.disabled = i <= 0; r.disabled = i >= dots.length - 1; dots.forEach((d, k) => d.classList.toggle('on', k === i)); };
      c.addEventListener('scroll', () => { clearTimeout(c._t); c._t = setTimeout(upd, 60); }, { passive: true });
      const go = (dir) => { haptic(); c.scrollTo({ left: (idx() + dir) * (c.firstElementChild.offsetWidth + 10), behavior: 'smooth' }); };
      l.addEventListener('click', () => go(-1)); r.addEventListener('click', () => go(1));
    });
    view.onclick = e => {
      const d = e.target.closest('[data-d]'); if (d) { haptic(); location.hash = '#/d/' + d.dataset.d; return; }
      const m = e.target.closest('[data-mat]');
      if (m) { haptic(); const box = $('#mats-' + m.dataset.mat); box.hidden = !box.hidden; m.setAttribute('aria-expanded', String(!box.hidden)); m.classList.toggle('open', !box.hidden); return; }
      const w = e.target.closest('[data-w]'); if (w) { haptic(); location.hash = '#/w/' + w.dataset.w; return; }
      const p = e.target.closest('[data-p]'); if (p) { haptic(); location.hash = `#/p/${p.dataset.p}/${encodeURIComponent(p.dataset.t)}`; }
    };
  }

  /* ---------------- dialogue ---------------- */
  function renderDialogue(id) {
    const d = findDialogue(id);
    if (!d) { location.hash = '#/'; return; }
    setChrome(`Глава ${d.ch.n} · Диалог ${d.n}`, 'home', true);
    const hasText = !!(d.lines && d.lines.length);
    const tabs = [];
    if (hasText) tabs.push(['text', 'Диалог']);
    if (d.vocab) tabs.push(['vocab', 'Новые слова']);
    tabs.push(['page', 'Страница книги']);
    let cur = tabs[0][0];

    const draw = () => {
      let body = '';
      if (cur === 'text') {
        const order = [];
        d.lines.forEach(l => { if (l[0] && !order.includes(l[0])) order.push(l[0]); });
        body = `<div class="lines">${d.lines.map(l => {
          const s = l[2] || (Math.min(order.indexOf(l[0]), 2) + 1);
          const sp = l[0] ? `<span class="sp">${esc(ar(l[0]))}:</span> ` : '';
          return `<div class="line s${s}${l[0] ? '' : ' quote'}">${sp}${esc(ar(l[1]))}</div>`;
        }).join('')}</div>`;
      } else if (cur === 'vocab') {
        body = `<table class="vocab"><thead><tr><th>Значение</th><th class="ar">الكَلِمة الجَدِيدة</th></tr></thead><tbody>${
          d.vocab.map(v => `<tr><td class="ru">${esc(v[1])}</td><td class="ar">${esc(ar(v[0]))}</td></tr>`).join('')}</tbody></table>`;
      } else {
        const pages = [d.page].concat(d.explain ? [d.explain] : []);
        body = pages.map(p => `<img class="page-img" loading="lazy" src="${pageSrc(p)}" alt="Страница ${p} учебника">`).join('');
      }
      const isDone = !!state.done[d.id];
      const mats = dialogueMaterials(d);
      const list = allDialogues(); const i = list.findIndex(x => x.id === d.id); const next = list[i + 1];
      view.innerHTML = `
        <div class="dhead"><span class="ar">${esc(ar(d.ar))}</span>${d.ru ? `<span class="ru">${esc(d.ru)}</span>` : ''}</div>
        ${tabs.length > 1 ? `<div class="seg">${tabs.map(t => `<button data-seg="${t[0]}" class="${t[0] === cur ? 'on' : ''}">${t[1]}</button>`).join('')}</div>` : ''}
        ${body}
        ${mats.length ? `<div class="h2">К этому диалогу</div><div class="mats">${mats.map(matRow).join('')}</div>` : ''}
        <div class="row2">
          <button class="btn ${isDone ? 'ghost' : ''}" id="doneBtn">${svg('check')}${isDone ? 'Пройдено' : 'Отметить пройденным'}</button>
          ${next ? `<button class="btn ghost" id="nextBtn">Дальше ${svg('right')}</button>` : `<button class="btn ghost" id="homeBtn">К главам</button>`}
        </div>`;
      view.onclick = e => {
        const s = e.target.closest('[data-seg]'); if (s) { haptic(); cur = s.dataset.seg; draw(); return; }
        if (e.target.closest('#doneBtn')) {
          state.done[d.id] = !state.done[d.id]; if (!state.done[d.id]) delete state.done[d.id];
          save(); haptic('medium'); toast(state.done[d.id] ? 'Диалог отмечен' : 'Отметка снята'); draw(); return;
        }
        if (e.target.closest('#nextBtn')) { haptic(); location.hash = '#/d/' + next.id; return; }
        if (e.target.closest('#homeBtn')) { location.hash = '#/'; return; }
        const p = e.target.closest('[data-p]'); if (p) { haptic(); location.hash = `#/p/${p.dataset.p}/${encodeURIComponent(p.dataset.t)}`; }
      };
    };
    draw();
  }

  /* ---------------- single book pages (sections) ---------------- */
  function renderPages(pages, title) {
    setChrome(title || 'Страница', 'home', true);
    view.innerHTML = pages.map(p => `<img class="page-img" loading="lazy" src="${pageSrc(p)}" alt="Страница ${p} учебника">`).join('') +
      `<button class="btn ghost" id="openBook">${svg('book')}Открыть в книге</button>`;
    view.onclick = e => { if (e.target.closest('#openBook')) location.hash = '#/book/' + pages[0]; };
  }

  /* ---------------- whole book reader ---------------- */
  function renderBook(n) {
    const total = 154;
    n = Math.max(1, Math.min(total, n));
    setChrome('Книга', 'book', false);
    const toc = [['Предисловие', book.intro[0]]].concat(book.chapters.map(c => [c, c.page])).concat([['Словарь', book.dictPages[0]], ['Приложения: числа, дни, цвета, месяцы', book.appendixPages[0]]]);
    view.innerHTML = `
      <div class="pager">
        <button id="prev" ${n <= 1 ? 'disabled' : ''} aria-label="Предыдущая страница">${svg('left')}</button>
        <div class="num">Стр. <input id="pnum" type="number" inputmode="numeric" min="1" max="${total}" value="${n}"> из ${total}</div>
        <button id="next" ${n >= total ? 'disabled' : ''} aria-label="Следующая страница">${svg('right')}</button>
      </div>
      <img class="page-img" src="${pageSrc(n)}" alt="Страница ${n} учебника">
      <div class="h2">Содержание</div>
      <div class="toc">${toc.map(([t, p]) => typeof t === 'object'
        ? `<button data-go="${p}"><span><span class="ar">${esc(ar(t.ar))}</span><br><span>Глава ${t.n}. ${esc(t.ru)}</span></span><small>${p}</small></button>`
        : `<button data-go="${p}"><span>${esc(t)}</span><small>${p}</small></button>`).join('')}</div>`;
    const go = (k) => { haptic(); history.replaceState(null, '', '#/book/' + k); renderBook(k); };
    view.onclick = e => {
      if (e.target.closest('#prev')) return go(n - 1);
      if (e.target.closest('#next')) return go(n + 1);
      const g = e.target.closest('[data-go]'); if (g) { go(Number(g.dataset.go)); window.scrollTo(0, 0); }
    };
    $('#pnum').addEventListener('change', e => go(Number(e.target.value) || 1));
    // swipe
    const img = $('.page-img', view); let x0 = null;
    img.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    img.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 60) go(n + (dx < 0 ? 1 : -1)); x0 = null; });
    if (n < total) { const pre = new Image(); pre.src = pageSrc(n + 1); }
  }

  /* ---------------- chapter words ---------------- */
  function renderWords(n) {
    const ch = book.chapters.find(c => c.n === n); if (!ch) { location.hash = '#/'; return; }
    setChrome(`Глава ${n} · Слова`, 'home', true);
    const list = chapterVocab(ch);
    view.innerHTML = `<div class="dhead"><span class="ar">${esc(ar(ch.ar))}</span><span class="ru">${esc(ch.ru)} · ${list.length} слов</span></div>
      <table class="vocab"><thead><tr><th>Значение</th><th class="ar">الكَلِمة الجَدِيدة</th></tr></thead><tbody>${
      list.map(v => `<tr><td class="ru">${esc(v.ru)}</td><td class="ar">${esc(ar(v.ar))}</td></tr>`).join('')}</tbody></table>
      <div class="row2"><button class="btn" id="learn">${svg('cards')}Учить карточками</button><button class="btn ghost" id="src">${svg('page')}В книге</button></div>`;
    view.onclick = e => {
      if (e.target.closest('#learn')) { state.fcChapter = String(n); save(); location.hash = '#/cards'; }
      if (e.target.closest('#src')) location.hash = '#/book/' + ch.dictPage;
    };
  }

  /* ---------------- dictionary ---------------- */
  function renderDict(q = '') {
    setChrome('Словарь', 'dict', false);
    const norm = s => String(s).toLowerCase().replace(HARAKAT, '').replace(/\u0640/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ё/g, 'е');
    const words = allVocab();
    const draw = (q) => {
      const nq = norm(q.trim());
      const list = nq ? words.filter(w => norm(w.ar).includes(nq) || norm(w.ru).includes(nq)) : words;
      $('#dres').innerHTML = list.length
        ? `<table class="vocab"><thead><tr><th>Значение</th><th class="ar">الكَلِمة</th></tr></thead><tbody>${list.map(v => `<tr><td class="ru">${esc(v.ru)}</td><td class="ar">${esc(ar(v.ar))}</td></tr>`).join('')}</tbody></table>`
        : `<div class="empty">Ничего не найдено. Попробуйте другое слово или посмотрите словарь из книги ниже.</div>`;
    };
    view.innerHTML = `
      <input class="search" id="dq" type="search" placeholder="Поиск по-русски или по-арабски" value="${esc(q)}">
      <div id="dres"></div>
      <div class="h2">Словарь из учебника</div>
      <div class="toc">${book.chapters.map(c => `<button data-go="${c.dictPage}"><span>Глава ${c.n}. ${esc(c.ru)}</span><small>${svg('page')}</small></button>`).join('')}</div>`;
    draw(q);
    $('#dq').addEventListener('input', e => draw(e.target.value));
    view.onclick = e => { const g = e.target.closest('[data-go]'); if (g) location.hash = '#/book/' + g.dataset.go; };
  }

  /* ---------------- flashcards ---------------- */
  function renderCards() {
    setChrome('Карточки', 'cards', false);
    const chs = book.chapters.filter(c => chapterVocab(c).length);
    const pool = allVocab().filter(v => state.fcChapter === 'all' || String(v.ch) === String(state.fcChapter));
    const st = (v) => state.cards[vkey(v.ar)];
    let counts;
    const recount = () => { counts = { new: pool.filter(v => st(v) !== 'known').length, hard: pool.filter(v => st(v) === 'hard').length, all: pool.length, known: pool.filter(v => st(v) === 'known').length }; };
    recount();
    const mode = state.fcMode || 'new';
    let deck = pool.filter(v => mode === 'all' ? true : mode === 'hard' ? st(v) === 'hard' : st(v) !== 'known');
    deck = deck.sort(() => Math.random() - .5);
    let i = 0, learned = 0;
    const head = () => `
      <select class="select" id="fch">
        <option value="all">Все главы</option>
        ${chs.map(c => `<option value="${c.n}" ${String(state.fcChapter) === String(c.n) ? 'selected' : ''}>Глава ${c.n}. ${esc(c.ru)}</option>`).join('')}
      </select>
      <div class="seg">
        <button data-mode="new" class="${mode === 'new' ? 'on' : ''}">Не выучено · ${counts.new}</button>
        <button data-mode="hard" class="${mode === 'hard' ? 'on' : ''}">Сложные · ${counts.hard}</button>
        <button data-mode="all" class="${mode === 'all' ? 'on' : ''}">Все · ${counts.all}</button>
      </div>
      <div class="progress fc-prog"><i style="width:${counts.all ? Math.round(counts.known / counts.all * 100) : 0}%"></i></div>
      <div class="fc-meta">Выучено ${counts.known} из ${counts.all}</div>`;
    const bind = () => {
      $('#fch').onchange = e => { state.fcChapter = e.target.value; save(); renderCards(); };
      view.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { haptic(); state.fcMode = b.dataset.mode; save(); renderCards(); });
    };
    const draw = () => {
      if (!deck.length) {
        const msg = mode === 'hard' ? 'Сложных слов нет. Слова попадают сюда, когда вы нажимаете «Повторить».'
          : mode === 'new' ? 'Все слова выучены. Откройте «Все», чтобы повторить их ещё раз.' : 'В этой главе пока нет слов.';
        view.innerHTML = head() + `<div class="empty">${msg}</div>`; bind(); return;
      }
      if (i >= deck.length) {
        view.innerHTML = head() + `<div class="empty"><b>Колода пройдена.</b><br>Отмечено как выученные: ${learned}</div><button class="btn" id="again">Пройти ещё раз</button>`;
        bind(); $('#again').onclick = renderCards; return;
      }
      const v = deck[i], s = st(v);
      view.innerHTML = head() + `
        <div class="fc-meta">${i + 1} / ${deck.length}${s === 'hard' ? ' · сложное' : s === 'known' ? ' · выучено' : ''}</div>
        <div class="fc-wrap"><div class="fc" id="fc">
          <div class="front"><div class="ar">${esc(ar(v.ar))}</div><small>Нажмите, чтобы перевернуть</small></div>
          <div class="back">${esc(v.ru)}<small>Глава ${v.ch}</small></div>
        </div></div>
        <div class="row2">
          <button class="btn ghost" id="again1">Повторить</button>
          <button class="btn" id="know">${svg('check')}Знаю</button>
        </div>`;
      bind();
      $('#fc').onclick = () => { haptic(); $('#fc').classList.toggle('flip'); };
      $('#know').onclick = () => { haptic('medium'); if (st(v) !== 'known') learned++; state.cards[vkey(v.ar)] = 'known'; save(); recount(); i++; draw(); };
      $('#again1').onclick = () => { haptic(); state.cards[vkey(v.ar)] = 'hard'; save(); recount(); deck.push(v); i++; draw(); };
    };
    draw();
  }

  /* ---------------- settings ---------------- */
  function renderSettings() {
    setChrome('Настройки', 'settings', false);
    const opt = (key, val, label) => `<button data-k="${key}" data-v="${val}" class="${String(state[key]) === String(val) ? 'on' : ''}">${label}</button>`;
    view.innerHTML = `
      <div class="card">
        <div class="set"><label>Тема</label><div class="opts">${opt('theme', 'auto', 'Авто')}${opt('theme', 'light', 'Светлая')}${opt('theme', 'dark', 'Тёмная')}</div></div>
        <div class="set"><label>Размер арабского текста</label><div class="opts">${opt('scale', 0.85, 'A−')}${opt('scale', 1, 'A')}${opt('scale', 1.2, 'A+')}${opt('scale', 1.4, 'A++')}</div></div>
        <div class="set"><label>Огласовки (харакаты)<small>Выключите, чтобы тренировать чтение без подсказок</small></label><button class="switch ${state.harakat ? 'on' : ''}" id="hk" aria-label="Огласовки"></button></div>
        <div class="preview ar">${esc(ar('السَّلامُ عَلَيْكُم وَرَحْمَةُ اللّٰهِ'))}</div>
      </div>
      <div class="card">
        <div class="set"><label>Пройденные диалоги<small>Отмечено: ${Object.keys(state.done).length} из ${allDialogues().length}</small></label><button class="chip" id="reset">Сбросить</button></div>
        <div class="set"><label>Карточки<small>Выучено слов: ${Object.values(state.cards).filter(x => x === 'known').length}</small></label><button class="chip" id="resetCards">Сбросить</button></div>
      </div>
      <div class="about">
        <img src="assets/logo-navy.png" alt="" onerror="this.remove()"><br>
        Учебник «Хуна Аль-Арабия», том 1<br>Академия арабского языка HUNA ARABIC<br>
        <a class="link" href="https://t.me/huna_arabic" id="tgLink">Telegram-канал академии</a>
      </div>`;
    if (document.documentElement.getAttribute('data-theme') === 'dark' || (state.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)) {
      const im = $('.about img'); if (im) im.src = 'assets/logo-white.png';
    }
    view.onclick = e => {
      const b = e.target.closest('[data-k]');
      if (b) { haptic(); const k = b.dataset.k; state[k] = k === 'scale' ? Number(b.dataset.v) : b.dataset.v; save(); applyTheme(); renderSettings(); return; }
      if (e.target.closest('#hk')) { haptic(); state.harakat = !state.harakat; save(); renderSettings(); return; }
      if (e.target.closest('#resetCards')) {
        const doReset = () => { state.cards = {}; save(); toast('Карточки сброшены'); renderSettings(); };
        if (tg && tg.showConfirm) tg.showConfirm('Сбросить отметки о выученных словах?', ok => ok && doReset());
        else if (confirm('Сбросить отметки о выученных словах?')) doReset();
        return;
      }
      if (e.target.closest('#reset')) {
        const doReset = () => { state.done = {}; save(); toast('Прогресс сброшен'); renderSettings(); };
        if (tg && tg.showConfirm) tg.showConfirm('Сбросить все отметки о пройденных диалогах?', ok => ok && doReset());
        else if (confirm('Сбросить все отметки о пройденных диалогах?')) doReset();
        return;
      }
      if (e.target.closest('#tgLink') && tg && tg.openTelegramLink) { e.preventDefault(); tg.openTelegramLink('https://t.me/huna_arabic'); }
    };
  }

  /* ---------------- share ---------------- */
  $('#shareBtn').addEventListener('click', () => {
    haptic();
    const text = 'Учебник арабского языка «Хуна Аль-Арабия» — диалоги, словарь и карточки';
    const url = (tg && tg.initDataUnsafe && tg.initDataUnsafe.receiver) ? '' : location.href.split('#')[0];
    if (tg && tg.openTelegramLink) {
      tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(window.SHARE_URL || url) + '&text=' + encodeURIComponent(text));
    } else if (navigator.share) {
      navigator.share({ title: 'Хуна Аль-Арабия', text, url }).catch(() => {});
    } else {
      try { navigator.clipboard.writeText(url); toast('Ссылка скопирована'); } catch (e) {}
    }
  });

  /* ---------------- start ---------------- */
  loadLocal();
  applyTheme();
  if (tg) {
    try {
      tg.ready(); tg.expand();
      tg.BackButton && tg.BackButton.onClick(goBack);
      tg.onEvent && tg.onEvent('themeChanged', applyTheme);
      document.body.classList.add('in-telegram');
    } catch (e) {}
  }
  window.addEventListener('hashchange', route);
  loadCloud(() => { applyTheme(); route(); });
})();
