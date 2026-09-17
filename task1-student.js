//Челей Максим 401
const fs = require('fs').promises;
const path = require('path');

const VARIANT = 18;

const FILE_NAME = path.join(__dirname, `student_${VARIANT}.txt`);

function buildContent() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const formattedDate =
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  return [
    'Студент: Челей Максим Александрович',
    'Группа: 401',
    `Вариант: ${VARIANT}`,
    `Дата: ${formattedDate}`,
    '',
    'Любимые книги/фильмы:',
    '1. "Кладбище домашних животных" - С. Кинг',
    '2. "Бойцовский клуб" - Ч. Паланик',
    '3. "1984" - Дж. Оруэлл',
    '4. "Герой нашего времени" - М. Лермонтов',
    '5. "Невероятные приключения ДжоДжо" - Х. Араки',
  ];
}

async function main() {
  try {
    const lines = buildContent();
    const initialText = lines.join('\n') + '\n';
    await fs.writeFile(FILE_NAME, initialText, 'utf8');
    console.log(`Создан файл: ${path.basename(FILE_NAME)}`);

    const current = await fs.readFile(FILE_NAME, 'utf8');
    const lineCount = current.split('\n').filter((l) => l.length > 0).length;

    const summaryLine = `\nКоличество записей: ${lineCount}\n`;
    await fs.appendFile(FILE_NAME, summaryLine, 'utf8');

    const finalContent = await fs.readFile(FILE_NAME, 'utf8');

    console.log('Содержимое файла:');
    console.log('─'.repeat(60));
    console.log(finalContent);
    console.log('─'.repeat(60));
  } catch (err) {
    console.error('Ошибка при работе с файлом:', err.message);
    process.exitCode = 1;
  }
}

main();