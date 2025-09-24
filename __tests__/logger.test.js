const logger = require('../js/utils/logger.js');

describe('Logger', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let consoleWarnSpy;
  let consoleInfoSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  describe('log', () => {
    test('викликає console.log з аргументами', () => {
      logger.log('Test message');
      expect(consoleLogSpy).toHaveBeenCalledWith('Test message');
    });

    test('передає множинні аргументи', () => {
      logger.log('Message', 123, { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalledWith('Message', 123, { key: 'value' });
    });
  });

  describe('error', () => {
    test('завжди викликає console.error', () => {
      logger.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error message');
    });

    test('викликає з декількома аргументами', () => {
      const error = new Error('Test');
      logger.error('Error:', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
    });
  });

  describe('warn', () => {
    test('викликає console.warn з аргументами', () => {
      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Warning message');
    });

    test('передає множинні аргументи', () => {
      logger.warn('Warning', true, [1, 2, 3]);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Warning', true, [1, 2, 3]);
    });
  });

  describe('info', () => {
    test('викликає console.info з аргументами', () => {
      logger.info('Info message');
      expect(consoleInfoSpy).toHaveBeenCalledWith('Info message');
    });

    test('передає множинні аргументи', () => {
      logger.info('Info', { data: 123 });
      expect(consoleInfoSpy).toHaveBeenCalledWith('Info', { data: 123 });
    });
  });
});