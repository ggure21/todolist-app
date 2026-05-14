import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Input } from '../../components/Input';
import { getErrorMessage } from '../../utils/error.utils';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from '../../utils/validation.utils';
import { useRegister } from './useRegister';

export function RegisterForm() {
  const { register, isPending, error, isError } = useRegister();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const nErr = name.trim() ? null : '이름을 입력해주세요.';
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cErr = validatePasswordMatch(password, confirmPassword);

    setNameError(nErr);
    setEmailError(eErr);
    setPasswordError(pErr);
    setConfirmError(cErr);

    if (nErr || eErr || pErr || cErr) return;

    register({ name, email, password });
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="회원가입 폼">
      <h1 className="text-xl font-semibold text-[var(--color-gray-900)] mb-6 text-center">
        회원가입
      </h1>

      <div className="flex flex-col gap-4">
        <Input
          id="name"
          type="text"
          label="이름"
          placeholder="이름을 입력하세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError ?? undefined}
          autoComplete="name"
        />

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
          label="비밀번호 (최소 8자)"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError ?? undefined}
          autoComplete="new-password"
        />

        <Input
          id="confirmPassword"
          type="password"
          label="비밀번호 확인"
          placeholder="비밀번호를 다시 입력하세요"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmError ?? undefined}
          autoComplete="new-password"
        />

        {isError && (
          <ErrorMessage
            message={getErrorMessage(error) || '회원가입 중 오류가 발생했습니다.'}
          />
        )}

        <Button type="submit" variant="primary" loading={isPending} className="w-full mt-2">
          가입하기
        </Button>
      </div>

      <p className="mt-4 text-center text-sm text-[var(--color-gray-500)]">
        이미 계정이 있으신가요?{' '}
        <Link
          to="/login"
          className="text-[var(--color-primary-600)] font-medium hover:underline"
        >
          로그인
        </Link>
      </p>
    </form>
  );
}
