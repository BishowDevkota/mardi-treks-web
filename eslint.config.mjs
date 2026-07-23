import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Additional ignores:
    "node_modules/**",
    ".next/dev/**",
    "app/(payload)/**",
    "globals/**",
    "public/**",
    "scripts/**",
  ]),
  {
    rules: {
      // Allow `any` in server actions where FormData access requires it
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
