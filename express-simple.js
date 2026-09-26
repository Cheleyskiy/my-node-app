const express = require('express');

const app = express();
const PORT = 3000;

const page = (title, content) => `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 700px; margin: 60px auto; padding: 20px; background: #f5f7fa; color: #222; }
    .card { background: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
    h1 { color: #4d6bfe; margin-top: 0; }
    .info { margin: 12px 0; padding: 12px; background: #eef1ff; border-radius: 8px; }
    .label { font-weight: bold; color: #4d6bfe; }
    a { color: #4d6bfe; }
    ul { line-height: 1.8; }
  </style>
</head>
<body><div class="card">${content}</div></body>
</html>`;

app.get('/', (req, res) => {
  const now = new Date().toLocaleString('ru-RU');
  res.send(page('Лабораторная работа №16', `
    <h1>Лабораторная работа №16</h1>
    <div class="info"><span class="label">Группа:</span> 401</div>
    <div class="info"><span class="label">Студент:</span> Челей Максим Александрович</div>
    <div class="info"><span class="label">Дата и время:</span> ${now}</div>
    <p>Добро пожаловать на сервер Express.js!</p>
    <h3>Доступные маршруты:</h3>
    <ul>
      <li><a href="/">/</a> — главная</li>
      <li><a href="/about">/about</a> — о разработчике</li>
      <li><a href="/contacts">/contacts</a> — контакты</li>
    </ul>
  `));
});

app.get('/about', (req, res) => {
  res.send(page('О разработчике', `
    <h1>О разработчике</h1>
    <div class="info"><span class="label">ФИО:</span> Челей Максим Александрович</div>
    <div class="info"><span class="label">Группа:</span>401</div>
    <div class="info"><span class="label">Курс:</span> 4</div>
    <p>Студент, изучающий Node.js и Express.js.</p>
    <p><a href="/">← На главную</a></p>
  `));
});

app.get('/contacts', (req, res) => {
  res.send(page('Контакты', `
    <h1>Контакты</h1>
    <div class="info"><span class="label">Email:</span> cheley@example.com</div>
    <div class="info"><span class="label">Telegram:</span> @cheley</div>
    <div class="info"><span class="label">GitHub:</span> github.com/Cheleyskiy</div>
    <p><a href="/">← На главную</a></p>
  `));
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Откройте http://localhost:${PORT}`);
});