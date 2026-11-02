import type { Op, ProblemRecord, SessionRecord } from '../types'
import { OPS } from '../types'
import { BIG_BUCKETS, bigBucket } from './slices'
import { MIN_SAMPLES, groupBy, median, summarize, type Summary } from './stats'
import { rankWeakSpots, type WeakSpot } from './weakSpots'

// Everything the report screens show, computed from plain arrays.
// No React or IndexedDB in here so it's easy to test and reason about.

export interface OpRow {
  op: Op
  n: number
  solve: Summary | null
  hesitation: number | null // median ms to first keystroke
  typing: number | null // median ms from first keystroke to correct answer
  errorRate: number | null // wrong digit events per problem
}

export interface HeatCell {
  n: number
  median: number | null // null when n < MIN_SAMPLES
}

export interface Heatmap {
  rows: number[] // small factors
  cols: string[] // big factor bucket labels
  cells: HeatCell[][] // [row][col]
}

export interface CarryRow {
  label: string
  n: number
  median: number | null
}

export interface FactorErrorRow {
  factor: number
  n: number
  errorRate: number | null
}

export interface Report {
  total: number
  byOp: OpRow[]
  slowest: ProblemRecord[]
  mulHeatmap: Heatmap
  divHeatmap: Heatmap
  addCarry: CarryRow[]
  subBorrow: CarryRow[]
  mulErrors: FactorErrorRow[]
  divErrors: FactorErrorRow[]
  weakSpots: WeakSpot[]
}

const medianOrNull = (xs: number[]) => (xs.length >= MIN_SAMPLES ? median(xs) : null)
const errorRateOrNull = (ps: ProblemRecord[]) =>
  ps.length >= MIN_SAMPLES ? ps.reduce((s, p) => s + p.wrongDigitEvents, 0) / ps.length : null

function opRow(op: Op, ps: ProblemRecord[]): OpRow {
  return {
    op,
    n: ps.length,
    solve: summarize(ps.map((p) => p.solveMs)),
    hesitation: medianOrNull(ps.map((p) => p.hesitationMs)),
    typing: medianOrNull(ps.map((p) => p.solveMs - p.hesitationMs)),
    errorRate: errorRateOrNull(ps),
  }
}

export function buildHeatmap(ps: ProblemRecord[]): Heatmap {
  const smalls = new Set<number>([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  for (const p of ps) if (p.tags.small !== undefined) smalls.add(p.tags.small)
  const rows = [...smalls].sort((a, b) => a - b)
  const cells = rows.map((k) =>
    BIG_BUCKETS.map((_, b) => {
      const times = ps.filter((p) => p.tags.small === k && bigBucket(p.tags.big!) === b).map((p) => p.solveMs)
      return { n: times.length, median: medianOrNull(times) }
    }),
  )
  return { rows, cols: BIG_BUCKETS.map((b) => b.label), cells }
}

// "With vs without" plus one row per exact count.
export function carryTable(ps: ProblemRecord[], count: (p: ProblemRecord) => number, word: string): CarryRow[] {
  const rows: CarryRow[] = []
  const without = ps.filter((p) => count(p) === 0).map((p) => p.solveMs)
  const withAny = ps.filter((p) => count(p) > 0).map((p) => p.solveMs)
  rows.push({ label: `No ${word}`, n: without.length, median: medianOrNull(without) })
  rows.push({ label: `Any ${word}`, n: withAny.length, median: medianOrNull(withAny) })
  const byCount = groupBy(ps.filter((p) => count(p) > 0), count)
  for (const k of [...byCount.keys()].sort((a, b) => a - b)) {
    const times = byCount.get(k)!.map((p) => p.solveMs)
    rows.push({ label: `Exactly ${k}`, n: times.length, median: medianOrNull(times) })
  }
  return rows
}

function factorErrors(ps: ProblemRecord[]): FactorErrorRow[] {
  const byFactor = groupBy(ps, (p) => p.tags.small!)
  return [...byFactor.keys()]
    .sort((a, b) => a - b)
    .map((factor) => {
      const group = byFactor.get(factor)!
      return { factor, n: group.length, errorRate: errorRateOrNull(group) }
    })
}

export function buildReport(problems: ProblemRecord[]): Report {
  const byOp = groupBy(problems, (p) => p.op)
  const of = (op: Op) => byOp.get(op) ?? []
  return {
    total: problems.length,
    byOp: OPS.map((op) => opRow(op, of(op))),
    slowest: [...problems].sort((a, b) => b.solveMs - a.solveMs).slice(0, 15),
    mulHeatmap: buildHeatmap(of('mul')),
    divHeatmap: buildHeatmap(of('div')),
    addCarry: carryTable(of('add'), (p) => p.tags.carries ?? 0, 'carry'),
    subBorrow: carryTable(of('sub'), (p) => p.tags.borrows ?? 0, 'borrow'),
    mulErrors: factorErrors(of('mul')),
    divErrors: factorErrors(of('div')),
    weakSpots: rankWeakSpots(problems),
  }
}

export interface SessionSummary {
  count: number
  totalProblems: number
  ppm: number | null
  avgScore: number | null
  bestScore: number | null
}

export function summarizeSessions(sessions: SessionRecord[]): SessionSummary {
  if (sessions.length === 0) return { count: 0, totalProblems: 0, ppm: null, avgScore: null, bestScore: null }
  const totalProblems = sessions.reduce((s, x) => s + x.score, 0)
  const totalMin = sessions.reduce((s, x) => s + x.durationSec, 0) / 60
  return {
    count: sessions.length,
    totalProblems,
    ppm: totalProblems / totalMin,
    avgScore: totalProblems / sessions.length,
    bestScore: Math.max(...sessions.map((s) => s.score)),
  }
}

export interface TrendPoint {
  sessionId: string
  startedAt: number
  score: number
  practice: boolean
}

// One series per settings key so a 30s game and a 120s game never share a line.
export function scoreTrend(sessions: SessionRecord[], includePractice: boolean): Map<string, TrendPoint[]> {
  const kept = sessions.filter((s) => includePractice || !s.practice).sort((a, b) => a.startedAt - b.startedAt)
  const out = new Map<string, TrendPoint[]>()
  for (const [key, group] of groupBy(kept, (s) => s.settingsKey)) {
    out.set(key, group.map((s) => ({ sessionId: s.id, startedAt: s.startedAt, score: s.score, practice: s.practice })))
  }
  return out
}
