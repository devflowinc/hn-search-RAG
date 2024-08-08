import globals from "globals";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import ts from "typescript-eslint";
import solid from "eslint-plugin-solid/configs/typescript.js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";

export default [
  {
    files: ["src/**/*.{js,mjs,cjs,ts}"],
  },
  {
    ignores: [
      "node_modules",
      "dist",
      "tailwind.config.js",
      "prettier.config.cjs",
      "prettier-config.mjs",
      "vite.config.ts",
      "postcss.config.js",
    ],
  },
  { languageOptions: { globals: globals.browser } },
  js.configs.recommended,
  ...ts.configs.recommended,
  solid,
  eslintConfigPrettier,
  eslintPluginPrettier,
  {"rules": {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "args": "all",
        "argsIgnorePattern": "^_",
        "caughtErrors": "all",
        "caughtErrorsIgnorePattern": "^_",
        "destructuredArrayIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }
    ]
  }}
];
