import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { Todo } from './todo.types';
import { TodoCard } from './TodoCard';

const mockToggle = vi.fn();
const mockDelete = vi.fn();

vi.mock('./useToggleTodoComplete', () => ({
  useToggleTodoComplete: () => ({ mutate: mockToggle, isPending: false }),
}));
vi.mock('./useDeleteTodo', () => ({
  useDeleteTodo: () => ({ mutate: mockDelete, isPending: false }),
}));

const baseTodo: Todo = {
  id: '1',
  user_id: 'u1',
  category_id: 'c1',
  title: 'SNS 캠페인 초안 작성',
  description: null,
  due_date: '2099-12-31',
  is_completed: false,
  completed_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => vi.clearAllMocks());

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TodoCard', () => {
  it('제목을 렌더링한다', () => {
    renderWithProviders(<TodoCard todo={baseTodo} />);
    expect(screen.getByText('SNS 캠페인 초안 작성')).toBeInTheDocument();
  });

  it('카테고리 이름을 렌더링한다', () => {
    renderWithProviders(<TodoCard todo={baseTodo} categoryName="업무" />);
    expect(screen.getByText('업무')).toBeInTheDocument();
  });

  it('종료예정일을 렌더링한다', () => {
    renderWithProviders(<TodoCard todo={baseTodo} />);
    expect(screen.getByText('2099-12-31')).toBeInTheDocument();
  });

  it('종료예정일이 없으면 "종료예정일 없음"을 렌더링한다', () => {
    renderWithProviders(<TodoCard todo={{ ...baseTodo, due_date: null }} />);
    expect(screen.getByText('종료예정일 없음')).toBeInTheDocument();
  });

  describe('체크박스', () => {
    it('미완료 상태에서 aria-pressed가 false이다', () => {
      renderWithProviders(<TodoCard todo={baseTodo} />);
      expect(screen.getByRole('button', { name: '완료로 표시' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('완료 상태에서 aria-pressed가 true이다', () => {
      renderWithProviders(<TodoCard todo={{ ...baseTodo, is_completed: true }} />);
      expect(screen.getByRole('button', { name: '완료 취소' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('클릭 시 toggleComplete를 호출한다', async () => {
      renderWithProviders(<TodoCard todo={baseTodo} />);
      await userEvent.click(screen.getByRole('button', { name: '완료로 표시' }));
      expect(mockToggle).toHaveBeenCalledWith({ id: '1', is_completed: true });
    });

    it('완료 상태에서 클릭 시 is_completed: false로 호출한다', async () => {
      renderWithProviders(<TodoCard todo={{ ...baseTodo, is_completed: true }} />);
      await userEvent.click(screen.getByRole('button', { name: '완료 취소' }));
      expect(mockToggle).toHaveBeenCalledWith({ id: '1', is_completed: false });
    });
  });

  describe('완료 스타일', () => {
    it('완료 상태에서 제목에 취소선이 적용된다', () => {
      renderWithProviders(<TodoCard todo={{ ...baseTodo, is_completed: true }} />);
      expect(screen.getByText('SNS 캠페인 초안 작성')).toHaveClass('line-through');
    });

    it('미완료 상태에서 제목에 취소선이 없다', () => {
      renderWithProviders(<TodoCard todo={baseTodo} />);
      expect(screen.getByText('SNS 캠페인 초안 작성')).not.toHaveClass('line-through');
    });
  });

  describe('기간 초과', () => {
    it('기간 초과 시 "(초과)" 텍스트가 표시된다', () => {
      const overdueTodo = { ...baseTodo, due_date: '2020-01-01' };
      renderWithProviders(<TodoCard todo={overdueTodo} />);
      expect(screen.getByText(/초과/)).toBeInTheDocument();
    });

    it('완료된 항목은 기간 초과이어도 "(초과)" 텍스트가 없다', () => {
      const completedOverdue = { ...baseTodo, due_date: '2020-01-01', is_completed: true };
      renderWithProviders(<TodoCard todo={completedOverdue} />);
      expect(screen.queryByText(/초과/)).toBeNull();
    });
  });

  describe('삭제', () => {
    it('삭제 버튼을 렌더링한다', () => {
      renderWithProviders(<TodoCard todo={baseTodo} />);
      expect(screen.getByRole('button', { name: /삭제/ })).toBeInTheDocument();
    });

    it('확인 후 deleteTodo를 호출한다', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      renderWithProviders(<TodoCard todo={baseTodo} />);
      await userEvent.click(screen.getByRole('button', { name: /삭제/ }));
      expect(mockDelete).toHaveBeenCalledWith('1');
    });

    it('확인 취소 시 deleteTodo를 호출하지 않는다', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      renderWithProviders(<TodoCard todo={baseTodo} />);
      await userEvent.click(screen.getByRole('button', { name: /삭제/ }));
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  describe('수정 버튼', () => {
    it('onEdit prop이 있으면 수정 버튼을 렌더링한다', () => {
      renderWithProviders(<TodoCard todo={baseTodo} onEdit={vi.fn()} />);
      expect(screen.getByRole('button', { name: /수정/ })).toBeInTheDocument();
    });

    it('onEdit prop이 없으면 수정 버튼을 렌더링하지 않는다', () => {
      renderWithProviders(<TodoCard todo={baseTodo} />);
      expect(screen.queryByRole('button', { name: /수정/ })).toBeNull();
    });

    it('수정 버튼 클릭 시 onEdit을 호출한다', async () => {
      const onEdit = vi.fn();
      renderWithProviders(<TodoCard todo={baseTodo} onEdit={onEdit} />);
      await userEvent.click(screen.getByRole('button', { name: /수정/ }));
      expect(onEdit).toHaveBeenCalledWith(baseTodo);
    });
  });
});
