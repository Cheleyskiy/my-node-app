const Koa = require('koa');

const app = new Koa();
const PORT = 3000;

app.use(async (ctx) => {
  const now = new Date().toLocaleString('ru-RU');

  ctx.type = 'text/html; charset=utf-8';
  ctx.body = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>Лабораторная работа №15</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 700px; margin: 60px auto; padding: 20px; background: #f5f7fa; color: #222; }
        .card { background: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
        h1 { color: #4d6bfe; margin-top: 0; }
        .info { margin: 15px 0; padding: 12px; background: #eef1ff; border-radius: 8px; }
        .label { font-weight: bold; color: #4d6bfe; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Лабораторная работа №15</h1>
        <div class="info"><span class="label">Группа:</span> 401</div>
        <div class="info"><span class="label">Студент:</span> Челей Максим Александрович</div>
        <div class="info"><span class="label">Дата и время:</span> ${now}</div>
        <p>Добро пожаловать! Сервер работает на Koa.js.</p>
      </div>
    </body>
    </html>
  `;
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Откройте http://localhost:${PORT}`);
});