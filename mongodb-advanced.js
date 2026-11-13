require('dotenv').config();
const { MongoClient } = require('mongodb');

const GROUP = '401';

async function main() {
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME || '401_db');
    const students = db.collection('students');

    console.log('=== Курсоры ===');
    const count = await students.countDocuments();
    if (count < 10000) {
      console.log('Генерация 10000 документов...');
      const docs = [];
      for (let i = 0; i < 10000; i++) {
        docs.push({ name: `Студент_${i}`, group_name: GROUP, course: Math.floor(Math.random() * 4) + 1, grade: Math.random() * 5 });
      }
      await students.insertMany(docs);
    }

    console.log('Итерация через for await:');
    const start = Date.now();
    let processed = 0;
    const cursor = students.find({}).batchSize(1000);
    for await (const doc of cursor) {
      processed++;
    }
    console.log(` Получено ${processed} документов за ${((Date.now() - start) / 1000).toFixed(2)} сек\n`);

    console.log('=== Агрегации ===');
    const avgGrades = await students.aggregate([
      { $group: { _id: '$group_name', avgGrade: { $avg: '$grade' } } }
    ]).toArray();
    console.log('Средний балл по группам:');
    avgGrades.forEach(g => console.log(` ${g._id}: ${g.avgGrade.toFixed(2)}`));

    const byCourse = await students.aggregate([
      { $group: { _id: '$course', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    console.log('\nКоличество по курсам:');
    byCourse.forEach(c => console.log(` ${c._id} курс: ${c.count}`));

    console.log('\n=== Индексы ===');
    await students.createIndex({ group_name: 1 });
    console.log('✔ Создан индекс: group_name_1');
    await students.createIndex({ group_name: 1, grade: -1 });
    console.log('✔ Создан индекс: group_name_1_grade_-1');
    await students.createIndex({ name: 'text' });
    console.log('✔ Создан текстовый индекс: name_text');

    console.log('\n=== Текстовый поиск ===');
    const searchRes = await students.find({ $text: { $search: 'Студент_1' } }).limit(5).toArray();
    console.log(`Найдено (первые 5): ${searchRes.length} документов`);

  } finally {
    await client.close();
  }
}

main();