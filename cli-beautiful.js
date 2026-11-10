#!/usr/bin/env node

const chalk = require('chalk');
const ora = require('ora');
const cliProgress = require('cli-progress');
const fs = require('fs');

const isTTY = process.stdout.isTTY;

function logSuccess(msg) { console.error(isTTY ? chalk.green(`✔ ${msg}`) : msg); }
function logError(msg) { console.error(isTTY ? chalk.red(`✖ ${msg}`) : msg); }
function logWarn(msg) { console.error(isTTY ? chalk.yellow(`△ ${msg}`) : msg); }
function logInfo(msg) { console.error(isTTY ? chalk.blue(`ℹ ${msg}`) : msg); }

async function processFiles(files) {
  const spinner = isTTY ? ora('Обработка файлов...').start() : null;
  let processed = 0;

  const bar = isTTY ? new cliProgress.SingleBar({
    format: 'Прогресс |' + chalk.cyan('{bar}') + '| {percentage}% | {value}/{total}',
    hideCursor: true
  }, cliProgress.Presets.shades_classic) : null;

  if (bar) bar.start(files.length, 0);

  for (const file of files) {
    await new Promise(r => setTimeout(r, 300)); // имитация работы
    if (fs.existsSync(file)) {
      if (spinner) spinner.stop();
      logSuccess(`Файл ${file} обработан`);
      if (spinner) spinner.start();
      processed++;
    } else {
      if (spinner) spinner.stop();
      logError(`Файл ${file} не найден`);
      if (spinner) spinner.start();
    }
    if (bar) bar.update(files.indexOf(file) + 1);
  }

  if (bar) bar.stop();
  if (spinner) spinner.succeed('Обработка завершена');
  
  if (processed < files.length) {
    logWarn(`Пропущено ${files.length - processed} файл(ов)`);
    process.exitCode = 1;
  }

  // Вывод результата в stdout (для перенаправления > result.json)
  if (processed > 0) {
    console.log(JSON.stringify({ processed, total: files.length, status: 'done' }));
  }
}

const args = process.argv.slice(2);
if (args[0] === 'process') {
  // Ищем флаг --files и собираем всё после него
  const filesIndex = args.indexOf('--files');
  const files = filesIndex !== -1 ? args.slice(filesIndex + 1) : [];
  if (files.length === 0) {
    logError('Укажите файлы: --files a.txt b.txt');
    process.exit(1);
  }
  processFiles(files);
} else {
  logInfo('Используйте: node cli-beautiful.js process --files a.txt b.txt');
}