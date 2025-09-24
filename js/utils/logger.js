const IS_DEVELOPMENT = window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.port === '8000';

const logger = {
  log(...args) {
    if (IS_DEVELOPMENT) {
      console.log(...args);
    }
  },

  error(...args) {
    console.error(...args);
  },

  warn(...args) {
    if (IS_DEVELOPMENT) {
      console.warn(...args);
    }
  },

  info(...args) {
    if (IS_DEVELOPMENT) {
      console.info(...args);
    }
  },

  debug(...args) {
    if (IS_DEVELOPMENT) {
      console.debug(...args);
    }
  },

  group(label) {
    if (IS_DEVELOPMENT) {
      console.group(label);
    }
  },

  groupEnd() {
    if (IS_DEVELOPMENT) {
      console.groupEnd();
    }
  },

  table(data) {
    if (IS_DEVELOPMENT) {
      console.table(data);
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = logger;
}