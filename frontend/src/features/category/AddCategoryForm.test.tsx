import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';
import { renderWithProviders } from '../../test/renderWithProviders';
import { AddCategoryForm } from './AddCategoryForm';

const mockMutate = vi.fn();
const mockReset = vi.fn();

vi.mock('./useCreateCategory', () => ({
  useCreateCategory: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
    error: null,
    isError: false,
    reset: mockReset,
  })),
}));

import { useCreateCategory } from './useCreateCategory';
const mockUseCreateCategory = useCreateCategory as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockUseCreateCategory.mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    error: null,
    isError: false,
    reset: mockReset,
  });
});

describe('AddCategoryForm', () => {
  it('초기에는 "카테고리 추가" 버튼을 렌더링한다', () => {
    renderWithProviders(<AddCategoryForm />);
    expect(screen.getByText('카테고리 추가')).toBeInTheDocument();
  });

  it('"카테고리 추가" 버튼 클릭 시 입력 폼이 표시된다', async () => {
    renderWithProviders(<AddCategoryForm />);
    await userEvent.click(screen.getByText('카테고리 추가'));
    expect(screen.getByRole('textbox', { name: '새 카테고리 이름' })).toBeInTheDocument();
  });

  it('이름 입력 후 제출 시 mutate를 호출한다', async () => {
    mockMutate.mockImplementation((_body: unknown, options: { onSuccess?: () => void }) => {
      options?.onSuccess?.();
    });

    renderWithProviders(<AddCategoryForm />);
    await userEvent.click(screen.getByText('카테고리 추가'));
    await userEvent.type(screen.getByRole('textbox', { name: '새 카테고리 이름' }), '독서');
    await userEvent.click(screen.getByRole('button', { name: '추가' }));

    expect(mockMutate).toHaveBeenCalledWith(
      { name: '독서' },
      expect.any(Object),
    );
  });

  it('이름이 비어있으면 mutate를 호출하지 않는다', async () => {
    renderWithProviders(<AddCategoryForm />);
    await userEvent.click(screen.getByText('카테고리 추가'));
    await userEvent.click(screen.getByRole('button', { name: '추가' }));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('취소 클릭 시 폼이 닫힌다', async () => {
    renderWithProviders(<AddCategoryForm />);
    await userEvent.click(screen.getByText('카테고리 추가'));
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('중복 이름 에러 시 오류 메시지를 표시한다 (BR-C-04)', async () => {
    mockUseCreateCategory.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: new ApiError(400, '이미 사용 중인 카테고리 이름입니다', 'DUPLICATE_CATEGORY'),
      isError: true,
      reset: mockReset,
    });

    renderWithProviders(<AddCategoryForm />);
    await userEvent.click(screen.getByText('카테고리 추가'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('이미 존재하는 이름입니다.');
    });
  });

  it('로딩 중에는 추가 버튼이 비활성화된다', async () => {
    mockUseCreateCategory.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      error: null,
      isError: false,
      reset: mockReset,
    });

    renderWithProviders(<AddCategoryForm />);
    await userEvent.click(screen.getByText('카테고리 추가'));
    expect(screen.getByRole('button', { name: '추가' })).toBeDisabled();
  });
});
