require('dotenv').config();
const mysql = require('mysql2/promise');

const GROUP = '401';

class StudentDAO {
  constructor(pool) {
    this.pool = pool;
  }

  validate(data) {
    if (!data.name || data.name.length < 2 || data.name.length > 100) {
      throw new Error('Имя должно быть от 2 до 100 символов');
    }
    if (!data.group_name || !data.group_name.match(/^[А-Яа-яA-Za-z0-9-]+$/)) {
      throw new Error('Некорректная группа');
    }
    if (![1, 2, 3, 4].includes(data.course)) {
      throw new Error('Курс должен быть от 1 до 4');
    }
    if (data.grade !== null && (data.grade < 0 || data.grade > 5)) {
      throw new Error('Оценка должна быть от 0 до 5');
    }
  }

  async create(data) {
    this.validate(data);
    const [res] = await this.pool.query(
      'INSERT INTO students (name, group_name, course, grade) VALUES (?, ?, ?, ?)',
      [data.name, data.group_name, data.course, data.grade || null]
    );
    return { id: res.insertId, ...data };
  }

  async findById(id) {
    const [rows] = await this.pool.query('SELECT * FROM students WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findAll(options = {}) {
    const { limit = 10, offset = 0, group_name, course, grade_min, grade_max, sort = 'id', order = 'ASC' } = options;
    
    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    if (group_name) { query += ' AND group_name = ?'; params.push(group_name); }
    if (course) { query += ' AND course = ?'; params.push(course); }
    if (grade_min !== undefined) { query += ' AND grade >= ?'; params.push(grade_min); }
    if (grade_max !== undefined) { query += ' AND grade <= ?'; params.push(grade_max); }

    query += ` ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await this.pool.query(query, params);
    
    let countQuery = 'SELECT COUNT(*) as total FROM students WHERE 1=1';
    const countParams = params.slice(0, -2);
    
    if (group_name) countParams.push(group_name);
    if (course) countParams.push(course);
    if (grade_min !== undefined) countParams.push(grade_min);
    if (grade_max !== undefined) countParams.push(grade_max);

    const [countRes] = await this.pool.query(countQuery, countParams.slice(0, params.length - 2));
    
    return { data: rows, total: countRes[0].total, limit, offset };
  }

  async update(id, data) {
    if (data.name || data.group_name || data.course !== undefined || data.grade !== undefined) {
      this.validate({ 
        name: data.name || 'ValidName', 
        group_name: data.group_name || '401', 
        course: data.course || 1, 
        grade: data.grade !== undefined ? data.grade : null 
      });
    }
    const fields = [];
    const params = [];
    for (const [key, value] of Object.entries(data)) {
      if (['name', 'group_name', 'course', 'grade'].includes(key)) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    }
    if (fields.length === 0) return false;
    params.push(id);
    const [res] = await this.pool.query(`UPDATE students SET ${fields.join(', ')} WHERE id = ?`, params);
    return res.affectedRows > 0;
  }

  async delete(id) {
    const [res] = await this.pool.query('DELETE FROM students WHERE id = ?', [id]);
    return res.affectedRows > 0;
  }

  async search(query) {
    const [rows] = await this.pool.query('SELECT * FROM students WHERE name LIKE ?', [`%${query}%`]);
    return rows;
  }

  async getStats() {
    const [totalRes] = await this.pool.query('SELECT COUNT(*) as total, AVG(grade) as avgGrade, MIN(grade) as minGrade, MAX(grade) as maxGrade FROM students');
    const [groupRes] = await this.pool.query('SELECT group_name, COUNT(*) as count FROM students GROUP BY group_name');
    const [courseRes] = await this.pool.query('SELECT course, COUNT(*) as count FROM students GROUP BY course');
    
    return {
      total: totalRes[0].total,
      averageGrade: parseFloat(totalRes[0].avgGrade || 0).toFixed(2),
      minGrade: totalRes[0].minGrade,
      maxGrade: totalRes[0].maxGrade,
      byGroup: groupRes.reduce((acc, row) => ({ ...acc, [row.group_name]: row.count }), {}),
      byCourse: courseRes.reduce((acc, row) => ({ ...acc, [row.course]: row.count }), {})
    };
  }
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME
  });

  const dao = new StudentDAO(pool);

  try {
    console.log('=== Создание с валидацией ===');
    const newStudent = await dao.create({ name: 'Алексей', group_name: GROUP, course: 2, grade: 4.5 });
    console.log('✔ Создан:', newStudent);
    
    try {
      await dao.create({ name: 'A', group_name: GROUP, course: 2, grade: 4.5 });
    } catch (e) {
      console.log('✖ Ошибка валидации:', e.message);
    }

    console.log('\n=== Пагинация ===');
    const page1 = await dao.findAll({ limit: 2, offset: 0 });
    console.log('Страница 1:', page1.data.map(s => s.name), `(Всего: ${page1.total})`);

    console.log('\n=== Фильтры ===');
    const filtered = await dao.findAll({ group_name: GROUP, grade_min: 4.0 });
    console.log(`Студенты группы ${GROUP} с оценкой >= 4.0:`, filtered.data.map(s => `${s.name} (${s.grade})`));

    console.log('\n=== Поиск ===');
    const searchRes = await dao.search('Алекс');
    console.log("Найдено по 'Алекс':", searchRes.map(s => s.name));
    console.log('\n=== Статистика ===');
    const stats = await dao.getStats();
    console.log(stats);

  } finally {
    await pool.end();
  }
}

main();