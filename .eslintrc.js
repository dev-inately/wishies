module.exports = {
    extends: [
      'eslint:recommended',
      'airbnb-base',
      'mocha',
    ],
    parserOptions: {
      sourceType: 'module',
      ecmaVersion: 2020,
    },
    env: {
      node: true,
    },
    rules: {
      'no-underscore-dangle': 0,
      'linebreak-style': 0,
      'func-names': 0,
    },
  };
  