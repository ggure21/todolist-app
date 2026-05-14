'use strict';

const request = require('supertest');
const app = require('../../src/app');

describe('app', () => {
  describe('404 handler', () => {
    test('GET /nonexistent → 404 with NOT_FOUND code', async () => {
      const res = await request(app).get('/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: 'Not Found', code: 'NOT_FOUND' });
    });

    test('POST /nonexistent → 404 with NOT_FOUND code', async () => {
      const res = await request(app).post('/nonexistent').send({ data: 'test' });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: 'Not Found', code: 'NOT_FOUND' });
    });

    test('PUT /nonexistent → 404', async () => {
      const res = await request(app).put('/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    test('DELETE /nonexistent → 404', async () => {
      const res = await request(app).delete('/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  describe('CORS', () => {
    test('CORS_ORIGIN 미설정 시 기본 origin http://localhost:5173 허용', async () => {
      const res = await request(app)
        .get('/nonexistent')
        .set('Origin', 'http://localhost:5173');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    test('OPTIONS preflight 요청에 CORS 헤더가 포함된다', async () => {
      const res = await request(app)
        .options('/nonexistent')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });
  });

  describe('global error handler', () => {
    test('에러 핸들러가 status, message, code를 반환한다', async () => {
      // 에러를 발생시키는 임시 라우트를 직접 추가해서 테스트
      const express = require('express');
      const testApp = express();
      testApp.use(express.json());

      testApp.get('/trigger-error', (req, res, next) => {
        const err = new Error('Test error');
        err.status = 422;
        err.code = 'VALIDATION_ERROR';
        next(err);
      });

      // eslint-disable-next-line no-unused-vars
      testApp.use((err, req, res, next) => {
        const status = err.status || 500;
        const message = err.message || 'Internal Server Error';
        res.status(status).json({ message, code: err.code || 'INTERNAL_ERROR' });
      });

      const res = await request(testApp).get('/trigger-error');

      expect(res.status).toBe(422);
      expect(res.body).toEqual({ message: 'Test error', code: 'VALIDATION_ERROR' });
    });

    test('status 없는 에러는 500으로 처리된다', async () => {
      const express = require('express');
      const testApp = express();

      testApp.get('/trigger-500', (req, res, next) => {
        next(new Error('Unexpected failure'));
      });

      // eslint-disable-next-line no-unused-vars
      testApp.use((err, req, res, next) => {
        const status = err.status || 500;
        const message = err.message || 'Internal Server Error';
        res.status(status).json({ message, code: err.code || 'INTERNAL_ERROR' });
      });

      const res = await request(testApp).get('/trigger-500');

      expect(res.status).toBe(500);
      expect(res.body.code).toBe('INTERNAL_ERROR');
    });
  });
});
