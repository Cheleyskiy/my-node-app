const request = require('supertest');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const usersRouter = require('../routes/users');
const { connectDB, client } = require('../config/db');

const app = new Koa();
app.use(bodyParser());
app.use(usersRouter.routes());

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await client.close();
});

describe('Users API', () => {
  it('GET /api/users returns 200', async () => {
    const res = await request(app.callback()).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });
});