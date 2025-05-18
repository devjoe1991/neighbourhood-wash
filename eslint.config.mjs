import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@next/next/no-duplicate-head": "off"
    }
  },
  {
    // Specific configuration for @typescript-eslint/no-unused-vars
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error", // or "warn" if you prefer warnings over errors
        {
          "args": "all",
          "argsIgnorePattern": "^_",       // Ignore underscore-prefixed arguments
          "varsIgnorePattern": "^_",       // Ignore underscore-prefixed variables
          "caughtErrors": "all",
          "caughtErrorsIgnorePattern": "^_" // Ignore underscore-prefixed caught errors
        }
      ]
    }
  }
];

export default eslintConfig;
