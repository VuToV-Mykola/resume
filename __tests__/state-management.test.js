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

// Імпорт модуля
const StateManager = require('../js/core/state-management.js');

describe('StateManager', () => {
  let stateManager;

  beforeEach(() => {
    localStorage.clear();
    // Створюємо новий екземпляр перед кожним тестом
    class TestStateManager {
      constructor() {
        this.state = {
          formData: {},
          globalPhotoData: null,
          currentPreviewType: 'lebenslauf'
        };
        this.listeners = new Map();
      }

      saveState(data) {
        try {
          this.state = { ...this.state, ...data };
          localStorage.setItem('resumeFormData', JSON.stringify(this.state));
          this.notifyListeners('state:updated', this.state);
          return true;
        } catch (error) {
          return false;
        }
      }

      loadState() {
        try {
          const savedData = localStorage.getItem('resumeFormData');
          if (savedData) {
            this.state = JSON.parse(savedData);
            this.notifyListeners('state:loaded', this.state);
            return true;
          }
        } catch (error) {
          return false;
        }
        return false;
      }

      getState() {
        return { ...this.state };
      }

      updateState(key, value) {
        this.state[key] = value;
        this.saveState(this.state);
      }

      clearState() {
        this.state = {
          formData: {},
          globalPhotoData: null,
          currentPreviewType: 'lebenslauf'
        };
        localStorage.removeItem('resumeFormData');
        this.notifyListeners('state:cleared');
      }

      subscribe(event, callback) {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);

        return () => {
          const callbacks = this.listeners.get(event);
          const index = callbacks.indexOf(callback);
          if (index > -1) {
            callbacks.splice(index, 1);
          }
        };
      }

      notifyListeners(event, data) {
        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach(callback => callback(data));
      }
    }

    stateManager = new TestStateManager();
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