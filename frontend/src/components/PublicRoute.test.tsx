import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import PublicRoute from './PublicRoute';

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, userId: null });
});

function TestLayout() {
  return (
    <Routes>
      <Route path="/" element={<div>메인 페이지</div>} />
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<div>로그인 페이지</div>} />
        <Route path="/register" element={<div>회원가입 페이지</div>} />
      </Route>
    </Routes>
  );
}

describe('PublicRoute', () => {
  it('accessToken이 없으면 /login 페이지를 렌더링한다', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <TestLayout />
      </MemoryRouter>,
    );

    expect(screen.getByText('로그인 페이지')).toBeInTheDocument();
    expect(screen.queryByText('메인 페이지')).not.toBeInTheDocument();
  });

  it('accessToken이 있으면 /로 리다이렉트한다', () => {
    useAuthStore.setState({ accessToken: 'valid-token', userId: 'user-1' });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <TestLayout />
      </MemoryRouter>,
    );

    expect(screen.getByText('메인 페이지')).toBeInTheDocument();
    expect(screen.queryByText('로그인 페이지')).not.toBeInTheDocument();
  });

  it('/register도 accessToken이 없으면 정상 렌더링한다', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <TestLayout />
      </MemoryRouter>,
    );

    expect(screen.getByText('회원가입 페이지')).toBeInTheDocument();
  });

  it('/register도 accessToken이 있으면 /로 리다이렉트한다', () => {
    useAuthStore.setState({ accessToken: 'valid-token', userId: 'user-1' });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <TestLayout />
      </MemoryRouter>,
    );

    expect(screen.getByText('메인 페이지')).toBeInTheDocument();
    expect(screen.queryByText('회원가입 페이지')).not.toBeInTheDocument();
  });
});
