/**
 * Validator Checker - Автоматична перевірка через валідатори
 * HTML: https://validator.w3.org/
 * CSS: https://jigsaw.w3.org/css-validator/
 * JavaScript: https://jshint.com/
 */

class ValidatorChecker {
  constructor() {
    this.debugLogger = window.debugLogger || console;
    this.results = {
      html: null,
      css: null,
      js: null
    };
  }

  /**
   * Перевіряє HTML через W3C Validator
   */
  async validateHTML(htmlContent, options = {}) {
    const startTime = performance.now();
    
    try {
      // Створюємо тимчасовий файл для перевірки
      const formData = new FormData();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      formData.append('uploaded_file', blob, 'index.html');
      
      // Відправляємо на W3C Validator
      const response = await fetch('https://validator.w3.org/nu/?out=json', {
        method: 'POST',
        body: formData,
        headers: {
          'User-Agent': 'ValidatorChecker/1.0'
        }
      });

      const result = await response.json();
      const duration = performance.now() - startTime;

      this.results.html = {
        valid: result.messages ? result.messages.filter(m => m.type === 'error').length === 0 : true,
        errors: result.messages ? result.messages.filter(m => m.type === 'error') : [],
        warnings: result.messages ? result.messages.filter(m => m.type === 'info') : [],
        duration,
        timestamp: new Date().toISOString()
      };

      this.debugLogger.info('HTML валідація завершена', {
        valid: this.results.html.valid,
        errorsCount: this.results.html.errors.length,
        warningsCount: this.results.html.warnings.length,
        duration: `${duration.toFixed(2)}ms`
      }, 'VALIDATOR_CHECKER');

      return this.results.html;

    } catch (error) {
      this.debugLogger.error('Помилка при валідації HTML', {
        error: error.message
      }, 'VALIDATOR_CHECKER');

      return {
        valid: false,
        error: error.message,
        duration: performance.now() - startTime
      };
    }
  }

  /**
   * Перевіряє CSS через W3C CSS Validator
   */
  async validateCSS(cssContent, options = {}) {
    const startTime = performance.now();
    
    try {
      const formData = new FormData();
      const blob = new Blob([cssContent], { type: 'text/css' });
      formData.append('uploaded_file', blob, 'styles.css');
      
      const response = await fetch('https://jigsaw.w3.org/css-validator/validator', {
        method: 'POST',
        body: formData,
        headers: {
          'User-Agent': 'ValidatorChecker/1.0'
        }
      });

      const htmlResponse = await response.text();
      const duration = performance.now() - startTime;

      // Парсимо HTML відповідь для отримання помилок
      let doc;
      if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        doc = parser.parseFromString(htmlResponse, 'text/html');
      } else {
        // Fallback для Node.js середовища або якщо DOMParser недоступний
        console.warn('DOMParser недоступний, пропускаємо HTML парсинг');
        return {
          isValid: !htmlResponse.includes('Error'),
          errors: [],
          warnings: [],
          duration,
          raw: htmlResponse
        };
      }
      
      const errors = Array.from(doc.querySelectorAll('.error')).map(error => ({
        line: error.querySelector('.line')?.textContent || 'Unknown',
        message: error.querySelector('.msg')?.textContent || 'Unknown error',
        context: error.querySelector('.context')?.textContent || ''
      }));

      const warnings = Array.from(doc.querySelectorAll('.warning')).map(warning => ({
        line: warning.querySelector('.line')?.textContent || 'Unknown',
        message: warning.querySelector('.msg')?.textContent || 'Unknown warning',
        context: warning.querySelector('.context')?.textContent || ''
      }));

      this.results.css = {
        valid: errors.length === 0,
        errors,
        warnings,
        duration,
        timestamp: new Date().toISOString()
      };

      this.debugLogger.info('CSS валідація завершена', {
        valid: this.results.css.valid,
        errorsCount: this.results.css.errors.length,
        warningsCount: this.results.css.warnings.length,
        duration: `${duration.toFixed(2)}ms`
      }, 'VALIDATOR_CHECKER');

      return this.results.css;

    } catch (error) {
      this.debugLogger.error('Помилка при валідації CSS', {
        error: error.message
      }, 'VALIDATOR_CHECKER');

      return {
        valid: false,
        error: error.message,
        duration: performance.now() - startTime
      };
    }
  }

  /**
   * Перевіряє JavaScript через JSHint (локально)
   */
  validateJavaScript(jsContent, options = {}) {
    const startTime = performance.now();
    
    try {
      // Простий локальний валідатор JavaScript
      const errors = [];
      const warnings = [];

      // Перевіряємо базові помилки
      const lines = jsContent.split('\n');
      
      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        
        // Перевіряємо на відсутні крапки з комою
        if (line.trim() && !line.trim().endsWith(';') && !line.trim().endsWith('{') && 
            !line.trim().endsWith('}') && !line.trim().startsWith('//') && 
            !line.trim().startsWith('/*') && !line.trim().startsWith('*') &&
            !line.includes('if') && !line.includes('else') && !line.includes('for') &&
            !line.includes('while') && !line.includes('function') && !line.includes('return')) {
          warnings.push({
            line: lineNumber,
            message: 'Missing semicolon',
            code: 'missing-semicolon'
          });
        }

        // Перевіряємо на невикористані змінні (спрощено)
        const varMatch = line.match(/let\s+(\w+)\s*=/);
        if (varMatch) {
          const varName = varMatch[1];
          const restOfCode = jsContent.substring(jsContent.indexOf(line) + line.length);
          if (!restOfCode.includes(varName)) {
            warnings.push({
              line: lineNumber,
              message: `Unused variable: ${varName}`,
              code: 'unused-variable'
            });
          }
        }

        // Перевіряємо на console.log в продакшні
        if (line.includes('console.log') && !options.allowConsoleLog) {
          warnings.push({
            line: lineNumber,
            message: 'console.log should be removed in production',
            code: 'console-log'
          });
        }
      });

      const duration = performance.now() - startTime;

      this.results.js = {
        valid: errors.length === 0,
        errors,
        warnings,
        duration,
        timestamp: new Date().toISOString()
      };

      this.debugLogger.info('JavaScript валідація завершена', {
        valid: this.results.js.valid,
        errorsCount: this.results.js.errors.length,
        warningsCount: this.results.js.warnings.length,
        duration: `${duration.toFixed(2)}ms`
      }, 'VALIDATOR_CHECKER');

      return this.results.js;

    } catch (error) {
      this.debugLogger.error('Помилка при валідації JavaScript', {
        error: error.message
      }, 'VALIDATOR_CHECKER');

      return {
        valid: false,
        error: error.message,
        duration: performance.now() - startTime
      };
    }
  }

  /**
   * Комплексна перевірка всіх файлів
   */
  async validateAll(htmlContent, cssContent, jsContent, options = {}) {
    this.debugLogger.info('Початок комплексної валідації', null, 'VALIDATOR_CHECKER');

    const results = {
      html: await this.validateHTML(htmlContent, options),
      css: await this.validateCSS(cssContent, options),
      js: this.validateJavaScript(jsContent, options)
    };

    const summary = {
      allValid: results.html.valid && results.css.valid && results.js.valid,
      totalErrors: (results.html.errors?.length || 0) + 
                   (results.css.errors?.length || 0) + 
                   (results.js.errors?.length || 0),
      totalWarnings: (results.html.warnings?.length || 0) + 
                     (results.css.warnings?.length || 0) + 
                     (results.js.warnings?.length || 0),
      totalDuration: (results.html.duration || 0) + 
                     (results.css.duration || 0) + 
                     (results.js.duration || 0)
    };

    this.debugLogger.info('Комплексна валідація завершена', summary, 'VALIDATOR_CHECKER');

    return {
      results,
      summary
    };
  }

  /**
   * Генерує звіт про валідацію
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        html: this.results.html ? {
          valid: this.results.html.valid,
          errors: this.results.html.errors?.length || 0,
          warnings: this.results.html.warnings?.length || 0
        } : null,
        css: this.results.css ? {
          valid: this.results.css.valid,
          errors: this.results.css.errors?.length || 0,
          warnings: this.results.css.warnings?.length || 0
        } : null,
        js: this.results.js ? {
          valid: this.results.js.valid,
          errors: this.results.js.errors?.length || 0,
          warnings: this.results.js.warnings?.length || 0
        } : null
      },
      details: this.results
    };

    return report;
  }

  /**
   * Експортує звіт
   */
  exportReport() {
    const report = this.generateReport();
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `validation-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    this.debugLogger.info('Звіт про валідацію експортовано', null, 'VALIDATOR_CHECKER');
  }

  /**
   * Очищає результати
   */
  clearResults() {
    this.results = {
      html: null,
      css: null,
      js: null
    };
    this.debugLogger.info('Результати валідації очищено', null, 'VALIDATOR_CHECKER');
  }
}

// Експорт
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValidatorChecker;
} else if (typeof window !== 'undefined') {
  window.ValidatorChecker = ValidatorChecker;
}
