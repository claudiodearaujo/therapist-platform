/** @type {import('ts-jest').JestConfigWithTsJest} */

const baseConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  clearMocks: true,
};

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src'],
  collectCoverageFrom: [
    'src/modules/**/*.service.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  
  // Projects for different test types
  projects: [
    {
      ...baseConfig,
      displayName: 'unit',
      rootDir: '.',
      testMatch: ['**/src/modules/**/*.spec.ts', '**/src/config/**/*.spec.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
      testPathIgnorePatterns: ['/node_modules/', '/integration/'],
      testTimeout: 10000,
    },
    {
      ...baseConfig,
      displayName: 'integration',
      rootDir: '.',
      testMatch: ['**/src/test/integration/**/*.spec.ts'],
      testTimeout: 30000, // Longer timeout for DB operations
    },
  ],
};
