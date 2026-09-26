const express = require('express');

const app = express();
app.use(express.json());

let books = [
  { id: 1, title: 'Война и мир', author: 'Толстой', year: 1869 },
  { id: 2, title: 'Преступление и наказание', author: 'Достоевский', year: 1866 },
  { id: 3, title: 'Мастер и Маргарита', author: 'Булгаков', year: 1967 },
];
let nextId = 4;

function validateBook(body) {
  const errors = [];
  if (!body || typeof body !== 'object') return ['Тело должно быть объектом'];
  if (!body.title || typeof body.title !== 'string') errors.push('title обязателен');
  if (!body.author || typeof body.author !== 'string') errors.push('author обязателен');
  if (body.year !== undefined) {
    const y = Number(body.year);
    if (Number.isNaN(y) || y < 0 || y > new Date().getFullYear()) {
      errors.push('year должен быть корректным годом');
    }
  }
  return errors;
}

app.get('/api/books', (req, res) => {
  res.json(books);
});

app.get('/api/books/search', (req, res) => {
  const { author } = req.query;
  if (!author) return res.json(books);
  const found = books.filter((b) =>
    b.author.toLowerCase().includes(String(author).toLowerCase())
  );
  res.json(found);
});

app.get('/api/books/:id', (req, res) => {
  const id = Number(req.params.id);
  const book = books.find((b) => b.id === id);
  if (!book) return res.status(404).json({ error: 'Книга не найдена', status: 404 });
  res.json(book);
});

app.post('/api/books', (req, res) => {
  const errors = validateBook(req.body);
  if (errors.length) return res.status(400).json({ error: 'Невалидные данные', details: errors, status: 400 });
  const { title, author, year } = req.body;
  const book = { id: nextId++, title, author, year: year ?? null };
  books.push(book);
  res.status(201).json(book);
});

app.put('/api/books/:id', (req, res) => {
  const id = Number(req.params.id);
  const book = books.find((b) => b.id === id);
  if (!book) return res.status(404).json({ error: 'Книга не найдена', status: 404 });
  const { title, author, year } = req.body || {};
  if (title !== undefined) book.title = title;
  if (author !== undefined) book.author = author;
  if (year !== undefined) {
    const y = Number(year);
    if (Number.isNaN(y) || y < 0 || y > new Date().getFullYear()) {
      return res.status(400).json({ error: 'Невалидный год', status: 400 });
    }
    book.year = y;
  }
  res.json(book);
});

app.delete('/api/books/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = books.findIndex((b) => b.id === id);
  if (index === -1) return res.status(404).json({ error: 'Книга не найдена', status: 404 });
  const removed = books.splice(index, 1)[0];
  res.json({ message: 'Книга удалена', book: removed });
});

app.listen(3000, () => {
  console.log('Books API на Express запущен: http://localhost:3000');
});