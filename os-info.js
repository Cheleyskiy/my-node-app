const os = require('os');

const GROUP = '401';

// Форматирование времени работы
const uptimeSec = os.uptime();
const hours = Math.floor(uptimeSec / 3600);
const minutes = Math.floor((uptimeSec % 3600) / 60);
const seconds = Math.floor(uptimeSec % 60);

// Определение платформы
const platform = os.platform();
let platformMessage = 'Неизвестная платформа';
if (platform === 'win32') platformMessage = 'Вы работаете в Windows';
else if (platform === 'linux') platformMessage = 'Вы работаете в Linux';
else if (platform === 'darwin') platformMessage = 'Вы работаете в macOS';

console.log(`=== Информация о системе (группа ${GROUP}) ===`);
console.log(`Платформа: ${platform}`);
console.log(`Тип ОС: ${os.type()}`);
console.log(`Архитектура: ${os.arch()}`);
console.log(`Версия ОС: ${os.release()}`);
console.log(`Имя хоста: ${os.hostname()}`);
console.log(`Время работы: ${hours} ч ${minutes} мин ${seconds} сек`);
console.log(`\n${platformMessage}`);