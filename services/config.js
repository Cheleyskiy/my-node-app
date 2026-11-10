const fs = require('fs');
const path = require('path');

exports.readConfig = () => {
  const configPath = path.join(process.cwd(), 'config.json');
  if (!fs.existsSync(configPath)) {
    const err = new Error('файл конфигурации не найден. Укажите путь через --config');
    err.details = 'config.json отсутствует в корне проекта';
    throw err;
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
};