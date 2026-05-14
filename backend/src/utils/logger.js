'use strict';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

function getCurrentLevel() {
  const raw = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return raw in LEVELS ? raw : 'info';
}

function log(level, ...args) {
  if (LEVELS[level] > LEVELS[getCurrentLevel()]) return;
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](`[${level.toUpperCase()}] ${ts}`, ...args);
}

const logger = {
  error: (...args) => log('error', ...args),
  warn: (...args) => log('warn', ...args),
  info: (...args) => log('info', ...args),
  debug: (...args) => log('debug', ...args),
};

module.exports = logger;
