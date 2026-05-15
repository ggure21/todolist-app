import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '../api/client';
import { getErrorMessage, getStatusErrorMessage } from './error.utils';

describe('getErrorMessage', () => {
  it('ApiError의 code에 해당하는 사용자 메시지를 반환한다', () => {
    const err = new ApiError(400, '...', 'DUPLICATE_EMAIL');
    expect(getErrorMessage(err)).toBe('이미 사용 중인 이메일입니다.');
  });

  it('INVALID_CREDENTIALS 코드에 맞는 메시지를 반환한다', () => {
    const err = new ApiError(401, '...', 'INVALID_CREDENTIALS');
    expect(getErrorMessage(err)).toBe('이메일 또는 비밀번호가 올바르지 않습니다.');
  });

  it('INVALID_PASSWORD 코드에 맞는 메시지를 반환한다', () => {
    const err = new ApiError(400, '...', 'INVALID_PASSWORD');
    expect(getErrorMessage(err)).toBe('현재 비밀번호가 올바르지 않습니다.');
  });

  it('알 수 없는 ApiError code는 error.message를 반환한다', () => {
    const err = new ApiError(500, '알 수 없는 API 오류', 'CUSTOM_CODE');
    expect(getErrorMessage(err)).toBe('알 수 없는 API 오류');
  });

  it('일반 Error 인스턴스는 message를 반환한다', () => {
    const err = new Error('일반 오류');
    expect(getErrorMessage(err)).toBe('일반 오류');
  });

  it('Error가 아닌 값은 기본 메시지를 반환한다', () => {
    expect(getErrorMessage('문자열 오류')).toBe('알 수 없는 오류가 발생했습니다.');
    expect(getErrorMessage(null)).toBe('알 수 없는 오류가 발생했습니다.');
    expect(getErrorMessage(undefined)).toBe('알 수 없는 오류가 발생했습니다.');
  });

  it('FORBIDDEN 코드에 맞는 메시지를 반환한다', () => {
    const err = new ApiError(403, '...', 'FORBIDDEN');
    expect(getErrorMessage(err)).toBe('접근 권한이 없습니다.');
  });

  describe('네트워크 에러', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
    });
    afterEach(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    });

    it('오프라인 상태의 Error는 네트워크 에러 메시지를 반환한다', () => {
      const err = new Error('Failed to fetch');
      expect(getErrorMessage(err)).toBe('네트워크 연결을 확인해주세요.');
    });
  });
});

describe('getStatusErrorMessage', () => {
  it('400은 입력 확인 메시지를 반환한다', () => {
    expect(getStatusErrorMessage(400)).toContain('입력한 정보');
  });

  it('401은 인증 필요 메시지를 반환한다', () => {
    expect(getStatusErrorMessage(401)).toContain('로그인');
  });

  it('403은 권한 없음 메시지를 반환한다', () => {
    expect(getStatusErrorMessage(403)).toContain('권한');
  });

  it('404는 찾을 수 없음 메시지를 반환한다', () => {
    expect(getStatusErrorMessage(404)).toContain('찾을 수 없습니다');
  });

  it('500은 서버 오류 메시지를 반환한다', () => {
    expect(getStatusErrorMessage(500)).toContain('서버 오류');
  });

  it('502는 서버 오류 메시지를 반환한다', () => {
    expect(getStatusErrorMessage(502)).toContain('서버 오류');
  });

  it('503은 서버 오류 메시지를 반환한다', () => {
    expect(getStatusErrorMessage(503)).toContain('서버 오류');
  });
});
