// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier');

// spartan-ng generates src/app/shared/ui/** in its own style (see components.json). Re-running
// `ng g @spartan-ng/cli:ui` regenerates it the same way regardless of our rules, and its code
// doesn't follow our Angular/stylistic conventions (own "hlm" prefix, `type` over `interface`,
// aliased inputs, etc.) - so it's excluded from those layers below and only linted for
// straightforward correctness issues.
const vendoredUiPath = 'src/app/shared/ui/**';

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    ignores: [vendoredUiPath],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
      prettier,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    ignores: [vendoredUiPath],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
  {
    files: ['src/app/shared/ui/**/*.ts'],
    extends: [eslint.configs.recommended, tseslint.configs.recommended, prettier],
  },
]);
