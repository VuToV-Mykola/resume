class DOMCache {
  constructor() {
    this.cache = new Map();
  }

  get(id) {
    if (!this.cache.has(id)) {
      const element = document.getElementById(id);
      if (element) {
        this.cache.set(id, element);
      }
    }
    return this.cache.get(id) || null;
  }

  query(selector) {
    if (!this.cache.has(selector)) {
      const element = document.querySelector(selector);
      if (element) {
        this.cache.set(selector, element);
      }
    }
    return this.cache.get(selector) || null;
  }

  queryAll(selector) {
    if (!this.cache.has(selector)) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        this.cache.set(selector, elements);
      }
    }
    return this.cache.get(selector) || [];
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }

  has(key) {
    return this.cache.has(key);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMCache;
}