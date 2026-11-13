require('dotenv').config();
const { MongoClient } = require('mongodb');

const GROUP = '401';

async function main() {
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME || '401_db');
    const students = db.collection('students');

    await students.deleteMany({});
    await students.createIndex({ group_name: 1 });

    console.log('=== Коллекция students ===');
    
    console.log('\n--- INSERT ---');
    const insertOneRes = await students.insertOne({
      name: 'Иван', group_name: GROUP, course: 2, grade: 4.5, created_at: new Date()
    });
    console.log(`✔ Вставлен: insertedId=${insertOneRes.insertedId}`);

    const insertManyRes = await students.insertMany([
      { name: 'Мария', group_name: GROUP, course: 1, grade: 3.8, created_at: new Date() },
      { name: 'Петр', group_name: GROUP, course: 3, grade: 4.2, created_at: new Date() }
    ]);
    console.log(`✔ Вставлено 3 документа: insertedIds=${Object.keys(insertManyRes.insertedIds).length}`);

    console.log('\n--- SELECT ---');
    const allDocs = await students.find({}).toArray();
    console.log(`Все документы (${allDocs.length}):`);
    allDocs.forEach(d => console.log(d));

    console.log('\nС проекцией (только name, grade):');
    const projDocs = await students.find({}, { projection: { name: 1, grade: 1, _id: 0 } }).toArray();
    console.log(projDocs);

    console.log('\n--- UPDATE ---');
    const updateOneRes = await students.updateOne(
      { name: 'Иван' },
      { $set: { grade: 4.8 } }
    );
    console.log(`✔ updateOne: matchedCount=${updateOneRes.matchedCount}, modifiedCount=${updateOneRes.modifiedCount}`);

    const updateManyRes = await students.updateMany(
      { group_name: GROUP },
      { $inc: { course: 1 } }
    );
    console.log(`✔ updateMany: matchedCount=${updateManyRes.matchedCount}`);

    console.log('\n--- DELETE ---');
    const deleteOneRes = await students.deleteOne({ name: 'Мария' });
    console.log(`✔ deleteOne: deletedCount=${deleteOneRes.deletedCount}`);

    const deleteManyRes = await students.deleteMany({ grade: { $lt: 4.0 } });
    console.log(`✔ deleteMany: deletedCount=${deleteManyRes.deletedCount}`);

  } finally {
    await client.close();
  }
}

main();