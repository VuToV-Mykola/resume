/**
 * LivePrintPreview - Real-time браузерний print preview з попіксельною точністю
 *
 * Функціональність:
 * - Попіксельно точна емуляція браузерного print preview
 * - Real-time оновлення при редагуванні контенту
 * - Адаптивне масштабування для всіх розмірів екранів
 * - Підтримка динамічної кількості А4 сторінок
 * - Оптимізована продуктивність з debouncing
 */

class LivePrintPreview {
  constructor(options = {}) {
    // Конфігурація
    this.config = {
      containerSelector: options.containerSelector || '#previewContent',
      editorSelector: options.editorSelector || '.form-section',
      debounceDelay: options.debounceDelay || 300,
      a4Width: 210, // мм
      a4Height: 297, // мм
      a4WidthPx: 794, // 210mm при 96 DPI
      a4HeightPx: 1123, // 297mm при 96 DPI
      marginMm: 20, // поля А4
      marginPx: 76, // 20mm у пікселях
      ...options
    }

    // Елементи DOM
    this.container = document.querySelector(this.config.containerSelector)
    this.editor = document.querySelector(this.config.editorSelector)
    this.viewport = null
    this.pages = []

    // Стан
    this.isActive = false
    this.currentScale = 1
    this.observers = {
      mutation: null,
      resize: null
    }

    // Таймери
    this.debounceTimer = null
    this.resizeTimer = null

    // Ініціалізація
    this.init()
  }

  /**
   * Ініціалізація print preview
   */
  init() {
    if (!this.container) {
      console.error('LivePrintPreview: контейнер не знайдено')
      return
    }

    this.createViewportStructure()
    this.extractPrintStyles()
    this.setupObservers()

    console.log('✅ LivePrintPreview ініціалізовано')
  }

  /**
   * Створення структури viewport для print preview
   */
  createViewportStructure() {
    // Створюємо viewport якщо його немає
    if (!this.viewport) {
      const existingPreviewContainer = this.container.querySelector('.preview-container')

      if (existingPreviewContainer) {
        // Оновлюємо існуючий контейнер
        existingPreviewContainer.classList.add('print-preview-viewport')
        this.viewport = existingPreviewContainer
      } else {
        // Створюємо новий
        this.viewport = document.createElement('div')
        this.viewport.className = 'print-preview-viewport'
        this.container.appendChild(this.viewport)
      }
    }
  }

  /**
   * Витягування та застосування print стилів для preview
   */
  extractPrintStyles() {
    // Знаходимо всі @media print правила
    const printRules = []

    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules
        for (const rule of rules) {
          if (rule.type === CSSRule.MEDIA_RULE && rule.conditionText === 'print') {
            // Конвертуємо @media print в звичайні стилі для .print-preview-mode
            const cssText = rule.cssText
              .replace('@media print {', '')
              .replace(/}$/, '')
              .replace(/([^{]+){/g, '.print-preview-mode $1{')

            printRules.push(cssText)
          }
        }
      } catch (e) {
        // Ігноруємо CORS помилки для зовнішніх стилів
        console.warn('Не вдалося отримати доступ до stylesheet:', sheet.href)
      }
    }

    // Додаємо стилі в head
    if (printRules.length > 0) {
      const styleEl = document.createElement('style')
      styleEl.id = 'live-print-preview-styles'
      styleEl.textContent = printRules.join('\n')

      // Видаляємо старі стилі якщо є
      const oldStyle = document.getElementById('live-print-preview-styles')
      if (oldStyle) oldStyle.remove()

      document.head.appendChild(styleEl)
    }
  }

  /**
   * Налаштування observers для відстеження змін
   */
  setupObservers() {
    // MutationObserver для відстеження змін контенту
    this.observers.mutation = new MutationObserver(this.handleMutation.bind(this))

    // ResizeObserver для адаптивного масштабування
    if ('ResizeObserver' in window) {
      this.observers.resize = new ResizeObserver(this.handleResize.bind(this))
      this.observers.resize.observe(this.container)
    } else {
      // Fallback для старих браузерів
      window.addEventListener('resize', this.handleResize.bind(this))
    }
  }

  /**
   * Обробник зміни контенту з debouncing
   */
  handleMutation(mutations) {
    if (!this.isActive) return

    clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => {
      requestAnimationFrame(() => {
        this.updatePreview()
      })
    }, this.config.debounceDelay)
  }

  /**
   * Обробник зміни розміру вікна
   */
  handleResize() {
    clearTimeout(this.resizeTimer)
    this.resizeTimer = setTimeout(() => {
      requestAnimationFrame(() => {
        this.calculateScale()
        this.applyScale()
      })
    }, 100)
  }

  /**
   * Активація live preview
   */
  activate(content) {
    this.isActive = true

    // Додаємо клас для емуляції print режиму
    this.viewport.classList.add('print-preview-mode')

    // Оновлюємо контент
    this.updatePreview(content)

    // Запускаємо observer
    if (this.observers.mutation) {
      this.observers.mutation.observe(this.viewport, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
      })
    }

    console.log('✅ Live preview активовано')
  }

  /**
   * Деактивація live preview
   */
  deactivate() {
    this.isActive = false

    // Відключаємо observers
    if (this.observers.mutation) {
      this.observers.mutation.disconnect()
    }

    // Видаляємо класи
    this.viewport.classList.remove('print-preview-mode')

    console.log('❌ Live preview деактивовано')
  }

  /**
   * Оновлення preview контенту
   */
  updatePreview(content = null) {
    if (!this.isActive) return

    console.log('🔄 Оновлення print preview...')

    // Якщо контент не передано, беремо його з viewport
    const htmlContent = content || this.viewport.innerHTML

    // Очищаємо viewport
    this.viewport.innerHTML = ''

    // Розбиваємо на сторінки
    this.renderPages(htmlContent)

    // Розраховуємо масштаб
    this.calculateScale()
    this.applyScale()

    console.log(`✅ Preview оновлено: ${this.pages.length} сторінок`)
  }

  /**
   * Розбиття контенту на А4 сторінки
   */
  renderPages(htmlContent) {
    // Очищаємо попередні сторінки
    this.pages = []

    // Створюємо тимчасовий контейнер для вимірювання
    const measureContainer = document.createElement('div')
    measureContainer.style.cssText = `
      position: fixed;
      visibility: hidden;
      left: -10000px;
      top: -10000px;
      width: ${this.config.a4WidthPx}px;
      padding: ${this.config.marginPx}px;
      box-sizing: border-box;
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.5;
    `
    document.body.appendChild(measureContainer)
    measureContainer.innerHTML = htmlContent

    // Висота доступного контенту на сторінці
    const pageContentHeight = this.config.a4HeightPx - (this.config.marginPx * 2)

    // Витягуємо стилі
    const styles = measureContainer.querySelectorAll('style')
    const styleContent = Array.from(styles).map(s => s.outerHTML).join('\n')
    styles.forEach(s => s.remove())

    // Розбиваємо на сторінки
    const elements = Array.from(measureContainer.children)
    let currentPageElements = []
    let currentHeight = 0

    const createPage = (elements) => {
      const page = document.createElement('div')
      page.className = 'a4-page print-like'
      page.innerHTML = `
        <div class="document-preview">
          ${styleContent}
          ${elements.map(el => el.outerHTML).join('\n')}
        </div>
      `
      return page
    }

    elements.forEach((el) => {
      const elClone = el.cloneNode(true)
      measureContainer.appendChild(elClone)

      const elHeight = elClone.offsetHeight

      if (currentHeight + elHeight > pageContentHeight && currentPageElements.length > 0) {
        // Створюємо сторінку
        const page = createPage(currentPageElements)
        this.pages.push(page)
        this.viewport.appendChild(page)

        // Скидаємо для нової сторінки
        currentPageElements = [el]
        currentHeight = elHeight
      } else {
        currentPageElements.push(el)
        currentHeight += elHeight
      }

      measureContainer.removeChild(elClone)
    })

    // Додаємо останню сторінку
    if (currentPageElements.length > 0) {
      const page = createPage(currentPageElements)
      this.pages.push(page)
      this.viewport.appendChild(page)
    }

    // Видаляємо тимчасовий контейнер
    document.body.removeChild(measureContainer)
  }

  /**
   * Розрахунок оптимального масштабу
   */
  calculateScale() {
    if (this.pages.length === 0) return

    const containerRect = this.viewport.getBoundingClientRect()
    const containerWidth = containerRect.width - 40 // padding
    const containerHeight = containerRect.height - 40

    // Розраховуємо масштаб по ширині та висоті
    const scaleX = containerWidth / this.config.a4WidthPx
    const scaleY = containerHeight / this.config.a4HeightPx

    // Вибираємо менший масштаб, щоб сторінка помістилась
    this.currentScale = Math.min(scaleX, scaleY, 1)

    console.log(`📐 Масштаб: ${(this.currentScale * 100).toFixed(1)}%`)
  }

  /**
   * Застосування масштабу до сторінок
   */
  applyScale() {
    this.pages.forEach(page => {
      page.style.transform = `scale(${this.currentScale})`
      page.style.transformOrigin = 'top center'
      page.style.marginBottom = `${10 * this.currentScale}mm`
    })

    // Оновлюємо CSS змінну для адаптивності
    document.documentElement.style.setProperty('--page-scale', this.currentScale)
  }

  /**
   * Очищення ресурсів
   */
  destroy() {
    this.deactivate()

    if (this.observers.mutation) {
      this.observers.mutation.disconnect()
      this.observers.mutation = null
    }

    if (this.observers.resize) {
      this.observers.resize.disconnect()
      this.observers.resize = null
    }

    clearTimeout(this.debounceTimer)
    clearTimeout(this.resizeTimer)

    // Видаляємо стилі
    const styleEl = document.getElementById('live-print-preview-styles')
    if (styleEl) styleEl.remove()

    console.log('🗑️ LivePrintPreview знищено')
  }
}

// Експорт для використання в інших модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LivePrintPreview
}