import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test/renderWithProviders';
import RegisterPage from './RegisterPage';

vi.mock('../features/auth/RegisterForm', () => ({
  RegisterForm: () => <div data-testid="register-form">RegisterForm</div>,
}));

describe('RegisterPage', () => {
  it('TodoListApp 로고를 렌더링한다', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByText('TodoListApp')).toBeInTheDocument();
  });

  it('RegisterForm을 렌더링한다', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByTestId('register-form')).toBeInTheDocument();
  });
});
