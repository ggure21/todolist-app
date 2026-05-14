import { beforeEach, describe, expect, it } from 'vitest';
import { useFilterStore } from './filterStore';

beforeEach(() => {
  useFilterStore.setState({ category_id: null, is_completed: null, overdue: null });
});

describe('filterStore', () => {
  describe('초기 상태', () => {
    it('category_id가 null이어야 한다', () => {
      expect(useFilterStore.getState().category_id).toBeNull();
    });

    it('is_completed가 null이어야 한다', () => {
      expect(useFilterStore.getState().is_completed).toBeNull();
    });

    it('overdue가 null이어야 한다', () => {
      expect(useFilterStore.getState().overdue).toBeNull();
    });
  });

  describe('setFilter', () => {
    it('category_id만 설정할 수 있다 (BR-F-01)', () => {
      useFilterStore.getState().setFilter({ category_id: 'cat-uuid-1' });

      expect(useFilterStore.getState().category_id).toBe('cat-uuid-1');
      expect(useFilterStore.getState().is_completed).toBeNull();
      expect(useFilterStore.getState().overdue).toBeNull();
    });

    it('is_completed만 설정할 수 있다 (BR-F-03)', () => {
      useFilterStore.getState().setFilter({ is_completed: false });

      expect(useFilterStore.getState().category_id).toBeNull();
      expect(useFilterStore.getState().is_completed).toBe(false);
      expect(useFilterStore.getState().overdue).toBeNull();
    });

    it('overdue만 설정할 수 있다 (BR-F-02)', () => {
      useFilterStore.getState().setFilter({ overdue: true });

      expect(useFilterStore.getState().category_id).toBeNull();
      expect(useFilterStore.getState().is_completed).toBeNull();
      expect(useFilterStore.getState().overdue).toBe(true);
    });

    it('복수 필터를 동시에 설정할 수 있다 (BR-F-04 AND 조건)', () => {
      useFilterStore.getState().setFilter({
        category_id: 'cat-uuid-1',
        is_completed: false,
        overdue: true,
      });

      expect(useFilterStore.getState().category_id).toBe('cat-uuid-1');
      expect(useFilterStore.getState().is_completed).toBe(false);
      expect(useFilterStore.getState().overdue).toBe(true);
    });

    it('기존 필터를 유지하면서 부분 업데이트한다', () => {
      useFilterStore.getState().setFilter({ category_id: 'cat-uuid-1', overdue: true });
      useFilterStore.getState().setFilter({ is_completed: true });

      expect(useFilterStore.getState().category_id).toBe('cat-uuid-1');
      expect(useFilterStore.getState().overdue).toBe(true);
      expect(useFilterStore.getState().is_completed).toBe(true);
    });

    it('is_completed를 true로 설정할 수 있다', () => {
      useFilterStore.getState().setFilter({ is_completed: true });
      expect(useFilterStore.getState().is_completed).toBe(true);
    });

    it('category_id를 null로 초기화할 수 있다', () => {
      useFilterStore.getState().setFilter({ category_id: 'cat-uuid-1' });
      useFilterStore.getState().setFilter({ category_id: null });

      expect(useFilterStore.getState().category_id).toBeNull();
    });
  });

  describe('resetFilter', () => {
    it('모든 필터를 null로 초기화한다', () => {
      useFilterStore.getState().setFilter({
        category_id: 'cat-uuid-1',
        is_completed: false,
        overdue: true,
      });

      useFilterStore.getState().resetFilter();

      expect(useFilterStore.getState().category_id).toBeNull();
      expect(useFilterStore.getState().is_completed).toBeNull();
      expect(useFilterStore.getState().overdue).toBeNull();
    });

    it('이미 초기 상태에서 resetFilter를 호출해도 오류가 없다', () => {
      expect(() => useFilterStore.getState().resetFilter()).not.toThrow();
    });
  });
});
