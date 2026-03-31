import nextConfig from "eslint-config-next/core-web-vitals";

export default [
  ...nextConfig,
  {
    rules: {
      'react/no-unescaped-entities': 'warn',
      '@next/next/no-img-element': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    }
  }
];