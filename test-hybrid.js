const HybridFileManager = require('./fileOperationsHybrid');
const fileManager = new HybridFileManager('./test-data-hybrid');

async function runHybridTest() {
  console.log('=== ТЕСТИРОВАНИЕ ГИБРИДНОГО ПОДХОДА ===\n');

  console.log('>>> [Стиль Колбэков] Создание и чтение файла callback.txt...');
  
  fileManager.createFile('callback.txt', 'Данные в стиле Callback', (err, filePath) => {
    if (err) {
      console.error(' ❌ Ошибка колбэка при создании:', err.message);
      return;
    }
    console.log(` ✅ [Callback] Файл успешно создан по пути: ${filePath}`);

    fileManager.readFile('callback.txt', (readErr, content) => {
      if (readErr) {
        console.error(' ❌ Ошибка колбэка при чтении:', readErr.message);
        return;
      }
      console.log(` ✅ [Callback] Прочитано содержимое: "${content}"`);
      
      runPromisePart();
    });
  });
}

async function runPromisePart() {
  console.log('\n>>> [Стиль Промисов] Создание и чтение файла promise.txt...');

  try {
    const filePath = await fileManager.createFile('promise.txt', 'Данные в стиле Promises / Async-Await');
    console.log(` ✅ [Promise] Файл успешно создан по пути: ${filePath}`);

    const content = await fileManager.readFile('promise.txt');
    console.log(` ✅ [Promise] Прочитано содержимое: "${content}"`);

    console.log('\n>>> Тестирование обработки ошибок при обращении к несуществующему файлу...');

    fileManager.readFile('non-existent-cb.txt', (err) => {
      if (err) {
        console.log(` ✅ [Callback] Ошибка успешно перехвачена: ${err.code} (${err.message.split(',')[0]})`);
      }
    });

    try {
      await fileManager.readFile('non-existent-promise.txt');
    } catch (err) {
      console.log(` ✅ [Promise] Ошибка успешно поймана через catch: ${err.code} (${err.message.split(',')[0]})`);
    }

    console.log('\nОчистка временных файлов...');
    await fileManager.deleteFile('callback.txt');
    await fileManager.deleteFile('promise.txt');
    console.log(' ✅ Все тестовые файлы удалены.');
    console.log('\n🎉 Задание №3 успешно выполнено! Модуль полностью универсален.');

  } catch (globalError) {
    console.error(' ❌ Непредвиденная ошибка в Promise-части теста:', globalError.message);
  }
}


runHybridTest();
