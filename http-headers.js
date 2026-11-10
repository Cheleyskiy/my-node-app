const http = require('http');

const PORT = 3000;
const GROUP = '401';

const server = http.createServer((req, res) => {
  if (req.url === '/headers') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Powered-By', 'Node.js');
    res.setHeader('X-Group', GROUP);
    res.setHeader('Cache-Control', 'no-cache');

    res.writeHead(200);
    res.end(JSON.stringify({
      headers: req.headers,
      method: req.method,
      url: req.url,
      httpVersion: req.httpVersion
    }, null, 2));

  } else if (req.url === '/headers/set') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Powered-By', 'Node.js');
    res.setHeader('X-Group', GROUP);
    res.setHeader('Cache-Control', 'no-cache');
    res.writeHead(200);
    res.end('Заголовки установлены');

  } else if (req.url === '/headers/check') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.writeHead(200);
    res.end(JSON.stringify({
      hasContentType: res.hasHeader('Content-Type'),
      hasXGroup: res.hasHeader('X-Group'),
      hasUnknown: res.hasHeader('Unknown-Header')
    }, null, 2));

  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Сервер заголовков запущен на порту ${PORT}`);
});