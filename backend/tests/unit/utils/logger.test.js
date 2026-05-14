'use strict';

const logger = require('../../../src/utils/logger');

describe('logger', () => {
  let consoleSpy = {};
  const originalEnv = process.env.LOG_LEVEL;

  beforeEach(() => {
    consoleSpy.error = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleSpy.warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleSpy.info = jest.spyOn(console, 'info').mockImplementation(() => {});
    consoleSpy.log = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.LOG_LEVEL = originalEnv;
  });

  test('logger 객체에 error/warn/info/debug 메서드가 존재한다', () => {
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  test('LOG_LEVEL=info 일 때 error, warn, info는 출력되고 debug는 무시된다', () => {
    process.env.LOG_LEVEL = 'info';

    logger.error('err msg');
    logger.warn('warn msg');
    logger.info('info msg');
    logger.debug('debug msg');

    expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
    expect(consoleSpy.info).toHaveBeenCalledTimes(1);
    expect(consoleSpy.log).not.toHaveBeenCalled();
  });

  test('LOG_LEVEL=error 일 때 error만 출력된다', () => {
    process.env.LOG_LEVEL = 'error';

    logger.error('err msg');
    logger.warn('warn msg');
    logger.info('info msg');
    logger.debug('debug msg');

    expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    expect(consoleSpy.warn).not.toHaveBeenCalled();
    expect(consoleSpy.info).not.toHaveBeenCalled();
    expect(consoleSpy.log).not.toHaveBeenCalled();
  });

  test('LOG_LEVEL=debug 일 때 모든 레벨이 출력된다', () => {
    process.env.LOG_LEVEL = 'debug';

    logger.error('err msg');
    logger.warn('warn msg');
    logger.info('info msg');
    logger.debug('debug msg');

    expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
    expect(consoleSpy.info).toHaveBeenCalledTimes(1);
    expect(consoleSpy.log).toHaveBeenCalledTimes(1);
  });

  test('LOG_LEVEL 미설정 시 기본값 info가 적용된다', () => {
    delete process.env.LOG_LEVEL;

    logger.info('info msg');
    logger.debug('debug msg');

    expect(consoleSpy.info).toHaveBeenCalledTimes(1);
    expect(consoleSpy.log).not.toHaveBeenCalled();
  });

  test('잘못된 LOG_LEVEL 값은 info로 fallback된다', () => {
    process.env.LOG_LEVEL = 'invalid_level';

    logger.info('info msg');
    logger.debug('debug msg');

    expect(consoleSpy.info).toHaveBeenCalledTimes(1);
    expect(consoleSpy.log).not.toHaveBeenCalled();
  });

  test('출력 메시지에 레벨 태그와 ISO 타임스탬프가 포함된다', () => {
    process.env.LOG_LEVEL = 'info';

    logger.info('test message');

    expect(consoleSpy.info).toHaveBeenCalledWith(
      expect.stringMatching(/^\[INFO\] \d{4}-\d{2}-\d{2}T/),
      'test message'
    );
  });

  test('debug 레벨은 console.log를 사용한다', () => {
    process.env.LOG_LEVEL = 'debug';

    logger.debug('debug message');

    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringMatching(/^\[DEBUG\] \d{4}-\d{2}-\d{2}T/),
      'debug message'
    );
  });
});
