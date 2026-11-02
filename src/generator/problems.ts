import { randomInt, pick } from '../lib/random'
import type { GameSettings, Op, Problem, Range } from '../types'
import { OPS } from '../types'

const draw = (r: Range) => randomInt(r.min, r.max)

export function enabledOps(s: GameSettings): Op[] {
  return OPS.filter((op) => s[op].enabled)
}

export function generateForOp(op: Op, s: GameSettings): Problem {
  switch (op) {
    case 'add': {
      const a = draw(s.add.left)
      const b = draw(s.add.right)
      return { op, left: a, right: b, answer: a + b }
    }
    case 'sub': {
      // Addition in reverse: a + b = c, show c − a, answer b. Never negative.
      const a = draw(s.add.left)
      const b = draw(s.add.right)
      return { op, left: a + b, right: a, answer: b }
    }
    case 'mul': {
      const a = draw(s.mul.left)
      const b = draw(s.mul.right)
      return { op, left: a, right: b, answer: a * b }
    }
    case 'div': {
      // Multiplication in reverse: a × b = c, show c ÷ a, answer b. Always whole.
      const a = draw(s.mul.left)
      const b = draw(s.mul.right)
      return { op, left: a * b, right: a, answer: b }
    }
  }
}

export function sameProblem(x: Problem | null, y: Problem): boolean {
  return !!x && x.op === y.op && x.left === y.left && x.right === y.right
}

// Pick an op uniformly among enabled ones, then operands uniformly.
// Rerolls if it would repeat the previous problem. The cap only matters for
// degenerate settings like a single-value range where a repeat is unavoidable.
export function generateProblem(s: GameSettings, prev: Problem | null): Problem {
  const ops = enabledOps(s)
  if (ops.length === 0) throw new Error('no operations enabled')
  let p = generateForOp(pick(ops), s)
  for (let i = 0; i < 100 && sameProblem(prev, p); i++) {
    p = generateForOp(pick(ops), s)
  }
  return p
}

// Ranges must have min <= max and positive values; subtraction/division need
// their parent ranges valid even if addition/multiplication are toggled off.
export function validateSettings(s: GameSettings): string | null {
  if (enabledOps(s).length === 0) return 'Enable at least one operation.'
  const ranges: [string, Range][] = []
  if (s.add.enabled || s.sub.enabled) ranges.push(['addition left', s.add.left], ['addition right', s.add.right])
  if (s.mul.enabled || s.div.enabled) ranges.push(['multiplication left', s.mul.left], ['multiplication right', s.mul.right])
  for (const [name, r] of ranges) {
    if (!Number.isInteger(r.min) || !Number.isInteger(r.max)) return `The ${name} range needs whole numbers.`
    if (r.min > r.max) return `The ${name} range has min above max.`
    if (r.min < 0) return `The ${name} range can't go below 0.`
  }
  if (s.div.enabled && s.mul.left.min === 0) return 'Division needs the multiplication left range to start at 1 or more.'
  if (!(s.durationSec > 0)) return 'Duration must be positive.'
  return null
}

// Short human readable key used to group sessions with identical settings,
// e.g. "+ − × ÷ | 2-100,2-100 | 2-12,2-100 | 120s".
export function settingsKey(s: GameSettings): string {
  const ops = enabledOps(s).map((op) => ({ add: '+', sub: '−', mul: '×', div: '÷' })[op]).join(' ')
  const r = (x: Range) => `${x.min}-${x.max}`
  const parts = [ops]
  if (s.add.enabled || s.sub.enabled) parts.push(`${r(s.add.left)},${r(s.add.right)}`)
  if (s.mul.enabled || s.div.enabled) parts.push(`${r(s.mul.left)},${r(s.mul.right)}`)
  parts.push(`${s.durationSec}s`)
  return parts.join(' | ')
}
