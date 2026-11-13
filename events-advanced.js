const EventEmitter = require('events');

const GROUP = '[401]';

class PluginManager extends EventEmitter {
  constructor() {
    super();
    this.on('newListener', (event, listener) => {
      if (event !== 'newListener' && event !== 'removeListener') {
        console.log(`[newListener] Добавлен слушатель "${event}"`);
      }
    });
    
    this.on('removeListener', (event, listener) => {
      if (event !== 'newListener' && event !== 'removeListener') {
        console.log(`[removeListener] Удалён слушатель "${event}"`);
      }
    });
  }

  registerPlugin(name) {
    this.emit('plugin:registered', name);
  }

  removePlugin(name) {
    this.emit('plugin:removed', name);
  }
}

const pm = new PluginManager();
console.log('Система плагинов');

pm.on('plugin:registered', (name) => {
  console.log(`[PLUGIN] Зарегистрирован: ${name}`);
});

pm.on('plugin:removed', (name) => {
  console.log(`[PLUGIN] Удалён: ${name}`);
});

pm.registerPlugin('LoggerPlugin');
pm.on('log', () => {}); 

pm.registerPlugin('AlertPlugin');
pm.on('alert', () => {});

const logListener = () => {};
pm.on('log', logListener);
pm.removeListener('log', logListener); 
pm.removePlugin('LoggerPlugin');

console.log('\nДемонстрация утечки');
const leakEmitter = new EventEmitter();
console.log(`Слушателей до: ${leakEmitter.listenerCount('leak')}`);

for (let i = 0; i < 1000; i++) {
  leakEmitter.on('leak', () => {});
}
console.log(`Слушателей после добавления 1000: ${leakEmitter.listenerCount('leak')}`);

leakEmitter.removeAllListeners('leak');
console.log(`Слушателей после removeAllListeners: ${leakEmitter.listenerCount('leak')}`);

console.log('\nАсинхронные слушатели');
const asyncEmitter = new EventEmitter();

asyncEmitter.on('async-event', async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log(`${GROUP} async-слушатель завершён через 100ms`);
});

console.log(`${GROUP} emit вызван (не ждёт async-слушатель)`);
asyncEmitter.emit('async-event');