'use strict';

require('dotenv').config();

const { env } = require('./config/env');
const pool = require('./config/db');
const logger = require('./utils/logger');
const app = require('./app');

const PORT = Number(env.PORT) || 3000;

async function start() {
  try {
    const client = await pool.connect();
    client.release();
    logger.info('Database connection established');
  } catch (err) {
    logger.error('Failed to connect to database:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

start();
