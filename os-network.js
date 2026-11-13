const os = require('os');

const GROUP = '401';

// Маскировка MAC-адреса
function maskMac(mac) {
  if (!mac || mac === '00:00:00:00:00:00') return mac;
  const parts = mac.split(':');
  if (parts.length === 6) {
    return `${parts[0]}:${parts[1]}:${parts[2]}:****:****`;
  }
  return mac;
}

console.log(`=== Сетевые интерфейсы (группа ${GROUP}) ===`);
const interfaces = os.networkInterfaces();
let mainInterface = null;

for (const [name, addrs] of Object.entries(interfaces)) {
  for (const addr of addrs) {
    if (addr.family === 'IPv4') {
      // Ищем первый не внутренний IPv4
      if (!addr.internal && !mainInterface) {
        mainInterface = { name, ip: addr.address };
      }
      console.log(`\nИнтерфейс: ${name}`);
      console.log(`IPv4: ${addr.address}`);
      console.log(`MAC:  ${maskMac(addr.mac)}`);
      console.log(`Внутренний: ${addr.internal ? 'да' : 'нет'}`);
    }
  }
}

if (mainInterface) {
  console.log(`\nОсновной интерфейс: ${mainInterface.name} (${mainInterface.ip})`);
} else {
  console.log('\nВнешний IPv4 интерфейс не найден.');
}

// Информация о пользователе
console.log(`\n=== Информация о пользователе ===`);
const userInfo = os.userInfo();
console.log(`Имя пользователя: ${userInfo.username}`);
console.log(`UID: ${userInfo.uid}`);
console.log(`GID: ${userInfo.gid}`);
console.log(`Домашняя директория: ${userInfo.homedir}`);
console.log(`Оболочка: ${userInfo.shell || 'Не определена (Windows)'}`);

// Проверка на root (актуально для Linux/macOS)
const isRoot = process.getuid && process.getuid() === 0;
console.log(`\nПроверка root: ${isRoot ? 'ДА (Вы root!)' : 'нет'}`);