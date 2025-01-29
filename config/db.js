const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'bords09182252580',
  database: 'high_elevation'
}).promise();

db.execute('SELECT 1') // A simple test query
  .then(() => console.log('✅ MySQL is connected in Promise mode'))
  .catch((err) => console.error('❌ MySQL connection failed:', err));

module.exports = db;
