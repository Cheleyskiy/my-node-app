const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor() {
    super({ highWaterMark: 16 });
    this.count = 0;
  }

  _write(chunk, encoding, callback) {
    this.count++;
    console.log(`\n[WRITE] ${chunk.toString().trim()}`);
    setTimeout(() => {
      callback();
    }, 100);
  }
}

const stream = new MyWritable();

stream.on('drain', () => {
  console.log('\n[DRAIN] Буфер освобожден, продолжаем запись');
});

stream.on('finish', () => {
  console.log(`\n[FINISH] Все данные записаны. Всего записано: ${stream.count} чанка`);
});

stream.on('error', (err) => {
  console.error('Ошибка:', err.message);
});

console.log('=== Демонстрация Writable-потока ===');

const messages = [
  'Группа: 401\n',
  'Студент: Челей Максим\n',
  'Лабораторная работа: №21\n',
  'Тема: Потоки в Node.js\n'
];

messages.forEach((msg) => {
  const canWrite = stream.write(msg);
  console.log(`write() вернул: ${canWrite}`);
  if (!canWrite) {
    console.log('(буфер переполнен!)');
  }
});

stream.end();