const fs = require('fs').promises;
const path = require('path');

const VARIANT = 18;
const ROOT = path.join(__dirname, `project_${VARIANT}`);

const FOLDER_DESCRIPTIONS = {
  'src': 'Исходный код проекта',
  'src/modules': 'Модули приложения',
  'src/components': 'UI-компоненты',
  'src/utils': 'Вспомогательные утилиты',
  'data': 'Данные проекта',
  'data/input': 'Входные данные',
  'data/output': 'Выходные данные',
  'data/temp': 'Временные файлы',
};

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function printTree(dir, prefix = '') {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    console.error('Не удалось прочитать директорию:', err.message);
    return;
  }

  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const isLast = i === entries.length - 1;
    const branch = isLast ? '└── ' : '├── ';

    console.log(prefix + branch + entry.name);

    if (entry.isDirectory()) {
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      await printTree(path.join(dir, entry.name), nextPrefix);
    }
  }
}

async function removeDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

async function main() {
  try {
    for (const folder of Object.keys(FOLDER_DESCRIPTIONS)) {
      await ensureDir(path.join(ROOT, folder));
    }

    const today = new Date().toISOString().slice(0, 10);

    for (const [folder, description] of Object.entries(FOLDER_DESCRIPTIONS)) {
      const folderPath = path.join(ROOT, folder);

      await fs.writeFile(
        path.join(folderPath, 'info.txt'),
        `Папка: ${folder}\nНазначение: ${description}\n`,
        'utf8'
      );

      await fs.writeFile(
        path.join(folderPath, 'README.md'),
        `# ${folder}\n\nСоздано: ${today}\n`,
        'utf8'
      );
    }

    console.log(`\nИсходная структура ${path.basename(ROOT)}:`);
    console.log(path.basename(ROOT));
    await printTree(ROOT);

    const tempInRoot = path.join(ROOT, 'temp');
    const tempInData = path.join(ROOT, 'data', 'temp');

    try {
      await fs.access(tempInRoot);
      await fs.rename(tempInRoot, tempInData);
      console.log('\n✓ Папка temp перемещена в data/');
    } catch {
    }

    const outputPath = path.join(ROOT, 'data', 'output');
    const resultsPath = path.join(ROOT, 'data', 'results');
    try {
      await fs.rename(outputPath, resultsPath);
      console.log('✓ Папка data/output переименована в data/results');
    } catch (err) {
      console.warn('Не удалось переименовать output → results:', err.message);
    }

    await removeDir(tempInData);
    console.log('✓ Папка data/temp удалена');

    console.log(`\nОбновлённая структура ${path.basename(ROOT)}:`);
    console.log(path.basename(ROOT));
    await printTree(ROOT);
  } catch (err) {
    console.error('Ошибка при работе с каталогами:', err.message);
    process.exitCode = 1;
  }
}

main();