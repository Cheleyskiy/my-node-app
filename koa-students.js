const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

let students = [
  { id: 1, name: 'Анна Смирнова', group: 'ББМО-01-23', course: 2 },
  { id: 2, name: 'Иван Петров', group: 'ББМО-01-23', course: 1 },
  { id: 3, name: 'Мария Иванова', group: 'ББМО-02-23', course: 3 },
  { id: 4, name: 'Алексей Кузнецов', group: 'ББМО-01-23', course: 2 },
];
let nextId = 5;

function validateStudent(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return ['Тело запроса должно быть объектом'];
  }
  if (!body.name || typeof body.name !== 'string') errors.push('name обязателен');
  if (!body.group || typeof body.group !== 'string') errors.push('group обязателен');
  if (body.course !== undefined) {
    const c = Number(body.course);
    if (Number.isNaN(c) || c < 1 || c > 4) errors.push('course должен быть 1..4');
  }
  return errors;
}

router.get('/students', (ctx) => {
  const { group } = ctx.query;
  let result = students;
  if (group) {
    result = students.filter((s) => s.group === group);
  }
  ctx.body = result;
});

router.get('/students/:id', (ctx) => {
  const id = Number(ctx.params.id);
  const student = students.find((s) => s.id === id);
  if (!student) {
    ctx.status = 404;
    ctx.body = { error: 'Студент не найден', status: 404 };
    return;
  }
  ctx.body = student;
});

router.post('/students', (ctx) => {
  const errors = validateStudent(ctx.request.body);
  if (errors.length) {
    ctx.status = 400;
    ctx.body = { error: 'Невалидные данные', details: errors, status: 400 };
    return;
  }
  const { name, group, course } = ctx.request.body;
  const student = { id: nextId++, name, group, course: course ?? 1 };
  students.push(student);
  ctx.status = 201;
  ctx.body = student;
});

router.put('/students/:id', (ctx) => {
  const id = Number(ctx.params.id);
  const student = students.find((s) => s.id === id);
  if (!student) {
    ctx.status = 404;
    ctx.body = { error: 'Студент не найден', status: 404 };
    return;
  }
  const { name, group, course } = ctx.request.body || {};
  if (name !== undefined) student.name = name;
  if (group !== undefined) student.group = group;
  if (course !== undefined) {
    const c = Number(course);
    if (Number.isNaN(c) || c < 1 || c > 4) {
      ctx.status = 400;
      ctx.body = { error: 'course должен быть 1..4', status: 400 };
      return;
    }
    student.course = c;
  }
  ctx.body = student;
});

router.delete('/students/:id', (ctx) => {
  const id = Number(ctx.params.id);
  const index = students.findIndex((s) => s.id === id);
  if (index === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Студент не найден', status: 404 };
    return;
  }
  const removed = students.splice(index, 1)[0];
  ctx.body = { message: 'Студент удалён', student: removed };
});

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Students API запущен на http://localhost:3000');
});