/**
 * Performance Monitor
 * Моніторинг продуктивності застосунку
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: null,
      firstPaint: null,
      firstContentfulPaint: null,
      largestContentfulPaint: null,
      totalBlockingTime: 0,
      cumulativeLayoutShift: 0,
      interactions: []
    };

    this.observers = new Map();
    this.init();
  }

  /**
   * Ініціалізація моніторингу
   */
  init() {
    if (typeof window === 'undefined') {
      return;
    }

    this.measurePageLoad();
    this.observeWebVitals();
    this.trackInteractions();
    this.reportMetrics();
  }

  /**
   * Вимірювання завантаження сторінки
   */
  measurePageLoad() {
    if (!window.performance) {
      return;
    }

    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];

        if (perfData) {
          this.metrics.pageLoad = {
            dns: perfData.domainLookupEnd - perfData.domainLookupStart,
            tcp: perfData.connectEnd - perfData.connectStart,
            request: perfData.responseStart - perfData.requestStart,
            response: perfData.responseEnd - perfData.responseStart,
            domProcessing: perfData.domComplete - perfData.domLoading,
            total: perfData.loadEventEnd - perfData.fetchStart
          };

          console.log('📊 Page Load Metrics:', this.metrics.pageLoad);
        }
      }, 0);
    });
  }

  /**
   * Спостереження за Core Web Vitals
   */
  observeWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;

          console.log('🎨 LCP:', this.metrics.largestContentfulPaint, 'ms');
        });

        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        console.warn('LCP not supported');
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach(entry => {
            const fid = entry.processingStart - entry.startTime;
            console.log('⚡ FID:', fid, 'ms');

            this.metrics.interactions.push({
              type: 'first-input',
              delay: fid,
              timestamp: entry.startTime
            });
          });
        });

        fidObserver.observe({ type: 'first-input', buffered: true });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        console.warn('FID not supported');
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          this.metrics.cumulativeLayoutShift = clsValue;

          console.log('📐 CLS:', clsValue.toFixed(3));
        });

        clsObserver.observe({ type: 'layout-shift', buffered: true });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        console.warn('CLS not supported');
      }
    }

    // Paint Timing
    if (window.performance && performance.getEntriesByType) {
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        if (entry.name === 'first-paint') {
          this.metrics.firstPaint = entry.startTime;
        }
        if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
        }
      });

      console.log('🎨 FP:', this.metrics.firstPaint, 'ms');
      console.log('🎨 FCP:', this.metrics.firstContentfulPaint, 'ms');
    }
  }

  /**
   * Відстеження взаємодій користувача
   */
  trackInteractions() {
    const trackEvent = (type, element, duration = 0) => {
      this.metrics.interactions.push({
        type,
        element: element.tagName,
        duration,
        timestamp: performance.now()
      });
    };

    // Click tracking
    document.addEventListener('click', (e) => {
      const start = performance.now();

      requestAnimationFrame(() => {
        const duration = performance.now() - start;
        trackEvent('click', e.target, duration);

        if (duration > 100) {
          console.warn('⚠️ Slow click interaction:', duration, 'ms');
        }
      });
    });

    // Form submission tracking
    document.addEventListener('submit', (e) => {
      const start = performance.now();

      setTimeout(() => {
        const duration = performance.now() - start;
        trackEvent('submit', e.target, duration);
      }, 0);
    });
  }

  /**
   * Вимірювання конкретної операції
   * @param {string} name - Назва операції
   * @param {Function} fn - Функція для виконання
   */
  async measure(name, fn) {
    const start = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - start;

      console.log(`⏱️ ${name}:`, duration.toFixed(2), 'ms');

      return { result, duration };
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`❌ ${name} failed after:`, duration.toFixed(2), 'ms');
      throw error;
    }
  }

  /**
   * Mark та Measure для Performance API
   * @param {string} markName - Назва mark
   */
  mark(markName) {
    if (window.performance && performance.mark) {
      performance.mark(markName);
    }
  }

  /**
   * Вимірювання між двома marks
   * @param {string} measureName - Назва вимірювання
   * @param {string} startMark - Початковий mark
   * @param {string} endMark - Кінцевий mark
   */
  measureBetween(measureName, startMark, endMark) {
    if (window.performance && performance.measure) {
      try {
        performance.measure(measureName, startMark, endMark);
        const measure = performance.getEntriesByName(measureName)[0];
        console.log(`📏 ${measureName}:`, measure.duration.toFixed(2), 'ms');
        return measure.duration;
      } catch (e) {
        console.warn('Measure failed:', e);
      }
    }
  }

  /**
   * Генерація звіту про продуктивність
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      userAgent: navigator.userAgent,
      connection: this.getConnectionInfo(),
      memory: this.getMemoryInfo(),
      resources: this.getResourceTimings()
    };

    return report;
  }

  /**
   * Інформація про з'єднання
   */
  getConnectionInfo() {
    if (navigator.connection) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }
    return null;
  }

  /**
   * Інформація про пам'ять
   */
  getMemoryInfo() {
    if (performance.memory) {
      return {
        used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
      };
    }
    return null;
  }

  /**
   * Timing ресурсів
   */
  getResourceTimings() {
    if (!performance.getEntriesByType) {
      return [];
    }

    const resources = performance.getEntriesByType('resource');
    const slow = resources.filter(r => r.duration > 1000);

    return slow.map(r => ({
      name: r.name.split('/').pop(),
      duration: r.duration.toFixed(2),
      size: r.transferSize
    }));
  }

  /**
   * Відправка метрик (Analytics)
   */
  reportMetrics() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const report = this.generateReport();

        // Відправка в Google Analytics
        if (window.gtag) {
          gtag('event', 'performance_metrics', {
            event_category: 'Performance',
            event_label: 'Page Load',
            value: Math.round(this.metrics.pageLoad?.total || 0)
          });
        }

        // Консольний звіт
        console.log('📊 Performance Report:', report);

        // Збереження в localStorage для історії
        this.saveHistory(report);
      }, 3000);
    });
  }

  /**
   * Збереження історії метрик
   */
  saveHistory(report) {
    try {
      const history = JSON.parse(localStorage.getItem('performance_history') || '[]');
      history.push({
        timestamp: report.timestamp,
        pageLoad: report.metrics.pageLoad?.total,
        lcp: report.metrics.largestContentfulPaint,
        cls: report.metrics.cumulativeLayoutShift
      });

      // Зберігаємо тільки останні 10 записів
      const recent = history.slice(-10);
      localStorage.setItem('performance_history', JSON.stringify(recent));
    } catch (e) {
      console.warn('Failed to save performance history');
    }
  }

  /**
   * Отримання історії метрик
   */
  getHistory() {
    try {
      return JSON.parse(localStorage.getItem('performance_history') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Очищення observers
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Експорт та auto-init
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceMonitor;
} else if (typeof window !== 'undefined') {
  window.performanceMonitor = new PerformanceMonitor();
}