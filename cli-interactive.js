#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');

program.name('my-cli');

program
  .command('init')
  .option('--name <name>', 'название проекта')
  .option('--type <type>', 'тип проекта')
  .option('--typescript', 'добавить TypeScript')
  .option('--prettier', 'добавить Prettier')
  .option('--git', 'инициализировать Git')
  .option('--no-interactive', 'отключить интерактивный режим')
  .action(async (options) => {
    const isInteractive = process.stdin.isTTY && options.interactive !== false;

    if (!isInteractive && (!options.name || !options.type)) {
      console.error('Ошибка: в неинтерактивном режиме необходимо указать --name и --type');
      process.exit(1);
    }

    let answers = { name: options.name, type: options.type, options: [], git: options.git };

    if (isInteractive && (!options.name || !options.type)) {
      answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Введите название проекта:',
          when: !options.name
        },
        {
          type: 'list',
          name: 'type',
          message: 'Выберите тип проекта:',
          choices: ['Web-приложение', 'CLI-утилита', 'Библиотека', 'Микросервис'],
          when: !options.type
        },
        {
          type: 'checkbox',
          name: 'options',
          message: 'Выберите дополнительные опции:',
          choices: ['TypeScript', 'ESLint', 'Prettier', 'Jest']
        },
        {
          type: 'confirm',
          name: 'git',
          message: 'Использовать Git?',
          default: true
        },
        {
          type: 'password',
          name: 'token',
          message: 'Введите токен доступа:',
          mask: '*'
        }
      ]);
    }

    console.log(`\nПроект "${answers.name || 'my-project'}" успешно инициализирован!`);
    console.log(`Тип: ${answers.type}`);
    if (answers.options && answers.options.length) {
      console.log(`Опции: ${answers.options.join(', ')}`);
    } else if (options.typescript && options.prettier) {
      console.log(`Опции: TypeScript, Prettier`);
    }
    console.log(`Git: ${answers.git ? 'да' : 'нет'}`);
  });

program.parse(process.argv);