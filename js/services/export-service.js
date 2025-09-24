/**
 * Export Service
 * Експорт документів в PDF та DOCX формати
 */

class ExportService {
  constructor() {
    this.serverUrl = 'http://localhost:8000';
    this.isServerAvailable = false;
    this.checkServerStatus();
  }

  /**
   * Перевірка доступності сервера
   */
  async checkServerStatus() {
    try {
      // Тихо перевіряємо сервер без логування помилок
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);

      const response = await fetch(`${this.serverUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.isServerAvailable = response.ok;
      return this.isServerAvailable;
    } catch (error) {
      // Тихо встановлюємо false - це нормально для frontend-only режиму
      this.isServerAvailable = false;
      return false;
    }
  }

  /**
   * Експорт в PDF
   * @param {string} htmlContent - HTML контент для експорту
   * @param {Object} options - Опції експорту
   * @returns {Promise<Blob>} - PDF файл
   */
  async exportToPDF(htmlContent, options = {}) {
    const {
      filename = 'document.pdf',
      orientation = 'portrait',
      format = 'A4'
    } = options;

    try {
      // Спроба 1: Використання сервера
      if (this.isServerAvailable) {
        return await this.exportToPDFServer(htmlContent, options);
      }

      // Спроба 2: Використання браузерного друку
      return await this.exportToPDFBrowser(htmlContent, options);

    } catch (error) {
      console.error('❌ Помилка експорту PDF:', error);
      throw error;
    }
  }

  /**
   * Експорт PDF через сервер
   */
  async exportToPDFServer(htmlContent, options) {
    const response = await fetch(`${this.serverUrl}/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html: htmlContent,
        options
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    return await response.blob();
  }

  /**
   * Експорт PDF через браузерний друк
   */
  async exportToPDFBrowser(htmlContent, options) {
    // Створюємо iframe для друку
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Print Document</title>
          <link rel="stylesheet" href="/css/styles.css">
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            @media print {
              body { margin: 0; padding: 0; }
              * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body class="print-preview-mode">
          ${htmlContent}
        </body>
      </html>
    `);
    iframeDoc.close();

    // Чекаємо завантаження
    await new Promise(resolve => {
      iframe.onload = resolve;
      setTimeout(resolve, 1000);
    });

    // Друк
    iframe.contentWindow.print();

    // Очищення
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);

    return null; // Браузерний друк не повертає blob
  }

  /**
   * Експорт в DOCX
   * @param {string} htmlContent - HTML контент
   * @param {Object} options - Опції
   * @returns {Promise<Blob>} - DOCX файл
   */
  async exportToDOCX(htmlContent, options = {}) {
    const { filename = 'document.docx' } = options;

    try {
      // Перевірка наявності бібліотеки
      if (typeof htmlDocx === 'undefined') {
        throw new Error('html-docx library not loaded');
      }

      // Конвертація HTML в DOCX
      const converted = htmlDocx.asBlob(htmlContent, {
        orientation: 'portrait',
        margins: {
          top: 720,    // 0.5 inch
          right: 720,
          bottom: 720,
          left: 720
        }
      });

      return converted;

    } catch (error) {
      console.error('❌ Помилка експорту DOCX:', error);

      // Fallback: використання сервера
      if (this.isServerAvailable) {
        return await this.exportToDOCXServer(htmlContent, options);
      }

      throw error;
    }
  }

  /**
   * Експорт DOCX через сервер
   */
  async exportToDOCXServer(htmlContent, options) {
    const response = await fetch(`${this.serverUrl}/generate-docx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html: htmlContent,
        options
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    return await response.blob();
  }

  /**
   * Завантаження файлу
   * @param {Blob} blob - Файл
   * @param {string} filename - Назва файлу
   */
  downloadFile(blob, filename) {
    if (!blob) {
      console.warn('⚠️ No blob to download');
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Очищення
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Експорт обох форматів
   * @param {string} htmlContent - HTML контент
   * @param {string} baseName - Базове ім'я файлу
   */
  async exportBoth(htmlContent, baseName = 'document') {
    try {
      const results = {
        pdf: { success: false, error: null },
        docx: { success: false, error: null }
      };

      // PDF
      try {
        const pdfBlob = await this.exportToPDF(htmlContent, {
          filename: `${baseName}.pdf`
        });
        if (pdfBlob) {
          this.downloadFile(pdfBlob, `${baseName}.pdf`);
          results.pdf.success = true;
        }
      } catch (error) {
        results.pdf.error = error.message;
        console.error('PDF export failed:', error);
      }

      // DOCX
      try {
        const docxBlob = await this.exportToDOCX(htmlContent, {
          filename: `${baseName}.docx`
        });
        if (docxBlob) {
          this.downloadFile(docxBlob, `${baseName}.docx`);
          results.docx.success = true;
        }
      } catch (error) {
        results.docx.error = error.message;
        console.error('DOCX export failed:', error);
      }

      return results;

    } catch (error) {
      console.error('❌ Помилка експорту:', error);
      throw error;
    }
  }

  /**
   * Підготовка HTML для експорту
   * @param {string} htmlContent - Сирий HTML
   * @returns {string} - Підготовлений HTML
   */
  prepareHTML(htmlContent) {
    // Видалення скриптів
    let cleaned = htmlContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Інлайн стилі
    cleaned = this.inlineStyles(cleaned);

    // Виправлення зображень
    cleaned = this.fixImages(cleaned);

    return cleaned;
  }

  /**
   * Перетворення CSS в inline стилі
   * @param {string} html - HTML
   * @returns {string} - HTML з inline стилями
   */
  inlineStyles(html) {
    // Створюємо тимчасовий контейнер
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Копіюємо computed styles
    const elements = temp.querySelectorAll('*');
    elements.forEach(el => {
      const computed = window.getComputedStyle(el);
      const important = [
        'color',
        'font-family',
        'font-size',
        'font-weight',
        'line-height',
        'margin',
        'padding',
        'background-color',
        'border'
      ];

      important.forEach(prop => {
        const value = computed.getPropertyValue(prop);
        if (value) {
          el.style[prop] = value;
        }
      });
    });

    return temp.innerHTML;
  }

  /**
   * Виправлення зображень для експорту
   * @param {string} html - HTML
   * @returns {string} - HTML з base64 зображеннями
   */
  fixImages(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;

    const images = temp.querySelectorAll('img');
    images.forEach(img => {
      // Конвертація в base64 якщо потрібно
      if (img.src && !img.src.startsWith('data:')) {
        // Зображення буде завантажене як є
        img.setAttribute('crossorigin', 'anonymous');
      }
    });

    return temp.innerHTML;
  }
}

// Експорт
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportService;
} else if (typeof window !== 'undefined') {
  window.exportService = new ExportService();
}