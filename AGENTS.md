# Repository Guidelines

## Project Structure & Module Organization

`beast-codec` is a TypeScript ESM library for reversible beast-voice encoding.

- `src/index.ts` defines the public exports; expose new APIs here.
- `src/core.ts` implements encoding and decoding; `src/utils.ts` validates inputs and alphabets.
- `src/constants.ts` holds defaults; `src/types.ts` defines public option types.
- `tests/index.test.ts` covers compatibility vectors, validation, Unicode, and public types.
- `dist/` contains generated JavaScript and declarations; do not edit or commit it.
- `.github/workflows/` contains CI and release automation.

## Build, Test, and Development Commands

Use Node.js LTS and the pnpm version declared in `package.json`.

- `pnpm install`: install dependencies and initialize Husky hooks.
- `pnpm dev`: rebuild the library as source files change.
- `pnpm build`: generate ESM output and TypeScript declarations with tsdown.
- `pnpm test`: run Vitest once; watch mode is disabled in configuration.
- `pnpm typecheck`: check types without emitting files.
- `pnpm lint`: run oxlint.
- `pnpm format` / `pnpm format:check`: apply or verify oxfmt formatting.
- `pnpm release:check`: run formatting, lint, type, and test checks before review.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, LF endings, single quotes, no semicolons, and trailing commas. oxfmt uses an 80-column print width. Follow existing camelCase function and variable names, PascalCase types, and UPPER_SNAKE_CASE constants. Keep source filenames lowercase. Use explicit return types for exported functions, separate `import type` declarations, and JSDoc for public behavior and errors.

## Testing Guidelines

Add Vitest tests under `tests/` using `*.test.ts` filenames and descriptive `describe`/`it` cases. Cover exact compatibility vectors as well as round trips, framing, custom alphabets, malformed inputs, emoji, and lone surrogates. Preserve UTF-16 code units without trimming or normalization. Use `expectTypeOf` for public type contracts. No numeric coverage threshold is configured. CI builds and tests on Linux, macOS, and Windows with Node.js 22, 24, and 26.

## Commit & Pull Request Guidelines

Existing commits use Conventional Commit prefixes, such as `feat: implement beast voice codec` and `chore: init commit`. Use concise, imperative subjects and keep changes focused. PRs should describe behavior changes, link related issues when applicable, and report validation results. Update README examples when public APIs or encoding behavior change. Husky runs nano-staged formatting and lint fixes on staged files; review those changes before committing.

## Encoding Safety

Beast encoding is reversible obfuscation and provides no cryptographic protection. Keep documentation clear about this limitation.
