import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Input } from '../../components/Input';
import { getErrorMessage } from '../../utils/error.utils';
import { validateEmail, validatePassword } from '../../utils/validation.utils';
import { useLogin } from './useLogin';

export function LoginForm() {
  const { login, isPending, error, isError } = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);

    if (eErr || pErr) return;

    login({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="로그인 폼">
      <h1 className="text-xl font-semibold text-[var(--color-gray-900)] mb-6 text-center">
        로그인
      </h1>

      <div className="flex flex-col gap-4">
        <Input
          id="email"
          type="email"
          label="이메일"
          placeholder="이메일을 입력하세요"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError ?? undefined}
          autoComplete="email"
        />

        <Input
          id="password"
          type="password"
          label="비밀번호"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError ?? undefined}
          autoComplete="current-password"
        />

        {isError && (
          <ErrorMessage
            message={getErrorMessage(error) || '이메일 또는 비밀번호가 올바르지 않습니다.'}
          />
        )}

        <Button type="submit" variant="primary" loading={isPending} className="w-full mt-2">
          로그인
        </Button>
      </div>

      <p className="mt-4 text-center text-sm text-[var(--color-gray-500)]">
        계정이 없으신가요?{' '}
        <Link
          to="/register"
          className="text-[var(--color-primary-600)] font-medium hover:underline"
        >
          회원가입
        </Link>
      </p>
    </form>
  );
}
