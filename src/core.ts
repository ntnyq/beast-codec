import { isBoolean, isUndefined } from '@ntnyq/utils'
import type { BeastOptions, EncodeOptions } from './types'
import { assertString, resolveAlphabet } from './utils'

/**
 * Encodes each UTF-16 code unit as eight beast symbols.
 *
 * @param input - Plain text to encode, preserved as UTF-16 code units.
 * @param options - Alphabet and framing configuration.
 * @returns The encoded beast string.
 * @throws TypeError for invalid input or options.
 */
export function encode(input: string, options: EncodeOptions = {}): string {
  assertString(input)
  const alphabet = resolveAlphabet(options.alphabet)

  if (!isUndefined(options.framed) && !isBoolean(options.framed)) {
    throw new TypeError('The framed option must be a boolean')
  }

  let encoded = ''
  let offset = 0

  // Iterate code units so surrogate pairs and lone surrogates remain lossless.
  for (let index = 0; index < input.length; index++) {
    // oxlint-disable-next-line unicorn/prefer-code-point -- The wire format uses UTF-16 code units.
    const codeUnit = input.charCodeAt(index)

    for (let divisor = 4096; divisor >= 1; divisor /= 16) {
      const digit = ((Math.floor(codeUnit / divisor) % 16) + offset) % 16
      encoded += alphabet[Math.floor(digit / 4)]
      encoded += alphabet[digit % 4]
      offset = (offset + 1) % 16
    }
  }

  if (options.framed) {
    const [zero, one, two, three] = alphabet
    return `${three}${one}${zero}${encoded}${two}`
  }

  return encoded
}

/**
 * Decodes raw SDK payloads and framed beast strings using the same alphabet.
 *
 * @param input - A raw or framed beast string.
 * @param options - The alphabet used to encode the input.
 * @returns The original text.
 * @throws TypeError for invalid arguments.
 * @throws SyntaxError for malformed payloads.
 */
export function decode(input: string, options: BeastOptions = {}): string {
  assertString(input)

  const alphabet = resolveAlphabet(options.alphabet)

  let symbols = [...input]

  if (symbols.length % 8 === 4) {
    const [zero, one, two, three] = alphabet

    if (
      symbols[0] !== three ||
      symbols[1] !== one ||
      symbols[2] !== zero ||
      symbols.at(-1) !== two
    ) {
      throw new SyntaxError('Invalid beast framing')
    }

    symbols = symbols.slice(3, -1)
  }

  if (symbols.length % 8 !== 0) {
    throw new SyntaxError(
      'A beast payload must contain a multiple of 8 symbols',
    )
  }

  let decoded = ''
  let pair = 0
  let codeUnit = 0
  let index = 0

  for (const symbol of symbols) {
    const digit = alphabet.indexOf(symbol)

    if (digit === -1) {
      throw new SyntaxError(`Unknown beast symbol at position ${index}`)
    }

    pair = pair * 4 + digit

    if (index % 2 === 1) {
      const offset = Math.floor(index / 2) % 16
      codeUnit = codeUnit * 16 + ((pair - offset + 16) % 16)
      pair = 0
    }

    if (index % 8 === 7) {
      decoded += String.fromCodePoint(codeUnit)
      codeUnit = 0
    }

    index++
  }

  return decoded
}
