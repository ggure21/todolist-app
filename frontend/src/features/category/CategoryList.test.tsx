import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { CategoryList } from './CategoryList';

vi.mock('./useCategories', () => ({
  useCategories: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

vi.mock('./AddCategoryForm', () => ({
  AddCategoryForm: () => <div data-testid="add-category-form" />,
}));

const mockSetFilter = vi.fn();
let mockCategoryId: string | null = null;

vi.mock('../../stores/filterStore', () => ({
  useFilterStore: vi.fn((selector: (s: { category_id: string | null; setFilter: typeof mockSetFilter }) => unknown) =>
    selector({ category_id: mockCategoryId, setFilter: mockSetFilter }),
  ),
}));

import { useCategories } from './useCategories';
const mockUseCategories = useCategories as ReturnType<typeof vi.fn>;

const mockCategories = [
  { id: '1', user_id: null, name: '개인', is_default: true, created_at: '2024-01-01T00:00:00Z' },
  { id: '2', user_id: null, name: '업무', is_default: true, created_at: '2024-01-01T00:00:00Z' },
  { id: '3', user_id: 'u1', name: '가정', is_default: false, created_at: '2024-01-01T00:00:00Z' },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockCategoryId = null;
  mockUseCategories.mockReturnValue({ data: mockCategories, isLoading: false });
});

describe('CategoryList', () => {
  it('카테고리 목록을 렌더링한다', () => {
    renderWithProviders(<CategoryList />);
    expect(screen.getByText('전체')).toBeInTheDocument();
    expect(screen.getByText('개인')).toBeInTheDocument();
    expect(screen.getByText('업무')).toBeInTheDocument();
    expect(screen.getByText('가정')).toBeInTheDocument();
  });

  it('"전체" 클릭 시 category_id: null로 필터를 설정한다', async () => {
    renderWithProviders(<CategoryList />);
    await userEvent.click(screen.getByRole('button', { name: /전체/ }));
    expect(mockSetFilter).toHaveBeenCalledWith({ category_id: null });
  });

  it('카테고리 클릭 시 해당 category_id로 필터를 설정한다', async () => {
    renderWithProviders(<CategoryList />);
    await userEvent.click(screen.getByRole('button', { name: /개인/ }));
    expect(mockSetFilter).toHaveBeenCalledWith({ category_id: '1' });
  });

  it('선택된 카테고리에 aria-current가 설정된다', () => {
    mockCategoryId = '1';
    mockUseCategories.mockReturnValue({ data: mockCategories, isLoading: false });
    renderWithProviders(<CategoryList />);
    expect(screen.getByRole('button', { name: /개인/ })).toHaveAttribute('aria-current', 'true');
  });

  it('selectedId가 null일 때 "전체"에 aria-current가 설정된다', () => {
    mockCategoryId = null;
    renderWithProviders(<CategoryList />);
    expect(screen.getByRole('button', { name: /전체/ })).toHaveAttribute('aria-current', 'true');
  });

  it('로딩 중에는 로딩 메시지를 표시한다', () => {
    mockUseCategories.mockReturnValue({ data: [], isLoading: true });
    renderWithProviders(<CategoryList />);
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('AddCategoryForm을 렌더링한다', () => {
    renderWithProviders(<CategoryList />);
    expect(screen.getByTestId('add-category-form')).toBeInTheDocument();
  });

  it('nav role과 aria-label을 가진다', () => {
    renderWithProviders(<CategoryList />);
    expect(screen.getByRole('navigation', { name: '카테고리 목록' })).toBeInTheDocument();
  });
});
