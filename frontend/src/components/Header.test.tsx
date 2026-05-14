import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import { Header } from './Header';

vi.mock('../api/user.api', () => ({
  userApi: {
    getMe: vi.fn(),
  },
}));

const mockClearAuth = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: { clearAuth: () => void; accessToken: string | null }) => unknown) =>
    selector({ clearAuth: mockClearAuth, accessToken: 'mock-token' }),
  ),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { userApi } from '../api/user.api';
const mockUserApi = userApi as { getMe: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

const mockProfile = {
  id: 'u1',
  email: 'jisoo@example.com',
  name: '김지수',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('Header', () => {
  it('로고/서비스명을 렌더링한다', () => {
    mockUserApi.getMe.mockResolvedValueOnce(mockProfile);
    renderWithProviders(<Header />);
    expect(screen.getByText('TodoListApp')).toBeInTheDocument();
  });

  it('로고가 "/" 링크를 가진다', () => {
    mockUserApi.getMe.mockResolvedValueOnce(mockProfile);
    renderWithProviders(<Header />);
    const logoLink = screen.getByRole('link', { name: 'TodoListApp 홈으로 이동' });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('사용자 이름을 표시한다', async () => {
    mockUserApi.getMe.mockResolvedValueOnce(mockProfile);
    renderWithProviders(<Header />);
    await waitFor(() => {
      expect(screen.getByText('김지수')).toBeInTheDocument();
    });
  });

  it('프로필 링크를 렌더링한다', () => {
    mockUserApi.getMe.mockResolvedValueOnce(mockProfile);
    renderWithProviders(<Header />);
    const profileLink = screen.getByRole('link', { name: '프로필 페이지로 이동' });
    expect(profileLink).toHaveAttribute('href', '/profile');
  });

  it('로그아웃 버튼이 있다', () => {
    mockUserApi.getMe.mockResolvedValueOnce(mockProfile);
    renderWithProviders(<Header />);
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
  });

  it('로그아웃 클릭 시 clearAuth가 호출된다', async () => {
    mockUserApi.getMe.mockResolvedValueOnce(mockProfile);
    renderWithProviders(<Header />);
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(mockClearAuth).toHaveBeenCalledTimes(1);
  });

  it('로그아웃 클릭 시 /login으로 이동한다', async () => {
    mockUserApi.getMe.mockResolvedValueOnce(mockProfile);
    renderWithProviders(<Header />);
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('header role="banner"를 가진다', () => {
    mockUserApi.getMe.mockResolvedValueOnce(mockProfile);
    renderWithProviders(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
