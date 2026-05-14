import { describe, expect, it } from 'vitest';
import { QUERY_KEYS } from './queryKeys.constants';
import type { TodoFilters } from '../features/todo/todo.types';

describe('QUERY_KEYS', () => {
  describe('todos', () => {
    it('todos.all이 ["todos"] 배열이다', () => {
      expect(QUERY_KEYS.todos.all).toEqual(['todos']);
    });

    it('todos.filtered는 필터 객체를 포함하는 배열을 반환한다', () => {
      const filters: TodoFilters = { category_id: 'cat-1', is_completed: false };
      const key = QUERY_KEYS.todos.filtered(filters);

      expect(key[0]).toBe('todos');
      expect(key[1]).toEqual(filters);
    });

    it('todos.filtered는 빈 필터에도 동작한다', () => {
      const key = QUERY_KEYS.todos.filtered({});
      expect(key).toEqual(['todos', {}]);
    });

    it('todos.filtered는 서로 다른 필터에 대해 다른 키를 반환한다', () => {
      const key1 = QUERY_KEYS.todos.filtered({ is_completed: true });
      const key2 = QUERY_KEYS.todos.filtered({ is_completed: false });

      expect(key1).not.toEqual(key2);
    });
  });

  describe('categories', () => {
    it('categories.all이 ["categories"] 배열이다', () => {
      expect(QUERY_KEYS.categories.all).toEqual(['categories']);
    });
  });

  describe('user', () => {
    it('user.me가 ["user", "me"] 배열이다', () => {
      expect(QUERY_KEYS.user.me).toEqual(['user', 'me']);
    });
  });

  describe('키 구조 유효성', () => {
    it('todos와 categories는 서로 다른 최상위 키를 가진다', () => {
      expect(QUERY_KEYS.todos.all[0]).not.toBe(QUERY_KEYS.categories.all[0]);
    });

    it('todos와 user는 서로 다른 최상위 키를 가진다', () => {
      expect(QUERY_KEYS.todos.all[0]).not.toBe(QUERY_KEYS.user.me[0]);
    });
  });
});
