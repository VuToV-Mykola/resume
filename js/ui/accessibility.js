/**
 * Accessibility utilities
 * Покращення доступності застосунку
 */

class AccessibilityManager {
  constructor() {
    this.init();
  }

  /**
   * Ініціалізація accessibility функцій
   */
  init() {
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupAriaLiveRegions();
    this.announcePageLoad();
  }

  /**
   * Налаштування клавіатурної навігації
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // ESC для закриття модальних вікон
      if (e.key === 'Escape') {
        this.closeAllModals();
      }

      // Tab trap для модальних вікон
      if (e.key === 'Tab') {
        const activeModal = document.querySelector('.modal[aria-modal="true"]');
        if (activeModal) {
          this.trapFocus(e, activeModal);
        }
      }
    });

    // Ctrl/Cmd + S для збереження
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.announce('Збереження даних форми...');
        if (typeof saveFormData === 'function') {
          saveFormData();
        }
      }
    });
  }

  /**
   * Focus trap для модальних вікон
   * @param {KeyboardEvent} e - Keyboard event
   * @param {HTMLElement} modal - Модальне вікно
   */
  trapFocus(e, modal) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }

  /**
   * Управління фокусом
   */
  setupFocusManagement() {
    // Зберігати останній активний елемент при відкритті модалки
    this.lastFocusedElement = null;

    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-opens-modal]')) {
        this.lastFocusedElement = e.target;
      }
    });
  }

  /**
   * Налаштування ARIA live regions
   */
  setupAriaLiveRegions() {
    if (!document.getElementById('aria-live-region')) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'aria-live-region';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
  }

  /**
   * Оголошення повідомлення для screen readers
   * @param {string} message - Повідомлення
   * @param {string} priority - Пріоритет ('polite' або 'assertive')
   */
  announce(message, priority = 'polite') {
    const liveRegion = document.getElementById('aria-live-region');
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;

      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  /**
   * Оголошення завантаження сторінки
   */
  announcePageLoad() {
    const pageTitle = document.querySelector('h1')?.textContent || 'Сторінка завантажена';
    this.announce(`${pageTitle}. Сторінка завантажена`);
  }

  /**
   * Закриття всіх модальних вікон
   */
  closeAllModals() {
    const modals = document.querySelectorAll('.modal[aria-modal="true"]');
    modals.forEach(modal => {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    });

    // Повернути фокус на останній активний елемент
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
      this.lastFocusedElement = null;
    }
  }

  /**
   * Відкриття модального вікна з accessibility
   * @param {HTMLElement} modal - Модальне вікно
   */
  openModal(modal) {
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-modal', 'true');

    // Фокус на першому елементі
    const firstFocusable = modal.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (firstFocusable) {
      firstFocusable.focus();
    }

    this.announce('Модальне вікно відкрито', 'assertive');
  }

  /**
   * Додає skip links
   */
  addSkipLinks() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Перейти до основного вмісту';
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  /**
   * Перевірка контрасту кольорів
   * @param {string} foreground - Колір тексту
   * @param {string} background - Колір фону
   * @returns {number} - Коефіцієнт контрасту
   */
  checkContrast(foreground, background) {
    const getLuminance = (hex) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;

      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return Math.round(ratio * 100) / 100;
  }
}

// Ініціалізація при завантаженні DOM
if (typeof window !== 'undefined') {
  window.accessibilityManager = new AccessibilityManager();
}

// Експорт для модулів
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityManager;
}