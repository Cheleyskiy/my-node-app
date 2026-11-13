const http = require('http');
const querystring = require('querystring');

const PORT = 3000;
const GROUP = '401';
const MAX_SIZE = 1024 * 1024;

function readBody(req, callback) {
  let body = [];
  let size = 0;

  req.on('data', chunk => {
    size += chunk.length;
    if (size > MAX_SIZE) {
      req.destroy();
      callback(new Error('413 Payload Too Large'));
      return;
    }
    body.push(chunk);
  });

  req.on('end', () => {
    callback(null, Buffer.concat(body));
  });

  req.on('error', (err) => {
    callback(err);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/echo') {
    readBody(req, (err, buffer) => {
      if (err) {
        res.writeHead(413, { 'Content-Type': 'text/plain' });
        res.end('413 Payload Too Large');
        return;
      }

      const text = buffer.toString('utf8');
      const contentType = req.headers['content-type'] || '';

      if (contentType.includes('application/json')) {
        try {
          const data = JSON.parse(text);
          data.group = GROUP;
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(data));
        } catch (e) {
          res.writeHead(400);
          res.end('Invalid JSON');
        }
      } else {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(text);
      }
    });

  } else if (req.method === 'POST' && req.url === '/form') {
    readBody(req, (err, buffer) => {
      if (err) {
        res.writeHead(413);
        res.end('413 Payload Too Large');
        return;
      }
      const formData = querystring.parse(buffer.toString('utf8'));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(formData));
    });

  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Сервер чтения тела запущен на порту ${PORT}`);
});