# beast-codec

[![CI](https://github.com/ntnyq/beast-codec/workflows/CI/badge.svg)](https://github.com/ntnyq/beast-codec/actions)
[![NPM VERSION](https://img.shields.io/npm/v/beast-codec.svg)](https://www.npmjs.com/package/beast-codec)
[![NPM DOWNLOADS](https://img.shields.io/npm/dy/beast-codec.svg)](https://www.npmjs.com/package/beast-codec)
[![LICENSE](https://img.shields.io/github/license/ntnyq/beast-codec.svg)](https://github.com/ntnyq/beast-codec/blob/main/LICENSE)

[简体中文](./README.zh-CN.md)

A beast voice codec with zero runtime dependencies. Encode text into `嗷呜啊~` and decode it back to the original text. Ships as ESM with TypeScript types for Node.js and modern browsers.

Beast encoding is reversible obfuscation for fun. It provides no cryptographic protection and should not be used to protect sensitive information.

## Install

```shell
pnpm add beast-codec
```

## Usage

```ts
import { decode, encode } from 'beast-codec'

const encoded = encode('你好')
// 呜嗷嗷嗷啊嗷嗷~啊呜~啊~呜呜嗷

decode(encoded) // '你好'
decode(encode('你好 🐺!')) // '你好 🐺!'
```

### Custom alphabet

`alphabet` accepts a string containing four distinct Unicode scalar values or a readonly tuple of four symbols. Their order maps to the digits 0, 1, 2, and 3. Encoding and decoding must use the same symbols in the same order. Single-code-point emoji are supported; multi-code-point sequences and lone surrogates are not allowed as alphabet symbols.

```ts
import { decode, encode } from 'beast-codec'
import type { BeastOptions } from 'beast-codec'

const options: BeastOptions = { alphabet: '喵呜咪~' }

decode(encode('你好', options), options) // '你好'

const emojiOptions: BeastOptions = { alphabet: ['🐺', '🦊', '🐱', '🐶'] }

decode(encode('Hello 🐺', emojiOptions), emojiOptions) // 'Hello 🐺'
```

### Framing

By default, the output is a raw payload compatible with the `beast_sdk` JavaScript implementation. Set `framed: true` to produce the original JavaScript framing format. With the default alphabet, the prefix is `~呜嗷` and the suffix is `啊`. Decoding automatically recognizes both formats.

```ts
import { decode, encode } from 'beast-codec'

const encoded = encode('你好', { framed: true })
// ~呜嗷呜嗷嗷嗷啊嗷嗷~啊呜~啊~呜呜嗷啊

decode(encoded) // '你好'

encode('') // ''
encode('', { framed: true }) // '~呜嗷啊'
decode('~呜嗷啊') // ''
```

With a custom alphabet, the prefix uses the fourth, second, and first symbols, and the suffix uses the third symbol.

## API

### `encode(input, options?)`

```ts
function encode(input: string, options?: EncodeOptions): string
```

| Option     | Type            | Default     | Description                     |
| ---------- | --------------- | ----------- | ------------------------------- |
| `alphabet` | `BeastAlphabet` | `'嗷呜啊~'` | Four distinct encoding symbols  |
| `framed`   | `boolean`       | `false`     | Add a framing prefix and suffix |

Each UTF-16 code unit is split into four hexadecimal digits, from most to least significant. A cycling offset of `0…15` is added to each digit modulo 16, then each digit is converted into two beast symbols. A raw payload therefore contains `input.length * 8` symbols, with four additional symbols when framed. Output symbols are counted as Unicode code points; JavaScript's `.length` will be larger when using an emoji alphabet.

The original text is preserved exactly, including spaces, line breaks, combining sequences, emoji, and lone surrogates. No normalization or trimming is performed.

### `decode(input, options?)`

```ts
function decode(input: string, options?: BeastOptions): string
```

Use the same `options.alphabet` as when encoding. Accepts a raw payload or a complete framed string. An empty string decodes to an empty string. Whitespace is not removed, and malformed input is not repaired.

- Non-string input or an invalid alphabet throws a `TypeError`. Passing a non-boolean `framed` option to `encode` also throws a `TypeError`.
- Unknown beast symbols, invalid framing, or a payload symbol count that is not a multiple of 8 throws a `SyntaxError`.

The alphabet is not embedded in the encoded output. Format validation cannot detect every corruption: replacing a symbol with another valid one, or decoding with the same alphabet in a different order, may produce different text without an error.

### Exported constants and types

```ts
import { DEFAULT_ALPHABET } from 'beast-codec'
import type { BeastAlphabet, BeastOptions, EncodeOptions } from 'beast-codec'

// DEFAULT_ALPHABET === '嗷呜啊~'
```

Type definitions:

```ts
type BeastAlphabet = string | readonly [string, string, string, string]

interface BeastOptions {
  alphabet?: BeastAlphabet
}

interface EncodeOptions extends BeastOptions {
  framed?: boolean
}
```

## Development

```shell
pnpm install
pnpm release:check
pnpm build
```

Run `pnpm bench` for Vitest timing and throughput benchmarks in
`tests/codec.bench.ts`. They cover encoding and decoding 64 Ki and 1 Mi UTF-16 code
units with default, emoji, and mixed-width alphabets. Fixture creation and output
validation are outside the measured operations. Results depend on the Node.js
version and machine; no timing thresholds are enforced.

Run `pnpm test:memory` to execute the large-input regression tests in a Vitest fork
worker with a 128 MiB V8 old-space heap limit. This checks that the cases finish
within that heap limit; it does not measure peak memory or limit total process RSS.

## License

[MIT](./LICENSE) License © 2026-PRESENT [ntnyq](https://github.com/ntnyq)
