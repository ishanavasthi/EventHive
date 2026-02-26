const globals = require('globals');
const pluginJs = require('@eslint/js');

module.exports = [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs", 
      globals: {
        ...globals.node,      // Enable Node.js global variables (process, require, etc.)
        ...globals.jest       // Enable Jest global variables (describe, test, expect)
      }
    },
    rules: {
      "no-unused-vars": "warn", // Warn about variables that are declared but not used
      "no-console": "off"       
    }
  },
  pluginJs.configs.recommended,
];