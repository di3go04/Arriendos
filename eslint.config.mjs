import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn"
    }
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "prefer-const": "warn"
    }
  },
  // Allow CommonJS require() in config files and scripts (legitimate use case)
  // Without this, postcss.config.mjs / tailwind.config.ts / scripts/*.mjs throw 15 false-positive errors
  {
    files: ["*.mjs", "*.cjs", "*.config.{ts,js,mjs,cjs}", "scripts/**/*.{mjs,js,cjs}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".temp-gh-pages/**",
    ".kilocode/**",
    ".kilo/**",
    ".cursor/**",
    ".claude/**",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
