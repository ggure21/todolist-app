import type { Category, CreateCategoryRequest } from '../features/category/category.types';
import { api } from './client';

export const categoryApi = {
  getCategories: (): Promise<Category[]> =>
    api.get('/api/categories'),

  createCategory: (body: CreateCategoryRequest): Promise<Category> =>
    api.post('/api/categories', body),
};
