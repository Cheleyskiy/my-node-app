const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

app.use(async (ctx, next) => {
  const start = Date.now();
  const time = new Date().toLocaleString('ru-RU');
  try {
    await next();
  } finally {
    const ms = Date.now() - start;
    console.log(`[${time}] ${ctx.method} ${ctx.path} - ${ms}ms`);
  }
});

app.use(async (ctx, next) => {
  try {
    await next();
    if (ctx.status === 404 && !ctx.body) {
      ctx.status = 404;
      ctx.body = { error: 'Маршрут не найден', status: 404 };
    }
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      error: err.message || 'Внутренняя ошибка сервера',
      status: ctx.status,
    };
    ctx.app.emit('error', err, ctx);
  }
});

async function authMiddleware(ctx, next) {
  const auth = ctx.get('Authorization');
  if (!auth) {
    ctx.status = 401;
    ctx.body = { error: 'Требуется авторизация', status: 401 };
    return;
  }
  await next();
}

router.get('/', (ctx) => {
  ctx.body = { message: 'Сервер работает', status: 'ok' };
});

router.get('/protected', authMiddleware, (ctx) => {
  ctx.body = {
    message: 'Доступ разрешён',
    auth: ctx.get('Authorization'),
  };
});

router.get('/error', () => {
  throw new Error('Тестовая ошибка');
});

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

app.on('error', (err) => {
  console.error('Ошибка приложения:', err.message);
});

app.listen(3000, () => {
  console.log('Сервер с middleware запущен на http://localhost:3000');
});