/**
 * Сервіс перекладів
 * Централізована система багатомовності для Resume Generator
 * Підтримка: українська (uk), німецька (de), англійська (en)
 */

class TranslationService {
  constructor() {
    this.currentLanguage = 'de'; // За замовчуванням німецька
    this.translations = {}; // Кеш перекладів
    this.originalContent = {}; // Оригінальний контент полів
    this.showingOriginal = false; // Прапорець показу оригіналу
    this.logger = null; // Буде встановлено через setLogger
    this.domCache = null; // Буде встановлено через setDOMCache
  }

  /**
   * Встановлення logger'а
   * @param {Object} logger - Logger instance
   */
  setLogger(logger) {
    this.logger = logger;
  }

  /**
   * Встановлення DOMCache
   * @param {Object} domCache - DOMCache instance
   */
  setDOMCache(domCache) {
    this.domCache = domCache;
  }

  /**
   * Логування з перевіркою
   * @param {...any} args - Аргументи для логування
   */
  log(...args) {
    if (this.logger) {
      this.logger.log(...args);
    }
  }

  /**
   * Логування помилок
   * @param {...any} args - Аргументи для логування
   */
  error(...args) {
    if (this.logger) {
      this.logger.error(...args);
    }
  }

  /**
   * Встановлення поточної мови
   * @param {string} lang - Код мови (uk, de, en)
   */
  setCurrentLanguage(lang) {
    this.currentLanguage = lang;
    this.log(`Language set to: ${lang}`);
  }

  /**
   * Отримання поточної мови
   * @returns {string} Код поточної мови
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Завантаження перекладів з JSON файлу
   * @param {string} lang - Код мови
   * @returns {Promise<boolean>} Успішність завантаження
   */
  async loadTranslations(lang) {
    this.log(`🌍 Loading translations for: ${lang}`);
    this.log(`🔗 Fetching URL: locales/${lang}.json?v=20250914`);

    try {
      const response = await fetch(`locales/${lang}.json?v=20250914`);
      this.log(`📡 Response status:`, response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.translations[lang] = data;
      this.log(`✅ Translations loaded for ${lang}, keys:`, Object.keys(data).slice(0, 5));

      // Затримка для повного завантаження
      await new Promise(resolve => setTimeout(resolve, 100));
      return true;
    } catch (error) {
      this.error(`Failed to load translations for ${lang}:`, error);
      return false;
    }
  }

  /**
   * Отримання перекладу за ключем
   * @param {string} key - Ключ перекладу (наприклад, "form.fullName")
   * @returns {string|null} Переклад або null
   */
  getTranslation(key) {
    this.log(`Getting translation for key: ${key}, language: ${this.currentLanguage}`);

    const keys = key.split('.');
    let translation = this.translations[this.currentLanguage];

    if (!translation) {
      this.error(`No translations loaded for language: ${this.currentLanguage}`);
      return null;
    }

    // Навігація по вкладених ключах
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        this.log(`Translation not found for key: ${key}`);
        return null;
      }
    }

    return typeof translation === 'string' ? translation : null;
  }

  /**
   * Перевірка доступності перекладів для мови
   * @param {string} lang - Код мови
   * @returns {boolean} Чи доступні переклади
   */
  hasTranslations(lang) {
    return !!(this.translations[lang] && Object.keys(this.translations[lang]).length > 0);
  }

  /**
   * Переклад всіх елементів на сторінці з data-translate
   */
  translatePage() {
    this.log('Translating page elements');

    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
      const key = element.getAttribute('data-translate');
      const translation = this.getTranslation(key);

      if (translation) {
        if (element.tagName === 'INPUT' && element.type === 'submit') {
          element.value = translation;
        } else if (element.tagName === 'INPUT' && element.placeholder !== undefined) {
          element.placeholder = translation;
        } else {
          element.textContent = translation;
        }
        this.log(`Translated element [${key}]: ${translation}`);
      }
    });
  }

  /**
   * Переклад полів форми
   * @returns {Promise<void>}
   */
  async translateFormFields() {
    this.log('=== translateFormFields called ===');
    this.log(`Current language: ${this.currentLanguage}`);

    if (!this.hasTranslations(this.currentLanguage)) {
      this.error(`No translations available for: ${this.currentLanguage}`);
      return;
    }

    // Основні поля форми
    const mainFormFields = [
      { id: 'fullName', key: 'form.fullName' },
      { id: 'address', key: 'form.address' },
      { id: 'phone', key: 'form.phone' },
      { id: 'email', key: 'form.email' },
      { id: 'birthDate', key: 'form.birthDate' },
      { id: 'nationality', key: 'form.nationality' },
      { id: 'position', key: 'form.position' },
      { id: 'company', key: 'form.company' },
      { id: 'jobNumber', key: 'form.jobNumber' },
      { id: 'contactName', key: 'form.contactName' },
      { id: 'contactAddress', key: 'form.contactAddress' },
      { id: 'contactPhone', key: 'form.contactPhone' },
      { id: 'contactEmail', key: 'form.contactEmail' },
      { id: 'subject', key: 'form.subject' },
      { id: 'greeting', key: 'form.greetingPlaceholder' },
      { id: 'motivation', key: 'form.motivationPlaceholder' },
      { id: 'qualifications', key: 'form.qualificationsPlaceholder' },
      { id: 'tasks', key: 'form.tasksPlaceholder' },
      { id: 'future', key: 'form.futurePlaceholder' },
      { id: 'availability', key: 'form.availabilityPlaceholder' },
      { id: 'closing', key: 'form.closing' },
      { id: 'signature', key: 'form.signature' }
    ];

    // Переклад основних полів
    this._translateFields(mainFormFields);

    // Поля Lebenslauf
    const lebenslaufFields = [
      { id: 'lebenslaufFullName', key: 'form.fullName', valueKey: 'lebenslaufInputValues.fullName' },
      { id: 'lebenslaufAddress', key: 'form.address', valueKey: 'lebenslaufInputValues.address' },
      { id: 'lebenslaufPhone', key: 'form.phone', valueKey: 'lebenslaufInputValues.phone' },
      { id: 'lebenslaufEmail', key: 'form.email', valueKey: 'lebenslaufInputValues.email' },
      { id: 'lebenslaufBirthDate', key: 'form.birthDate', valueKey: 'lebenslaufInputValues.birthDate' },
      { id: 'lebenslaufNationality', key: 'form.nationality', valueKey: 'lebenslaufInputValues.nationality' },
      { id: 'lebenslaufSummary', key: 'form.motivationPlaceholder', valueKey: 'lebenslaufInputValues.summary' },
      { id: 'lebenslaufSkills', key: 'form.qualificationsPlaceholder', valueKey: 'lebenslaufInputValues.skills' },
      { id: 'lebenslaufExperience', key: 'form.qualificationsPlaceholder', valueKey: 'lebenslaufInputValues.experience' },
      { id: 'lebenslaufEducation', key: 'form.qualificationsPlaceholder', valueKey: 'lebenslaufInputValues.education' },
      { id: 'lebenslaufCertifications', key: 'form.qualificationsPlaceholder', valueKey: 'lebenslaufInputValues.certifications' },
      { id: 'lebenslaufLanguages', key: 'form.qualificationsPlaceholder', valueKey: 'lebenslaufInputValues.languages' },
      { id: 'lebenslaufAdditional', key: 'form.qualificationsPlaceholder', valueKey: 'lebenslaufInputValues.additional' }
    ];

    // Переклад полів Lebenslauf
    this._translateFields(lebenslaufFields, true);
  }

  /**
   * Внутрішній метод перекладу полів
   * @param {Array} fields - Масив полів для перекладу
   * @param {boolean} isLebenslauf - Чи це поля Lebenslauf
   * @private
   */
  _translateFields(fields, isLebenslauf = false) {
    fields.forEach(field => {
      const element = document.getElementById(field.id);
      if (element) {
        const placeholderTranslation = this.getTranslation(field.key);
        const fieldValueTranslation = this.getTranslation(`fieldValues.${field.id}`);
        const contentValueTranslation = this.getTranslation(`contentValues.${field.id}`);
        const lebenslaufValueTranslation = field.valueKey ? this.getTranslation(field.valueKey) : null;

        this.log(`Field ${field.id}: placeholder="${placeholderTranslation}", fieldValue="${fieldValueTranslation}", contentValue="${contentValueTranslation}", lebenslaufValue="${lebenslaufValueTranslation}"`);

        if (placeholderTranslation && !this.showingOriginal) {
          // Оновлення placeholder
          element.placeholder = placeholderTranslation;

          // Оновлення значення поля
          const valueToUse = lebenslaufValueTranslation || contentValueTranslation || fieldValueTranslation;
          if (valueToUse && (!element.value || element.value.trim() === '')) {
            element.value = valueToUse;
            this.log(`Set value for ${field.id}: ${valueToUse}`);
          }
        }
      } else {
        this.log(`Element ${field.id} not found`);
      }
    });
  }

  /**
   * Зміна мови
   * @param {string} lang - Новий код мови
   * @returns {Promise<boolean>} Успішність зміни мови
   */
  async changeLanguage(lang) {
    if (!lang || lang === this.currentLanguage) {
      return false;
    }

    this.log(`Changing language from ${this.currentLanguage} to ${lang}`);

    // Завантаження перекладів якщо не завантажені
    if (!this.hasTranslations(lang)) {
      const loaded = await this.loadTranslations(lang);
      if (!loaded) {
        this.error(`Failed to load translations for: ${lang}`);
        return false;
      }
    }

    // Встановлення нової мови
    this.setCurrentLanguage(lang);

    // Оновлення атрибуту lang документа
    document.documentElement.lang = lang;

    // Оновлення активного прапорця мови
    this._updateLanguageFlags(lang);

    // Скидання прапорця показу оригіналу
    this.showingOriginal = false;

    // Переклад сторінки та полів
    this.translatePage();
    await this.translateFormFields();

    this.log(`Language successfully changed to: ${lang}`);
    return true;
  }

  /**
   * Оновлення активних прапорців мови
   * @param {string} lang - Активна мова
   * @private
   */
  _updateLanguageFlags(lang) {
    const languageFlags = document.querySelectorAll('.language-flag');
    languageFlags.forEach(flag => {
      flag.classList.remove('active');
      if (flag.getAttribute('data-lang') === lang) {
        flag.classList.add('active');
      }
    });
  }

  /**
   * Перемикання показу оригінального контенту
   * @param {boolean} show - Показувати оригінал
   */
  toggleShowOriginal(show = null) {
    if (show === null) {
      this.showingOriginal = !this.showingOriginal;
    } else {
      this.showingOriginal = show;
    }

    this.log(`Showing original content: ${this.showingOriginal}`);

    // Повторний переклад з урахуванням прапорця
    this.translatePage();
  }

  /**
   * Отримання всіх доступних мов
   * @returns {Array<string>} Масив кодів доступних мов
   */
  getAvailableLanguages() {
    return Object.keys(this.translations);
  }

  /**
   * Очищення кешу перекладів
   */
  clearTranslations() {
    this.translations = {};
    this.originalContent = {};
    this.log('Translation cache cleared');
  }

  /**
   * Отримання статистики перекладів
   * @returns {Object} Статистика завантажених перекладів
   */
  getTranslationStats() {
    const stats = {};
    Object.keys(this.translations).forEach(lang => {
      const translation = this.translations[lang];
      stats[lang] = {
        keysCount: this._countTranslationKeys(translation),
        loaded: true
      };
    });
    return stats;
  }

  /**
   * Підрахунок кількості ключів перекладу
   * @param {Object} obj - Об'єкт перекладів
   * @returns {number} Кількість ключів
   * @private
   */
  _countTranslationKeys(obj) {
    let count = 0;
    const countKeys = (o) => {
      for (const key in o) {
        if (typeof o[key] === 'object') {
          countKeys(o[key]);
        } else {
          count++;
        }
      }
    };
    countKeys(obj);
    return count;
  }
}

// Експорт singleton instance
const translationService = new TranslationService();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = translationService;
} else if (typeof window !== 'undefined') {
  window.translationService = translationService;
}