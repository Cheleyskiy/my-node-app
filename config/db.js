require('dotenv').config();
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGO_URI);
let db;

async function connectDB() {
  await client.connect();
  db = client.db(process.env.DB_NAME || '401_db');
  console.log('[INFO] MongoDB подключена');
  return db;
}

function getDB() {
  return db;
}

module.exports = { connectDB, getDB, client };