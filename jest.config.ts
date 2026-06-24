import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/src/modules/**/__tests__/**/*.test.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  // Allow ESM modules from node_modules to be transformed by Jest
  // Without this, `next-intl` (which ships ESM) breaks Jest with "Unexpected token 'export'"
  transformIgnorePatterns: [
    'node_modules/(?!next-intl|use-intl|@radix-ui|@hookform|framer-motion|recharts|lucide-react|d3-|internmap|delaunator|robust-predicates)',
  ],
};

export default config;