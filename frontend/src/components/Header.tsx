import { useQuery } from '@tanstack/react-query';
import { LogOut, Moon, Sun, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { userApi } from '../api/user.api';
import { QUERY_KEYS } from '../constants/queryKeys.constants';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../stores/authStore';

export function Header() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  const { theme, toggle } = useTheme();

  const { data: profile } = useQuery({
    queryKey: QUERY_KEYS.user.me,
    queryFn: () => userApi.getMe(),
    enabled: !!accessToken,
  });

  const handleLogout = () => {
    clearAuth();
    void navigate('/login');
  };

  return (
    <header
      className="h-14 px-6 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-base)] sticky top-0 z-[var(--z-header)]"
      role="banner"
    >
      <Link
        to="/"
        className="text-xl font-bold text-[var(--color-primary-600)] tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label="TodoListApp 홈으로 이동"
      >
        TodoListApp
      </Link>

      <div className="flex items-center gap-4">
        {profile && (
          <span className="text-sm text-[var(--color-gray-700)]">
            안녕하세요,{' '}
            <strong className="font-medium">{profile.name}</strong>님
          </span>
        )}

        <button
          onClick={toggle}
          className="flex items-center justify-center w-8 h-8 rounded-md text-[var(--color-gray-700)] hover:text-[var(--color-primary-600)] hover:bg-[var(--color-gray-100)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {theme === 'dark' ? (
            <Sun size={21} aria-hidden="true" />
          ) : (
            <Moon size={21} aria-hidden="true" />
          )}
        </button>

        <Link
          to="/profile"
          className="flex items-center gap-1 text-sm text-[var(--color-gray-700)] hover:text-[var(--color-primary-600)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="프로필 페이지로 이동"
        >
          <User size={21} aria-hidden="true" />
          <span className="hidden sm:inline">프로필</span>
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm text-[var(--color-gray-700)] hover:text-[var(--color-danger)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="로그아웃"
        >
          <LogOut size={21} aria-hidden="true" />
          <span>로그아웃</span>
        </button>
      </div>
    </header>
  );
}
