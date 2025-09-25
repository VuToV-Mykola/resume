/**
 * PreviewManager - Управління превью документів
 * Оптимізоване управління превью з кешуванням та захистом від зациклення
 */

export class PreviewManager {
  constructor(cache) {
    this.cache = cache;
    this.logger = window.logger;
    this.errorProtection = window.errorProtection;
    
    // Компоненти
    this.livePrintPreview = null;
    this.previewService = null;
    
    // Стан
    this.isInitialized = false;
    this.isUpdating = false;
    this.currentPreviewType = 'lebenslauf';
    this.lastUpdateTime = 0;
    this.updateCount = 0;
    this.maxUpdates = 5;
    this.updateCooldown = 200;
    
    // Конфігурація
    this.config = {
      debounceDelay: 100,
      maxRetries: 3,
      retryDelay: 1000,
      cacheEnabled: true
    };
  }

  /**
   * Ініціалізація PreviewManager
   */
  async initialize() {
    if (this.isInitialized) {
      this.logger.warn('PreviewManager already initialized');
      return;
    }

    this.logger.info('Initializing PreviewManager...');
    
    try {
      // Завантажуємо PreviewService
      const { PreviewService } = await import('../services/preview-service.js');
      this.previewService = new PreviewService();
      
      // Завантажуємо LivePrintPreview
      const { LivePrintPreview } = await import('../live-print-preview.js');
      this.livePrintPreview = new LivePrintPreview();
      
      // Ініціалізуємо компоненти
      await this.previewService.initialize();
      await this.livePrintPreview.init();
      
      this.isInitialized = true;
      this.logger.info('PreviewManager initialized successfully');
      
    } catch (error) {
      this.errorProtection.handleError(error, 'PreviewManager Initialization');
      throw error;
    }
  }

  /**
   * Оновлення превью з захистом від зациклення
   */
  async updatePreview(type = null) {
    if (!this.isInitialized) {
      this.logger.warn('PreviewManager not initialized');
      return;
    }

    const previewType = type || this.currentPreviewType;
    const now = Date.now();
    
    // Захист від зациклення
    if (this.isUpdating) {
      this.logger.debug('Preview update already in progress, skipping');
      return;
    }
    
    if (now - this.lastUpdateTime < this.updateCooldown) {
      this.logger.debug('Preview update cooldown active, skipping');
      return;
    }
    
    if (this.updateCount >= this.maxUpdates) {
      this.logger.warn('Maximum preview updates reached, resetting');
      this.updateCount = 0;
      return;
    }

    this.isUpdating = true;
    this.updateCount++;
    this.lastUpdateTime = now;
    
    this.logger.debug(`Updating preview: ${previewType} (${this.updateCount}/${this.maxUpdates})`);
    
    try {
      // Отримуємо дані форми
      const formData = await this.getFormData();
      
      // Генеруємо HTML контент
      const htmlContent = await this.generatePreviewContent(previewType, formData);
      
      // Кешуємо контент
      if (this.config.cacheEnabled) {
        this.cache.setPreview(`preview_${previewType}`, htmlContent);
      }
      
      // Оновлюємо превью
      await this.renderPreview(htmlContent);
      
      this.currentPreviewType = previewType;
      
      this.logger.debug('Preview updated successfully');
      
    } catch (error) {
      this.errorProtection.handleError(error, 'Preview Update');
    } finally {
      this.isUpdating = false;
      
      // Скидаємо лічильник через 2 секунди
      setTimeout(() => {
        this.updateCount = 0;
      }, 2000);
    }
  }

  /**
   * Отримання даних форми
   */
  async getFormData() {
    try {
      // Спробуємо отримати з FormManager
      if (window.resumeApp && window.resumeApp.formManager) {
        return window.resumeApp.formManager.getFormData();
      }
      
      // Fallback - отримуємо з DOM
      const formData = {};
      const fields = document.querySelectorAll('input, textarea, select');
      
      fields.forEach(field => {
        const name = field.name || field.id;
        if (name) {
          formData[name] = field.value;
        }
      });
      
      return formData;
      
    } catch (error) {
      this.errorProtection.handleError(error, 'Form Data Retrieval');
      return {};
    }
  }

  /**
   * Генерація контенту превью
   */
  async generatePreviewContent(type, formData) {
    try {
      // Перевіряємо кеш
      if (this.config.cacheEnabled) {
        const cached = this.cache.getPreview(`preview_${type}`);
        if (cached) {
          this.logger.debug('Using cached preview content');
          return cached;
        }
      }
      
      // Генеруємо новий контент
      let htmlContent;
      
      if (type === 'lebenslauf') {
        htmlContent = await this.previewService.generateLebenslaufHTML(formData);
      } else if (type === 'bewerbung') {
        htmlContent = await this.previewService.generateBewerbungHTML(formData);
      } else {
        throw new Error(`Unknown preview type: ${type}`);
      }
      
      return htmlContent;
      
    } catch (error) {
      this.errorProtection.handleError(error, 'Preview Content Generation');
      return '<div class="error">Помилка генерації превью</div>';
    }
  }

  /**
   * Рендеринг превью
   */
  async renderPreview(htmlContent) {
    try {
      if (!this.livePrintPreview) {
        throw new Error('LivePrintPreview not initialized');
      }
      
      // Активуємо превью з новим контентом
      await this.livePrintPreview.activate(htmlContent);
      
    } catch (error) {
      this.errorProtection.handleError(error, 'Preview Rendering');
    }
  }

  /**
   * Показ превью
   */
  async showPreview(type) {
    try {
      await this.updatePreview(type);
      
      // Показуємо контейнер превью
      const previewContainer = document.getElementById('previewContent');
      if (previewContainer) {
        previewContainer.style.display = 'block';
      }
      
      this.logger.debug(`Preview shown: ${type}`);
      
    } catch (error) {
      this.errorProtection.handleError(error, 'Show Preview');
    }
  }

  /**
   * Приховування превью
   */
  hidePreview() {
    try {
      if (this.livePrintPreview) {
        this.livePrintPreview.deactivate();
      }
      
      const previewContainer = document.getElementById('previewContent');
      if (previewContainer) {
        previewContainer.style.display = 'none';
      }
      
      this.logger.debug('Preview hidden');
      
    } catch (error) {
      this.errorProtection.handleError(error, 'Hide Preview');
    }
  }

  /**
   * Відновлення превью
   */
  async restorePreview(previewData) {
    try {
      if (!previewData) {
        return;
      }
      
      this.currentPreviewType = previewData.type || 'lebenslauf';
      
      if (previewData.content) {
        await this.renderPreview(previewData.content);
      }
      
      this.logger.debug('Preview restored');
      
    } catch (error) {
      this.errorProtection.handleError(error, 'Preview Restore');
    }
  }

  /**
   * Отримання даних превью
   */
  async getPreviewData() {
    try {
      return {
        type: this.currentPreviewType,
        content: this.cache.getPreview(`preview_${this.currentPreviewType}`),
        timestamp: Date.now()
      };
      
    } catch (error) {
      this.errorProtection.handleError(error, 'Preview Data Retrieval');
      return null;
    }
  }

  /**
   * Очищення кешу превью
   */
  clearPreviewCache() {
    try {
      this.cache.clear();
      this.logger.info('Preview cache cleared');
      
    } catch (error) {
      this.errorProtection.handleError(error, 'Preview Cache Clear');
    }
  }

  /**
   * Переініціалізація
   */
  async reinitialize() {
    this.logger.info('Reinitializing PreviewManager...');
    
    // Деактивуємо поточне превью
    if (this.livePrintPreview) {
      this.livePrintPreview.deactivate();
    }
    
    // Скидаємо стан
    this.isUpdating = false;
    this.updateCount = 0;
    this.lastUpdateTime = 0;
    
    // Переініціалізуємо
    this.isInitialized = false;
    await this.initialize();
  }

  /**
   * Знищення PreviewManager
   */
  destroy() {
    this.logger.info('Destroying PreviewManager...');
    
    // Деактивуємо превью
    if (this.livePrintPreview) {
      this.livePrintPreview.deactivate();
    }
    
    // Очищуємо кеш
    this.clearPreviewCache();
    
    // Скидаємо стан
    this.isInitialized = false;
    this.isUpdating = false;
    this.updateCount = 0;
  }

  /**
   * Отримання статистики
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      isUpdating: this.isUpdating,
      currentPreviewType: this.currentPreviewType,
      updateCount: this.updateCount,
      lastUpdateTime: this.lastUpdateTime,
      cacheStats: this.cache.getStats()
    };
  }
}

// Експорт вже зроблено в оголошенні класу на лінії 6
