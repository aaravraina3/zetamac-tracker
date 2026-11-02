export type Op = 'add' | 'sub' | 'mul' | 'div'

export const OPS: Op[] = ['add', 'sub', 'mul', 'div']

export const OP_SYMBOL: Record<Op, string> = {
  add: '+',
  sub: '−',
  mul: '×',
  div: '÷',
}

export const OP_NAME: Record<Op, string> = {
  add: 'Addition',
  sub: 'Subtraction',
  mul: 'Multiplication',
  div: 'Division',
}

export interface Range {
  min: number
  max: number
}

// Subtraction reuses the addition ranges, division reuses the multiplication
// ranges, same as Zetamac.
export interface GameSettings {
  add: { enabled: boolean; left: Range; right: Range }
  sub: { enabled: boolean }
  mul: { enabled: boolean; left: Range; right: Range }
  div: { enabled: boolean }
  durationSec: number
}

export const DEFAULT_SETTINGS: GameSettings = {
  add: { enabled: true, left: { min: 2, max: 100 }, right: { min: 2, max: 100 } },
  sub: { enabled: true },
  mul: { enabled: true, left: { min: 2, max: 12 }, right: { min: 2, max: 100 } },
  div: { enabled: true },
  durationSec: 120,
}

// left and right are the operands as displayed: "left op right = answer".
export interface Problem {
  op: Op
  left: number
  right: number
  answer: number
}

export interface ProblemTags {
  answerDigits: number
  carries?: number // add only
  borrows?: number // sub only
  small?: number // mul/div: factor drawn from the first (small) range
  big?: number // mul/div: factor drawn from the second (big) range
  bigAbove20?: boolean
  divAnswerAbove12?: boolean
}

// Raw keystroke stats for one solved problem, produced by the game engine.
export interface SolveStats {
  hesitationMs: number
  solveMs: number
  backspaces: number
  wrongDigitEvents: number
  keystrokes: number
}

export interface ProblemRecord extends Problem, SolveStats {
  id?: number // autoincrement key in IndexedDB
  sessionId: string
  timestamp: number // epoch ms when the problem was shown
  index: number // position within the session
  settingsKey: string // full snapshot lives on the session record
  practice: boolean
  tags: ProblemTags
}

export interface SessionRecord {
  id: string
  startedAt: number
  endedAt: number
  durationSec: number
  score: number
  settings: GameSettings
  settingsKey: string
  practice: boolean
}
