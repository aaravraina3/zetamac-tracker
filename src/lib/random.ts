// Uniform random integers backed by crypto.getRandomValues.

const UINT32_RANGE = 2 ** 32

function randomUint32(): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0]
}

// Uniform integer in [min, max], inclusive.
// Plain `x % n` is biased when 2^32 is not a multiple of n, because the low
// remainders get one extra chance. We throw away draws from that leftover tail
// (rejection sampling) so every value is equally likely.
export function randomInt(min: number, max: number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
    throw new Error(`bad range ${min}..${max}`)
  }
  const n = max - min + 1
  const limit = UINT32_RANGE - (UINT32_RANGE % n) // largest multiple of n <= 2^32
  let x = randomUint32()
  while (x >= limit) x = randomUint32()
  return min + (x % n)
}

// Uniform pick from a non-empty array.
export function pick<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)]
}

// Pick an index with probability proportional to its weight.
export function weightedIndex(weights: number[]): number {
  const total = weights.reduce((s, w) => s + w, 0)
  // 1e6 steps is plenty of resolution for choosing among a handful of slices.
  let r = (randomInt(0, 999_999) / 1_000_000) * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r < 0) return i
  }
  return weights.length - 1
}
