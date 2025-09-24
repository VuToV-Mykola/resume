const validationService = require('../js/services/validation-service.js');

describe('ValidationService', () => {

  beforeEach(() => {
    validationService.clearErrors();
  });

  describe('validateEmail', () => {
    test('валідує коректний email', () => {
      const result = validationService.validateEmail('test@example.com');
      expect(result).toBe(true);
      expect(validationService.getErrors().length).toBe(0);
    });

    test('відхиляє некоректний email', () => {
      const result = validationService.validateEmail('invalid');
      expect(result).toBe(false);
      expect(validationService.getErrors().length).toBeGreaterThan(0);
    });

    test('відхиляє порожній email', () => {
      const result = validationService.validateEmail('');
      expect(result).toBe(false);
    });

    test('відхиляє null email', () => {
      const result = validationService.validateEmail(null);
      expect(result).toBe(false);
    });
  });

  describe('validatePhone', () => {
    test('валідує коректний телефон', () => {
      const result = validationService.validatePhone('+49 123 456789');
      expect(result).toBe(true);
      expect(validationService.getErrors().length).toBe(0);
    });

    test('валідує телефон без пробілів', () => {
      const result = validationService.validatePhone('+491234567890');
      expect(result).toBe(true);
    });

    test('відхиляє короткий телефон', () => {
      const result = validationService.validatePhone('123');
      expect(result).toBe(false);
    });

    test('відхиляє порожній телефон', () => {
      const result = validationService.validatePhone('');
      expect(result).toBe(false);
    });
  });

  describe('validateRequired', () => {
    test('валідує непорожнє значення', () => {
      const result = validationService.validateRequired('name', 'John Doe');
      expect(result).toBe(true);
      expect(validationService.getErrors().length).toBe(0);
    });

    test('відхиляє порожнє значення', () => {
      const result = validationService.validateRequired('name', '');
      expect(result).toBe(false);
      expect(validationService.getErrors().length).toBeGreaterThan(0);
    });

    test('відхиляє пробіли', () => {
      const result = validationService.validateRequired('name', '   ');
      expect(result).toBe(false);
    });
  });

  describe('validateForm', () => {
    test('валідує всю форму з помилками', () => {
      const formData = {
        name: '',
        email: 'invalid-email',
        phone: '123'
      };

      const requiredFields = ['name', 'email', 'phone'];

      const result = validationService.validateForm(formData, requiredFields);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('повертає valid для коректних даних', () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+49 123 456789'
      };

      const requiredFields = ['name', 'email', 'phone'];

      const result = validationService.validateForm(formData, requiredFields);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('валідує тільки вказані поля', () => {
      const formData = {
        name: 'John Doe',
        email: 'invalid',
        phone: '+49 123 456789'
      };

      const requiredFields = ['name', 'phone'];

      const result = validationService.validateForm(formData, requiredFields);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateFile', () => {
    test('валідує коректний файл', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      const result = validationService.validateFile(file);
      expect(result.isValid).toBe(true);
    });

    test('відхиляє занадто великий файл', () => {
      const file = new File(['content'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 });

      const result = validationService.validateFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Файл занадто великий');
    });

    test('відхиляє неприпустимий тип файлу', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 });

      const result = validationService.validateFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Недопустимий тип файлу');
    });

    test('відхиляє відсутній файл', () => {
      const result = validationService.validateFile(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Файл не надано');
    });

    test('підтримує кастомні опції', () => {
      const file = new File(['content'], 'test.gif', { type: 'image/gif' });
      Object.defineProperty(file, 'size', { value: 500 * 1024 });

      const result = validationService.validateFile(file, {
        maxSize: 1 * 1024 * 1024,
        allowedTypes: ['image/gif', 'image/png']
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe('Управління помилками', () => {
    test('очищає помилки', () => {
      validationService.validateEmail('invalid');
      expect(validationService.getErrors().length).toBeGreaterThan(0);

      validationService.clearErrors();
      expect(validationService.getErrors().length).toBe(0);
    });

    test('додає помилку', () => {
      validationService.addError('test', 'Test error');
      const errors = validationService.getErrors();
      expect(errors.length).toBe(1);
      expect(errors[0].field).toBe('test');
      expect(errors[0].message).toBe('Test error');
    });

    test('отримує копію масиву помилок', () => {
      validationService.addError('field1', 'Error 1');
      const errors = validationService.getErrors();
      errors.push({ field: 'field2', message: 'Error 2' });

      expect(validationService.getErrors().length).toBe(1);
    });
  });
});