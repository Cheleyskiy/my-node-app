const express = require('express');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  const time = new Date().toLocaleString('ru-RU');
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[${time}] ${req.method} ${req.path} ${res.statusCode} - ${ms}ms`);
  });
  next();
});

app.use(compression());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Слишком много запросов', status: 429 });
  },
});
app.use(limiter);

app.get('/', (req, res) => {
  res.json({ message: 'Сервер работает', status: 'ok' });
});

app.get('/protected', (req, res) => {
  const auth = req.get('Authorization');
  if (!auth) return res.status(401).json({ error: 'Требуется авторизация', status: 401 });
  res.json({ message: 'Доступ разрешён', auth });
});

app.get('/error', (req, res, next) => {
  next(new Error('Тестовая ошибка'));
});

app.get('/async-error', async (req, res, next) => {
  try {
    await Promise.reject(new Error('Асинхронная ошибка'));
  } catch (err) {
    next(err);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден', status: 404 });
});

app.use((err, req, res, next) => {
  console.error('Ошибка:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Внутренняя ошибка сервера',
    status: err.status || 500,
  });
});

app.listen(3000, () => {
  console.log('Сервер с middleware запущен: http://localhost:3000');
});