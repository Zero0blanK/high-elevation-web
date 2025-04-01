const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
  host: 'shuttle.proxy.rlwy.net',
  user: 'root',
  password: '',
  database: 'railway',
  port: '5432',
  waitForConnections: true,
  connectionLimit: 10, // Maximum number of connections to create
  queueLimit: 0
}).promise();

db.execute('SELECT 1') // A simple test query
  .then(() => console.log('Connected to the database'))
  .catch((err) => console.error('Error connecting to the database:', err.stack));


module.exports = db;
