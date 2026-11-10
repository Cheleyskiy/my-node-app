const EventEmitter = require('events');
const http = require('http');

const GROUP = '401';

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      events: {}, 
      total: 0,   
      lastCall: {} 
    };
    this.anyListeners = []; 
    this.priorities = new Map(); 
    this.defaultMaxListeners = 100; 
  }

  on(event, listener, priority = 0) {
    if (!this.priorities.has(event)) {
      this.priorities.set(event, new Map());
    }
    this.priorities.get(event).set(listener, priority);
    return super.on(event, listener);
  }

  once(event, listener, priority = 0) {
    const wrapped = (...args) => {
      listener(...args);
      this.priorities.get(event)?.delete(wrapped);
    };
    this.priorities.set(event, this.priorities.get(event) || new Map());
    this.priorities.get(event).set(wrapped, priority);
    return super.once(event, wrapped);
  }

  onAny(listener) {
    this.anyListeners.push(listener);
  }

  emit(event, ...args) {
    this.metrics.events[event] = (this.metrics.events[event] || 0) + 1;
    this.metrics.total++;
    this.metrics.lastCall[event] = new Date().toISOString();

    for (const listener of this.anyListeners) {
      listener(event, args);
    }

    const listeners = super.listeners(event);
    if (listeners.length > 0) {
      const priorities = this.priorities.get(event) || new Map();
      
      const sortedListeners = [...listeners].sort((a, b) => {
        const pA = priorities.get(a) || 0;
        const pB = priorities.get(b) || 0;
        return pB - pA;
      });

      for (const listener of sortedListeners) {
        try {
          listener(...args);
        } catch (err) {
          if (event === 'error') {
            console.error(`[ERROR] [${GROUP}] Критическая ошибка в обработчике:`, err.message);
          } else {
            console.error(`[ERROR] [${GROUP}] Ошибка в слушателе "${event}": ${err.message}`);
          }
          this.metrics.events[`${event}:error`] = (this.metrics.events[`${event}:error`] || 0) + 1;
        }
      }
    }
    return true;
  }

  getMetrics() {
    return {
      group: GROUP,
      events: this.metrics.events,
      total: this.metrics.total,
      lastCall: this.metrics.lastCall,
      listeners: Object.fromEntries(
        this.eventNames().map(name => [name, this.listenerCount(name)])
      )
    };
  }
}

console.log(`=== EventBus (группа ${GROUP}) ===\n`);
const bus = new EventBus();

console.log('--- Приоритеты ---');
bus.on('test-priority', () => console.log('[priority 0] Низкий приоритет'), 0);
bus.on('test-priority', () => console.log('[priority 10] Высокий приоритет'), 10);
bus.on('test-priority', () => console.log('[priority 5] Средний приоритет'), 5);
bus.emit('test-priority');

console.log('\n--- Wildcard ---');
bus.onAny((event, args) => {
  console.log(`[onAny] Событие "${event}" с аргументами: ${JSON.stringify(args)}`);
});
bus.emit('greet', 'Иван');
bus.emit('info', GROUP);

console.log('\n--- Once-кэш ---');
bus.once('tick', () => console.log('[tick] Вызов 1'));
bus.emit('tick');
bus.emit('tick');
bus.emit('tick');

console.log('\n--- Обработка ошибок ---');
bus.on('test', () => { throw new Error('Сломалось!'); });
bus.on('test2', () => { throw new Error('Тоже сломалось!'); });
bus.emit('test');
bus.emit('test2');

console.log('\n--- Метрики ---');
const metrics = bus.getMetrics();
console.log(`greet: ${metrics.events['greet']} вызова`);
console.log(`info: ${metrics.events['info']} вызов`);
console.log(`tick: ${metrics.events['tick']} вызова`);
console.log(`test: ${metrics.events['test']} вызова (1 ошибка)`);
console.log(`Всего событий: ${metrics.total}`);

console.log('\n--- HTTP Сервер на порту 3000 ---');
const server = http.createServer((req, res) => {
  bus.emit('request', req.url);
  
  if (req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(bus.getMetrics(), null, 2));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('OK');
  }
});

server.listen(3000, () => {
  console.log('Сервер запущен. Для проверки метрик выполните:');
  console.log('curl http://localhost:3000/metrics');
  console.log('(Нажмите Ctrl+C для выхода)');
});