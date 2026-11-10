const inquirer = require('inquirer');

module.exports = async (options) => {
  if (!options.force && options.env === 'production') {
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'Вы собираетесь развернуть проект в production! Продолжить?',
      default: false
    }]);
    if (!confirm) {
      console.log('Развёртывание отменено.');
      return;
    }
  }
  console.log('Развёртывание...');
  await new Promise(r => setTimeout(r, 800));
  console.log('✔ Развёрнуто успешно');
  console.log('URL: https://my-app.example.com');
};