import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage', () => {
  it('에러 메시지를 렌더링한다', () => {
    render(<ErrorMessage message="이메일이 올바르지 않습니다" />);
    expect(screen.getByText('이메일이 올바르지 않습니다')).toBeInTheDocument();
  });

  it('role="alert"을 가진다', () => {
    render(<ErrorMessage message="오류 발생" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('에러 메시지가 role="alert" 내에 있다', () => {
    render(<ErrorMessage message="서버 오류입니다" />);
    expect(screen.getByRole('alert')).toHaveTextContent('서버 오류입니다');
  });
});
