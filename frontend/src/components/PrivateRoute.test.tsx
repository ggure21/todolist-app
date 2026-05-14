import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import PrivateRoute from './PrivateRoute';

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, userId: null });
});

function TestLayout() {
  return (
    <Routes>
      <Route path="/login" element={<div>로그인 페이지</div>} />
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<div>보호된 페이지</div>} />
        <Route path="/profile" element={<div>프로필 페이지</div>} />
      </Route>
    </Routes>
  );
}

describe('PrivateRoute', () => {
  it('accessToken이 없으면 /login으로 리다이렉트한다', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TestLayout />
      </MemoryRouter>,
    );

    expect(screen.getByText('로그인 페이지')).toBeInTheDocument();
    expect(screen.queryByText('보호된 페이지')).not.toBeInTheDocument();
  });

  it('accessToken이 있으면 보호된 페이지를 렌더링한다', () => {
    useAuthStore.setState({ accessToken: 'valid-token', userId: 'user-1' });

    render(
      <MemoryRouter initialEntries={['/']}>
        <TestLayout />
      </MemoryRouter>,
    );

    expect(screen.getByText('보호된 페이지')).toBeInTheDocument();
    expect(screen.queryByText('로그인 페이지')).not.toBeInTheDocument();
  });

  it('/profile 경로도 accessToken 없이 접근하면 /login으로 리다이렉트한다', () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <TestLayout />
      </MemoryRouter>,
    );

    expect(screen.getByText('로그인 페이지')).toBeInTheDocument();
    expect(screen.queryByText('프로필 페이지')).not.toBeInTheDocument();
  });

  it('/profile 경로도 accessToken이 있으면 정상 렌더링한다', () => {
    useAuthStore.setState({ accessToken: 'valid-token', userId: 'user-1' });

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <TestLayout />
      </MemoryRouter>,
    );

    expect(screen.getByText('프로필 페이지')).toBeInTheDocument();
  });
});
