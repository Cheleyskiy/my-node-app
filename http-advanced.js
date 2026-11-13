const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT_HTTP = 3000;
const PORT_HTTPS = 3443;
const GROUP = '401';
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR);
}
fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), '<h1>Hello from static</h1>');
fs.writeFileSync(path.join(PUBLIC_DIR, 'style.css'), 'body { color: red; }');

const mimeTypes = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.txt': 'text/plain'
};

const cache = new Map();
const CACHE_TTL = 60 * 1000;

const metrics = {
  group: GROUP,
  total: 0,
  byMethod: {},
  byStatus: {},
  startTime: Date.now()
};

function logRequest(req, res) {
  const time = new Date().toLocaleString('ru-RU', { hour12: false });
  const logLine = `[${time}] [${GROUP}] ${req.method} ${req.url} ${res.statusCode}\n`;
  fs.appendFileSync('access.log', logLine);
  
  metrics.total++;
  metrics.byMethod[req.method] = (metrics.byMethod[req.method] || 0) + 1;
  metrics.byStatus[res.statusCode] = (metrics.byStatus[res.statusCode] || 0) + 1;
}

const middlewares = [
  (req, res, next) => {
    res.setHeader('X-Group', GROUP);
    res.on('finish', () => logRequest(req, res));
    next();
  },
  (req, res, next) => {
    if (req.method === 'GET' && req.url !== '/metrics' && !req.url.startsWith('/stream')) {
      const cached = cache.get(req.url);
      if (cached && Date.now() - cached.time < CACHE_TTL) {
        res.setHeader('Cache-Control', 'max-age=60');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(cached.data);
        return;
      }
    }
    next();
  }
];

function runMiddlewares(req, res, finalHandler) {
  let index = 0;
  function next() {
    if (index < middlewares.length) {
      const mw = middlewares[index++];
      try {
        mw(req, res, next);
      } catch (err) {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    } else {
      try {
        finalHandler(req, res);
      } catch (err) {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    }
  }
  next();
}

function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>Advanced Server Running</h1>');
    return;
  }

  if (pathname === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ...metrics,
      uptime: Math.floor((Date.now() - metrics.startTime) / 1000)
    }, null, 2));
    return;
  }

  if (pathname === '/stream') {
    const filePath = path.join(__dirname, 'big-file.txt');
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, 'A'.repeat(1024 * 1024 * 10)); 
    res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  if (pathname.startsWith('/static/')) {
    const relativePath = pathname.replace('/static/', '');
    
    if (relativePath.includes('..')) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    const filePath = path.join(PUBLIC_DIR, relativePath);
    
    fs.stat(filePath, (err, stats) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      const etag = `"${stats.size}-${stats.mtime.getTime()}"`;
      if (req.headers['if-none-match'] === etag) {
        res.writeHead(304);
        res.end();
        return;
      }

      const ext = path.extname(filePath);
      const mime = mimeTypes[ext] || 'application/octet-stream';
      
      res.writeHead(200, {
        'Content-Type': mime,
        'Cache-Control': 'max-age=60',
        'ETag': etag
      });
      fs.createReadStream(filePath).pipe(res);
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
}

const serverHttp = http.createServer((req, res) => {
  runMiddlewares(req, res, handleRequest);
});

serverHttp.listen(PORT_HTTP, () => {
  console.log(`[INFO] HTTP-сервер запущен на порту ${PORT_HTTP}`);
  console.log(`[INFO] Группа: ${GROUP}`);
});

try {
  const options = {
    key: fs.readFileSync(path.join(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
  };
  const serverHttps = https.createServer(options, (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`=== HTTPS работает! ===<br>Группа: ${GROUP}`);
  });
  serverHttps.listen(PORT_HTTPS, () => {
    console.log(`[INFO] HTTPS-сервер запущен на порту ${PORT_HTTPS}`);
  });
} catch (e) {
  console.log('[WARN] Сертификаты не найдены. HTTPS-сервер не запущен.');
}

process.on('SIGINT', () => {
  console.log('\n[INFO] Сервер корректно завершает работу...');
  serverHttp.close(() => process.exit(0));
});