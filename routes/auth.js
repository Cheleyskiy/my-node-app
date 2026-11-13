const Router = require('koa-router');
const router = new Router({ prefix: '/api/auth' });
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_401';

router.post('/register', async (ctx) => {
  const { name, email, password } = ctx.request.body;
  const db = getDB();
  
  const existing = await db.collection('users').findOne({ email });
  if (existing) {
    ctx.status = 409;
    ctx.body = { error: 'Email already exists' };
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const result = await db.collection('users').insertOne({ name, email, password: hash, role: 'user' });
  
  const accessToken = jwt.sign({ userId: result.insertedId, email, role: 'user' }, JWT_SECRET, { expiresIn: '15m' });
  ctx.status = 201;
  ctx.body = { data: { userId: result.insertedId, email }, accessToken };
});

router.post('/login', async (ctx) => {
  const { email, password } = ctx.request.body;
  const db = getDB();
  
  const user = await db.collection('users').findOne({ email });
  if (!user) {
    ctx.status = 401;
    ctx.body = { error: 'Invalid credentials' };
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    ctx.status = 401;
    ctx.body = { error: 'Invalid credentials' };
    return;
  }

  const accessToken = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
  ctx.body = { accessToken };
});

module.exports = router;