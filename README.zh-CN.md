# beast-codec

[![CI](https://github.com/ntnyq/beast-codec/workflows/CI/badge.svg)](https://github.com/ntnyq/beast-codec/actions)
[![NPM VERSION](https://img.shields.io/npm/v/beast-codec.svg)](https://www.npmjs.com/package/beast-codec)
[![NPM DOWNLOADS](https://img.shields.io/npm/dy/beast-codec.svg)](https://www.npmjs.com/package/beast-codec)
[![LICENSE](https://img.shields.io/github/license/ntnyq/beast-codec.svg)](https://github.com/ntnyq/beast-codec/blob/main/LICENSE)

[English](./README.md)

零运行时依赖的兽音译者，将文字编码成「嗷呜啊~」，也能解码回原文。提供 ESM 和 TypeScript 类型，适用于 Node.js 和现代浏览器。

兽音是可逆的趣味编码，不提供密码学安全性，不适合保护敏感信息。

## 安装

```shell
pnpm add beast-codec
```

## 使用

```ts
import { decode, encode } from 'beast-codec'

const encoded = encode('你好')
// 呜嗷嗷嗷啊嗷嗷~啊呜~啊~呜呜嗷

decode(encoded) // '你好'
decode(encode('你好 🐺!')) // '你好 🐺!'
```

### 自定义字符

`alphabet` 接受包含四个不同 Unicode 字符的字符串，或只读四元组。顺序对应数字 0、1、2、3；编码和解码需要使用同一套字符和顺序。支持单个 emoji，不支持多个码点组成的组合字符或孤立的代理项。

```ts
import { decode, encode } from 'beast-codec'
import type { BeastOptions } from 'beast-codec'

const options: BeastOptions = { alphabet: '喵呜咪~' }

decode(encode('你好', options), options) // '你好'

const emojiOptions: BeastOptions = { alphabet: ['🐺', '🦊', '🐱', '🐶'] }

decode(encode('Hello 🐺', emojiOptions), emojiOptions) // 'Hello 🐺'
```

### 首尾标记

默认输出兼容 `beast_sdk` JavaScript 实现的裸编码。设置 `framed: true` 可生成原版 JavaScript 格式；使用默认字符时，前缀是 `~呜嗷`，后缀是 `啊`。解码自动识别两种格式。

```ts
import { decode, encode } from 'beast-codec'

const encoded = encode('你好', { framed: true })
// ~呜嗷呜嗷嗷嗷啊嗷嗷~啊呜~啊~呜呜嗷啊

decode(encoded) // '你好'

encode('') // ''
encode('', { framed: true }) // '~呜嗷啊'
decode('~呜嗷啊') // ''
```

自定义字符时，前缀使用字符表的第 4、2、1 个字符，后缀使用第 3 个字符。

## API

### `encode(input, options?)`

```ts
function encode(input: string, options?: EncodeOptions): string
```

| 选项       | 类型            | 默认值      | 说明               |
| ---------- | --------------- | ----------- | ------------------ |
| `alphabet` | `BeastAlphabet` | `'嗷呜啊~'` | 四个不同的编码字符 |
| `framed`   | `boolean`       | `false`     | 是否添加首尾标记   |

每个 UTF-16 码元按从高到低的顺序拆成四个十六进制数位，依次加上循环偏移量 `0…15` 后对 16 取模，每个数位再转成两个兽音字符。因此，裸编码的字符数为 `input.length * 8`，带标记时额外增加四个字符。这里的输出字符数按 Unicode 码点计算；emoji 字符表的 JavaScript `.length` 会更大。

完整保留原文的空格、换行、组合字符、emoji 和孤立代理项，不做规范化或裁剪。

### `decode(input, options?)`

```ts
function decode(input: string, options?: BeastOptions): string
```

`options.alphabet` 与编码时保持一致。接受裸编码或带首尾标记的完整字符串，空字符串解码为空字符串。不会自动删除空白或修复损坏的输入。

- 非字符串输入或非法字符表抛出 `TypeError`。向 `encode` 传入非布尔值的 `framed` 选项也会抛出 `TypeError`。
- 未知兽音字符、无效首尾标记、正文字符数不是 8 的倍数时抛出 `SyntaxError`。

字符表不会写入编码结果。格式检查不能识别所有损坏：替换为另一个合法字符，或使用不同顺序的相同字符表解码，可能得到不同文本而不报错。

### 导出常量与类型

```ts
import { DEFAULT_ALPHABET } from 'beast-codec'
import type { BeastAlphabet, BeastOptions, EncodeOptions } from 'beast-codec'

// DEFAULT_ALPHABET === '嗷呜啊~'
```

类型定义：

```ts
type BeastAlphabet = string | readonly [string, string, string, string]

interface BeastOptions {
  alphabet?: BeastAlphabet
}

interface EncodeOptions extends BeastOptions {
  framed?: boolean
}
```

## 开发

```shell
pnpm install
pnpm release:check
pnpm build
```

## 兼容性参考

编码格式与默认字符顺序参考 [SycAlright/beast_sdk](https://github.com/SycAlright/beast_sdk/blob/main/JavaScript/beast.js)，首尾标记参考 [sgdrg15rdg/beast_js](https://github.com/sgdrg15rdg/beast_js/blob/main/beast.js)。本包提供独立的 TypeScript 实现和严格的输入校验。

## 许可证

[MIT](./LICENSE) License © 2026-PRESENT [ntnyq](https://github.com/ntnyq)
