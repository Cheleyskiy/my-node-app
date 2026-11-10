require('dotenv').config();
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const mysql = require('mysql2/promise');

const app = new Koa();
const router = new Router();

const pool = mysql.createPool({
  host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  waitForConnections: true, connectionLimit: 10
});

const cache = new Map();
const metrics = { queries: 0, avgTime: 0, errors: 0, cacheHit: 0, cacheMiss: 0 };

app.use(async (ctx, next) => {
  const start = Date.now();
  ctx.db = pool;
  try {
    await next();
  } catch (err) {
    metrics.errors++;
    ctx.status = err.status || 500;
    ctx.body = { error: err.message };
  } finally {
    const ms = Date.now() - start;
    metrics.queries++;
    metrics.avgTime = (metrics.avgTime * (metrics.queries - 1) + ms) / metrics.queries;
  }
});

app.use(bodyParser());

router.get('/api/students', async (ctx) => {
  const limit = parseInt(ctx.query.limit) || 10;
  const offset = parseInt(ctx.query.offset) || 0;
  
  const cacheKey = `students_${limit}_${offset}`;
  if (cache.has(cacheKey)) {
    metrics.cacheHit++;
    ctx.body = cache.get(cacheKey);
    return;
  }

  metrics.cacheMiss++;
  const [rows] = await ctx.db.query('SELECT * FROM students LIMIT ? OFFSET ?', [limit, offset]);
  const [totalRes] = await ctx.db.query('SELECT COUNT(*) as total FROM students');
  
  const response = { data: rows, pagination: { total: totalRes[0].total, limit, offset } };
  cache.set(cacheKey, response);
  setTimeout(() => cache.delete(cacheKey), 60000);
  
  ctx.body = response;
});

router.get('/api/students/stats', async (ctx) => {
  const [totalRes] = await ctx.db.query('SELECT COUNT(*) as total, AVG(grade) as avgGrade FROM students');
  const [groupRes] = await ctx.db.query('SELECT group_name, COUNT(*) as count FROM students GROUP BY group_name');
  
  ctx.body = {
    total: totalRes[0].total,
    averageGrade: parseFloat(totalRes[0].avgGrade || 0).toFixed(2),
    byGroup: groupRes.reduce((acc, row) => ({ ...acc, [row.group_name]: row.count }), {})
  };
});

router.post('/api/students/batch', async (ctx) => {
  const students = ctx.request.body;
  if (!Array.isArray(students)) {
    ctx.status = 400;
    ctx.body = { error: 'Ожидается массив' };
    return;
  }

  const connection = await ctx.db.getConnection();
  try {
    await connection.beginTransaction();
    let created = 0;
    
    for (const st of students) {
      await connection.query(
        'INSERT INTO students (name, group_name, course, grade) VALUES (?, ?, ?, ?)',
        [st.name, st.group_name, st.course, st.grade]
      );
      created++;
    }
    
    await connection.commit();
    ctx.body = { created, transaction: 'committed' };
  } catch (err) {
    await connection.rollback();
    ctx.status = 400;
    ctx.body = { error: err.message, transaction: 'rolled back' };
  } finally {
    connection.release();
  }
});

router.get('/api/metrics', (ctx) => {
  ctx.body = metrics;
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log('Koa-сервер запущен на порту 3000');
});