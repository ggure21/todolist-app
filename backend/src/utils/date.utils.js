'use strict';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 오늘 날짜를 YYYY-MM-DD 문자열로 반환한다. (시간 제외)
 *
 * @returns {string}  오늘 날짜 (YYYY-MM-DD)
 */
function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * dateString이 YYYY-MM-DD 형식이고 오늘 이후인지 확인한다. (BR-T-06)
 * 오늘 날짜는 유효한 값으로 처리한다.
 *
 * @param {string} dateString
 * @returns {boolean}
 */
function isValidFutureDate(dateString) {
  if (!dateString || !DATE_RE.test(dateString)) return false;

  const d = new Date(dateString);
  if (isNaN(d.getTime())) return false;

  const today = getTodayDate();
  return dateString >= today;
}

/**
 * dueDate가 오늘보다 과거인지 확인한다. (BR-F-02)
 * dueDate < CURRENT_DATE 이면 true를 반환한다.
 *
 * @param {string | Date | null | undefined} dueDate  YYYY-MM-DD 문자열 또는 Date 객체
 * @returns {boolean}
 */
function isOverdue(dueDate) {
  if (!dueDate) return false;

  const dateStr = dueDate instanceof Date
    ? dueDate.toISOString().slice(0, 10)
    : String(dueDate).slice(0, 10);

  const today = getTodayDate();
  return dateStr < today;
}

module.exports = { getTodayDate, isValidFutureDate, isOverdue };
