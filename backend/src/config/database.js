const mysql = require('mysql2/promise');
const config = require('./env');

/**
 * Shared connection pool. All queries in the app go through `pool.execute`
 * / `pool.query` with `?` placeholders (parameterized), never string concatenation
 * of user input.
 */
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: false,
  timezone: 'Z',
  decimalNumbers: true,
});

// Store and read all TIMESTAMP values in UTC so API dates are correct regardless
// of the MySQL server's system time zone.
pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+00:00'");
});

module.exports = pool;
