/**
 * Utility functions for Bewerbung Document Generator
 * Provides validation, error handling, and common operations
 */

class ValidationUtils {
  /**
   * Validates email format
   * @param {string} email - Email to validate
   * @returns {boolean} - True if valid
   */
  static isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return CONFIG.VALIDATION.EMAIL_REGEX.test(email.trim());
  }

  /**
   * Validates phone number format
   * @param {string} phone - Phone to validate
   * @returns {boolean} - True if valid
   */
  static isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    return CONFIG.VALIDATION.PHONE_REGEX.test(phone.trim());
  }

  /**
   * Validates required fields
   * @param {Object} data - Data object to validate
   * @returns {Object} - Validation result with errors array
   */
  static validateRequiredFields(data) {
    const errors = [];
    
    CONFIG.VALIDATION.REQUIRED_FIELDS.forEach(field => {
      if (!data[field] || data[field].trim() === '') {
        errors.push({
          field,
          message: `${field} is required`
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates file upload
   * @param {File} file - File to validate
   * @returns {Object} - Validation result
   */
  static validateFile(file) {
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    if (file.size > CONFIG.UPLOAD.MAX_FILE_SIZE) {
      return { 
        isValid: false, 
        error: `File too large. Maximum size: ${CONFIG.UPLOAD.MAX_FILE_SIZE / 1024 / 1024}MB` 
      };
    }

    if (!CONFIG.UPLOAD.ALLOWED_TYPES.includes(file.type)) {
      return { 
        isValid: false, 
        error: `Invalid file type. Allowed: ${CONFIG.UPLOAD.ALLOWED_TYPES.join(', ')}` 
      };
    }

    return { isValid: true };
  }
}

class ErrorHandler {
  /**
   * Logs error with context
   * @param {Error|string} error - Error to log
   * @param {string} context - Context where error occurred
   * @param {Object} data - Additional data
   */
  static logError(error, context = '', data = {}) {
    const errorObj = {
      message: error instanceof Error ? error.message : error,
      context,
      data,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : null
    };

    console.error('Error occurred:', errorObj);
    
    // In production, you might want to send this to a logging service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: errorObj.message,
        fatal: false
      });
    }
  }

  /**
   * Shows user-friendly error message
   * @param {string} message - Error message
   * @param {string} type - Error type (error, warning, info)
   */
  static showError(message, type = 'error') {
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());

    // Create new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = `error-message error-${type}`;
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      max-width: 300px;
    `;

    document.body.appendChild(errorDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  /**
   * Handles async operations with error catching
   * @param {Function} asyncFn - Async function to execute
   * @param {string} context - Context for error logging
   * @returns {Promise} - Promise that resolves with result or rejects with handled error
   */
  static async handleAsync(asyncFn, context = '') {
    try {
      return await asyncFn();
    } catch (error) {
      this.logError(error, context);
      this.showError(error.message || 'An error occurred', 'error');
      throw error;
    }
  }
}

class DataUtils {
  /**
   * Sanitizes user input
   * @param {string} input - Input to sanitize
   * @returns {string} - Sanitized input
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  }

  /**
   * Formats date for display
   * @param {Date|string} date - Date to format
   * @param {string} locale - Locale for formatting
   * @returns {string} - Formatted date
   */
  static formatDate(date, locale = 'de-DE') {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';

    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Gets default value for field
   * @param {string} field - Field name
   * @param {Object} userData - User data object
   * @returns {string} - Default value
   */
  static getDefaultValue(field, userData = {}) {
    const fieldMap = {
      fullName: CONFIG.DEFAULTS.USER.FULL_NAME,
      address: CONFIG.DEFAULTS.USER.ADDRESS,
      email: CONFIG.DEFAULTS.USER.EMAIL,
      phone: CONFIG.DEFAULTS.USER.PHONE,
      birthDate: CONFIG.DEFAULTS.USER.BIRTH_DATE,
      nationality: CONFIG.DEFAULTS.USER.NATIONALITY,
      position: CONFIG.DEFAULTS.JOB.POSITION,
      company: CONFIG.DEFAULTS.JOB.COMPANY,
      contactPerson: CONFIG.DEFAULTS.JOB.CONTACT_PERSON,
      jobNumber: CONFIG.DEFAULTS.JOB.JOB_NUMBER,
      deadline: CONFIG.DEFAULTS.JOB.DEADLINE
    };

    return userData[field] || fieldMap[field] || '';
  }

  /**
   * Merges user data with defaults
   * @param {Object} userData - User provided data
   * @returns {Object} - Merged data object
   */
  static mergeWithDefaults(userData = {}) {
    const merged = { ...CONFIG.DEFAULTS.USER, ...CONFIG.DEFAULTS.JOB };
    
    Object.keys(userData).forEach(key => {
      if (userData[key] && userData[key].trim() !== '') {
        merged[key] = this.sanitizeInput(userData[key]);
      }
    });

    return merged;
  }
}

class StorageUtils {
  /**
   * Saves data to localStorage with error handling
   * @param {string} key - Storage key
   * @param {Object} data - Data to save
   * @returns {boolean} - Success status
   */
  static saveToStorage(key, data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      ErrorHandler.logError(error, 'StorageUtils.saveToStorage', { key });
      return false;
    }
  }

  /**
   * Loads data from localStorage with error handling
   * @param {string} key - Storage key
   * @returns {Object|null} - Loaded data or null
   */
  static loadFromStorage(key) {
    try {
      const serialized = localStorage.getItem(key);
      return serialized ? JSON.parse(serialized) : null;
    } catch (error) {
      ErrorHandler.logError(error, 'StorageUtils.loadFromStorage', { key });
      return null;
    }
  }

  /**
   * Clears specific key from localStorage
   * @param {string} key - Storage key to clear
   */
  static clearStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      ErrorHandler.logError(error, 'StorageUtils.clearStorage', { key });
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ValidationUtils,
    ErrorHandler,
    DataUtils,
    StorageUtils
  };
} else if (typeof window !== 'undefined') {
  window.ValidationUtils = ValidationUtils;
  window.ErrorHandler = ErrorHandler;
  window.DataUtils = DataUtils;
  window.StorageUtils = StorageUtils;
}
