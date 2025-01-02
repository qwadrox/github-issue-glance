/** @type {import('jest').Config} */

const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/*.test.ts'],
}; 

export default config;