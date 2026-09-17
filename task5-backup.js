const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

const { ZipArchive } = require('archiver');

const VARIANT = 18;
const SRC_DIR = path.join(__dirname, `source_${VARIANT}`);
const BAK_DIR = path.join(__dirname, `backup_${VARIANT}`);
const REPORT_FILE = path.join(__dirname, `sync_report_${VARIANT}.txt`);
const ZIP_FILE = path.join(__dirname, `backup_${VARIANT}.zip`);

const STREAM_EXTS = new Set(['.txt', '.js', '.json']);
const REGULAR_EXTS = new Set(['.jpg', '.png', '.gif']);
const CHUNK_THRESHOLD = 1024 * 1024;
const CHUNK_SIZE = 512 * 1024;

async function createSourceStructure() {
  try {
    await fsp.access(SRC_DIR);
    console.log(`Папка ${path.basename(SRC_DIR)} уже существует — пропускаем генерацию.`);
    return;
  } catch {}

  console.log(`Создание тестовой структуры ${path.basename(SRC_DIR)}...`);
  await fsp.mkdir(SRC_DIR, { recursive: true });

  const extensions = [
    '.txt', '.txt', '.txt', '.txt',
    '.js',  '.js',  '.js',  '.js',
    '.json','.json','.json','.json',
    '.jpg', '.jpg', '.jpg', '.jpg',
    '.png', '.png', '.gif', '.gif',
  ];

  const manifestFiles = [];

  for (let i = 1; i <= 20; i++) {
    const ext = extensions[i - 1];
    const fileName = `file_${String(i).padStart(2, '0')}${ext}`;
    const fullPath = path.join(SRC_DIR, fileName);
    const size = i % 5 === 0 ? 1_500_000 : 100 + i * 5000;

    await writeDummyFile(fullPath, ext, size);

    const stat = await fsp.stat(fullPath);
    manifestFiles.push({ name: fileName, path: fileName, ext, size: stat.size });
  }

  const subfolders = ['docs', 'assets', 'scripts'];
  for (const sub of subfolders) {
    const subPath = path.join(SRC_DIR, sub);
    await fsp.mkdir(subPath, { recursive: true });

    for (let i = 1; i <= 2; i++) {
      const ext = sub === 'scripts' ? '.js' : sub === 'assets' ? '.png' : '.txt';
      const fileName = `${sub}_file_${i}${ext}`;
      const fullPath = path.join(subPath, fileName);
      const size = 500 + i * 10000;

      await writeDummyFile(fullPath, ext, size);

      const stat = await fsp.stat(fullPath);
      manifestFiles.push({ name: fileName, path: `${sub}/${fileName}`, ext, size: stat.size });
    }
  }

  const manifest = {
    variant: VARIANT,
    createdAt: new Date().toISOString(),
    totalFiles: manifestFiles.length,
    files: manifestFiles,
  };

  await fsp.writeFile(
    path.join(SRC_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );

  console.log(`✓ Создано файлов: ${manifestFiles.length + 1} (включая manifest.json)`);
  console.log(`✓ Подпапок: ${subfolders.length}`);
}

async function writeDummyFile(filePath, ext, size) {
  if (STREAM_EXTS.has(ext)) {
    const stream = fs.createWriteStream(filePath, { encoding: 'utf8' });
    let written = 0;
    while (written < size) {
      const line = `Строка данных варианта ${VARIANT} — ${new Date().toISOString()}\n`;
      stream.write(line);
      written += Buffer.byteLength(line, 'utf8');
    }
    await new Promise((resolve, reject) => {
      stream.end((err) => (err ? reject(err) : resolve()));
    });
  } else {
    const buf = Buffer.alloc(size);
    for (let i = 0; i < size; i++) buf[i] = Math.floor(Math.random() * 256);
    await fsp.writeFile(filePath, buf);
  }
}

async function listFilesRecursive(dir, base = dir) {
  const result = [];
  const entries = await fsp.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await listFilesRecursive(fullPath, base)));
    } else if (entry.isFile()) {
      const stat = await fsp.stat(fullPath);
      result.push({
        fullPath,
        relativePath: path.relative(base, fullPath),
        ext: path.extname(entry.name).toLowerCase(),
        size: stat.size,
      });
    }
  }

  return result;
}

async function copyViaStream(src, dest) {
  await fsp.mkdir(path.dirname(dest), { recursive: true });

  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(src, { highWaterMark: CHUNK_SIZE });
    const writeStream = fs.createWriteStream(dest);

    readStream.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on('finish', resolve);
    readStream.pipe(writeStream);
  });
}

async function copyInChunks(src, dest) {
  await fsp.mkdir(path.dirname(dest), { recursive: true });

  const srcHandle = await fsp.open(src, 'r');
  const destHandle = await fsp.open(dest, 'w');

  try {
    const stat = await srcHandle.stat();
    let position = 0;

    while (position < stat.size) {
      const buffer = Buffer.alloc(Math.min(CHUNK_SIZE, stat.size - position));
      const { bytesRead } = await srcHandle.read(buffer, 0, buffer.length, position);
      if (bytesRead === 0) break;

      await destHandle.write(buffer, 0, bytesRead, position);
      position += bytesRead;
    }
  } finally {
    await srcHandle.close();
    await destHandle.close();
  }
}

async function copyWithFiltering() {
  console.log(`\nИсходная директория: ${path.basename(SRC_DIR)}`);
  console.log(`Директория назначения: ${path.basename(BAK_DIR)}`);

  await fsp.rm(BAK_DIR, { recursive: true, force: true });
  await fsp.mkdir(BAK_DIR, { recursive: true });

  const files = await listFilesRecursive(SRC_DIR);

  const stats = {};
  for (const f of files) {
    if (!stats[f.ext]) stats[f.ext] = { count: 0, size: 0, mode: '' };
    stats[f.ext].count++;
    stats[f.ext].size += f.size;
    stats[f.ext].mode = STREAM_EXTS.has(f.ext)
      ? 'потоковое копирование'
      : 'обычное копирование';
  }

  console.log(`\nОбнаружено файлов: ${files.length}`);
  for (const [ext, info] of Object.entries(stats)) {
    console.log(
      `  ${ext}: ${info.count} файлов (${(info.size / 1024).toFixed(1)} КБ) — ${info.mode}`
    );
  }

  console.log('\nПрогресс копирования:');
  let streamCount = 0;
  let regularCount = 0;
  let chunkCount = 0;
  const totalSize = files.reduce((s, f) => s + f.size, 0);

  const startTime = Date.now();
  let copied = 0;

  for (const f of files) {
    const dest = path.join(BAK_DIR, f.relativePath);

    if (STREAM_EXTS.has(f.ext)) {
      if (f.size > CHUNK_THRESHOLD) {
        await copyInChunks(f.fullPath, dest);
        chunkCount++;
      } else {
        await copyViaStream(f.fullPath, dest);
        streamCount++;
      }
    } else if (REGULAR_EXTS.has(f.ext)) {
      await fsp.mkdir(path.dirname(dest), { recursive: true });
      await fsp.copyFile(f.fullPath, dest);
      regularCount++;
    } else {
      await fsp.mkdir(path.dirname(dest), { recursive: true });
      await fsp.copyFile(f.fullPath, dest);
      regularCount++;
    }

    copied++;
    const percent = Math.floor((copied / files.length) * 100);
    if (percent % 20 === 0 || copied === files.length) {
      console.log(`  ${copied}/${files.length} файлов (${percent}%)`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\nКопирование завершено!');
  console.log('Статистика:');
  console.log(`  - Скопировано файлов: ${copied}`);
  console.log(`  - Потоковое копирование: ${streamCount}`);
  console.log(`  - Чанками (по 512 КБ): ${chunkCount}`);
  console.log(`  - Обычное копирование: ${regularCount}`);
  console.log(`  - Общий размер: ${(totalSize / 1024 / 1024).toFixed(2)} МБ`);
  console.log(`  - Время выполнения: ${elapsed} сек`);

  return { streamCount, regularCount, chunkCount, totalSize, elapsed };
}

async function compareDirectories() {
  const srcFiles = await listFilesRecursive(SRC_DIR);
  const bakFiles = await listFilesRecursive(BAK_DIR);

  const srcMap = new Map(srcFiles.map((f) => [f.relativePath, f]));
  const bakMap = new Map(bakFiles.map((f) => [f.relativePath, f]));

  const onlyInSource = [];
  const onlyInBackup = [];
  const different = [];
  const same = [];

  for (const [rel, srcFile] of srcMap) {
    const bakFile = bakMap.get(rel);
    if (!bakFile) {
      onlyInSource.push(srcFile);
    } else if (srcFile.size !== bakFile.size) {
      different.push({ src: srcFile, bak: bakFile });
    } else {
      same.push(srcFile);
    }
  }

  for (const [rel, bakFile] of bakMap) {
    if (!srcMap.has(rel)) {
      onlyInBackup.push(bakFile);
    }
  }

  return { same, different, onlyInSource, onlyInBackup };
}

async function writeSyncReport(comparison) {
  const { same, different, onlyInSource, onlyInBackup } = comparison;

  const lines = [
    `Отчет синхронизации ${path.basename(SRC_DIR)} ↔ ${path.basename(BAK_DIR)}`,
    `Вариант: ${VARIANT}`,
    `Дата: ${new Date().toISOString()}`,
    '',
    `Совпадают: ${same.length} файлов`,
    `Изменены (размер): ${different.length} файлов`,
    `Добавлены (только в backup): ${onlyInBackup.length} файлов`,
    `Удалены (только в source): ${onlyInSource.length} файлов`,
    '',
  ];

  if (different.length) {
    lines.push('Изменённые файлы:');
    for (const { src, bak } of different) {
      lines.push(`  - ${src.relativePath}: source=${src.size} Б, backup=${bak.size} Б`);
    }
    lines.push('');
  }

  if (onlyInBackup.length) {
    lines.push('Добавленные файлы (есть в backup, нет в source):');
    for (const f of onlyInBackup) lines.push(`  - ${f.relativePath}`);
    lines.push('');
  }

  if (onlyInSource.length) {
    lines.push('Удалённые файлы (есть в source, нет в backup):');
    for (const f of onlyInSource) lines.push(`  - ${f.relativePath}`);
    lines.push('');
  }

  await fsp.writeFile(REPORT_FILE, lines.join('\n'), 'utf8');
}

async function createZipArchive() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(ZIP_FILE);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`\n✓ ZIP-архив создан: ${path.basename(ZIP_FILE)} (${archive.pointer()} байт)`);
      resolve();
    });

    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(BAK_DIR, path.basename(BAK_DIR));
    archive.finalize();
  });
}

async function main() {
  try {
    await createSourceStructure();
    await copyWithFiltering();

    console.log('\nСравнение директорий:');
    const comparison = await compareDirectories();
    console.log(`  - Совпадают: ${comparison.same.length} файлов`);
    console.log(`  - Изменены (size, modified): ${comparison.different.length} файлов`);
    console.log(`  - Добавлены: ${comparison.onlyInBackup.length} файлов`);
    console.log(`  - Удалены: ${comparison.onlyInSource.length} файлов`);

    await writeSyncReport(comparison);
    console.log(`\nОтчет сохранен: ${path.basename(REPORT_FILE)}`);

    await createZipArchive();
  } catch (err) {
    console.error('Ошибка при копировании/синхронизации:', err.message);
    process.exitCode = 1;
  }
}

main();