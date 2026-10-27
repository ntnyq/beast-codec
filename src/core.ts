import { isBoolean, isUndefined } from '@ntnyq/utils'
import type { BeastOptions, EncodeOptions } from './types'
import { assertString, resolveAlphabet } from './utils'

// Bound temporary buffers and spread arguments independently of input size.
const CHUNK_SIZE = 4096

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

  const pairs = alphabet.flatMap(high => alphabet.map(low => high + low))
  const chunks: string[] = []
  const buffer: string[] = []
  let bufferIndex = 0
  let offset = 0

  // Iterate code units so surrogate pairs and lone surrogates remain lossless.
  for (let index = 0; index < input.length; index++) {
    // oxlint-disable-next-line unicorn/prefer-code-point -- The wire format uses UTF-16 code units.
    const codeUnit = input.charCodeAt(index)

    for (let divisor = 4096; divisor >= 1; divisor /= 16) {
      const digit = ((Math.floor(codeUnit / divisor) % 16) + offset) % 16
      // oxlint-disable-next-line typescript/no-non-null-assertion -- Modulo 16 indexes the sixteen alphabet pairs.
      buffer[bufferIndex++] = pairs[digit]!
      offset = (offset + 1) % 16

      if (bufferIndex === CHUNK_SIZE) {
        chunks.push(buffer.join(''))
        bufferIndex = 0
      }
    }
  }

  if (bufferIndex > 0) {
    buffer.length = bufferIndex
    chunks.push(buffer.join(''))
  }

  const encoded = chunks.join('')

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

  let symbolCount = 0

  // Count code points without retaining an array, including mixed-width alphabets.
  const iterator = input[Symbol.iterator]()

  while (!iterator.next().done) {
    symbolCount++
  }

  let payload = input

  if (symbolCount % 8 === 4) {
    const [zero, one, two, three] = alphabet
    const prefix = `${three}${one}${zero}`

    if (!input.startsWith(prefix) || !input.endsWith(two)) {
      throw new SyntaxError('Invalid beast framing')
    }

    payload = input.slice(prefix.length, -two.length)
    symbolCount -= 4
  }

  if (symbolCount % 8 !== 0) {
    throw new SyntaxError(
      'A beast payload must contain a multiple of 8 symbols',
    )
  }

  const chunks: string[] = []
  const buffer: number[] = []

  let bufferIndex = 0
  let pair = 0
  let codeUnit = 0
  let index = 0

  for (const symbol of payload) {
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
      buffer[bufferIndex++] = codeUnit
      codeUnit = 0

      if (bufferIndex === CHUNK_SIZE) {
        chunks.push(String.fromCodePoint(...buffer))
        bufferIndex = 0
      }
    }

    index++
  }

  if (bufferIndex > 0) {
    buffer.length = bufferIndex
    chunks.push(String.fromCodePoint(...buffer))
  }

  return chunks.join('')
}
