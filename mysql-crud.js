require('dotenv').config();
const mysql = require('mysql2/promise');

const GROUP = '401';

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('=== Создание таблицы ===');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        group_name VARCHAR(20) NOT NULL,
        course INT NOT NULL,
        grade DECIMAL(3,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✔ Таблица students создана\n');

    console.log('=== INSERT ===');
    const [insertRes] = await pool.query(
      'INSERT INTO students (name, group_name, course, grade) VALUES (?, ?, ?, ?)',
      ['Иван', GROUP, 2, 4.5]
    );
    console.log(`✔ Вставлен студент: id=${insertRes.insertId}, affectedRows=${insertRes.affectedRows}`);

    const [multiRes] = await pool.query(
      'INSERT INTO students (name, group_name, course, grade) VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)',
      ['Мария', GROUP, 1, 3.8, 'Петр', GROUP, 3, 4.2, 'Анна', GROUP, 2, 5.0]
    );
    console.log(`✔ Вставлено 3 студента: affectedRows=${multiRes.affectedRows}\n`);

    console.log('=== SELECT ===');
    const [allStudents] = await pool.query('SELECT * FROM students');
    console.log('Все студенты:');
    allStudents.forEach(s => console.log(`id=${s.id}, name=${s.name}, group=${s.group_name}, grade=${s.grade}`));

    const [filtered] = await pool.query(
      'SELECT * FROM students WHERE group_name = ? ORDER BY grade DESC',
      [GROUP]
    );
    console.log(`\nСтуденты группы ${GROUP} (сортировка по grade):`);
    filtered.forEach(s => console.log(`id=${s.id}, name=${s.name}, grade=${s.grade}`));

    const [paginated] = await pool.query('SELECT * FROM students LIMIT ? OFFSET ?', [2, 1]);
    console.log('\nПагинация (LIMIT 2 OFFSET 1):');
    paginated.forEach(s => console.log(`id=${s.id}, name=${s.name}`));
    console.log('');

    console.log('=== UPDATE ===');
    const [updateRes] = await pool.query(
      'UPDATE students SET grade = ? WHERE id = ?',
      [4.8, insertRes.insertId]
    );
    console.log(`✔ Обновлён студент id=${insertRes.insertId}: affectedRows=${updateRes.affectedRows}, changedRows=${updateRes.changedRows}`);

    const [updateSame] = await pool.query(
      'UPDATE students SET grade = ? WHERE id = ?',
      [4.8, insertRes.insertId]
    );
    console.log(`✔ Повторное обновление: affectedRows=${updateSame.affectedRows}, changedRows=${updateSame.changedRows}\n`);

    console.log('=== DELETE ===');
    const [deleteRes] = await pool.query('DELETE FROM students WHERE id = ?', [insertRes.insertId]);
    console.log(`✔ Удалён студент id=${insertRes.insertId}: affectedRows=${deleteRes.affectedRows}\n`);

    console.log('=== Защита от SQL-инъекции ===');
    const maliciousInput = "'; DROP TABLE students; --";
    console.log(`Попытка инъекции: "${maliciousInput}"`);
    
    try {
      const [safeRes] = await pool.query('SELECT * FROM students WHERE name = ?', [maliciousInput]);
      console.log('✔ Параметризованный запрос безопасен');
    } catch (e) {
      console.log('✖ Ошибка параметризованного запроса');
    }

  } catch (err) {
    console.error('Ошибка:', err.message);
  } finally {
    await pool.end();
  }
}

main();