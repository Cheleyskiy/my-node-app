const Router = require('koa-router');
const router = new Router({ prefix: '/api/users' });
const userService = require('../services/userService');
const Joi = require('joi');

const userSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  group_name: Joi.string().pattern(/^401$/).required(), 
  age: Joi.number().integer().min(16).max(100).required()
});

router.get('/', async (ctx) => {
  const options = {
    page: parseInt(ctx.query.page) || 1,
    limit: parseInt(ctx.query.limit) || 10,
    sort: ctx.query.sort,
    group_name: ctx.query.group_name,
    course: ctx.query.course,
    age_min: ctx.query.age_min,
    age_max: ctx.query.age_max
  };
  const result = await userService.getUsers(options);
  ctx.body = result;
});

router.get('/stats', async (ctx) => {
  const db = require('../config/db').getDB();
  const stats = await db.collection('users').aggregate([
    { $group: { 
      _id: null, 
      total: { $sum: 1 }, 
      averageAge: { $avg: "$age" } 
    }}
  ]).toArray();
  ctx.body = stats[0];
});

router.get('/:id', async (ctx) => {
  const user = await userService.getUserById(ctx.params.id);
  ctx.body = { data: user };
});

router.post('/', async (ctx) => {
  const { error, value } = userSchema.validate(ctx.request.body);
  if (error) {
    ctx.status = 400;
    ctx.body = { error: 'Validation failed', details: error.details };
    return;
  }
  const user = await userService.createUser(value);
  ctx.status = 201;
  ctx.body = { data: user };
});

module.exports = router;