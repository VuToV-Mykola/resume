/**
 * Unit тести для Translation Service
 * Базове тестування системи багатомовності
 */

const translationService = require('../js/services/translation-service.js');

describe('TranslationService', () => {
  beforeEach(() => {
    // Скинути стан
    translationService.currentLanguage = 'de';
    translationService.translations = {};
    translationService.showingOriginal = false;
  });

  test('встановлює поточну мову', () => {
    translationService.setCurrentLanguage('uk');
    expect(translationService.getCurrentLanguage()).toBe('uk');
  });

  test('повертає переклад для існуючого ключа', () => {
    translationService.translations = {
      de: {
        form: { fullName: 'Vollständiger Name' }
      }
    };
    translationService.currentLanguage = 'de';

    const result = translationService.getTranslation('form.fullName');
    expect(result).toBe('Vollständiger Name');
  });

  test('повертає null для неіснуючого ключа', () => {
    translationService.translations = { de: {} };
    translationService.currentLanguage = 'de';

    const result = translationService.getTranslation('form.nonexistent');
    expect(result).toBeNull();
  });

  test('перевіряє наявність перекладів', () => {
    translationService.translations = {
      de: { form: { name: 'Name' } },
      en: {}
    };

    expect(translationService.hasTranslations('de')).toBe(true);
    expect(translationService.hasTranslations('en')).toBe(false);
    expect(translationService.hasTranslations('fr')).toBe(false);
  });

  test('переключає показ оригіналу', () => {
    expect(translationService.showingOriginal).toBe(false);
    translationService.toggleShowOriginal();
    expect(translationService.showingOriginal).toBe(true);
    translationService.toggleShowOriginal(false);
    expect(translationService.showingOriginal).toBe(false);
  });

  test('повертає список доступних мов', () => {
    translationService.translations = {
      de: {},
      en: {},
      uk: {}
    };
    expect(translationService.getAvailableLanguages()).toEqual(['de', 'en', 'uk']);
  });

  test('очищає кеш перекладів', () => {
    translationService.translations = { de: { test: 'test' } };
    translationService.originalContent = { field: 'content' };

    translationService.clearTranslations();

    expect(translationService.translations).toEqual({});
    expect(translationService.originalContent).toEqual({});
  });
});