const fs = require('fs');
const { Transform, pipeline } = require('stream');

if (!fs.existsSync('input.txt')) {
  fs.writeFileSync('input.txt', 'Hello streams! This is group 401.');
}

console.log('=== Демонстрация pipe() ===');
const rs1 = fs.createReadStream('input.txt');
const ws1 = fs.createWriteStream('output-pipe.txt');
rs1.pipe(ws1);
ws1.on('finish', () => {
  const size = fs.statSync('output-pipe.txt').size;
  console.log(`Чтение: input.txt\nЗапись: output-pipe.txt\n✔ Копирование завершено\nРазмер: ${size} байт\n`);
});

console.log('=== Демонстрация pipe() с ошибкой ===');
const rs2 = fs.createReadStream('missing.txt');
const ws2 = fs.createWriteStream('output-pipe-err.txt');
rs2.pipe(ws2);
rs2.on('error', (err) => {
  console.log(`✖ Ошибка: ${err.message}`);
  console.log('△ Внимание: pipe() не закрыл целевой поток!');
  console.log('△ Возможна утечка памяти.\n');
});

console.log('=== Демонстрация pipeline() ===');
pipeline(
  fs.createReadStream('input.txt'),
  fs.createWriteStream('output-pipeline.txt'),
  (err) => {
    if (err) console.error(err);
    else console.log('✔ Копирование через pipeline завершено\n');
  }
);

console.log('=== Демонстрация pipeline() с ошибкой ===');
pipeline(
  fs.createReadStream('missing.txt'),
  fs.createWriteStream('output-pipeline-err.txt'),
  (err) => {
    if (err) {
      console.log(`✖ Ошибка: ${err.message}`);
      console.log('✔ Все потоки автоматически закрыты');
      console.log('✔ Утечек нет\n');
    }
  }
);

class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());
  }
}

class ReverseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    const reversed = chunk.toString().split('').reverse().join('');
    callback(null, reversed);
  }
}

console.log('=== Цепочка потоков ===');
pipeline(
  fs.createReadStream('input.txt'),
  new UpperCaseTransform(),
  new ReverseTransform(),
  fs.createWriteStream('output-chain.txt'),
  (err) => {
    if (err) console.error(err);
    else console.log('✔ Обработка завершена\n');
  }
);