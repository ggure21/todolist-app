export function validateEmail(email: string): string | null {
  if (!email.trim()) return '이메일을 입력해주세요.';
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email)) return '올바른 이메일 형식이 아닙니다.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return '비밀번호를 입력해주세요.';
  if (password.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
  return null;
}

export function validatePasswordMatch(
  password: string,
  confirm: string,
): string | null {
  if (!confirm) return '비밀번호 확인을 입력해주세요.';
  if (password !== confirm) return '새 비밀번호가 일치하지 않습니다.';
  return null;
}

export function validateTodoTitle(title: string): string | null {
  if (!title.trim()) return '제목은 필수 입력값입니다.';
  return null;
}

export function validateCategoryName(name: string): string | null {
  if (!name.trim()) return '카테고리 이름을 입력해주세요.';
  return null;
}
