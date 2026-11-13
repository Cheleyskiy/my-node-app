require('dotenv').config();
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const { MongoClient, ObjectId } = require('mongodb');
const WebSocket = require('ws');

const app = new Koa();
const router = new Router();

const client = new MongoClient(process.env.MONGO_URI);
let db, students;
const cache = new Map();
const metrics = { queries: 0, avgTime: 0, errors: 0 };

async function start() {
  await client.connect();
  db = client.db(process.env.DB_NAME || '401_db');
  students = db.collection('students');
  
  await students.createIndex({ group_name: 1 });
  await students.createIndex({ name: 'text' });
  
  console.log(`[INFO] MongoDB подключена: ${db.databaseName}`);
  console.log('[INFO] Индексы созданы: group_name_1, name_text');

  const changeStream = students.watch();
  changeStream.on('change', (change) => {
    console.log(`[CHANGE STREAM] ${change.operationType}:`, change.fullDocument || change.documentKey);
  });
  console.log('[INFO] Change Stream запущен');
}

app.use(async (ctx, next) => {
  const start = Date.now();
  ctx.db = db;
  try {
    await next();
  } catch (err) {
    metrics.errors++;
    ctx.status = 500;
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
    ctx.body = cache.get(cacheKey);
    return;
  }

  const data = await ctx.db.collection('students').find({}).skip(offset).limit(limit).toArray();
  const total = await ctx.db.collection('students').countDocuments();
  
  const response = { data, pagination: { total, limit, offset } };
  cache.set(cacheKey, response);
  setTimeout(() => cache.delete(cacheKey), 60000);
  
  ctx.body = response;
});

router.post('/api/students/batch', async (ctx) => {
  const batch = ctx.request.body;
  if (!Array.isArray(batch)) {
    ctx.status = 400;
    ctx.body = { error: 'Ожидается массив' };
    return;
  }

  const session = client.startSession();
  try {
    session.startTransaction();
    const result = await ctx.db.collection('students').insertMany(batch, { session });
    await session.commitTransaction();
    cache.clear();
    ctx.body = { inserted: result.insertedCount, transaction: 'committed' };
  } catch (e) {
    await session.abortTransaction();
    ctx.status = 400;
    ctx.body = { error: e.message, transaction: 'aborted' };
  } finally {
    await session.endSession();
  }
});

router.get('/api/students/stats', async (ctx) => {
  const stats = await ctx.db.collection('students').aggregate([
    { $group: { _id: '$group_name', total: { $sum: 1 }, avgGrade: { $avg: '$grade' } } }
  ]).toArray();
  
  const total = await ctx.db.collection('students').countDocuments();
  ctx.body = { total, byGroup: stats };
});

router.get('/api/students/search', async (ctx) => {
  const q = ctx.query.q;
  if (!q) {
    ctx.status = 400;
    ctx.body = { error: 'Укажите параметр q' };
    return;
  }
  const data = await ctx.db.collection('students').find({ $text: { $search: q } }, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } }).toArray();
  ctx.body = { found: data.length, data };
});

router.get('/api/metrics', (ctx) => {
  ctx.body = metrics;
});

app.use(router.routes()).use(router.allowedMethods());

start().then(() => {
  app.listen(3000, () => console.log('[INFO] Koa-сервер на порту 3000'));
  
  const wss = new WebSocket.Server({ port: 3001 });
  wss.on('connection', (ws) => {
    console.log('[WS] Клиент подключен');
    const changeStream = db.collection('students').watch();
    changeStream.on('change', (change) => {
      ws.send(JSON.stringify({ type: change.operationType, doc: change.fullDocument || change.documentKey }));
    });
    ws.on('close', () => {
      changeStream.close();
      console.log('[WS] Клиент отключен');
    });
  });
  console.log('[INFO] WebSocket на порту 3001');
});