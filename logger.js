// Челей Максим 401

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'logs.txt');

function writeLog(eventName, data) {
  const time = new Date().toISOString();
  const line = `[${time}] ${eventName}: ${JSON.stringify(data)}\n`;

  fs.appendFile(LOG_FILE, line, 'utf8', (err) => {
    if (err) {
      console.error('Ошибка записи в logs.txt:', err.message);
    }
  });
}

function setupLogger(app) {
  app.on('server:started', (port) => {
    writeLog('server:started', { port });
  });

  app.on('server:stopped', () => {
    writeLog('server:stopped', {});
  });

  app.on('request:received', ({ method, url }) => {
    writeLog('request:received', { method, url });
  });
}

module.exports = { setupLogger };