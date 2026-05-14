import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('기본 타이틀을 렌더링한다', () => {
    render(<EmptyState />);
    expect(screen.getByText('할일이 없습니다')).toBeInTheDocument();
  });

  it('기본 설명을 렌더링한다', () => {
    render(<EmptyState />);
    expect(screen.getByText('새로운 할일을 추가하거나 필터를 변경해보세요.')).toBeInTheDocument();
  });

  it('커스텀 타이틀을 렌더링한다', () => {
    render(<EmptyState title="검색 결과가 없습니다" />);
    expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument();
  });

  it('커스텀 설명을 렌더링한다', () => {
    render(<EmptyState description="다른 필터를 선택해보세요." />);
    expect(screen.getByText('다른 필터를 선택해보세요.')).toBeInTheDocument();
  });

  it('role="status"를 가진다', () => {
    render(<EmptyState />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('aria-label이 타이틀과 일치한다', () => {
    render(<EmptyState title="필터 결과 없음" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', '필터 결과 없음');
  });
});
