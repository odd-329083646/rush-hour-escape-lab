// Keep CommonJS initializers (including Radix/React helpers) in the same
// server module as their consumers. Split dependency chunks fail to initialize
// on hosted direct requests with `__commonJSMin is not a function`.
// This affects only the server bundle; browser route splitting is preserved.
export default {
  inlineDynamicImports: true,
};