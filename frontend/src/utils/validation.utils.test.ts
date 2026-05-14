import { describe, expect, it } from 'vitest';
import {
  validateCategoryName,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateTodoTitle,
} from './validation.utils';

describe('validateEmail', () => {
  it('유효한 이메일은 null을 반환한다', () => {
    expect(validateEmail('user@example.com')).toBeNull();
  });

  it('빈 문자열은 에러 메시지를 반환한다', () => {
    expect(validateEmail('')).toBeTruthy();
  });

  it('공백만 있으면 에러 메시지를 반환한다', () => {
    expect(validateEmail('   ')).toBeTruthy();
  });

  it('@가 없으면 에러 메시지를 반환한다', () => {
    expect(validateEmail('invalidemail')).toBeTruthy();
  });

  it('도메인이 없으면 에러 메시지를 반환한다', () => {
    expect(validateEmail('user@')).toBeTruthy();
  });
});

describe('validatePassword', () => {
  it('8자 이상 비밀번호는 null을 반환한다', () => {
    expect(validatePassword('password1')).toBeNull();
  });

  it('빈 문자열은 에러 메시지를 반환한다', () => {
    expect(validatePassword('')).toBeTruthy();
  });

  it('7자 이하는 에러 메시지를 반환한다 (BR-T-06 유사)', () => {
    expect(validatePassword('1234567')).toBeTruthy();
  });

  it('정확히 8자는 유효하다', () => {
    expect(validatePassword('12345678')).toBeNull();
  });
});

describe('validatePasswordMatch', () => {
  it('일치하는 비밀번호는 null을 반환한다', () => {
    expect(validatePasswordMatch('password1', 'password1')).toBeNull();
  });

  it('불일치하는 비밀번호는 에러 메시지를 반환한다', () => {
    expect(validatePasswordMatch('password1', 'password2')).toBeTruthy();
  });

  it('확인 비밀번호가 빈 문자열이면 에러 메시지를 반환한다', () => {
    expect(validatePasswordMatch('password1', '')).toBeTruthy();
  });
});

describe('validateTodoTitle', () => {
  it('정상 제목은 null을 반환한다', () => {
    expect(validateTodoTitle('할일 제목')).toBeNull();
  });

  it('빈 문자열은 에러 메시지를 반환한다 (BR-T-02)', () => {
    expect(validateTodoTitle('')).toBeTruthy();
  });

  it('공백만 있으면 에러 메시지를 반환한다', () => {
    expect(validateTodoTitle('   ')).toBeTruthy();
  });
});

describe('validateCategoryName', () => {
  it('정상 카테고리 이름은 null을 반환한다', () => {
    expect(validateCategoryName('독서')).toBeNull();
  });

  it('빈 문자열은 에러 메시지를 반환한다', () => {
    expect(validateCategoryName('')).toBeTruthy();
  });

  it('공백만 있으면 에러 메시지를 반환한다', () => {
    expect(validateCategoryName('   ')).toBeTruthy();
  });
});
