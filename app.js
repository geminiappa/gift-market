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

let CUSTOM_GIFTS = [];
let GIFTS = [...DEFAULT_GIFTS];

/* === IndexedDB хранилище для кастомных подарков (поддерживает тяжелые GIF/WEBP/MP4) === */
const DB_NAME = 'GiftMarketCustomDB';
const DB_STORE = 'gifts';

function openGiftsDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadCustomGifts() {
  try {
    const db = await openGiftsDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

async function saveCustomGiftToDB(giftObj) {
  const db = await openGiftsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(giftObj);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteCustomGiftFromDB(id) {
  const db = await openGiftsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function rebuildGiftsList() {
  const hiddenIds = JSON.parse(localStorage.getItem('giftMarketHiddenIds') || '[]');
  const reservedOverrides = JSON.parse(localStorage.getItem('giftMarketReservedOverrides') || '{}');
  const editedOverrides = JSON.parse(localStorage.getItem('giftMarketEditedOverrides') || '{}');
  const base = DEFAULT_GIFTS
    .filter(g => !hiddenIds.includes(g.id))
    .map(g => {
      const ov = editedOverrides[g.id] || {};
      const merged = {
        ...g,
        ...ov,
        prices: { ...g.prices, ...(ov.prices || {}) },
        traits: {
          model: { ...g.traits.model, ...(ov.traits?.model || {}) },
          pattern: { ...g.traits.pattern, ...(ov.traits?.pattern || {}) },
          backdrop: { ...g.traits.backdrop, ...(ov.traits?.backdrop || {}) }
        }
      };
      merged.subtitle = `Коллекционный подарок · модель ${merged.model}`;
      if (reservedOverrides[g.id] !== undefined) {
        merged.reserved = reservedOverrides[g.id];
      }
      return merged;
    });
  GIFTS = [...base, ...CUSTOM_GIFTS];
}

const CURRENCIES = ['TON', 'BYN', 'STARS'];
const app = document.getElementById('app');
const $ = s => document.querySelector(s);
let currency = localStorage.getItem('giftMarketCurrency') || 'TON';
let cart = JSON.parse(localStorage.getItem('giftMarketCart') || '[]');
let toastTimer;

const money = (amount, code) => `${amount.toLocaleString('en-US')} ${code}`;
const saveCart = () => localStorage.setItem('giftMarketCart', JSON.stringify(cart));
const getGift = id => GIFTS.find(g => g.id === id);

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
      <div class="stage-index"><b>01</b> / 05 <span> ✓</span></div>
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
    <div class="benefit"><span class="benefit-icon">✓</span><div><b>Пять оригинальных подарков</b><p>Анимации из нашей коллекции без подмены изображениями.</p></div></div>
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

function renderAbout() {
  return `<section class="page-intro">
    <div>
      <div class="eyebrow">ABOUT GIFT MARKET</div>
      <h1>О <span>магазине.</span></h1>
    </div>
    <p>GIFT MARKET — концепция отдельного магазина цифровых подарков с собственным визуальным стилем.</p>
  </section>
  <section class="split-panel">
    <div>
      <div class="eyebrow">OUR IDEA</div>
      <h2>Меньше лишнего.<br><span>Больше впечатлений.</span></h2>
      <p>Мы собрали небольшую коллекцию цифровых подарков и оформили её в спокойной серо-чёрной эстетике. У каждого товара есть собственная карточка, анимация и прозрачная цена в TON, BYN и Telegram Stars.</p>
      <a class="button button-light" href="#catalog">Посмотреть подарки <span>↗</span></a>
    </div>
    <div class="split-visual"><img src="assets/logo.jpg" alt="GIFT MARKET" style="width:120px;height:120px;border-radius:24px;object-fit:cover;"></div>
  </section>
  <div class="eyebrow">WHAT YOU GET</div>
  <div class="info-grid">
    <article class="info-card"><span class="info-num">01 / COLLECTION</span><h3>Оригинальные анимации</h3><p>В каталоге используются пять оригинальных анимаций из коллекции.</p></article>
    <article class="info-card"><span class="info-num">02 / CLEAR PRICES</span><h3>Понятные цены</h3><p>У каждого подарка отображаются три заданные цены без скрытого пересчёта.</p></article>
    <article class="info-card"><span class="info-num">03 / EXPERIENCE</span><h3>Единый интерфейс</h3><p>Каталог, страницы товаров, корзина и справочные разделы выдержаны в одном стиле.</p></article>
  </div>`;
}

function renderPayment() {
  return `<section class="page-intro">
    <div>
      <div class="eyebrow">PAYMENT INFORMATION</div>
      <h1>Оплата <span>и цены.</span></h1>
    </div>
    <p>Выбирай валюту, в которой хочешь оформить заявку. Текущая версия сайта показывает цены и формирует демо-заказ.</p>
  </section>
  <div class="payment-list">
    <article class="payment-card"><span class="payment-code">01 / CRYPTO</span><h3>TON</h3><p>Цены отображаются в TON. Для приёма реальных платежей потребуется подключить TON Connect и серверную проверку транзакций.</p><span class="status-pill">Оплата не подключена</span></article>
    <article class="payment-card"><span class="payment-code">02 / LOCAL</span><h3>BYN</h3><p>Белорусские рубли указаны как отдельная цена товара. Приём платежей BYN требует подключения выбранного платёжного провайдера.</p><span class="status-pill">Оплата не подключена</span></article>
    <article class="payment-card"><span class="payment-code">03 / TELEGRAM</span><h3>STARS</h3><p>Для реальной оплаты Telegram Stars нужно подключить Telegram-бота и обработку успешных платежей на сервере.</p><span class="status-pill">Оплата не подключена</span></article>
  </div>
  <div class="eyebrow">HOW TO ORDER</div>
  <div class="info-grid">
    <article class="info-card"><span class="info-num">STEP 01</span><h3>Выбери подарок</h3><p>Перейди в каталог и открой карточку нужного товара.</p></article>
    <article class="info-card"><span class="info-num">STEP 02</span><h3>Добавь в корзину</h3><p>Укажи валюту заказа и собери нужный набор.</p></article>
    <article class="info-card"><span class="info-num">STEP 03</span><h3>Оставь заявку</h3><p>Укажи контакт. В этой версии заявка сохраняется только локально в браузере.</p></article>
  </div>
  <div class="notice-box">Важно: в текущей сборке реальные списания и перевод средств не выполняются. Не отправляй деньги на адреса, указанные неизвестными лицами. Платёжные интеграции необходимо подключить и протестировать отдельно.</div>`;
}

function renderFaq() {
  const items = [
    ['Какие подарки есть в магазине?', 'В каталоге представлены Happy Brownie — Deadpoo, Pool Float — Air Bunny, Pool Float — Water Tank, Chill Flame — Lego и Input Key — Astrobot. Water Tank сейчас отмечен как «БРОНЬ».'],
    ['В каких валютах указаны цены?', 'Для каждого подарка отображаются отдельные цены в TON, BYN и Telegram Stars.'],
    ['Сколько штук можно купить?', 'Каждый коллекционный NFT-подарок представлен в единственном экземпляре (1 шт.). После нажатия «Оформить заказ» тебя перенаправит в «Контакты», где можно сразу написать админу @n3yura или @NekosikN.'],
    ['Как происходит оплата?', 'Пока сайт работает в демонстрационном режиме: он формирует заявку, но не принимает реальные платежи.'],
    ['Где посмотреть сам подарок и шансы?', 'Нажми прямо на карточку подарка в каталоге — откроется превью в цвете с фоном, узором и процентами редкости из Telegram.'],
    ['Сохраняется ли корзина?', 'Да, корзина и выбранная валюта сохраняются в локальном хранилище текущего браузера.']
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
      <p class="selected-order-hint">Нажми на любого администратора ниже — откроется чат в Telegram с готовым сообщением для покупки.</p>
    </div>
  ` : '';

  return `<section class="page-intro">
    <div>
      <div class="eyebrow">GET IN TOUCH</div>
      <h1>Связаться <span>с нами.</span></h1>
    </div>
    <p>Для покупки подарка нажми на одного из администраторов ниже и напиши в Telegram.</p>
  </section>
  <div class="contact-layout contact-single">
    <section class="contact-card">
      <div class="eyebrow">TEAM & ADMINS</div>
      <h3>Администрация магазина.</h3>
      <p>Выбери администратора, чтобы перейти в Telegram и написать для покупки.</p>
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
      </div>

      <div class="contact-detail"><small>WORKING HOURS</small><b>Ежедневно · отвечаем в Telegram</b></div>
    </section>
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
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:12px;">
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
  const hash = location.hash.replace(/^#/, '') || 'home';
  if (hash.startsWith('gift/')) return { page: 'gift', id: hash.split('/')[1] };
  return { page: hash };
}

function render() {
  const route = currentRoute();
  const pages = {
    home: renderHome,
    catalog: renderCatalog,
    about: renderAbout,
    payment: renderPayment,
    faq: renderFaq,
    contacts: renderContacts,
    admin: renderAdmin
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

/* === Telegram NFT Card Viewer с видео (без дублирующих надписей) === */
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

window.addEventListener('hashchange', render);
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

// Живой предпросмотр в конструкторе подарков
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

// Сохранение нового или отредактированного подарка
app.addEventListener('submit', async e => {
  if (e.target.id !== 'addGiftForm') return;
  e.preventDefault();

  const isEditing = Boolean(editingGiftId);
  const existingGift = isEditing ? getGift(editingGiftId) : null;

  const avatarInput = $('#gfAvatarFile');
  if (!isEditing && !avatarInput.files[0]) {
    showToast('Выбери картинку или гифку подарка');
    return;
  }

  let avatarData = existingGift ? existingGift.file : '';
  if (avatarInput.files[0]) {
    avatarData = await readFileAsDataURL(avatarInput.files[0]);
  }

  const previewInput = $('#gfPreviewFile');
  let previewData = existingGift ? existingGift.video : avatarData;
  let previewIsVideo = existingGift ? existingGift.previewIsVideo : false;

  if (previewInput.files[0]) {
    previewData = await readFileAsDataURL(previewInput.files[0]);
    previewIsVideo = previewInput.files[0].type.startsWith('video/');
  } else if (!isEditing && avatarInput.files[0]) {
    previewData = avatarData;
    previewIsVideo = false;
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
  const traits = {
    model: { name: model, chance: $('#gfModelChance').value.trim() || '1.5%' },
    pattern: { name: $('#gfPattern').value.trim() || 'Starlight', chance: $('#gfPatternChance').value.trim() || '0.5%' },
    backdrop: { name: $('#gfBackdrop').value.trim() || 'Onyx Dark', chance: $('#gfBackdropChance').value.trim() || '1.5%' }
  };

  if (isEditing && existingGift) {
    if (existingGift.isCustom) {
      const updated = {
        ...existingGift,
        name,
        number,
        model,
        file: avatarData,
        video: previewData,
        previewIsVideo,
        sku: number,
        prices: { TON: ton, BYN: byn, STARS: stars },
        subtitle: `Коллекционный подарок · модель ${model}`,
        description,
        reserved,
        traits
      };
      await saveCustomGiftToDB(updated);
      CUSTOM_GIFTS = CUSTOM_GIFTS.map(x => x.id === updated.id ? updated : x);
    } else {
      // Save override for built-in gift (heavy media files go to IndexedDB if changed, text fields to localStorage)
      const overrides = JSON.parse(localStorage.getItem('giftMarketEditedOverrides') || '{}');
      const ov = {
        name,
        number,
        sku: number,
        model,
        prices: { TON: ton, BYN: byn, STARS: stars },
        description,
        reserved,
        traits
      };
      if (avatarInput.files[0]) ov.file = avatarData;
      if (previewInput.files[0]) {
        ov.video = previewData;
        ov.previewIsVideo = previewIsVideo;
      }
      overrides[existingGift.id] = { ...(overrides[existingGift.id] || {}), ...ov };
      try {
        localStorage.setItem('giftMarketEditedOverrides', JSON.stringify(overrides));
      } catch (err) {
        // Fallback: store full modified copy in IndexedDB and hide original default id
        const dbCopy = {
          ...existingGift,
          ...ov,
          id: 'custom_' + Date.now(),
          isCustom: true
        };
        await saveCustomGiftToDB(dbCopy);
        CUSTOM_GIFTS.push(dbCopy);
        const hidden = JSON.parse(localStorage.getItem('giftMarketHiddenIds') || '[]');
        if (!hidden.includes(existingGift.id)) hidden.push(existingGift.id);
        localStorage.setItem('giftMarketHiddenIds', JSON.stringify(hidden));
      }
      const resOv = JSON.parse(localStorage.getItem('giftMarketReservedOverrides') || '{}');
      resOv[existingGift.id] = reserved;
      localStorage.setItem('giftMarketReservedOverrides', JSON.stringify(resOv));
    }

    editingGiftId = null;
    rebuildGiftsList();
    cart = cart.filter(line => {
      const item = getGift(line.id);
      return item && !item.reserved;
    });
    saveCart();
    renderCart();
    showToast(`Изменения для «${name}» сохранены!`);
    render();
    return;
  }

  const newGift = {
    id: 'custom_' + Date.now(),
    name,
    number,
    model,
    file: avatarData,
    video: previewData,
    previewIsVideo,
    sku: number,
    prices: { TON: ton, BYN: byn, STARS: stars },
    subtitle: `Коллекционный подарок · модель ${model}`,
    description,
    glow: '#414448',
    reserved,
    isCustom: true,
    traits
  };

  await saveCustomGiftToDB(newGift);
  CUSTOM_GIFTS.push(newGift);
  rebuildGiftsList();
  showToast(`Подарок «${name}» добавлен в каталог!`);
  location.hash = 'catalog';
});

// Управление подарками (Выход / Редактирование / Бронь / Удаление / Экспорт)
app.addEventListener('click', async e => {
  if (e.target.closest('#adminLogoutBtn')) {
    adminUnlocked = false;
    editingGiftId = null;
    sessionStorage.removeItem('gmAdminUnlocked');
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
    const g = getGift(id);
    if (!g) return;
    if (g.isCustom) {
      g.reserved = !g.reserved;
      await saveCustomGiftToDB(g);
    } else {
      const overrides = JSON.parse(localStorage.getItem('giftMarketReservedOverrides') || '{}');
      overrides[id] = !g.reserved;
      localStorage.setItem('giftMarketReservedOverrides', JSON.stringify(overrides));
    }
    rebuildGiftsList();
    cart = cart.filter(line => {
      const item = getGift(line.id);
      return item && !item.reserved;
    });
    saveCart();
    renderCart();
    render();
    showToast(g.reserved ? 'Статус брони снят' : 'Подарок переведён в бронь');
    return;
  }

  const delBtn = e.target.closest('[data-delete-gift]');
  if (delBtn) {
    const id = delBtn.dataset.deleteGift;
    const g = getGift(id);
    if (!g) return;
    if (editingGiftId === id) editingGiftId = null;
    if (g.isCustom) {
      await deleteCustomGiftFromDB(id);
      CUSTOM_GIFTS = CUSTOM_GIFTS.filter(x => x.id !== id);
    } else {
      const hidden = JSON.parse(localStorage.getItem('giftMarketHiddenIds') || '[]');
      if (!hidden.includes(id)) hidden.push(id);
      localStorage.setItem('giftMarketHiddenIds', JSON.stringify(hidden));
    }
    rebuildGiftsList();
    cart = cart.filter(line => line.id !== id);
    saveCart();
    renderCart();
    render();
    showToast('Подарок удалён из каталога');
    return;
  }

  if (e.target.closest('#exportCatalogBtn')) {
    const cleanData = GIFTS.map(({ file, video, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(cleanData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gifts_catalog.json';
    a.click();
    showToast('JSON каталога скачан');
  }
});

// Секретный вход: 5 кликов по "© 2026 GIFT MARKET" в самом низу сайта
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

// Проверка пароля при входе в админку
app.addEventListener('submit', e => {
  if (e.target.id !== 'adminLoginForm') return;
  e.preventDefault();
  const val = ($('#adminPassInput')?.value || '').trim();
  if (val === 'n3yranftlox228') {
    adminUnlocked = true;
    sessionStorage.setItem('gmAdminUnlocked', '1');
    showToast('Доступ разрешён');
    render();
  } else {
    showToast('Неверный пароль');
    if ($('#adminPassInput')) $('#adminPassInput').value = '';
  }
});

render();
renderCart();

(async function syncCustomGiftsOnStart() {
  try {
    CUSTOM_GIFTS = await loadCustomGifts();
    rebuildGiftsList();
    cart = cart.filter(line => {
      const g = getGift(line.id);
      return g && !g.reserved;
    });
    saveCart();
    render();
    renderCart();
  } catch (err) {
    console.error(err);
  }
})();

