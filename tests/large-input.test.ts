import { describe, expect, it } from 'vitest'
import { decode, encode } from '../src'
import type { BeastAlphabet } from '../src'

// Four code units complete one offset cycle, so this wire vector can repeat.
const BLOCK_TEXT = 'abcd'
const BLOCK_BEAST =
  '嗷嗷嗷呜啊嗷呜嗷呜嗷呜呜~嗷啊呜啊嗷啊呜嗷嗷~啊~嗷~呜呜嗷嗷~'

describe('large inputs', () => {
  it.each([false, true])(
    'preserves a 1 MiB compatibility vector with framed=%s',
    framed => {
      const input = BLOCK_TEXT.repeat(262_144)
      const payload = BLOCK_BEAST.repeat(262_144)
      const expected = framed ? `~呜嗷${payload}啊` : payload

      expect(encode(input, { framed })).toBe(expected)
      expect(decode(expected)).toBe(input)
    },
  )

  it.each<BeastAlphabet>(['🐺🦊🐱🐶', ['嗷', '🐺', '~', '🦊']])(
    'preserves large Unicode input with alphabet case %#',
    alphabet => {
      const input = '你好 🐺!\u0000e\u0301\uD800x\uDFFF\n'.repeat(16_384)

      for (const framed of [false, true]) {
        expect(decode(encode(input, { alphabet, framed }), { alphabet })).toBe(
          input,
        )
      }
    },
  )

  it.each([1023, 1024, 1025, 4095, 4096, 4097])(
    'preserves a surrogate pair across a boundary after %i code units',
    length => {
      const input = `${'a'.repeat(length)}🐺\uD800x\uDFFF`

      expect(decode(encode(input, { framed: true }))).toBe(input)
    },
  )

  it('rejects an unknown symbol at the end of a large payload', () => {
    const payload = BLOCK_BEAST.repeat(32_768)

    expect(() => decode(`${payload.slice(0, -1)}!`)).toThrow(
      new SyntaxError(`Unknown beast symbol at position ${payload.length - 1}`),
    )
  })

  it('rejects truncated framing with a large mixed-width payload', () => {
    const alphabet = '嗷🐺~🦊'
    const encoded = encode(BLOCK_TEXT.repeat(32_768), {
      alphabet,
      framed: true,
    })

    expect(() => decode(encoded.slice(0, -1), { alphabet })).toThrow(
      SyntaxError,
    )
  })

  it.each([
    { alphabet: '🐺🦊🐱🐶', suffix: '🐱' },
    { alphabet: '嗷🐺~🦊', suffix: '~' },
  ])(
    'reports code-point positions with alphabet $alphabet',
    ({ alphabet, suffix }) => {
      const input = BLOCK_TEXT.repeat(4096)
      const encoded = encode(input, { alphabet, framed: true })
      const corrupted =
        encoded.slice(0, -suffix.length).replace(/.$/u, '!') + suffix

      expect(() => decode(corrupted, { alphabet })).toThrow(
        new SyntaxError(
          `Unknown beast symbol at position ${input.length * 8 - 1}`,
        ),
      )
    },
  )
})
