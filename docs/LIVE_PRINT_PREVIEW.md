# LivePrintPreview - Документація

## Огляд

LivePrintPreview - клас для створення попіксельно точного браузерного print preview з real-time оновленням контенту.

## Особливості

✅ **Попіксельна точність** - preview на 100% відповідає браузерному print preview
✅ **Real-time оновлення** - миттєве відображення змін при редагуванні
✅ **Адаптивне масштабування** - автоматичне підлаштування під розмір екрану
✅ **Динамічна пагінація** - автоматичне розбиття на А4 сторінки
✅ **Крос-браузерна сумісність** - підтримка Chrome, Firefox, Safari, Edge
✅ **Оптимізована продуктивність** - debouncing та requestAnimationFrame

## Використання

### Базове використання

```javascript
// Ініціалізація
const printPreview = new LivePrintPreview({
  containerSelector: '#previewContent',
  editorSelector: '.form-section',
  debounceDelay: 300
})

// Активація з контентом
const htmlContent = document.querySelector('.document-preview').innerHTML
printPreview.activate(htmlContent)

// Деактивація
printPreview.deactivate()

// Повне видалення
printPreview.destroy()
```

### Інтеграція з існуючим кодом

```javascript
// В main.js після генерації контенту
async function showPreview(type) {
  // ... генерація bewerbungContent або lebenslaufContent

  // Замість старого коду:
  // document.getElementById('previewContent').innerHTML = content

  // Використовуємо LivePrintPreview:
  if (!window.livePrintPreview) {
    window.livePrintPreview = new LivePrintPreview()
  }

  window.livePrintPreview.activate(content)
}
```

## Конфігурація

### Параметри ініціалізації

| Параметр | Тип | За замовчуванням | Опис |
|----------|-----|------------------|------|
| `containerSelector` | string | `'#previewContent'` | CSS селектор контейнера preview |
| `editorSelector` | string | `'.form-section'` | CSS селектор редактора (для observers) |
| `debounceDelay` | number | `300` | Затримка debounce в мс |
| `a4Width` | number | `210` | Ширина А4 в мм |
| `a4Height` | number | `297` | Висота А4 в мм |
| `a4WidthPx` | number | `794` | Ширина А4 в пікселях (96 DPI) |
| `a4HeightPx` | number | `1123` | Висота А4 в пікселях (96 DPI) |
| `marginMm` | number | `20` | Поля сторінки в мм |
| `marginPx` | number | `76` | Поля сторінки в пікселях |

### Приклад власної конфігурації

```javascript
const printPreview = new LivePrintPreview({
  containerSelector: '#customPreview',
  debounceDelay: 500,
  marginMm: 25,
  marginPx: 95
})
```

## API

### Методи

#### `activate(content)`
Активує live preview з переданим HTML контентом.

**Параметри:**
- `content` (string, optional) - HTML контент для відображення

**Приклад:**
```javascript
const htmlContent = '<div class="document-preview">...</div>'
printPreview.activate(htmlContent)
```

#### `deactivate()`
Деактивує live preview, зупиняє observers.

**Приклад:**
```javascript
printPreview.deactivate()
```

#### `updatePreview(content)`
Оновлює контент preview.

**Параметри:**
- `content` (string, optional) - Новий HTML контент

**Приклад:**
```javascript
printPreview.updatePreview(newContent)
```

#### `destroy()`
Повне видалення preview з очищенням ресурсів.

**Приклад:**
```javascript
printPreview.destroy()
printPreview = null
```

### Властивості

#### `isActive` (boolean)
Статус активності preview.

#### `currentScale` (number)
Поточний масштаб відображення (0-1).

#### `pages` (Array)
Масив DOM елементів сторінок.

## CSS Класи

### Основні класи

`.print-preview-viewport` - Головний контейнер preview
`.print-preview-mode` - Клас для емуляції print режиму
`.a4-page` - Окрема А4 сторінка
`.a4-page.print-like` - Емуляція друкарських стилів
`.page-separator` - Розділювач між сторінками
`.page-break-indicator` - Індикатор розриву сторінки

### CSS змінні

`--page-scale` - Поточний масштаб сторінки (0-1)

**Приклад використання:**
```css
.custom-element {
  font-size: calc(12pt * var(--page-scale, 1));
}
```

## Технічні деталі

### Архітектура

```
LivePrintPreview
├── Initialization
│   ├── createViewportStructure()
│   ├── extractPrintStyles()
│   └── setupObservers()
├── Observers
│   ├── MutationObserver (відстеження змін DOM)
│   └── ResizeObserver (адаптивне масштабування)
├── Rendering
│   ├── renderPages() (розбиття на А4)
│   ├── calculateScale() (розрахунок масштабу)
│   └── applyScale() (застосування масштабу)
└── Lifecycle
    ├── activate()
    ├── deactivate()
    └── destroy()
```

### Алгоритм пагінації

1. **Створення тимчасового контейнера** для вимірювання висоти
2. **Розрахунок доступної висоти** сторінки (A4 - поля)
3. **Послідовна обробка елементів**:
   - Додавання елементу до поточної сторінки
   - Перевірка переповнення
   - Створення нової сторінки при потребі
4. **Генерація HTML** для кожної сторінки
5. **Очищення** тимчасових елементів

### Оптимізація продуктивності

**Debouncing:**
```javascript
handleMutation() {
  clearTimeout(this.debounceTimer)
  this.debounceTimer = setTimeout(() => {
    requestAnimationFrame(() => {
      this.updatePreview()
    })
  }, this.config.debounceDelay)
}
```

**RequestAnimationFrame:**
- Синхронізація з частотою оновлення браузера
- Зменшення навантаження на GPU
- Плавна анімація масштабування

## Крос-браузерна сумісність

### Підтримувані браузери

| Браузер | Версія | Підтримка |
|---------|--------|-----------|
| Chrome | 120+ | ✅ Повна |
| Firefox | 115+ | ✅ Повна |
| Safari | 16+ | ✅ З fallbacks |
| Edge | 120+ | ✅ Повна |

### Fallbacks

**Container Queries:**
```css
@supports not (container-type: inline-size) {
  .a4-page {
    width: clamp(400px, 90vw, 794px);
  }
}
```

**Aspect Ratio:**
```css
@supports not (aspect-ratio: 1 / 1) {
  .a4-page {
    min-height: 1123px;
  }
}
```

**Safari Specific:**
```css
@media screen and (-webkit-min-device-pixel-ratio: 1) {
  .a4-page {
    -webkit-transform-origin: top center;
  }
}
```

## Відомі обмеження

1. **CORS для зовнішніх стилів** - print стилі з зовнішніх джерел не витягуються
2. **Складні CSS transforms** - можуть не коректно відображатись
3. **Динамічний контент** - observer може не відловити всі зміни в iframe
4. **Великі документи (50+ сторінок)** - можливе зниження продуктивності

## Відладка

### Логування

Клас виводить детальні логи в консоль:

```
✅ LivePrintPreview ініціалізовано
🔄 Оновлення print preview...
📐 Масштаб: 85.2%
✅ Preview оновлено: 3 сторінок
```

### Debug режим

```javascript
const printPreview = new LivePrintPreview({
  debug: true  // Додає додаткове логування
})
```

### Перевірка стану

```javascript
console.log('Active:', printPreview.isActive)
console.log('Scale:', printPreview.currentScale)
console.log('Pages:', printPreview.pages.length)
```

## Приклади

### Приклад 1: Базова інтеграція

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const preview = new LivePrintPreview()

  document.getElementById('showPreview').addEventListener('click', () => {
    const content = document.querySelector('.editor').innerHTML
    preview.activate(content)
  })
})
```

### Приклад 2: З автоматичним оновленням

```javascript
const preview = new LivePrintPreview()

const editor = document.querySelector('.editor')
editor.addEventListener('input', () => {
  preview.updatePreview(editor.innerHTML)
})
```

### Приклад 3: Кастомна пагінація

```javascript
const preview = new LivePrintPreview({
  a4HeightPx: 1000,  // Менша висота сторінки
  marginPx: 50       // Менші поля
})
```

## Вирішення проблем

### Проблема: Preview не оновлюється

**Рішення:**
1. Перевірте чи активовано preview: `preview.isActive === true`
2. Переконайтесь що MutationObserver працює
3. Перевірте debounceDelay - можливо треба зменшити

### Проблема: Неправильне масштабування

**Рішення:**
1. Перевірте CSS змінну `--page-scale`
2. Переконайтесь що ResizeObserver підтримується
3. Викличте `calculateScale()` вручну

### Проблема: Сторінки розбиваються неправильно

**Рішення:**
1. Перевірте `a4HeightPx` та `marginPx` значення
2. Переконайтесь що контент не має absolute позиціонування
3. Збільште `debounceDelay` для точнішого розрахунку

## Ліцензія

MIT License - вільне використання в комерційних та некомерційних проектах.

## Автори

Створено для проекту Resume Generator 2025

## Зміни

### v1.0.0 (2025-01-27)
- Початкова версія
- Базовий функціонал live preview
- Адаптивне масштабування
- Крос-браузерна підтримка