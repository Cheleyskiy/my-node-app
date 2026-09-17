const fs = require('fs');
const path = require('path');

class HybridFileManager {
  constructor(baseDir = './data-hybrid') {
    this.baseDir = baseDir;
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
  }

  _execute(asyncOp, callback) {
    if (typeof callback === 'function') {
      try {
        asyncOp(callback);
      } catch (err) {
        callback(err, null);
      }
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        asyncOp((err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  createFile(filename, content, callback) {
    const filePath = path.join(this.baseDir, filename);
    
    return this._execute((cb) => {
      fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) return cb(err, null);
        cb(null, filePath);
      });
    }, callback);
  }

  readFile(filename, callback) {
    const filePath = path.join(this.baseDir, filename);

    return this._execute((cb) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return cb(err, null);
        cb(null, data);
      });
    }, callback);
  }

  deleteFile(filename, callback) {
    const filePath = path.join(this.baseDir, filename);

    return this._execute((cb) => {
      fs.unlink(filePath, (err) => {
        if (err) return cb(err);
        cb(null, true); 
      });
    }, callback);
  }
}

module.exports = HybridFileManager;
