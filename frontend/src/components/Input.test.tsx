import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('label이 있으면 label 요소를 렌더링한다', () => {
    render(<Input id="email" label="이메일" />);
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
  });

  it('label htmlFor와 input id가 연결된다', () => {
    render(<Input id="email" label="이메일" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'email');
    expect(screen.getByText('이메일')).toHaveAttribute('for', 'email');
  });

  it('label이 없으면 label 요소를 렌더링하지 않는다', () => {
    render(<Input id="email" />);
    expect(screen.queryByRole('label')).toBeNull();
  });

  it('error가 있으면 에러 메시지를 렌더링한다', () => {
    render(<Input id="email" error="이메일 형식이 올바르지 않습니다" />);
    expect(screen.getByRole('alert')).toHaveTextContent('이메일 형식이 올바르지 않습니다');
  });

  it('error 상태에서 aria-invalid가 true이다', () => {
    render(<Input id="email" error="에러" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('error 상태에서 aria-describedby가 에러 id를 가리킨다', () => {
    render(<Input id="email" error="에러" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'email-error');
  });

  it('error가 없으면 aria-invalid가 false이다', () => {
    render(<Input id="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
  });

  it('error가 없으면 에러 메시지가 없다', () => {
    render(<Input id="email" />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('type prop을 전달한다', () => {
    render(<Input id="pw" type="password" />);
    expect(document.getElementById('pw')).toHaveAttribute('type', 'password');
  });

  it('placeholder를 렌더링한다', () => {
    render(<Input id="email" placeholder="이메일을 입력하세요" />);
    expect(screen.getByPlaceholderText('이메일을 입력하세요')).toBeInTheDocument();
  });

  it('disabled 상태에서 입력 불가하다', () => {
    render(<Input id="email" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
