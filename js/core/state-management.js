/**
 * Управління станом застосунку та localStorage
 * Централізоване сховище для даних форм та фото
 */

class StateManager {
  constructor() {
    this.state = {
      formData: {},
      globalPhotoData: null,
      currentPreviewType: 'lebenslauf'
    };
    this.listeners = new Map();
  }

  /**
   * Зберігає дані в state та localStorage
   * @param {Object} data - Об'єкт з даними для збереження
   */
  saveState(data) {
    try {
      this.state = { ...this.state, ...data };
      localStorage.setItem('resumeFormData', JSON.stringify(this.state));
      this.notifyListeners('state:updated', this.state);
      console.log('✅ Стан збережено');
      return true;
    } catch (error) {
      console.error('❌ Помилка збереження стану:', error);
      return false;
    }
  }

  /**
   * Завантажує дані з localStorage
   * @returns {boolean} - Успішність завантаження
   */
  loadState() {
    try {
      const savedData = localStorage.getItem('resumeFormData');
      if (savedData) {
        this.state = JSON.parse(savedData);
        this.notifyListeners('state:loaded', this.state);
        console.log('✅ Стан завантажено');
        return true;
      }
    } catch (error) {
      console.error('❌ Помилка завантаження стану:', error);
    }
    return false;
  }

  /**
   * Отримує поточний стан
   * @returns {Object} - Поточний стан
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Оновлює частину стану
   * @param {string} key - Ключ для оновлення
   * @param {*} value - Нове значення
   */
  updateState(key, value) {
    this.state[key] = value;
    this.saveState(this.state);
  }

  /**
   * Очищує стан та localStorage
   */
  clearState() {
    this.state = {
      formData: {},
      globalPhotoData: null,
      currentPreviewType: 'lebenslauf'
    };
    localStorage.removeItem('resumeFormData');
    this.notifyListeners('state:cleared');
    console.log('🗑️ Стан очищено');
  }

  /**
   * Підписка на зміни стану
   * @param {string} event - Назва події
   * @param {Function} callback - Callback функція
   */
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

  /**
   * Сповіщення слухачів про зміни
   * @param {string} event - Назва події
   * @param {*} data - Дані події
   */
  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
}

// Експорт singleton instance
const stateManager = new StateManager();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = stateManager;
} else if (typeof window !== 'undefined') {
  window.stateManager = stateManager;
}