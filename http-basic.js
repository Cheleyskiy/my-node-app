const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
  const time = new Date().toLocaleString('ru-RU', { hour12: false });
  let status = 200;
  let body = '';

  if (req.url === '/') {
    body = 'Главная страница';
  } else if (req.url === '/about') {
    body = 'О сервере';
  } else {
    status = 404;
    body = 'Not Found';
  }

  console.log(`[${time}] ${req.method} ${req.url} ${status}`);

  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(body);
});

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});