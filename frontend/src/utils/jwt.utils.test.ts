import { describe, expect, it } from 'vitest';
import { decodeTokenUserId } from './jwt.utils';

function makeJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe('decodeTokenUserId', () => {
  it('유효한 JWT에서 userId를 추출한다', () => {
    const token = makeJwt({ userId: 'user-123', iat: 1000 });
    expect(decodeTokenUserId(token)).toBe('user-123');
  });

  it('userId가 없는 토큰에서 빈 문자열을 반환한다', () => {
    const token = makeJwt({ sub: 'other' });
    expect(decodeTokenUserId(token)).toBe('');
  });

  it('잘못된 토큰 형식에서 빈 문자열을 반환한다', () => {
    expect(decodeTokenUserId('invalid-token')).toBe('');
  });

  it('빈 문자열 입력에서 빈 문자열을 반환한다', () => {
    expect(decodeTokenUserId('')).toBe('');
  });
});
