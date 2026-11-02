import type { ProblemRecord } from '../types'
import { slicesFor, type Slice } from './slices'
import { MIN_SAMPLES, fmtSec, median } from './stats'

export interface WeakSpot {
  slice: Slice
  n: number
  median: number
  ratio: number // slice median / your overall median
  text: string
}

type Solved = Pick<ProblemRecord, 'op' | 'tags' | 'solveMs'>

// Rank slices by how slow they are relative to your own overall median solve
// time. Slices need MIN_SAMPLES problems, must be slower than your median, and
// only one slice per family is kept so the list isn't five flavors of "×7".
export function rankWeakSpots(problems: Solved[], limit = 5): WeakSpot[] {
  if (problems.length < MIN_SAMPLES) return []
  const overall = median(problems.map((p) => p.solveMs))

  const groups = new Map<string, { slice: Slice; times: number[] }>()
  for (const p of problems) {
    for (const slice of slicesFor(p)) {
      const g = groups.get(slice.key)
      if (g) g.times.push(p.solveMs)
      else groups.set(slice.key, { slice, times: [p.solveMs] })
    }
  }

  const candidates = [...groups.values()]
    .filter((g) => g.times.length >= MIN_SAMPLES)
    .map((g) => {
      const m = median(g.times)
      return { slice: g.slice, n: g.times.length, median: m, ratio: m / overall }
    })
    .filter((c) => c.ratio > 1)
    .sort((a, b) => b.ratio - a.ratio)

  const out: WeakSpot[] = []
  const usedFamilies = new Set<string>()
  for (const c of candidates) {
    if (usedFamilies.has(c.slice.family)) continue
    usedFamilies.add(c.slice.family)
    out.push({
      ...c,
      text: `${c.slice.label}: ${fmtSec(c.median)} median, ${c.ratio.toFixed(1)}x your overall median (${fmtSec(overall)}), ${c.n} problems.`,
    })
    if (out.length === limit) break
  }
  return out
}
