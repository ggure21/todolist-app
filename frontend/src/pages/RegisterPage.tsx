import { Moon, Sun } from 'lucide-react';
import { RegisterForm } from '../features/auth/RegisterForm';
import { useTheme } from '../hooks/useTheme';

function RegisterPage() {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-page)] px-4">
      <button
        onClick={toggle}
        className="fixed top-4 right-4 flex items-center justify-center w-9 h-9 rounded-md text-[var(--color-gray-700)] hover:text-[var(--color-primary-600)] hover:bg-[var(--color-gray-100)] transition-colors"
        aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      >
        {theme === 'dark' ? <Sun size={21} aria-hidden="true" /> : <Moon size={21} aria-hidden="true" />}
      </button>

      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[var(--color-primary-600)] text-center mb-8 tracking-tight">
          TodoListApp
        </h1>
        <div className="bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-xl p-8 shadow-[var(--shadow-sm)]">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
