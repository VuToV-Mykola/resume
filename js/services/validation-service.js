/**
 * Сервіс валідації форм
 * Централізована валідація з підтримкою багатомовності
 */

class ValidationService {
  constructor() {
    this.errors = [];
    this.rules = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^[\+]?[0-9\s\-\(\)]{10,}$/,
      required: (value) => value && value.trim().length > 0
    };
  }

  /**
   * Валідація email
   * @param {string} email - Email для валідації
   * @returns {boolean} - Результат валідації
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      this.addError('email', 'Email є обов\'язковим полем');
      return false;
    }

    if (!this.rules.email.test(email.trim())) {
      this.addError('email', 'Невірний формат email');
      return false;
    }

    return true;
  }

  /**
   * Валідація телефону
   * @param {string} phone - Телефон для валідації
   * @returns {boolean} - Результат валідації
   */
  validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
      this.addError('phone', 'Телефон є обов\'язковим полем');
      return false;
    }

    if (!this.rules.phone.test(phone.trim())) {
      this.addError('phone', 'Невірний формат телефону');
      return false;
    }

    return true;
  }

  /**
   * Валідація обов'язкового поля
   * @param {string} fieldName - Назва поля
   * @param {*} value - Значення поля
   * @returns {boolean} - Результат валідації
   */
  validateRequired(fieldName, value) {
    if (!this.rules.required(value)) {
      this.addError(fieldName, `${fieldName} є обов'язковим полем`);
      return false;
    }
    return true;
  }

  /**
   * Валідація файлу (зображення)
   * @param {File} file - Файл для валідації
   * @param {Object} options - Опції валідації
   * @returns {Object} - Результат валідації
   */
  validateFile(file, options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    } = options;

    if (!file) {
      return { isValid: false, error: 'Файл не надано' };
    }

    if (file.size > maxSize) {
      const sizeMB = Math.round(maxSize / 1024 / 1024);
      return {
        isValid: false,
        error: `Файл занадто великий. Максимум: ${sizeMB}MB`
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Недопустимий тип файлу. Дозволено: ${allowedTypes.join(', ')}`
      };
    }

    return { isValid: true };
  }

  /**
   * Валідація всієї форми
   * @param {Object} formData - Дані форми
   * @param {Array} requiredFields - Список обов'язкових полів
   * @returns {Object} - Результат валідації
   */
  validateForm(formData, requiredFields = []) {
    this.clearErrors();

    requiredFields.forEach(field => {
      if (field === 'email') {
        this.validateEmail(formData[field]);
      } else if (field === 'phone') {
        this.validatePhone(formData[field]);
      } else {
        this.validateRequired(field, formData[field]);
      }
    });

    return {
      isValid: this.errors.length === 0,
      errors: this.getErrors()
    };
  }

  /**
   * Додає помилку
   * @param {string} field - Поле з помилкою
   * @param {string} message - Повідомлення про помилку
   */
  addError(field, message) {
    this.errors.push({ field, message });
  }

  /**
   * Отримує всі помилки
   * @returns {Array} - Масив помилок
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Очищає помилки
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Показує помилки в UI
   * @param {Array} errors - Масив помилок
   */
  displayErrors(errors) {
    errors.forEach(({ field, message }) => {
      const inputElement = document.getElementById(field);
      if (inputElement) {
        inputElement.classList.add('error');

        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        inputElement.parentNode.appendChild(errorElement);
      }
    });
  }

  /**
   * Очищає відображення помилок
   */
  clearDisplayedErrors() {
    document.querySelectorAll('.error').forEach(el => {
      el.classList.remove('error');
    });

    document.querySelectorAll('.error-message').forEach(el => {
      el.remove();
    });
  }
}

// Експорт singleton instance
const validationService = new ValidationService();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = validationService;
} else if (typeof window !== 'undefined') {
  window.validationService = validationService;
}