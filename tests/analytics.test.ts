import { describe, expect, it } from 'vitest'
import { rankWeakSpots } from '../src/analytics/weakSpots'
import { buildReport, carryTable, scoreTrend, summarizeSessions } from '../src/analytics/report'
import { median, summarize } from '../src/analytics/stats'
import { tagProblem } from '../src/generator/tags'
import { DEFAULT_SETTINGS, type Problem, type ProblemRecord, type SessionRecord } from '../src/types'

let nextIdx = 0
function rec(p: Problem, solveMs: number): ProblemRecord {
  return {
    ...p, sessionId: 's1', timestamp: 0, index: nextIdx++, settingsKey: 'k', practice: false, tags: tagProblem(p),
    hesitationMs: solveMs / 2, solveMs, backspaces: 0, wrongDigitEvents: 0, keystrokes: 2,
  }
}
const mul = (a: number, b: number): Problem => ({ op: 'mul', left: a, right: b, answer: a * b })
const add = (a: number, b: number): Problem => ({ op: 'add', left: a, right: b, answer: a + b })
const repeat = <T,>(n: number, f: (i: number) => T) => Array.from({ length: n }, (_, i) => f(i))

describe('stats', () => {
  it('median', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 2, 3])).toBe(2.5)
  })

  it('hides stats under 5 samples', () => {
    expect(summarize([1, 2, 3, 4])).toBeNull()
    expect(summarize([1, 2, 3, 4, 5])).toMatchObject({ n: 5, median: 3, mean: 3 })
  })
})

describe('weak spots', () => {
  it('ranks the slowest slices relative to the overall median', () => {
    const ps = [
      ...repeat(20, (i) => rec(add(10 + (i % 5), 20), 1000)), // no carries, fast
      ...repeat(6, (i) => rec(mul(7, 60 + i), 4000)), // ×7 big >50, slow
      ...repeat(6, (i) => rec(mul(8, 30 + i), 2500)), // ×8 big 21-50, medium
    ]
    const spots = rankWeakSpots(ps)
    expect(spots[0].slice.family).toBe('mul:7')
    expect(spots[0].median).toBe(4000)
    expect(spots[0].ratio).toBe(4)
    expect(spots[0].text).toMatch(/^Multiplying by 7.*: 4\.00s median, 4\.0x your overall median/)
    // the coarser "any factor, big above 50" slice ties with ×7 and comes next
    expect(spots[1].slice.key).toBe('mul:big:3')
    expect(spots.map((s) => s.slice.family)).toContain('mul:8')
    // fast addition never shows up
    expect(spots.every((s) => s.slice.op === 'mul')).toBe(true)
  })

  it('skips slices with fewer than 5 samples', () => {
    const ps = [...repeat(20, () => rec(add(11, 22), 1000)), ...repeat(4, (i) => rec(mul(9, 70 + i), 9000))]
    expect(rankWeakSpots(ps)).toEqual([])
  })

  it('returns at most the limit, one per family, slowest first', () => {
    const ps = [
      ...repeat(40, () => rec(add(11, 22), 1000)),
      ...[3, 4, 5, 6, 7, 8, 9].flatMap((k) => repeat(5, (i) => rec(mul(k, 60 + i), 1000 + k * 300))),
    ]
    const spots = rankWeakSpots(ps)
    expect(spots.length).toBe(5)
    expect(new Set(spots.map((s) => s.slice.family)).size).toBe(5)
    expect(spots.map((s) => s.slice.family).slice(0, 3)).toEqual(['mul:9', 'mul:8', 'mul:7'])
  })
})

describe('report', () => {
  it('builds heatmap cells only with enough data', () => {
    const ps = [...repeat(5, (i) => rec(mul(7, 60 + i), 3000 + i)), ...repeat(3, () => rec(mul(6, 5), 1000))]
    const r = buildReport(ps)
    expect(r.mulHeatmap.cells[r.mulHeatmap.rows.indexOf(7)][3]).toEqual({ n: 5, median: 3002 })
    expect(r.mulHeatmap.cells[r.mulHeatmap.rows.indexOf(6)][0]).toEqual({ n: 3, median: null })
  })

  it('splits addition by carries', () => {
    const ps = [...repeat(5, () => rec(add(12, 34), 800)), ...repeat(5, () => rec(add(18, 5), 1500)), ...repeat(5, () => rec(add(95, 7), 2500))]
    const rows = carryTable(ps, (p) => p.tags.carries ?? 0, 'carry')
    expect(rows.map((r) => [r.label, r.median])).toEqual([
      ['No carry', 800], ['Any carry', 2000], ['Exactly 1', 1500], ['Exactly 2', 2500],
    ])
  })

  it('slowest 15, sorted', () => {
    const r = buildReport(repeat(30, (i) => rec(add(11, i + 2), i * 10)))
    expect(r.slowest.length).toBe(15)
    expect(r.slowest[0].solveMs).toBe(290)
  })
})

describe('sessions', () => {
  const sess = (id: string, t: number, score: number, durationSec: number, practice = false): SessionRecord => ({
    id, startedAt: t, endedAt: t + durationSec * 1000, durationSec, score, settings: DEFAULT_SETTINGS, settingsKey: `${durationSec}s`, practice,
  })

  it('problems per minute and averages', () => {
    const s = summarizeSessions([sess('a', 1, 60, 120), sess('b', 2, 40, 120)])
    expect(s.ppm).toBe(25)
    expect(s.avgScore).toBe(50)
    expect(s.bestScore).toBe(60)
  })

  it('trend separates settings and excludes practice by default', () => {
    const all = [sess('a', 1, 60, 120), sess('b', 2, 20, 30), sess('c', 3, 70, 120), sess('d', 4, 99, 120, true)]
    const t = scoreTrend(all, false)
    expect([...t.keys()].sort()).toEqual(['120s', '30s'])
    expect(t.get('120s')!.map((p) => p.score)).toEqual([60, 70])
    expect(scoreTrend(all, true).get('120s')!.length).toBe(3)
  })
})
