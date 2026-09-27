/* =========================================================
   大阪冬旅｜旅行規劃 APP  v1.1（手機版＋網站版）
   純原生 JavaScript，資料存在瀏覽器 localStorage
   ========================================================= */
(function () {
  'use strict';

  const STORAGE_KEY = 'travel-planner:v1';
  const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

  /* ---------- 圖示（Lucide 風格 stroke icon） ---------- */
  const ICONS = {
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    translate: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
    map: '<path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z"/><path d="M9 4v13.5"/><path d="M15 6.5V20"/>',
    dollar: '<path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    suitcase: '<rect x="5" y="6" width="14" height="15" rx="2"/><path d="M9 6V3h6v3"/><path d="M10 10v7"/><path d="M14 10v7"/>',
    checklist: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m6.5 8 1.5 1.5L10.5 7"/><path d="M13 8.5h5"/><path d="m6.5 15 1.5 1.5 2.5-2.5"/><path d="M13 15.5h5"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    pin: '<path d="M20 10c0 5-8 12-8 12s-8-7-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
    bus: '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16"/><path d="M8 15h.01"/><path d="M16 15h.01"/><path d="M7 18v3"/><path d="M17 18v3"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    food: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
    bed: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    dot: '<circle cx="12" cy="12" r="3"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    qr: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><path d="M15 15h2v2h-2z"/><path d="M19 19h2v2h-2z"/><path d="M15 19h1"/><path d="M19 15h2"/>',
    ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
    nav: '<path d="M3 11 22 2l-9 19-2-8z"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    train: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14"/><path d="m8 21 2-4"/><path d="m16 21-2-4"/>',
    arrowUp: '<path d="M12 20V4"/><path d="m6 10 6-6 6 6"/>',
    locate: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'
  };
  const icon = (name, cls) => `<svg class="i${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  const CATEGORIES = [
    { id: '交通', icon: 'bus' },
    { id: '景點', icon: 'camera' },
    { id: '餐廳', icon: 'food' },
    { id: '住宿', icon: 'bed' },
    { id: '購物', icon: 'bag' },
    { id: '其他', icon: 'dot' }
  ];
  const catIcon = (c) => (CATEGORIES.find((x) => x.id === c) || CATEGORIES[5]).icon;

  /* ---------- 工具 ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function parseDate(iso) {
    const [y, m, d] = String(iso || '').split('-').map(Number);
    return y ? new Date(y, (m || 1) - 1, d || 1) : new Date();
  }
  function toISO(dt) {
    const p = (n) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
  }
  function addDays(iso, n) { const d = parseDate(iso); d.setDate(d.getDate() + n); return toISO(d); }
  function md(iso) { const d = parseDate(iso); return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`; }
  function mdw(iso) { return iso ? `${md(iso)}（${WEEK[parseDate(iso).getDay()]}）` : ''; }
  function diffDays(a, b) { return Math.round((parseDate(b) - parseDate(a)) / 86400000); }
  function period(t) {
    if (!t) return '未定';
    const h = parseInt(t.split(':')[0], 10);
    return h < 12 ? '上午' : h < 18 ? '下午' : '晚上';
  }
  const safeUrl = (u) => (/^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '');
  const mapsUrl = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);

  /* ---------- 預設資料 ---------- */
  function defaultState() {
    const start = '2026-12-21';
    return {
      v: 1,
      trip: { name: '大阪冬旅', en: 'Osaka', from: '台北', to: '大阪', startDate: start, days: 5 },
      items: [
        { id: uid(), day: 0, time: '16:15', category: '交通', title: '抵達關西機場第一航廈', place: '關西國際機場 第一航廈', note: '備註（例如：換票／轉乘）' },
        { id: uid(), day: 0, time: '16:45', category: '交通', title: '南海電鐵售票處兌換 rapi:t 車票', place: '關西空港駅 南海電鐵售票處', note: '兌換來回票（回程券保留）' },
        { id: uid(), day: 0, time: '17:05', category: '交通', title: '搭乘南海 rapi:t 前往難波', place: '關西空港駅', note: '約 35 分鐘抵達難波' },
        { id: uid(), day: 0, time: '17:45', category: '交通', title: '難波站步行至飯店入住', place: '難波駅', note: '辦理入住、放行李' }
      ],
      todos: [
        { id: uid(), text: '填寫 Visit Japan Web 入境資料', done: false },
        { id: uid(), text: '購買 eSIM／網卡', done: false },
        { id: uid(), text: '兌換日幣現金', done: false },
        { id: uid(), text: '投保旅遊平安險', done: false },
        { id: uid(), text: '預訂南海 rapi:t 車票', done: true },
        { id: uid(), text: '確認住宿訂單', done: true }
      ],
      flights: [
        { id: uid(), leg: '去程', date: start, from: 'TPE', fromName: '桃園機場', to: 'KIX', toName: '關西 第一航廈', dep: '', arr: '', flightNo: '', pnr: '', seat: '', baggage: '', ticket: '' },
        { id: uid(), leg: '回程', date: addDays(start, 4), from: 'KIX', fromName: '關西機場', to: 'TPE', toName: '桃園機場', dep: '', arr: '', flightNo: '', pnr: '', seat: '', baggage: '', ticket: '' }
      ],
      entry: { steps: [false, false, false, false, false], qr: '' },
      stays: [
        { id: uid(), name: '', address: '', checkIn: start, checkInTime: '', checkOut: addDays(start, 4), checkOutTime: '', orderNo: '', roomType: '', phone: '', platform: '', photo: '' }
      ],
      bag: [
        { id: uid(), name: '證件與錢包', items: ['護照', '電子機票', '日幣現金', '信用卡'] },
        { id: uid(), name: '衣物', items: ['保暖外套', '圍巾與手套', '換洗衣物', '好走的鞋'] },
        { id: uid(), name: '電子產品', items: ['手機充電器', '行動電源', 'eSIM／網卡'] },
        { id: uid(), name: '盥洗與藥品', items: ['牙刷牙膏', '保養品', '常備藥品'] }
      ].map((g) => ({ ...g, items: g.items.map((t) => ({ id: uid(), text: t, done: false })) })),
      spots: [
        { name: '梅田', en: 'UMEDA', station: '大阪站／梅田站', x: 150, y: 16, w: 120, tx: 160, ty: 72 },
        { name: '大阪城', en: 'OSAKA CASTLE', station: '森之宮站', x: 262, y: 118, w: 116, tx: 290, ty: 174 },
        { name: '環球影城', en: 'UNIVERSAL CITY', station: '環球城站', x: 12, y: 150, w: 122, tx: 34, ty: 206 },
        { name: '海遊館・天保山', en: 'OSAKA PORT', station: '大阪港站', x: 12, y: 318, w: 132, tx: 34, ty: 374 },
        { name: '心齋橋・難波', en: 'MINAMI', station: '心齋橋站／難波站', x: 130, y: 214, w: 136, tx: 140, ty: 270 },
        { name: '日本橋・黑門', en: 'NIPPOMBASHI', station: '日本橋站', x: 250, y: 318, w: 128, tx: 280, ty: 374 },
        { name: '天王寺・新世界', en: 'TENNOJI', station: '惠美須町站／天王寺站', x: 140, y: 404, w: 136, tx: 144, ty: 460 }
      ],
      ideas: [],
      ui: { day: 0, todoTab: 'todo', showDone: true, spot: 4 }
    };
  }

  /* ---------- 儲存 ---------- */
  let state = load();

  function load() {
    const base = defaultState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      const saved = JSON.parse(raw);
      return { ...base, ...saved, trip: { ...base.trip, ...saved.trip }, ui: { ...base.ui, ...saved.ui }, entry: { ...base.entry, ...saved.entry } };
    } catch (e) {
      return base;
    }
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      toast('儲存失敗：瀏覽器空間可能不足（圖片太多？）');
    }
  }
  function commit() { save(); render(); }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-show'), 2200);
  }

  /* ---------- 圖片壓縮（存進 localStorage 前先縮小） ---------- */
  function compressImage(file, max, quality) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) return reject(new Error('不是圖片檔'));
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const s = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * s);
          c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', quality || 0.8));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* =========================================================
     Bottom sheet / 表單
     ========================================================= */
  let sheetSubmit = null;
  let sheetDelete = null;

  function openSheet(title, html, onSubmit) {
    $('#sheetTitle').textContent = title;
    $('#sheetBody').innerHTML = html;
    $('#sheet').hidden = false;
    $('#sheetBackdrop').hidden = false;
    document.body.style.overflow = 'hidden';
    sheetSubmit = onSubmit || null;
    const first = $('#sheetBody input, #sheetBody select, #sheetBody textarea, #sheetBody button');
    if (first) setTimeout(() => first.focus(), 50);
  }
  function closeSheet() {
    $('#sheet').hidden = true;
    $('#sheetBackdrop').hidden = true;
    $('#sheetBody').innerHTML = '';
    document.body.style.overflow = '';
    sheetSubmit = null;
    sheetDelete = null;
  }

  /** 依欄位設定產生表單 HTML */
  function formHTML(fields, opts) {
    opts = opts || {};
    const fieldHTML = (f) => {
      const id = 'f_' + f.name;
      const cls = 'field' + (f.full ? ' field--full' : '');
      let control;
      if (f.type === 'select') {
        control = `<select class="field__input" id="${id}" name="${f.name}">${f.options.map((o) => {
          const val = typeof o === 'object' ? o.value : o;
          const label = typeof o === 'object' ? o.label : o;
          return `<option value="${esc(val)}"${String(val) === String(f.value) ? ' selected' : ''}>${esc(label)}</option>`;
        }).join('')}</select>`;
      } else if (f.type === 'textarea') {
        control = `<textarea class="field__input" id="${id}" name="${f.name}" placeholder="${esc(f.placeholder || '')}">${esc(f.value || '')}</textarea>`;
      } else if (f.type === 'file') {
        control = `<input class="field__input" id="${id}" name="${f.name}" type="file" accept="image/*">`;
      } else {
        control = `<input class="field__input" id="${id}" name="${f.name}" type="${f.type || 'text'}" value="${esc(f.value || '')}" placeholder="${esc(f.placeholder || '')}"${f.required ? ' required' : ''}${f.min != null ? ` min="${f.min}"` : ''}${f.max != null ? ` max="${f.max}"` : ''}>`;
      }
      return `<div class="${cls}"><label class="field__label" for="${id}">${esc(f.label)}</label>${control}${f.hint ? `<span class="field__hint">${esc(f.hint)}</span>` : ''}</div>`;
    };
    return `<form class="form" id="sheetForm" novalidate>
      <div class="form__grid">${fields.map(fieldHTML).join('')}</div>
      <div class="form__actions">
        <button type="submit" class="btn btn--primary btn--block">${esc(opts.submit || '儲存')}</button>
        ${opts.deletable ? `<button type="button" class="btn btn--danger btn--block" data-action="sheet-delete">${icon('trash')}刪除</button>` : ''}
      </div>
    </form>`;
  }

  /** 開啟表單：onSave(values, form) 可回傳 Promise */
  function openForm(title, fields, onSave, opts) {
    opts = opts || {};
    const del = opts.onDelete || null;
    openSheet(title, formHTML(fields, { submit: opts.submit, deletable: !!del }), async (form) => {
      const values = {};
      for (const f of fields) {
        const el = form.elements[f.name];
        if (!el) continue;
        values[f.name] = f.type === 'file' ? el.files[0] || null : el.value.trim();
      }
      for (const f of fields) {
        if (f.required && !values[f.name]) { toast(`請填寫「${f.label}」`); form.elements[f.name].focus(); return; }
      }
      await onSave(values, form);
    });
    sheetDelete = del;
  }

  function confirmDelete(msg) { return window.confirm(msg || '確定要刪除嗎？'); }

  /* =========================================================
     路由
     ========================================================= */
  const ROUTES = ['itinerary', 'todo', 'map', 'ideas'];
  function currentRoute() {
    const r = (location.hash || '').replace(/^#\/?/, '');
    return ROUTES.includes(r) ? r : 'itinerary';
  }

  function render() {
    const route = currentRoute();
    const view = $('#view');
    const renderer = { itinerary: viewItinerary, todo: viewTodo, map: viewMap, ideas: viewIdeas }[route];
    view.innerHTML = renderer();
    document.querySelectorAll('.tabbar__item').forEach((a) => {
      if (a.dataset.route === route) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.title = `${state.trip.name}｜${{ itinerary: '行程', todo: '待辦與清單', map: '地圖', ideas: '收集箱' }[route]}`;
    const brand = $('#brand');
    if (brand) brand.innerHTML = `${icon('plane')}<span><strong>${esc(state.trip.name)}</strong><small>${esc(state.trip.from)} → ${esc(state.trip.to)}</small></span>`;
    if (route === 'map') layoutMap();
  }

  /* =========================================================
     頁面：行程
     ========================================================= */
  function tripRangeText() {
    const t = state.trip;
    const s = parseDate(t.startDate);
    const e = parseDate(addDays(t.startDate, t.days - 1));
    const mon = (d) => d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const dd = (d) => String(d.getDate()).padStart(2, '0');
    return `${mon(s)} ${dd(s)} - ${mon(e)} ${dd(e)}, ${e.getFullYear()}`;
  }

  function viewItinerary() {
    const t = state.trip;
    const day = Math.min(state.ui.day, t.days - 1);
    const items = state.items.filter((it) => it.day === day).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));

    const tabs = Array.from({ length: t.days }, (_, i) => {
      const iso = addDays(t.startDate, i);
      return `<button class="day-tab" role="tab" aria-selected="${i === day}" data-action="day" data-i="${i}">
        <span class="day-tab__date">${md(iso)}</span><span class="day-tab__label">D${i + 1}</span></button>`;
    }).join('');

    const list = items.length ? `<div class="timeline">${items.map((it) => `
      <div class="tl-row">
        <span class="tl-dot"></span>
        <button class="tl-card" data-action="item-edit" data-id="${it.id}" aria-label="編輯：${esc(it.title)}">
          <span class="tl-left">
            <span class="tl-time"><span class="tl-time__period">${period(it.time)}</span><span class="tl-time__clock">${esc(it.time || '--:--')}</span></span>
            <span class="chip">${icon(catIcon(it.category))}${esc(it.category)}</span>
          </span>
          <span class="tl-right">
            <span class="tl-title">${esc(it.title)}</span>
            ${it.place ? `<span class="tl-meta">${icon('pin')}<span>${esc(it.place)}</span></span>` : ''}
            ${it.note ? `<span class="tl-meta">${icon('alert')}<span>${esc(it.note)}</span></span>` : ''}
          </span>
        </button>
      </div>`).join('')}</div>`
      : `<div class="empty">${icon('calendar')}<span class="empty__title">這天還沒有行程</span><span class="small muted">點下方「新增行程」開始安排</span></div>`;

    return `
      <header class="page-head page-head--flush">
        <div class="page-head__row">
          <div>
            <button class="trip-title" data-action="trip-edit" aria-label="編輯旅程資訊">
              ${icon('plane')}
              <span><span class="trip-title__name">${esc(t.name)}</span><span class="trip-title__en">${esc(t.en)}</span></span>
            </button>
            <div class="page-sub">${tripRangeText()}</div>
          </div>
          <nav class="tools" aria-label="行程工具">
            <a class="tools__btn" href="https://translate.google.com/?sl=zh-TW&tl=ja&op=translate" target="_blank" rel="noopener" aria-label="翻譯（開新分頁）">${icon('translate')}</a>
            <a class="tools__btn" href="#/todo" data-action="goto-todo" aria-label="行前待辦">${icon('calendar')}</a>
            <a class="tools__btn" href="#/map" aria-label="地圖">${icon('map')}</a>
            <button class="tools__btn" data-action="money" aria-label="記帳">${icon('dollar')}</button>
          </nav>
        </div>
      </header>
      <div class="day-tabs" role="tablist" aria-label="選擇日期">${tabs}</div>
      <main class="content content--itinerary">
        <div class="row-between" style="max-width:884px"><h2 class="section-title">D${day + 1} · ${mdw(addDays(t.startDate, day))}</h2><span class="small muted">${items.length} 個行程</span></div>
        ${list}
        <button class="btn btn--dashed" data-action="item-add">${icon('plus')}新增行程</button>
      </main>`;
  }

  function itemForm(it) {
    const t = state.trip;
    const dayOptions = Array.from({ length: t.days }, (_, i) => ({ value: i, label: `D${i + 1} · ${mdw(addDays(t.startDate, i))}` }));
    return [
      { name: 'day', label: '日期', type: 'select', options: dayOptions, value: it.day, full: true },
      { name: 'time', label: '時間', type: 'time', value: it.time },
      { name: 'category', label: '類別', type: 'select', options: CATEGORIES.map((c) => c.id), value: it.category || '交通' },
      { name: 'title', label: '標題', value: it.title, placeholder: '例如：大阪城天守閣', required: true, full: true },
      { name: 'place', label: '地點', value: it.place, placeholder: '例如：大阪城公園駅', full: true },
      { name: 'note', label: '備註', type: 'textarea', value: it.note, placeholder: '換票、轉乘、訂位資訊…', full: true }
    ];
  }

  function editItem(id) {
    const existing = state.items.find((x) => x.id === id);
    const it = existing ? clone(existing) : { day: state.ui.day, time: '', category: '交通', title: '', place: '', note: '' };
    openForm(existing ? '編輯行程' : '新增行程', itemForm(it), (v) => {
      const data = { ...it, ...v, day: parseInt(v.day, 10) };
      if (existing) Object.assign(existing, data);
      else state.items.push({ id: uid(), ...data });
      state.ui.day = data.day;
      closeSheet(); commit(); toast(existing ? '已更新行程' : '已新增行程');
    }, existing ? { onDelete: () => { state.items = state.items.filter((x) => x.id !== id); closeSheet(); commit(); toast('已刪除行程'); } } : null);
  }

  function editTrip() {
    const t = state.trip;
    const fields = [
      { name: 'name', label: '旅程名稱', value: t.name, required: true, full: true },
      { name: 'en', label: '英文名稱', value: t.en },
      { name: 'days', label: '天數', type: 'number', value: t.days, min: 1, max: 30 },
      { name: 'from', label: '出發地', value: t.from },
      { name: 'to', label: '目的地', value: t.to },
      { name: 'startDate', label: '出發日期', type: 'date', value: t.startDate, required: true, full: true }
    ];
    openForm('旅程資訊', fields, (v) => {
      const days = Math.max(1, Math.min(30, parseInt(v.days, 10) || 1));
      Object.assign(state.trip, { ...v, days });
      state.ui.day = Math.min(state.ui.day, days - 1);
      closeSheet(); commit(); toast('已更新旅程資訊');
    });
    // 追加資料管理區
    $('#sheetBody').insertAdjacentHTML('beforeend', `
      <div class="divider"></div>
      <h3 class="section-title">資料管理</h3>
      <p class="small muted" style="margin:0">資料只存在這台裝置的瀏覽器。換手機或清除瀏覽資料前，記得先匯出備份。</p>
      <div class="menu-list">
        <button type="button" class="btn btn--block" data-action="data-export">${icon('download')}匯出備份（JSON）</button>
        <label class="btn btn--block" for="importFile">${icon('upload')}匯入備份</label>
        <input type="file" id="importFile" accept="application/json,.json" class="sr-only" data-action="data-import">
        <button type="button" class="btn btn--danger btn--block" data-action="data-reset">${icon('trash')}清除所有資料，恢復範例</button>
      </div>`);
  }

  /* =========================================================
     頁面：待辦與清單
     ========================================================= */
  const TODO_TABS = [
    { id: 'todo', label: '行前待辦' }, { id: 'flight', label: '班機' }, { id: 'entry', label: '入國登記' },
    { id: 'stay', label: '住宿' }, { id: 'bag', label: '行李' }
  ];

  function viewTodo() {
    const tab = state.ui.todoTab;
    const body = { todo: todoTab, flight: flightTab, entry: entryTab, stay: stayTab, bag: bagTab }[tab] || todoTab;
    return `
      <header class="page-head page-head--flush">
        <h1 class="page-title">待辦與清單</h1>
        <div class="page-sub">${esc(state.trip.name)} · ${tripRangeText()}</div>
      </header>
      <div class="seg-tabs" role="tablist" aria-label="清單分類">
        ${TODO_TABS.map((t) => `<button class="seg-tab" role="tab" aria-selected="${t.id === tab}" data-action="seg" data-tab="${t.id}">${t.label}</button>`).join('')}
      </div>
      <main class="content content--${tab}">${body()}</main>`;
  }

  function progressHTML(label, done, total, unit) {
    const pct = total ? Math.round((done / total) * 100) : 0;
    return `<div class="card progress">
      <div class="row-between"><strong>${label}</strong><strong class="small">${unit} ${done} / ${total}</strong></div>
      <div class="progress__bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${label}"><div class="progress__fill" style="width:${pct}%"></div></div>
    </div>`;
  }

  function checkRow(opts) {
    return `<div class="check-row${opts.done ? ' is-done' : ''}">
      <button class="check-row__box" role="checkbox" aria-checked="${opts.done}" aria-label="${esc(opts.text)}" data-action="${opts.action}" ${opts.data}>${icon('check')}</button>
      <span class="check-row__text" data-action="${opts.action}" ${opts.data}>${esc(opts.text)}</span>
      ${opts.delAction ? `<button class="check-row__del" aria-label="刪除：${esc(opts.text)}" data-action="${opts.delAction}" ${opts.data}>${icon('x')}</button>` : ''}
    </div>`;
  }

  function todoTab() {
    const pending = state.todos.filter((t) => !t.done);
    const done = state.todos.filter((t) => t.done);
    const show = state.ui.showDone;
    return `
      ${progressHTML('行前準備進度', done.length, state.todos.length, '已完成')}
      <div class="row-between">
        <h2 class="section-title">待辦事項（${pending.length}）</h2>
        <button class="switch" role="switch" aria-checked="${show}" data-action="toggle-showdone">顯示已完成<span class="switch__track"><span class="switch__knob"></span></span></button>
      </div>
      <div class="list">
        ${pending.map((t) => checkRow({ text: t.text, done: false, action: 'todo-toggle', delAction: 'todo-del', data: `data-id="${t.id}"` })).join('')}
        ${!pending.length ? '<div class="empty"><span class="empty__title">待辦都完成了，準備出發！</span></div>' : ''}
      </div>
      ${show && done.length ? `<h2 class="section-title small muted" style="font-size:15px">已完成（${done.length}）</h2>
        <div class="list">${done.map((t) => checkRow({ text: t.text, done: true, action: 'todo-toggle', delAction: 'todo-del', data: `data-id="${t.id}"` })).join('')}</div>` : ''}
      ${!show && done.length ? `<p class="small muted" style="text-align:center;margin:0">已隱藏 ${done.length} 項已完成待辦</p>` : ''}
      <form class="row-between" data-form="todo-add" style="gap:8px">
        <label for="todoInput" class="sr-only">新增待辦</label>
        <input id="todoInput" name="text" class="field__input" placeholder="新增待辦，例如：預約美容院" autocomplete="off">
        <button class="btn btn--primary" type="submit" aria-label="新增待辦">${icon('plus')}</button>
      </form>`;
  }

  function flightTab() {
    return state.flights.map((f) => {
      const kv = (k, v) => `<div class="kv__item"><span class="kv__k">${k}</span><span class="kv__v${v ? '' : ' is-empty'}">${esc(v || '尚未填寫')}</span></div>`;
      return `<article class="card card--pad" style="display:flex;flex-direction:column;gap:14px">
        <div class="row-between"><span class="tag${f.leg === '回程' ? ' tag--blue' : ''}">${esc(f.leg)}</span><strong class="small">${f.date ? parseDate(f.date).getFullYear() + '/' + mdw(f.date) : '日期未定'}</strong></div>
        <div class="route">
          <div class="route__end"><span class="route__code">${esc(f.from)}</span><span class="route__name">${esc(f.fromName)}</span><span class="route__time">${esc(f.dep || '--:--')}</span></div>
          <div class="route__mid">${icon('plane')}</div>
          <div class="route__end route__end--r"><span class="route__code">${esc(f.to)}</span><span class="route__name">${esc(f.toName)}</span><span class="route__time">${esc(f.arr || '--:--')}</span></div>
        </div>
        <div class="divider"></div>
        <div class="kv">${kv('航班', f.flightNo)}${kv('訂位代號', f.pnr)}${kv('座位', f.seat)}${kv('託運行李', f.baggage)}</div>
        <div class="btn-row">
          ${safeUrl(f.ticket) ? `<a class="btn btn--sm" href="${esc(safeUrl(f.ticket))}" target="_blank" rel="noopener">${icon('ticket')}電子機票</a>` : `<button class="btn btn--sm" data-action="flight-edit" data-id="${f.id}">${icon('ticket')}加機票連結</button>`}
          <button class="btn btn--sm" data-action="flight-edit" data-id="${f.id}">${icon('edit')}編輯</button>
        </div>
      </article>`;
    }).join('');
  }

  function editFlight(id) {
    const f = state.flights.find((x) => x.id === id);
    if (!f) return;
    openForm(`編輯${f.leg}班機`, [
      { name: 'date', label: '日期', type: 'date', value: f.date, full: true },
      { name: 'from', label: '出發機場代碼', value: f.from, placeholder: 'TPE' },
      { name: 'to', label: '抵達機場代碼', value: f.to, placeholder: 'KIX' },
      { name: 'fromName', label: '出發機場', value: f.fromName },
      { name: 'toName', label: '抵達機場', value: f.toName },
      { name: 'dep', label: '起飛時間', type: 'time', value: f.dep },
      { name: 'arr', label: '抵達時間', type: 'time', value: f.arr },
      { name: 'flightNo', label: '航班編號', value: f.flightNo, placeholder: '例如：BR132' },
      { name: 'pnr', label: '訂位代號', value: f.pnr },
      { name: 'seat', label: '座位', value: f.seat },
      { name: 'baggage', label: '託運行李', value: f.baggage, placeholder: '例如：23kg' },
      { name: 'ticket', label: '電子機票連結', type: 'url', value: f.ticket, placeholder: 'https://', full: true, hint: '可貼航空公司或雲端硬碟的連結' }
    ], (v) => {
      v.from = v.from.toUpperCase(); v.to = v.to.toUpperCase();
      Object.assign(f, v); closeSheet(); commit(); toast('已更新班機');
    });
  }

  const ENTRY_STEPS = ['建立帳號並登入', '登錄本人（及同行家人）護照資料', '登錄入境、回國預定', '填寫入境審查與海關申報', '取得 QR Code 並截圖保存'];

  function entryTab() {
    const e = state.entry;
    return `
      <article class="card card--pad" style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;gap:10px">${icon('globe')}<h2 class="section-title" style="font-size:20px">Visit Japan Web</h2></div>
        <p class="small muted" style="margin:0;line-height:1.6">日本入境審查與海關申報的線上登錄，出發前填好，抵達時出示 QR Code。</p>
        <a class="btn btn--primary btn--block" href="https://www.vjw.digital.go.jp/" target="_blank" rel="noopener">開啟 Visit Japan Web ${icon('external')}</a>
      </article>
      ${progressHTML('登錄步驟', e.steps.filter(Boolean).length, ENTRY_STEPS.length, '已完成')}
      <ol class="steps">
        ${ENTRY_STEPS.map((s, i) => `<li><div class="check-row${e.steps[i] ? ' is-done' : ''}">
          <button class="step-num" role="checkbox" aria-checked="${!!e.steps[i]}" aria-label="步驟 ${i + 1}：${s}" data-action="step-toggle" data-i="${i}">${e.steps[i] ? icon('check') : i + 1}</button>
          <span class="check-row__text" data-action="step-toggle" data-i="${i}">${s}</span></div></li>`).join('')}
      </ol>
      <div class="qr-wrap">
        <div class="qr-box">${e.qr ? `<img src="${e.qr}" alt="入境 QR Code 截圖">` : icon('qr')}</div>
        <strong>入境 QR Code</strong>
        <div class="btn-row" style="width:100%">
          <label class="btn btn--sm" for="qrFile">${icon('upload')}${e.qr ? '更換截圖' : '上傳截圖'}</label>
          ${e.qr ? `<button class="btn btn--sm btn--danger" data-action="qr-clear">${icon('trash')}移除</button>` : '<span></span>'}
        </div>
        <input type="file" id="qrFile" accept="image/*" class="sr-only" data-action="qr-upload">
      </div>`;
  }

  function stayTab() {
    return state.stays.map((s) => {
      const nights = s.checkIn && s.checkOut ? diffDays(s.checkIn, s.checkOut) : 0;
      const kv = (k, v) => `<div class="kv__item"><span class="kv__k">${k}</span><span class="kv__v${v ? '' : ' is-empty'}">${esc(v || '尚未填寫')}</span></div>`;
      const q = s.address || s.name;
      return `<article class="card" style="overflow:hidden">
        <div class="stay__photo" ${s.photo ? `style="background-image:url('${s.photo}')"` : ''}>${s.photo ? '' : icon('image') + '<span style="margin-left:6px">飯店照片</span>'}</div>
        <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
          <div>
            <h2 class="section-title" style="font-size:20px">${esc(s.name || '尚未填寫飯店名稱')}</h2>
            <div class="tl-meta" style="margin-top:6px">${icon('pin')}<span>${esc(s.address || '尚未填寫地址')}</span></div>
          </div>
          <div class="stay__dates">
            <div class="stay__date"><span class="kv__k">入住</span><strong>${esc(mdw(s.checkIn) || '未定')}</strong><span class="small">${esc(s.checkInTime || '--:--')}</span></div>
            <div class="stay__nights">${nights > 0 ? nights + ' 晚' : '—'}</div>
            <div class="stay__date stay__date--r"><span class="kv__k">退房</span><strong>${esc(mdw(s.checkOut) || '未定')}</strong><span class="small">${esc(s.checkOutTime || '--:--')}</span></div>
          </div>
          <div class="kv">${kv('訂單編號', s.orderNo)}${kv('房型', s.roomType)}${kv('電話', s.phone)}${kv('訂房平台', s.platform)}</div>
          <div class="btn-row">
            ${q ? `<a class="btn btn--primary btn--sm" href="${mapsUrl(q)}" target="_blank" rel="noopener">${icon('nav')}導航</a>` : `<button class="btn btn--primary btn--sm" data-action="need-info" data-msg="請先填寫飯店地址">${icon('nav')}導航</button>`}
            ${s.phone ? `<a class="btn btn--sm" href="tel:${esc(s.phone.replace(/[^\d+]/g, ''))}">${icon('phone')}撥打電話</a>` : `<button class="btn btn--sm" data-action="need-info" data-msg="請先填寫飯店電話">${icon('phone')}撥打電話</button>`}
          </div>
          <button class="btn btn--sm btn--block" data-action="stay-edit" data-id="${s.id}">${icon('edit')}編輯住宿資訊</button>
        </div>
      </article>`;
    }).join('') + `<button class="btn btn--dashed" data-action="stay-add">${icon('plus')}新增住宿</button>`;
  }

  function editStay(id) {
    const existing = state.stays.find((x) => x.id === id);
    const s = existing ? clone(existing) : { name: '', address: '', checkIn: state.trip.startDate, checkInTime: '', checkOut: addDays(state.trip.startDate, 1), checkOutTime: '', orderNo: '', roomType: '', phone: '', platform: '', photo: '' };
    openForm(existing ? '編輯住宿' : '新增住宿', [
      { name: 'name', label: '飯店名稱', value: s.name, required: true, full: true },
      { name: 'address', label: '地址', value: s.address, full: true, hint: '導航會用這個地址搜尋 Google 地圖' },
      { name: 'checkIn', label: '入住日期', type: 'date', value: s.checkIn },
      { name: 'checkInTime', label: '入住時間', type: 'time', value: s.checkInTime },
      { name: 'checkOut', label: '退房日期', type: 'date', value: s.checkOut },
      { name: 'checkOutTime', label: '退房時間', type: 'time', value: s.checkOutTime },
      { name: 'orderNo', label: '訂單編號', value: s.orderNo },
      { name: 'roomType', label: '房型', value: s.roomType },
      { name: 'phone', label: '電話', type: 'tel', value: s.phone },
      { name: 'platform', label: '訂房平台', value: s.platform },
      { name: 'photo', label: '飯店照片', type: 'file', full: true, hint: s.photo ? '已有照片，選新檔會取代' : '選填' }
    ], async (v) => {
      const photoFile = v.photo; delete v.photo;
      const data = { ...s, ...v };
      if (photoFile) {
        try { data.photo = await compressImage(photoFile, 900, 0.78); } catch (e) { toast('圖片讀取失敗'); return; }
      }
      if (existing) Object.assign(existing, data); else state.stays.push({ id: uid(), ...data });
      closeSheet(); commit(); toast('已儲存住宿');
    }, existing ? { onDelete: () => { state.stays = state.stays.filter((x) => x.id !== id); closeSheet(); commit(); toast('已刪除住宿'); } } : null);
  }

  function bagTab() {
    let done = 0, total = 0;
    state.bag.forEach((g) => g.items.forEach((it) => { total++; if (it.done) done++; }));
    return progressHTML('打包進度', done, total, '已打包') + state.bag.map((g) => `
      <section style="display:flex;flex-direction:column;gap:8px">
        <div class="row-between">
          <h2 class="section-title" style="font-size:16px">${esc(g.name)} <span class="small muted" style="font-weight:500">${g.items.filter((i) => i.done).length} / ${g.items.length}</span></h2>
          <button class="btn btn--sm" data-action="bag-manage" data-gid="${g.id}" aria-label="管理 ${esc(g.name)}">${icon('edit')}管理</button>
        </div>
        <div class="bag-grid">${g.items.map((it) => checkRow({ text: it.text, done: it.done, action: 'bag-toggle', data: `data-gid="${g.id}" data-id="${it.id}"` })).join('')}</div>
      </section>`).join('') + `<button class="btn btn--dashed" data-action="bag-group-add">${icon('plus')}新增分類</button>`;
  }

  function manageBagGroup(gid) {
    const g = state.bag.find((x) => x.id === gid);
    if (!g) return;
    const html = `
      <form class="form" id="sheetForm">
        <div class="field"><label class="field__label" for="f_name">分類名稱</label><input class="field__input" id="f_name" name="name" value="${esc(g.name)}" required></div>
        <div class="field"><span class="field__label">項目</span>
          <div class="list">${g.items.map((it) => `<div class="check-row"><span class="check-row__text">${esc(it.text)}</span><button type="button" class="check-row__del" aria-label="刪除：${esc(it.text)}" data-action="bag-del" data-gid="${g.id}" data-id="${it.id}">${icon('x')}</button></div>`).join('') || '<span class="small muted">還沒有項目</span>'}</div>
        </div>
        <div class="field"><label class="field__label" for="f_new">新增項目</label><input class="field__input" id="f_new" name="newItem" placeholder="可用逗號一次加多個，例如：襪子, 睡衣"></div>
        <div class="form__actions">
          <button type="submit" class="btn btn--primary btn--block">儲存</button>
          <button type="button" class="btn btn--danger btn--block" data-action="sheet-delete">${icon('trash')}刪除此分類</button>
        </div>
      </form>`;
    openSheet('管理行李清單', html, (form) => {
      const name = form.elements.name.value.trim();
      if (!name) { toast('請填寫分類名稱'); return; }
      g.name = name;
      form.elements.newItem.value.split(/[,，、\n]/).map((s) => s.trim()).filter(Boolean)
        .forEach((text) => g.items.push({ id: uid(), text, done: false }));
      closeSheet(); commit(); toast('已更新行李清單');
    });
    sheetDelete = () => { state.bag = state.bag.filter((x) => x.id !== gid); closeSheet(); commit(); toast('已刪除分類'); };
  }

  /* =========================================================
     頁面：地圖
     ========================================================= */
  function viewMap() {
    const spots = state.spots;
    const sel = Math.min(state.ui.spot, spots.length - 1);
    const cur = spots[sel];
    return `
      <header class="page-head" style="padding-top:28px">
        <div class="page-head__row" style="align-items:flex-end">
          <div><h1 class="page-title">地圖</h1><div class="page-sub">已規劃 ${spots.length} 個地點 · 點地點看附近車站</div></div>
          <button class="btn btn--sm" data-action="city" style="border-radius:22px;height:44px">${icon('pin')}${esc(state.trip.to)}${icon('chevronDown')}</button>
        </div>
      </header>
      <div class="map-page">
        <div class="map-stage-wrap" id="mapWrap">
          <div class="map-stage" id="mapStage">
            <span class="map-bay" aria-hidden="true">大阪灣</span>
            <svg class="map-routes" viewBox="0 0 390 504" fill="none" aria-hidden="true">
              <g stroke="var(--route)" stroke-width="4" stroke-dasharray="8 7" stroke-linecap="round">
                <path d="M70 174 Q 110 70 210 40"/><path d="M210 40 L200 238"/><path d="M200 238 L320 142"/>
                <path d="M200 238 L210 428"/><path d="M210 428 Q 270 360 316 342"/><path d="M76 342 Q 120 270 200 238"/>
              </g>
            </svg>
            ${spots.map((s) => `<span class="station" style="left:${s.tx}px;top:${s.ty}px">${icon('train')}${esc(s.station)}</span>`).join('')}
            ${spots.map((s, i) => `<button class="spot" style="left:${s.x}px;top:${s.y}px;width:${s.w}px" aria-pressed="${i === sel}" data-action="spot" data-i="${i}" aria-label="${i + 1}. ${esc(s.name)}">
              <span class="spot__no">${i + 1}</span><span class="spot__name">${esc(s.name)}</span><span class="spot__en">${esc(s.en)}</span></button>`).join('')}
          </div>
          <button class="icon-btn map-fab" style="top:12px" data-action="map-north" aria-label="北方朝上">${icon('arrowUp')}</button>
          <button class="icon-btn map-fab" style="bottom:26px" data-action="locate" aria-label="在 Google 地圖查看我的位置">${icon('locate')}</button>
        </div>
        <section class="map-sheet" aria-label="地點資訊">
          <div class="map-sheet__handle"></div>
          <div style="display:flex;align-items:center;gap:12px">
            <span class="map-sheet__no">${sel + 1}</span>
            <div style="flex:1;min-width:0"><div class="map-sheet__name">${esc(cur.name)}</div><div class="small muted">${esc(cur.en)}</div></div>
            <button class="icon-btn" data-action="spot-prev" aria-label="上一個地點">${icon('chevronLeft')}</button>
            <button class="icon-btn" data-action="spot-next" aria-label="下一個地點">${icon('chevronRight')}</button>
          </div>
          <div style="display:flex;align-items:center;gap:8px;font-size:14px">${icon('train')}<span class="muted">最近車站</span><strong>${esc(cur.station)}</strong></div>
          <div class="btn-row">
            <a class="btn btn--primary btn--sm" href="${mapsUrl(cur.name.split('・')[0] + ' ' + state.trip.to)}" target="_blank" rel="noopener">${icon('nav')}導航</a>
            <a class="btn btn--sm" href="#/itinerary">在行程中查看</a>
          </div>
        </section>
      </div>`;
  }

  /** 把 390×504 的插畫地圖依螢幕寬度等比縮放 */
  function layoutMap() {
    const wrap = $('#mapWrap'), stage = $('#mapStage');
    if (!wrap || !stage) return;
    const desktop = window.matchMedia('(min-width: 900px)').matches;
    const w = wrap.clientWidth;
    let scale = w / 390;
    if (desktop) {
      // 網站版：地圖填滿可視高度，等比置中
      const h = Math.max(420, window.innerHeight - wrap.getBoundingClientRect().top - 24);
      scale = Math.min(w / 390, h / 504);
      wrap.style.height = h + 'px';
      stage.style.left = Math.round((w - 390 * scale) / 2) + 'px';
      stage.style.top = Math.round((h - 504 * scale) / 2) + 'px';
    } else {
      wrap.style.height = Math.round(504 * scale) + 'px';
      stage.style.left = '0px';
      stage.style.top = '0px';
    }
    stage.style.transform = `scale(${scale})`;
  }
  window.addEventListener('resize', () => { if (currentRoute() === 'map') layoutMap(); });

  /* =========================================================
     頁面：收集箱
     ========================================================= */
  function viewIdeas() {
    return `
      <header class="page-head"><h1 class="page-title">想法收集箱</h1></header>
      <main class="idea-grid">
        ${state.ideas.map((d) => `
          <article class="idea">
            <span class="idea__pin" aria-hidden="true"></span>
            <div class="idea__img">${d.image ? `<img src="${d.image}" alt="">` : `<span class="idea__img-label">${esc(d.title)}</span>`}</div>
            <div class="idea__body">
              <h2 class="idea__title">${esc(d.title)}</h2>
              <span class="idea__meta">${esc([d.category, d.desc].filter(Boolean).join('・') || '未分類')}</span>
              <button class="btn btn--primary" data-action="idea-open" data-id="${d.id}">開始</button>
            </div>
          </article>`).join('')}
        <button class="idea idea--add" data-action="idea-add">${icon('plus')}新增想法</button>
      </main>`;
  }

  function editIdea(id) {
    const existing = state.ideas.find((x) => x.id === id);
    const d = existing ? clone(existing) : { title: '', category: '', desc: '', link: '', image: '' };
    openForm(existing ? '編輯想法' : '新增想法', [
      { name: 'title', label: '標題', value: d.title, required: true, full: true, placeholder: '例如：黑門市場吃海鮮' },
      { name: 'category', label: '分類', value: d.category, placeholder: '美食／景點／購物' },
      { name: 'desc', label: '說明', value: d.desc, placeholder: '一句話備註' },
      { name: 'link', label: '參考連結', type: 'url', value: d.link, placeholder: 'https://', full: true },
      { name: 'image', label: '圖片', type: 'file', full: true, hint: d.image ? '已有圖片，選新檔會取代' : '選填' }
    ], async (v) => {
      const file = v.image; delete v.image;
      const data = { ...d, ...v };
      if (file) {
        try { data.image = await compressImage(file, 700, 0.75); } catch (e) { toast('圖片讀取失敗'); return; }
      }
      if (existing) Object.assign(existing, data); else state.ideas.unshift({ id: uid(), ...data });
      closeSheet(); commit(); toast('已儲存想法');
    }, existing ? { onDelete: () => { state.ideas = state.ideas.filter((x) => x.id !== id); closeSheet(); commit(); toast('已刪除想法'); } } : null);
  }

  function openIdea(id) {
    const d = state.ideas.find((x) => x.id === id);
    if (!d) return;
    openSheet(d.title, `
      ${d.image ? `<img src="${d.image}" alt="" style="border:var(--border);border-radius:12px;max-height:220px;object-fit:cover;width:100%">` : ''}
      ${d.category || d.desc ? `<p class="muted" style="margin:0">${esc([d.category, d.desc].filter(Boolean).join('・'))}</p>` : ''}
      <div class="menu-list">
        <button class="btn btn--primary btn--block" data-action="idea-to-trip" data-id="${d.id}">${icon('calendar')}加入行程</button>
        ${safeUrl(d.link) ? `<a class="btn btn--block" href="${esc(safeUrl(d.link))}" target="_blank" rel="noopener">${icon('link')}開啟參考連結</a>` : ''}
        <button class="btn btn--block" data-action="idea-edit" data-id="${d.id}">${icon('edit')}編輯</button>
      </div>`);
  }

  function ideaToTrip(id) {
    const d = state.ideas.find((x) => x.id === id);
    if (!d) return;
    const cat = CATEGORIES.some((c) => c.id === d.category) ? d.category : '景點';
    const it = { day: state.ui.day, time: '', category: cat, title: d.title, place: '', note: d.desc || '' };
    openForm('加入行程', itemForm(it), (v) => {
      const data = { ...it, ...v, day: parseInt(v.day, 10) };
      state.items.push({ id: uid(), ...data });
      state.ui.day = data.day;
      closeSheet(); commit(); toast(`已加入 D${data.day + 1} 行程`);
    }, { submit: '加入行程' });
  }

  /* =========================================================
     資料匯出／匯入
     ========================================================= */
  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `travel-backup_${toISO(new Date())}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('已匯出備份');
  }
  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !data.trip || !Array.isArray(data.items)) throw new Error('格式不符');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        state = load();
        closeSheet(); render(); toast('已匯入備份');
      } catch (e) { toast('匯入失敗：檔案格式不正確'); }
    };
    reader.readAsText(file);
  }

  /* =========================================================
     事件（事件委派）
     ========================================================= */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.tagName === 'INPUT') return;
    const a = el.dataset.action;
    const id = el.dataset.id;
    const i = el.dataset.i != null ? parseInt(el.dataset.i, 10) : null;

    switch (a) {
      /* 共用 */
      case 'sheet-close': closeSheet(); break;
      case 'sheet-delete': if (sheetDelete && confirmDelete()) sheetDelete(); break;
      case 'need-info': toast(el.dataset.msg); break;
      case 'money': toast('記帳功能規劃中'); break;
      case 'city': toast('目前只有大阪地圖，更多城市規劃中'); break;
      case 'map-north': toast('地圖已是北方朝上'); break;
      case 'locate':
        if (!navigator.geolocation) { toast('這個瀏覽器不支援定位'); break; }
        toast('定位中…');
        navigator.geolocation.getCurrentPosition(
          (p) => window.open(mapsUrl(p.coords.latitude + ',' + p.coords.longitude), '_blank', 'noopener'),
          () => toast('無法取得位置，請確認已允許定位權限'),
          { enableHighAccuracy: true, timeout: 10000 }
        );
        break;
      case 'goto-todo': state.ui.todoTab = 'todo'; save(); break;

      /* 行程 */
      case 'day': state.ui.day = i; commit(); break;
      case 'item-add': editItem(null); break;
      case 'item-edit': editItem(id); break;
      case 'trip-edit': editTrip(); break;
      case 'data-export': exportData(); break;
      case 'data-reset':
        if (confirmDelete('確定要清除所有資料？這個動作無法復原。')) {
          try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
          state = defaultState(); closeSheet(); commit(); toast('已恢復範例資料');
        }
        break;

      /* 待辦 */
      case 'seg': state.ui.todoTab = el.dataset.tab; commit(); break;
      case 'toggle-showdone': state.ui.showDone = !state.ui.showDone; commit(); break;
      case 'todo-toggle': { const t = state.todos.find((x) => x.id === id); if (t) { t.done = !t.done; commit(); } break; }
      case 'todo-del': state.todos = state.todos.filter((x) => x.id !== id); commit(); toast('已刪除待辦'); break;
      case 'flight-edit': editFlight(id); break;
      case 'step-toggle': state.entry.steps[i] = !state.entry.steps[i]; commit(); break;
      case 'qr-clear': if (confirmDelete('移除 QR Code 截圖？')) { state.entry.qr = ''; commit(); } break;
      case 'stay-add': editStay(null); break;
      case 'stay-edit': editStay(id); break;
      case 'bag-toggle': {
        const g = state.bag.find((x) => x.id === el.dataset.gid);
        const it = g && g.items.find((x) => x.id === id);
        if (it) { it.done = !it.done; commit(); }
        break;
      }
      case 'bag-manage': manageBagGroup(el.dataset.gid); break;
      case 'bag-del': {
        const g = state.bag.find((x) => x.id === el.dataset.gid);
        if (g) { g.items = g.items.filter((x) => x.id !== id); save(); manageBagGroup(g.id); render(); }
        break;
      }
      case 'bag-group-add': {
        const g = { id: uid(), name: '新分類', items: [] };
        state.bag.push(g); save(); render(); manageBagGroup(g.id);
        break;
      }

      /* 地圖 */
      case 'spot': state.ui.spot = i; commit(); break;
      case 'spot-prev': state.ui.spot = (state.ui.spot - 1 + state.spots.length) % state.spots.length; commit(); break;
      case 'spot-next': state.ui.spot = (state.ui.spot + 1) % state.spots.length; commit(); break;

      /* 收集箱 */
      case 'idea-add': editIdea(null); break;
      case 'idea-edit': editIdea(id); break;
      case 'idea-open': openIdea(id); break;
      case 'idea-to-trip': ideaToTrip(id); break;
      default: break;
    }
  });

  document.addEventListener('change', async (e) => {
    const a = e.target.dataset && e.target.dataset.action;
    if (a === 'qr-upload' && e.target.files[0]) {
      try { state.entry.qr = await compressImage(e.target.files[0], 900, 0.85); commit(); toast('已儲存 QR Code'); }
      catch (err) { toast('圖片讀取失敗'); }
    }
    if (a === 'data-import' && e.target.files[0]) {
      if (confirmDelete('匯入會覆蓋目前所有資料，確定嗎？')) importData(e.target.files[0]);
      e.target.value = '';
    }
  });

  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (form.id === 'sheetForm') {
      e.preventDefault();
      if (sheetSubmit) sheetSubmit(form);
      return;
    }
    if (form.dataset.form === 'todo-add') {
      e.preventDefault();
      const text = form.elements.text.value.trim();
      if (!text) return;
      state.todos.push({ id: uid(), text, done: false });
      commit();
      const input = $('#todoInput'); if (input) input.focus();
    }
  });

  $('#sheetBackdrop').addEventListener('click', closeSheet);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

  // 底部選單與關閉按鈕的圖示
  document.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = icon(el.dataset.icon); });
  $('[data-action="sheet-close"]').innerHTML = icon('x');

  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
  render();
})();
