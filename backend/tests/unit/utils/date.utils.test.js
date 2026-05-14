'use strict';

const { getTodayDate, isValidFutureDate, isOverdue } = require('../../../src/utils/date.utils');

function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

describe('date.utils', () => {
  // -------------------------------------------------------------------------
  // getTodayDate
  // -------------------------------------------------------------------------
  describe('getTodayDate()', () => {
    it('should return a string in YYYY-MM-DD format', () => {
      const result = getTodayDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should match the current date (UTC)', () => {
      const expected = new Date().toISOString().slice(0, 10);
      expect(getTodayDate()).toBe(expected);
    });
  });

  // -------------------------------------------------------------------------
  // isValidFutureDate
  // -------------------------------------------------------------------------
  describe('isValidFutureDate(dateString)', () => {
    it('should return true for a future date', () => {
      expect(isValidFutureDate(offsetDate(1))).toBe(true);
    });

    it('should return true for today (오늘 포함)', () => {
      expect(isValidFutureDate(getTodayDate())).toBe(true);
    });

    it('should return false for yesterday', () => {
      expect(isValidFutureDate(offsetDate(-1))).toBe(false);
    });

    it('should return false for a date far in the past', () => {
      expect(isValidFutureDate('2020-01-01')).toBe(false);
    });

    it('should return false for invalid format (YYYYMMDD)', () => {
      expect(isValidFutureDate('20260101')).toBe(false);
    });

    it('should return false for invalid format (MM/DD/YYYY)', () => {
      expect(isValidFutureDate('01/01/2026')).toBe(false);
    });

    it('should return false for an invalid calendar date (Feb 30)', () => {
      expect(isValidFutureDate('2026-02-30')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isValidFutureDate(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidFutureDate(undefined)).toBe(false);
    });

    it('should return false for an empty string', () => {
      expect(isValidFutureDate('')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // isOverdue
  // -------------------------------------------------------------------------
  describe('isOverdue(dueDate)', () => {
    it('should return true for a past date string', () => {
      expect(isOverdue(offsetDate(-1))).toBe(true);
    });

    it('should return false for today (not overdue yet)', () => {
      expect(isOverdue(getTodayDate())).toBe(false);
    });

    it('should return false for a future date string', () => {
      expect(isOverdue(offsetDate(1))).toBe(false);
    });

    it('should return true for a Date object in the past', () => {
      const pastDateObj = new Date();
      pastDateObj.setDate(pastDateObj.getDate() - 2);
      expect(isOverdue(pastDateObj)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isOverdue(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isOverdue(undefined)).toBe(false);
    });
  });
});
