#!/usr/bin/env node

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help') {
  console.log(`
Использование: my-cli <команда> [аргументы]

Доступные команды:
  greet <имя>  - поприветствовать пользователя
  info         - вывести информацию о группе
  `);
  process.exit(0);
}

const command = args[0];

if (command === 'greet') {
  const name = args[1];
  if (!name) {
    console.error('Ошибка: укажите имя. Пример: my-cli greet "Иван"');
    process.exit(1);
  }
  console.log(`Привет, ${name}! Добро пожаловать в CLI-приложение группы 401.`);
  process.exit(0);
} else if (command === 'info') {
  const date = new Date().toISOString().split('T')[0];
  console.log(`Группа: 401`);
  console.log(`Студент: Челей Максим Александрович`);
  console.log(`Лабораторная работа: №17`);
  console.log(`Дата: ${date}`);
  process.exit(0);
} else {
  console.error(`Ошибка: неизвестная команда "${command}"`);
  console.error('Для справки используйте: my-cli --help');
  process.exit(1);
}