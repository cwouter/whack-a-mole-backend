/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      { tsconfig: './tsconfig.jest.json', useESM: true }
    ],
  },
  moduleNameMapper: {
    // Allow TS NodeNext-style imports that include .js in source
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  roots: ['<rootDir>/src'],
  testRegex: '.*\\.test\\.ts$',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
};
