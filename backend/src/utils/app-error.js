'use strict';

/**
 * HTTP 에러를 표현하는 커스텀 에러 클래스.
 * statusCode, message, code를 함께 전달하여 에러 미들웨어가 일관된 형식으로 응답할 수 있도록 한다.
 */
class AppError extends Error {
  /**
   * @param {number} statusCode  HTTP 상태 코드 (e.g. 400, 401, 404, 409)
   * @param {string} message     클라이언트에게 노출할 메시지
   * @param {string} code        머신 리더블 에러 코드 (e.g. 'VALIDATION_ERROR')
   */
  constructor(statusCode, message, code) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

module.exports = AppError;
