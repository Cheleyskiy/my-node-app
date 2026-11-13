const EventEmitter = require('events');
const myEmitter = new EventEmitter();

let onCount = 0;
let onceCount = 0;

myEmitter.on('tick', () => {
  onCount++;
  console.log(`[tick #${onCount}] on-слушатель`);
});

myEmitter.once('tick', () => {
  onceCount++;
  console.log(`[tick] once-слушатель сработал`);
});

console.log('\nСравнение on и once:');
myEmitter.emit('tick');
myEmitter.emit('tick');
myEmitter.emit('tick');

console.log(`\non-слушатель вызван: ${onCount} раза`);
console.log(`once-слушатель вызван: ${onceCount} раз`);

console.log('\nУправление подписками:');
const listener1 = () => {};
const listener2 = () => {};
const listener3 = () => {};

myEmitter.on('test', listener1);
myEmitter.on('test', listener2);
myEmitter.on('test', listener3);

console.log(`Слушателей до удаления: ${myEmitter.listenerCount('test')}`);
console.log(`Массив слушателей: [${myEmitter.listeners('test').length} функций]`);

myEmitter.removeListener('test', listener2);
console.log(`После удаления одного: ${myEmitter.listenerCount('test')}`);

myEmitter.removeAllListeners('test');
console.log(`После removeAllListeners: ${myEmitter.listenerCount('test')}`);

console.log('\nПорядок вызова:');
myEmitter.on('order', () => console.log('1. Первый слушатель (группа 401)'));
myEmitter.on('order', () => console.log('2. Второй слушатель'));
myEmitter.on('order', () => console.log('3. Третий слушатель'));
myEmitter.emit('order');