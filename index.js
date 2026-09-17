//Челей Максим 401

const http = require('http');
const { EventEmitter } = require('events');

const logger = require('./logger'); 
const OrderHandler = require('./order-handler');

class AppServer extends EventEmitter {
  constructor() {
    super();
    this.server = null;
    this.port = null;
    this.orderHandler = new OrderHandler();
  }

  start(port) {
    if (this.server) {
      this.emit('error', new Error('Сервер уже запущен'));
      return;
    }

    this.port = port;
    this.server = http.createServer((req, res) => {
      this.emit('request:received', {
        method: req.method,
        url: req.url,
      });

      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Hello from Event-Driven Server!');
    });

    this.server.listen(port, () => {
      this.emit('server:started', port);
    });

    this.server.on('error', (err) => this.emit('error', err));
  }

  stop() {
    if (!this.server) {
      this.emit('error', new Error('Сервер не запущен'));
      return;
    }

    this.server.close(() => {
      this.server = null;
      this.emit('server:stopped');
    });
  }
}

const app = new AppServer();

logger.setupLogger(app); 

app.on('server:started', (port) => {
  console.log(`Сервер запущен на порту ${port}`);
});

app.on('request:received', ({ method, url }) => {
  console.log(`Получен запрос: ${method} ${url}`);
});

app.on('server:stopped', () => {
  console.log('Сервер остановлен');
});

app.on('error', (err) => {
  console.error('Ошибка сервера:', err.message);
});


const PORT = 3000;
app.start(PORT);

setTimeout(() => {
  app.stop();
}, 10000);

module.exports = AppServer;