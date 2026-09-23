// Telegram-бот «Хуна Аль-Арабия»: отвечает на /start приветствием и кнопкой запуска Mini App.
// Нужны переменные окружения в Vercel: BOT_TOKEN и WEBHOOK_SECRET.

const APP_URL = 'https://huna-arabic.vercel.app/';
const WELCOME_IMG = 'https://huna-arabic.vercel.app/assets/welcome.png';
const CHANNEL_URL = 'https://t.me/huna_arabic';

async function tg(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return r.json();
}

const esc = (s) => String(s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const keyboard = {
  inline_keyboard: [
    [{ text: '📖 Открыть учебник', web_app: { url: APP_URL } }],
    [{ text: '📢 Канал академии', url: CHANNEL_URL }]
  ]
};

function welcomeText(name) {
  return [
    `Ас-саляму алейкум${name ? ', <b>' + esc(name) + '</b>' : ''}! 👋`,
    '',
    'Добро пожаловать в интерактивный учебник арабского языка <b>«Хуна Аль-Арабия»</b> от академии HUNA ARABIC.',
    '',
    '📖 27 диалогов с огласовками',
    '🗂 343 слова с переводом',
    '🃏 Карточки и тесты по каждой главе',
    '📊 Прогресс и серия дней',
    '',
    'Нажмите кнопку ниже, чтобы начать 👇'
  ].join('\n');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(200).send('ok'); return; }
  if (process.env.WEBHOOK_SECRET && req.headers['x-telegram-bot-api-secret-token'] !== process.env.WEBHOOK_SECRET) {
    res.status(401).send('unauthorized'); return;
  }
  try {
    const update = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const msg = update.message;
    if (msg && msg.chat) {
      const chat_id = msg.chat.id;
      const text = (msg.text || '').trim();
      if (text.startsWith('/start')) {
        const caption = welcomeText(msg.from && msg.from.first_name);
        const r = await tg('sendPhoto', { chat_id, photo: WELCOME_IMG, caption, parse_mode: 'HTML', reply_markup: keyboard });
        if (!r.ok) await tg('sendMessage', { chat_id, text: caption, parse_mode: 'HTML', reply_markup: keyboard });
      } else if (text.startsWith('/help')) {
        await tg('sendMessage', {
          chat_id, parse_mode: 'HTML', reply_markup: keyboard,
          text: 'Учебник открывается кнопкой <b>«Открыть учебник»</b> — здесь или внизу слева от поля ввода.\n\nВопросы по курсу можно задать в канале академии.'
        });
      } else {
        await tg('sendMessage', {
          chat_id, reply_markup: keyboard,
          text: 'Я открываю учебник «Хуна Аль-Арабия» 📖 Нажмите кнопку ниже.'
        });
      }
    }
  } catch (e) {
    console.error(e);
  }
  res.status(200).send('ok');
};
