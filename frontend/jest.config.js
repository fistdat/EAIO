module.exports = {
  // Base directory for Jest to look for tests
  roots: ['<rootDir>/src'],
  
  // File extensions to consider as test files
  testMatch: [
    '**/__tests__/**/*.js?(x)',
    '**/?(*.)+(spec|test).js?(x)',
    '**/__tests__/**/*.ts?(x)',
    '**/?(*.)+(spec|test).ts?(x)'
  ],
  
  // Files or directories to be skipped
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  
  // Environment for the tests to run in
  testEnvironment: 'jsdom',
  
  // Transformations for test files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'] }],
    '^.+\\.css$': 'jest-transform-css',
    '^.+\\.svg$': 'jest-transform-stub'
  },
  
  // Directories that Jest should search for modules
  moduleDirectories: ['node_modules', 'src'],
  
  // Map file extensions to their respective handlers
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  
  // Mocking static assets
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/tests/mocks/fileMock.js'
  },
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.{js,jsx,ts,tsx}',
    '!src/reportWebVitals.{js,jsx,ts,tsx}',
    '!src/serviceWorker.{js,jsx,ts,tsx}',
    '!src/setupTests.{js,jsx,ts,tsx}',
    '!src/mocks/**',
    '!src/tests/**'
  ],
  
  // Coverage directory and thresholds
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Timeout for the tests (in milliseconds)
  testTimeout: 10000,
  
  // Other options
  verbose: true,
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false
} 