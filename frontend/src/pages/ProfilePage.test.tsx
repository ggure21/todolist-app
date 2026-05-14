import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import ProfilePage from './ProfilePage';
import type { UserProfile } from '../features/user/user.types';

vi.mock('../components/Header', () => ({
  Header: () => <header>Header</header>,
}));

vi.mock('../features/user/ProfileForm', () => ({
  ProfileForm: ({ profile }: { profile: UserProfile }) => (
    <div data-testid="profile-form">{profile.name}</div>
  ),
}));

const mockProfile: UserProfile = {
  id: 'u1',
  email: 'test@example.com',
  name: '홍길동',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

import { useQuery } from '@tanstack/react-query';

describe('ProfilePage', () => {
  it('로딩 중일 때 로딩 인디케이터를 표시한다', () => {
    vi.mocked(useQuery).mockReturnValue({ isLoading: true, data: undefined } as ReturnType<typeof useQuery>);
    renderWithProviders(<ProfilePage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('프로필 데이터를 ProfileForm에 전달한다', () => {
    vi.mocked(useQuery).mockReturnValue({ isLoading: false, data: mockProfile } as ReturnType<typeof useQuery>);
    renderWithProviders(<ProfilePage />);
    expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    expect(screen.getByText('홍길동')).toBeInTheDocument();
  });

  it('프로필 페이지 제목을 표시한다', () => {
    vi.mocked(useQuery).mockReturnValue({ isLoading: false, data: mockProfile } as ReturnType<typeof useQuery>);
    renderWithProviders(<ProfilePage />);
    expect(screen.getByRole('heading', { name: /프로필/ })).toBeInTheDocument();
  });
});
