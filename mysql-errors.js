require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  console.log('=== Демонстрация ошибок ===');
  
  const baseConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  };

  try {
    await mysql.createConnection({ ...baseConfig, port: 9999 });
  } catch (err) {
    console.log(`[${err.code}] Сервер недоступен: localhost:9999`);
  }

  try {
    await mysql.createConnection({ ...baseConfig, password: 'wrong_password' });
  } catch (err) {
    console.log(`[${err.code}] Неверный пароль для пользователя`);
  }

  const pool = mysql.createPool(baseConfig);

  try {
    await pool.query('SELECT * FRM students');
  } catch (err) {
    console.log(`[${err.code}] Синтаксическая ошибка: SELECT * FRM students`);
  }

  try {
    await pool.query('CREATE TABLE IF NOT EXISTS test_dup (id INT PRIMARY KEY)');
    await pool.query('INSERT INTO test_dup (id) VALUES (1)');
    await pool.query('INSERT INTO test_dup (id) VALUES (1)');
  } catch (err) {
    console.log(`[${err.code}] Дублирование ключа: id=1`);
    await pool.query('DROP TABLE test_dup');
  }

  try {
    await pool.query('INSERT INTO students (name, group_name, course) VALUES (NULL, ?, 1)', ['401']);
  } catch (err) {
    console.log(`[${err.code}] NULL в NOT NULL столбце: name\n`);
  }

  console.log('=== Потоковый запрос ===');
  await pool.query('CREATE TABLE IF NOT EXISTS big_data (id INT AUTO_INCREMENT PRIMARY KEY, value VARCHAR(50))');
  const [count] = await pool.query('SELECT COUNT(*) as c FROM big_data');
  
  if (count[0].c < 10000) {
    console.log('Генерация 10000 записей...');
    const values = [];
    for (let i = 0; i < 10000; i++) values.push(['data_' + i]);
    await pool.query('INSERT INTO big_data (value) VALUES ?', [values]);
  }

  console.log('Чтение 10000 записей...');
  let processed = 0;
  const start = Date.now();
  
  await new Promise((resolve, reject) => {
    const stream = pool.query('SELECT * FROM big_data').stream();
    stream.on('data', () => {
      processed++;
      if (processed % 2500 === 0) {
        process.stdout.write(`[STREAM] Получено: ${processed} (${processed / 100}%)\n`);
      }
    });
    stream.on('end', () => {
      const time = ((Date.now() - start) / 1000).toFixed(2);
      console.log(`✔ Обработано за ${time} сек\n`);
      resolve();
    });
    stream.on('error', reject);
  });

  console.log('=== Транзакция ===');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    console.log('Начало транзакции');
    
    await connection.query('INSERT INTO students (name, group_name, course) VALUES (?, ?, ?)', ['Тест1', '401', 1]);
    console.log('✔ INSERT 1 выполнен');
    
    await connection.query('INSERT INTO students (name, group_name, course) VALUES (?, ?, ?)', ['Тест2', '401', 1]);
    console.log('✔ INSERT 2 выполнен');

    await connection.query('INSERT INTO students (id, name, group_name, course) VALUES (1, ?, ?, ?)', ['Дубликат', '401', 1]);
    console.log('✔ INSERT 3 выполнен');
    
    await connection.commit();
  } catch (err) {
    console.log(`✖ INSERT 3 не выполнен (${err.code})`);
    await connection.rollback();
    console.log('Rollback выполнен');
  } finally {
    connection.release();
    console.log('Соединение возвращено в пул');
  }

  await pool.end();
}

main();