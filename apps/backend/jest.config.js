/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  forceExit: true,
  clearMocks: true,
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^uuid$': '<rootDir>/src/__mocks__/uuid.ts',
  },
  setupFiles: ['<rootDir>/src/test-setup.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
};
