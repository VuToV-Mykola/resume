/**
 * ESLint конфігурація для Resume Generator
 * @type {import('eslint').Linter.FlatConfig[]}
 */

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        FileReader: 'readonly',
        Image: 'readonly',
        HTMLElement: 'readonly',
        Event: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        CSSRule: 'readonly',
        CSSMediaRule: 'readonly',
        CSSStyleSheet: 'readonly',
        module: 'writable',
        require: 'readonly',
        fetch: 'readonly',
        AbortController: 'readonly',
        html2canvas: 'readonly',
        jsPDF: 'readonly',
        DOMParser: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        requestAnimationFrame: 'readonly',
        performance: 'readonly',
        PerformanceObserver: 'readonly',
        gtag: 'readonly',
        htmlDocx: 'readonly',
        updatePreview: 'readonly',
        showStatus: 'readonly',
        saveFormData: 'readonly'
      }
    },
    rules: {
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'indent': ['error', 2],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-undef': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'comma-dangle': ['error', 'never'],
      'arrow-spacing': 'error',
      'prefer-const': 'warn',
      'no-var': 'error'
    }
  },
  {
    files: ['**/*.config.js', 'server.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        process: 'readonly'
      }
    }
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'html-docx.js'
    ]
  }
];