const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const LOG_FILE = path.join(__dirname, 'library.log');
function logLine(text) {
  const line = `[${new Date().toISOString()}] ${text}\n`;
  fs.appendFile(LOG_FILE, line, 'utf8', () => {});
}

let books = [
  { id: 1, title: 'Война и мир', author: 'Толстой', year: 1869, genre: 'роман' },
  { id: 2, title: 'Преступление и наказание', author: 'Достоевский', year: 1866, genre: 'роман' },
  { id: 3, title: 'Мастер и Маргарита', author: 'Булгаков', year: 1967, genre: 'роман' },
  { id: 4, title: '1984', author: 'Оруэлл', year: 1949, genre: 'антиутопия' },
  { id: 5, title: 'Гарри Поттер', author: 'Роулинг', year: 1997, genre: 'фэнтези' },
  { id: 6, title: 'Анна Каренина', author: 'Толстой', year: 1877, genre: 'роман' },
];
let nextId = 7;

function applyFilters(list, query) {
  let result = [...list];

  if (query.author) {
    result = result.filter((b) => b.author.toLowerCase().includes(String(query.author).toLowerCase()));
  }
  if (query.year) {
    const y = Number(query.year);
    result = result.filter((b) => b.year === y);
  }
  if (query.yearFrom) {
    const y = Number(query.yearFrom);
    result = result.filter((b) => b.year >= y);
  }
  if (query.yearTo) {
    const y = Number(query.yearTo);
    result = result.filter((b) => b.year <= y);
  }
  if (query.search) {
    const s = String(query.search).toLowerCase();
    result = result.filter((b) =>
      b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s)
    );
  }
  return result;
}

function applySort(list, query) {
  if (!query.sort) return list;
  const field = String(query.sort);
  const desc = field.startsWith('-');
  const key = desc ? field.slice(1) : field;
  return [...list].sort((a, b) => {
    let cmp = 0;
    if (typeof a[key] === 'number') cmp = a[key] - b[key];
    else cmp = String(a[key]).localeCompare(String(b[key]), 'ru');
    return desc ? -cmp : cmp;
  });
}

function applyPagination(list, query) {
  const limit = query.limit !== undefined ? Number(query.limit) : list.length;
  const page = query.page !== undefined ? Number(query.page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : list.length;
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const total = list.length;
  const totalPages = Math.ceil(total / safeLimit) || 1;
  const offset = (safePage - 1) * safeLimit;
  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
    items: list.slice(offset, offset + safeLimit),
  };
}

app.get('/api/books', (req, res) => {
  let result = applyFilters(books, req.query);
  result = applySort(result, req.query);
  res.json(applyPagination(result, req.query));
});

app.get('/api/books/stats', (req, res) => {
  if (!books.length) return res.json({ total: 0 });
  const byAuthor = {};
  const byGenre = {};
  let oldest = books[0].year;
  let newest = books[0].year;
  for (const b of books) {
    byAuthor[b.author] = (byAuthor[b.author] || 0) + 1;
    byGenre[b.genre] = (byGenre[b.genre] || 0) + 1;
    if (b.year < oldest) oldest = b.year;
    if (b.year > newest) newest = b.year;
  }
  res.json({ total: books.length, byAuthor, byGenre, oldestYear: oldest, newestYear: newest });
});

app.get('/api/books/:id', (req, res) => {
  const id = Number(req.params.id);
  const book = books.find((b) => b.id === id);
  if (!book) return res.status(404).json({ error: 'Книга не найдена', status: 404 });
  res.json(book);
});

app.post('/api/books', (req, res) => {
  const { title, author, year, genre } = req.body || {};
  if (!title || !author) return res.status(400).json({ error: 'title и author обязательны', status: 400 });
  const y = year !== undefined ? Number(year) : null;
  if (y !== null && (Number.isNaN(y) || y < 0 || y > new Date().getFullYear())) {
    return res.status(400).json({ error: 'Невалидный год', status: 400 });
  }
  const duplicate = books.find(
    (b) => b.title.toLowerCase() === title.toLowerCase() && b.author.toLowerCase() === author.toLowerCase()
  );
  if (duplicate) return res.status(409).json({ error: 'Книга уже существует', status: 409 });
  const book = { id: nextId++, title, author, year: y, genre: genre || 'не указан' };
  books.push(book);
  logLine(`POST /api/books — создана книга #${book.id}`);
  res.status(201).json(book);
});

app.put('/api/books/:id', (req, res) => {
  const id = Number(req.params.id);
  const book = books.find((b) => b.id === id);
  if (!book) return res.status(404).json({ error: 'Книга не найдена', status: 404 });
  const { title, author, year, genre } = req.body || {};
  if (title !== undefined) book.title = title;
  if (author !== undefined) book.author = author;
  if (genre !== undefined) book.genre = genre;
  if (year !== undefined) {
    const y = Number(year);
    if (Number.isNaN(y) || y < 0 || y > new Date().getFullYear()) {
      return res.status(400).json({ error: 'Невалидный год', status: 400 });
    }
    book.year = y;
  }
  logLine(`PUT /api/books/${id} — обновлена книга`);
  res.json(book);
});

app.delete('/api/books/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = books.findIndex((b) => b.id === id);
  if (index === -1) return res.status(404).json({ error: 'Книга не найдена', status: 404 });
  const removed = books.splice(index, 1)[0];
  logLine(`DELETE /api/books/${id} — удалена книга "${removed.title}"`);
  res.json({ message: 'Книга удалена', book: removed });
});

app.listen(3000, () => {
  console.log('Library API запущен: http://localhost:3000');
});