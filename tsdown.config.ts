import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  deps: {
    onlyBundle: ['@ntnyq/utils'],
  },
  dts: {
    // Use Oxc declarations with TypeScript 7, which has no classic compiler API.
    compilerOptions: {
      isolatedDeclarations: true,
    },
  },
  entry: ['src/index.ts'],
  minify: 'dce-only',
  platform: 'neutral',
})
