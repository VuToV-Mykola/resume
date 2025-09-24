/**
 * Unit тести для State Management
 * Використовується для тестування функціоналу управління станом
 */

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.localStorage = localStorageMock;
global.console.log = jest.fn();
global.console.error = jest.fn();

const stateManager = require('../js/core/state-management.js');

describe('StateManager', () => {

  beforeEach(() => {
    localStorage.clear();
    stateManager.state = {
      formData: {},
      globalPhotoData: null,
      currentPreviewType: 'lebenslauf'
    };
    stateManager.listeners = new Map();
  });

  describe('saveState', () => {
    test('зберігає стан в localStorage', () => {
      const testData = {
        formData: { name: 'John Doe', email: 'john@example.com' }
      };

      const result = stateManager.saveState(testData);

      expect(result).toBe(true);
      expect(localStorage.getItem('resumeFormData')).toBeTruthy();
    });

    test('об\'єднує новий стан з існуючим', () => {
      stateManager.saveState({ formData: { name: 'John' } });
      stateManager.saveState({ globalPhotoData: 'base64data' });

      const state = stateManager.getState();

      expect(state.formData.name).toBe('John');
      expect(state.globalPhotoData).toBe('base64data');
    });
  });

  describe('loadState', () => {
    test('завантажує стан з localStorage', () => {
      const testData = {
        formData: { name: 'Jane' },
        globalPhotoData: null,
        currentPreviewType: 'bewerbung'
      };

      localStorage.setItem('resumeFormData', JSON.stringify(testData));

      const result = stateManager.loadState();

      expect(result).toBe(true);
      expect(stateManager.getState().formData.name).toBe('Jane');
    });

    test('повертає false якщо дані відсутні', () => {
      const result = stateManager.loadState();

      expect(result).toBe(false);
    });
  });

  describe('updateState', () => {
    test('оновлює конкретний ключ', () => {
      stateManager.updateState('currentPreviewType', 'bewerbung');

      expect(stateManager.getState().currentPreviewType).toBe('bewerbung');
    });
  });

  describe('clearState', () => {
    test('очищає стан та localStorage', () => {
      stateManager.saveState({ formData: { test: 'data' } });
      stateManager.clearState();

      expect(localStorage.getItem('resumeFormData')).toBeNull();
      expect(stateManager.getState().formData).toEqual({});
    });
  });

  describe('subscribe', () => {
    test('викликає callback при оновленні стану', () => {
      const callback = jest.fn();
      stateManager.subscribe('state:updated', callback);

      stateManager.saveState({ formData: { test: 'value' } });

      expect(callback).toHaveBeenCalled();
    });

    test('повертає функцію unsubscribe', () => {
      const callback = jest.fn();
      const unsubscribe = stateManager.subscribe('state:updated', callback);

      unsubscribe();
      stateManager.saveState({ formData: { test: 'value' } });

      expect(callback).not.toHaveBeenCalled();
    });
  });
});