const fs = require('fs').promises;
const path = require('path');

const VARIANT = 18;
const REPORT_FILE = path.join(__dirname, `report_${VARIANT}.json`);

async function scanDirectory(dir) {
  const files = [];
  let folders = 0;

  async function walk(currentDir) {
    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch (err) {
      console.warn(`Пропущена папка ${currentDir}: ${err.message}`);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        folders++;
        await walk(fullPath);
      } else if (entry.isFile()) {
        try {
          const stat = await fs.stat(fullPath);
          files.push({
            name: entry.name,
            path: path.relative(process.cwd(), fullPath),
            ext: path.extname(entry.name).toLowerCase() || '(без расширения)',
            size: stat.size,
          });
        } catch (err) {
          console.warn(`Пропущен файл ${fullPath}: ${err.message}`);
        }
      }
    }
  }

  await walk(dir);
  return { files, folders };
}

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
}

async function main() {
  try {
    const targetDir = process.argv[2]
      ? path.resolve(process.argv[2])
      : process.cwd();

    console.log(`Анализ директории: ${path.relative(process.cwd(), targetDir) || '.'}`);

    const { files, folders } = await scanDirectory(targetDir);

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    const byExt = {};
    for (const f of files) {
      if (!byExt[f.ext]) byExt[f.ext] = { count: 0, size: 0 };
      byExt[f.ext].count++;
      byExt[f.ext].size += f.size;
    }

    const sortedBySize = [...files].sort((a, b) => b.size - a.size);
    const top5Big = sortedBySize.slice(0, 5);
    const top5Small = sortedBySize.slice(-5).reverse();

    const variantFiles = files.filter((f) => f.name.includes(String(VARIANT)));

    console.log('');
    console.log(`Общее количество папок: ${folders}`);
    console.log(`Общее количество файлов: ${files.length}`);
    console.log(`Общий размер: ${humanSize(totalSize)} (${totalSize.toLocaleString('ru-RU')} байт)`);
    console.log('');

    console.log('Расширения файлов:');
    const extSorted = Object.entries(byExt).sort((a, b) => b[1].size - a[1].size);
    for (const [ext, info] of extSorted) {
      console.log(`  ${ext}: ${info.count} файлов (${humanSize(info.size)})`);
    }
    console.log('');

    console.log('Топ-5 самых больших файлов:');
    top5Big.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name} (${humanSize(f.size)}) - ./${f.path}`);
    });
    console.log('');

    console.log('Топ-5 самых маленьких файлов:');
    top5Small.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name} (${humanSize(f.size)}) - ./${f.path}`);
    });
    console.log('');

    console.log(`Файлы, содержащие "${VARIANT}" в названии: ${variantFiles.length}`);
    variantFiles.forEach((f) => {
      console.log(`  - ${f.name} (./${f.path})`);
    });
    console.log('');

    const report = {
      scannedAt: new Date().toISOString(),
      targetDirectory: targetDir,
      variant: VARIANT,
      totals: {
        folders,
        files: files.length,
        sizeBytes: totalSize,
        sizeHuman: humanSize(totalSize),
      },
      byExtension: byExt,
      top5Biggest: top5Big.map((f) => ({ name: f.name, path: f.path, size: f.size })),
      top5Smallest: top5Small.map((f) => ({ name: f.name, path: f.path, size: f.size })),
      variantNamedFiles: variantFiles.map((f) => ({ name: f.name, path: f.path })),
    };

    await fs.writeFile(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');
    console.log(`Отчет сохранен: ${path.basename(REPORT_FILE)}`);
  } catch (err) {
    console.error('Ошибка при сканировании:', err.message);
    process.exitCode = 1;
  }
}

main();