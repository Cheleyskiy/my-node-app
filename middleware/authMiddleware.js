const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret_401';

module.exports = async (ctx, next) => {
  const header = ctx.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized' };
    return;
  }

  const token = header.split(' ')[1];
  try {
    ctx.state.user = jwt.verify(token, JWT_SECRET);
    await next();
  } catch (err) {
    ctx.status = 401;
    ctx.body = { error: 'Invalid token' };
  }
};