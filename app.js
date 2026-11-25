const DEFAULT_GIFTS = [
  {
    id: 'kakashka',
    name: 'Happy Brownie',
    number: '#200 024',
    model: 'Deadpoo',
    file: 'assets/gifts/deadpoo-60fps.webp',
    video: 'assets/source/kakashka.mp4',
    sku: '#200 024',
    prices: { TON: 8, BYN: 27, STARS: 550 },
    subtitle: 'Коллекционный подарок · модель Deadpoo',
    description: 'Happy Brownie #200 024 — коллекционный подарок в модели Deadpoo. Анимированная фигурка с оригинальной отделкой и яркими деталями.',
    glow: '#424044',
    reserved: false,
    isCustom: false,
    traits: {
      model: { name: 'Deadpoo', chance: '2%' },
      pattern: { name: 'Pyramid', chance: '0.5%' },
      backdrop: { name: 'Battleship Grey', chance: '1%' }
    }
  },
  {
    id: 'rabbit',
    name: 'Pool Float',
    number: '#110 493',
    model: 'Air Bunny',
    file: 'assets/gifts/air-bunny-60fps.webp',
    video: 'assets/source/rabbit.mp4',
    sku: '#110 493',
    prices: { TON: 8, BYN: 27, STARS: 550 },
    subtitle: 'Коллекционный подарок · модель Air Bunny',
    description: 'Pool Float #110 493 — модель Air Bunny. Белый надувной круг с кроликом и морковкой, представленный в виде оригинальной анимации.',
    glow: '#414448',
    reserved: false,
    isCustom: false,
    traits: {
      model: { name: 'Air Bunny', chance: '3%' },
      pattern: { name: 'Carrot', chance: '0.5%' },
      backdrop: { name: 'Sapphire', chance: '1.5%' }
    }
  },
  {
    id: 'tank',
    name: 'Pool Float',
    number: '#52 138',
    model: 'Water Tank',
    file: 'assets/gifts/water-tank-60fps.webp',
    video: 'assets/source/tank.mp4',
    sku: '#52 138',
    prices: { TON: 8, BYN: 27, STARS: 550 },
    subtitle: 'Коллекционный подарок · модель Water Tank',
    description: 'Pool Float #52 138 — модель Water Tank. Необычный водный танк с утёнком и брызгами. Сейчас подарок находится в брони.',
    glow: '#3f4441',
    reserved: true,
    isCustom: false,
    traits: {
      model: { name: 'Water Tank', chance: '1.5%' },
      pattern: { name: 'Coffee Bean', chance: '0.2%' },
      backdrop: { name: 'Mint Green', chance: '1.5%' }
    }
  },
  {
    id: 'torch',
    name: 'Chill Flame',
    number: '#28 962',
    model: 'Lego',
    file: 'assets/gifts/lego-60fps.webp',
    video: 'assets/source/torch.mp4',
    sku: '#28 962',
    prices: { TON: 6, BYN: 20, STARS: 460 },
    subtitle: 'Коллекционный подарок · модель Lego',
    description: 'Chill Flame #28 962 — модель Lego. Детализированный факел с ярким пламенем и анимированным движением.',
    glow: '#45413e',
    reserved: false,
    isCustom: false,
    traits: {
      model: { name: 'Lego', chance: '3%' },
      pattern: { name: 'Nemes', chance: '0.4%' },
      backdrop: { name: 'Shamrock Green', chance: '1.5%' }
    }
  },
  {
    id: 'button',
    name: 'Input Key',
    number: '#21 990',
    model: 'Astrobot',
    file: 'assets/gifts/astrobot-60fps.webp',
    video: 'assets/source/button.mp4',
    sku: '#21 990',
    prices: { TON: 15, BYN: 50, STARS: 1150 },
    subtitle: 'Коллекционный подарок · модель Astrobot',
    description: 'Input Key #21 990 — модель Astrobot. Футуристичная клавиша с тёмным дисплеем и металлическим корпусом.',
    glow: '#3e4147',
    reserved: false,
    isCustom: false,
    traits: {
      model: { name: 'Astrobot', chance: '1.5%' },
      pattern: { name: 'Succubus', chance: '0.5%' },
      backdrop: { name: 'French Blue', chance: '1.5%' }
    }
  }
];

let GIFTS = [...DEFAULT_GIFTS];
let giftsLoadedFromServer = false;
let REVIEWS = [];

async function fetchServerGifts() {
  try {
    const res = await fetch('/api/gifts', { cache: 'no-store' });
    if (!res.ok) throw new Error('API unavailable');
    const data = await res.json();
    if (Array.isArray(data)) {
      GIFTS = data;
      giftsLoadedFromServer = true;
      return true;
    }
  } catch (err) {
    const localSaved = localStorage.getItem('gmFallbackGifts');
    if (localSaved) {
      try { GIFTS = JSON.parse(localSaved); } catch (e) {}
    }
  }
  giftsLoadedFromServer = true;
  return false;
}

async function fetchServerReviews() {
  try {
    const res = await fetch('/api/reviews', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        REVIEWS = data;
        localStorage.setItem('gmFallbackReviews', JSON.stringify(REVIEWS));
        return true;
      }
    }
  } catch (e) {}
  const localRev = localStorage.getItem('gmFallbackReviews');
  if (localRev) {
    try { REVIEWS = JSON.parse(localRev); } catch (e) {}
  }
  return false;
}

function getAdminPassword() {
  return sessionStorage.getItem('gmAdminPass') || '';
}

const CURRENCIES = ['TON', 'BYN', 'STARS'];
const app = document.getElementById('app');
const $ = s => document.querySelector(s);
let currency = localStorage.getItem('giftMarketCurrency') || 'TON';
let cart = JSON.parse(localStorage.getItem('giftMarketCart') || '[]');
let toastTimer;

const money = (amount, code) => `${amount.toLocaleString('en-US')} ${code}`;
const saveCart = () => localStorage.setItem('giftMarketCart', JSON.stringify(cart));

const getGift = id => {
  if (!id) return null;
  const cleanId = decodeURIComponent(String(id)).trim().toLowerCase();
  const digitsOnly = cleanId.replace(/\D/g, '');
  return GIFTS.find(g => {
    const gId = String(g.id || '').trim().toLowerCase();
    const gSku = String(g.sku || '').trim().toLowerCase();
    const gNum = String(g.number || '').trim().toLowerCase();
    const gDigits = gNum.replace(/\D/g, '');
    return (
      gId === cleanId ||
      gSku === cleanId ||
      gNum === cleanId ||
      (digitsOnly.length >= 4 && gDigits === digitsOnly)
    );
  });
};

cart = cart.filter(line => {
  const g = getGift(line.id);
  return g && !g.reserved;
}).map(line => ({ id: line.id, qty: 1 }));
saveCart();

function pricesMarkup(g) {
  return CURRENCIES.map(c => `<div class="price-chip"><small>${c}</small><b>${money(g.prices[c], c)}</b></div>`).join('');
}

function productCard(g, i) {
  return `<article class="product-card" data-tg-gift="${g.id}" style="--glow:${g.glow}">
    <div class="product-art">
      <span class="art-label">TELEGRAM GIFT / 0${i + 1}</span>
      <span class="art-corner">${g.number}</span>
      ${g.reserved ? '<span class="reserve-flag">БРОНЬ</span>' : ''}
      <img class="gift-cutout" src="${g.file}" alt="${g.name} — ${g.model}" loading="lazy">
    </div>
    <div class="product-content">
      <div class="product-title-line">
        <h3>${g.name}</h3>
        <span class="product-sku">${g.number}</span>
      </div>
      <div class="product-model"><span>MODEL</span><b>${g.model}</b></div>
      <p class="product-subtitle">${g.subtitle}</p>
      <div class="price-stack">${pricesMarkup(g)}</div>
      <div class="card-actions">
        <button class="button button-dark" data-details="${g.id}">Подробнее <span>↗</span></button>
        ${g.reserved
          ? '<button class="quick-add reserved-button" disabled title="Подарок в брони">—</button>'
          : `<button class="quick-add" data-add="${g.id}" aria-label="Добавить ${g.name} в корзину">＋</button>`}
      </div>
    </div>
  </article>`;
}

function pluralGifts(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'оригинальный подарок';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'оригинальных подарка';
  return 'оригинальных подарков';
}

function renderHome() {
  return `<section class="hero">
    <div class="hero-copy">
      <div class="eyebrow">DIGITAL GIFTS STORE</div>
      <h1>Подарки,<br><span>которые</span><br>запоминаются.</h1>
      <p>Цифровые подарки в лаконичном исполнении. Выбирай, добавляй в коллекцию и делись настроением.</p>
      <div class="hero-actions">
        <a class="button button-light" href="#catalog">Перейти в каталог <span>↘</span></a>
        <a class="text-link" href="#about">О магазине <span>↗</span></a>
      </div>
      <div class="hero-stats">
        <div><b>${String(GIFTS.length).padStart(2,'0')}</b>ПОЗИЦИЙ В КАТАЛОГЕ</div>
        <i class="stat-separator"></i>
        <div><b>03</b>ВАЛЮТЫ ОПЛАТЫ</div>
      </div>
    </div>
    <div class="hero-stage">
      <div class="stage-glow"></div>
      <div class="stage-ring"></div>
      <div class="stage-card back">
        <span>GIFT MARKET / SERIES 01</span>
        <div class="fake-object">✓</div>
        <span>COLLECT YOUR MOMENT</span>
      </div>
      <div class="stage-card front" data-tg-gift="rabbit" style="cursor:pointer">
        <span>FEATURED / 001</span>
        <img class="gift-cutout hero-gift-cutout" src="assets/gifts/air-bunny-60fps.webp" alt="Pool Float Air Bunny">
        <span>THE GIFT COLLECTION</span>
      </div>
      <div class="stage-index"><b>01</b> / ${String(GIFTS.length).padStart(2,'0')} <span> ✓</span></div>
    </div>
  </section>
  <section class="home-section">
    <div class="section-head">
      <div>
        <div class="eyebrow">CURATED COLLECTION</div>
        <h2>Выбор <span>магазина</span></h2>
      </div>
      <a class="text-link" href="#catalog">Весь каталог <span>↗</span></a>
    </div>
    <div class="featured-grid">${GIFTS.slice(0, 3).map(productCard).join('')}</div>
  </section>
  <section class="benefit-strip">
    <div class="benefit"><span class="benefit-icon">✓</span><div><b>${GIFTS.length} ${pluralGifts(GIFTS.length)}</b><p>Оригинальные анимации из нашей коллекции в наличии и под заказ.</p></div></div>
    <div class="benefit"><span class="benefit-icon">✓</span><div><b>Три валюты на выбор</b><p>TON, BYN или Telegram Stars — цены указаны в карточках.</p></div></div>
    <div class="benefit"><span class="benefit-icon">✓</span><div><b>Удобный каталог</b><p>Подробная страница каждого подарка, редкие шансы и корзина.</p></div></div>
  </section>`;
}

function renderCatalog() {
  return `<section class="page-intro">
    <div>
      <div class="eyebrow">THE COLLECTION / 2026</div>
      <h1>Каталог <span>подарков.</span></h1>
    </div>
    <p>Нажми на карточку подарка, чтобы открыть его в цвете с фоном, узором и шансами редкости из Telegram.</p>
  </section>
  <div class="catalog-tools">
    <div class="catalog-count">ПОЗИЦИИ В КАТАЛОГЕ <b>${String(GIFTS.length).padStart(2,'0')}</b></div>
    <div class="currency-control">
      <label for="catalogCurrency">ВАЛЮТА БЫСТРОГО ДОБАВЛЕНИЯ</label>
      <select id="catalogCurrency">
        <option value="TON" ${currency === 'TON' ? 'selected' : ''}>TON</option>
        <option value="BYN" ${currency === 'BYN' ? 'selected' : ''}>BYN</option>
        <option value="STARS" ${currency === 'STARS' ? 'selected' : ''}>STARS</option>
      </select>
    </div>
  </div>
  <div class="catalog-grid">${GIFTS.map(productCard).join('')}</div>
  <section class="benefit-strip">
    <div class="benefit"><span class="benefit-icon">01</span><div><b>Выбери подарок</b><p>Нажми на карточку и посмотри анимацию с узором и шансами.</p></div></div>
    <div class="benefit"><span class="benefit-icon">02</span><div><b>Добавь в корзину</b><p>Собери один или несколько подарков.</p></div></div>
    <div class="benefit"><span class="benefit-icon">03</span><div><b>Оформи заявку</b><p>Оставь контакт для дальнейшей связи.</p></div></div>
  </section>`;
}

function renderReviews() {
  const isAdm = Boolean(adminUnlocked && getAdminPassword());
  const giftOptions = GIFTS.map(g =>
    `<option value="${g.name} ${g.number}" data-price="${money(g.prices[currency], currency)}">${g.name} ${g.number} — ${money(g.prices[currency], currency)}</option>`
  ).join('');

  const cardsHtml = REVIEWS.length
    ? REVIEWS.map(r => {
        const stars = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
        const purchaseBadge = [r.giftTitle, r.priceLabel].filter(Boolean).join(' · ');
        return `<article class="contact-card" style="display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
            <div>
              <b>${r.author}</b>
              <div style="font-size:11px;opacity:.65;margin-top:2px;">${r.createdAt || ''}</div>
            </div>
            <span style="letter-spacing:2px;font-size:13px;">${stars}</span>
          </div>

          ${purchaseBadge ? `<div style="font-size:12px;padding:7px 11px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);">
            Покупка: <b>${purchaseBadge}</b>
          </div>` : ''}

          <p style="margin:0;font-size:13px;line-height:1.6;">${r.comment}</p>

          ${r.reply ? `<div style="padding:11px 13px;border-radius:10px;background:rgba(255,255,255,0.04);border-left:2px solid #fff;font-size:12.5px;line-height:1.5;">
            <div style="font-size:10.5px;opacity:.7;margin-bottom:4px;">Ответ админа ${r.replyBy ? `(${r.replyBy})` : ''}:</div>
            <div>${r.reply}</div>
          </div>` : ''}

          ${isAdm ? `<form class="admin-review-reply-form" data-review-id="${r.id}" style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap;">
            <input type="text" name="reply" placeholder="Написать ответ от админа..." value="${(r.reply || '').replace(/"/g, '&quot;')}" style="flex:1;min-width:180px;padding:9px 11px;border-radius:8px;border:1px solid #404146;background:#1b1c20;color:#fff;font-size:12px;">
            <button type="submit" class="button button-dark" style="padding:9px 14px;font-size:12px;">Ответить</button>
          </form>` : ''}
        </article>`;
      }).join('')
    : `<div class="contact-card"><p>Отзывов пока нет — будь первым, кто оставит отзыв после покупки.</p></div>`;

  return `<section class="page-intro">
    <div>
      <div class="eyebrow">CUSTOMER FEEDBACK</div>
      <h1>Отзывы <span>покупателей.</span></h1>
    </div>
    <p>Отзывы с указанием подарка и суммы покупки, а также ответы администрации.</p>
  </section>

  <div class="admin-builder-grid">
    <div style="display:flex;flex-direction:column;gap:14px;">
      ${cardsHtml}
    </div>

    <form class="contact-form" id="addReviewForm">
      <div class="eyebrow">NEW REVIEW</div>
      <h3 style="font-size:19px;margin:10px 0 18px;">Оставить отзыв</h3>
      <div class="form-grid">
        <div class="field full">
          <label>ВАШ @USERNAME ИЛИ ИМЯ *</label>
          <input type="text" name="author" required placeholder="@username или имя">
        </div>
        <div class="field full">
          <label>КУПЛЕННЫЙ ПОДАРОК И ЦЕНА</label>
          <select id="revGiftSelect" style="width:100%;border:1px solid #404146;border-radius:7px;padding:11px;background:#232427;color:#eee;font-size:12px;">
            <option value="">Выбрать подарок из каталога...</option>
            ${giftOptions}
            <option value="CUSTOM">Указать вручную</option>
          </select>
        </div>
        <div class="field">
          <label>ПОДАРОК</label>
          <input type="text" name="giftTitle" id="revGiftTitle" placeholder="Например: Pool Float #110 493">
        </div>
        <div class="field">
          <label>ЗА СКОЛЬКО (ЦЕНА)</label>
          <input type="text" name="priceLabel" id="revPriceLabel" placeholder="Например: 8 TON">
        </div>
        <div class="field full">
          <label>ОЦЕНКА</label>
          <select name="rating" style="width:100%;border:1px solid #404146;border-radius:7px;padding:11px;background:#232427;color:#eee;font-size:12px;">
            <option value="5">★★★★★ (5 из 5)</option>
            <option value="4">★★★★☆ (4 из 5)</option>
            <option value="3">★★★☆☆ (3 из 5)</option>
          </select>
        </div>
        <div class="field full">
          <label>ТЕКСТ ОТЗЫВА *</label>
          <textarea name="comment" required placeholder="Как прошла сделка, всё ли понравилось?"></textarea>
        </div>
      </div>
      <button class="button button-light button-full" type="submit" style="margin-top:14px;">Опубликовать отзыв <span>↗</span></button>
    </form>
  </div>`;
}

function renderAbout() {
  return `<section class="page-intro">
    <div>
      <div class="eyebrow">ABOUT GIFT MARKET</div>
      <h1>О <span>магазине.</span></h1>
    </div>
    <p>GIFT MARKET — магазин цифровых коллекционных подарков Telegram в минималистичной эстетике.</p>
  </section>
  <section class="split-panel">
    <div>
      <div class="eyebrow">OUR COLLECTION</div>
      <h2>Меньше лишнего.<br><span>Больше впечатлений.</span></h2>
      <p>В каталоге собраны редкие цифровые подарки с уникальными моделями, фонами и узорами. Выбирай понравившийся экземпляр, смотри шансы редкости и оформляй покупку напрямую через администраторов в удобной валюте — TON, BYN или Telegram Stars.</p>
      <a class="button button-light" href="#catalog">Посмотреть подарки <span>↗</span></a>
    </div>
    <div class="split-visual"><img src="assets/logo.jpg" alt="GIFT MARKET" style="width:120px;height:120px;border-radius:24px;object-fit:cover;"></div>
  </section>
  <div class="eyebrow">ADVANTAGES</div>
  <div class="info-grid">
    <article class="info-card"><span class="info-num">01 / COLLECTION</span><h3>${GIFTS.length} ${pluralGifts(GIFTS.length)}</h3><p>Актуальная коллекция цифровых подарков с живыми анимациями и указанием редкости.</p></article>
    <article class="info-card"><span class="info-num">02 / CLEAR PRICES</span><h3>Понятные цены</h3><p>Для каждого подарка сразу указана точная стоимость в TON, BYN и Telegram Stars.</p></article>
    <article class="info-card"><span class="info-num">03 / FAST DEAL</span><h3>Прямая сделка</h3><p>Быстрое оформление и передача подарка напрямую через администраторов @n3yura и @NekosikN.</p></article>
  </div>`;
}

function renderFaq() {
  const namesList = GIFTS.map(g => `${g.name} (${g.model})`).join(', ');
  const items = [
    ['Какие подарки сейчас в каталоге?', `Сейчас в магазине доступно ${GIFTS.length} позиций: ${namesList}.`],
    ['В каких валютах указаны цены?', 'Для каждого подарка отображаются точные цены в TON, BYN и Telegram Stars.'],
    ['Сколько штук можно купить?', 'Каждый коллекционный подарок представлен в единственном экземпляре (1 шт.). После нажатия «Оформить заказ» откроется раздел «Контакты», где можно сразу написать админу @n3yura или @NekosikN.'],
    ['Как происходит покупка и передача?', 'Выбери подарок в каталоге, нажми «Оформить заказ» и напиши любому из администраторов в Telegram — сделка проводится напрямую.'],
    ['Где посмотреть сам подарок и шансы?', 'Нажми прямо на карточку подарка в каталоге — откроется превью в цвете с фоном, узором и процентами редкости из Telegram.'],
    ['Сохраняется ли корзина?', 'Да, выбранные подарки и валюта сохраняются в браузере.']
  ];
  return `<section class="page-intro">
    <div>
      <div class="eyebrow">HELP CENTER</div>
      <h1>Частые <span>вопросы.</span></h1>
    </div>
    <p>Коротко о каталоге, ценах, корзине и текущем процессе оформления заказа.</p>
  </section>
  <div class="faq-list">${items.map((x, i) => `<div class="faq-item ${i === 0 ? 'open' : ''}"><button class="faq-question">${x[0]}<span>＋</span></button><div class="faq-answer">${x[1]}</div></div>`).join('')}</div>`;
}

function renderContacts() {
  const orderText = getOrderMessageText();
  const encodedText = orderText ? `?text=${encodeURIComponent(orderText)}` : '';
  const techSupportText = `?text=${encodeURIComponent('Привет! Нашёл техническую проблему на сайте / в боте GIFT MARKET: ')}`;
  const selectedHtml = cart.length ? `
    <div class="selected-order-box">
      <div class="selected-order-head">
        <span class="overline">ВЫБРАННЫЙ ЗАКАЗ (1 ШТ. / ПОЗИЦИЯ)</span>
        <button type="button" class="copy-order-btn" id="copyOrderBtn">Скопировать текст ✓</button>
      </div>
      <div class="selected-order-items">
        ${cart.map(line => {
          const g = getGift(line.id);
          return g ? `<div class="selected-order-line"><span>${g.name} · ${g.model} ${g.number} (1 шт.)</span><b>${money(g.prices[currency], currency)}</b></div>` : '';
        }).join('')}
      </div>
      <p class="selected-order-hint">Нажми на одного из администраторов продаж ниже — откроется чат в Telegram с готовым сообщением для покупки.</p>
    </div>
  ` : '';

  return `<section class="page-intro">
    <div>
      <div class="eyebrow">GET IN TOUCH</div>
      <h1>Связаться <span>с нами.</span></h1>
    </div>
    <p>По вопросам покупки подарков пиши администраторам продаж, а по техническим проблемам с сайтом или ботом — техническому администратору.</p>
  </section>
  <div class="contact-layout contact-single">
    <section class="contact-card">
      <div class="eyebrow">TEAM & ADMINS</div>
      <h3>Администрация магазина.</h3>
      <p>Выбери нужный контакт в зависимости от твоего вопроса.</p>
      ${selectedHtml}
      <div class="admins-list admins-grid">
        <a class="admin-item" href="https://t.me/n3yura${encodedText}" target="_blank" rel="noopener noreferrer">
          <div class="admin-avatar-wrap">
            <img src="assets/admin_n3yura.png" alt="неюра" class="admin-avatar">
            <span class="admin-status"></span>
          </div>
          <div class="admin-meta">
            <div class="admin-name-row">
              <b>неюра</b>
              <span class="admin-role">ADMIN</span>
            </div>
            <span class="admin-handle">@n3yura · Написать для покупки</span>
          </div>
          <span class="admin-arrow">↗</span>
        </a>

        <a class="admin-item" href="https://t.me/NekosikN${encodedText}" target="_blank" rel="noopener noreferrer">
          <div class="admin-avatar-wrap">
            <img src="assets/admin_nekosikn.png" alt="NekosikN" class="admin-avatar">
            <span class="admin-status"></span>
          </div>
          <div class="admin-meta">
            <div class="admin-name-row">
              <b>NekosikN</b>
              <span class="admin-role">ADMIN</span>
            </div>
            <span class="admin-handle">@NekosikN · Написать для покупки</span>
          </div>
          <span class="admin-arrow">↗</span>
        </a>

        <a class="admin-item" href="https://t.me/yapp1kc${techSupportText}" target="_blank" rel="noopener noreferrer" style="grid-column: 1 / -1;">
          <div class="admin-avatar-wrap">
            <img src="assets/admin_yapp1kc.png" alt="yapp1k" class="admin-avatar">
            <span class="admin-status"></span>
          </div>
          <div class="admin-meta">
            <div class="admin-name-row">
              <b>yapp1k</b>
              <span class="admin-role">TECH. ADMIN</span>
            </div>
            <span class="admin-handle">@yapp1kc · Писать только с проблемами по боту или сайту</span>
          </div>
          <span class="admin-arrow">↗</span>
        </a>
      </div>

      <div class="contact-detail"><small>WORKING HOURS</small><b>Ежедневно · отвечаем в Telegram</b></div>
    </section>
  </div>`;
}

function renderPrivacy() {
  return `<section class="page-intro">
    <div>
      <div class="eyebrow">LEGAL / 24.11.2026</div>
      <h1>Политика <span>конфиденциальности.</span></h1>
    </div>
    <p>Дата вступления в силу: 24 ноября 2026 года · https://g1ft-mark3t.onrender.com/ · @giftmarket_by_bot</p>
  </section>
  <div class="contact-card" style="line-height:1.68;font-size:13px;display:flex;flex-direction:column;gap:16px;">
    <div>
      <h3>1. Общие положения</h3>
      <p>1.1. Настоящая Политика конфиденциальности устанавливает правила обработки и защиты персональных данных лиц, использующих сайт G1FT MARKET, оформляющих заказы или взаимодействующих с администрацией магазина через Telegram.</p>
      <p>1.2. Политика разработана с учётом законодательства Республики Беларусь: Закона Республики Беларусь от 07.05.2021 № 99-З «О защите персональных данных», Гражданского кодекса Республики Беларусь и иных нормативных правовых актов.</p>
      <p>1.3. Оператор персональных данных: Темников Илья Павлович · Контакт: @giftmarket_by_bot · Email: uliatemnikov@gmail.com.</p>
      <p>1.4. Настоящая Политика распространяется на информацию, полученную через сайт, Telegram-бот и официальные каналы коммуникации магазина.</p>
    </div>
    <div>
      <h3>2. Персональные данные, которые обрабатываются</h3>
      <p>Магазин ограничивает сбор информации сведениями, необходимыми для работы с заказами: 1) Telegram username покупателя; 2) Telegram ID покупателя; 3) История заказов (сведения о приобретённых подарках, стоимости, дате заказа и статусе передачи), а также сведения, добровольно предоставленные покупателем в переписке по заказу. Магазин не собирает паспортные данные, адреса проживания, номера телефонов, пароли, приватные ключи, seed-фразы и секретные реквизиты кошельков.</p>
    </div>
    <div>
      <h3>3. Цели обработки информации</h3>
      <p>Информация используется исключительно для оформления и обработки заказов, идентификации покупателя, подтверждения оплаты, организации передачи цифрового подарка, ведения истории приобретений, рассмотрения обращений и предотвращения мошеннических действий. Магазин не использует персональные данные для скрытой рекламы или продажи баз данных.</p>
    </div>
    <div>
      <h3>4. Правовые основания обработки и порядок принятия условий</h3>
      <p>4.1. Обработка персональных данных осуществляется на основаниях, предусмотренных законодательством Республики Беларусь.</p>
      <p>4.2. Безоговорочное согласие с условиями: Факт захода пользователя на сайт https://g1ft-mark3t.onrender.com/, его просмотра, а равно любого взаимодействия с Telegram-ботом @giftmarket_by_bot означает полное, автоматическое и безоговорочное согласие пользователя с настоящей Политикой конфиденциальности, Пользовательским соглашением и всеми правилами работы сервиса.</p>
      <p>4.3. Одностороннее изменение условий: Администрация G1FT MARKET оставляет за собой право в любой момент в одностороннем порядке изменять, дополнять или полностью обновлять настоящую Политику конфиденциальности и условия обслуживания без предварительного уведомления пользователей. Новая редакция вступает в силу с момента её размещения на сайте.</p>
      <p>4.4. Отзыв согласия осуществляется в порядке, предусмотренном Законом Республики Беларусь № 99-З.</p>
    </div>
    <div>
      <h3>5. Платёжные операции</h3>
      <p>G1FT MARKET принимает оплату посредством TON, BYN и Telegram Stars. Магазин может фиксировать факт оплаты, сумму, валюту и дату платежа. Покупатель самостоятельно обязан проверять правильность платёжных реквизитов и сети перед отправкой средств.</p>
    </div>
    <div>
      <h3>6–9. Передача данных, сроки хранения, защита и права субъектов</h3>
      <p>Магазин не продаёт персональные данные третьим лицам. Для работы сервиса используются технические платформы Telegram, Render и соответствующие платёжные сервисы (с соблюдением требований ст. 9 Закона РБ № 99-З). Информация хранится в течение периода, необходимого для исполнения сделок и рассмотрения обращений, после чего удаляется или обезличивается. Покупатель вправе реализовать свои права (запрос сведений, изменение, отзыв согласия, удаление данных) через @giftmarket_by_bot.</p>
    </div>
    <div>
      <h3>10–12. Файлы cookie, изменения и контакты</h3>
      <p>Сайт использует технические файлы cookie для корректной работы. Посещая сайт, пользователь автоматически соглашается на использование данных технологий. Контакт для обращений: @giftmarket_by_bot · Сайт: https://g1ft-mark3t.onrender.com/.</p>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px;">
      <a class="button button-light" href="#home">← На главную</a>
      <a class="button button-dark" href="#terms">Пользовательское соглашение ↗</a>
    </div>
  </div>`;
}

function renderTerms() {
  return `<section class="page-intro">
    <div>
      <div class="eyebrow">TERMS OF SERVICE / 24.11.2026</div>
      <h1>Пользовательское <span>соглашение.</span></h1>
    </div>
    <p>И условия покупки G1FT MARKET · Редакция от 24 ноября 2026 года · https://g1ft-mark3t.onrender.com/ · @giftmarket_by_bot</p>
  </section>
  <div class="contact-card" style="line-height:1.68;font-size:13px;display:flex;flex-direction:column;gap:16px;">
    <div>
      <h3>1–3. Общие положения, предмет сделки и оформление заказа</h3>
      <p>1.1. Настоящее Соглашение определяет правила использования сайта G1FT MARKET, порядок оформления заказов, оплаты и передачи цифровых подарков Telegram.</p>
      <p>1.2. Предметом сделки является приобретение цифрового подарка из каталога G1FT MARKET (модель, номер, фон, узор). Если подарок представлен в одном экземпляре, повторная продажа этого экземпляра после подтверждённого исполнения заказа не допускается.</p>
      <p>1.3. Заказ оформляется через сайт или через @giftmarket_by_bot и считается принятым после подтверждения администрацией.</p>
    </div>
    <div>
      <h3>4–5. Оплата и передача подарка</h3>
      <p>4.1. Магазин принимает оплату в TON, BYN и Telegram Stars. При переводе TON покупатель обязан самостоятельно проверить сеть, адрес получателя и сумму перевода. Ошибочные переводы на неправильный адрес или в неправильной сети не считаются полученной оплатой.</p>
      <p>5.1. Передача подарка осуществляется предусмотренными Telegram механизмами после подтверждения оплаты. Покупатель обязан проверить факт получения и соответствие переданного подарка заказу.</p>
    </div>
    <div>
      <h3>6. Порядок принятия условий и право на односторонние изменения</h3>
      <p>6.1. Автоматический акцепт правил: Сам факт захода пользователя на сайт https://g1ft-mark3t.onrender.com/, просмотра его страниц или обращения в Telegram-бот @giftmarket_by_bot означает полное, автоматическое и безоговорочное согласие пользователя с настоящим Пользовательским соглашением, Политикой конфиденциальности и всеми правилами магазина.</p>
      <p>6.2. Право на изменение условий без уведомления: Администрация G1FT MARKET вправе в любой момент в одностороннем порядке изменять, дополнять или отменять любые пункты настоящего Соглашения, Политику конфиденциальности и тарифы без предварительного уведомления пользователей. Изменения вступают в силу немедленно с момента публикации.</p>
    </div>
    <div>
      <h3>7–8. Гарантии и обстоятельства после передачи</h3>
      <p>7.1. Гарантия распространяется на соответствие передаваемого подарка заказу и фактическое исполнение обязательства по его передаче. После успешной передачи подарка покупателю продавец не отвечает за его дальнейшее хранение или функционирование в инфраструктуре сторонних платформ.</p>
      <p>8.1. После надлежащей передачи подарка магазин не отвечает за утрату доступа к аккаунту покупателя, компрометацию аккаунта, добровольную передачу подарка третьим лицам, изменение рыночной стоимости и ликвидности или изменение правил Telegram.</p>
    </div>
    <div>
      <h3>9–13. Возвраты, ответственность и контакты</h3>
      <p>9.1. Если оплата получена, но передача подарка не состоялась по вине продавца, стороны согласовывают возврат денежных средств. Изменение рыночной стоимости подарка после покупки не является основанием для возврата разницы в цене.</p>
      <p>10.1. G1FT MARKET не является официальным представителем Telegram. По вопросам заказов и претензий обращайтесь в @giftmarket_by_bot. К отношениям сторон применяется законодательство Республики Беларусь.</p>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px;">
      <a class="button button-light" href="#home">← На главную</a>
      <a class="button button-dark" href="#privacy">Политика конфиденциальности ↗</a>
    </div>
  </div>`;
}

let adminUnlocked = sessionStorage.getItem('gmAdminUnlocked') === '1';
let editingGiftId = null;

function renderAdmin() {
  if (!adminUnlocked) {
    return `<section class="page-intro">
      <div>
        <div class="eyebrow">RESTRICTED AREA</div>
        <h1>Доступ <span>ограничен.</span></h1>
      </div>
      <p>Введите пароль администратора для управления каталогом подарков.</p>
    </section>
    <div class="contact-layout contact-single" style="max-width:440px;">
      <form class="contact-form" id="adminLoginForm">
        <div class="eyebrow">AUTHENTICATION</div>
        <h3 style="font-size:19px;margin:12px 0 18px">Вход в панель</h3>
        <div class="field">
          <label>ПАРОЛЬ</label>
          <input type="password" id="adminPassInput" required placeholder="••••••••••••••" autocomplete="off">
        </div>
        <button class="button button-light button-full" type="submit">Войти <span>↗</span></button>
      </form>
    </div>`;
  }

  const editItem = editingGiftId ? getGift(editingGiftId) : null;
  if (editingGiftId && !editItem) editingGiftId = null;

  const fName = editItem ? editItem.name : '';
  const fNum = editItem ? editItem.number : '#10 001';
  const fModel = editItem ? editItem.model : '';
  const fModelChance = editItem ? editItem.traits.model.chance : '1.5%';
  const fPattern = editItem ? editItem.traits.pattern.name : 'Starlight';
  const fPatternChance = editItem ? editItem.traits.pattern.chance : '0.5%';
  const fBackdrop = editItem ? editItem.traits.backdrop.name : 'Onyx Dark';
  const fBackdropChance = editItem ? editItem.traits.backdrop.chance : '1.5%';
  const fTon = editItem ? editItem.prices.TON : 10;
  const fByn = editItem ? editItem.prices.BYN : 35;
  const fStars = editItem ? editItem.prices.STARS : 700;
  const fReserved = editItem ? String(editItem.reserved) : 'false';
  const fDesc = editItem ? editItem.description : '';
  const fAvatar = editItem ? editItem.file : 'assets/gifts/air-bunny-60fps.webp';

  return `<section class="page-intro">
    <div>
      <div class="eyebrow">STUDIO & CREATOR PANEL</div>
      <h1>${editItem ? 'Редактировать' : 'Добавить'} <span>подарок.</span></h1>
    </div>
    <div class="admin-head-actions" style="display:flex;flex-direction:column;align-items:flex-start;gap:12px;">
      <p style="margin:0">Управляй каталогом, редактируй цены и характеристики или добавляй новые NFT-подарки.</p>
      <button type="button" class="button button-dark" id="adminLogoutBtn" style="padding:10px 15px;">Выйти из админки <span>×</span></button>
    </div>
  </section>

  <div class="admin-builder-grid">
    <form class="contact-form" id="addGiftForm">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <div class="eyebrow">${editItem ? `EDITING: ${editItem.name} ${editItem.number}` : 'NEW DIGITAL GIFT'}</div>
        ${editItem ? '<button type="button" class="mini-btn" id="cancelEditBtn">Отменить редактирование</button>' : ''}
      </div>
      <h3 style="font-size:19px;margin:12px 0 22px">${editItem ? 'Редактирование карточки' : 'Конструктор карточки подарка'}</h3>

      <div class="form-grid">
        <div class="field">
          <label>НАЗВАНИЕ ПОДАРКА *</label>
          <input name="name" id="gfName" required placeholder="Например: Crystal Skull" value="${fName.replace(/"/g, '&quot;')}">
        </div>
        <div class="field">
          <label>НОМЕР / SKU *</label>
          <input name="number" id="gfNumber" required placeholder="#12 345" value="${fNum.replace(/"/g, '&quot;')}">
        </div>

        <div class="field">
          <label>МОДЕЛЬ (MODEL) *</label>
          <input name="model" id="gfModel" required placeholder="Например: Cyber Edition" value="${fModel.replace(/"/g, '&quot;')}">
        </div>
        <div class="field">
          <label>ШАНС МОДЕЛИ</label>
          <input name="modelChance" id="gfModelChance" placeholder="1.5%" value="${fModelChance.replace(/"/g, '&quot;')}">
        </div>

        <div class="field">
          <label>УЗОР (PATTERN)</label>
          <input name="pattern" id="gfPattern" placeholder="Например: Dragon" value="${fPattern.replace(/"/g, '&quot;')}">
        </div>
        <div class="field">
          <label>ШАНС УЗОРА</label>
          <input name="patternChance" id="gfPatternChance" placeholder="0.5%" value="${fPatternChance.replace(/"/g, '&quot;')}">
        </div>

        <div class="field">
          <label>ФОН (BACKDROP)</label>
          <input name="backdrop" id="gfBackdrop" placeholder="Например: Midnight Blue" value="${fBackdrop.replace(/"/g, '&quot;')}">
        </div>
        <div class="field">
          <label>ШАНС ФОНА</label>
          <input name="backdropChance" id="gfBackdropChance" placeholder="1.5%" value="${fBackdropChance.replace(/"/g, '&quot;')}">
        </div>

        <div class="field">
          <label>ЦЕНА В TON *</label>
          <input type="number" step="any" min="0" name="priceTon" id="gfTon" required placeholder="10" value="${fTon}">
        </div>
        <div class="field">
          <label>ЦЕНА В BYN *</label>
          <input type="number" step="any" min="0" name="priceByn" id="gfByn" required placeholder="35" value="${fByn}">
        </div>
        <div class="field">
          <label>ЦЕНА В TELEGRAM STARS *</label>
          <input type="number" step="1" min="0" name="priceStars" id="gfStars" required placeholder="700" value="${fStars}">
        </div>
        <div class="field">
          <label>СТАТУС В КАТАЛОГЕ</label>
          <select name="reserved" id="gfReserved" style="width:100%;border:1px solid #404146;border-radius:7px;padding:12px;background:#232427;color:#eee;font-size:10px;">
            <option value="false" ${fReserved === 'false' ? 'selected' : ''}>В наличии (доступен к покупке)</option>
            <option value="true" ${fReserved === 'true' ? 'selected' : ''}>В брони (БРОНЬ)</option>
          </select>
        </div>

        <div class="field full">
          <label>АВАТАРКА / ГИФКА ПОДАРКА ДЛЯ КАРТОЧКИ ${editItem ? '(необязательно — оставь пустым, чтобы сохранить текущую)' : '*'}</label>
          <div class="file-drop-box">
            <input type="file" id="gfAvatarFile" accept="image/*,.webp,.gif" ${editItem ? '' : 'required'}>
            <span class="file-hint">Выбери вырезанную гифку (.webp / .gif) или картинку подарка</span>
          </div>
        </div>

        <div class="field full">
          <label>АНИМАЦИЯ / ВИДЕО ДЛЯ ПРЕВЬЮ ПРИ НАЖАТИИ (MP4 / WEBM / GIF)</label>
          <div class="file-drop-box">
            <input type="file" id="gfPreviewFile" accept="video/mp4,video/webm,image/*,.webp,.gif">
            <span class="file-hint">${editItem ? 'Оставь пустым, чтобы сохранить текущее видео/превью' : 'Видео с фоном и узором (если не загружать, откроется гифка подарка)'}</span>
          </div>
        </div>

        <div class="field full">
          <label>ОПИСАНИЕ ПОДАРКА *</label>
          <textarea name="description" id="gfDescription" required placeholder="Опиши детали подарка, редкость и особенности...">${fDesc}</textarea>
        </div>
      </div>

      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;">
        <button class="button button-light" type="submit">${editItem ? 'Сохранить изменения ✓' : 'Опубликовать в каталог ＋'}</button>
        ${editItem ? '<button class="button button-dark" type="button" id="cancelEditBtnBottom">Отмена</button>' : '<button class="button button-dark" type="button" id="exportCatalogBtn">Скачать JSON базы <span>↘</span></button>'}
      </div>
    </form>

    <div class="admin-side-col">
      <div class="contact-card">
        <div class="eyebrow">LIVE PREVIEW</div>
        <h3>Предпросмотр</h3>
        <div class="admin-live-card">
          <div class="product-art" style="height:210px;border-radius:12px;">
            <span class="art-label">PREVIEW</span>
            <span class="art-corner" id="prevNumber">${fNum}</span>
            <img id="prevAvatarImg" class="gift-cutout" src="${fAvatar}" alt="Preview" style="max-height:135px;">
          </div>
          <div style="padding-top:14px;">
            <div class="product-title-line">
              <h3 id="prevName">${fName || 'Новый подарок'}</h3>
              <span class="product-sku" id="prevSku">${fNum}</span>
            </div>
            <div class="product-model"><span>MODEL</span><b id="prevModel">${fModel || 'Cyber Edition'}</b></div>
            <div class="price-stack" style="margin-top:12px;">
              <div class="price-chip"><small>TON</small><b id="prevTon">${money(fTon, 'TON')}</b></div>
              <div class="price-chip"><small>BYN</small><b id="prevByn">${money(fByn, 'BYN')}</b></div>
              <div class="price-chip"><small>STARS</small><b id="prevStars">${money(fStars, 'STARS')}</b></div>
            </div>
          </div>
        </div>
      </div>

      <div class="contact-card" style="margin-top:18px;">
        <div class="eyebrow">MANAGE ITEMS (${GIFTS.length})</div>
        <h3>Управление подарками</h3>
        <p>Редактируй любой подарок, меняй статус брони или удаляй позиции из каталога.</p>
        <div class="manage-gifts-list">
          ${GIFTS.map(g => `
            <div class="manage-gift-row ${editingGiftId === g.id ? 'editing-active' : ''}">
              <img src="${g.file}" alt="${g.name}">
              <div class="manage-gift-info">
                <b>${g.name} <span>${g.number}</span></b>
                <small>${g.model} · ${money(g.prices.TON, 'TON')}</small>
              </div>
              <div class="manage-gift-btns">
                <button type="button" class="mini-btn edit" data-edit-gift="${g.id}" title="Редактировать">Ред.</button>
                <button type="button" class="mini-btn" data-toggle-reserve="${g.id}" title="Переключить бронь">${g.reserved ? 'Снять' : 'Бронь'}</button>
                <button type="button" class="mini-btn danger" data-delete-gift="${g.id}" title="Удалить">×</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

function renderGift(id) {
  const g = getGift(id);
  if (!g) {
    if (!giftsLoadedFromServer) {
      return `<section class="page-intro"><div><div class="eyebrow">LOADING</div><h1>Загрузка <span>подарка...</span></h1></div></section>`;
    }
    return `<section class="page-intro"><div><div class="eyebrow">NOT FOUND</div><h1>Подарок <span>не найден.</span></h1></div><a class="button button-dark" href="#catalog">Вернуться в каталог</a></section>`;
  }
  return `<section class="product-detail">
    <a class="back-link" href="#catalog">← Назад в каталог</a>
    <div class="detail-grid">
      <div class="detail-art" data-tg-gift="${g.id}" style="cursor:pointer;">
        <span class="art-label">${g.sku} / GIFT OBJECT</span>
        ${g.reserved ? '<span class="reserve-flag">БРОНЬ</span>' : ''}
        <img class="gift-cutout" src="${g.file}" alt="${g.name} ${g.model}">
      </div>
      <div class="detail-info">
        <div class="eyebrow">DIGITAL GIFT / ${g.sku}</div>
        <h1>${g.name}<span>.</span></h1>
        <div class="detail-model">Модель <b>${g.model}</b> <span>${g.number}</span></div>
        <p>${g.description}</p>
        <div class="detail-price-list">${CURRENCIES.map(c => `<div class="detail-price"><span>${c === 'STARS' ? 'TELEGRAM STARS' : c}</span><b>${money(g.prices[c], c)}</b></div>`).join('')}</div>
        <div class="tg-traits-table" style="margin: 14px 0;">
          <div class="tg-trait-row"><span class="tg-trait-label">Модель</span><div class="tg-trait-value"><span>${g.traits.model.name}</span><span class="tg-chance-pill">${g.traits.model.chance}</span></div></div>
          <div class="tg-trait-row"><span class="tg-trait-label">Узор</span><div class="tg-trait-value"><span>${g.traits.pattern.name}</span><span class="tg-chance-pill">${g.traits.pattern.chance}</span></div></div>
          <div class="tg-trait-row"><span class="tg-trait-label">Фон</span><div class="tg-trait-value"><span>${g.traits.backdrop.name}</span><span class="tg-chance-pill">${g.traits.backdrop.chance}</span></div></div>
        </div>
        ${g.reserved
          ? '<div class="reserved-detail">Этот подарок сейчас находится в брони.</div>'
          : `<label class="overline" for="detailCurrency">ВЫБЕРИ ВАЛЮТУ</label>
             <select id="detailCurrency" style="display:block;width:100%;margin:9px 0 14px;padding:12px;background:#222326;color:#eee;border:1px solid #424348;border-radius:7px">
               <option value="TON">TON</option>
               <option value="BYN">BYN</option>
               <option value="STARS">STARS</option>
             </select>
             <button class="button button-light" style="width:100%" data-add-detail="${g.id}">Добавить в корзину <span>＋</span></button>`}
        <div class="detail-meta"><span>✓ АНИМИРОВАННЫЙ ПОДАРОК</span><span>✓ ${g.sku}</span></div>
      </div>
    </div>
  </section>`;
}

function currentRoute() {
  const params = new URLSearchParams(location.search);
  const queryPage = params.get('page');
  if (queryPage === 'privacy' || queryPage === 'terms' || queryPage === 'reviews') {
    return { page: queryPage };
  }

  const queryGift = params.get('gift');
  if (queryGift) {
    return { page: 'gift', id: queryGift };
  }

  const hash = location.hash.replace(/^#/, '');
  if (hash.startsWith('privacy')) return { page: 'privacy' };
  if (hash.startsWith('terms')) return { page: 'terms' };
  if (hash.startsWith('reviews')) return { page: 'reviews' };

  if (hash && !hash.startsWith('tgWebApp')) {
    if (hash.startsWith('gift/')) {
      return { page: 'gift', id: hash.slice(5) };
    }
    return { page: hash };
  }

  return { page: 'home' };
}

function render() {
  const route = currentRoute();
  const pages = {
    home: renderHome,
    catalog: renderCatalog,
    reviews: renderReviews,
    about: renderAbout,
    faq: renderFaq,
    contacts: renderContacts,
    admin: renderAdmin,
    privacy: renderPrivacy,
    terms: renderTerms
  };
  app.innerHTML = route.page === 'gift' ? renderGift(route.id) : (pages[route.page] || renderHome)();
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === route.page));
  $('#mobileNav').classList.remove('show');
  $('#mobileMenuTrigger').classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function showToast(message) {
  const t = $('#toast');
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2100);
}

function addToCart(id, selectedCurrency = currency) {
  const g = getGift(id);
  if (!g) return;
  if (g.reserved) {
    showToast('Этот подарок сейчас в брони');
    return;
  }
  currency = selectedCurrency;
  localStorage.setItem('giftMarketCurrency', currency);
  const existing = cart.find(x => x.id === id);
  if (existing) {
    showToast(`${g.name} уже в корзине (1 шт.)`);
    return;
  }
  cart.push({ id, qty: 1 });
  saveCart();
  renderCart();
  showToast(`${g.name} добавлен в корзину`);
}

function renderCart() {
  const count = cart.length;
  $('#cartCount').textContent = count;
  $('#cartCurrency').value = currency;
  const container = $('#cartItems');
  if (!cart.length) {
    container.innerHTML = '<div class="empty-cart"><span>▱</span>Здесь пока пусто.<br>Добавь первый подарок из каталога.</div>';
    $('#cartTotal').textContent = money(0, currency);
    return;
  }
  let total = 0;
  container.innerHTML = cart.map(line => {
    const g = getGift(line.id);
    if (!g) return '';
    total += g.prices[currency];
    return `<div class="cart-line">
      <img class="gift-cutout" src="${g.file}" alt="${g.name} ${g.model}">
      <div>
        <b>${g.name}</b>
        <small>${g.model} · ${g.number} · 1 шт.</small>
      </div>
      <div class="line-end">
        <strong>${money(g.prices[currency], currency)}</strong>
        <button class="remove-line" data-remove="${g.id}" aria-label="Удалить">×</button>
      </div>
    </div>`;
  }).join('');
  $('#cartTotal').textContent = money(total, currency);
}

function openCart() {
  $('#scrim').classList.add('show');
  $('#cartPanel').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  $('#scrim').classList.remove('show');
  $('#cartPanel').classList.remove('show');
  document.body.style.overflow = '';
}

function openModal(content) {
  $('#modalContent').innerHTML = content;
  $('#modalLayer').classList.add('show');
  $('#modalLayer').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#modalLayer').classList.remove('show');
  $('#modalLayer').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function getOrderMessageText() {
  if (!cart.length) return '';
  const itemsText = cart.map(line => {
    const g = getGift(line.id);
    return g ? `${g.name} (${g.model} ${g.number}) — ${money(g.prices[currency], currency)}` : '';
  }).filter(Boolean).join(', ');
  const total = cart.reduce((s, line) => s + getGift(line.id).prices[currency], 0);
  return `Привет! Хочу купить: ${itemsText}. Итого: ${money(total, currency)}`;
}

function openCheckout() {
  if (!cart.length) {
    showToast('Корзина пока пуста');
    return;
  }
  closeCart();
  showToast('Выбери админа в контактах для покупки');
  if (location.hash === '#contacts') {
    render();
  } else {
    location.hash = 'contacts';
  }
}

function openTgGiftModal(giftId) {
  const g = getGift(giftId);
  if (!g) return;

  const previewBox = document.getElementById('tg-modal-preview');
  const videoEl = document.getElementById('tg-modal-video');
  let imgFallback = document.getElementById('tg-modal-img-fallback');
  if (!imgFallback) {
    imgFallback = document.createElement('img');
    imgFallback.id = 'tg-modal-img-fallback';
    imgFallback.className = 'tg-modal-video';
    imgFallback.style.objectFit = 'contain';
    imgFallback.style.padding = '28px';
    previewBox.appendChild(imgFallback);
  }

  const mediaSrc = g.video || g.file;
  const isVideo = g.previewIsVideo !== undefined
    ? g.previewIsVideo
    : (mediaSrc.startsWith('data:video/') || /\.(mp4|webm|ogg)(\?.*)?$/i.test(mediaSrc));

  if (isVideo) {
    imgFallback.style.display = 'none';
    videoEl.style.display = 'block';
    videoEl.src = mediaSrc;
    videoEl.load();
    videoEl.play().catch(() => {});
  } else {
    videoEl.pause();
    videoEl.style.display = 'none';
    imgFallback.style.display = 'block';
    imgFallback.src = mediaSrc;
  }

  document.getElementById('trait-model-name').textContent = g.traits.model.name;
  document.getElementById('trait-model-chance').textContent = g.traits.model.chance;

  document.getElementById('trait-pattern-name').textContent = g.traits.pattern.name;
  document.getElementById('trait-pattern-chance').textContent = g.traits.pattern.chance;

  document.getElementById('trait-bg-name').textContent = g.traits.backdrop.name;
  document.getElementById('trait-bg-chance').textContent = g.traits.backdrop.chance;

  const modalCartBtn = document.getElementById('tg-modal-cart-btn');
  if (g.reserved) {
    modalCartBtn.disabled = true;
    modalCartBtn.innerHTML = 'Подарок в брони';
    modalCartBtn.onclick = null;
  } else {
    modalCartBtn.disabled = false;
    modalCartBtn.innerHTML = `Добавить в корзину (${money(g.prices[currency], currency)}) <span>＋</span>`;
    modalCartBtn.onclick = () => {
      addToCart(g.id);
      closeTgGiftModal();
    };
  }

  document.getElementById('tg-gift-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeTgGiftModal() {
  const modal = document.getElementById('tg-gift-modal');
  const videoEl = document.getElementById('tg-modal-video');
  modal.classList.remove('active');
  videoEl.pause();
  document.body.style.overflow = '';
}

function initLegalConsentPopup() {
  const legalModal = document.getElementById('legalConsentModal');
  const acceptBtn = document.getElementById('acceptLegalBtn');
  const openPrivacyLink = document.getElementById('consentOpenPrivacy');
  const openTermsLink = document.getElementById('consentOpenTerms');
  if (!legalModal) return;

  const route = currentRoute();
  const isReadingDoc = route.page === 'privacy' || route.page === 'terms';
  const accepted = localStorage.getItem('gmLegalAccepted_2026_11_24') === '1';

  if (!accepted && !isReadingDoc) {
    legalModal.classList.add('show');
    legalModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  const closeAndAccept = () => {
    localStorage.setItem('gmLegalAccepted_2026_11_24', '1');
    legalModal.classList.remove('show');
    legalModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  if (acceptBtn) acceptBtn.addEventListener('click', closeAndAccept);
  if (openPrivacyLink) openPrivacyLink.addEventListener('click', closeAndAccept);
  if (openTermsLink) openTermsLink.addEventListener('click', closeAndAccept);
}

function initCurrencyCalculator() {
  const bynInput = document.getElementById('calcByn');
  const tonInput = document.getElementById('calcTon');
  const starsInput = document.getElementById('calcStars');
  const infoEl = document.getElementById('calcRatesInfo');
  if (!bynInput || !tonInput || !starsInput) return;

  const STAR_USD_FRAGMENT = 0.015;
  let tonUsd = 0.97;
  let bynPerUsd = 2.99;

  function updateInfoLabel() {
    if (!infoEl) return;
    const starsPerTon = tonUsd > 0 ? Math.round(tonUsd / STAR_USD_FRAGMENT) : 0;
    infoEl.textContent = `1 TON ≈ $${tonUsd.toFixed(2)} · 1 USD ≈ ${bynPerUsd.toFixed(2)} BYN · 1 TON ≈ ${starsPerTon} Stars`;
  }

  function formatNum(val, decimals = 2) {
    if (!Number.isFinite(val) || val <= 0) return '';
    return Number(val.toFixed(decimals)).toString();
  }

  function recalcFrom(source) {
    if (source === 'byn') {
      const byn = parseFloat(bynInput.value);
      if (!Number.isFinite(byn) || byn <= 0) {
        tonInput.value = '';
        starsInput.value = '';
        return;
      }
      const usd = byn / bynPerUsd;
      tonInput.value = formatNum(usd / tonUsd, 4);
      starsInput.value = String(Math.round(usd / STAR_USD_FRAGMENT));
    } else if (source === 'ton') {
      const ton = parseFloat(tonInput.value);
      if (!Number.isFinite(ton) || ton <= 0) {
        bynInput.value = '';
        starsInput.value = '';
        return;
      }
      const usd = ton * tonUsd;
      bynInput.value = formatNum(usd * bynPerUsd, 2);
      starsInput.value = String(Math.round(usd / STAR_USD_FRAGMENT));
    } else if (source === 'stars') {
      const stars = parseFloat(starsInput.value);
      if (!Number.isFinite(stars) || stars <= 0) {
        bynInput.value = '';
        tonInput.value = '';
        return;
      }
      const usd = stars * STAR_USD_FRAGMENT;
      bynInput.value = formatNum(usd * bynPerUsd, 2);
      tonInput.value = formatNum(usd / tonUsd, 4);
    }
  }

  bynInput.addEventListener('input', () => recalcFrom('byn'));
  tonInput.addEventListener('input', () => recalcFrom('ton'));
  starsInput.addEventListener('input', () => recalcFrom('stars'));

  updateInfoLabel();

  Promise.allSettled([
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd').then(r => r.ok ? r.json() : null),
    fetch('https://open.er-api.com/v6/latest/USD').then(r => r.ok ? r.json() : null)
  ]).then(([tonRes, fxRes]) => {
    const fetchedTon = tonRes.status === 'fulfilled' ? tonRes.value?.['the-open-network']?.usd : null;
    if (typeof fetchedTon === 'number' && fetchedTon > 0) tonUsd = fetchedTon;
    const fetchedByn = fxRes.status === 'fulfilled' ? fxRes.value?.rates?.BYN : null;
    if (typeof fetchedByn === 'number' && fetchedByn > 0) bynPerUsd = fetchedByn;
    updateInfoLabel();

    if (bynInput.value) recalcFrom('byn');
    else if (tonInput.value) recalcFrom('ton');
    else if (starsInput.value) recalcFrom('stars');
  });
}

app.addEventListener('click', e => {
  const add = e.target.closest('[data-add]');
  if (add) {
    addToCart(add.dataset.add);
    return;
  }
  const detail = e.target.closest('[data-details]');
  if (detail) {
    location.hash = `gift/${detail.dataset.details}`;
    return;
  }
  const addDetail = e.target.closest('[data-add-detail]');
  if (addDetail) {
    addToCart(addDetail.dataset.addDetail, $('#detailCurrency').value);
    openCart();
    return;
  }
  const tgCard = e.target.closest('[data-tg-gift]');
  if (tgCard && !e.target.closest('button')) {
    openTgGiftModal(tgCard.dataset.tgGift);
    return;
  }
});

$('#cartItems').addEventListener('click', e => {
  const rem = e.target.closest('[data-remove]');
  if (rem) {
    cart = cart.filter(x => x.id !== rem.dataset.remove);
    saveCart();
    renderCart();
  }
});

$('#cartCurrency').addEventListener('change', e => {
  currency = e.target.value;
  localStorage.setItem('giftMarketCurrency', currency);
  renderCart();
  const catalogSelect = $('#catalogCurrency');
  if (catalogSelect) catalogSelect.value = currency;
});

app.addEventListener('change', e => {
  if (e.target.id === 'catalogCurrency') {
    currency = e.target.value;
    localStorage.setItem('giftMarketCurrency', currency);
    $('#cartCurrency').value = currency;
    renderCart();
  }
  if (e.target.id === 'revGiftSelect') {
    const opt = e.target.options[e.target.selectedIndex];
    const titleEl = $('#revGiftTitle');
    const priceEl = $('#revPriceLabel');
    if (e.target.value && e.target.value !== 'CUSTOM' && titleEl && priceEl) {
      titleEl.value = e.target.value;
      priceEl.value = opt?.dataset?.price || '';
    }
  }
});

app.addEventListener('click', e => {
  const copyBtn = e.target.closest('#copyOrderBtn');
  if (copyBtn) {
    const txt = getOrderMessageText();
    if (navigator.clipboard && txt) {
      navigator.clipboard.writeText(txt).then(() => showToast('Текст заказа скопирован'));
    }
    return;
  }
  const faq = e.target.closest('.faq-question');
  if (faq) faq.parentElement.classList.toggle('open');
});

app.addEventListener('submit', async e => {
  if (e.target.id === 'addReviewForm') {
    e.preventDefault();
    const form = e.target;
    const payload = {
      author: form.author.value.trim(),
      giftTitle: form.giftTitle.value.trim(),
      priceLabel: form.priceLabel.value.trim(),
      rating: Number(form.rating.value || 5),
      comment: form.comment.value.trim()
    };
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Ошибка отправки');
      REVIEWS = await res.json();
      localStorage.setItem('gmFallbackReviews', JSON.stringify(REVIEWS));
      form.reset();
      render();
      showToast('Отзыв опубликован!');
    } catch (err) {
      showToast('Не удалось опубликовать отзыв');
    } finally {
      if (btn) btn.disabled = false;
    }
    return;
  }

  const replyForm = e.target.closest('.admin-review-reply-form');
  if (replyForm) {
    e.preventDefault();
    const reviewId = replyForm.dataset.reviewId;
    const replyText = replyForm.reply.value.trim();
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': getAdminPassword()
        },
        body: JSON.stringify({ reply: replyText, replyBy: 'Админ' })
      });
      if (!res.ok) throw new Error('Ошибка ответа');
      REVIEWS = await res.json();
      localStorage.setItem('gmFallbackReviews', JSON.stringify(REVIEWS));
      render();
      showToast('Ответ сохранён!');
    } catch (err) {
      showToast('Не удалось сохранить ответ');
    }
  }
});

$('#openCart').addEventListener('click', openCart);
$('#closeCart').addEventListener('click', closeCart);
$('#scrim').addEventListener('click', closeCart);
$('#checkoutButton').addEventListener('click', () => {
  closeCart();
  openCheckout();
});
$('#closeModal').addEventListener('click', closeModal);
$('#modalLayer').addEventListener('click', e => {
  if (e.target.id === 'modalLayer') closeModal();
});

$('#modalContent').addEventListener('submit', e => {
  if (e.target.id !== 'checkoutForm') return;
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const order = {
    ...data,
    currency,
    total: cart.reduce((s, line) => s + getGift(line.id).prices[currency] * line.qty, 0),
    items: cart.map(line => ({ name: getGift(line.id).name, qty: line.qty })),
    createdAt: new Date().toISOString()
  };
  const orders = JSON.parse(localStorage.getItem('giftMarketOrders') || '[]');
  orders.push(order);
  localStorage.setItem('giftMarketOrders', JSON.stringify(orders));
  cart = [];
  saveCart();
  renderCart();
  e.target.style.display = 'none';
  $('#orderSuccess').style.display = 'block';
  showToast('Заявка сохранена');
});

$('#mobileMenuTrigger').addEventListener('click', () => {
  $('#mobileNav').classList.toggle('show');
});
$('#mobileNav').addEventListener('click', e => {
  if (e.target.closest('a')) $('#mobileNav').classList.remove('show');
});

window.addEventListener('hashchange', () => {
  const hash = location.hash.replace(/^#/, '');
  if (hash && !hash.startsWith('tgWebApp') && (location.search.includes('gift=') || location.search.includes('page='))) {
    history.replaceState(null, '', location.pathname + location.hash);
  }
  render();
});

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeCart();
    closeModal();
    closeTgGiftModal();
    $('#mobileNav').classList.remove('show');
  }
});

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

app.addEventListener('input', e => {
  if (!e.target.closest('#addGiftForm')) return;
  const name = $('#gfName')?.value.trim() || 'Новый подарок';
  const num = $('#gfNumber')?.value.trim() || '#10 001';
  const model = $('#gfModel')?.value.trim() || 'Cyber Edition';
  const ton = Number($('#gfTon')?.value || 0);
  const byn = Number($('#gfByn')?.value || 0);
  const stars = Number($('#gfStars')?.value || 0);

  if ($('#prevName')) $('#prevName').textContent = name;
  if ($('#prevNumber')) $('#prevNumber').textContent = num;
  if ($('#prevSku')) $('#prevSku').textContent = num;
  if ($('#prevModel')) $('#prevModel').textContent = model;
  if ($('#prevTon')) $('#prevTon').textContent = money(ton, 'TON');
  if ($('#prevByn')) $('#prevByn').textContent = money(byn, 'BYN');
  if ($('#prevStars')) $('#prevStars').textContent = money(stars, 'STARS');
});

app.addEventListener('change', async e => {
  if (e.target.id === 'gfAvatarFile' && e.target.files[0]) {
    const url = await readFileAsDataURL(e.target.files[0]);
    if ($('#prevAvatarImg')) $('#prevAvatarImg').src = url;
  }
});

app.addEventListener('submit', async e => {
  if (e.target.id !== 'addGiftForm') return;
  e.preventDefault();

  const isEditing = Boolean(editingGiftId);
  const avatarInput = $('#gfAvatarFile');
  if (!isEditing && !avatarInput.files[0]) {
    showToast('Выбери картинку или гифку подарка');
    return;
  }

  const name = $('#gfName').value.trim();
  const rawNum = $('#gfNumber').value.trim();
  const number = rawNum.startsWith('#') ? rawNum : `#${rawNum}`;
  const model = $('#gfModel').value.trim();
  const ton = Number($('#gfTon').value || 0);
  const byn = Number($('#gfByn').value || 0);
  const stars = Number($('#gfStars').value || 0);
  const reserved = $('#gfReserved').value === 'true';
  const description = $('#gfDescription').value.trim();
  const modelChance = $('#gfModelChance').value.trim() || '1.5%';
  const pattern = $('#gfPattern').value.trim() || 'Starlight';
  const patternChance = $('#gfPatternChance').value.trim() || '0.5%';
  const backdrop = $('#gfBackdrop').value.trim() || 'Onyx Dark';
  const backdropChance = $('#gfBackdropChance').value.trim() || '1.5%';

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  showToast('Сохранение на сервер...');

  try {
    const fd = new FormData();
    fd.append('name', name);
    fd.append('number', number);
    fd.append('model', model);
    fd.append('modelChance', modelChance);
    fd.append('pattern', pattern);
    fd.append('patternChance', patternChance);
    fd.append('backdrop', backdrop);
    fd.append('backdropChance', backdropChance);
    fd.append('priceTon', String(ton));
    fd.append('priceByn', String(byn));
    fd.append('priceStars', String(stars));
    fd.append('reserved', String(reserved));
    fd.append('description', description);

    if (avatarInput.files[0]) fd.append('avatar', avatarInput.files[0]);
    const previewInput = $('#gfPreviewFile');
    if (previewInput.files[0]) fd.append('preview', previewInput.files[0]);

    const url = isEditing ? `/api/gifts/${encodeURIComponent(editingGiftId)}` : '/api/gifts';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'x-admin-password': getAdminPassword() },
      body: fd
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Ошибка сервера');
    }

    const updatedList = await res.json();
    GIFTS = updatedList;
    editingGiftId = null;

    cart = cart.filter(line => {
      const item = getGift(line.id);
      return item && !item.reserved;
    });
    saveCart();
    renderCart();

    showToast(isEditing ? `Изменения для «${name}» сохранены для всех!` : `Подарок «${name}» опубликован для всех!`);
    if (isEditing) {
      render();
    } else {
      location.hash = 'catalog';
    }
  } catch (err) {
    showToast('Ошибка: ' + err.message);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

app.addEventListener('click', async e => {
  if (e.target.closest('#adminLogoutBtn')) {
    adminUnlocked = false;
    editingGiftId = null;
    sessionStorage.removeItem('gmAdminUnlocked');
    sessionStorage.removeItem('gmAdminPass');
    showToast('Вы вышли из панели администратора');
    location.hash = 'home';
    return;
  }

  if (e.target.closest('#cancelEditBtn') || e.target.closest('#cancelEditBtnBottom')) {
    editingGiftId = null;
    render();
    return;
  }

  const editBtn = e.target.closest('[data-edit-gift]');
  if (editBtn) {
    editingGiftId = editBtn.dataset.editGift;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const toggleBtn = e.target.closest('[data-toggle-reserve]');
  if (toggleBtn) {
    const id = toggleBtn.dataset.toggleReserve;
    try {
      const res = await fetch(`/api/gifts/${encodeURIComponent(id)}/reserve`, {
        method: 'PATCH',
        headers: { 'x-admin-password': getAdminPassword() }
      });
      if (!res.ok) throw new Error('Ошибка изменения брони');
      GIFTS = await res.json();
      cart = cart.filter(line => {
        const item = getGift(line.id);
        return item && !item.reserved;
      });
      saveCart();
      renderCart();
      render();
      const g = getGift(id);
      showToast(g && g.reserved ? 'Подарок переведён в бронь' : 'Статус брони снят');
    } catch (err) {
      showToast('Не удалось обновить статус');
    }
    return;
  }

  const delBtn = e.target.closest('[data-delete-gift]');
  if (delBtn) {
    const id = String(delBtn.dataset.deleteGift || '');
    if (!id) {
      showToast('Не удалось определить ID подарка');
      return;
    }
    if (!confirm('Точно удалить этот подарок из каталога для всех пользователей?')) return;

    delBtn.disabled = true;
    delBtn.textContent = '…';
    try {
      const res = await fetch(`/api/gifts/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        cache: 'no-store',
        headers: { 'x-admin-password': getAdminPassword() }
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.error || `Сервер вернул ошибку ${res.status}`);
      }
      if (!Array.isArray(result)) throw new Error('Сервер вернул некорректный список подарков');

      GIFTS = result;
      editingGiftId = null;
      cart = cart.filter(line => line.id !== id);
      saveCart();
      renderCart();
      render();
      showToast('Подарок удалён из каталога');
    } catch (err) {
      console.error('Gift deletion failed:', err);
      showToast('Ошибка удаления: ' + (err.message || 'неизвестная ошибка'));
      delBtn.disabled = false;
      delBtn.textContent = '×';
    }
    return;
  }

  if (e.target.closest('#exportCatalogBtn')) {
    const blob = new Blob([JSON.stringify(GIFTS, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gifts_catalog.json';
    a.click();
    showToast('JSON каталога скачан');
  }
});

let secretClicks = 0;
let secretTimer;
const secretTrigger = document.getElementById('secretAdminTrigger');
if (secretTrigger) {
  secretTrigger.addEventListener('click', () => {
    secretClicks++;
    clearTimeout(secretTimer);
    secretTimer = setTimeout(() => { secretClicks = 0; }, 1500);
    if (secretClicks >= 5) {
      secretClicks = 0;
      location.hash = 'admin';
    }
  });
}

app.addEventListener('submit', async e => {
  if (e.target.id !== 'adminLoginForm') return;
  e.preventDefault();
  const val = ($('#adminPassInput')?.value || '').trim();
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: val })
    });
    if (res.ok) {
      adminUnlocked = true;
      sessionStorage.setItem('gmAdminUnlocked', '1');
      sessionStorage.setItem('gmAdminPass', val);
      showToast('Доступ разрешён');
      render();
      return;
    }
  } catch (err) {
    if (val === 'n3yranftlox228') {
      adminUnlocked = true;
      sessionStorage.setItem('gmAdminUnlocked', '1');
      sessionStorage.setItem('gmAdminPass', val);
      showToast('Доступ разрешён (локальный режим)');
      render();
      return;
    }
  }
  showToast('Неверный пароль');
  if ($('#adminPassInput')) $('#adminPassInput').value = '';
});

render();
renderCart();
initLegalConsentPopup();
initCurrencyCalculator();

(async function syncGiftsFromServerOnStart() {
  await Promise.all([fetchServerGifts(), fetchServerReviews()]);
  cart = cart.filter(line => {
    const g = getGift(line.id);
    return g && !g.reserved;
  });
  saveCart();
  render();
  renderCart();
})();
