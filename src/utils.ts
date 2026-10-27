import { isString, isArray, isUndefined } from '@ntnyq/utils'
import { DEFAULT_ALPHABET, ALPHABETA_LENGTH_LIMIT } from './constants'
import type { BeastAlphabet } from './types'

/**
 * Validates that an encoder or decoder input is a string at runtime.
 *
 * @param input - The input value to validate.
 * @returns Nothing when the input is valid.
 * @throws TypeError if the input is not a string.
 */
export function assertString(input: string): void {
  if (!isString(input)) {
    throw new TypeError('The input must be a string')
  }
}

/**
 * Resolves and validates a beast alphabet without mutating the supplied value.
 * Each symbol must be a single Unicode scalar value, excluding lone surrogates.
 *
 * @param alphabet - Four distinct symbols as a string or readonly tuple.
 * Defaults to {@link DEFAULT_ALPHABET} when omitted or undefined.
 * @returns A new tuple of four validated symbols, ordered from digit zero to three.
 * @throws TypeError if the alphabet is not a string or array, does not contain
 * exactly four distinct symbols, or contains an invalid Unicode scalar value.
 */
export function resolveAlphabet(
  alphabet: BeastAlphabet = DEFAULT_ALPHABET,
): readonly [string, string, string, string] {
  if (!isString(alphabet) && !isArray(alphabet)) {
    throw new TypeError(
      'The alphabet must be a string or an array of four symbols',
    )
  }

  const symbols: string[] = [...alphabet]
  const [zero, one, two, three] = symbols

  if (
    symbols.length !== ALPHABETA_LENGTH_LIMIT ||
    isUndefined(zero) ||
    isUndefined(one) ||
    isUndefined(two) ||
    isUndefined(three) ||
    symbols.some(
      symbol =>
        !isString(symbol) ||
        [...symbol].length !== 1 ||
        /^[\uD800-\uDFFF]$/u.test(symbol),
    ) ||
    new Set(symbols).size !== ALPHABETA_LENGTH_LIMIT
  ) {
    throw new TypeError(
      'The alphabet must contain exactly four distinct Unicode scalar values',
    )
  }

  return [zero, one, two, three]
}
