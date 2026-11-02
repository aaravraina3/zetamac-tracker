import { describe, expect, it } from 'vitest'
import { generateForOp, generateProblem, sameProblem, settingsKey, validateSettings } from '../src/generator/problems'
import { countBorrows, countCarries, tagProblem } from '../src/generator/tags'
import { generateDrillProblem } from '../src/generator/practice'
import { DEFAULT_SETTINGS, type GameSettings, type Problem } from '../src/types'

const S = DEFAULT_SETTINGS
const N = 20_000
const only = (ops: Partial<Record<'add' | 'sub' | 'mul' | 'div', boolean>>): GameSettings => ({
  ...S,
  add: { ...S.add, enabled: !!ops.add },
  sub: { enabled: !!ops.sub },
  mul: { ...S.mul, enabled: !!ops.mul },
  div: { enabled: !!ops.div },
})

describe('generator', () => {
  it('addition stays in range and answer is the sum', () => {
    for (let i = 0; i < N; i++) {
      const p = generateForOp('add', S)
      expect(p.left).toBeGreaterThanOrEqual(2)
      expect(p.left).toBeLessThanOrEqual(100)
      expect(p.right).toBeGreaterThanOrEqual(2)
      expect(p.right).toBeLessThanOrEqual(100)
      expect(p.answer).toBe(p.left + p.right)
    }
  })

  it('subtraction is addition in reverse and never negative', () => {
    for (let i = 0; i < N; i++) {
      const p = generateForOp('sub', S)
      expect(p.answer).toBe(p.left - p.right)
      expect(p.answer).toBeGreaterThanOrEqual(2)
      expect(p.answer).toBeLessThanOrEqual(100)
      expect(p.right).toBeGreaterThanOrEqual(2)
      expect(p.right).toBeLessThanOrEqual(100)
    }
  })

  it('multiplication uses the right ranges', () => {
    for (let i = 0; i < N; i++) {
      const p = generateForOp('mul', S)
      expect(p.left).toBeGreaterThanOrEqual(2)
      expect(p.left).toBeLessThanOrEqual(12)
      expect(p.right).toBeGreaterThanOrEqual(2)
      expect(p.right).toBeLessThanOrEqual(100)
      expect(p.answer).toBe(p.left * p.right)
    }
  })

  it('division is always whole', () => {
    for (let i = 0; i < N; i++) {
      const p = generateForOp('div', S)
      expect(Number.isInteger(p.answer)).toBe(true)
      expect(p.left % p.right).toBe(0)
      expect(p.left / p.right).toBe(p.answer)
      expect(p.right).toBeGreaterThanOrEqual(2)
      expect(p.right).toBeLessThanOrEqual(12)
    }
  })

  it('only uses enabled operations, roughly evenly', () => {
    const counts: Record<string, number> = {}
    let prev: Problem | null = null
    for (let i = 0; i < N; i++) {
      prev = generateProblem(only({ sub: true, div: true }), prev)
      counts[prev.op] = (counts[prev.op] ?? 0) + 1
    }
    expect(Object.keys(counts).sort()).toEqual(['div', 'sub'])
    expect(counts.sub / N).toBeGreaterThan(0.47)
    expect(counts.sub / N).toBeLessThan(0.53)
  })

  it('never shows the same problem twice in a row', () => {
    // tiny ranges make repeats very likely if the guard is broken
    const s: GameSettings = { ...only({ add: true }), add: { enabled: true, left: { min: 2, max: 3 }, right: { min: 2, max: 3 } } }
    let prev: Problem | null = null
    for (let i = 0; i < 5000; i++) {
      const p = generateProblem(s, prev)
      expect(sameProblem(prev, p)).toBe(false)
      prev = p
    }
  })

  it('validates settings', () => {
    expect(validateSettings(S)).toBeNull()
    expect(validateSettings(only({}))).toMatch(/at least one/)
    expect(validateSettings({ ...S, add: { ...S.add, left: { min: 50, max: 10 } } })).toMatch(/min above max/)
  })

  it('builds a readable settings key', () => {
    expect(settingsKey(S)).toBe('+ − × ÷ | 2-100,2-100 | 2-12,2-100 | 120s')
  })
})

describe('carry and borrow detection', () => {
  it('counts carries', () => {
    expect(countCarries(12, 34)).toBe(0)
    expect(countCarries(18, 5)).toBe(1)
    expect(countCarries(95, 7)).toBe(2) // 5+7 carries, then 9+0+1 carries
    expect(countCarries(99, 99)).toBe(2)
    expect(countCarries(50, 50)).toBe(1)
    expect(countCarries(999, 1)).toBe(3)
  })

  it('counts borrows', () => {
    expect(countBorrows(57, 23)).toBe(0)
    expect(countBorrows(52, 27)).toBe(1)
    expect(countBorrows(100, 1)).toBe(2) // ones and tens both borrow
    expect(countBorrows(103, 58)).toBe(2)
    expect(countBorrows(90, 90)).toBe(0)
  })

  it('tags problems by operation', () => {
    expect(tagProblem({ op: 'add', left: 47, right: 38, answer: 85 })).toEqual({ answerDigits: 2, carries: 1 })
    expect(tagProblem({ op: 'sub', left: 85, right: 47, answer: 38 })).toEqual({ answerDigits: 2, borrows: 1 })
    expect(tagProblem({ op: 'mul', left: 7, right: 64, answer: 448 })).toEqual({ answerDigits: 3, small: 7, big: 64, bigAbove20: true })
    expect(tagProblem({ op: 'div', left: 448, right: 7, answer: 64 })).toEqual({ answerDigits: 2, small: 7, big: 64, bigAbove20: true, divAnswerAbove12: true })
    expect(tagProblem({ op: 'div', left: 36, right: 4, answer: 9 })).toMatchObject({ divAnswerAbove12: false, bigAbove20: false })
  })
})

describe('drill generator', () => {
  it('oversamples the target slice but still mixes in other problems', () => {
    const target = { match: (p: { op: string; tags: { small?: number } }) => p.op === 'mul' && p.tags.small === 7, weight: 1 }
    let hits = 0
    let prev: Problem | null = null
    for (let i = 0; i < 5000; i++) {
      prev = generateDrillProblem(S, prev, [target])
      if (prev.op === 'mul' && prev.left === 7) hits++
    }
    // random rate is 1/4 * 1/11 ≈ 2%; with a 60% drill share it should be ~61%
    expect(hits / 5000).toBeGreaterThan(0.55)
    expect(hits / 5000).toBeLessThan(0.68)
  })
})
