/**
 * Jest конфігурація для unit тестів
 */

module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/__tests__'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/main.js',
    '!**/node_modules/**',
    '!**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  moduleFileExtensions: ['js', 'json'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  verbose: true
};