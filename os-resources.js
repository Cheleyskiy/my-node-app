const os = require('os');

const GROUP = '401';

function formatBytes(bytes) {
  return (bytes / (1024 ** 3)).toFixed(2) + ' ГБ';
}

// Память
const totalMem = os.totalmem();
const freeMem = os.freemem();
const usedMem = totalMem - freeMem;
const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);

console.log(`=== Ресурсы системы (группа ${GROUP}) ===`);
console.log(`Всего памяти: ${formatBytes(totalMem)}`);
console.log(`Использовано:  ${formatBytes(usedMem)}`);
console.log(`Свободно:      ${formatBytes(freeMem)} (${memUsagePercent}%)`);

if (parseFloat(memUsagePercent) > 90) {
  console.warn('⚠️ Внимание: критически мало свободной памяти!');
} else if (parseFloat(memUsagePercent) > 75) {
  console.warn('⚠️ Предупреждение: высокое потребление памяти.');
} else {
  console.log('Память в норме');
}

// Средняя загрузка (только для Linux/macOS)
const loadAvg = os.loadavg();
console.log(`\nСредняя загрузка (1м, 5м, 15м): ${loadAvg.map(n => n.toFixed(2)).join(', ')}`);
if (os.platform() === 'win32') {
  console.log('(Примечание: в Windows модуль os.loadavg() всегда возвращает нули)');
}