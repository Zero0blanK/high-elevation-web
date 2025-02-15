const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // Maximum number of connections to create
  queueLimit: 0
}).promise();

db.execute('SELECT 1') // A simple test query
  .then(() => console.log('Connected to the database'))
  .catch((err) => console.error('Error connecting to the database:', err.stack));


module.exports = db;
