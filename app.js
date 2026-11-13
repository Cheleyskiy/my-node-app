require('dotenv').config();
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const { connectDB } = require('./config/db');
const errorMiddleware = require('./middleware/errorMiddleware');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');
const { koaSwagger } = require('koa2-swagger-ui');
const swaggerSpec = require('./swagger');

const app = new Koa();

// 1. Установка заголовка группы
app.use(async (ctx, next) => {
  ctx.set('X-Group', '401');
  await next();
});

// 2. Обработка ошибок
app.use(errorMiddleware);

// 3. Парсер тела запроса (ОБЯЗАТЕЛЬНО до роутеров)
app.use(bodyParser());

// 4. Swagger документация
app.use(koaSwagger({
  routePrefix: '/api-docs',
  swaggerOptions: { spec: swaggerSpec }
}));

// 5. Публичные маршруты авторизации (Регистрация/Вход)
app.use(authRouter.routes()).use(authRouter.allowedMethods());

// 6. Проверка JWT токена для защищенных маршрутов
app.use(async (ctx, next) => {
  if (ctx.path.startsWith('/api/users') && ctx.method !== 'GET') {
    return authMiddleware(ctx, next);
  }
  await next();
});

// 7. Маршруты пользователей (CRUD)
app.use(usersRouter.routes()).use(usersRouter.allowedMethods());

// 8. Запуск
connectDB().then(() => {
  app.listen(3000, () => {
    console.log('[INFO] Koa-сервер на порту 3000');
    console.log('[INFO] Группа: 401');
  });
});