const config = require('./config/env');
const app = require('./app');
const pool = require('./config/database');

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log(`[db] Connected to MySQL database "${config.db.database}" on ${config.db.host}:${config.db.port}`);
  } catch (err) {
    console.error(`[db] Could not connect to MySQL: ${err.message}`);
    console.error('[db] Check DB_* values in backend/.env and run "npm run db:setup".');
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    console.log(`[api] Store Rating API listening on http://localhost:${config.port}`);
  });

  const shutdown = (signal) => {
    console.log(`[api] ${signal} received, shutting down...`);
    server.close(async () => {
      await pool.end().catch(() => {});
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
