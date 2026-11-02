import { describe, expect, it } from 'vitest'
import { randomInt, weightedIndex } from '../src/lib/random'

describe('randomInt', () => {
  it('stays inside the inclusive range', () => {
    for (let i = 0; i < 10_000; i++) {
      const x = randomInt(3, 7)
      expect(x).toBeGreaterThanOrEqual(3)
      expect(x).toBeLessThanOrEqual(7)
      expect(Number.isInteger(x)).toBe(true)
    }
  })

  it('handles a single-value range', () => {
    expect(randomInt(5, 5)).toBe(5)
  })

  it('rejects bad ranges', () => {
    expect(() => randomInt(5, 4)).toThrow()
  })

  it('is roughly uniform over 100,000 draws (chi-square)', () => {
    const min = 2
    const max = 100 // 99 buckets, like the default addition range
    const k = max - min + 1
    const draws = 100_000
    const counts = new Array(k).fill(0)
    for (let i = 0; i < draws; i++) counts[randomInt(min, max) - min]++

    const expected = draws / k
    const chi2 = counts.reduce((s, c) => s + (c - expected) ** 2 / expected, 0)
    // 98 degrees of freedom: mean 98, sd ~14. The 99.9th percentile is about 148,
    // so a truly uniform source fails this roughly once in a thousand runs.
    expect(chi2).toBeLessThan(150)

    // Simple bucket check too: every bucket within 15% of expected.
    for (const c of counts) expect(Math.abs(c - expected) / expected).toBeLessThan(0.15)
  })
})

describe('weightedIndex', () => {
  it('favors heavier weights roughly in proportion', () => {
    const counts = [0, 0]
    for (let i = 0; i < 20_000; i++) counts[weightedIndex([1, 3])]++
    expect(counts[1] / 20_000).toBeGreaterThan(0.72)
    expect(counts[1] / 20_000).toBeLessThan(0.78)
  })
})
