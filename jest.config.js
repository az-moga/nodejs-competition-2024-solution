/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageReporters: ['json'],
  coverageDirectory: './reports',
  detectOpenHandles: true,
  collectCoverage: true,
  json: true,
};