import { type FormEvent, useState } from 'react';
import { Button } from '../../components/Button';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Input } from '../../components/Input';
import { getErrorMessage } from '../../utils/error.utils';
import { validatePassword, validatePasswordMatch } from '../../utils/validation.utils';
import type { UserProfile } from './user.types';
import { useUpdateProfile } from './useUpdateProfile';

function NameForm({ profile }: { profile: UserProfile }) {
  const { mutate, isPending, isError, error } = useUpdateProfile();
  const [name, setName] = useState(profile.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('이름을 입력해주세요.');
      return;
    }
    setNameError(null);
    mutate(
      { name: name.trim() },
      {
        onSuccess: () => setSuccessMsg('이름이 변경되었습니다.'),
      },
    );
  };

  return (
    <section aria-label="기본 정보 변경" className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-[var(--color-gray-900)]">기본 정보</h2>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <Input
          id="profile-email"
          label="이메일"
          type="email"
          value={profile.email}
          disabled
          readOnly
        />
        <Input
          id="profile-name"
          label="이름"
          type="text"
          placeholder="이름을 입력하세요"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(null);
            if (successMsg) setSuccessMsg(null);
          }}
          error={nameError ?? undefined}
        />
        {isError && <ErrorMessage message={getErrorMessage(error)} />}
        {successMsg && (
          <p role="status" className="text-sm text-[var(--color-primary-600)]">
            {successMsg}
          </p>
        )}
        <Button type="submit" variant="primary" loading={isPending} className="self-start px-6">
          이름 저장
        </Button>
      </form>
    </section>
  );
}

function PasswordForm() {
  const { mutate, isPending, isError, error } = useUpdateProfile();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentErr, setCurrentErr] = useState<string | null>(null);
  const [newErr, setNewErr] = useState<string | null>(null);
  const [confirmErr, setConfirmErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cErr = currentPassword ? null : '현재 비밀번호를 입력해주세요.';
    const nErr = validatePassword(newPassword);
    const cfErr = validatePasswordMatch(newPassword, confirmPassword);

    setCurrentErr(cErr);
    setNewErr(nErr);
    setConfirmErr(cfErr);

    if (cErr || nErr || cfErr) return;

    mutate(
      { current_password: currentPassword, new_password: newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setSuccessMsg('비밀번호가 변경되었습니다.');
        },
      },
    );
  };

  return (
    <section aria-label="비밀번호 변경" className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-[var(--color-gray-900)]">비밀번호 변경</h2>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <Input
          id="current-password"
          label="현재 비밀번호"
          type="password"
          placeholder="현재 비밀번호를 입력하세요"
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            if (currentErr) setCurrentErr(null);
            if (successMsg) setSuccessMsg(null);
          }}
          error={currentErr ?? undefined}
          autoComplete="current-password"
        />
        <Input
          id="new-password"
          label="새 비밀번호"
          type="password"
          placeholder="새 비밀번호 (최소 8자)"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            if (newErr) setNewErr(null);
          }}
          error={newErr ?? undefined}
          autoComplete="new-password"
        />
        <Input
          id="confirm-password"
          label="새 비밀번호 확인"
          type="password"
          placeholder="새 비밀번호를 다시 입력하세요"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (confirmErr) setConfirmErr(null);
          }}
          error={confirmErr ?? undefined}
          autoComplete="new-password"
        />
        {isError && <ErrorMessage message={getErrorMessage(error)} />}
        {successMsg && (
          <p role="status" className="text-sm text-[var(--color-primary-600)]">
            {successMsg}
          </p>
        )}
        <Button type="submit" variant="primary" loading={isPending} className="self-start px-6">
          비밀번호 변경
        </Button>
      </form>
    </section>
  );
}

interface ProfileFormProps {
  profile: UserProfile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  return (
    <div className="flex flex-col gap-8">
      <NameForm profile={profile} />
      <div className="border-t border-[var(--color-border)]" />
      <PasswordForm />
    </div>
  );
}
