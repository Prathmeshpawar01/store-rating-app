/**
 * Creates the database (if needed) and applies database/schema.sql.
 * WARNING: schema.sql drops and re-creates all tables.
 *
 *   npm run db:init     -> schema only
 *   npm run db:setup    -> schema + demo seed data
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config/env');

const SCHEMA_PATH = path.resolve(__dirname, '../../../database/schema.sql');

async function initDatabase(dbName = config.db.database) {
  if (!/^[A-Za-z0-9_]+$/.test(dbName)) {
    throw new Error(`Invalid database name "${dbName}" (letters, digits and underscore only)`);
  }

  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE \`${dbName}\``);
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    await connection.query(schema);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log(`[db:init] Schema applied to database "${config.db.database}"`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`[db:init] Failed: ${err.message}`);
      process.exit(1);
    });
}

module.exports = { initDatabase };
