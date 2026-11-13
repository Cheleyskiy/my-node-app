const EventEmitter = require('events');

class DatabaseConnection extends EventEmitter {
  constructor() {
    super();
    this.group = '401';
  }

  connect() {
    this.emit('connect', `Соединение установлено`);
  }

  query(sql) {
    this.emit('query', `Выполнение запроса: ${sql}`);
    // Имитация получения результата
    const result = sql.includes('SELECT') ? '50 записей' : '1 запись добавлена';
    this.emit('queryResult', `Результат: ${result}`);
  }

  close() {
    this.emit('close', `Соединение закрыто`);
  }

  error(msg) {
    this.emit('error', new Error(msg));
  }
}

const db = new DatabaseConnection();
console.log(`1. DatabaseConnection (группа ${db.group})`);

db.on('connect', (msg) => console.log(`2. [EVENT] Подключение к БД... \n3. [EVENT] ${msg}`));
db.on('query', (msg) => console.log(`4. [EVENT] ${msg}`));
db.on('queryResult', (msg) => console.log(`5. [EVENT] ${msg}`));
db.on('close', (msg) => console.log(`8. [EVENT] Закрытие соединения... \n9. [EVENT] ${msg}`));

db.on('error', (err) => {
  console.log(`11. [EVENT] Ошибка: ${err.message}`);
  console.log(`12. (без слушателя error — процесс упал бы с исключением)`);
});

db.connect();
db.query('SELECT * FROM students');
db.query('INSERT INTO students');

setTimeout(() => {
  db.close();
  console.log(`10. [EVENT] Демонстрация ошибки`);
  db.error('Connection timeout');
}, 500);