import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { UserProfile } from './user.types';
import { ProfileForm } from './ProfileForm';

const mockMutate = vi.fn();

vi.mock('./useUpdateProfile', () => ({
  useUpdateProfile: () => ({ mutate: mockMutate, isPending: false, isError: false, error: null }),
}));

const profile: UserProfile = {
  id: 'u1',
  email: 'test@example.com',
  name: '홍길동',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => vi.clearAllMocks());

describe('ProfileForm — 이름 변경 폼', () => {
  it('이메일을 읽기 전용으로 표시한다 (BR-U-04)', () => {
    renderWithProviders(<ProfileForm profile={profile} />);
    expect(screen.getByDisplayValue('test@example.com')).toBeDisabled();
  });

  it('이름 초기값이 설정된다', () => {
    renderWithProviders(<ProfileForm profile={profile} />);
    expect(screen.getByDisplayValue('홍길동')).toBeInTheDocument();
  });

  it('이름 저장 버튼을 렌더링한다', () => {
    renderWithProviders(<ProfileForm profile={profile} />);
    expect(screen.getByRole('button', { name: '이름 저장' })).toBeInTheDocument();
  });

  it('이름이 비어있으면 에러 메시지를 표시하고 mutate를 호출하지 않는다', async () => {
    renderWithProviders(<ProfileForm profile={profile} />);
    await userEvent.clear(screen.getByDisplayValue('홍길동'));
    await userEvent.click(screen.getByRole('button', { name: '이름 저장' }));
    expect(screen.getByText('이름을 입력해주세요.')).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('유효한 이름으로 저장 시 useUpdateProfile.mutate({ name })을 호출한다', async () => {
    renderWithProviders(<ProfileForm profile={profile} />);
    const nameInput = screen.getByDisplayValue('홍길동');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, '새이름');
    await userEvent.click(screen.getByRole('button', { name: '이름 저장' }));
    expect(mockMutate).toHaveBeenCalledWith(
      { name: '새이름' },
      expect.any(Object),
    );
  });
});

describe('ProfileForm — 비밀번호 변경 폼', () => {
  it('현재 비밀번호 입력 필드를 렌더링한다', () => {
    renderWithProviders(<ProfileForm profile={profile} />);
    expect(screen.getByLabelText('현재 비밀번호')).toBeInTheDocument();
  });

  it('새 비밀번호 입력 필드를 렌더링한다', () => {
    renderWithProviders(<ProfileForm profile={profile} />);
    expect(screen.getByLabelText('새 비밀번호')).toBeInTheDocument();
  });

  it('새 비밀번호 확인 입력 필드를 렌더링한다', () => {
    renderWithProviders(<ProfileForm profile={profile} />);
    expect(screen.getByLabelText('새 비밀번호 확인')).toBeInTheDocument();
  });

  it('현재 비밀번호 없이 제출하면 에러 메시지를 표시한다', async () => {
    renderWithProviders(<ProfileForm profile={profile} />);
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    expect(screen.getByText('현재 비밀번호를 입력해주세요.')).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('새 비밀번호가 8자 미만이면 에러 메시지를 표시한다', async () => {
    renderWithProviders(<ProfileForm profile={profile} />);
    await userEvent.type(screen.getByLabelText('현재 비밀번호'), 'current123');
    await userEvent.type(screen.getByLabelText('새 비밀번호'), '1234567');
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    expect(screen.getByText(/8자/)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('새 비밀번호 확인이 일치하지 않으면 에러 메시지를 표시한다', async () => {
    renderWithProviders(<ProfileForm profile={profile} />);
    await userEvent.type(screen.getByLabelText('현재 비밀번호'), 'current123');
    await userEvent.type(screen.getByLabelText('새 비밀번호'), 'newpass123');
    await userEvent.type(screen.getByLabelText('새 비밀번호 확인'), 'different123');
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    expect(screen.getByText(/일치하지 않습니다/)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('유효한 입력 시 mutate({ current_password, new_password })를 호출한다', async () => {
    renderWithProviders(<ProfileForm profile={profile} />);
    await userEvent.type(screen.getByLabelText('현재 비밀번호'), 'current123');
    await userEvent.type(screen.getByLabelText('새 비밀번호'), 'newpass123');
    await userEvent.type(screen.getByLabelText('새 비밀번호 확인'), 'newpass123');
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    expect(mockMutate).toHaveBeenCalledWith(
      { current_password: 'current123', new_password: 'newpass123' },
      expect.any(Object),
    );
  });
});
