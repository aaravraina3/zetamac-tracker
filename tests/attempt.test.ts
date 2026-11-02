import { describe, expect, it } from 'vitest'
import { applyInput, finishAttempt, startAttempt } from '../src/engine/attempt'

// Feed input values as if typed one key at a time: first key after 500ms, then 100ms apart.
function type(values: string[], answer: number) {
  let a = startAttempt(1000)
  let solved = false
  values.forEach((v, i) => {
    const r = applyInput(a, v, answer, 1500 + i * 100)
    a = r.attempt
    solved = r.solved
  })
  return { a, solved }
}

describe('attempt tracking', () => {
  it('clean solve', () => {
    const { a, solved } = type(['8', '85'], 85)
    expect(solved).toBe(true)
    expect(finishAttempt(a, 1600)).toEqual({ hesitationMs: 500, solveMs: 600, backspaces: 0, wrongDigitEvents: 0, keystrokes: 2 })
  })

  it('counts a wrong digit once, then the backspaces', () => {
    // answer 85: 8, 4 (wrong), 1 (still wrong), backspace, backspace, 5
    const { a, solved } = type(['8', '84', '841', '84', '8', '85'], 85)
    expect(solved).toBe(true)
    expect(a.wrongDigitEvents).toBe(1)
    expect(a.backspaces).toBe(2)
    expect(a.keystrokes).toBe(6)
  })

  it('counts separate wrong digit events', () => {
    const { a } = type(['7', '', '9', '', '8', '85'], 85)
    expect(a.wrongDigitEvents).toBe(2)
    expect(a.backspaces).toBe(2)
  })

  it('is not solved by a longer number that starts with the answer', () => {
    expect(type(['1', '12', '123'], 1).solved).toBe(false)
  })
})
