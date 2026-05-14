import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { TodoForm } from './TodoForm';

vi.mock('../category/useCategories', () => ({
  useCategories: vi.fn(() => ({
    data: [
      { id: 'c1', user_id: null, name: '개인', is_default: true, created_at: '' },
      { id: 'c2', user_id: null, name: '업무', is_default: true, created_at: '' },
    ],
    isLoading: false,
  })),
}));

const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

const defaultProps = {
  onSubmit: mockOnSubmit,
  onCancel: mockOnCancel,
};

beforeEach(() => vi.clearAllMocks());

describe('TodoForm', () => {
  describe('렌더링', () => {
    it('제목 입력 필드를 렌더링한다', () => {
      renderWithProviders(<TodoForm {...defaultProps} />);
      expect(screen.getByLabelText('제목')).toBeInTheDocument();
    });

    it('카테고리 드롭다운을 렌더링한다', () => {
      renderWithProviders(<TodoForm {...defaultProps} />);
      expect(screen.getByLabelText('카테고리')).toBeInTheDocument();
    });

    it('카테고리 드롭다운에 옵션이 포함된다', () => {
      renderWithProviders(<TodoForm {...defaultProps} />);
      const select = screen.getByLabelText('카테고리') as HTMLSelectElement;
      const options = Array.from(select.options).map((o) => o.text);
      expect(options).toContain('개인');
      expect(options).toContain('업무');
    });

    it('설명 입력 필드를 렌더링한다', () => {
      renderWithProviders(<TodoForm {...defaultProps} />);
      expect(screen.getByLabelText('설명')).toBeInTheDocument();
    });

    it('종료예정일 입력 필드를 렌더링한다', () => {
      renderWithProviders(<TodoForm {...defaultProps} />);
      expect(screen.getByLabelText('종료예정일')).toBeInTheDocument();
    });

    it('저장 버튼을 렌더링한다', () => {
      renderWithProviders(<TodoForm {...defaultProps} />);
      expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
    });

    it('취소 버튼을 렌더링한다', () => {
      renderWithProviders(<TodoForm {...defaultProps} />);
      expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
    });

    it('submitLabel prop으로 버튼 텍스트를 변경한다', () => {
      renderWithProviders(<TodoForm {...defaultProps} submitLabel="수정" />);
      expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
    });
  });

  describe('초기값', () => {
    it('initialValues로 필드가 초기화된다', () => {
      renderWithProviders(
        <TodoForm
          {...defaultProps}
          initialValues={{
            title: '기존 제목',
            category_id: 'c1',
            description: '기존 설명',
            due_date: '2099-12-31',
          }}
        />,
      );
      expect(screen.getByLabelText('제목')).toHaveValue('기존 제목');
      expect(screen.getByLabelText('카테고리')).toHaveValue('c1');
      expect(screen.getByLabelText('설명')).toHaveValue('기존 설명');
      expect(screen.getByLabelText('종료예정일')).toHaveValue('2099-12-31');
    });
  });

  describe('유효성 검사', () => {
    it('제목 없이 제출하면 에러 메시지를 표시한다', async () => {
      renderWithProviders(<TodoForm {...defaultProps} />);
      await userEvent.click(screen.getByRole('button', { name: '저장' }));
      expect(screen.getByText('제목은 필수 입력값입니다.')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('카테고리 없이 제출하면 에러 메시지를 표시한다', async () => {
      renderWithProviders(<TodoForm {...defaultProps} />);
      await userEvent.type(screen.getByLabelText('제목'), '테스트 할일');
      await userEvent.click(screen.getByRole('button', { name: '저장' }));
      expect(screen.getByText('카테고리를 선택해주세요.')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('과거 날짜 입력 시 에러 메시지를 표시한다 (BR-T-06)', async () => {
      renderWithProviders(<TodoForm {...defaultProps} />);
      await userEvent.type(screen.getByLabelText('제목'), '테스트 할일');
      await userEvent.selectOptions(screen.getByLabelText('카테고리'), 'c1');
      await userEvent.type(screen.getByLabelText('종료예정일'), '2020-01-01');
      await userEvent.click(screen.getByRole('button', { name: '저장' }));
      expect(screen.getByText(/오늘 이후/)).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('종료예정일이 비어있으면 검증을 통과한다', async () => {
      renderWithProviders(<TodoForm {...defaultProps} />);
      await userEvent.type(screen.getByLabelText('제목'), '테스트 할일');
      await userEvent.selectOptions(screen.getByLabelText('카테고리'), 'c1');
      await userEvent.click(screen.getByRole('button', { name: '저장' }));
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  describe('제출', () => {
    it('유효한 입력 시 onSubmit을 올바른 값으로 호출한다', async () => {
      renderWithProviders(<TodoForm {...defaultProps} />);
      await userEvent.type(screen.getByLabelText('제목'), '새 할일');
      await userEvent.selectOptions(screen.getByLabelText('카테고리'), 'c1');
      await userEvent.type(screen.getByLabelText('설명'), '상세 설명');
      await userEvent.click(screen.getByRole('button', { name: '저장' }));
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: '새 할일',
        category_id: 'c1',
        description: '상세 설명',
        due_date: '',
      });
    });

    it('취소 버튼 클릭 시 onCancel을 호출한다', async () => {
      renderWithProviders(<TodoForm {...defaultProps} />);
      await userEvent.click(screen.getByRole('button', { name: '취소' }));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('isPending=true 시 저장 버튼이 비활성화된다', () => {
      renderWithProviders(<TodoForm {...defaultProps} isPending />);
      expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
    });
  });
});
