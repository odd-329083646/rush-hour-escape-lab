// Keep CommonJS initializers (including Radix/React helpers) in the same
// server module as their consumers. Split dependency chunks fail to initialize
// on hosted direct requests with `__commonJSMin is not a function`.
// This affects only the server bundle; browser route splitting is preserved.
export default {
  inlineDynamicImports: true,
  // Explicitly disable Vite 8/Rolldown dependency groups as well as lazy imports.
  // Some hosted build overrides otherwise retain the failing `_libs` chunks.
  rolldownConfig: {
    output: { codeSplitting: false },
  },
};