import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { CreateTodoForm } from './CreateTodoForm';

const mockMutate = vi.fn();

vi.mock('./useCreateTodo', () => ({
  useCreateTodo: () => ({ mutate: mockMutate, isPending: false }),
}));

vi.mock('../category/useCategories', () => ({
  useCategories: vi.fn(() => ({
    data: [
      { id: 'c1', user_id: null, name: '개인', is_default: true, created_at: '' },
    ],
    isLoading: false,
  })),
}));

beforeEach(() => vi.clearAllMocks());

describe('CreateTodoForm', () => {
  it('초기에 "할일 추가" 버튼을 렌더링한다', () => {
    renderWithProviders(<CreateTodoForm />);
    expect(screen.getByRole('button', { name: /할일 추가/ })).toBeInTheDocument();
  });

  it('초기에 폼을 표시하지 않는다', () => {
    renderWithProviders(<CreateTodoForm />);
    expect(screen.queryByLabelText('제목')).toBeNull();
  });

  it('버튼 클릭 시 폼을 표시한다', async () => {
    renderWithProviders(<CreateTodoForm />);
    await userEvent.click(screen.getByRole('button', { name: /할일 추가/ }));
    expect(screen.getByLabelText('제목')).toBeInTheDocument();
  });

  it('취소 버튼 클릭 시 폼을 숨긴다', async () => {
    renderWithProviders(<CreateTodoForm />);
    await userEvent.click(screen.getByRole('button', { name: /할일 추가/ }));
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByLabelText('제목')).toBeNull();
    expect(screen.getByRole('button', { name: /할일 추가/ })).toBeInTheDocument();
  });

  it('폼 제출 시 useCreateTodo.mutate를 호출한다', async () => {
    renderWithProviders(<CreateTodoForm />);
    await userEvent.click(screen.getByRole('button', { name: /할일 추가/ }));
    await userEvent.type(screen.getByLabelText('제목'), '새 할일');
    await userEvent.selectOptions(screen.getByLabelText('카테고리'), 'c1');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ title: '새 할일', category_id: 'c1' }),
      expect.any(Object),
    );
  });

  it('성공 콜백 시 폼을 닫는다', async () => {
    mockMutate.mockImplementation((_data: unknown, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess();
    });
    renderWithProviders(<CreateTodoForm />);
    await userEvent.click(screen.getByRole('button', { name: /할일 추가/ }));
    await userEvent.type(screen.getByLabelText('제목'), '새 할일');
    await userEvent.selectOptions(screen.getByLabelText('카테고리'), 'c1');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(screen.queryByLabelText('제목')).toBeNull();
  });
});
