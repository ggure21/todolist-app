import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';
import { renderWithProviders } from '../../test/renderWithProviders';
import { RegisterForm } from './RegisterForm';

const mockRegister = vi.fn();

vi.mock('./useRegister', () => ({
  useRegister: vi.fn(() => ({
    register: mockRegister,
    isPending: false,
    error: null,
    isError: false,
  })),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => vi.fn() };
});

import { useRegister } from './useRegister';
const mockUseRegister = useRegister as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockUseRegister.mockReturnValue({
    register: mockRegister,
    isPending: false,
    error: null,
    isError: false,
  });
});

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText('이름'), '홍길동');
  await userEvent.type(screen.getByLabelText('이메일'), 'new@example.com');
  await userEvent.type(screen.getByLabelText('비밀번호 (최소 8자)'), 'password1');
  await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'password1');
}

describe('RegisterForm', () => {
  it('이름, 이메일, 비밀번호, 비밀번호 확인 필드를 렌더링한다', () => {
    renderWithProviders(<RegisterForm />);
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호 (최소 8자)')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument();
  });

  it('가입하기 버튼을 렌더링한다', () => {
    renderWithProviders(<RegisterForm />);
    expect(screen.getByRole('button', { name: /가입하기/ })).toBeInTheDocument();
  });

  it('로그인 링크가 /login을 가리킨다', () => {
    renderWithProviders(<RegisterForm />);
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login');
  });

  it('유효한 폼 제출 시 register를 올바른 인자로 호출한다', async () => {
    renderWithProviders(<RegisterForm />);
    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: /가입하기/ }));

    expect(mockRegister).toHaveBeenCalledWith({
      name: '홍길동',
      email: 'new@example.com',
      password: 'password1',
    });
  });

  it('이름이 비어있으면 오류를 표시하고 register를 호출하지 않는다', async () => {
    renderWithProviders(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('이메일'), 'new@example.com');
    await userEvent.type(screen.getByLabelText('비밀번호 (최소 8자)'), 'password1');
    await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'password1');
    await userEvent.click(screen.getByRole('button', { name: /가입하기/ }));

    await waitFor(() => {
      expect(screen.getByText('이름을 입력해주세요.')).toBeInTheDocument();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('이메일 형식이 잘못되면 오류를 표시한다', async () => {
    renderWithProviders(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('이름'), '홍길동');
    await userEvent.type(screen.getByLabelText('이메일'), 'notanemail');
    await userEvent.type(screen.getByLabelText('비밀번호 (최소 8자)'), 'password1');
    await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'password1');
    await userEvent.click(screen.getByRole('button', { name: /가입하기/ }));

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('비밀번호가 8자 미만이면 오류를 표시한다', async () => {
    renderWithProviders(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('이름'), '홍길동');
    await userEvent.type(screen.getByLabelText('이메일'), 'new@example.com');
    await userEvent.type(screen.getByLabelText('비밀번호 (최소 8자)'), 'short');
    await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'short');
    await userEvent.click(screen.getByRole('button', { name: /가입하기/ }));

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('비밀번호 확인이 불일치하면 오류를 표시한다', async () => {
    renderWithProviders(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('이름'), '홍길동');
    await userEvent.type(screen.getByLabelText('이메일'), 'new@example.com');
    await userEvent.type(screen.getByLabelText('비밀번호 (최소 8자)'), 'password1');
    await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'different1');
    await userEvent.click(screen.getByRole('button', { name: /가입하기/ }));

    await waitFor(() => {
      expect(screen.getByText('새 비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('이메일 중복 오류 시 에러 메시지를 표시한다 (BR-U-01)', () => {
    mockUseRegister.mockReturnValue({
      register: mockRegister,
      isPending: false,
      error: new ApiError(400, '이미 사용 중인 이메일입니다', 'DUPLICATE_EMAIL'),
      isError: true,
    });

    renderWithProviders(<RegisterForm />);
    expect(screen.getByRole('alert')).toHaveTextContent('이미 사용 중인 이메일입니다.');
  });

  it('로딩 중에는 가입하기 버튼이 비활성화된다', () => {
    mockUseRegister.mockReturnValue({
      register: mockRegister,
      isPending: true,
      error: null,
      isError: false,
    });

    renderWithProviders(<RegisterForm />);
    expect(screen.getByRole('button', { name: /가입하기/ })).toBeDisabled();
  });
});
