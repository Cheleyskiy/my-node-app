require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main() {
  console.log('=== Подключение к MongoDB ===');
  const uri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME || '401_db';
  
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✔ Подключение установлено');

    const adminDb = client.db('admin');
    const buildInfo = await adminDb.command({ buildInfo: 1 });
    console.log(`Версия MongoDB: ${buildInfo.version}`);
    console.log(`База данных: ${dbName}`);
    console.log(`Пользователь: ${uri.includes('@') ? uri.split(':')[1].split('@')[0] : 'без авторизации'}`);

    console.log('\n=== Информация о сервере ===');
    const dbs = await adminDb.command({ listDatabases: 1 });
    console.log('Список БД:');
    dbs.databases.forEach(db => console.log(` - ${db.name}`));

    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log(`\nКоллекции в ${dbName}:`);
    if (collections.length === 0) console.log(' (пусто)');
    else collections.forEach(c => console.log(` - ${c.name}`));

    console.log('\n=== Heartbeat ===');
    client.on('serverHeartbeatSucceeded', (event) => {
      console.log(`[HEARTBEAT] Успешно: ${new Date().toISOString()}`);
    });
    client.on('serverHeartbeatFailed', (event) => {
      console.log(`[HEARTBEAT] Ошибка: ${event.failure.message}`);
    });

    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✔ Соединение стабильно');

  } catch (err) {
    console.error('✖ Ошибка подключения:', err.message);
  } finally {
    await client.close();
    console.log('✘ Соединение закрыто');
  }
}

main();