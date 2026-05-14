import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import LoginPage from './LoginPage';

vi.mock('../features/auth/LoginForm', () => ({
  LoginForm: () => <div data-testid="login-form">LoginForm</div>,
}));

describe('LoginPage', () => {
  it('TodoListApp 로고를 렌더링한다', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('TodoListApp')).toBeInTheDocument();
  });

  it('LoginForm을 렌더링한다', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });
});
