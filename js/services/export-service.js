/**
 * Export Service
 * Експорт документів в PDF та DOCX формати
 */

export class ExportService {
  constructor() {
    this.serverUrl = 'http://localhost:8000';
    this.isServerAvailable = false;
    this.logger = window.logger || console;
    this.isInitialized = false;
    this.checkServerStatus();
  }

  /**
   * Ініціалізація сервісу
   */
  async initialize() {
    if (this.isInitialized) {
      this.logger.warn('ExportService already initialized');
      return;
    }

    this.logger.info('Initializing ExportService...');
    
    // Встановлюємо залежності з глобального контексту
    this.logger = window.logger || console;
    
    this.isInitialized = true;
    this.logger.info('ExportService initialized successfully');
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
    } catch {
      // Тихо встановлюємо false - це нормально для frontend-only режиму
      this.isServerAvailable = false;
      return false;
    }
  }

  /**
   * Очікування завантаження PDF бібліотек
   * Максимум 10 секунд очікування
   */
  async waitForLibraries(maxWaitTime = 10000) {
    console.log('⏳ Очікування завантаження PDF бібліотек...');

    const startTime = Date.now();
    const checkInterval = 100; // Перевіряємо кожні 100мс

    while (Date.now() - startTime < maxWaitTime) {
      // Перевіряємо чи доступні обидві бібліотеки
      if (typeof window.html2canvas !== 'undefined' && typeof window.jsPDF !== 'undefined') {
        console.log('✅ PDF бібліотеки готові до використання');
        return true;
      }

      // Чекаємо трохи перед наступною перевіркою
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    console.warn('⚠️ Timeout: PDF бібліотеки не завантажились за відведений час');
    return false;
  }

  /**
   * Експорт в PDF
   * @param {string} htmlContent - HTML контент для експорту
   * @param {Object} options - Опції експорту
   * @returns {Promise<Blob>} - PDF файл
   */
  async exportToPDF(htmlContent, options = {}) {
    const {
      filename = 'document.pdf'
    } = options;

    console.log('🚀 Початок експорту PDF:', filename);

    try {
      // ПРИМУСОВА БРАУЗЕРНА ГЕНЕРАЦІЯ - пріоритетний метод
      console.log('📄 Використовуємо браузерну PDF генерацію (html2canvas + jsPDF)');
      const pdfBlob = await this.exportToPDFBrowser(htmlContent, options);

      console.log('🔍 Отримали blob з exportToPDFBrowser:');
      console.log('  pdfBlob:', pdfBlob);
      console.log('  pdfBlob тип:', typeof pdfBlob);
      console.log('  pdfBlob instanceof Blob:', pdfBlob instanceof Blob);
      console.log('  pdfBlob розмір:', pdfBlob ? pdfBlob.size : 'N/A');

      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('Отримали порожній або null PDF blob');
      }

      console.log('✅ PDF експорт завершено успішно, розмір:', pdfBlob.size, 'байт');
      return pdfBlob;

    } catch (error) {
      console.error('❌ Помилка браузерної PDF генерації:', error);

      // FALLBACK: Спроба використати браузерний друк
      console.warn('⚠️ Переключення на fallback режим - браузерний друк');
      const fallbackResult = await this.exportToPDFPrintFallback(htmlContent, options);

      console.log('🔍 Отримали результат з fallback:');
      console.log('  fallbackResult:', fallbackResult);
      console.log('  fallbackResult тип:', typeof fallbackResult);

      // КРИТИЧНО: fallback повертає null - це не підходить для downloadFile
      if (!fallbackResult) {
        console.error('❌ FALLBACK ПОВЕРНУВ NULL - створюємо мінімальний PDF');
        // Створюємо мінімальний PDF blob
        return this.createMinimalPDF();
      }

      return fallbackResult;
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
   * Експорт PDF через браузер з html2canvas + jsPDF
   * КРИТИЧНО: Тепер повертає справжній PDF blob, а не null
   */
  async exportToPDFBrowser(htmlContent, _options) {
    console.log('🔍 Початок браузерної PDF генерації...');
    console.log('🧪 Контент довжина:', htmlContent.length, 'символів');

    try {
      // Очікуємо завантаження бібліотек якщо вони ще не готові
      await this.waitForLibraries();

      // Перевірка бібліотек з детальним логуванням
      console.log('📚 Перевірка доступності бібліотек:');
      console.log('  html2canvas:', typeof html2canvas !== 'undefined' ? '✅ Доступна' : '❌ Відсутня');
      console.log('  jsPDF:', typeof window.jsPDF !== 'undefined' ? '✅ Доступна' : '❌ Відсутня');

      // КРИТИЧНО: Якщо бібліотеки недоступні - припиняємо виконання з помилкою
      if (typeof html2canvas === 'undefined' || typeof window.jsPDF === 'undefined') {
        const missingLibs = [];
        if (typeof html2canvas === 'undefined') {
          missingLibs.push('html2canvas');
        }
        if (typeof window.jsPDF === 'undefined') {
          missingLibs.push('jsPDF');
        }

        const errorMsg = `❌ Бібліотеки недоступні: ${missingLibs.join(', ')}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Створюємо тимчасовий контейнер з HTML контентом
      console.log('🏗️ Створення тимчасового контейнера...');
      const tempDiv = document.createElement('div');
      tempDiv.style.cssText = `
        position: absolute;
        top: -10000px;
        left: -10000px;
        width: 794px;
        background: white;
        padding: 20px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: black;
        box-sizing: border-box;
        z-index: 9999;
      `;

      // Очищуємо HTML контент і додаємо базові стилі
      tempDiv.innerHTML = `
        <div style="width: 754px; background: white; padding: 0;">
          ${htmlContent}
        </div>
      `;

      document.body.appendChild(tempDiv);
      console.log('📦 Тимчасовий контейнер створено і додано до DOM');

      // Чекаємо рендеринг
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('📸 Генерація canvas з HTML контенту...');
      console.log('📏 Розміри контейнера:', tempDiv.offsetWidth, 'x', tempDiv.offsetHeight);

      // Генеруємо canvas з HTML з оптимізованими параметрами
      const canvas = await html2canvas(tempDiv, {
        width: 794,
        height: Math.max(1123, tempDiv.scrollHeight + 40), // Адаптивна висота
        scale: 2, // Збільшуємо якість
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true, // Включаємо логування для діагностики
        allowTaint: false,
        foreignObjectRendering: true, // Включаємо для кращого рендерингу
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: 1123
      });

      console.log('✅ Canvas успішно створено:', canvas.width, 'x', canvas.height, 'пікселів');

      // Очищуємо тимчасовий елемент
      document.body.removeChild(tempDiv);
      console.log('🗑️ Тимчасовий контейнер видалено');

      console.log('📄 Створення PDF документу...');

      // Створюємо PDF з перевіркою
      const { jsPDF } = window;
      if (!jsPDF) {
        throw new Error('jsPDF constructor недоступний');
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      console.log('📋 PDF документ ініціалізовано');

      // Конвертуємо canvas в зображення
      const imgData = canvas.toDataURL('image/png', 1.0); // Максимальна якість
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      console.log('🖼️ Зображення підготовано:');
      console.log('  Розміри PDF:', imgWidth, 'x', imgHeight.toFixed(2), 'mm');
      console.log('  Довжина imgData:', imgData.length, 'символів');
      console.log('  Формат:', imgData.substring(0, 50) + '...');

      // Перевірка що imgData не пуста
      if (!imgData || imgData.length < 100) {
        throw new Error('Canvas створив порожнє зображення');
      }

      // Додаємо зображення до PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 297));
      console.log('📄 Зображення додано до PDF (сторінка 1)');

      // Обробка довгого контенту - додаткові сторінки
      if (imgHeight > 297) {
        console.log('📄 Контент довгий, додаємо додаткові сторінки...');
        let yOffset = -297;
        let pageCount = 1;

        while (yOffset + imgHeight > 0) {
          pdf.addPage();
          pageCount++;
          pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight);
          yOffset -= 297;
          console.log(`📄 Додано сторінку ${pageCount}`);
        }

        console.log('📚 Загальна кількість сторінок:', pdf.internal.getNumberOfPages());
      }

      // Створюємо PDF blob з детальною перевіркою
      console.log('💾 Генерація PDF blob...');
      const pdfBlob = pdf.output('blob');

      console.log('✅ PDF УСПІШНО СТВОРЕНО!');
      console.log('📊 Розмір PDF blob:', pdfBlob.size, 'байт');
      console.log('📋 Тип blob:', pdfBlob.type);

      // Критична перевірка розміру
      if (pdfBlob.size < 1000) {
        console.warn('⚠️ УВАГА: PDF занадто малий, можливо порожній');
      }

      return pdfBlob;

    } catch (error) {
      console.error('❌ КРИТИЧНА ПОМИЛКА PDF генерації:', error);
      console.error('🔍 Детальна інформація:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      // НЕ повертаємо null, а кидаємо помилку для належної обробки
      throw error;
    }
  }

  /**
   * Створює мінімальний валідний PDF як останній fallback
   * @returns {Blob} - Мінімальний PDF blob
   */
  createMinimalPDF() {
    console.log('🆘 Створення мінімального PDF як останній fallback...');

    try {
      // Перевіряємо чи доступний jsPDF
      if (typeof window.jsPDF !== 'undefined') {
        const { jsPDF } = window;
        const pdf = new jsPDF('p', 'mm', 'a4');

        // Додаємо мінімальний текст
        pdf.setFontSize(16);
        pdf.text('PDF Generation Failed', 20, 30);
        pdf.setFontSize(12);
        pdf.text('This is a fallback PDF created because', 20, 50);
        pdf.text('the main PDF generation encountered an error.', 20, 65);
        pdf.text('Please try again or contact support.', 20, 80);

        const pdfBlob = pdf.output('blob');
        console.log('🆘 Мінімальний PDF створено, розмір:', pdfBlob.size, 'байт');
        return pdfBlob;
      }

      // Якщо jsPDF недоступний, створюємо текстовий blob
      console.warn('⚠️ jsPDF недоступний, створюємо текстовий файл');
      const textContent = 'PDF Generation Failed\n\nThis file was created as a fallback when PDF generation encountered an error.\nPlease try again or contact support.';
      return new Blob([textContent], { type: 'text/plain' });

    } catch (error) {
      console.error('❌ Помилка створення мінімального PDF:', error);
      // Останній fallback - порожній текстовий файл
      return new Blob(['PDF generation error'], { type: 'text/plain' });
    }
  }

  /**
   * Fallback метод PDF експорту через браузерний друк
   * Використовується якщо html2canvas + jsPDF не працюють
   */
  async exportToPDFPrintFallback(htmlContent, _options) {
    console.log('🖨️ Fallback PDF генерація через браузерний друк');

    return new Promise((resolve) => {
      // Створюємо iframe для друку
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Print Document</title>
            <style>
              @page {
                size: A4;
                margin: 20mm;
              }
              @media print {
                body { margin: 0; padding: 0; }
                * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: black;
              }
            </style>
          </head>
          <body>${htmlContent}</body>
        </html>
      `);
      iframeDoc.close();

      // Чекаємо завантаження та відкриваємо діалог друку
      setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          console.log('🖨️ Браузерний друк активовано (fallback)');
        }, 1000);
      }, 1000);

      // Повертаємо null оскільки це fallback
      resolve(null);
    });
  }

  /**
   * Експорт в DOCX
   * @param {string} htmlContent - HTML контент
   * @param {Object} options - Опції
   * @returns {Promise<Blob>} - DOCX файл
   */
  async exportToDOCX(htmlContent, options = {}) {
    // const { filename = 'document.docx' } = options;

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
    console.log('🔍 downloadFile викликана з параметрами:');
    console.log('  blob:', blob);
    console.log('  blob тип:', typeof blob);
    console.log('  blob instanceof Blob:', blob instanceof Blob);
    console.log('  blob розмір:', blob ? blob.size : 'N/A');
    console.log('  blob type:', blob ? blob.type : 'N/A');
    console.log('  filename:', filename);

    if (!blob) {
      console.error('❌ КРИТИЧНА ПОМИЛКА: blob є null або undefined!');
      console.trace('Stack trace:');
      return;
    }

    if (blob.size === 0) {
      console.error('❌ КРИТИЧНА ПОМИЛКА: blob розмір 0 байт!');
      console.log('🔍 blob деталі:', {
        size: blob.size,
        type: blob.type,
        constructor: blob.constructor.name
      });
      return;
    }

    console.log('✅ blob валідний, розмір:', blob.size, 'байт');

    const url = URL.createObjectURL(blob);
    console.log('🔗 URL створено:', url);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    console.log('📎 Клік по посиланню для завантаження...');
    link.click();

    // Очищення
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('🗑️ Посилання та URL очищено');
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
        console.log('📄 Початок PDF експорту через exportBoth...');
        const pdfBlob = await this.exportToPDF(htmlContent, {
          filename: `${baseName}.pdf`
        });

        console.log('🔍 exportBoth отримала PDF blob:');
        console.log('  pdfBlob:', pdfBlob);
        console.log('  pdfBlob тип:', typeof pdfBlob);
        console.log('  pdfBlob instanceof Blob:', pdfBlob instanceof Blob);
        console.log('  pdfBlob розмір:', pdfBlob ? pdfBlob.size : 'N/A');

        if (pdfBlob) {
          console.log('✅ PDF blob валідний, викликаємо downloadFile...');
          this.downloadFile(pdfBlob, `${baseName}.pdf`);
          results.pdf.success = true;
        } else {
          console.error('❌ PDF blob є null або undefined!');
          results.pdf.error = 'PDF blob is null or undefined';
        }
      } catch (error) {
        results.pdf.error = error.message;
        console.error('❌ PDF export failed в exportBoth:', error);
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

// Створення глобального екземпляру для backward compatibility
if (typeof window !== 'undefined') {
  // Створюємо екземпляр тільки якщо його ще немає
  if (!window.exportService) {
    window.exportService = new ExportService();
  }
}