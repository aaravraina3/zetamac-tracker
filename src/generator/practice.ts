import { randomInt, weightedIndex } from '../lib/random'
import type { GameSettings, Problem, ProblemTags } from '../types'
import { generateProblem, sameProblem } from './problems'
import { tagProblem } from './tags'

export interface DrillTarget {
  match: (p: { op: Problem['op']; tags: ProblemTags }) => boolean
  weight: number // bigger = slower slice = drawn more often
}

// Share of drill problems aimed at a weak slice. The rest stay fully random
// so the drill still covers everything.
export const DRILL_SHARE = 0.6

// Draw a problem that falls in one of the weak slices, picked with probability
// proportional to its weight. We generate random problems and keep the first
// one inside the slice (rejection sampling), which works for any slice shape
// without special-case generators. Falls back to a random problem if the slice
// can't be hit under the current settings.
export function generateDrillProblem(s: GameSettings, prev: Problem | null, targets: DrillTarget[]): Problem {
  if (targets.length === 0 || randomInt(1, 100) > DRILL_SHARE * 100) {
    return generateProblem(s, prev)
  }
  const target = targets[weightedIndex(targets.map((t) => t.weight))]
  for (let i = 0; i < 2000; i++) {
    const p = generateProblem(s, prev)
    if (!sameProblem(prev, p) && target.match({ op: p.op, tags: tagProblem(p) })) return p
  }
  return generateProblem(s, prev)
}
