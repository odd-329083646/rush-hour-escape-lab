import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // נעילת שכבת ה-Domain/Business Logic (אסור לייבא משכבת הנתונים או התצוגה)
  {
    files: ["src/engine/**/*.ts"],
    ignores: ["src/engine/**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/services/*",
                "@/hooks/*",
                "@/components/*",
                "@/routes/*",
                "@/integrations/*",
              ],
              message:
                "Layer violation: src/engine must stay pure and cannot import from services, hooks, UI, or integrations.",
            },
          ],
        },
      ],
    },
  },
  // נעילת שכבת ה-Presentation (אסור לגשת ישירות ל-storageService או ל-Supabase מתוך UI/Routes)
  {
    files: ["src/components/**/*.{ts,tsx}", "src/routes/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/services/storageService",
              message:
                "Layer violation: UI/Routes must access storage through hooks or repositories, not storageService directly.",
            },
          ],
          patterns: [
            {
              group: ["@/integrations/supabase/*"],
              message: "Layer violation: UI/Routes cannot access Supabase directly.",
            },
          ],
        },
      ],
    },
  },
  eslintPluginPrettier,
);
