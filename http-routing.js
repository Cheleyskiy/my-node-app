const http = require('http');

const PORT = 3000;
const GROUP = '401';

let students = [
  { id: 1, name: 'Иван', group: GROUP },
  { id: 2, name: 'Мария', group: GROUP }
];
let nextId = 3;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', () => resolve(Buffer.concat(body).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const time = new Date().toLocaleString('ru-RU', { hour12: false });
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const query = urlObj.searchParams;
  const method = req.method;

  res.on('finish', () => {
    console.log(`[${time}] [${GROUP}] ${method} ${req.url} ${res.statusCode}`);
  });

  if (pathname === '/search') {
    const q = query.get('q') || '';
    const limit = query.get('limit') || '10';
    sendJSON(res, 200, { query: q, limit: limit });
    return;
  }

  if (pathname === '/api/students' && method === 'GET') {
    const groupParam = query.get('group');
    if (groupParam) {
      const filtered = students.filter(s => s.group === groupParam);
      sendJSON(res, 200, filtered);
    } else {
      sendJSON(res, 200, students);
    }
    return;
  }

  if (pathname === '/api/students' && method === 'POST') {
    const body = await readBody(req);
    const data = JSON.parse(body);
    const newStudent = { id: nextId++, name: data.name, group: data.group || GROUP };
    students.push(newStudent);
    sendJSON(res, 201, newStudent);
    return;
  }

  const idMatch = pathname.match(/^\/api\/students\/(\d+)$/);

  if (idMatch) {
    const id = parseInt(idMatch[1], 10);
    const studentIndex = students.findIndex(s => s.id === id);

    if (method === 'GET') {
      if (studentIndex === -1) return sendJSON(res, 404, { error: 'Not found' });
      sendJSON(res, 200, students[studentIndex]);
      return;
    }

    if (method === 'PUT') {
      if (studentIndex === -1) return sendJSON(res, 404, { error: 'Not found' });
      const body = await readBody(req);
      const data = JSON.parse(body);
      students[studentIndex].name = data.name || students[studentIndex].name;
      sendJSON(res, 200, students[studentIndex]);
      return;
    }

    if (method === 'DELETE') {
      if (studentIndex === -1) return sendJSON(res, 404, { error: 'Not found' });
      students.splice(studentIndex, 1);
      sendJSON(res, 200, { deleted: true, id: id });
      return;
    }

    sendJSON(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  sendJSON(res, 404, { error: 'Not Found' });
});

server.listen(PORT, () => {
  console.log(`Сервер маршрутизации запущен на порту ${PORT}`);
});