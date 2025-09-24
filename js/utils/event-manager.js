class EventManager {
  constructor() {
    this.listeners = [];
  }

  on(selector, event, handler, options = {}) {
    const element = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    if (element) {
      element.addEventListener(event, handler, options);
      this.listeners.push({ element, event, handler, options });
    }
  }

  onAll(selector, event, handler, options = {}) {
    const elements = typeof selector === 'string'
      ? document.querySelectorAll(selector)
      : selector;

    elements.forEach(element => {
      element.addEventListener(event, handler, options);
      this.listeners.push({ element, event, handler, options });
    });
  }

  delegate(parentSelector, event, childSelector, handler) {
    const parent = typeof parentSelector === 'string'
      ? document.querySelector(parentSelector)
      : parentSelector;

    if (parent) {
      const delegateHandler = (e) => {
        const target = e.target.closest(childSelector);
        if (target) {
          handler.call(target, e);
        }
      };

      parent.addEventListener(event, delegateHandler);
      this.listeners.push({
        element: parent,
        event,
        handler: delegateHandler
      });
    }
  }

  off(selector, event) {
    const element = typeof selector === 'string'
      ? document.querySelector(selector)
      : selector;

    this.listeners = this.listeners.filter(listener => {
      if (listener.element === element && listener.event === event) {
        listener.element.removeEventListener(listener.event, listener.handler, listener.options);
        return false;
      }
      return true;
    });
  }

  destroy() {
    this.listeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.listeners = [];
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventManager;
}