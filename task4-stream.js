const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const readline = require('readline');

const VARIANT = 18;
const DATA_FILE = path.join(__dirname, `data_${VARIANT}.txt`);
const RESULT_FILE = path.join(__dirname, `processed_${VARIANT}.txt`);
const LINES_COUNT = 100000;    
const BUFFER_SIZE = 64 * 1024; 


async function generateFileIfNeeded() {
  try {
    await fsp.access(DATA_FILE);
    console.log(`Файл уже существует: ${path.basename(DATA_FILE)}`);
    return;
  } catch {
  }

  console.log(`Генерация файла ${path.basename(DATA_FILE)} (${LINES_COUNT} строк)...`);

  const stream = fs.createWriteStream(DATA_FILE, {
    encoding: 'utf8',
    highWaterMark: BUFFER_SIZE,
  });

  for (let i = 1; i <= LINES_COUNT; i++) {
    const randomNumber = Math.floor(1 + Math.random() * 1000);
    const line = `${i}, ${randomNumber}, Вариант ${VARIANT}\n`;

    if (!stream.write(line)) {
      await new Promise((resolve) => stream.once('drain', resolve));
    }
  }

  await new Promise((resolve, reject) => {
    stream.end((err) => (err ? reject(err) : resolve()));
  });

  const stat = await fsp.stat(DATA_FILE);
  console.log(`Файл создан: ${path.basename(DATA_FILE)} (${(stat.size / 1024 / 1024).toFixed(2)} МБ)`);
}

async function processFile() {
  const stat = await fsp.stat(DATA_FILE);
  const fileSize = stat.size;

  console.log(`\nОбработка файла: ${path.basename(DATA_FILE)}`);
  console.log(`Размер файла: ${(fileSize / 1024 / 1024).toFixed(2)} МБ`);

  const input = fs.createReadStream(DATA_FILE, {
    encoding: 'utf8',
    highWaterMark: BUFFER_SIZE,
  });

  const rl = readline.createInterface({ input, crlfDelay: Infinity });

  let sum = 0;
  let count = 0;
  let min = Infinity;
  let max = -Infinity;
  const allNumbers = [];

  let nextProgressMark = 10;

  const startTime = Date.now();

  for await (const line of rl) {
    const parts = line.split(',');
    if (parts.length < 2) continue;

    const num = Number(parts[1].trim());
    if (Number.isNaN(num)) continue;

    sum += num;
    count++;
    if (num < min) min = num;
    if (num > max) max = num;
    allNumbers.push(num);

    const percent = Math.floor((count / LINES_COUNT) * 100);
    if (percent >= nextProgressMark && percent % 10 === 0) {
      console.log(
        `Прогресс: ${percent}% (${count.toLocaleString('ru-RU')} строк обработано)`
      );
      nextProgressMark += 10;
    }
  }

  allNumbers.sort((a, b) => a - b);
  const mid = Math.floor(allNumbers.length / 2);
  const median =
    allNumbers.length % 2 === 0
      ? (allNumbers[mid - 1] + allNumbers[mid]) / 2
      : allNumbers[mid];

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  const results = {
    totalLines: count,
    sum,
    average: Number((sum / count).toFixed(2)),
    max,
    min,
    median: Number(median.toFixed(2)),
    elapsedSeconds: Number(elapsed),
  };

  const reportLines = [
    `Результаты обработки файла ${path.basename(DATA_FILE)}`,
    `Вариант: ${VARIANT}`,
    `Дата: ${new Date().toISOString()}`,
    '',
    `Всего строк: ${results.totalLines.toLocaleString('ru-RU')}`,
    `Сумма чисел: ${results.sum.toLocaleString('ru-RU')}`,
    `Среднее значение: ${results.average}`,
    `Максимальное число: ${results.max}`,
    `Минимальное число: ${results.min}`,
    `Медиана: ${results.median}`,
    `Время выполнения: ${results.elapsedSeconds} сек`,
  ];

  await fsp.writeFile(RESULT_FILE, reportLines.join('\n') + '\n', 'utf8');

  console.log('\nОбработка завершена!');
  console.log('Результаты:');
  console.log(`  - Всего строк: ${results.totalLines.toLocaleString('ru-RU')}`);
  console.log(`  - Сумма чисел: ${results.sum.toLocaleString('ru-RU')}`);
  console.log(`  - Среднее значение: ${results.average}`);
  console.log(`  - Максимальное число: ${results.max}`);
  console.log(`  - Минимальное число: ${results.min}`);
  console.log(`  - Медиана: ${results.median}`);
  console.log(`\nРезультаты сохранены в: ${path.basename(RESULT_FILE)}`);
  console.log(`Время выполнения: ${results.elapsedSeconds} сек`);

  return results;
}

async function main() {
  try {
    await generateFileIfNeeded();
    await processFile();
  } catch (err) {
    console.error('Ошибка при потоковой обработке:', err.message);
    process.exitCode = 1;
  }
}

main();