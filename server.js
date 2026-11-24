const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'n3yranftlox228';

// Настройки Telegram Бота
const BOT_TOKEN = (process.env.BOT_TOKEN || '').trim();
const SITE_URL = (process.env.SITE_URL || process.env.RENDER_EXTERNAL_URL || '').trim().replace(/\/$/, '');
const ENV_ADMIN_IDS = (process.env.ADMIN_CHAT_IDS || '')
  .split(',')
  .map(s => Number(s.trim()))
  .filter(n => !Number.isNaN(n) && n !== 0);

// Белый список юзернеймов, которым приходят уведомления о бронях и покупках
const ALLOWED_NOTIFY_USERNAMES = new Set(['yapp1kc', 'nekosikn', 'n3yura']);

// GitHub Persistence
const GITHUB_TOKEN = (process.env.GITHUB_TOKEN || '').trim();
const GITHUB_REPO = (process.env.GITHUB_REPO || '').trim();
const GITHUB_BRANCH = (process.env.GITHUB_BRANCH || 'main').trim();
const GITHUB_BASE_PATH = (process.env.GITHUB_BASE_PATH || '').replace(/^\/|\/$/g, '');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const GIFTS_FILE = path.join(DATA_DIR, 'gifts.json');
const BOT_STATE_FILE = path.join(DATA_DIR, 'bot_state.json');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const DEFAULT_GIFTS = [
  {
    id: 'kakashka',
    name: 'Happy Brownie',
    number: '#200 024',
    model: 'Deadpoo',
    file: 'assets/gifts/deadpoo-60fps.webp',
    video: 'assets/source/kakashka.mp4',
    previewIsVideo: true,
    sku: '#200 024',
    prices: { TON: 8, BYN: 27, STARS: 550 },
    subtitle: 'Коллекционный подарок · модель Deadpoo',
    description: 'Happy Brownie #200 024 — коллекционный подарок в модели Deadpoo. Анимированная фигурка с оригинальной отделкой и яркими деталями.',
    glow: '#424044',
    reserved: false,
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
    previewIsVideo: true,
    sku: '#110 493',
    prices: { TON: 8, BYN: 27, STARS: 550 },
    subtitle: 'Коллекционный подарок · модель Air Bunny',
    description: 'Pool Float #110 493 — модель Air Bunny. Белый надувной круг с кроликом и морковкой, представленный в виде оригинальной анимации.',
    glow: '#414448',
    reserved: false,
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
    previewIsVideo: true,
    sku: '#52 138',
    prices: { TON: 8, BYN: 27, STARS: 550 },
    subtitle: 'Коллекционный подарок · модель Water Tank',
    description: 'Pool Float #52 138 — модель Water Tank. Необычный водный танк с утёнком и брызгами. Сейчас подарок находится в брони.',
    glow: '#3f4441',
    reserved: true,
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
    previewIsVideo: true,
    sku: '#28 962',
    prices: { TON: 6, BYN: 20, STARS: 460 },
    subtitle: 'Коллекционный подарок · модель Lego',
    description: 'Chill Flame #28 962 — модель Lego. Детализированный факел с ярким пламенем и анимированным движением.',
    glow: '#45413e',
    reserved: false,
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
    previewIsVideo: true,
    sku: '#21 990',
    prices: { TON: 15, BYN: 50, STARS: 1150 },
    subtitle: 'Коллекционный подарок · модель Astrobot',
    description: 'Input Key #21 990 — модель Astrobot. Футуристичная клавиша с тёмным дисплеем и металлическим корпусом.',
    glow: '#3e4147',
    reserved: false,
    traits: {
      model: { name: 'Astrobot', chance: '1.5%' },
      pattern: { name: 'Succubus', chance: '0.5%' },
      backdrop: { name: 'French Blue', chance: '1.5%' }
    }
  }
];

function ghRepoPath(relPath) {
  return GITHUB_BASE_PATH ? `${GITHUB_BASE_PATH}/${relPath}` : relPath;
}

async function githubPutFile(relPath, bufferContent, commitMessage) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) return false;
  const fullRepoPath = ghRepoPath(relPath);
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${fullRepoPath}`;
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'GiftMarket-Render-App',
    'Content-Type': 'application/json'
  };

  let sha = undefined;
  try {
    const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(GITHUB_BRANCH)}`, { headers });
    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    }
  } catch (e) {}

  const body = {
    message: commitMessage,
    content: bufferContent.toString('base64'),
    branch: GITHUB_BRANCH
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });

  return putRes.ok;
}

async function githubFetchJson(relPath) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) return null;
  const fullRepoPath = ghRepoPath(relPath);
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${fullRepoPath}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  try {
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'GiftMarket-Render-App'
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const decoded = Buffer.from(data.content, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

/* === Хранилище статистики бота, подписчиков и разрешённых админов === */
function defaultBotState() {
  return {
    users: [],
    subscribers: [],
    adminIds: [...ENV_ADMIN_IDS],
    stats: {
      viewsByGift: {},
      buyClicks: 0,
      reserveClicks: 0
    }
  };
}

function readBotState() {
  if (!fs.existsSync(BOT_STATE_FILE)) {
    const init = defaultBotState();
    fs.writeFileSync(BOT_STATE_FILE, JSON.stringify(init, null, 2), 'utf8');
    return init;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(BOT_STATE_FILE, 'utf8'));
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      subscribers: Array.isArray(parsed.subscribers) ? parsed.subscribers : [],
      adminIds: Array.from(new Set([...(Array.isArray(parsed.adminIds) ? parsed.adminIds : []), ...ENV_ADMIN_IDS])),
      stats: {
        viewsByGift: parsed.stats?.viewsByGift || {},
        buyClicks: Number(parsed.stats?.buyClicks || 0),
        reserveClicks: Number(parsed.stats?.reserveClicks || 0)
      }
    };
  } catch (e) {
    return defaultBotState();
  }
}

let botStateSyncTimer = null;
function writeBotState(state, immediateGithub = false) {
  const jsonStr = JSON.stringify(state, null, 2);
  fs.writeFileSync(BOT_STATE_FILE, jsonStr, 'utf8');
  if (!GITHUB_TOKEN || !GITHUB_REPO) return;

  if (immediateGithub) {
    clearTimeout(botStateSyncTimer);
    githubPutFile('data/bot_state.json', Buffer.from(jsonStr, 'utf8'), 'Sync bot stats & subscribers').catch(() => {});
  } else {
    clearTimeout(botStateSyncTimer);
    botStateSyncTimer = setTimeout(() => {
      const latest = fs.readFileSync(BOT_STATE_FILE);
      githubPutFile('data/bot_state.json', latest, 'Sync bot stats & subscribers').catch(() => {});
    }, 10000);
  }
}

function trackBotUser(chatId, username = '') {
  const state = readBotState();
  let changed = false;

  if (!state.users.includes(chatId)) {
    state.users.push(chatId);
    changed = true;
  }

  const cleanUser = String(username || '').replace(/^@/, '').trim().toLowerCase();
  if (cleanUser && ALLOWED_NOTIFY_USERNAMES.has(cleanUser)) {
    if (!state.adminIds.includes(chatId)) {
      state.adminIds.push(chatId);
      changed = true;
    }
    tgAdminAuth.add(chatId);
  }

  if (changed) {
    writeBotState(state, true);
  }
}

function trackGiftView(giftId) {
  const state = readBotState();
  state.stats.viewsByGift[giftId] = (state.stats.viewsByGift[giftId] || 0) + 1;
  writeBotState(state, false);
}

/* === Каталог подарков + автоматическое снятие 15-минутной брони === */
function readGifts() {
  let list;
  if (!fs.existsSync(GIFTS_FILE)) {
    fs.writeFileSync(GIFTS_FILE, JSON.stringify(DEFAULT_GIFTS, null, 2), 'utf8');
    list = DEFAULT_GIFTS;
  } else {
    try {
      list = JSON.parse(fs.readFileSync(GIFTS_FILE, 'utf8'));
    } catch (e) {
      list = DEFAULT_GIFTS;
    }
  }

  const now = Date.now();
  let expiredChanged = false;
  for (const g of list) {
    if (g.reserved && g.reservedUntil && now >= Number(g.reservedUntil)) {
      g.reserved = false;
      delete g.reservedUntil;
      delete g.reservedBy;
      expiredChanged = true;
    }
  }
  if (expiredChanged) {
    writeGifts(list, 'Auto-release expired 15m reservation').catch(() => {});
  }
  return list;
}

async function writeGifts(list, commitMsg = 'Update gifts catalog') {
  const jsonStr = JSON.stringify(list, null, 2);
  fs.writeFileSync(GIFTS_FILE, jsonStr, 'utf8');
  if (GITHUB_TOKEN && GITHUB_REPO) {
    await githubPutFile('data/gifts.json', Buffer.from(jsonStr, 'utf8'), commitMsg);
  }
}

function generateGiftSlug(model, name, existingList) {
  const baseSlug = (model || name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'gift';
  let slugId = baseSlug;
  let counter = 2;
  while (existingList.some(item => item.id === slugId)) {
    slugId = `${baseSlug}-${counter++}`;
  }
  return slugId;
}

setInterval(() => {
  try {
    readGifts();
  } catch (e) {}
}, 30000);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/uploads/:filename', async (req, res) => {
  const safeFile = path.basename(req.params.filename);
  const localPath = path.join(UPLOADS_DIR, safeFile);
  if (fs.existsSync(localPath)) return res.sendFile(localPath);
  if (GITHUB_TOKEN && GITHUB_REPO) {
    try {
      const fullRepoPath = ghRepoPath(`data/uploads/${safeFile}`);
      const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${fullRepoPath}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
      const ghRes = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.raw+json',
          'User-Agent': 'GiftMarket-Render-App'
        }
      });
      if (ghRes.ok) {
        const buf = Buffer.from(await ghRes.arrayBuffer());
        fs.writeFileSync(localPath, buf);
        return res.sendFile(localPath);
      }
    } catch (e) {}
  }
  res.status(404).send('File not found');
});

app.use(express.static(__dirname));
app.get('/ping', (req, res) => res.status(200).send('OK'));

function checkAdmin(req, res, next) {
  if (req.headers['x-admin-password'] !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Неверный пароль администратора' });
  }
  next();
}

app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) return res.json({ ok: true });
  return res.status(401).json({ error: 'Неверный пароль' });
});

app.get('/api/gifts', (req, res) => res.json(readGifts()));

app.post('/api/gifts', checkAdmin, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'preview', maxCount: 1 }]), async (req, res) => {
  try {
    const avatarFile = req.files?.avatar?.[0];
    if (!avatarFile) return res.status(400).json({ error: 'Загрузите картинку или гифку подарка' });

    if (GITHUB_TOKEN && GITHUB_REPO) {
      await githubPutFile(`data/uploads/${avatarFile.filename}`, fs.readFileSync(avatarFile.path), `Upload avatar ${avatarFile.filename}`);
    }
    const previewFile = req.files?.preview?.[0];
    if (previewFile && GITHUB_TOKEN && GITHUB_REPO) {
      await githubPutFile(`data/uploads/${previewFile.filename}`, fs.readFileSync(previewFile.path), `Upload preview ${previewFile.filename}`);
    }

    const avatarUrl = `uploads/${avatarFile.filename}`;
    const previewUrl = previewFile ? `uploads/${previewFile.filename}` : avatarUrl;
    const previewIsVideo = previewFile ? previewFile.mimetype.startsWith('video/') : false;

    const body = req.body || {};
    const rawNum = (body.number || '#10 001').trim();
    const number = rawNum.startsWith('#') ? rawNum : `#${rawNum}`;
    const model = (body.model || 'Original').trim();
    const name = (body.name || 'New Gift').trim();

    const list = readGifts();
    const slugId = generateGiftSlug(model, name, list);

    const newGift = {
      id: slugId,
      name,
      number,
      model,
      file: avatarUrl,
      video: previewUrl,
      previewIsVideo,
      sku: number,
      prices: { TON: Number(body.priceTon || 0), BYN: Number(body.priceByn || 0), STARS: Number(body.priceStars || 0) },
      subtitle: `Коллекционный подарок · модель ${model}`,
      description: (body.description || '').trim(),
      glow: '#414448',
      reserved: body.reserved === 'true',
      traits: {
        model: { name: model, chance: (body.modelChance || '1.5%').trim() },
        pattern: { name: (body.pattern || 'Starlight').trim(), chance: (body.patternChance || '0.5%').trim() },
        backdrop: { name: (body.backdrop || 'Onyx Dark').trim(), chance: (body.backdropChance || '1.5%').trim() }
      }
    };

    list.push(newGift);
    await writeGifts(list, `Add gift ${newGift.name} ${newGift.number}`);

    broadcastNewGiftToSubscribers(newGift, list.length - 1).catch(() => {});

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Ошибка сохранения подарка' });
  }
});

app.put('/api/gifts/:id', checkAdmin, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'preview', maxCount: 1 }]), async (req, res) => {
  try {
    const list = readGifts();
    const idx = list.findIndex(g => g.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Подарок не найден' });

    const existing = list[idx];
    const body = req.body || {};
    const rawNum = (body.number || existing.number).trim();
    const number = rawNum.startsWith('#') ? rawNum : `#${rawNum}`;
    const model = (body.model || existing.model).trim();

    const avatarFile = req.files?.avatar?.[0];
    const previewFile = req.files?.preview?.[0];

    if (avatarFile && GITHUB_TOKEN && GITHUB_REPO) {
      await githubPutFile(`data/uploads/${avatarFile.filename}`, fs.readFileSync(avatarFile.path), `Update avatar ${avatarFile.filename}`);
    }
    if (previewFile && GITHUB_TOKEN && GITHUB_REPO) {
      await githubPutFile(`data/uploads/${previewFile.filename}`, fs.readFileSync(previewFile.path), `Update preview ${previewFile.filename}`);
    }

    const fileUrl = avatarFile ? `uploads/${avatarFile.filename}` : existing.file;
    let videoUrl = existing.video;
    let previewIsVideo = existing.previewIsVideo;

    if (previewFile) {
      videoUrl = `uploads/${previewFile.filename}`;
      previewIsVideo = previewFile.mimetype.startsWith('video/');
    } else if (avatarFile && existing.video === existing.file) {
      videoUrl = fileUrl;
      previewIsVideo = false;
    }

    const isRes = body.reserved === 'true';
    list[idx] = {
      ...existing,
      name: (body.name || existing.name).trim(),
      number,
      sku: number,
      model,
      file: fileUrl,
      video: videoUrl,
      previewIsVideo,
      prices: {
        TON: Number(body.priceTon ?? existing.prices.TON),
        BYN: Number(body.priceByn ?? existing.prices.BYN),
        STARS: Number(body.priceStars ?? existing.prices.STARS)
      },
      subtitle: `Коллекционный подарок · модель ${model}`,
      description: (body.description ?? existing.description).trim(),
      reserved: isRes,
      reservedUntil: isRes ? existing.reservedUntil : undefined,
      traits: {
        model: { name: model, chance: (body.modelChance || existing.traits.model.chance).trim() },
        pattern: { name: (body.pattern || existing.traits.pattern.name).trim(), chance: (body.patternChance || existing.traits.pattern.chance).trim() },
        backdrop: { name: (body.backdrop || existing.traits.backdrop.name).trim(), chance: (body.backdropChance || existing.traits.backdrop.chance).trim() }
      }
    };

    await writeGifts(list, `Edit gift ${list[idx].name} ${list[idx].number}`);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Ошибка обновления подарка' });
  }
});

app.patch('/api/gifts/:id/reserve', checkAdmin, async (req, res) => {
  const list = readGifts();
  const item = list.find(g => g.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Подарок не найден' });
  item.reserved = !item.reserved;
  if (!item.reserved) {
    delete item.reservedUntil;
    delete item.reservedBy;
  }
  await writeGifts(list, `Toggle reserve ${item.name} ${item.number}`);
  res.json(list);
});

app.delete('/api/gifts/:id', checkAdmin, async (req, res) => {
  let list = readGifts();
  const target = list.find(g => g.id === req.params.id);
  list = list.filter(g => g.id !== req.params.id);
  await writeGifts(list, `Delete gift ${target ? target.name : req.params.id}`);
  res.json(list);
});

/* ============================================================
   TELEGRAM API ЧЕРЕЗ НАДЁЖНЫЙ IPv4 HTTPS + ПОЛНЫЙ ФУНКЦИОНАЛ БОТА
   ============================================================ */
function tgApi(method, payload) {
  if (!BOT_TOKEN) return Promise.resolve(null);
  return new Promise(resolve => {
    const bodyStr = JSON.stringify(payload || {});
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${BOT_TOKEN}/${method}`,
        method: 'POST',
        family: 4,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr)
        }
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(null);
          }
        });
      }
    );
    req.on('error', err => {
      console.error('Telegram API error:', method, err.message);
      resolve(null);
    });
    req.setTimeout(15000, () => {
      req.destroy();
      resolve(null);
    });
    req.write(bodyStr);
    req.end();
  });
}

function tgSendMultipart(method, fields, fileField, localFilePath) {
  if (!BOT_TOKEN) return Promise.resolve(null);
  return new Promise(resolve => {
    try {
      const boundary = '----GiftMarketBoundary' + Math.random().toString(36).slice(2);
      const fileBuf = fs.readFileSync(localFilePath);
      const fileName = path.basename(localFilePath);
      const ext = path.extname(fileName).toLowerCase();
      const mime =
        ext === '.mp4' ? 'video/mp4' :
        ext === '.webm' ? 'video/webm' :
        ext === '.gif' ? 'image/gif' :
        ext === '.webp' ? 'image/webp' :
        ext === '.png' ? 'image/png' : 'image/jpeg';

      const parts = [];
      for (const [k, v] of Object.entries(fields)) {
        if (v !== undefined && v !== null) {
          const valStr = typeof v === 'object' ? JSON.stringify(v) : String(v);
          parts.push(
            Buffer.from(
              `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${valStr}\r\n`,
              'utf8'
            )
          );
        }
      }

      parts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${fileName}"\r\nContent-Type: ${mime}\r\n\r\n`,
          'utf8'
        )
      );
      parts.push(fileBuf);
      parts.push(Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8'));

      const fullBody = Buffer.concat(parts);

      const req = https.request(
        {
          hostname: 'api.telegram.org',
          port: 443,
          path: `/bot${BOT_TOKEN}/${method}`,
          method: 'POST',
          family: 4,
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': fullBody.length
          }
        },
        res => {
          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve(null);
            }
          });
        }
      );
      req.on('error', err => {
        console.error('Telegram multipart error:', method, err.message);
        resolve(null);
      });
      req.setTimeout(25000, () => {
        req.destroy();
        resolve(null);
      });
      req.write(fullBody);
      req.end();
    } catch (e) {
      resolve(null);
    }
  });
}

async function downloadTelegramFile(fileId, fallbackExt = '.mp4') {
  const fileInfo = await tgApi('getFile', { file_id: fileId });
  if (!fileInfo || !fileInfo.ok || !fileInfo.result?.file_path) {
    throw new Error('Не удалось получить файл из Telegram');
  }
  const tgFilePath = fileInfo.result.file_path;
  const ext = path.extname(tgFilePath).toLowerCase() || fallbackExt;
  const savedName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
  const destPath = path.join(UPLOADS_DIR, savedName);

  const buf = await new Promise((resolve, reject) => {
    https.get(
      {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/file/bot${BOT_TOKEN}/${tgFilePath}`,
        family: 4
      },
      res => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} при скачивании файла`));
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    ).on('error', reject);
  });

  fs.writeFileSync(destPath, buf);
  if (GITHUB_TOKEN && GITHUB_REPO) {
    await githubPutFile(`data/uploads/${savedName}`, buf, `Upload gift media from TG bot ${savedName}`);
  }

  return {
    relUrl: `uploads/${savedName}`,
    isVideo: ext === '.mp4' || ext === '.webm' || ext === '.mov'
  };
}

function resolveGiftLocalMedia(g) {
  const relMedia = (g.video || g.file || '').replace(/^\//, '');
  if (!relMedia) return null;
  if (relMedia.startsWith('uploads/')) {
    const p = path.join(UPLOADS_DIR, path.basename(relMedia));
    if (fs.existsSync(p)) return p;
  }
  const directPath = path.join(__dirname, relMedia);
  if (fs.existsSync(directPath)) return directPath;
  return null;
}

function extractTelegramMediaFromMessage(msg) {
  if (msg.animation) return { fileId: msg.animation.file_id, fallbackExt: '.mp4', tgType: 'animation' };
  if (msg.video) return { fileId: msg.video.file_id, fallbackExt: '.mp4', tgType: 'video' };
  if (msg.document) return { fileId: msg.document.file_id, fallbackExt: path.extname(msg.document.file_name || '') || '.webp', tgType: 'document' };
  if (msg.photo && msg.photo.length) return { fileId: msg.photo[msg.photo.length - 1].file_id, fallbackExt: '.jpg', tgType: 'photo' };
  if (msg.sticker) return { fileId: msg.sticker.file_id, fallbackExt: msg.sticker.is_video ? '.webm' : '.webp', tgType: 'document' };
  return null;
}

const tgAdminAuth = new Set(ENV_ADMIN_IDS);
const tgWizard = new Map();

function getMainMenuKeyboard(chatId) {
  const state = readBotState();
  const isSub = state.subscribers.includes(chatId);
  const rows = [];

  if (SITE_URL) {
    rows.push([{ text: 'Открыть GIFT MARKET (Mini App)', web_app: { url: SITE_URL } }]);
  }
  rows.push([{ text: 'Каталог подарков', callback_data: 'cat_0' }]);
  rows.push([
    { text: isSub ? 'Уведомления о завозе: ВКЛ ✓' : 'Подписаться на завоз', callback_data: 'toggle_sub' }
  ]);
  rows.push([
    { text: 'Админ @n3yura', url: 'https://t.me/n3yura' },
    { text: 'Админ @NekosikN', url: 'https://t.me/NekosikN' }
  ]);
  if (SITE_URL) {
    rows.push([
      { text: 'Политика конфиденциальности', web_app: { url: `${SITE_URL}/#privacy` } },
      { text: 'Соглашение', web_app: { url: `${SITE_URL}/#terms` } }
    ]);
  }
  if (tgAdminAuth.has(chatId)) {
    rows.push([{ text: 'Панель админа', callback_data: 'adm_panel' }]);
  }
  return { inline_keyboard: rows };
}

function getAdminPanelKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '＋ Добавить новый подарок', callback_data: 'adm_add' }],
      [{ text: 'Управление подарками (Цена / Медиа / Бронь / Удалить)', callback_data: 'adm_manage' }],
      [{ text: 'Рассылка всем пользователям', callback_data: 'adm_broadcast' }],
      [{ text: 'Статистика бота', callback_data: 'adm_stats' }],
      [{ text: 'В главное меню', callback_data: 'menu' }]
    ]
  };
}

function buildGiftCaption(g, index, total, prefixBanner = '') {
  let statusLine = 'Статус: В наличии (1 шт.)';
  if (g.reserved) {
    if (g.reservedUntil) {
      const minsLeft = Math.max(1, Math.ceil((Number(g.reservedUntil) - Date.now()) / 60000));
      statusLine = `Статус: БРОНЬ (осталось ~${minsLeft} мин.)`;
    } else {
      statusLine = 'Статус: БРОНЬ';
    }
  }

  return [
    prefixBanner,
    `<b>${g.name}</b> <code>${g.number}</code>  [${index + 1}/${total}]`,
    ``,
    `• <b>Модель:</b> ${g.model} (${g.traits?.model?.chance || '—'})`,
    `• <b>Узор:</b> ${g.traits?.pattern?.name || '—'} (${g.traits?.pattern?.chance || '—'})`,
    `• <b>Фон:</b> ${g.traits?.backdrop?.name || '—'} (${g.traits?.backdrop?.chance || '—'})`,
    ``,
    `<b>Цена:</b> ${g.prices.TON} TON · ${g.prices.BYN} BYN · ${g.prices.STARS} STARS`,
    `<b>${statusLine}</b>`,
    ``,
    g.description ? `<i>${g.description}</i>` : ''
  ].filter(Boolean).join('\n');
}

function buildGiftKeyboard(g, index, total) {
  const prevIdx = (index - 1 + total) % total;
  const nextIdx = (index + 1) % total;

  const rows = [
    [
      { text: '◀ Назад', callback_data: `cat_${prevIdx}` },
      { text: `${index + 1} / ${total}`, callback_data: 'noop' },
      { text: 'Вперёд ▶', callback_data: `cat_${nextIdx}` }
    ]
  ];

  if (!g.reserved) {
    rows.push([
      { text: 'Купить у @n3yura', callback_data: `buy_n3_${index}` },
      { text: 'Купить у @NekosikN', callback_data: `buy_nk_${index}` }
    ]);
    rows.push([
      { text: 'Забронировать на 15 мин', callback_data: `res15_${index}` }
    ]);
  }

  if (SITE_URL) {
    rows.push([{ text: 'Открыть на сайте', web_app: { url: `${SITE_URL}/?gift=${encodeURIComponent(g.id)}` } }]);
  }

  rows.push([{ text: 'В главное меню', callback_data: 'menu' }]);
  return { inline_keyboard: rows };
}

async function sendGiftCardWithAnimation(chatId, index, oldMessageId = null, prefixBanner = '', countAsView = true) {
  const list = readGifts();
  if (!list.length) {
    return tgApi('sendMessage', { chat_id: chatId, text: 'Каталог пока пуст.' });
  }
  const safeIdx = ((index % list.length) + list.length) % list.length;
  const g = list[safeIdx];

  if (countAsView) {
    trackGiftView(g.id);
  }

  const caption = buildGiftCaption(g, safeIdx, list.length, prefixBanner);
  const reply_markup = buildGiftKeyboard(g, safeIdx, list.length);

  if (oldMessageId) {
    tgApi('deleteMessage', { chat_id: chatId, message_id: oldMessageId }).catch(() => {});
  }

  const localMedia = resolveGiftLocalMedia(g);
  const relMedia = (g.video || g.file || '').replace(/^\//, '');
  const publicMediaUrl = SITE_URL && relMedia ? `${SITE_URL}/${relMedia}` : null;

  let sent = null;

  if (localMedia) {
    const ext = path.extname(localMedia).toLowerCase();
    if (ext === '.mp4' || ext === '.gif') {
      sent = await tgSendMultipart('sendAnimation', {
        chat_id: chatId,
        caption,
        parse_mode: 'HTML',
        reply_markup
      }, 'animation', localMedia);
    } else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
      sent = await tgSendMultipart('sendPhoto', {
        chat_id: chatId,
        caption,
        parse_mode: 'HTML',
        reply_markup
      }, 'photo', localMedia);
    } else {
      sent = await tgSendMultipart('sendDocument', {
        chat_id: chatId,
        caption,
        parse_mode: 'HTML',
        reply_markup
      }, 'document', localMedia);
    }
  }

  if ((!sent || !sent.ok) && publicMediaUrl) {
    sent = await tgApi('sendAnimation', {
      chat_id: chatId,
      animation: publicMediaUrl,
      caption,
      parse_mode: 'HTML',
      reply_markup
    });
  }

  if (!sent || !sent.ok) {
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: caption,
      parse_mode: 'HTML',
      reply_markup
    });
  }
}

async function notifyAdmins(htmlText) {
  const state = readBotState();
  const recipients = Array.from(new Set(state.adminIds));
  for (const adminId of recipients) {
    await tgApi('sendMessage', {
      chat_id: adminId,
      text: htmlText,
      parse_mode: 'HTML'
    });
  }
}

async function broadcastNewGiftToSubscribers(gift, giftIndex, excludeChatId = null) {
  const state = readBotState();
  if (!state.subscribers.length) return 0;

  let delivered = 0;
  for (const subChatId of state.subscribers) {
    if (excludeChatId && subChatId === excludeChatId) continue;
    try {
      await sendGiftCardWithAnimation(
        subChatId,
        giftIndex,
        null,
        '<b>НОВЫЙ ЗАВОЗ В GIFT MARKET!</b>\n',
        false
      );
      delivered++;
    } catch (e) {}
  }
  return delivered;
}

async function sendMainMenu(chatId, oldMessageId = null) {
  if (oldMessageId) {
    tgApi('deleteMessage', { chat_id: chatId, message_id: oldMessageId }).catch(() => {});
  }
  const count = readGifts().length;
  const text = `<b>GIFT MARKET</b> — магазин цифровых подарков Telegram.\n\nСейчас в каталоге: <b>${count}</b> поз.\nВалюты оплаты: <b>TON · BYN · Telegram Stars</b>\n\nВыбери действие ниже:`;
  const reply_markup = getMainMenuKeyboard(chatId);

  const logoPath = path.join(__dirname, 'assets', 'logo.jpg');
  if (fs.existsSync(logoPath)) {
    const res = await tgSendMultipart('sendPhoto', {
      chat_id: chatId,
      caption: text,
      parse_mode: 'HTML',
      reply_markup
    }, 'photo', logoPath);
    if (res && res.ok) return;
  }

  await tgApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup
  });
}

async function sendAdminManageList(chatId, oldMessageId = null) {
  if (oldMessageId) {
    tgApi('deleteMessage', { chat_id: chatId, message_id: oldMessageId }).catch(() => {});
  }
  const list = readGifts();
  const rows = [];

  list.forEach((g, idx) => {
    rows.push([
      { text: `${g.reserved ? '[БРОНЬ]' : '[В НАЛ]'} ${g.name} ${g.number} (${g.prices.TON} TON)`, callback_data: `adm_tog_${idx}` }
    ]);
    rows.push([
      { text: 'Изменить цену', callback_data: `adm_price_${idx}` },
      { text: 'Сменить медиа', callback_data: `adm_media_${idx}` },
      { text: 'Удалить', callback_data: `adm_del_${idx}` }
    ]);
  });

  rows.push([{ text: '＋ Добавить подарок', callback_data: 'adm_add' }]);
  rows.push([{ text: 'Назад в панель', callback_data: 'adm_panel' }]);

  await tgApi('sendMessage', {
    chat_id: chatId,
    text: `<b>Управление каталогом (${list.length} поз.)</b>\n• Нажми на название подарка, чтобы переключить <b>Бронь</b>\n• Используй кнопки ниже подарка для смены <b>Цены</b>, <b>Медиа</b> или <b>Удаления</b>:`,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: rows }
  });
}

async function sendAdminStats(chatId, oldMessageId = null) {
  if (oldMessageId) {
    tgApi('deleteMessage', { chat_id: chatId, message_id: oldMessageId }).catch(() => {});
  }
  const state = readBotState();
  const list = readGifts();

  const sortedGifts = [...list]
    .map(g => ({
      title: `${g.name} (${g.model} ${g.number})`,
      views: Number(state.stats.viewsByGift[g.id] || 0)
    }))
    .sort((a, b) => b.views - a.views);

  const topLines = sortedGifts.length
    ? sortedGifts.map((item, i) => `${i + 1}. ${item.title} — <b>${item.views}</b> просм.`).join('\n')
    : 'Пока нет данных о просмотрах.';

  const text = [
    `<b>Статистика бота GIFT MARKET</b>`,
    ``,
    `• Всего запускали бота: <b>${state.users.length}</b> чел.`,
    `• Подписаны на завоз новинок: <b>${state.subscribers.length}</b> чел.`,
    `• Нажатий «Купить»: <b>${state.stats.buyClicks}</b>`,
    `• Броней на 15 минут: <b>${state.stats.reserveClicks}</b>`,
    ``,
    `<b>Популярность подарков:</b>`,
    topLines
  ].join('\n');

  await tgApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Обновить статистику', callback_data: 'adm_stats' }],
        [{ text: 'Назад в панель', callback_data: 'adm_panel' }]
      ]
    }
  });
}

/* === Обработка инлайн-режима (@giftmarket_by_bot ... в любом чате) === */
async function handleInlineQuery(iq) {
  const queryText = (iq.query || '').trim().toLowerCase();
  const list = readGifts();

  const filtered = queryText
    ? list.filter(g => {
        const hay = `${g.name} ${g.model} ${g.number} ${g.traits?.pattern?.name || ''} ${g.traits?.backdrop?.name || ''}`.toLowerCase();
        return hay.includes(queryText);
      })
    : list;

  const results = filtered.slice(0, 25).map((g, idx) => {
    const orderText = encodeURIComponent(`Привет! Хочу купить: ${g.name} (${g.model} ${g.number}) — ${g.prices.TON} TON`);
    const rows = [];
    if (!g.reserved) {
      rows.push([
        { text: 'Купить у @n3yura', url: `https://t.me/n3yura?text=${orderText}` },
        { text: 'Купить у @NekosikN', url: `https://t.me/NekosikN?text=${orderText}` }
      ]);
    }
    if (SITE_URL) {
      rows.push([{ text: 'Открыть на сайте', url: `${SITE_URL}/?gift=${encodeURIComponent(g.id)}` }]);
    }

    const messageText = buildGiftCaption(g, idx, list.length, '<b>GIFT MARKET</b>\n');
    const relMedia = (g.video || g.file || '').replace(/^\//, '');
    const publicMediaUrl = SITE_URL && relMedia ? `${SITE_URL}/${relMedia}` : '';
    const isMp4 = /\.mp4(\?.*)?$/i.test(publicMediaUrl);

    if (publicMediaUrl && isMp4) {
      return {
        type: 'mpeg4_gif',
        id: `inl_${g.id}_${idx}`,
        mpeg4_url: publicMediaUrl,
        thumb_url: publicMediaUrl,
        title: `${g.name} · ${g.model} ${g.number}`,
        caption: messageText,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: rows }
      };
    }

    return {
      type: 'article',
      id: `inl_${g.id}_${idx}`,
      title: `${g.name} · ${g.model} ${g.number}${g.reserved ? ' [БРОНЬ]' : ''}`,
      description: `${g.prices.TON} TON · ${g.prices.BYN} BYN · ${g.prices.STARS} STARS`,
      thumb_url: SITE_URL ? `${SITE_URL}/assets/logo.jpg` : undefined,
      input_message_content: {
        message_text: messageText,
        parse_mode: 'HTML'
      },
      reply_markup: { inline_keyboard: rows }
    };
  });

  await tgApi('answerInlineQuery', {
    inline_query_id: iq.id,
    results,
    cache_time: 5,
    is_personal: false
  });
}

async function handleWizardInput(chatId, msg) {
  const state = tgWizard.get(chatId);
  if (!state) return false;

  const text = (msg.text || '').trim();
  if (text === '/cancel' || text.toLowerCase() === 'отмена') {
    tgWizard.delete(chatId);
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: 'Действие отменено.',
      reply_markup: getAdminPanelKeyboard()
    });
    return true;
  }

  const cancelKb = { inline_keyboard: [[{ text: 'Отменить', callback_data: 'adm_cancel' }]] };

  if (state.step === 'password') {
    if (text === ADMIN_PASSWORD) {
      tgAdminAuth.add(chatId);
      const cleanUser = String(msg.from?.username || '').replace(/^@/, '').trim().toLowerCase();
      if (cleanUser && ALLOWED_NOTIFY_USERNAMES.has(cleanUser)) {
        const botState = readBotState();
        if (!botState.adminIds.includes(chatId)) {
          botState.adminIds.push(chatId);
          writeBotState(botState, true);
        }
      }
      tgWizard.delete(chatId);
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: '<b>Доступ в админ-панель разрешён.</b>',
        parse_mode: 'HTML',
        reply_markup: getAdminPanelKeyboard()
      });
    } else {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: 'Неверный пароль. Попробуй ещё раз или нажми «Отменить»:',
        reply_markup: cancelKb
      });
    }
    return true;
  }

  // Редактирование цены существующего подарка
  if (state.step === 'edit_price') {
    const nums = text.replace(/,/g, '.').split(/\s+/).map(Number).filter(n => !Number.isNaN(n));
    if (nums.length < 3) {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: 'Введи 3 числа через пробел: <b>TON BYN STARS</b> (например: <code>7 24 500</code>):',
        parse_mode: 'HTML',
        reply_markup: cancelKb
      });
      return true;
    }

    const list = readGifts();
    const g = list[state.data.giftIdx];
    if (!g) {
      tgWizard.delete(chatId);
      await tgApi('sendMessage', { chat_id: chatId, text: 'Подарок не найден.', reply_markup: getAdminPanelKeyboard() });
      return true;
    }

    g.prices.TON = nums[0];
    g.prices.BYN = nums[1];
    g.prices.STARS = Math.round(nums[2]);
    await writeGifts(list, `Update price via TG bot: ${g.name} ${g.number}`);
    tgWizard.delete(chatId);

    await tgApi('sendMessage', {
      chat_id: chatId,
      text: `<b>Цена обновлена в боте и на сайте!</b>\n${g.name} (${g.model}) ${g.number}: <b>${g.prices.TON} TON · ${g.prices.BYN} BYN · ${g.prices.STARS} STARS</b>`,
      parse_mode: 'HTML',
      reply_markup: getAdminPanelKeyboard()
    });
    return true;
  }

  // Смена фото/видео/гифки существующего подарка
  if (state.step === 'edit_media') {
    const mediaInfo = extractTelegramMediaFromMessage(msg);
    if (!mediaInfo) {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: 'Отправь новую <b>гифку, видео (.mp4) или картинку</b> подарка:',
        parse_mode: 'HTML',
        reply_markup: cancelKb
      });
      return true;
    }

    const list = readGifts();
    const g = list[state.data.giftIdx];
    if (!g) {
      tgWizard.delete(chatId);
      await tgApi('sendMessage', { chat_id: chatId, text: 'Подарок не найден.', reply_markup: getAdminPanelKeyboard() });
      return true;
    }

    await tgApi('sendMessage', { chat_id: chatId, text: 'Загружаю новое медиа на сайт и в бота...' });

    try {
      const savedMedia = await downloadTelegramFile(mediaInfo.fileId, mediaInfo.fallbackExt);
      g.file = savedMedia.relUrl;
      g.video = savedMedia.relUrl;
      g.previewIsVideo = savedMedia.isVideo;
      await writeGifts(list, `Update media via TG bot: ${g.name} ${g.number}`);
      tgWizard.delete(chatId);

      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `<b>Медиа подарка ${g.name} ${g.number} успешно обновлено!</b>`,
        parse_mode: 'HTML',
        reply_markup: getAdminPanelKeyboard()
      });
    } catch (err) {
      tgWizard.delete(chatId);
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `Ошибка обновления медиа: ${err.message}`,
        reply_markup: getAdminPanelKeyboard()
      });
    }
    return true;
  }

  // Массовая рассылка всем пользователям бота
  if (state.step === 'broadcast') {
    const botState = readBotState();
    const users = botState.users || [];
    if (!users.length) {
      tgWizard.delete(chatId);
      await tgApi('sendMessage', { chat_id: chatId, text: 'В базе пока нет пользователей для рассылки.', reply_markup: getAdminPanelKeyboard() });
      return true;
    }

    const captionText = (msg.caption || msg.text || '').trim();
    const mediaInfo = extractTelegramMediaFromMessage(msg);

    if (!captionText && !mediaInfo) {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: 'Отправь текст объявления или картинку/гифку/видео с подписью:',
        reply_markup: cancelKb
      });
      return true;
    }

    tgWizard.delete(chatId);
    await tgApi('sendMessage', { chat_id: chatId, text: `Начинаю рассылку по <b>${users.length}</b> пользователям...`, parse_mode: 'HTML' });

    let sentOk = 0;
    let sentFail = 0;

    for (const targetId of users) {
      let r = null;
      if (mediaInfo) {
        if (mediaInfo.tgType === 'animation') {
          r = await tgApi('sendAnimation', { chat_id: targetId, animation: mediaInfo.fileId, caption: captionText || undefined, parse_mode: 'HTML' });
        } else if (mediaInfo.tgType === 'video') {
          r = await tgApi('sendVideo', { chat_id: targetId, video: mediaInfo.fileId, caption: captionText || undefined, parse_mode: 'HTML' });
        } else if (mediaInfo.tgType === 'photo') {
          r = await tgApi('sendPhoto', { chat_id: targetId, photo: mediaInfo.fileId, caption: captionText || undefined, parse_mode: 'HTML' });
        } else {
          r = await tgApi('sendDocument', { chat_id: targetId, document: mediaInfo.fileId, caption: captionText || undefined, parse_mode: 'HTML' });
        }
      } else {
        r = await tgApi('sendMessage', { chat_id: targetId, text: captionText, parse_mode: 'HTML' });
      }

      if (r && r.ok) sentOk++;
      else sentFail++;
    }

    await tgApi('sendMessage', {
      chat_id: chatId,
      text: `<b>Рассылка завершена!</b>\n• Доставлено: <b>${sentOk}</b>\n• Не доставлено (заблокировали бота): <b>${sentFail}</b>`,
      parse_mode: 'HTML',
      reply_markup: getAdminPanelKeyboard()
    });
    return true;
  }

  // Пошаговое добавление нового подарка
  if (state.step === 'name') {
    if (!text) return true;
    state.data.name = text;
    state.step = 'number';
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: 'Шаг 2/8. Введи <b>номер подарка</b> (например: <code>#12 345</code>):',
      parse_mode: 'HTML',
      reply_markup: cancelKb
    });
    return true;
  }

  if (state.step === 'number') {
    if (!text) return true;
    state.data.number = text.startsWith('#') ? text : `#${text}`;
    state.step = 'model';
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: 'Шаг 3/8. Введи <b>Модель (Model)</b> и через запятую шанс (например: <code>Cyber Bunny, 1.5%</code> или просто <code>Cyber Bunny</code>):',
      parse_mode: 'HTML',
      reply_markup: cancelKb
    });
    return true;
  }

  if (state.step === 'model') {
    if (!text) return true;
    const parts = text.split(',').map(s => s.trim());
    state.data.model = parts[0] || 'Original';
    state.data.modelChance = parts[1] || '1.5%';
    state.step = 'pattern';
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: 'Шаг 4/8. Введи <b>Узор (Pattern)</b> и шанс через запятую (например: <code>Carrot, 0.5%</code>):',
      parse_mode: 'HTML',
      reply_markup: cancelKb
    });
    return true;
  }

  if (state.step === 'pattern') {
    if (!text) return true;
    const parts = text.split(',').map(s => s.trim());
    state.data.pattern = parts[0] || 'Starlight';
    state.data.patternChance = parts[1] || '0.5%';
    state.step = 'backdrop';
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: 'Шаг 5/8. Введи <b>Фон (Backdrop)</b> и шанс через запятую (например: <code>Sapphire, 1.5%</code>):',
      parse_mode: 'HTML',
      reply_markup: cancelKb
    });
    return true;
  }

  if (state.step === 'backdrop') {
    if (!text) return true;
    const parts = text.split(',').map(s => s.trim());
    state.data.backdrop = parts[0] || 'Onyx Dark';
    state.data.backdropChance = parts[1] || '1.5%';
    state.step = 'prices';
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: 'Шаг 6/8. Введи <b>цены через пробел</b> в порядке: <code>TON BYN STARS</code>\nНапример: <code>10 35 700</code>',
      parse_mode: 'HTML',
      reply_markup: cancelKb
    });
    return true;
  }

  if (state.step === 'prices') {
    const nums = text.replace(/,/g, '.').split(/\s+/).map(Number).filter(n => !Number.isNaN(n));
    if (nums.length < 3) {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: 'Укажи 3 числа через пробел: <b>TON BYN STARS</b> (например: <code>10 35 700</code>):',
        parse_mode: 'HTML',
        reply_markup: cancelKb
      });
      return true;
    }
    state.data.priceTon = nums[0];
    state.data.priceByn = nums[1];
    state.data.priceStars = Math.round(nums[2]);
    state.step = 'description';
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: 'Шаг 7/8. Введи <b>описание подарка</b> (или отправь <code>-</code>, чтобы сгенерировать автоматически):',
      parse_mode: 'HTML',
      reply_markup: cancelKb
    });
    return true;
  }

  if (state.step === 'description') {
    state.data.description = text === '-' || !text
      ? `${state.data.name} ${state.data.number} — коллекционный подарок в модели ${state.data.model}.`
      : text;
    state.step = 'media';
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: 'Шаг 8/8. Отправь <b>гифку / видео (.mp4) / картинку</b> подарка (можно как медиа или как файл):',
      parse_mode: 'HTML',
      reply_markup: cancelKb
    });
    return true;
  }

  if (state.step === 'media') {
    const mediaInfo = extractTelegramMediaFromMessage(msg);
    if (!mediaInfo) {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: 'Пришли именно гифку, видео, картинку или файл подарка:',
        reply_markup: cancelKb
      });
      return true;
    }

    await tgApi('sendMessage', { chat_id: chatId, text: 'Сохраняю подарок и отправляю уведомление подписчикам...' });

    try {
      const savedMedia = await downloadTelegramFile(mediaInfo.fileId, mediaInfo.fallbackExt);
      const list = readGifts();
      const slugId = generateGiftSlug(state.data.model, state.data.name, list);

      const newGift = {
        id: slugId,
        name: state.data.name,
        number: state.data.number,
        model: state.data.model,
        file: savedMedia.relUrl,
        video: savedMedia.relUrl,
        previewIsVideo: savedMedia.isVideo,
        sku: state.data.number,
        prices: {
          TON: state.data.priceTon,
          BYN: state.data.priceByn,
          STARS: state.data.priceStars
        },
        subtitle: `Коллекционный подарок · модель ${state.data.model}`,
        description: state.data.description,
        glow: '#414448',
        reserved: false,
        traits: {
          model: { name: state.data.model, chance: state.data.modelChance },
          pattern: { name: state.data.pattern, chance: state.data.patternChance },
          backdrop: { name: state.data.backdrop, chance: state.data.backdropChance }
        }
      };

      list.push(newGift);
      await writeGifts(list, `Add gift via TG bot: ${newGift.name} ${newGift.number}`);
      tgWizard.delete(chatId);

      const notifiedCount = await broadcastNewGiftToSubscribers(newGift, list.length - 1, chatId);

      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `<b>Подарок опубликован в боте и на сайте!</b>\nID: <code>${newGift.id}</code>\nРассылка о завозе отправлена: <b>${notifiedCount}</b> подп.`,
        parse_mode: 'HTML'
      });

      await sendGiftCardWithAnimation(chatId, list.length - 1, null, '', false);
    } catch (err) {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `Ошибка при сохранении: ${err.message}`,
        reply_markup: getAdminPanelKeyboard()
      });
      tgWizard.delete(chatId);
    }
    return true;
  }

  return false;
}

app.post('/telegram/webhook', async (req, res) => {
  res.sendStatus(200);
  if (!BOT_TOKEN) return;

  const update = req.body || {};

  // Обработка инлайн-запросов (@giftmarket_by_bot ... в любом чате)
  if (update.inline_query) {
    await handleInlineQuery(update.inline_query);
    return;
  }

  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const text = (msg.text || '').trim();

    trackBotUser(chatId, msg.from?.username);

    if (text.startsWith('/start') || text.startsWith('/menu')) {
      tgWizard.delete(chatId);
      await sendMainMenu(chatId);
      return;
    }

    if (text.startsWith('/admin') || text.startsWith('/add')) {
      const botState = readBotState();
      if (tgAdminAuth.has(chatId) || botState.adminIds.includes(chatId)) {
        tgAdminAuth.add(chatId);
        tgWizard.delete(chatId);
        await tgApi('sendMessage', {
          chat_id: chatId,
          text: '<b>Панель администратора GIFT MARKET</b>',
          parse_mode: 'HTML',
          reply_markup: getAdminPanelKeyboard()
        });
      } else {
        tgWizard.set(chatId, { step: 'password', data: {} });
        await tgApi('sendMessage', {
          chat_id: chatId,
          text: 'Введи <b>пароль администратора</b>:',
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: 'Отменить', callback_data: 'adm_cancel' }]] }
        });
      }
      return;
    }

    if (text.startsWith('/catalog')) {
      tgWizard.delete(chatId);
      await sendGiftCardWithAnimation(chatId, 0);
      return;
    }

    const handled = await handleWizardInput(chatId, msg);
    if (handled) return;
  }

  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.message.chat.id;
    const msgId = cb.message.message_id;
    const data = cb.data || '';
    const fromUser = cb.from || {};
    const userTag = fromUser.username
      ? `@${fromUser.username}`
      : `<a href="tg://user?id=${fromUser.id}">${fromUser.first_name || 'Покупатель'}</a>`;

    trackBotUser(chatId, fromUser.username);

    if (data === 'toggle_sub') {
      const state = readBotState();
      const idx = state.subscribers.indexOf(chatId);
      let subscribedNow = false;
      if (idx === -1) {
        state.subscribers.push(chatId);
        subscribedNow = true;
      } else {
        state.subscribers.splice(idx, 1);
      }
      writeBotState(state, true);

      await tgApi('answerCallbackQuery', {
        callback_query_id: cb.id,
        text: subscribedNow
          ? 'Вы подписались на уведомления о новых подарках!'
          : 'Уведомления о завозе отключены.',
        show_alert: false
      });

      await tgApi('editMessageReplyMarkup', {
        chat_id: chatId,
        message_id: msgId,
        reply_markup: getMainMenuKeyboard(chatId)
      });
      return;
    }

    if (data.startsWith('res15_')) {
      const idx = Number(data.replace('res15_', ''));
      const list = readGifts();
      const g = list[idx];
      if (!g) {
        await tgApi('answerCallbackQuery', { callback_query_id: cb.id, text: 'Подарок не найден', show_alert: true });
        return;
      }
      if (g.reserved) {
        await tgApi('answerCallbackQuery', { callback_query_id: cb.id, text: 'Этот подарок уже забронирован!', show_alert: true });
        await sendGiftCardWithAnimation(chatId, idx, msgId, '', false);
        return;
      }

      g.reserved = true;
      g.reservedUntil = Date.now() + 15 * 60 * 1000;
      g.reservedBy = fromUser.username ? `@${fromUser.username}` : String(fromUser.id);
      await writeGifts(list, `15m reserve ${g.name} ${g.number} by ${g.reservedBy}`);

      const state = readBotState();
      state.stats.reserveClicks += 1;
      writeBotState(state, false);

      await tgApi('answerCallbackQuery', {
        callback_query_id: cb.id,
        text: 'Бронь на 15 минут поставлена! Напишите админу для завершения сделки.',
        show_alert: true
      });

      await notifyAdmins(
        `<b>Новая бронь на 15 минут!</b>\nПользователь ${userTag} поставил бронь на <b>${g.name} (${g.model}) ${g.number}</b>.\nЕсли не напишет за 15 минут — бронь снимется автоматически.`
      );

      await sendGiftCardWithAnimation(chatId, idx, msgId, '', false);
      return;
    }

    if (data.startsWith('buy_n3_') || data.startsWith('buy_nk_')) {
      const isN3 = data.startsWith('buy_n3_');
      const idx = Number(data.replace(isN3 ? 'buy_n3_' : 'buy_nk_', ''));
      const list = readGifts();
      const g = list[idx];

      const state = readBotState();
      state.stats.buyClicks += 1;
      writeBotState(state, false);

      await tgApi('answerCallbackQuery', { callback_query_id: cb.id });

      if (g) {
        const adminUsername = isN3 ? 'n3yura' : 'NekosikN';
        const orderText = encodeURIComponent(`Привет! Хочу купить: ${g.name} (${g.model} ${g.number}) — ${g.prices.TON} TON`);
        const directLink = `https://t.me/${adminUsername}?text=${orderText}`;

        await notifyAdmins(
          `<b>Интерес к покупке!</b>\nПользователь ${userTag} нажал «Купить у @${adminUsername}» на подарок <b>${g.name} (${g.model}) ${g.number}</b>.`
        );

        await tgApi('sendMessage', {
          chat_id: chatId,
          text: `Для покупки <b>${g.name} (${g.model}) ${g.number}</b> нажми кнопку ниже — откроется чат с @${adminUsername} с готовым текстом заказа:`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: `Перейти в чат с @${adminUsername} ↗`, url: directLink }]
            ]
          }
        });
      }
      return;
    }

    await tgApi('answerCallbackQuery', { callback_query_id: cb.id });

    if (data === 'menu') {
      tgWizard.delete(chatId);
      await sendMainMenu(chatId, msgId);
      return;
    }

    if (data.startsWith('cat_')) {
      const idx = Number(data.replace('cat_', '')) || 0;
      await sendGiftCardWithAnimation(chatId, idx, msgId, '', true);
      return;
    }

    if (data === 'adm_cancel') {
      tgWizard.delete(chatId);
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: 'Действие отменено.',
        reply_markup: tgAdminAuth.has(chatId) ? getAdminPanelKeyboard() : getMainMenuKeyboard(chatId)
      });
      return;
    }

    if (data.startsWith('adm_')) {
      const botState = readBotState();
      if (!tgAdminAuth.has(chatId) && !botState.adminIds.includes(chatId)) {
        tgWizard.set(chatId, { step: 'password', data: {} });
        await tgApi('sendMessage', {
          chat_id: chatId,
          text: 'Введи <b>пароль администратора</b>:',
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: 'Отменить', callback_data: 'adm_cancel' }]] }
        });
        return;
      }
      tgAdminAuth.add(chatId);

      const cancelKb = { inline_keyboard: [[{ text: 'Отменить', callback_data: 'adm_cancel' }]] };

      if (data === 'adm_panel') {
        tgWizard.delete(chatId);
        await tgApi('sendMessage', {
          chat_id: chatId,
          text: '<b>Панель администратора GIFT MARKET</b>',
          parse_mode: 'HTML',
          reply_markup: getAdminPanelKeyboard()
        });
      } else if (data === 'adm_add') {
        tgWizard.set(chatId, { step: 'name', data: {} });
        await tgApi('sendMessage', {
          chat_id: chatId,
          text: 'Шаг 1/8. Введи <b>название подарка</b> (например: <code>Crystal Skull</code>):',
          parse_mode: 'HTML',
          reply_markup: cancelKb
        });
      } else if (data === 'adm_broadcast') {
        tgWizard.set(chatId, { step: 'broadcast', data: {} });
        await tgApi('sendMessage', {
          chat_id: chatId,
          text: '<b>Массовая рассылка всем пользователям бота</b>\n\nОтправь текст объявления или фото/гифку/видео с подписью (поддерживается HTML-разметка):',
          parse_mode: 'HTML',
          reply_markup: cancelKb
        });
      } else if (data === 'adm_manage') {
        await sendAdminManageList(chatId, msgId);
      } else if (data === 'adm_stats') {
        await sendAdminStats(chatId, msgId);
      } else if (data.startsWith('adm_price_')) {
        const idx = Number(data.replace('adm_price_', ''));
        const list = readGifts();
        const g = list[idx];
        if (!g) return;
        tgWizard.set(chatId, { step: 'edit_price', data: { giftIdx: idx } });
        await tgApi('sendMessage', {
          chat_id: chatId,
          text: `Изменение цены для <b>${g.name} (${g.model}) ${g.number}</b>.\nТекущая цена: <code>${g.prices.TON} ${g.prices.BYN} ${g.prices.STARS}</code>\n\nВведи новую цену тремя числами через пробел (<code>TON BYN STARS</code>), например: <code>7 24 500</code>:`,
          parse_mode: 'HTML',
          reply_markup: cancelKb
        });
      } else if (data.startsWith('adm_media_')) {
        const idx = Number(data.replace('adm_media_', ''));
        const list = readGifts();
        const g = list[idx];
        if (!g) return;
        tgWizard.set(chatId, { step: 'edit_media', data: { giftIdx: idx } });
        await tgApi('sendMessage', {
          chat_id: chatId,
          text: `Смена гифки/видео/фото для <b>${g.name} (${g.model}) ${g.number}</b>.\n\nОтправь новую гифку, видео (.mp4) или картинку:`,
          parse_mode: 'HTML',
          reply_markup: cancelKb
        });
      } else if (data.startsWith('adm_tog_')) {
        const idx = Number(data.replace('adm_tog_', ''));
        const list = readGifts();
        if (!Number.isNaN(idx) && list[idx]) {
          list[idx].reserved = !list[idx].reserved;
          if (!list[idx].reserved) {
            delete list[idx].reservedUntil;
            delete list[idx].reservedBy;
          }
          await writeGifts(list, `Toggle reserve via TG bot: ${list[idx].name}`);
        }
        await sendAdminManageList(chatId, msgId);
      } else if (data.startsWith('adm_del_')) {
        const idx = Number(data.replace('adm_del_', ''));
        const list = readGifts();
        if (!Number.isNaN(idx) && list[idx]) {
          const removed = list.splice(idx, 1)[0];
          await writeGifts(list, `Delete via TG bot: ${removed.name}`);
        }
        await sendAdminManageList(chatId, msgId);
      }
    }
  }
});

async function setupWebhookWithRetry(attempt = 1) {
  if (!BOT_TOKEN || !SITE_URL) return;
  const hookUrl = `${SITE_URL}/telegram/webhook`;
  const r = await tgApi('setWebhook', { url: hookUrl });
  console.log(`Telegram webhook attempt #${attempt}:`, hookUrl, r?.ok);
  if ((!r || !r.ok) && attempt < 4) {
    setTimeout(() => setupWebhookWithRetry(attempt + 1), 4000);
  }
}

(async () => {
  const remoteGifts = await githubFetchJson('data/gifts.json');
  if (Array.isArray(remoteGifts) && remoteGifts.length > 0) {
    fs.writeFileSync(GIFTS_FILE, JSON.stringify(remoteGifts, null, 2), 'utf8');
  } else {
    readGifts();
  }

  const remoteState = await githubFetchJson('data/bot_state.json');
  if (remoteState && typeof remoteState === 'object') {
    fs.writeFileSync(BOT_STATE_FILE, JSON.stringify(remoteState, null, 2), 'utf8');
    const st = readBotState();
    st.adminIds.forEach(id => tgAdminAuth.add(id));
  } else {
    readBotState();
  }

  app.listen(PORT, () => {
    console.log(`GIFT MARKET server running on port ${PORT}`);
    setTimeout(() => setupWebhookWithRetry(1), 2000);
  });
})();
