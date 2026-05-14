import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from './authStore';

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, userId: null });
});

describe('authStore', () => {
  describe('초기 상태', () => {
    it('accessToken이 null이어야 한다', () => {
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('userId가 null이어야 한다', () => {
      expect(useAuthStore.getState().userId).toBeNull();
    });
  });

  describe('setAuth', () => {
    it('accessToken과 userId를 설정한다', () => {
      const token = 'test-access-token';
      const userId = 'user-123';

      useAuthStore.getState().setAuth(token, userId);

      expect(useAuthStore.getState().accessToken).toBe(token);
      expect(useAuthStore.getState().userId).toBe(userId);
    });

    it('토큰을 덮어쓸 수 있다', () => {
      useAuthStore.getState().setAuth('first-token', 'user-1');
      useAuthStore.getState().setAuth('second-token', 'user-2');

      expect(useAuthStore.getState().accessToken).toBe('second-token');
      expect(useAuthStore.getState().userId).toBe('user-2');
    });
  });

  describe('clearAuth', () => {
    it('setAuth 후 clearAuth를 호출하면 null로 초기화된다', () => {
      useAuthStore.getState().setAuth('test-token', 'user-123');
      useAuthStore.getState().clearAuth();

      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().userId).toBeNull();
    });

    it('이미 null 상태에서 clearAuth를 호출해도 오류가 없다', () => {
      expect(() => useAuthStore.getState().clearAuth()).not.toThrow();
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().userId).toBeNull();
    });
  });

  describe('보안: localStorage/sessionStorage 미사용', () => {
    it('localStorage에 토큰을 저장하지 않는다', () => {
      useAuthStore.getState().setAuth('test-token', 'user-123');

      const localStorageValues = Object.values(localStorage).join('');
      expect(localStorageValues).not.toContain('test-token');
    });

    it('sessionStorage에 토큰을 저장하지 않는다', () => {
      useAuthStore.getState().setAuth('test-token', 'user-123');

      const sessionStorageValues = Object.values(sessionStorage).join('');
      expect(sessionStorageValues).not.toContain('test-token');
    });
  });
});
