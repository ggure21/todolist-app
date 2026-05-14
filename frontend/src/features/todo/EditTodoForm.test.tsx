import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { Todo } from './todo.types';
import { EditTodoForm } from './EditTodoForm';

const mockMutate = vi.fn();

vi.mock('./useUpdateTodo', () => ({
  useUpdateTodo: () => ({ mutate: mockMutate, isPending: false }),
}));

vi.mock('../category/useCategories', () => ({
  useCategories: vi.fn(() => ({
    data: [
      { id: 'c1', user_id: null, name: '개인', is_default: true, created_at: '' },
      { id: 'c2', user_id: null, name: '업무', is_default: true, created_at: '' },
    ],
    isLoading: false,
  })),
}));

const baseTodo: Todo = {
  id: 'todo-1',
  user_id: 'u1',
  category_id: 'c1',
  title: '기존 제목',
  description: '기존 설명',
  due_date: '2099-12-31',
  is_completed: false,
  completed_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockOnCancel = vi.fn();

beforeEach(() => vi.clearAllMocks());

describe('EditTodoForm', () => {
  it('기존 제목이 입력 필드에 초기화된다', () => {
    renderWithProviders(<EditTodoForm todo={baseTodo} onCancel={mockOnCancel} />);
    expect(screen.getByLabelText('제목')).toHaveValue('기존 제목');
  });

  it('기존 카테고리가 선택 드롭다운에 초기화된다', () => {
    renderWithProviders(<EditTodoForm todo={baseTodo} onCancel={mockOnCancel} />);
    expect(screen.getByLabelText('카테고리')).toHaveValue('c1');
  });

  it('기존 설명이 입력 필드에 초기화된다', () => {
    renderWithProviders(<EditTodoForm todo={baseTodo} onCancel={mockOnCancel} />);
    expect(screen.getByLabelText('설명')).toHaveValue('기존 설명');
  });

  it('기존 종료예정일이 입력 필드에 초기화된다', () => {
    renderWithProviders(<EditTodoForm todo={baseTodo} onCancel={mockOnCancel} />);
    expect(screen.getByLabelText('종료예정일')).toHaveValue('2099-12-31');
  });

  it('수정 버튼 레이블이 "수정"이다', () => {
    renderWithProviders(<EditTodoForm todo={baseTodo} onCancel={mockOnCancel} />);
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
  });

  it('제출 시 useUpdateTodo.mutate를 id와 body로 호출한다', async () => {
    renderWithProviders(<EditTodoForm todo={baseTodo} onCancel={mockOnCancel} />);
    await userEvent.click(screen.getByRole('button', { name: '수정' }));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'todo-1',
        body: expect.objectContaining({ title: '기존 제목', category_id: 'c1' }),
      }),
      expect.any(Object),
    );
  });

  it('취소 버튼 클릭 시 onCancel을 호출한다', async () => {
    renderWithProviders(<EditTodoForm todo={baseTodo} onCancel={mockOnCancel} />);
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('성공 콜백 시 onCancel을 호출한다', async () => {
    mockMutate.mockImplementation((_data: unknown, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess();
    });
    renderWithProviders(<EditTodoForm todo={baseTodo} onCancel={mockOnCancel} />);
    await userEvent.click(screen.getByRole('button', { name: '수정' }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('description이 null인 todo는 빈 문자열로 초기화된다', () => {
    renderWithProviders(
      <EditTodoForm todo={{ ...baseTodo, description: null }} onCancel={mockOnCancel} />,
    );
    expect(screen.getByLabelText('설명')).toHaveValue('');
  });

  it('due_date가 null인 todo는 빈 문자열로 초기화된다', () => {
    renderWithProviders(
      <EditTodoForm todo={{ ...baseTodo, due_date: null }} onCancel={mockOnCancel} />,
    );
    expect(screen.getByLabelText('종료예정일')).toHaveValue('');
  });
});
