import type { Op, ProblemTags } from '../types'

// A slice is a named subset of problems, like "multiplying by 7 with a big
// factor above 50". Slices drive the weak spot ranking and the practice drill.

export interface Taggable {
  op: Op
  tags: ProblemTags
}

export interface Slice {
  key: string
  op: Op
  // Slices in the same family overlap heavily (e.g. "×7" and "×7 with big
  // factor 51-100"), so the weak spot list shows at most one per family.
  family: string
  label: string
  match: (p: Taggable) => boolean
}

export const BIG_BUCKETS = [
  { label: '2–12', words: '2 to 12', min: -Infinity, max: 12 },
  { label: '13–20', words: '13 to 20', min: 13, max: 20 },
  { label: '21–50', words: '21 to 50', min: 21, max: 50 },
  { label: '51–100', words: 'above 50', min: 51, max: Infinity },
]

export function bigBucket(big: number): number {
  return BIG_BUCKETS.findIndex((b) => big >= b.min && big <= b.max)
}

const plural = (n: number, word: string) => (n === 0 ? `no ${word}s` : `${n} ${word}${n === 1 ? '' : 's'}`)

// Every slice this problem belongs to.
export function slicesFor(p: Taggable): Slice[] {
  const t = p.tags
  const out: Slice[] = []

  if (p.op === 'add' && t.carries !== undefined) {
    const n = t.carries
    out.push({
      key: `add:carries:${n}`,
      op: 'add',
      family: `add:carries:${n}`,
      label: `Addition with ${n === 0 ? 'no carries' : n === 1 ? '1 carry' : `${n} carries`}`,
      match: (q) => q.op === 'add' && q.tags.carries === n,
    })
  }

  if (p.op === 'sub' && t.borrows !== undefined) {
    const n = t.borrows
    out.push({
      key: `sub:borrows:${n}`,
      op: 'sub',
      family: `sub:borrows:${n}`,
      label: `Subtraction with ${plural(n, 'borrow')}`,
      match: (q) => q.op === 'sub' && q.tags.borrows === n,
    })
  }

  if ((p.op === 'mul' || p.op === 'div') && t.small !== undefined && t.big !== undefined) {
    const op = p.op
    const k = t.small
    const b = bigBucket(t.big)
    const verb = op === 'mul' ? 'Multiplying' : 'Dividing'
    const bigWord = op === 'mul' ? 'a big factor' : 'an answer'
    out.push({
      key: `${op}:${k}`,
      op,
      family: `${op}:${k}`,
      label: `${verb} by ${k}`,
      match: (q) => q.op === op && q.tags.small === k,
    })
    out.push({
      key: `${op}:${k}:${b}`,
      op,
      family: `${op}:${k}`,
      label: `${verb} by ${k} with ${bigWord} ${BIG_BUCKETS[b].words}`,
      match: (q) => q.op === op && q.tags.small === k && q.tags.big !== undefined && bigBucket(q.tags.big) === b,
    })
    // coarser slice across all small factors, useful before each factor has 5 samples
    out.push({
      key: `${op}:big:${b}`,
      op,
      family: `${op}:big:${b}`,
      label: `${verb} with ${bigWord} ${BIG_BUCKETS[b].words}`,
      match: (q) => q.op === op && q.tags.big !== undefined && bigBucket(q.tags.big) === b,
    })
  }

  if (p.op === 'div' && t.divAnswerAbove12) {
    out.push({
      key: 'div:answer>12',
      op: 'div',
      family: 'div:answer>12',
      label: 'Division with an answer above 12',
      match: (q) => q.op === 'div' && !!q.tags.divAnswerAbove12,
    })
  }

  return out
}
