import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { FilterBar } from './FilterBar';

vi.mock('../category/useCategories', () => ({
  useCategories: vi.fn(() => ({
    data: [
      { id: '1', user_id: null, name: '개인', is_default: true, created_at: '' },
      { id: '2', user_id: null, name: '업무', is_default: true, created_at: '' },
    ],
  })),
}));

const mockSetFilter = vi.fn();
const mockResetFilter = vi.fn();

let mockState = {
  category_id: null as string | null,
  is_completed: null as boolean | null,
  overdue: null as boolean | null,
};

vi.mock('../../stores/filterStore', () => ({
  useFilterStore: vi.fn(() => ({
    ...mockState,
    setFilter: mockSetFilter,
    resetFilter: mockResetFilter,
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockState = { category_id: null, is_completed: null, overdue: null };
});

describe('FilterBar', () => {
  it('카테고리, 기간초과, 완료여부 드롭다운을 렌더링한다', () => {
    renderWithProviders(<FilterBar />);
    expect(screen.getByLabelText('카테고리')).toBeInTheDocument();
    expect(screen.getByLabelText('기간초과')).toBeInTheDocument();
    expect(screen.getByLabelText('완료여부')).toBeInTheDocument();
  });

  it('카테고리 드롭다운에 "전체" + 카테고리 목록이 있다', () => {
    renderWithProviders(<FilterBar />);
    const select = screen.getByLabelText('카테고리');
    expect(select).toHaveValue('');
    const options = Array.from((select as HTMLSelectElement).options).map((o) => o.text);
    expect(options).toContain('전체');
    expect(options).toContain('개인');
    expect(options).toContain('업무');
  });

  it('카테고리 변경 시 setFilter를 호출한다 (BR-F-01)', async () => {
    renderWithProviders(<FilterBar />);
    await userEvent.selectOptions(screen.getByLabelText('카테고리'), '1');
    expect(mockSetFilter).toHaveBeenCalledWith({ category_id: '1' });
  });

  it('카테고리 "전체" 선택 시 category_id: null로 setFilter를 호출한다', async () => {
    mockState = { ...mockState, category_id: '1' };
    renderWithProviders(<FilterBar />);
    await userEvent.selectOptions(screen.getByLabelText('카테고리'), '');
    expect(mockSetFilter).toHaveBeenCalledWith({ category_id: null });
  });

  it('기간초과 "기간초과" 선택 시 overdue: true로 setFilter를 호출한다 (BR-F-02)', async () => {
    renderWithProviders(<FilterBar />);
    await userEvent.selectOptions(screen.getByLabelText('기간초과'), 'true');
    expect(mockSetFilter).toHaveBeenCalledWith({ overdue: true });
  });

  it('기간초과 "기간내" 선택 시 overdue: false로 setFilter를 호출한다', async () => {
    renderWithProviders(<FilterBar />);
    await userEvent.selectOptions(screen.getByLabelText('기간초과'), 'false');
    expect(mockSetFilter).toHaveBeenCalledWith({ overdue: false });
  });

  it('기간초과 "전체" 선택 시 overdue: null로 setFilter를 호출한다', async () => {
    mockState = { ...mockState, overdue: true };
    renderWithProviders(<FilterBar />);
    await userEvent.selectOptions(screen.getByLabelText('기간초과'), '');
    expect(mockSetFilter).toHaveBeenCalledWith({ overdue: null });
  });

  it('완료여부 "완료" 선택 시 is_completed: true로 setFilter를 호출한다 (BR-F-03)', async () => {
    renderWithProviders(<FilterBar />);
    await userEvent.selectOptions(screen.getByLabelText('완료여부'), 'true');
    expect(mockSetFilter).toHaveBeenCalledWith({ is_completed: true });
  });

  it('완료여부 "미완료" 선택 시 is_completed: false로 setFilter를 호출한다', async () => {
    renderWithProviders(<FilterBar />);
    await userEvent.selectOptions(screen.getByLabelText('완료여부'), 'false');
    expect(mockSetFilter).toHaveBeenCalledWith({ is_completed: false });
  });

  it('완료여부 "전체" 선택 시 is_completed: null로 setFilter를 호출한다', async () => {
    mockState = { ...mockState, is_completed: true };
    renderWithProviders(<FilterBar />);
    await userEvent.selectOptions(screen.getByLabelText('완료여부'), '');
    expect(mockSetFilter).toHaveBeenCalledWith({ is_completed: null });
  });

  it('활성 필터가 없으면 초기화 버튼을 표시하지 않는다', () => {
    renderWithProviders(<FilterBar />);
    expect(screen.queryByRole('button', { name: '필터 초기화' })).toBeNull();
  });

  it('활성 필터가 있으면 초기화 버튼을 표시한다', () => {
    mockState = { ...mockState, overdue: true };
    renderWithProviders(<FilterBar />);
    expect(screen.getByRole('button', { name: '필터 초기화' })).toBeInTheDocument();
  });

  it('초기화 버튼 클릭 시 resetFilter를 호출한다', async () => {
    mockState = { ...mockState, is_completed: true };
    renderWithProviders(<FilterBar />);
    await userEvent.click(screen.getByRole('button', { name: '필터 초기화' }));
    expect(mockResetFilter).toHaveBeenCalledTimes(1);
  });

  it('role="search"와 aria-label을 가진다', () => {
    renderWithProviders(<FilterBar />);
    expect(screen.getByRole('search', { name: '할일 필터' })).toBeInTheDocument();
  });
});
