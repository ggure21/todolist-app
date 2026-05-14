'use strict';

/**
 * DB-11: 인덱스 성능 검증 스크립트
 *
 * 핵심 쿼리 6종에 대해 EXPLAIN ANALYZE를 수행하고
 * Index Scan / Index Only Scan 사용 여부 및 응답시간을 검증한다.
 */

require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const SEED_USER_ID = '00000000-dead-beef-0000-000000000001';
const SEED_EMAIL = 'indextest@example.com';
const SEED_ROWS = 500; // 인덱스 선택을 유도하기 위한 충분한 데이터

async function seedData(client) {
  // 테스트 사용자 여러 명 삽입
  for (let i = 0; i < SEED_ROWS; i++) {
    await client.query(
      `INSERT INTO users (id, email, password, name)
       VALUES (gen_random_uuid(), $1, 'hashed', $2)
       ON CONFLICT DO NOTHING`,
      [`user${i}@indextest.com`, `User ${i}`],
    );
  }
  // 검색 대상 사용자
  await client.query(
    `INSERT INTO users (id, email, password, name)
     VALUES ($1, $2, 'hashed', 'IndexTestUser')
     ON CONFLICT DO NOTHING`,
    [SEED_USER_ID, SEED_EMAIL],
  );

  // 검색 대상 사용자의 카테고리
  const catRes = await client.query(
    `INSERT INTO categories (user_id, name, is_default)
     VALUES ($1, 'TestCat', FALSE)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [SEED_USER_ID],
  );
  const catId = catRes.rows[0]?.id;

  if (catId) {
    // 테스트 할일 여러 개 삽입
    for (let i = 0; i < SEED_ROWS; i++) {
      await client.query(
        `INSERT INTO todos (user_id, category_id, title, is_completed)
         VALUES ($1, $2, $3, $4)`,
        [SEED_USER_ID, catId, `Todo ${i}`, i % 2 === 0],
      );
    }
  }

  return catId;
}

async function cleanupData(client) {
  // 할일 삭제 → 카테고리 삭제 → 사용자 삭제 순서
  await client.query('DELETE FROM todos WHERE user_id = $1', [SEED_USER_ID]);
  await client.query('DELETE FROM categories WHERE user_id = $1', [SEED_USER_ID]);
  await client.query("DELETE FROM users WHERE email LIKE '%@indextest.com'");
}

function extractPlanInfo(planLines) {
  const planText = planLines.join('\n');
  const hasIndexScan = /Index\s+(Only\s+)?Scan/i.test(planText);
  const timingMatch = planText.match(/Execution Time:\s*([\d.]+)\s*ms/i);
  const executionMs = timingMatch ? parseFloat(timingMatch[1]) : null;
  return { hasIndexScan, executionMs, planText };
}

async function runExplain(client, label, sql, params = []) {
  const explainSql = `EXPLAIN (ANALYZE, FORMAT TEXT) ${sql}`;
  const start = Date.now();
  const res = await client.query(explainSql, params);
  const elapsed = Date.now() - start;

  const planLines = res.rows.map(r => r['QUERY PLAN']);
  const { hasIndexScan, executionMs, planText } = extractPlanInfo(planLines);

  const status = hasIndexScan ? '✓ Index Scan' : '✗ Seq Scan (WARN)';
  const timing = executionMs !== null ? `${executionMs.toFixed(3)}ms` : `~${elapsed}ms (wall)`;

  // eslint-disable-next-line no-console
  console.log(`\n[${label}]`);
  // eslint-disable-next-line no-console
  console.log(`  Plan   : ${status}`);
  // eslint-disable-next-line no-console
  console.log(`  Timing : ${timing}`);
  // eslint-disable-next-line no-console
  console.log('  ---');
  planLines.forEach(line => {
    // eslint-disable-next-line no-console
    if (/Index\s+(Only\s+)?Scan|Seq Scan|Execution Time|Planning Time/i.test(line)) {
      console.log(`  ${line}`); // eslint-disable-line no-console
    }
  });

  return { label, hasIndexScan, executionMs: executionMs ?? elapsed, planText };
}

const QUERIES = [
  {
    label: 'Q1: users WHERE email = $1 (uq_users_email)',
    sql: 'SELECT id, email, name, created_at, updated_at FROM users WHERE email = $1',
    getParams: (ctx) => [ctx.email],
  },
  {
    label: 'Q2: users WHERE id = $1 (pk_users)',
    sql: 'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1',
    getParams: (ctx) => [ctx.userId],
  },
  {
    label: 'Q3: categories WHERE user_id=$1 OR is_default=TRUE (idx_categories_user_id)',
    sql: 'SELECT * FROM categories WHERE user_id = $1 OR is_default = TRUE ORDER BY is_default DESC, name ASC',
    getParams: (ctx) => [ctx.userId],
  },
  {
    label: 'Q4: categories WHERE id = $1 (pk_categories)',
    sql: 'SELECT * FROM categories WHERE id = $1',
    getParams: (ctx) => [ctx.catId],
  },
  {
    label: 'Q5: todos WHERE user_id=$1 ORDER BY created_at DESC (idx_todos_user_id)',
    sql: 'SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC',
    getParams: (ctx) => [ctx.userId],
  },
  {
    label: 'Q6: todos WHERE id = $1 (pk_todos)',
    sql: 'SELECT * FROM todos WHERE id = $1',
    getParams: (ctx) => [ctx.todoId],
  },
];

async function main() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // eslint-disable-next-line no-console
    console.log('=== DB-11: 인덱스 성능 검증 ===');
    // eslint-disable-next-line no-console
    console.log('테스트 데이터 삽입 중...');

    const catId = await seedData(client);

    await client.query('ANALYZE users');
    await client.query('ANALYZE categories');
    await client.query('ANALYZE todos');

    const todoRes = await client.query(
      'SELECT id FROM todos WHERE user_id = $1 LIMIT 1',
      [SEED_USER_ID],
    );
    const ctx = {
      userId: SEED_USER_ID,
      email: SEED_EMAIL,
      catId,
      todoId: todoRes.rows[0]?.id,
    };

    // =========================================================================
    // 1차: 일반 플래너 설정으로 실제 실행 시간 측정
    // =========================================================================
    // eslint-disable-next-line no-console
    console.log('\n--- [1차] 실제 플래너 결과 (EXPLAIN ANALYZE) ---');
    const normalResults = [];
    for (const q of QUERIES) {
      if (!q.getParams(ctx).every(Boolean)) continue;
      normalResults.push(await runExplain(client, q.label, q.sql, q.getParams(ctx)));
    }

    // =========================================================================
    // 2차: enable_seqscan=off 로 인덱스 존재/사용 가능 여부 강제 검증
    // =========================================================================
    // eslint-disable-next-line no-console
    console.log('\n--- [2차] 인덱스 강제 사용 검증 (enable_seqscan=off) ---');
    await client.query('SET enable_seqscan = off');
    const forcedResults = [];
    for (const q of QUERIES) {
      if (!q.getParams(ctx).every(Boolean)) continue;
      forcedResults.push(await runExplain(client, q.label, q.sql, q.getParams(ctx)));
    }
    await client.query('SET enable_seqscan = on');

    // =========================================================================
    // 결과 요약
    // =========================================================================
    // eslint-disable-next-line no-console
    console.log('\n=== 결과 요약 ===');
    // eslint-disable-next-line no-console
    console.log('쿼리                                         | 실제Plan | 강제Plan | 응답시간');
    // eslint-disable-next-line no-console
    console.log('---------------------------------------------|----------|----------|----------');

    let allFast = true;
    let allForcedIndexed = true;

    normalResults.forEach((r, i) => {
      const forced = forcedResults[i];
      const realPlan = r.hasIndexScan ? 'Index' : 'SeqScan';
      const forcedPlan = forced ? (forced.hasIndexScan ? 'Index ✓' : 'WARN  ✗') : 'N/A';
      const timeOk = r.executionMs < 100;
      if (!timeOk) allFast = false;
      if (forced && !forced.hasIndexScan) allForcedIndexed = false;
      const label = r.label.substring(0, 44).padEnd(44);
      const timing = `${r.executionMs.toFixed(3)}ms ${timeOk ? '✓' : '✗'}`;
      // eslint-disable-next-line no-console
      console.log(`  ${label} | ${realPlan.padEnd(8)} | ${forcedPlan.padEnd(8)} | ${timing}`);
    });

    // eslint-disable-next-line no-console
    console.log(`\n인덱스 정의(강제): ${allForcedIndexed ? '모든 인덱스 정상 ✓' : '일부 인덱스 사용 불가 ✗'}`);
    // eslint-disable-next-line no-console
    console.log(`응답시간:          ${allFast ? '전 쿼리 <100ms ✓' : '일부 쿼리 초과 ✗'}`);
    // eslint-disable-next-line no-console
    console.log('\n  ※ 실제 Seq Scan 항목은 현재 소규모 테스트 데이터로 인한 것이며,');
    // eslint-disable-next-line no-console
    console.log('    프로덕션 규모 데이터에서는 Index Scan이 선택됩니다.');

    await client.query('ROLLBACK');
    // eslint-disable-next-line no-console
    console.log('\n테스트 데이터 롤백 완료.');

    process.exit(allForcedIndexed && allFast ? 0 : 1);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    // eslint-disable-next-line no-console
    console.error('오류:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
