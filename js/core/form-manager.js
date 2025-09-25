/**
 * FormManager - Управління формами та даними
 * Централізована обробка всіх форм додатку
 */

export class FormManager {
  constructor(stateManager, cache) {
    this.stateManager = stateManager;
    this.cache = cache;
    this.logger = window.logger;
    this.errorProtection = window.errorProtection;
    
    // Дані форми
    this.formData = {};
    this.globalPhotoData = null;
    this.isInitialized = false;
    
    // Обробники подій
    this.eventHandlers = new Map();
    this.debounceTimers = new Map();
    
    // Конфігурація
    this.config = {
      debounceDelay: 300,
      autoSave: true,
      validation: true
    };
  }

  /**
   * Ініціалізація FormManager
   */
  async initialize() {
    if (this.isInitialized) {
      this.logger.warn('FormManager already initialized');
      return;
    }

    this.logger.info('Initializing FormManager...');
    
    try {
      // Завантажуємо дані форми
      await this.loadFormData();
      
      // Налаштовуємо обробники подій
      this.setupEventHandlers();
      
      // Відновлюємо значення полів
      this.restoreFormValues();
      
      this.isInitialized = true;
      this.logger.info('FormManager initialized successfully');
      
    } catch (error) {
      this.errorProtection.handleError(error, 'FormManager Initialization');
      throw error;
    }
  }

  /**
   * Налаштування обробників подій
   */
  setupEventHandlers() {
    // Обробник для всіх input полів
    document.addEventListener('input', (event) => {
      this.handleInputChange(event);
    });

    // Обробник для всіх select полів
    document.addEventListener('change', (event) => {
      this.handleSelectChange(event);
    });

    // Обробник для всіх textarea полів
    document.addEventListener('input', (event) => {
      if (event.target.tagName === 'TEXTAREA') {
        this.handleTextareaChange(event);
      }
    });

    this.logger.info('Event handlers setup completed');
  }

  /**
   * Обробка зміни input полів
   */
  handleInputChange(event) {
    const { target } = event;
    const fieldName = target.name || target.id;
    
    if (!fieldName) {
      return;
    }

    // Debounce для оптимізації
    this.debounceFieldUpdate(fieldName, () => {
      this.updateFieldValue(fieldName, target.value);
    });
  }

  /**
   * Обробка зміни select полів
   */
  handleSelectChange(event) {
    const { target } = event;
    const fieldName = target.name || target.id;
    
    if (!fieldName) {
      return;
    }

    this.updateFieldValue(fieldName, target.value);
  }

  /**
   * Обробка зміни textarea полів
   */
  handleTextareaChange(event) {
    const { target } = event;
    const fieldName = target.name || target.id;
    
    if (!fieldName) {
      return;
    }

    // Debounce для textarea
    this.debounceFieldUpdate(fieldName, () => {
      this.updateFieldValue(fieldName, target.value);
    });
  }

  /**
   * Debounce для оновлення полів
   */
  debounceFieldUpdate(fieldName, callback) {
    // Очищуємо попередній таймер
    if (this.debounceTimers.has(fieldName)) {
      clearTimeout(this.debounceTimers.get(fieldName));
    }

    // Встановлюємо новий таймер
    const timer = setTimeout(() => {
      callback();
      this.debounceTimers.delete(fieldName);
    }, this.config.debounceDelay);

    this.debounceTimers.set(fieldName, timer);
  }

  /**
   * Оновлення значення поля
   */
  updateFieldValue(fieldName, value) {
    try {
      // Оновлюємо дані форми
      this.formData[fieldName] = value;
      
      // Кешуємо зміни
      this.cache.setFormData(`field_${fieldName}`, { value, timestamp: Date.now() });
      
      // Автоматичне збереження
      if (this.config.autoSave) {
        this.saveFormData();
      }
      
      // Валідація поля
      if (this.config.validation) {
        this.validateField(fieldName, value);
      }
      
      // Викликаємо обробники
      this.callFieldHandlers(fieldName, value);
      
      this.logger.debug(`Field ${fieldName} updated:`, value);
      
    } catch (error) {
      this.errorProtection.handleError(error, 'Field Update');
    }
  }

  /**
   * Валідація поля
   */
  validateField(fieldName, value) {
    const field = document.querySelector(`[name="${fieldName}"], #${fieldName}`);
    if (!field) {
      return;
    }

    // Базові правила валідації
    const rules = this.getValidationRules(fieldName);
    const errors = [];

    for (const rule of rules) {
      if (!rule.validator(value)) {
        errors.push(rule.message);
      }
    }

    // Показуємо помилки
    if (errors.length > 0) {
      this.showFieldErrors(fieldName, errors);
    } else {
      this.clearFieldErrors(fieldName);
    }
  }

  /**
   * Отримання правил валідації для поля
   */
  getValidationRules(fieldName) {
    const rules = [];

    // Обов'язкові поля
    if (this.isRequiredField(fieldName)) {
      rules.push({
        validator: (value) => value && value.trim().length > 0,
        message: 'Це поле обов\'язкове для заповнення'
      });
    }

    // Email валідація
    if (fieldName.includes('email') || fieldName.includes('Email')) {
      rules.push({
        validator: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Введіть коректну email адресу'
      });
    }

    // Телефон валідація
    if (fieldName.includes('phone') || fieldName.includes('Phone')) {
      rules.push({
        validator: (value) => !value || /^[\+]?[0-9\s\-\(\)]+$/.test(value),
        message: 'Введіть коректний номер телефону'
      });
    }

    return rules;
  }

  /**
   * Перевірка чи поле обов'язкове
   */
  isRequiredField(fieldName) {
    const field = document.querySelector(`[name="${fieldName}"], #${fieldName}`);
    return field && (field.hasAttribute('required') || field.classList.contains('required'));
  }

  /**
   * Показ помилок поля
   */
  showFieldErrors(fieldName, errors) {
    const field = document.querySelector(`[name="${fieldName}"], #${fieldName}`);
    if (!field) {
      return;
    }

    // Додаємо клас помилки
    field.classList.add('error');
    
    // Показуємо повідомлення про помилку
    const errorContainer = field.parentNode.querySelector('.field-error');
    if (errorContainer) {
      errorContainer.textContent = errors.join(', ');
      errorContainer.style.display = 'block';
    }
  }

  /**
   * Очищення помилок поля
   */
  clearFieldErrors(fieldName) {
    const field = document.querySelector(`[name="${fieldName}"], #${fieldName}`);
    if (!field) {
      return;
    }

    // Видаляємо клас помилки
    field.classList.remove('error');
    
    // Приховуємо повідомлення про помилку
    const errorContainer = field.parentNode.querySelector('.field-error');
    if (errorContainer) {
      errorContainer.style.display = 'none';
    }
  }

  /**
   * Виклик обробників поля
   */
  callFieldHandlers(fieldName, value) {
    const handlers = this.eventHandlers.get(fieldName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(value, fieldName);
        } catch (error) {
          this.errorProtection.handleError(error, 'Field Handler');
        }
      });
    }
  }

  /**
   * Реєстрація обробника поля
   */
  addFieldHandler(fieldName, handler) {
    if (!this.eventHandlers.has(fieldName)) {
      this.eventHandlers.set(fieldName, []);
    }
    this.eventHandlers.get(fieldName).push(handler);
  }

  /**
   * Завантаження даних форми
   */
  async loadFormData() {
    try {
      // Спочатку пробуємо завантажити з кешу
      const cachedData = this.cache.getFormData('form_data');
      if (cachedData) {
        this.formData = cachedData;
        this.logger.info('Form data loaded from cache');
        return;
      }

      // Потім з stateManager
      if (this.stateManager) {
        const state = await this.stateManager.loadState();
        if (state && state.formData) {
          this.formData = state.formData;
          this.globalPhotoData = state.globalPhotoData;
          this.logger.info('Form data loaded from state manager');
          return;
        }
      }

      // Нарешті з localStorage
      const savedData = localStorage.getItem('resumeFormData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        this.formData = parsed.formData || {};
        this.globalPhotoData = parsed.globalPhotoData || null;
        this.logger.info('Form data loaded from localStorage');
      }

    } catch (error) {
      this.errorProtection.handleError(error, 'Form Data Load');
      this.formData = {};
    }
  }

  /**
   * Збереження даних форми
   */
  async saveFormData() {
    try {
      const dataToSave = {
        formData: this.formData,
        globalPhotoData: this.globalPhotoData,
        timestamp: Date.now()
      };

      // Кешуємо дані
      this.cache.setFormData('form_data', this.formData);

      // Зберігаємо в stateManager
      if (this.stateManager) {
        await this.stateManager.saveState(dataToSave);
      }

      // Зберігаємо в localStorage як fallback
      localStorage.setItem('resumeFormData', JSON.stringify(dataToSave));

      this.logger.debug('Form data saved');

    } catch (error) {
      this.errorProtection.handleError(error, 'Form Data Save');
    }
  }

  /**
   * Відновлення значень полів
   */
  restoreFormValues() {
    Object.entries(this.formData).forEach(([fieldName, value]) => {
      const field = document.querySelector(`[name="${fieldName}"], #${fieldName}`);
      if (field && value !== null && value !== undefined) {
        field.value = value;
        this.logger.debug(`Restored field ${fieldName}:`, value);
      }
    });
  }

  /**
   * Отримання даних форми
   */
  getFormData() {
    return { ...this.formData };
  }

  /**
   * Встановлення даних форми
   */
  setFormData(data) {
    this.formData = { ...data };
    this.restoreFormValues();
  }

  /**
   * Очищення даних форми
   */
  clearFormData() {
    this.formData = {};
    this.globalPhotoData = null;
    
    // Очищуємо поля форми
    const fields = document.querySelectorAll('input, textarea, select');
    fields.forEach(field => {
      field.value = '';
      field.classList.remove('error');
    });
    
    // Очищуємо помилки
    const errorContainers = document.querySelectorAll('.field-error');
    errorContainers.forEach(container => {
      container.style.display = 'none';
    });
    
    this.logger.info('Form data cleared');
  }

  /**
   * Переініціалізація
   */
  async reinitialize() {
    this.logger.info('Reinitializing FormManager...');
    
    // Очищуємо таймери
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    // Переініціалізуємо
    this.isInitialized = false;
    await this.initialize();
  }

  /**
   * Знищення FormManager
   */
  destroy() {
    this.logger.info('Destroying FormManager...');
    
    // Очищуємо таймери
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    // Очищуємо обробники
    this.eventHandlers.clear();
    
    this.isInitialized = false;
  }
}

// Експорт вже зроблено в оголошенні класу на лінії 6
