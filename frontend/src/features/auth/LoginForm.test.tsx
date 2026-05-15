import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { LoginForm } from './LoginForm';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('./useLogin', () => ({
  useLogin: vi.fn(() => ({
    login: mockLogin,
    isPending: false,
    error: null,
    isError: false,
  })),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

import { useLogin } from './useLogin';
const mockUseLogin = useLogin as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockUseLogin.mockReturnValue({
    login: mockLogin,
    isPending: false,
    error: null,
    isError: false,
  });
});

describe('LoginForm', () => {
  it('이메일 입력 필드를 렌더링한다', () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
  });

  it('비밀번호 입력 필드를 렌더링한다', () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
  });

  it('로그인 버튼을 렌더링한다', () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByRole('button', { name: /로그인/ })).toBeInTheDocument();
  });

  it('회원가입 링크가 /register를 가리킨다', () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByRole('link', { name: '회원가입' })).toHaveAttribute('href', '/register');
  });

  it('유효한 폼 제출 시 login을 호출한다', async () => {
    renderWithProviders(<LoginForm />);

    await userEvent.type(screen.getByLabelText('이메일'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'password1');
    await userEvent.click(screen.getByRole('button', { name: /로그인/ }));

    expect(mockLogin).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password1' });
  });

  it('이메일이 비어있으면 유효성 오류를 표시하고 login을 호출하지 않는다', async () => {
    renderWithProviders(<LoginForm />);

    await userEvent.type(screen.getByLabelText('비밀번호'), 'password1');
    await userEvent.click(screen.getByRole('button', { name: /로그인/ }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('이메일 형식이 잘못되면 유효성 오류를 표시한다', async () => {
    renderWithProviders(<LoginForm />);

    await userEvent.type(screen.getByLabelText('이메일'), 'notanemail');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'password1');
    await userEvent.click(screen.getByRole('button', { name: /로그인/ }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('비밀번호가 비어있으면 유효성 오류를 표시하고 login을 호출하지 않는다', async () => {
    renderWithProviders(<LoginForm />);

    await userEvent.type(screen.getByLabelText('이메일'), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /로그인/ }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('API 오류 시 단일 에러 메시지를 표시한다 (BR-U-03)', () => {
    mockUseLogin.mockReturnValue({
      login: mockLogin,
      isPending: false,
      error: new Error('이메일 또는 비밀번호가 올바르지 않습니다.'),
      isError: true,
    });

    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('로딩 중에는 로그인 버튼이 비활성화된다', () => {
    mockUseLogin.mockReturnValue({
      login: mockLogin,
      isPending: true,
      error: null,
      isError: false,
    });

    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('button', { name: /로그인/ })).toBeDisabled();
  });
});
