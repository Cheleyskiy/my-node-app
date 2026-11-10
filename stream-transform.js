const { Readable, Writable, Transform } = require('stream');

class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    const str = chunk.toString();
    callback(null, `[401] ${str.toUpperCase()}\n`);
  }
}

class JsonParserTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }
  _transform(chunk, encoding, callback) {
    try {
      const obj = JSON.parse(chunk.toString());
      callback(null, obj);
    } catch (err) {
      callback(err);
    }
  }
}

class FilterTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }
  _transform(obj, encoding, callback) {
    if (obj.group === '401') {
      callback(null, obj);
    } else {
      callback();
    }
  }
}

class MyWritable extends Writable {
  constructor() {
    super({ objectMode: true });
  }
  _write(obj, encoding, callback) {
    console.log('[WRITABLE]', obj);
    callback();
  }
}

async function run() {
  console.log('=== Transform и Object Mode ===');
  
  const source = Readable.from(['привет\n', 'мир\n', '401\n']);
  const upper = new UpperCaseTransform();
  
  console.log('\n-- UpperCaseTransform --');
  source.pipe(upper).pipe(process.stdout);

  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('\n-- Object Mode Chain --');
  const jsonData = [
    '{"id":1,"name":"Иван","group":"401"}\n',
    '{"id":2,"name":"Мария","group":"402"}\n',
    '{"id":3,"name":"Петр","group":"401"}\n'
  ];

  const readableObjects = Readable.from(jsonData);
  const parser = new JsonParserTransform();
  const filter = new FilterTransform();
  const writable = new MyWritable();

  readableObjects.pipe(parser).pipe(filter).pipe(writable);
}

run();