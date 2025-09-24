const EventManager = require('../js/utils/event-manager.js');

describe('EventManager', () => {
  let eventManager;
  let testElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container">
        <button id="testBtn" class="btn">Click me</button>
        <button class="btn">Button 2</button>
        <div class="item" data-id="1">Item 1</div>
        <div class="item" data-id="2">Item 2</div>
      </div>
    `;
    eventManager = new EventManager();
    testElement = document.getElementById('testBtn');
  });

  afterEach(() => {
    eventManager.destroy();
  });

  describe('on', () => {
    test('додає event listener до елемента', () => {
      const handler = jest.fn();
      eventManager.on('#testBtn', 'click', handler);

      testElement.click();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    test('працює з DOM елементом напряму', () => {
      const handler = jest.fn();
      eventManager.on(testElement, 'click', handler);

      testElement.click();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    test('обробляє декілька listeners на одному елементі', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventManager.on('#testBtn', 'click', handler1);
      eventManager.on('#testBtn', 'click', handler2);

      testElement.click();
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    test('ігнорує неіснуючий селектор', () => {
      const handler = jest.fn();
      eventManager.on('#nonexistent', 'click', handler);

      expect(eventManager.listeners.length).toBe(0);
    });
  });

  describe('onAll', () => {
    test('додає event listener до всіх елементів', () => {
      const handler = jest.fn();
      eventManager.onAll('.btn', 'click', handler);

      const buttons = document.querySelectorAll('.btn');
      buttons[0].click();
      buttons[1].click();

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('delegate', () => {
    test('делегує подію до дочірніх елементів', () => {
      const handler = jest.fn();
      eventManager.delegate('#container', 'click', '.btn', handler);

      testElement.click();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    test('викликає handler для всіх відповідних дочірніх елементів', () => {
      const handler = jest.fn();
      eventManager.delegate('#container', 'click', '.item', handler);

      const items = document.querySelectorAll('.item');
      items[0].click();
      items[1].click();

      expect(handler).toHaveBeenCalledTimes(2);
    });

    test('не викликає handler для невідповідних елементів', () => {
      const handler = jest.fn();
      eventManager.delegate('#container', 'click', '.item', handler);

      testElement.click();
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('off', () => {
    test('видаляє всі listeners для selector та event', () => {
      const handler = jest.fn();
      eventManager.on('#testBtn', 'click', handler);
      eventManager.off('#testBtn', 'click');

      testElement.click();
      expect(handler).not.toHaveBeenCalled();
    });

    test('видаляє тільки listeners для вказаної події', () => {
      const clickHandler = jest.fn();
      const mouseenterHandler = jest.fn();

      eventManager.on('#testBtn', 'click', clickHandler);
      eventManager.on('#testBtn', 'mouseenter', mouseenterHandler);
      eventManager.off('#testBtn', 'click');

      testElement.click();
      testElement.dispatchEvent(new Event('mouseenter'));

      expect(clickHandler).not.toHaveBeenCalled();
      expect(mouseenterHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy', () => {
    test('видаляє всі listeners', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventManager.on('#testBtn', 'click', handler1);
      eventManager.on('#testBtn', 'mouseenter', handler2);

      eventManager.destroy();

      testElement.click();
      testElement.dispatchEvent(new Event('mouseenter'));

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(eventManager.listeners.length).toBe(0);
    });

    test('очищає масив listeners', () => {
      eventManager.on('#testBtn', 'click', jest.fn());
      eventManager.on('#testBtn', 'mouseenter', jest.fn());

      expect(eventManager.listeners.length).toBeGreaterThan(0);
      eventManager.destroy();
      expect(eventManager.listeners.length).toBe(0);
    });
  });
});