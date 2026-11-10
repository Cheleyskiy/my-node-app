require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  console.log('=== Одиночное соединение ===');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✔ Подключение установлено');
    const [rows] = await connection.query('SELECT VERSION() AS version, DATABASE() AS db, USER() AS user');
    
    console.log(`Версия MySQL: ${rows[0].version}`);
    console.log(`Текущая БД: ${rows[0].db}`);
    console.log(`Пользователь: ${rows[0].user}`);
    
    await connection.end();
    console.log('✘ Соединение закрыто\n');
  } catch (err) {
    console.error('✖ Ошибка одиночного подключения:', err.message);
  }

  console.log('=== Пул соединений ===');
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectionLimit: 10
    });

    console.log('✔ Пул создан (лимит: 10)');
    const [rows] = await pool.query('SELECT VERSION() AS version, DATABASE() AS db');
    
    console.log(`Версия MySQL: ${rows[0].version}`);
    console.log(`Текущая БД: ${rows[0].db}`);
    console.log('✔ Пул готов к работе');
    
    await pool.end();
  } catch (err) {
    console.error('✖ Ошибка пула:', err.message);
  }
}

main();