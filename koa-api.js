const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router({ prefix: '/api' });

let users = [
  { id: 1, name: 'Челей Максим', group: '401' },
  { id: 2, name: 'Черепович Владислав', group: '401' },
];
let nextId = 3;

router.get('/users', (ctx) => {
  ctx.body = users;
});

router.get('/users/:id', (ctx) => {
  const id = Number(ctx.params.id);
  const user = users.find((u) => u.id === id);
  if (!user) {
    ctx.status = 404;
    ctx.body = { error: 'Пользователь не найден', status: 404 };
    return;
  }
  ctx.body = user;
});

router.post('/users', (ctx) => {
  const { name, group } = ctx.request.body || {};
  if (!name || !group) {
    ctx.status = 400;
    ctx.body = { error: 'Поля name и group обязательны', status: 400 };
    return;
  }
  const newUser = { id: nextId++, name, group };
  users.push(newUser);
  ctx.status = 201;
  ctx.body = newUser;
});

router.put('/users/:id', (ctx) => {
  const id = Number(ctx.params.id);
  const user = users.find((u) => u.id === id);
  if (!user) {
    ctx.status = 404;
    ctx.body = { error: 'Пользователь не найден', status: 404 };
    return;
  }
  const { name, group } = ctx.request.body || {};
  if (!name || !group) {
    ctx.status = 400;
    ctx.body = { error: 'Поля name и group обязательны', status: 400 };
    return;
  }
  user.name = name;
  user.group = group;
  ctx.body = user;
});

router.delete('/users/:id', (ctx) => {
  const id = Number(ctx.params.id);
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Пользователь не найден', status: 404 };
    return;
  }
  const removed = users.splice(index, 1)[0];
  ctx.body = { message: 'Пользователь удалён', user: removed };
});

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000, () => {
  console.log('API-сервер запущен на http://localhost:3000');
});