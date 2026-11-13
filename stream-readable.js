const { Readable } = require('stream');

const data = [
  'Группа: 401\n',
  'Студент: Челей Максим\n',
  'Лабораторная работа: №21\n',
  'Тема: Потоки в Node.js\n'
];

class MyReadable extends Readable {
  constructor() {
    super();
    this.index = 0;
  }

  _read(size) {
    if (this.index < data.length) {
      this.push(data[this.index]);
      this.index++;
    } else {
      this.push(null);
    }
  }
}

console.log('=== Демонстрация Readable-потока ===\n');
const stream = new MyReadable();
let chunkCount = 0;

stream.on('data', (chunk) => {
  chunkCount++;
  console.log(`[CHUNK ${chunkCount}] ${chunk.toString().trim()}`);
});

stream.on('end', () => {
  console.log(`\n[END] Поток завершен. Всего получено чанков: ${chunkCount}`);
});

stream.on('error', (err) => {
  console.error('Ошибка:', err.message);
});