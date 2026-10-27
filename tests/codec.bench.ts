import { describe, expect, test } from 'vitest'
import { decode, encode } from '../src'

// Cache exports outside the measured functions to avoid module getter overhead.
const codec = { decode, encode }

describe.each([
  { name: 'default', alphabet: '嗷呜啊~' },
  { name: 'emoji', alphabet: '🐺🦊🐱🐶' },
  { name: 'mixed', alphabet: '嗷🐺~🦊' },
])('$name alphabet', ({ alphabet }) => {
  test.for([65_536, 1_048_576])(
    '%i UTF-16 code units',
    { timeout: 30_000 },
    async (size, { bench }) => {
      // Four code units complete the offset cycle, including a lone surrogate.
      const block = 'A🐺\uD800'
      const options = { alphabet }
      const input = block.repeat(size / block.length)
      const payload = codec.encode(block, options).repeat(size / block.length)
      const benchmarkOptions = {
        iterations: 3,
        time: 500,
        warmupIterations: 1,
        warmupTime: 100,
      }
      let output = ''

      await bench('encode', () => {
        output = codec.encode(input, options)
      }).run(benchmarkOptions)
      expect(output).toBe(payload)

      await bench('decode', () => {
        output = codec.decode(payload, options)
      }).run(benchmarkOptions)
      expect(output).toBe(input)
    },
  )
})
