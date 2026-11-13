const { readConfig } = require('../services/config');
const { build } = require('../services/builder');

module.exports = async () => {
  try {
    readConfig(); // вызовет ошибку, если файла нет
    console.log('Сборка проекта...');
    const res = await build();
    console.log(`✔ Сборка завершена за ${res.time}`);
    console.log(`Результат: ${res.output}`);
  } catch (err) {
    // Пробрасываем ошибку наверх в bin/index.js
    throw err; 
  }
};