import { describe, expect, it } from 'vitest';
import type { ApiErrorResponse } from './api.types';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../features/auth/auth.types';
import type { Todo, CreateTodoRequest, UpdateTodoRequest, TodoFilters, ToggleTodoCompleteRequest } from '../features/todo/todo.types';
import type { Category, CreateCategoryRequest } from '../features/category/category.types';
import type { UserProfile, UpdateUserRequest } from '../features/user/user.types';

describe('타입 정의 구조 검증', () => {
  describe('ApiErrorResponse', () => {
    it('message와 code 필드를 포함한다', () => {
      const err: ApiErrorResponse = { message: '오류 발생', code: 'ERROR' };
      expect(err.message).toBe('오류 발생');
      expect(err.code).toBe('ERROR');
    });
  });

  describe('auth.types', () => {
    it('User 타입이 필수 필드를 포함한다', () => {
      const user: User = {
        id: 'user-1',
        email: 'test@example.com',
        name: '홍길동',
        created_at: '2026-05-14T00:00:00Z',
        updated_at: '2026-05-14T00:00:00Z',
      };
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
    });

    it('LoginRequest가 email과 password를 요구한다', () => {
      const req: LoginRequest = { email: 'test@example.com', password: 'password123' };
      expect(req.email).toBeDefined();
      expect(req.password).toBeDefined();
    });

    it('RegisterRequest가 email, password, name을 요구한다', () => {
      const req: RegisterRequest = { email: 'test@example.com', password: 'password123', name: '홍길동' };
      expect(req.name).toBeDefined();
    });

    it('AuthResponse가 accessToken을 포함한다', () => {
      const res: AuthResponse = { accessToken: 'jwt-token' };
      expect(res.accessToken).toBeDefined();
    });
  });

  describe('todo.types', () => {
    it('Todo 타입이 snake_case 필드를 사용한다', () => {
      const todo: Todo = {
        id: 'todo-1',
        user_id: 'user-1',
        category_id: 'cat-1',
        title: '할일 제목',
        description: null,
        due_date: null,
        is_completed: false,
        completed_at: null,
        created_at: '2026-05-14T00:00:00Z',
        updated_at: '2026-05-14T00:00:00Z',
      };
      expect(todo.is_completed).toBe(false);
      expect(todo.due_date).toBeNull();
    });

    it('CreateTodoRequest에서 title과 category_id가 필수다', () => {
      const req: CreateTodoRequest = { title: '새 할일', category_id: 'cat-1' };
      expect(req.title).toBeDefined();
      expect(req.category_id).toBeDefined();
    });

    it('UpdateTodoRequest의 모든 필드가 선택적이다', () => {
      const req: UpdateTodoRequest = {};
      expect(req).toBeDefined();
    });

    it('TodoFilters의 모든 필드가 선택적이다', () => {
      const filters: TodoFilters = {};
      expect(filters).toBeDefined();
    });

    it('ToggleTodoCompleteRequest가 is_completed를 요구한다', () => {
      const req: ToggleTodoCompleteRequest = { is_completed: true };
      expect(req.is_completed).toBe(true);
    });
  });

  describe('category.types', () => {
    it('Category 타입이 필수 필드를 포함한다', () => {
      const cat: Category = {
        id: 'cat-1',
        user_id: null,
        name: '개인',
        is_default: true,
        created_at: '2026-05-14T00:00:00Z',
      };
      expect(cat.is_default).toBe(true);
      expect(cat.user_id).toBeNull();
    });

    it('CreateCategoryRequest가 name을 요구한다', () => {
      const req: CreateCategoryRequest = { name: '새 카테고리' };
      expect(req.name).toBeDefined();
    });
  });

  describe('user.types', () => {
    it('UserProfile이 email을 포함한다', () => {
      const profile: UserProfile = {
        id: 'user-1',
        email: 'test@example.com',
        name: '홍길동',
        created_at: '2026-05-14T00:00:00Z',
        updated_at: '2026-05-14T00:00:00Z',
      };
      expect(profile.email).toBeDefined();
    });

    it('UpdateUserRequest의 모든 필드가 선택적이다', () => {
      const req: UpdateUserRequest = {};
      expect(req).toBeDefined();
    });

    it('UpdateUserRequest에 current_password와 new_password를 포함할 수 있다', () => {
      const req: UpdateUserRequest = { current_password: 'old', new_password: 'newpass123' };
      expect(req.current_password).toBeDefined();
      expect(req.new_password).toBeDefined();
    });
  });
});
