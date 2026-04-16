import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config([
  { ignores: ['dist/**', 'node_modules/**', 'frontend/*.config.js'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // React rules only for frontend source files
  {
    files: ['frontend/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      // Downgraded: setState in useEffect is intentional in several places
      // (resetting form state on prop change, cleaning stale tabs, etc.)
      'react-hooks/set-state-in-effect': 'warn',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  prettierConfig,
]);
