/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/*.(test|spec).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/'],
  clearMocks: true,
};
