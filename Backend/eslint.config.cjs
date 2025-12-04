// eslint.config.cjs
module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
    },
    plugins: {
      import: require('eslint-plugin-import'),
      node: require('eslint-plugin-node'),
      promise: require('eslint-plugin-promise'),
      prettier: require('eslint-plugin-prettier'),
    },
    rules: {
      'no-console': 'error',
      'no-unused-vars': 'warn',
      'prettier/prettier': 'error',
      'node/no-unsupported-features/es-syntax': 'off',
    },
    // you can add settings/extending behavior here if needed
  },
];
