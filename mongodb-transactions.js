require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME || '401_db');
    const students = db.collection('students');

    await students.deleteMany({});

    console.log('=== Транзакция (успех) ===');
    const session = client.startSession();
    try {
      session.startTransaction();
      await students.insertOne({ name: 'Иван', grade: 4.5 }, { session });
      await students.insertOne({ name: 'Мария', grade: 3.8 }, { session });
      await students.updateOne({ name: 'Иван' }, { $set: { grade: 4.8 } }, { session });
      await session.commitTransaction();
      console.log('✔ Транзакция зафиксирована');
    } catch (e) {
      await session.abortTransaction();
      console.log('✖ Откат:', e.message);
    } finally {
      await session.endSession();
    }

    console.log('\n=== Change Streams ===');
    const changeStream = students.watch();
    console.log('[WATCH] Отслеживание коллекции students (5 сек)...');

    const interval = setInterval(async () => {
      await students.insertOne({ name: 'Анна', group_name: '401', grade: 5.0 });
    }, 1000);

    const start = Date.now();
    for await (const change of changeStream) {
      console.log(`[CHANGE] ${change.operationType}:`, JSON.stringify(change.fullDocument || change.documentKey));
      if (Date.now() - start > 4000) {
        await changeStream.close();
        clearInterval(interval);
        console.log('[WATCH] Stream закрыт');
        break;
      }
    }

  } catch (err) {
    console.error('Ошибка:', err.message);
  } finally {
    await client.close();
  }
}

main();