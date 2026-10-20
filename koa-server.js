const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

const FIRST_NAMES_M = ['Александр','Дмитрий','Максим','Иван','Артём','Никита','Егор','Андрей','Алексей','Сергей'];
const FIRST_NAMES_F = ['Анна','Мария','Екатерина','Ольга','Дарья','София','Виктория','Алиса','Полина','Ксения'];
const LAST_NAMES = ['Иванов','Петров','Смирнов','Кузнецов','Соколов','Попов','Лебедев','Козлов','Новиков','Морозов'];
const GROUPS = ['ББМО-01-23','ББМО-02-23','ББМО-03-23'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateStudents(count) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    const isMale = Math.random() > 0.5;
    const first = isMale ? randomItem(FIRST_NAMES_M) : randomItem(FIRST_NAMES_F);
    const last = randomItem(LAST_NAMES);
    const name = `${last} ${first}`;
    const group = randomItem(GROUPS);
    const course = 1 + Math.floor(Math.random() * 4);
    list.push({ id: i, name, group, course });
  }
  return list;
}

let students = generateStudents(50);
let nextId = students.length + 1;

function applyQuery(list, query) {
  let result = [...list];

  if (query.search) {
    const needle = String(query.search).toLowerCase();
    result = result.filter((s) => s.name.toLowerCase().includes(needle));
  }

  if (query.group) {
    result = result.filter((s) => s.group === query.group);
  }

  if (query.sort) {
    const fields = String(query.sort).split(',');
    result.sort((a, b) => {
      for (const f of fields) {
        const desc = f.startsWith('-');
        const key = desc ? f.slice(1) : f;
        if (a[key] === undefined || b[key] === undefined) continue;
        let cmp = 0;
        if (typeof a[key] === 'number') cmp = a[key] - b[key];
        else cmp = String(a[key]).localeCompare(String(b[key]), 'ru');
        if (cmp !== 0) return desc ? -cmp : cmp;
      }
      return 0;
    });
  }

  return result;
}

function paginate(list, query) {
  const limit = query.limit !== undefined ? Number(query.limit) : 10;
  const offset = query.offset !== undefined ? Number(query.offset) : 0;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
  const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;
  return {
    total: list.length,
    limit: safeLimit,
    offset: safeOffset,
    items: list.slice(safeOffset, safeOffset + safeLimit),
  };
}

function validateStudent(body) {
  const errors = [];
  if (!body || typeof body !== 'object') return ['Тело должно быть объектом'];
  if (!body.name || typeof body.name !== 'string') errors.push('name обязателен');
  if (!body.group || typeof body.group !== 'string') errors.push('group обязателен');
  if (body.course !== undefined) {
    const c = Number(body.course);
    if (Number.isNaN(c) || c < 1 || c > 4) errors.push('course должен быть 1..4');
  }
  return errors;
}

router.get('/students', (ctx) => {
  const filtered = applyQuery(students, ctx.query);
  ctx.body = paginate(filtered, ctx.query);
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
      ctx.body = { error: 'Маршрут не найден', status: 404 };
    }
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { error: err.message || 'Внутренняя ошибка сервера', status: ctx.status };
  }
});

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000, () => {
  console.log('REST API на Koa.js запущен: http://localhost:3000');
  console.log(`Сгенерировано студентов: ${students.length}`);
});