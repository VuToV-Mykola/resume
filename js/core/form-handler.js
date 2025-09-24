/**
 * Form Handler Module
 * Управління формами та їх даними
 */

class FormHandler {
  constructor(stateManager, validationService) {
    this.stateManager = stateManager;
    this.validationService = validationService;
    this.debounceTimers = new Map();
  }

  /**
   * Зберігає дані форми
   * @param {string} formType - Тип форми (bewerbung/lebenslauf)
   */
  async saveFormData(formType = 'bewerbung') {
    try {
      const formValues = this.getFormValues(formType);

      // Валідація
      const validation = this.validationService.validateForm(
        formValues,
        this.getRequiredFields(formType)
      );

      if (!validation.isValid) {
        this.validationService.displayErrors(validation.errors);
        return { success: false, errors: validation.errors };
      }

      // Збереження в state
      const state = this.stateManager.getState();
      state.formData[formType] = formValues;
      this.stateManager.saveState(state);

      return { success: true, data: formValues };
    } catch (error) {
      console.error('❌ Помилка збереження форми:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Завантажує дані форми
   * @param {string} formType - Тип форми
   */
  loadFormData(formType = 'bewerbung') {
    try {
      const state = this.stateManager.getState();
      const formData = state.formData?.[formType];

      if (formData) {
        this.populateForm(formType, formData);
        return { success: true, data: formData };
      }

      return { success: false, message: 'Дані не знайдено' };
    } catch (error) {
      console.error('❌ Помилка завантаження форми:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Отримує значення полів форми
   * @param {string} formType - Тип форми
   * @returns {Object} - Об'єкт з даними форми
   */
  getFormValues(formType) {
    const formId = formType === 'bewerbung' ? 'bewerbungForm' : 'lebenslaufForm';
    const form = document.getElementById(formId);

    if (!form) {
      throw new Error(`Форма ${formId} не знайдена`);
    }

    const formData = new FormData(form);
    const values = {};

    for (const [key, value] of formData.entries()) {
      values[key] = value;
    }

    // Додаткові поля
    const additionalFields = this.getAdditionalFields(formType);
    Object.assign(values, additionalFields);

    return values;
  }

  /**
   * Заповнює форму даними
   * @param {string} formType - Тип форми
   * @param {Object} data - Дані для заповнення
   */
  populateForm(formType, data) {
    const formId = formType === 'bewerbung' ? 'bewerbungForm' : 'lebenslaufForm';
    const form = document.getElementById(formId);

    if (!form) {
      console.warn(`Форма ${formId} не знайдена`);
      return;
    }

    Object.entries(data).forEach(([key, value]) => {
      const field = form.querySelector(`[name="${key}"]`);

      if (field) {
        if (field.type === 'checkbox') {
          field.checked = value === true || value === 'true';
        } else if (field.type === 'radio') {
          const radio = form.querySelector(`[name="${key}"][value="${value}"]`);
          if (radio) {
            radio.checked = true;
          }
        } else {
          field.value = value;
        }
      }
    });

    // Тригер оновлення preview
    this.triggerPreviewUpdate();
  }

  /**
   * Додаткові поля специфічні для форми
   * @param {string} formType - Тип форми
   * @returns {Object} - Додаткові поля
   */
  getAdditionalFields(formType) {
    const fields = {};

    if (formType === 'bewerbung') {
      // Дата листа
      const dateField = document.getElementById('letterDate');
      if (dateField) {
        fields.letterDate = dateField.value || new Date().toISOString().split('T')[0];
      }

      // Колір subject
      const colorField = document.getElementById('subjectColor');
      if (colorField) {
        fields.subjectColor = colorField.value;
      }
    }

    if (formType === 'lebenslauf') {
      // Фото
      const state = this.stateManager.getState();
      if (state.globalPhotoData) {
        fields.photo = state.globalPhotoData;
      }
    }

    return fields;
  }

  /**
   * Обов'язкові поля для кожної форми
   * @param {string} formType - Тип форми
   * @returns {Array} - Масив обов'язкових полів
   */
  getRequiredFields(formType) {
    const common = ['fullName', 'email', 'phone', 'address'];

    if (formType === 'bewerbung') {
      return [
        ...common,
        'position',
        'company',
        'contactName',
        'greeting',
        'motivation',
        'qualifications'
      ];
    }

    if (formType === 'lebenslauf') {
      return [
        ...common,
        'lebenslaufSummary',
        'lebenslaufSkills',
        'lebenslaufExperience',
        'lebenslaufEducation'
      ];
    }

    return common;
  }

  /**
   * Очищає форму
   * @param {string} formType - Тип форми
   */
  clearForm(formType) {
    const formId = formType === 'bewerbung' ? 'bewerbungForm' : 'lebenslaufForm';
    const form = document.getElementById(formId);

    if (form) {
      form.reset();
      this.validationService.clearDisplayedErrors();
      this.triggerPreviewUpdate();
    }
  }

  /**
   * Debounced оновлення preview
   */
  triggerPreviewUpdate() {
    const timerId = this.debounceTimers.get('preview');
    if (timerId) {
      clearTimeout(timerId);
    }

    const newTimer = setTimeout(() => {
      if (typeof updatePreview === 'function') {
        updatePreview();
      }
      this.debounceTimers.delete('preview');
    }, 300);

    this.debounceTimers.set('preview', newTimer);
  }

  /**
   * Додає event listeners до форми
   * @param {string} formType - Тип форми
   */
  attachEventListeners(formType) {
    const formId = formType === 'bewerbung' ? 'bewerbungForm' : 'lebenslaufForm';
    const form = document.getElementById(formId);

    if (!form) {
      return;
    }

    // Input events для auto-save
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        this.handleInputChange(formType);
      });

      // Валідація при blur
      input.addEventListener('blur', () => {
        this.validateField(input);
      });
    });

    // Submit event
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit(formType);
    });
  }

  /**
   * Обробник зміни input
   * @param {string} formType - Тип форми
   */
  handleInputChange(formType) {
    const timerId = this.debounceTimers.get(`autosave-${formType}`);
    if (timerId) {
      clearTimeout(timerId);
    }

    const newTimer = setTimeout(() => {
      this.saveFormData(formType);
      this.debounceTimers.delete(`autosave-${formType}`);
    }, 1000);

    this.debounceTimers.set(`autosave-${formType}`, newTimer);
  }

  /**
   * Валідація окремого поля
   * @param {HTMLElement} field - Поле для валідації
   */
  validateField(field) {
    const value = field.value;
    const name = field.name;

    // Очищення попередніх помилок
    field.classList.remove('error');
    const errorMsg = field.parentNode.querySelector('.error-message');
    if (errorMsg) {
      errorMsg.remove();
    }

    // Валідація
    let isValid = true;
    let errorMessage = '';

    if (field.required && !value.trim()) {
      isValid = false;
      errorMessage = 'Це поле є обов\'язковим';
    } else if (field.type === 'email' && value) {
      isValid = this.validationService.validateEmail(value);
      if (!isValid) {
        errorMessage = 'Невірний формат email';
      }
    } else if (field.type === 'tel' && value) {
      isValid = this.validationService.validatePhone(value);
      if (!isValid) {
        errorMessage = 'Невірний формат телефону';
      }
    }

    // Відображення помилки
    if (!isValid) {
      field.classList.add('error');
      const error = document.createElement('div');
      error.className = 'error-message';
      error.textContent = errorMessage;
      field.parentNode.appendChild(error);
    }

    return isValid;
  }

  /**
   * Обробник submit форми
   * @param {string} formType - Тип форми
   */
  async handleSubmit(formType) {
    const result = await this.saveFormData(formType);

    if (result.success) {
      if (typeof showStatus === 'function') {
        showStatus(`✅ Форму ${formType} збережено`, 'success');
      }

      if (window.accessibilityManager) {
        window.accessibilityManager.announce(`Форму ${formType} збережено`);
      }
    } else {
      if (typeof showStatus === 'function') {
        showStatus(`❌ Помилка збереження: ${result.error}`, 'error');
      }
    }

    return result;
  }
}

// Експорт
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormHandler;
} else if (typeof window !== 'undefined') {
  window.FormHandler = FormHandler;

  // Auto-initialization
  if (window.stateManager && window.validationService) {
    window.formHandler = new FormHandler(
      window.stateManager,
      window.validationService
    );
  }
}