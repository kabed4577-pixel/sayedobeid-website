(function () {
  'use strict';
  const KEY = 'obeid_data_v1', PWKEY = 'obeid_pw_v1', DEFPW = 'obeid2026';
  let S, admin = false;
  const $ = s => document.querySelector(s);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Number(n || 0).toLocaleString('en-US');
  const uid = () => Math.random().toString(36).slice(2, 9);

  async function hash(s) {
    try {
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    } catch (e) { return 'p:' + btoa(unescape(encodeURIComponent(s))); }
  }

  /* ---------- storage ---------- */
  let saveT;
  function save() {
    S.updated = Date.now();
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(S)); }
      catch (e) { toast('المساحة ممتلئة، استخدم صورًا أقل أو أصغر'); }
    }, 250);
  }
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2200);
  }

  async function init() {
    let local = null;
    try { local = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    let remote = null;
    try {
      const r = await fetch('menu-data.json?' + Date.now(), { cache: 'no-store' });
      if (r.ok) remote = await r.json();
    } catch (e) {}
    const base = remote || window.DEFAULT_DATA;
    S = (local && (local.updated || 0) > (base.updated || 0)) ? local : base;
    S.settings = S.settings || {}; S.categories = S.categories || []; S.items = S.items || []; S.offers = S.offers || [];
    render();
  }

  /* ---------- render ---------- */
  function thumb(img, icon) {
    return `<div class="thumb">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : esc(icon || '🍽️')}</div>`;
  }
  const priceHtml = p => `<div class="price">${fmt(p)}<small>ل.س</small></div>`;

  function render() {
    const s = S.settings;
    const waNum = String(s.whatsapp || '').replace(/\D/g, '');
    const orderBtn = name => waNum ? `<a class="order" target="_blank" rel="noopener" href="https://wa.me/${waNum}?text=${encodeURIComponent('مرحبًا، أريد طلب: ' + name)}">💬 اطلب</a>` : '';
    document.title = s.name || 'المطعم';
    let h = '';
    if (admin) {
      h += `<div class="adminbar"><b>🛠 وضع التحكم</b>
        <button class="btn sm gold" data-act="addCat">+ قسم</button>
        <button class="btn sm" data-act="addOffer">+ عرض</button>
        <button class="btn sm" data-act="settings">⚙ البيانات</button>
        <button class="btn sm" data-act="export">⬇ تصدير للنشر</button>
        <button class="btn sm" data-act="chpw">🔑 كلمة السر</button>
        <button class="btn sm danger" data-act="logout">خروج</button></div>`;
    }
    h += `<header class="hero"><div class="badge">${esc(s.badge)}</div><h1>${esc(s.name)}</h1><p>${esc(s.tagline)}</p>
      <div class="cta"><a class="btn gold" href="#menu">تصفح القائمة</a>
      ${s.phone ? `<a class="btn" href="tel:${esc(s.phone)}">📞 اتصل بنا</a>` : ''}
      ${s.whatsapp ? `<a class="btn" target="_blank" rel="noopener" href="https://wa.me/${esc(String(s.whatsapp).replace(/\D/g, ''))}">💬 واتساب</a>` : ''}
      </div></header>`;
    if (s.delivery) h += `<div class="delivery"><span class="dic">🛵</span><div><b>خدمة توصيل (دليفري)</b><p>${esc(s.delivery)}</p></div>
      <div class="dbtns">${s.phone ? `<a class="btn sm gold" href="tel:${esc(s.phone)}">📞 اتصل</a>` : ''}${waNum ? `<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${waNum}?text=${encodeURIComponent('مرحبًا، أريد طلب دليفري')}">💬 واتساب</a>` : ''}</div></div>`;

    // Offers
    if (S.offers.length || admin) {
      h += `<div class="wrap"><section id="offers"><div class="sec-title"><span class="ic">🔥</span><h2>العروضات</h2></div><div class="offers">`;
      S.offers.forEach(o => {
        if (admin) {
          h += `<div class="offer edit"><div class="row">
            <div class="thumb" data-act="offerImg" data-id="${o.id}">${o.img ? `<img src="${esc(o.img)}" alt="">` : esc(o.icon || '🔥')}</div>
            <div style="flex:1;min-width:0">
              <input class="fld" data-t="offers" data-id="${o.id}" data-f="title" value="${esc(o.title)}" placeholder="اسم العرض">
              <input class="fld" data-t="offers" data-id="${o.id}" data-f="price" type="number" inputmode="numeric" value="${esc(o.price)}" placeholder="السعر">
            </div></div>
            <textarea class="fld" data-t="offers" data-id="${o.id}" data-f="desc" placeholder="تفاصيل العرض">${esc(o.desc)}</textarea>
            <div class="acts">${o.img ? `<button class="btn sm" data-act="offerImgDel" data-id="${o.id}">إزالة الصورة</button>` : ''}
            <button class="btn sm danger" data-act="delOffer" data-id="${o.id}">حذف العرض</button></div></div>`;
        } else {
          h += `<div class="offer">${thumb(o.img, o.icon || '🔥')}<div class="info"><h3>${esc(o.title)}</h3><p>${esc(o.desc)}</p>${priceHtml(o.price)}${orderBtn(o.title)}</div></div>`;
        }
      });
      h += `</div></section></div>`;
    }

    // Nav
    h += `<nav class="nav" id="menu"><div class="wrap">${S.categories.map(c => `<a class="chip" href="#cat-${c.id}">${esc(c.icon)} ${esc(c.name)}</a>`).join('')}</div></nav>`;

    // Menu
    h += `<div class="wrap">`;
    S.categories.forEach(c => {
      const items = S.items.filter(i => i.cat === c.id);
      h += `<section id="cat-${c.id}">`;
      if (admin) {
        h += `<div class="cat-edit"><input class="fld ico" data-t="categories" data-id="${c.id}" data-f="icon" value="${esc(c.icon)}">
          <input class="fld" data-t="categories" data-id="${c.id}" data-f="name" value="${esc(c.name)}">
          <button class="btn sm danger" data-act="delCat" data-id="${c.id}">حذف القسم</button></div>`;
      } else {
        h += `<div class="sec-title"><span class="ic">${esc(c.icon)}</span><h2>${esc(c.name)}</h2></div>`;
      }
      h += `<div class="grid">`;
      items.forEach(i => {
        if (admin) {
          h += `<div class="card edit"><div class="row">
            <div class="thumb" data-act="itemImg" data-id="${i.id}">${i.img ? `<img src="${esc(i.img)}" alt="">` : esc(c.icon)}</div>
            <div style="flex:1;min-width:0">
              <input class="fld" data-t="items" data-id="${i.id}" data-f="name" value="${esc(i.name)}" placeholder="اسم الصنف">
              <input class="fld" data-t="items" data-id="${i.id}" data-f="price" type="number" inputmode="numeric" value="${esc(i.price)}" placeholder="السعر ل.س">
            </div></div>
            <textarea class="fld" data-t="items" data-id="${i.id}" data-f="desc" placeholder="الوصف">${esc(i.desc)}</textarea>
            <div class="acts">${i.img ? `<button class="btn sm" data-act="itemImgDel" data-id="${i.id}">إزالة الصورة</button>` : ''}
            <button class="btn sm danger" data-act="delItem" data-id="${i.id}">حذف</button></div></div>`;
        } else {
          h += `<div class="card">${thumb(i.img, c.icon)}<div class="info"><h3>${esc(i.name)}</h3><p>${esc(i.desc)}</p>${priceHtml(i.price)}${orderBtn(i.name)}</div></div>`;
        }
      });
      h += `</div>`;
      if (admin) h += `<div class="addbox"><button class="btn sm gold" data-act="addItem" data-id="${c.id}">+ إضافة صنف إلى ${esc(c.name)}</button></div>`;
      h += `</section>`;
    });
    h += `</div>`;

    // Footer
    h += `<footer><h4>${esc(s.name)}</h4>
      ${s.address ? `<p>📍 ${esc(s.address)}</p>` : ''}
      ${s.hours ? `<p>🕒 ${esc(s.hours)}</p>` : ''}
      ${s.phone ? `<p>📞 <a href="tel:${esc(s.phone)}" dir="ltr">${esc(s.phone)}</a></p>` : ''}
      <p style="margin-top:10px;font-size:.8rem">الأسعار بالليرة السورية وقابلة للتغيير</p></footer>`;
    if (!admin && waNum) h += `<a class="wafab" target="_blank" rel="noopener" href="https://wa.me/${waNum}" aria-label="واتساب">💬</a>`;
    if (!admin) h += `<button class="lock" data-act="login" title="دخول المسؤول" aria-label="دخول المسؤول">🔒</button>`;

    const y = window.scrollY;
    $('#app').innerHTML = h;
    window.scrollTo(0, y);
  }

  /* ---------- modal ---------- */
  function modal(title, fields, okText) {
    return new Promise(res => {
      const m = $('#modal');
      m.innerHTML = `<form class="mbox"><h3>${esc(title)}</h3>
        ${fields.map(f => `<label>${esc(f.label)}</label><input class="fld" name="${f.name}" type="${f.type || 'text'}" value="${esc(f.value || '')}" ${f.dir ? `dir="${f.dir}"` : ''} autocomplete="off">`).join('')}
        <div class="acts"><button class="btn gold sm" type="submit">${esc(okText || 'حفظ')}</button><button class="btn sm" type="button" id="mc">إلغاء</button></div></form>`;
      m.hidden = false;
      const f = m.querySelector('form');
      const first = f.querySelector('input'); if (first) setTimeout(() => first.focus(), 50);
      const close = v => { m.hidden = true; m.innerHTML = ''; res(v); };
      f.onsubmit = e => { e.preventDefault(); const o = {}; fields.forEach(x => o[x.name] = f.elements[x.name].value); close(o); };
      m.querySelector('#mc').onclick = () => close(null);
    });
  }

  /* ---------- images ---------- */
  function pickImage() {
    return new Promise(res => {
      const inp = $('#filePick'); inp.value = '';
      inp.onchange = () => {
        const file = inp.files && inp.files[0]; if (!file) return res(null);
        const fr = new FileReader();
        fr.onload = () => {
          const im = new Image();
          im.onload = () => {
            const k = Math.min(1, 700 / Math.max(im.width, im.height));
            const c = document.createElement('canvas');
            c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
            c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
            res(c.toDataURL('image/jpeg', 0.72));
          };
          im.onerror = () => res(null);
          im.src = fr.result;
        };
        fr.readAsDataURL(file);
      };
      inp.click();
    });
  }

  /* ---------- actions ---------- */
  const find = (t, id) => S[t].find(x => x.id === id);
  const actions = {
    async login() {
      const r = await modal('دخول المسؤول', [{ label: 'كلمة السر', name: 'pw', type: 'password', dir: 'ltr' }], 'دخول');
      if (!r) return;
      const stored = localStorage.getItem(PWKEY);
      const ok = stored ? (await hash(r.pw)) === stored : r.pw === DEFPW;
      if (ok) { admin = true; render(); toast('تم الدخول'); } else toast('كلمة السر غير صحيحة');
    },
    logout() { admin = false; render(); },
    async chpw() {
      const r = await modal('تغيير كلمة السر', [{ label: 'كلمة السر الجديدة (4 أحرف على الأقل)', name: 'pw', type: 'password', dir: 'ltr' }]);
      if (!r) return;
      if (r.pw.length < 4) return toast('كلمة السر قصيرة');
      localStorage.setItem(PWKEY, await hash(r.pw)); toast('تم تغيير كلمة السر');
    },
    async settings() {
      const s = S.settings;
      const r = await modal('بيانات المطعم', [
        { label: 'اسم المطعم', name: 'name', value: s.name },
        { label: 'العبارة التعريفية', name: 'tagline', value: s.tagline },
        { label: 'شارة صغيرة فوق الاسم', name: 'badge', value: s.badge },
        { label: 'رقم الهاتف', name: 'phone', value: s.phone, dir: 'ltr' },
        { label: 'رقم واتساب (مع رمز الدولة، مثل 963991234567)', name: 'whatsapp', value: s.whatsapp, dir: 'ltr' },
        { label: 'العنوان', name: 'address', value: s.address },
        { label: 'ساعات العمل', name: 'hours', value: s.hours },
        { label: 'نص خدمة التوصيل (اتركه فارغًا لإخفائها)', name: 'delivery', value: s.delivery }
      ]);
      if (!r) return; Object.assign(S.settings, r); save(); render();
    },
    async addCat() {
      const r = await modal('قسم جديد', [{ label: 'اسم القسم', name: 'name' }, { label: 'رمز تعبيري (إيموجي)', name: 'icon', value: '🍽️' }]);
      if (!r || !r.name.trim()) return;
      S.categories.push({ id: 'c' + uid(), name: r.name.trim(), icon: r.icon || '🍽️' }); save(); render();
    },
    delCat(id) {
      const n = S.items.filter(i => i.cat === id).length;
      if (!confirm(n ? `سيتم حذف القسم و${n} صنف بداخله. متابعة؟` : 'حذف القسم؟')) return;
      S.categories = S.categories.filter(c => c.id !== id); S.items = S.items.filter(i => i.cat !== id); save(); render();
    },
    addItem(cat) { S.items.push({ id: 'i' + uid(), cat, name: 'صنف جديد', desc: '', price: 0, img: '' }); save(); render(); },
    delItem(id) { if (!confirm('حذف هذا الصنف؟')) return; S.items = S.items.filter(i => i.id !== id); save(); render(); },
    async itemImg(id) { const d = await pickImage(); if (d) { find('items', id).img = d; save(); render(); } },
    itemImgDel(id) { find('items', id).img = ''; save(); render(); },
    addOffer() { S.offers.push({ id: 'o' + uid(), title: 'عرض جديد', desc: '', price: 0, img: '', icon: '🔥' }); save(); render(); },
    delOffer(id) { if (!confirm('حذف هذا العرض؟')) return; S.offers = S.offers.filter(o => o.id !== id); save(); render(); },
    async offerImg(id) { const d = await pickImage(); if (d) { find('offers', id).img = d; save(); render(); } },
    offerImgDel(id) { find('offers', id).img = ''; save(); render(); },
    export() {
      S.updated = Date.now();
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
      const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'menu-data.json';
      document.body.appendChild(a); a.click(); a.remove();
      toast('تم تنزيل menu-data.json، ارفعه إلى GitHub لينشر التعديلات للجميع');
    }
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const fn = actions[el.dataset.act]; if (fn) fn(el.dataset.id);
  });
  document.addEventListener('input', e => {
    const el = e.target; if (!el.dataset || !el.dataset.t) return;
    const o = find(el.dataset.t, el.dataset.id); if (!o) return;
    const f = el.dataset.f;
    o[f] = f === 'price' ? Number(el.value || 0) : el.value; save();
  });

  init();
})();
