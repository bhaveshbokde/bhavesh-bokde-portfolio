import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/**
 * Flat config, using the configs eslint-config-next v16 exports directly.
 *
 * Not FlatCompat: the `@eslint/eslintrc` bridge chokes on this config under
 * ESLint 10 with "Converting circular structure to JSON", because the React
 * plugin object it tries to serialise refers back to itself. The native flat
 * exports have no such problem, and going through a compatibility shim to
 * reach a config that is already flat was never the right shape anyway.
 */
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },

  ...nextCoreWebVitals,
  ...nextTypeScript,

  {
    rules: {
      // Allow deliberately unused bindings when they are prefixed with an
      // underscore — the convention for "this exists to be destructured past".
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

export default eslintConfig;
