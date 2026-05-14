import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from './client';
import { categoryApi } from './category.api';

vi.mock('./client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const mockApi = client.api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

describe('categoryApi.getCategories', () => {
  it('GET /api/categories를 호출한다', async () => {
    mockApi.get.mockResolvedValueOnce([]);
    await categoryApi.getCategories();
    expect(mockApi.get).toHaveBeenCalledWith('/api/categories');
  });

  it('카테고리 배열을 반환한다', async () => {
    const categories = [
      { id: 'cat-1', name: '개인', is_default: true, user_id: null, created_at: '' },
    ];
    mockApi.get.mockResolvedValueOnce(categories);
    const result = await categoryApi.getCategories();
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('개인');
  });
});

describe('categoryApi.createCategory', () => {
  it('POST /api/categories를 호출한다', async () => {
    const category = { id: 'cat-2', name: '새 카테고리', is_default: false, user_id: 'u1', created_at: '' };
    mockApi.post.mockResolvedValueOnce(category);
    const body = { name: '새 카테고리' };

    const result = await categoryApi.createCategory(body);

    expect(mockApi.post).toHaveBeenCalledWith('/api/categories', body);
    expect(result.name).toBe('새 카테고리');
  });
});
