import type { SolveStats } from '../types'

// Tracks keystrokes for the problem currently on screen. Pure functions so
// the logic can be tested without a browser; the game hook just feeds it
// input values and timestamps.

export interface Attempt {
  shownAt: number
  firstKeyAt: number | null
  typed: string
  backspaces: number
  wrongDigitEvents: number
  keystrokes: number
}

export function startAttempt(now: number): Attempt {
  return { shownAt: now, firstKeyAt: null, typed: '', backspaces: 0, wrongDigitEvents: 0, keystrokes: 0 }
}

export function isPrefixOfAnswer(typed: string, answer: number): boolean {
  return String(answer).startsWith(typed)
}

// Apply one input change. Each change event is one key press: either a digit
// was added or something was deleted.
export function applyInput(a: Attempt, value: string, answer: number, now: number): { attempt: Attempt; solved: boolean } {
  const wasOnTrack = isPrefixOfAnswer(a.typed, answer)
  const onTrack = isPrefixOfAnswer(value, answer)
  const next: Attempt = {
    ...a,
    typed: value,
    firstKeyAt: a.firstKeyAt ?? now,
    keystrokes: a.keystrokes + 1,
    backspaces: a.backspaces + (value.length < a.typed.length ? 1 : 0),
    // count the moment you go from on track to off track, not every extra key
    wrongDigitEvents: a.wrongDigitEvents + (wasOnTrack && !onTrack ? 1 : 0),
  }
  return { attempt: next, solved: value === String(answer) }
}

export function finishAttempt(a: Attempt, now: number): SolveStats {
  return {
    hesitationMs: Math.round((a.firstKeyAt ?? now) - a.shownAt),
    solveMs: Math.round(now - a.shownAt),
    backspaces: a.backspaces,
    wrongDigitEvents: a.wrongDigitEvents,
    keystrokes: a.keystrokes,
  }
}
