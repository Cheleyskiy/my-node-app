const EventEmitter = require('events');

const myEmitter = new EventEmitter();

myEmitter.on('greet', (name) => {
  console.log(`[Событие] Привет, ${name}! Это группа 401.`);
});

console.log('Вызываем событие greet...');
myEmitter.emit('greet', 'Максим');