const os = require('os');
const fs = require('fs');
const path = require('path');

const GROUP = '401';
const LOG_FILE = path.join(__dirname, 'monitor.log');

let warningsCount = 0;

// Функция логирования аномалий
function logWarning(message) {
  warningsCount++;
  const time = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const logLine = `[${time}] [${GROUP}] Предупреждение: ${message}\n`;
  fs.appendFileSync(LOG_FILE, logLine, 'utf8');
}

// Первичный сбор данных
function getSnapshot() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memUsagePercent = ((totalMem - freeMem) / totalMem) * 100;

  return {
    timestamp: new Date().toISOString(),
    group: GROUP,
    platform: os.platform(),
    cpus: os.cpus(),
    totalMem,
    freeMem,
    memUsagePercent
  };
}

// Расчет загрузки CPU за интервал
let previousCpus = os.cpus();
function calculateCpuUsage() {
  const currentCpus = os.cpus();
  let idleDiff = 0;
  let totalDiff = 0;

  for (let i = 0; i < currentCpus.length; i++) {
    const prev = previousCpus[i].times;
    const curr = currentCpus[i].times;

    const prevTotal = prev.user + prev.nice + prev.sys + prev.idle + prev.irq;
    const currTotal = curr.user + curr.nice + curr.sys + curr.idle + curr.irq;

    idleDiff += curr.idle - prev.idle;
    totalDiff += currTotal - prevTotal;
  }

  previousCpus = currentCpus;
  if (totalDiff === 0) return 0;
  return ((totalDiff - idleDiff) / totalDiff) * 100;
}

function formatGB(bytes) {
  return (bytes / (1024 ** 3)).toFixed(2) + ' ГБ';
}

// Старт мониторинга
console.log(`Мониторинг (группа ${GROUP}). Ctrl+C для выхода.\n`);

// Первый замер, чтобы инициализировать previousCpus
calculateCpuUsage();

const interval = setInterval(() => {
  const cpuUsage = calculateCpuUsage();
  const snapshot = getSnapshot();
  
  // Форматируем строку статуса
  const cpuStr = cpuUsage.toFixed(1).padStart(4);
  const ramStr = snapshot.memUsagePercent.toFixed(1).padStart(4);
  
  // Логика предупреждений
  let statusMsg = 'Норма';
  if (cpuUsage > 80) {
    statusMsg = 'КРИТИЧНО (CPU > 80%)';
    logWarning(`Высокая загрузка CPU: ${cpuStr}%`);
  } else if (cpuUsage > 50) {
    statusMsg = 'ПРЕДУПРЕЖДЕНИЕ (CPU > 50%)';
    logWarning(`Повышенная загрузка CPU: ${cpuStr}%`);
  }

  if (snapshot.memUsagePercent > 90) {
    statusMsg += ' | МАЛО ПАМЯТИ';
    logWarning(`Мало свободной памяти: ${(100 - snapshot.memUsagePercent).toFixed(1)}% свободно`);
  }

  // Перерисовка строки через \r
  const line = `CPU: ${cpuStr}% | RAM: ${ramStr}% (${formatGB(snapshot.freeMem)} свободно) | ${statusMsg}`;
  process.stdout.write(`\r${line.padEnd(80)}`);
}, 2000);

// Корректное завершение по Ctrl+C
process.on('SIGINT', () => {
  clearInterval(interval);
  process.stdout.write('\n\n');
  console.log(`Мониторинг остановлен. Предупреждений: ${warningsCount}`);
  if (fs.existsSync(LOG_FILE)) {
    console.log(`Логи сохранены в: ${path.basename(LOG_FILE)}`);
  }
  process.exit(0);
});