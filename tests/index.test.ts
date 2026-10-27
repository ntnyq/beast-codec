import { describe, expect, expectTypeOf, it } from 'vitest'
import { decode, DEFAULT_ALPHABET, encode } from '../src'
import type { BeastAlphabet, BeastOptions, EncodeOptions } from '../src'

const HELLO_BEAST = '呜嗷嗷嗷啊嗷嗷~啊呜~啊~呜呜嗷'

describe('encoding', () => {
  it.each([
    ['', ''],
    ['\u0000', '嗷嗷嗷呜嗷啊嗷~'],
    ['A', '嗷嗷嗷呜呜啊呜嗷'],
    ['你好', HELLO_BEAST],
    [
      'abcde',
      '嗷嗷嗷呜啊嗷呜嗷呜嗷呜呜~嗷啊呜啊嗷啊呜嗷嗷~啊~嗷~呜呜嗷嗷~嗷嗷嗷呜啊嗷啊嗷',
    ],
  ])('encodes the compatibility vector %j', (input, encoded) => {
    expect(encode(input)).toBe(encoded)
  })

  it('uses the SDK alphabet by default', () => {
    expect(DEFAULT_ALPHABET).toBe('嗷呜啊~')
    expect(encode('你好', { framed: false })).toBe(HELLO_BEAST)
  })

  it('supports the original JavaScript framing', () => {
    expect(encode('你好', { framed: true })).toBe(`~呜嗷${HELLO_BEAST}啊`)
    expect(encode('', { framed: true })).toBe('~呜嗷啊')
  })

  it('rejects non-string input', () => {
    // @ts-expect-error JavaScript consumers can pass non-string input.
    expect(() => encode(123)).toThrow(TypeError)
  })

  it('rejects a non-boolean framing option', () => {
    // @ts-expect-error JavaScript consumers can pass invalid options.
    expect(() => encode('hello', { framed: 'yes' })).toThrow(TypeError)
  })
})

describe('decoding', () => {
  it('decodes the SDK compatibility vector', () => {
    expect(decode(HELLO_BEAST)).toBe('你好')
  })

  it('automatically recognizes the original JavaScript framing', () => {
    expect(decode(`~呜嗷${HELLO_BEAST}啊`)).toBe('你好')
  })

  it.each(['', '~呜嗷啊'])('decodes the empty payload %j', encoded => {
    expect(decode(encoded)).toBe('')
  })

  it.each([
    '嗷',
    '嗷呜',
    '嗷'.repeat(7),
    '嗷'.repeat(9),
    'abcdefgh',
    `!${HELLO_BEAST.slice(1)}`,
    `~嗷呜${HELLO_BEAST}啊`,
    `~呜嗷${HELLO_BEAST}嗷`,
    `~呜嗷${HELLO_BEAST.slice(1)}啊`,
    `~呜嗷${'!'.repeat(8)}啊`,
    ` ${HELLO_BEAST} `,
  ])('rejects malformed payload %j', encoded => {
    expect(() => decode(encoded)).toThrow(SyntaxError)
  })

  it('rejects non-string input', () => {
    // @ts-expect-error JavaScript consumers can pass non-string input.
    expect(() => decode(null)).toThrow(TypeError)
  })
})

describe('round trips', () => {
  it.each([
    '你好，世界！',
    'Hello, beast! 0123456789',
    '嗷呜啊~',
    ' \t\n\r\n ',
    '\u0000\u0001\u000F\u0010\u00FF\u0100\uFFFF',
    '🦊🐺👩🏽‍💻𠮷',
    'e\u0301 café Ελληνικά العربية 日本語',
    '\uD800 lone high surrogate',
    '\uDFFF lone low surrogate',
    '你好 🐺!\n'.repeat(1000),
  ])('preserves text case %#', input => {
    expect(decode(encode(input))).toBe(input)
    expect(decode(encode(input, { framed: true }))).toBe(input)
    expect([...encode(input)]).toHaveLength(input.length * 8)
  })

  it('preserves every UTF-16 code unit across offset wraparound', () => {
    const input = Array.from({ length: 65_536 }, (_, index) =>
      String.fromCodePoint(index),
    ).join('')

    expect(decode(encode(input))).toBe(input)
  })
})

describe('custom alphabets', () => {
  it('uses the configured digit order', () => {
    expect(encode('\u0000', { alphabet: 'abcd' })).toBe('aaabacad')
    expect(decode('aaabacad', { alphabet: 'abcd' })).toBe('\u0000')
    expect(encode('', { alphabet: 'abcd', framed: true })).toBe('dbac')
  })

  it.each<BeastAlphabet>([
    'abcd',
    ['喵', '呜', '咪', '~'],
    '🐺🦊🐱🐶',
    ['🐺', '🦊', '🐱', '🐶'],
  ])('supports alphabet case %#', alphabet => {
    const input = '你好 🐺!'
    const options = { alphabet }

    expect(decode(encode(input, options), options)).toBe(input)
    expect(decode(encode(input, { ...options, framed: true }), options)).toBe(
      input,
    )
    expect([...encode(input, options)]).toHaveLength(input.length * 8)
    expect([...encode(input, { ...options, framed: true })]).toHaveLength(
      input.length * 8 + 4,
    )
  })

  it.each(['', 'abc', 'abcde', 'aabc', '🐺🐺🐱🐶'])(
    'rejects invalid alphabet %j',
    alphabet => {
      expect(() => encode('', { alphabet })).toThrow(TypeError)
      expect(() => decode('', { alphabet })).toThrow(TypeError)
    },
  )

  it('rejects array entries containing multiple code points', () => {
    const alphabet: BeastAlphabet = ['ab', 'c', 'd', 'e']

    expect(() => encode('test', { alphabet })).toThrow(TypeError)
    expect(() => decode('', { alphabet })).toThrow(TypeError)
  })

  it('rejects non-string alphabet entries', () => {
    // @ts-expect-error JavaScript consumers can pass invalid alphabet entries.
    expect(() => encode('test', { alphabet: [0, 1, 2, 3] })).toThrow(TypeError)
  })

  it('rejects surrogate symbols that could merge when concatenated', () => {
    const alphabet: BeastAlphabet = ['\uD800', '\uDC00', 'a', 'b']

    expect(() => encode('test', { alphabet })).toThrow(TypeError)
    expect(() => decode('', { alphabet })).toThrow(TypeError)
  })

  it('rejects a non-string, non-array alphabet', () => {
    // @ts-expect-error JavaScript consumers can pass invalid alphabets.
    expect(() => decode('', { alphabet: null })).toThrow(TypeError)
  })

  it('rejects arrays with the wrong number of symbols', () => {
    // @ts-expect-error Exactly four array entries are required.
    expect(() => encode('', { alphabet: ['a', 'b', 'c'] })).toThrow(TypeError)
  })

  it('accepts readonly tuples without mutating them', () => {
    const alphabet = Object.freeze(['a', 'b', 'c', 'd'] as const)

    expect(decode(encode('你好', { alphabet }), { alphabet })).toBe('你好')
    expect(alphabet).toStrictEqual(['a', 'b', 'c', 'd'])
  })
})

it('exposes the public TypeScript contract', () => {
  expectTypeOf(encode).returns.toBeString()
  expectTypeOf(decode).returns.toBeString()
  expectTypeOf<EncodeOptions>().toExtend<BeastOptions>()
  expectTypeOf<readonly ['a', 'b', 'c', 'd']>().toExtend<BeastAlphabet>()
})
