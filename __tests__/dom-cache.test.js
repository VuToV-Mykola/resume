const DOMCache = require('../js/utils/dom-cache.js');

describe('DOMCache', () => {
  let domCache;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="testElement">Test</div>
      <div class="test-class">Class Test</div>
      <div class="multiple">First</div>
      <div class="multiple">Second</div>
    `;
    domCache = new DOMCache();
  });

  describe('get', () => {
    test('кешує елемент при першому запиті', () => {
      const element = domCache.get('testElement');
      expect(element).toBeTruthy();
      expect(element.textContent).toBe('Test');
    });

    test('повертає кешований елемент при повторному запиті', () => {
      const first = domCache.get('testElement');
      const second = domCache.get('testElement');
      expect(first).toBe(second);
    });

    test('повертає null для неіснуючого елемента', () => {
      const element = domCache.get('nonexistent');
      expect(element).toBeNull();
    });
  });

  describe('query', () => {
    test('кешує елемент за selector', () => {
      const element = domCache.query('.test-class');
      expect(element).toBeTruthy();
      expect(element.textContent).toBe('Class Test');
    });

    test('повертає кешований елемент', () => {
      const first = domCache.query('.test-class');
      const second = domCache.query('.test-class');
      expect(first).toBe(second);
    });
  });

  describe('queryAll', () => {
    test('кешує всі елементи за selector', () => {
      const elements = domCache.queryAll('.multiple');
      expect(elements.length).toBe(2);
      expect(elements[0].textContent).toBe('First');
      expect(elements[1].textContent).toBe('Second');
    });

    test('повертає порожній масив для неіснуючих елементів', () => {
      const elements = domCache.queryAll('.nonexistent');
      expect(Array.isArray(elements)).toBe(true);
      expect(elements.length).toBe(0);
    });
  });

  describe('clear', () => {
    test('очищає весь кеш', () => {
      domCache.get('testElement');
      domCache.query('.test-class');
      domCache.clear();
      expect(domCache.has('testElement')).toBe(false);
      expect(domCache.has('.test-class')).toBe(false);
    });
  });

  describe('delete', () => {
    test('видаляє конкретний елемент з кешу', () => {
      domCache.get('testElement');
      domCache.delete('testElement');
      expect(domCache.has('testElement')).toBe(false);
    });
  });

  describe('has', () => {
    test('перевіряє наявність елемента в кеші', () => {
      expect(domCache.has('testElement')).toBe(false);
      domCache.get('testElement');
      expect(domCache.has('testElement')).toBe(true);
    });
  });
});