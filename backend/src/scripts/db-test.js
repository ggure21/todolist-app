require('dotenv').config();
const pool = require('../config/db');

async function testConnection() {
  const client = await pool.connect();
  try {
    const versionResult = await client.query('SELECT version()');
    // eslint-disable-next-line no-console
    console.log(`[db:test] ${versionResult.rows[0].version}`);

    const countResult = await client.query(
      'SELECT COUNT(*) FROM categories WHERE is_default = TRUE'
    );
    const count = Number(countResult.rows[0].count);

    if (count !== 3) {
      throw new Error(`기본 카테고리 수 불일치: 기대값 3, 실제값 ${count}`);
    }

    // eslint-disable-next-line no-console
    console.log(`[db:test] 기본 카테고리 ${count}개 확인 완료`);
    // eslint-disable-next-line no-console
    console.log('[db:test] Connected to PostgreSQL successfully');
  } finally {
    client.release();
    await pool.end();
  }
}

testConnection().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[db:test] 연결 실패:', err.message);
  process.exit(1);
});
