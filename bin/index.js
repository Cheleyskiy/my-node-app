#!/usr/bin/env node
const { program } = require('commander');
const pkg = require('../package.json');

// Обработка глобальных ошибок
process.on('uncaughtException', (err) => handleFatalError(err));
process.on('unhandledRejection', (err) => handleFatalError(err));

function handleFatalError(err) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Ошибка:', err.message);
    console.error(err.stack);
  } else {
    console.error('✖ Ошибка:', err.message || 'Неизвестная ошибка');
  }
  process.exit(1);
}

program.name('my-cli').version(pkg.version);

// Загружаем команды
program.command('init').description('инициализация проекта').action(() => require('../commands/init')());
program.command('build').description('сборка проекта').action(() => require('../commands/build')());
program.command('test').description('запуск тестов').action(() => require('../commands/test')());
program.command('deploy').description('развёртывание').option('-e, --env <env>', 'окружение', 'development').option('--force', 'без подтверждения').action((opts) => require('../commands/deploy')(opts));

program.parse(process.argv);