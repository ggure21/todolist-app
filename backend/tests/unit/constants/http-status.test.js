'use strict';

const HTTP_STATUS = require('../../../src/constants/http-status');

describe('HTTP_STATUS constants', () => {
  it('should define OK as 200', () => expect(HTTP_STATUS.OK).toBe(200));
  it('should define CREATED as 201', () => expect(HTTP_STATUS.CREATED).toBe(201));
  it('should define NO_CONTENT as 204', () => expect(HTTP_STATUS.NO_CONTENT).toBe(204));
  it('should define BAD_REQUEST as 400', () => expect(HTTP_STATUS.BAD_REQUEST).toBe(400));
  it('should define UNAUTHORIZED as 401', () => expect(HTTP_STATUS.UNAUTHORIZED).toBe(401));
  it('should define FORBIDDEN as 403', () => expect(HTTP_STATUS.FORBIDDEN).toBe(403));
  it('should define NOT_FOUND as 404', () => expect(HTTP_STATUS.NOT_FOUND).toBe(404));
  it('should define CONFLICT as 409', () => expect(HTTP_STATUS.CONFLICT).toBe(409));
  it('should define INTERNAL_SERVER_ERROR as 500', () => expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500));

  it('should be frozen (immutable)', () => {
    expect(Object.isFrozen(HTTP_STATUS)).toBe(true);
  });

  it('should throw when attempting to mutate a frozen property', () => {
    expect(() => { HTTP_STATUS.OK = 999; }).toThrow(TypeError);
  });
});
