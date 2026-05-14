/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/prisma/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};
