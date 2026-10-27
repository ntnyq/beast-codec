/**
 * Four distinct Unicode scalar values, ordered from digit zero to digit three.
 */
export type BeastAlphabet = string | readonly [string, string, string, string]

/**
 * Shared alphabet configuration for beast encoding and decoding.
 */
export interface BeastOptions {
  /**
   * Four distinct symbols.
   *
   * @default `嗷呜啊~`
   */
  alphabet?: BeastAlphabet
}

/**
 * Alphabet and optional framing configuration for beast encoding.
 */
export interface EncodeOptions extends BeastOptions {
  /**
   * Wrap the payload with alphabet positions 3, 1, 0 and a trailing position 2.
   *
   * @default false
   */
  framed?: boolean
}
