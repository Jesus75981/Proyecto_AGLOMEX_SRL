module.exports = {
  preset: null,
  transform: {
    '^.+\\.(js|ts)$': 'babel-jest',
  },
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.(js|ts)',
    '**/?(*.)+(spec|test).(js|ts)'
  ],
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
};
