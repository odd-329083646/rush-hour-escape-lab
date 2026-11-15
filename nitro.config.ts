// Bundle the hosted server into a single module.
// Split dependency chunks (`_libs/*`) form import cycles with app chunks, so
// shared CommonJS helpers are still undefined when React/Radix initialize
// (`__commonJSMin is not a function`) and every hosted request returns 500.
// Nitro merges `rolldownConfig` with highest priority; `output.inlineDynamicImports`
// is what makes Nitro switch Rolldown to `codeSplitting: false` (a direct
// `codeSplitting: false` loses to Nitro's own default groups during merging).
// This affects only the server bundle; browser route splitting is preserved.
export default {
  inlineDynamicImports: true,
  rolldownConfig: {
    output: { inlineDynamicImports: true },
  },
};
