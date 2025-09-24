/**
 * Сервіс завантаження фото
 * Обробка завантаження, валідації та відображення фотографій
 * Підтримує drag & drop, валідацію файлів та попередній перегляд
 */

class PhotoUploadService {
  constructor() {
    this.logger = null;
    this.translationService = null;
    this.domCache = null;
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  }

  /**
   * Встановлення залежностей
   */
  setLogger(logger) {
    this.logger = logger;
  }

  setTranslationService(translationService) {
    this.translationService = translationService;
  }

  setDOMCache(domCache) {
    this.domCache = domCache;
  }

  /**
   * Логування з перевіркою
   */
  log(...args) {
    if (this.logger) {
      this.logger.log(...args);
    }
  }

  error(...args) {
    if (this.logger) {
      this.logger.error(...args);
    }
  }

  /**
   * Отримання перекладу
   */
  getTranslation(key) {
    if (this.translationService) {
      return this.translationService.getTranslation(key);
    }
    return null;
  }

  /**
   * Валідація файлу
   * @param {File} file - файл для валідації
   * @returns {Object} результат валідації {valid: boolean, error?: string}
   */
  validateFile(file) {
    if (!file) {
      return {
        valid: false,
        error: this.getTranslation('errors.noFile') || 'Файл не вибрано'
      };
    }

    // Перевірка типу файлу
    if (!file.type.startsWith('image/')) {
      return {
        valid: false,
        error: this.getTranslation('errors.invalidFileType') ||
               'Будь ласка, виберіть файл зображення'
      };
    }

    // Перевірка розміру файлу
    if (file.size > this.maxFileSize) {
      const sizeMB = Math.round(this.maxFileSize / 1024 / 1024);
      return {
        valid: false,
        error: this.getTranslation('errors.fileTooLarge') ||
               `Файл занадто великий. Максимальний розмір: ${sizeMB}MB`
      };
    }

    // Перевірка на порожній файл
    if (file.size === 0) {
      return {
        valid: false,
        error: this.getTranslation('errors.emptyFile') || 'Файл порожній'
      };
    }

    return { valid: true };
  }

  /**
   * Показ індикатора завантаження
   * @param {HTMLElement} container - контейнер для індикатора
   */
  showLoadingIndicator(container) {
    if (container) {
      container.innerHTML = `
        <div class="photo-loading" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px;">
          <div class="loading-spinner" style="width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 10px;"></div>
          <span style="color: #6c757d; font-size: 14px;">Завантаження фото...</span>
        </div>
      `;
    }
  }

  /**
   * Показ індикатора успішного завантаження
   * @param {HTMLElement} container - контейнер для індикатора
   */
  showSuccessIndicator(container) {
    if (container) {
      container.innerHTML = `
        <div class="photo-success" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; background: #d4edda; border: 2px solid #c3e6cb; border-radius: 8px;">
          <div style="color: #155724; font-size: 24px; margin-bottom: 10px;">✅</div>
          <span style="color: #155724; font-size: 14px;">Фото завантажено успішно!</span>
        </div>
      `;
    }
  }

  /**
   * Показ помилки
   * @param {HTMLElement} container - контейнер для помилки
   * @param {string} errorMessage - текст помилки
   */
  showError(container, errorMessage) {
    if (container) {
      container.innerHTML = `
        <div class="photo-error" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; background: #f8d7da; border: 2px solid #f5c6cb; border-radius: 8px;">
          <div style="color: #721c24; font-size: 24px; margin-bottom: 10px;">❌</div>
          <span style="color: #721c24; font-size: 14px;">${errorMessage}</span>
        </div>
      `;
    }
  }

  /**
   * Відображення фото в попередньому перегляді
   * @param {HTMLElement} container - контейнер для фото
   * @param {string} photoData - дані фото (data URL)
   * @param {HTMLElement} removeBtn - кнопка видалення фото
   */
  displayPhoto(container, photoData, removeBtn) {
    if (container) {
      container.innerHTML = `
        <img src="${photoData}" alt="Uploaded photo"
             style="max-width: 100%; max-height: 200px; border-radius: 8px;" />
      `;

      // Показати кнопку видалення
      if (removeBtn) {
        removeBtn.style.display = 'block';
      }

      // Перевірка завантаження зображення
      const img = container.querySelector('img');
      if (img) {
        this.log('Image element created:', {
          src: img.src ? img.src.substring(0, 50) + '...' : 'no src',
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        });
      }
    }
  }

  /**
   * Обробка завантаження файлу
   * @param {File} file - файл для завантаження
   * @param {HTMLElement} previewContainer - контейнер для попереднього перегляду
   * @param {HTMLElement} removeBtn - кнопка видалення
   * @param {Function} onSuccess - callback успішного завантаження
   * @param {Function} onError - callback помилки
   */
  async handleFileUpload(file, previewContainer, removeBtn, onSuccess, onError) {
    this.log('=== PHOTO UPLOAD STARTED ===');
    this.log('File:', file ? file.name : 'no file', file ? file.type : '', file ? file.size : 0);

    // Показати індикатор завантаження
    this.showLoadingIndicator(previewContainer);

    // Валідація файлу
    const validation = this.validateFile(file);
    if (!validation.valid) {
      this.error('File validation failed:', validation.error);
      this.showError(previewContainer, validation.error);
      if (onError) onError(validation.error);
      return null;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          this.log('=== PHOTO LOADED SUCCESSFULLY ===');

          const result = e.target.result;

          // Валідація результату
          if (!result || typeof result !== 'string' || !result.startsWith('data:image/')) {
            throw new Error('Invalid image data received');
          }

          this.log('Photo data URL length:', result.length);
          this.log('Photo data URL starts with:', result.substring(0, 50));

          // Показати індикатор успіху
          this.showSuccessIndicator(previewContainer);

          // Через секунду показати фактичне зображення
          setTimeout(() => {
            this.displayPhoto(previewContainer, result, removeBtn);

            if (onSuccess) {
              onSuccess(result);
            }

            resolve(result);
          }, 1000);

        } catch (error) {
          this.error('Error displaying photo:', error);
          const errorMsg = this.getTranslation('errors.photoDisplayError') ||
                          'Помилка при відображенні фото';
          this.showError(previewContainer, errorMsg);
          if (onError) onError(errorMsg);
          reject(error);
        }
      };

      reader.onerror = (error) => {
        this.error('Error reading file:', error);
        const errorMsg = this.getTranslation('errors.fileReadError') ||
                        'Помилка при читанні файлу';
        this.showError(previewContainer, errorMsg);
        if (onError) onError(errorMsg);
        reject(error);
      };

      reader.onabort = (error) => {
        this.error('File read aborted:', error);
        const errorMsg = this.getTranslation('errors.fileReadAborted') ||
                        'Читання файлу перервано';
        this.showError(previewContainer, errorMsg);
        if (onError) onError(errorMsg);
        reject(error);
      };

      // Почати читання файлу
      try {
        this.log('Starting to read file as data URL...');
        reader.readAsDataURL(file);
      } catch (error) {
        this.error('Error starting file read:', error);

        // Fallback: спробувати URL.createObjectURL
        try {
          this.log('Trying fallback method with URL.createObjectURL...');
          const objectURL = URL.createObjectURL(file);
          this.log('Object URL created:', objectURL);

          this.displayPhoto(previewContainer, objectURL, removeBtn);

          if (onSuccess) {
            onSuccess(objectURL);
          }

          resolve(objectURL);
        } catch (fallbackError) {
          this.error('Fallback method also failed:', fallbackError);
          const errorMsg = this.getTranslation('errors.photoProcessError') ||
                          'Неможливо обробити фото';
          this.showError(previewContainer, errorMsg);
          if (onError) onError(errorMsg);
          reject(fallbackError);
        }
      }
    });
  }

  /**
   * Видалення фото
   * @param {HTMLElement} previewContainer - контейнер попереднього перегляду
   * @param {HTMLElement} removeBtn - кнопка видалення
   * @param {HTMLElement} fileInput - input для файлів
   * @param {Function} onRemove - callback видалення
   */
  removePhoto(previewContainer, removeBtn, fileInput, onRemove) {
    this.log('=== PHOTO REMOVAL ===');

    // Очистити попередній перегляд
    if (previewContainer) {
      previewContainer.innerHTML = `
        <div class="photo-placeholder" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; color: #6c757d;">
          <div style="font-size: 48px; margin-bottom: 10px;">📷</div>
          <span style="font-size: 14px;">Фото видалено</span>
        </div>
      `;
    }

    // Приховати кнопку видалення
    if (removeBtn) {
      removeBtn.style.display = 'none';
    }

    // Очистити значення input файлу
    if (fileInput) {
      fileInput.value = '';
    }

    // Викликати callback
    if (onRemove) {
      onRemove();
    }

    this.log('Photo removed successfully');
  }

  /**
   * Ініціалізація drag & drop для контейнера
   * @param {HTMLElement} container - контейнер для drag & drop
   * @param {Function} onFileDrop - callback отримання файлу
   */
  initializeDragDrop(container, onFileDrop) {
    if (!container) return;

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      container.classList.add('drag-over');
    });

    container.addEventListener('dragleave', (e) => {
      e.preventDefault();
      container.classList.remove('drag-over');
    });

    container.addEventListener('drop', (e) => {
      e.preventDefault();
      container.classList.remove('drag-over');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        this.log('File dropped:', file.name);
        if (onFileDrop) {
          onFileDrop(file);
        }
      }
    });

    this.log('Drag & drop initialized for container');
  }

  /**
   * Стиснення зображення (опціональне)
   * @param {File} file - файл зображення
   * @param {number} maxWidth - максимальна ширина
   * @param {number} maxHeight - максимальна висота
   * @param {number} quality - якість (0-1)
   * @returns {Promise<string>} стиснуте зображення як data URL
   */
  async compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Розрахувати нові розміри зберігаючи пропорції
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Відрисувати стиснуте зображення
        ctx.drawImage(img, 0, 0, width, height);

        // Отримати data URL
        const compressedDataUrl = canvas.toDataURL(file.type, quality);
        resolve(compressedDataUrl);
      };

      img.onerror = reject;

      // Завантажити зображення
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Встановлення максимального розміру файлу
   * @param {number} size - розмір в байтах
   */
  setMaxFileSize(size) {
    this.maxFileSize = size;
  }

  /**
   * Встановлення дозволених типів файлів
   * @param {string[]} types - масив MIME типів
   */
  setAllowedTypes(types) {
    this.allowedTypes = types;
  }
}

// Експорт singleton instance
const photoUploadService = new PhotoUploadService();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = photoUploadService;
} else if (typeof window !== 'undefined') {
  window.photoUploadService = photoUploadService;
}