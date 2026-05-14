import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDate, isOverdue, isValidFutureDate } from './date.utils';

const FIXED_TODAY = new Date('2026-05-14T12:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_TODAY);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('isOverdue', () => {
  it('어제 날짜는 기간 초과이다', () => {
    expect(isOverdue('2026-05-13')).toBe(true);
  });

  it('오늘 날짜는 기간 초과가 아니다', () => {
    expect(isOverdue('2026-05-14')).toBe(false);
  });

  it('내일 날짜는 기간 초과가 아니다', () => {
    expect(isOverdue('2026-05-15')).toBe(false);
  });

  it('null이면 false이다', () => {
    expect(isOverdue(null)).toBe(false);
  });

  it('undefined이면 false이다', () => {
    expect(isOverdue(undefined)).toBe(false);
  });
});

describe('isValidFutureDate', () => {
  it('오늘 날짜는 유효하다', () => {
    expect(isValidFutureDate('2026-05-14')).toBe(true);
  });

  it('미래 날짜는 유효하다', () => {
    expect(isValidFutureDate('2026-12-31')).toBe(true);
  });

  it('어제 날짜는 유효하지 않다 (BR-T-06)', () => {
    expect(isValidFutureDate('2026-05-13')).toBe(false);
  });

  it('빈 문자열은 유효하지 않다', () => {
    expect(isValidFutureDate('')).toBe(false);
  });

  it('잘못된 형식은 유효하지 않다', () => {
    expect(isValidFutureDate('2026/05/20')).toBe(false);
    expect(isValidFutureDate('not-a-date')).toBe(false);
  });

  it('존재하지 않는 날짜는 유효하지 않다', () => {
    expect(isValidFutureDate('2026-13-01')).toBe(false);
  });
});

describe('formatDate', () => {
  it('ISO 날짜 문자열을 YYYY-MM-DD 형식으로 반환한다', () => {
    expect(formatDate('2026-05-20T00:00:00.000Z')).toBe('2026-05-20');
  });

  it('YYYY-MM-DD 문자열을 그대로 반환한다', () => {
    expect(formatDate('2026-05-20')).toBe('2026-05-20');
  });

  it('null이면 "종료예정일 없음"을 반환한다', () => {
    expect(formatDate(null)).toBe('종료예정일 없음');
  });

  it('undefined이면 "종료예정일 없음"을 반환한다', () => {
    expect(formatDate(undefined)).toBe('종료예정일 없음');
  });

  it('빈 문자열이면 "종료예정일 없음"을 반환한다', () => {
    expect(formatDate('')).toBe('종료예정일 없음');
  });
});
