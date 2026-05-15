import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { Todo } from './todo.types';
import { TodoList } from './TodoList';

const mockOnEdit = vi.fn();

vi.mock('./useTodos', () => ({
  useTodos: vi.fn(),
}));

vi.mock('../category/useCategories', () => ({
  useCategories: vi.fn(),
}));

vi.mock('./useToggleTodoComplete', () => ({
  useToggleTodoComplete: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('./useDeleteTodo', () => ({
  useDeleteTodo: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { useTodos } from './useTodos';
import { useCategories } from '../category/useCategories';

const baseTodo: Todo = {
  id: '1',
  user_id: 'u1',
  category_id: 'c1',
  title: '업무 처리하기',
  description: null,
  due_date: '2099-12-31',
  is_completed: false,
  completed_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useCategories).mockReturnValue({
    data: [{ id: 'c1', user_id: null, name: '업무', is_default: true, created_at: '' }],
  } as ReturnType<typeof useCategories>);
});

describe('TodoList', () => {
  it('로딩 중일 때 로딩 인디케이터를 표시한다', () => {
    vi.mocked(useTodos).mockReturnValue({ isLoading: true, isError: false, data: undefined } as ReturnType<typeof useTodos>);
    renderWithProviders(<TodoList onEdit={mockOnEdit} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('에러 시 에러 메시지를 표시한다', () => {
    vi.mocked(useTodos).mockReturnValue({ isLoading: false, isError: true, data: undefined } as ReturnType<typeof useTodos>);
    renderWithProviders(<TodoList onEdit={mockOnEdit} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('빈 목록이면 EmptyState를 렌더링한다', () => {
    vi.mocked(useTodos).mockReturnValue({ isLoading: false, isError: false, data: [] as Todo[] } as ReturnType<typeof useTodos>);
    renderWithProviders(<TodoList onEdit={mockOnEdit} />);
    expect(screen.getByRole('status', { name: /할일이 없습니다/ })).toBeInTheDocument();
  });

  it('할일 목록을 렌더링한다', () => {
    vi.mocked(useTodos).mockReturnValue({ isLoading: false, isError: false, data: [baseTodo] } as ReturnType<typeof useTodos>);
    renderWithProviders(<TodoList onEdit={mockOnEdit} />);
    expect(screen.getByText('업무 처리하기')).toBeInTheDocument();
  });

  it('여러 할일을 렌더링한다', () => {
    const todo2 = { ...baseTodo, id: '2', title: '개인 할일' };
    vi.mocked(useTodos).mockReturnValue({ isLoading: false, isError: false, data: [baseTodo, todo2] } as ReturnType<typeof useTodos>);
    renderWithProviders(<TodoList onEdit={mockOnEdit} />);
    expect(screen.getByText('업무 처리하기')).toBeInTheDocument();
    expect(screen.getByText('개인 할일')).toBeInTheDocument();
  });

  it('카테고리 이름을 TodoCard에 전달한다', () => {
    vi.mocked(useTodos).mockReturnValue({ isLoading: false, isError: false, data: [baseTodo] } as ReturnType<typeof useTodos>);
    renderWithProviders(<TodoList onEdit={mockOnEdit} />);
    expect(screen.getByText('업무')).toBeInTheDocument();
  });

  it('수정 버튼 클릭 시 onEdit을 호출한다', async () => {
    vi.mocked(useTodos).mockReturnValue({ isLoading: false, isError: false, data: [baseTodo] } as ReturnType<typeof useTodos>);
    renderWithProviders(<TodoList onEdit={mockOnEdit} />);
    await userEvent.click(screen.getByRole('button', { name: /수정/ }));
    expect(mockOnEdit).toHaveBeenCalledWith(baseTodo);
  });
});
