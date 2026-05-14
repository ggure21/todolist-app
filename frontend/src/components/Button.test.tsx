import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  describe('variant', () => {
    it('primary variant이 기본값이다', () => {
      render(<Button>저장</Button>);
      const btn = screen.getByRole('button', { name: '저장' });
      expect(btn).toBeInTheDocument();
    });

    it('secondary variant를 렌더링한다', () => {
      render(<Button variant="secondary">취소</Button>);
      expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
    });

    it('danger variant를 렌더링한다', () => {
      render(<Button variant="danger">삭제</Button>);
      expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
    });
  });

  describe('disabled', () => {
    it('disabled 상태에서 버튼이 비활성화된다', () => {
      render(<Button disabled>저장</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('disabled 상태에서 aria-disabled가 true이다', () => {
      render(<Button disabled>저장</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    it('disabled 상태에서 클릭 이벤트가 발생하지 않는다', async () => {
      const onClick = vi.fn();
      render(<Button disabled onClick={onClick}>저장</Button>);
      await userEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('loading', () => {
    it('loading 상태에서 버튼이 비활성화된다', () => {
      render(<Button loading>저장</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('loading 상태에서 aria-busy가 true이다', () => {
      render(<Button loading>저장</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('loading 상태에서 스피너가 렌더링된다', () => {
      render(<Button loading>저장</Button>);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('loading=false일 때 스피너가 없다', () => {
      render(<Button loading={false}>저장</Button>);
      expect(document.querySelector('.animate-spin')).toBeNull();
    });
  });

  it('onClick 핸들러가 호출된다', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>저장</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('children을 렌더링한다', () => {
    render(<Button>제출</Button>);
    expect(screen.getByText('제출')).toBeInTheDocument();
  });

  describe('터치 UX (FE-26)', () => {
    it('버튼에 min-h-[44px] 클래스가 적용된다', () => {
      render(<Button>버튼</Button>);
      expect(screen.getByRole('button').className).toContain('min-h-[44px]');
    });

    it('secondary variant에도 min-h-[44px] 클래스가 적용된다', () => {
      render(<Button variant="secondary">취소</Button>);
      expect(screen.getByRole('button').className).toContain('min-h-[44px]');
    });

    it('danger variant에도 min-h-[44px] 클래스가 적용된다', () => {
      render(<Button variant="danger">삭제</Button>);
      expect(screen.getByRole('button').className).toContain('min-h-[44px]');
    });
  });
});
