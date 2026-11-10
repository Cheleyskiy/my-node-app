const fs = require('fs');
const { Readable, Transform, Writable, pipeline } = require('stream');

const GROUP = '401';
const TOTAL_STUDENTS = 10000;
const ERROR_LOG = 'errors.log';
const CSV_FILE = 'students.csv';

fs.writeFileSync(ERROR_LOG, '');

const names = ['Иван', 'Мария', 'Петр', 'Анна', 'Сергей', 'Ольга'];
const lastNames = ['Иванов', 'Петрова', 'Сидоров', 'Смирнова', 'Кузнецов'];

let generatedCount = 0;
let validatedCount = 0;
let filteredCount = 0;
let writtenCount = 0;
let errorCount = 0;

const startTime = Date.now();

function logError(msg) {
  errorCount++;
  const time = new Date().toLocaleString('ru-RU', { hour12: false });
  fs.appendFileSync(ERROR_LOG, `[${time}] [${GROUP}] Ошибка: ${msg}\n`);
}

class StudentSource extends Readable {
  constructor() {
    super({ objectMode: true, highWaterMark: 100 });
  }

  _read() {
    if (generatedCount >= TOTAL_STUDENTS) {
      this.push(null);
      return;
    }

    const student = {
      id: generatedCount + 1,
      name: `${lastNames[Math.floor(Math.random() * lastNames.length)]} ${names[Math.floor(Math.random() * names.length)]}`,
      group: GROUP,
      course: Math.floor(Math.random() * 4) + 1,
      grade: Math.floor(Math.random() * 5) + 1
    };

    if (Math.random() < 0.05) student.name = '';
    if (Math.random() < 0.05) student.grade = 'bad';

    generatedCount++;
    this.push(student);
  }
}

class ValidateTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }
  _transform(student, encoding, callback) {
    if (!student.name) {
      logError(`id=${student.id}, отсутствует name`);
      return callback();
    }
    if (typeof student.grade !== 'number') {
      logError(`id=${student.id}, некорректный grade`);
      return callback();
    }
    validatedCount++;
    callback(null, student);
  }
}

class EnrichTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }
  _transform(student, encoding, callback) {
    student.averageGrade = (student.grade + 4 + 5) / 3;
    callback(null, student);
  }
}

class FilterTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }
  _transform(student, encoding, callback) {
    if (student.grade > 3) {
      filteredCount++;
      callback(null, student);
    } else {
      callback();
    }
  }
}

class FormatTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }
  _transform(student, encoding, callback) {
    const line = `${student.id},${student.name},${student.group},${student.course},${student.grade},${student.averageGrade.toFixed(1)}\n`;
    callback(null, line);
  }
}

class CsvWritable extends Writable {
  constructor(filepath) {
    super({ highWaterMark: 512 });
    this.stream = fs.createWriteStream(filepath);
    this.stream.write('id,name,group,course,grade,averageGrade\n');
    this.pauseTimeout = null;
  }

  _write(chunk, encoding, callback) {
    const canWrite = this.stream.write(chunk);
    writtenCount++;

    if (writtenCount % 1000 === 0) {
      const percent = Math.floor((writtenCount / 7512) * 100);
      const speed = Math.floor(writtenCount / ((Date.now() - startTime) / 1000)) || 0;
      process.stdout.write(`\r[PROGRESS] ${percent}% | ${writtenCount}/~7512 | ${speed} записей/сек`);
    }

    if (!canWrite) {
      console.log(`\n[BACKPRESSURE] Writable переполнен на ${writtenCount}-й записи`);
      this.stream.once('drain', () => {
        console.log(`[DRAIN] Продолжаем запись`);
        callback();
      });
    } else {
      callback();
    }
  }

  _final(callback) {
    this.stream.end(callback);
  }
}

async function runPipeline() {
  console.log(`=== Конвейер обработки данных (группа ${GROUP}) ===`);
  console.log(`Источник: ${TOTAL_STUDENTS} студентов`);
  console.log(`Фильтр: оценка > 3\n`);

  const source = new StudentSource();
  const validate = new ValidateTransform();
  const enrich = new EnrichTransform();
  const filter = new FilterTransform();
  const format = new FormatTransform();
  const writable = new CsvWritable(CSV_FILE);

  const timeout = setTimeout(() => {
    console.log('\n✖ Таймаут! Обработка отменена');
    source.destroy();
    validate.destroy();
    enrich.destroy();
    filter.destroy();
    format.destroy();
    writable.destroy();
    process.exit(1);
  }, 15000);

  pipeline(source, validate, enrich, filter, format, writable, (err) => {
    clearTimeout(timeout);
    if (err) {
      console.error('Ошибка конвейера:', err.message);
      return;
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const speed = Math.floor(writtenCount / elapsed);

    console.log('\n\n=== Результаты ===');
    console.log(`Всего сгенерировано: ${generatedCount}`);
    console.log(`Прошло валидацию:   ${validatedCount}`);
    console.log(`Обогащено:           ${validatedCount}`);
    console.log(`Отфильтровано:       ${filteredCount}`);
    console.log(`Записано в CSV:      ${writtenCount}`);
    console.log(`Ошибок:              ${errorCount}`);
    console.log(`Время выполнения:    ${elapsed} сек`);
    console.log(`Средняя скорость:    ${speed} записей/сек`);

    const size = (fs.statSync(CSV_FILE).size / (1024 * 1024)).toFixed(2);
    console.log(`\nФайл: ${CSV_FILE} (${size} МБ)`);
  });
}

runPipeline();