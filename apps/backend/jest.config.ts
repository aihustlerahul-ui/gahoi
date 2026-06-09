import type { Config } from 'jest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
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

export default config;
