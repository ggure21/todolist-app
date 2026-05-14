import { ApiError } from '../api/client';

const ERROR_CODE_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: '인증이 필요합니다. 다시 로그인해주세요.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 항목을 찾을 수 없습니다.',
  DUPLICATE_EMAIL: '이미 사용 중인 이메일입니다.',
  DUPLICATE_CATEGORY: '이미 사용 중인 카테고리 이름입니다.',
  INVALID_PASSWORD: '현재 비밀번호가 올바르지 않습니다.',
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  UNKNOWN: '요청 처리 중 오류가 발생했습니다.',
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return ERROR_CODE_MESSAGES[error.code] ?? error.message;
  }
  if (error instanceof Error) {
    if (!navigator.onLine) return '네트워크 연결을 확인해주세요.';
    return error.message || '알 수 없는 오류가 발생했습니다.';
  }
  return '알 수 없는 오류가 발생했습니다.';
}

export function getStatusErrorMessage(statusCode: number): string {
  switch (statusCode) {
    case 400: return '입력한 정보를 다시 확인해주세요.';
    case 401: return '인증이 필요합니다. 다시 로그인해주세요.';
    case 403: return '접근 권한이 없습니다.';
    case 404: return '요청한 항목을 찾을 수 없습니다.';
    default:  return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
}
