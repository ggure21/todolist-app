import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import TodoListPage from './TodoListPage';
import type { Todo } from '../features/todo/todo.types';

vi.mock('../components/Header', () => ({
  Header: () => <header>Header</header>,
}));

vi.mock('../features/category/CategoryList', () => ({
  CategoryList: () => <div data-testid="category-list">CategoryList</div>,
}));

vi.mock('../features/todo/FilterBar', () => ({
  FilterBar: () => <div data-testid="filter-bar">FilterBar</div>,
}));

vi.mock('../features/todo/CreateTodoForm', () => ({
  CreateTodoForm: () => <div data-testid="create-todo-form">CreateTodoForm</div>,
}));

vi.mock('../features/todo/EditTodoForm', () => ({
  EditTodoForm: ({ onCancel }: { todo: Todo; onCancel: () => void }) => (
    <div data-testid="edit-todo-form">
      <button onClick={onCancel}>수정취소</button>
    </div>
  ),
}));

const mockOnEdit = vi.fn();

vi.mock('../features/todo/TodoList', () => ({
  TodoList: ({ onEdit }: { onEdit: (todo: Todo) => void }) => {
    mockOnEdit.mockImplementation(onEdit);
    return <div data-testid="todo-list">TodoList</div>;
  },
}));

describe('TodoListPage', () => {
  it('FilterBar를 렌더링한다', () => {
    renderWithProviders(<TodoListPage />);
    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
  });

  it('CreateTodoForm을 렌더링한다', () => {
    renderWithProviders(<TodoListPage />);
    expect(screen.getByTestId('create-todo-form')).toBeInTheDocument();
  });

  it('TodoList를 렌더링한다', () => {
    renderWithProviders(<TodoListPage />);
    expect(screen.getByTestId('todo-list')).toBeInTheDocument();
  });

  it('CategoryList를 사이드바로 렌더링한다', () => {
    renderWithProviders(<TodoListPage />);
    expect(screen.getByTestId('category-list')).toBeInTheDocument();
  });

  it('초기에 EditTodoForm을 렌더링하지 않는다', () => {
    renderWithProviders(<TodoListPage />);
    expect(screen.queryByTestId('edit-todo-form')).toBeNull();
  });

  it('onEdit 호출 시 EditTodoForm을 표시한다', async () => {
    renderWithProviders(<TodoListPage />);
    const fakeTodo: Todo = {
      id: 't1', user_id: 'u1', category_id: 'c1', title: '수정할 할일',
      description: null, due_date: null, is_completed: false,
      completed_at: null, created_at: '', updated_at: '',
    };
    act(() => { mockOnEdit(fakeTodo); });
    expect(screen.getByTestId('edit-todo-form')).toBeInTheDocument();
  });

  it('EditTodoForm 취소 시 폼을 숨긴다', async () => {
    renderWithProviders(<TodoListPage />);
    const fakeTodo: Todo = {
      id: 't1', user_id: 'u1', category_id: 'c1', title: '수정할 할일',
      description: null, due_date: null, is_completed: false,
      completed_at: null, created_at: '', updated_at: '',
    };
    act(() => { mockOnEdit(fakeTodo); });
    await userEvent.click(screen.getByRole('button', { name: '수정취소' }));
    expect(screen.queryByTestId('edit-todo-form')).toBeNull();
  });
});
