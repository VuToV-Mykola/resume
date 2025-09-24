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
        const rules = sheet.cssRules
        if (!rules) continue

        for (const rule of rules) {
          if (rule.constructor.name === 'CSSMediaRule' && rule.conditionText === 'print') {
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
  handleMutation() {
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
   * Оновлення preview контенту зі збереженням позиції скролу
   */
  updatePreview(content = null) {
    if (!this.isActive) return

    console.log('🔄 Оновлення print preview...')

    const scrollContainer = this.viewport.parentElement || this.viewport
    const savedScrollTop = scrollContainer.scrollTop
    const savedScrollLeft = scrollContainer.scrollLeft

    const htmlContent = content || this.viewport.innerHTML

    this.viewport.innerHTML = ''

    this.renderPages(htmlContent)

    this.calculateScale()
    this.applyScale()

    requestAnimationFrame(() => {
      scrollContainer.scrollTop = savedScrollTop
      scrollContainer.scrollLeft = savedScrollLeft
    })

    console.log(`✅ Preview оновлено: ${this.pages.length} сторінок`)
  }

  /**
   * Розбиття контенту на А4 сторінки з підтримкою CSS page-break
   */
  renderPages(htmlContent) {
    this.pages = []

    const measureContainer = this.createMeasureContainer(htmlContent)
    const pageContentHeight = this.config.a4HeightPx - (this.config.marginPx * 2)

    const { styleContent, elements } = this.extractContentAndStyles(measureContainer)
    const pages = this.paginateElements(elements, measureContainer, pageContentHeight, styleContent)

    pages.forEach(pageContent => {
      const page = this.createPageElement(pageContent, styleContent)
      this.pages.push(page)
      this.viewport.appendChild(page)
    })

    document.body.removeChild(measureContainer)

    if (this.pages.length > 10) {
      this.enableLazyRendering()
    }
  }

  /**
   * Створення тимчасового контейнера для вимірювань з точними print стилями
   */
  createMeasureContainer(htmlContent) {
    const container = document.createElement('div')
    container.style.cssText = `
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
    document.body.appendChild(container)
    container.innerHTML = htmlContent
    return container
  }

  /**
   * Витягування стилів та елементів контенту
   */
  extractContentAndStyles(container) {
    const styles = container.querySelectorAll('style')
    const styleContent = Array.from(styles).map(s => s.outerHTML).join('\n')
    styles.forEach(s => s.remove())

    const elements = Array.from(container.children)
    return { styleContent, elements }
  }

  /**
   * Інтелектуальна пагінація з підтримкою CSS page-break правил
   */
  paginateElements(elements, measureContainer, pageContentHeight) {
    const pages = []
    let currentPageElements = []
    let currentHeight = 0

    elements.forEach((el) => {
      const computedStyle = window.getComputedStyle(el)
      const pageBreakBefore = computedStyle.getPropertyValue('page-break-before')
      const pageBreakAfter = computedStyle.getPropertyValue('page-break-after')
      const pageBreakInside = computedStyle.getPropertyValue('page-break-inside')

      if (pageBreakBefore === 'always' || pageBreakBefore === 'page') {
        if (currentPageElements.length > 0) {
          pages.push([...currentPageElements])
          currentPageElements = []
          currentHeight = 0
        }
      }

      const elClone = el.cloneNode(true)
      measureContainer.appendChild(elClone)
      const elHeight = elClone.offsetHeight
      const marginTop = parseFloat(computedStyle.marginTop) || 0
      const marginBottom = parseFloat(computedStyle.marginBottom) || 0
      const totalHeight = elHeight + marginTop + marginBottom

      const wouldExceedPage = currentHeight + totalHeight > pageContentHeight
      const canSplit = pageBreakInside !== 'avoid' && this.isBreakableElement(el)

      if (wouldExceedPage && currentPageElements.length > 0) {
        if (canSplit && totalHeight > pageContentHeight * 0.6) {
          const { firstPart, secondPart } = this.splitElement(el, pageContentHeight - currentHeight, measureContainer)

          if (firstPart) {
            currentPageElements.push(firstPart)
          }

          pages.push([...currentPageElements])
          currentPageElements = secondPart ? [secondPart] : []
          currentHeight = secondPart ? this.measureHeight(secondPart, measureContainer) : 0
        } else {
          pages.push([...currentPageElements])
          currentPageElements = [el]
          currentHeight = totalHeight
        }
      } else {
        currentPageElements.push(el)
        currentHeight += totalHeight
      }

      if (pageBreakAfter === 'always' || pageBreakAfter === 'page') {
        pages.push([...currentPageElements])
        currentPageElements = []
        currentHeight = 0
      }

      measureContainer.removeChild(elClone)
    })

    if (currentPageElements.length > 0) {
      pages.push(currentPageElements)
    }

    return pages
  }

  /**
   * Перевірка чи елемент можна розбити на частини
   */
  isBreakableElement(element) {
    const breakableTags = ['P', 'DIV', 'SECTION', 'ARTICLE', 'UL', 'OL']
    return breakableTags.includes(element.tagName)
  }

  /**
   * Розумне розбиття великого елемента на дві частини
   */
  splitElement(element, availableHeight, measureContainer) {
    if (element.tagName === 'P' || element.tagName === 'DIV') {
      const textContent = element.textContent
      const words = textContent.split(/\s+/)

      let firstPartWords = []
      let testEl = element.cloneNode(false)
      measureContainer.appendChild(testEl)

      for (let i = 0; i < words.length; i++) {
        testEl.textContent = [...firstPartWords, words[i]].join(' ')

        if (testEl.offsetHeight > availableHeight && firstPartWords.length > 0) {
          break
        }
        firstPartWords.push(words[i])
      }

      measureContainer.removeChild(testEl)

      if (firstPartWords.length === 0 || firstPartWords.length === words.length) {
        return { firstPart: element, secondPart: null }
      }

      const firstPart = element.cloneNode(false)
      firstPart.textContent = firstPartWords.join(' ')

      const secondPart = element.cloneNode(false)
      secondPart.textContent = words.slice(firstPartWords.length).join(' ')

      return { firstPart, secondPart }
    }

    return { firstPart: element, secondPart: null }
  }

  /**
   * Вимірювання висоти елемента
   */
  measureHeight(element, measureContainer) {
    const clone = element.cloneNode(true)
    measureContainer.appendChild(clone)
    const height = clone.offsetHeight
    measureContainer.removeChild(clone)
    return height
  }

  /**
   * Створення DOM елемента сторінки А4
   */
  createPageElement(elements, styleContent) {
    const page = document.createElement('div')
    page.className = 'a4-page print-like'
    page.setAttribute('data-page', this.pages.length + 1)

    const elementsHTML = elements.map(el => el.outerHTML).join('\n')
    page.innerHTML = `
      <div class="document-preview">
        ${styleContent}
        ${elementsHTML}
      </div>
    `
    return page
  }

  /**
   * Lazy rendering для великих документів (>10 сторінок)
   */
  enableLazyRendering() {
    const observerOptions = {
      root: this.viewport,
      rootMargin: '100px',
      threshold: 0.01
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('rendered')
        } else {
          entry.target.classList.remove('rendered')
        }
      })
    }, observerOptions)

    this.pages.forEach(page => {
      observer.observe(page)
    })

    console.log('✅ Lazy rendering активовано для', this.pages.length, 'сторінок')
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