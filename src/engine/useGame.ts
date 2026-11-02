import { useCallback, useEffect, useRef, useState } from 'react'
import { generateDrillProblem, type DrillTarget } from '../generator/practice'
import { generateProblem, settingsKey } from '../generator/problems'
import { tagProblem } from '../generator/tags'
import type { GameSettings, Problem, ProblemRecord, SessionRecord } from '../types'
import { applyInput, finishAttempt, startAttempt, type Attempt } from './attempt'

export interface GameConfig {
  settings: GameSettings
  practice: boolean
  targets: DrillTarget[] // only used in practice mode
}

// Runs one timed game. Timings use performance.now() (monotonic, sub-ms);
// timestamps saved to the database use Date.now().
export function useGame(config: GameConfig, onFinish: (session: SessionRecord, problems: ProblemRecord[]) => void) {
  const { settings, practice, targets } = config

  const next = useCallback(
    (prev: Problem | null) => (practice ? generateDrillProblem(settings, prev, targets) : generateProblem(settings, prev)),
    [settings, practice, targets],
  )

  const [problem, setProblem] = useState<Problem>(() => next(null))
  const [value, setValue] = useState('')
  const [remainingMs, setRemainingMs] = useState(settings.durationSec * 1000)

  // Refs hold the hot-path state so typing never waits on a re-render.
  const sessionId = useRef(crypto.randomUUID())
  const startedAt = useRef({ perf: performance.now(), wall: Date.now() })
  const problemRef = useRef(problem)
  const attempt = useRef<Attempt>(startAttempt(performance.now()))
  const shownWall = useRef(Date.now())
  const records = useRef<ProblemRecord[]>([])
  const finished = useRef(false)
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    const key = settingsKey(settings)
    const session: SessionRecord = {
      id: sessionId.current,
      startedAt: startedAt.current.wall,
      endedAt: Date.now(),
      durationSec: settings.durationSec,
      score: records.current.length,
      settings,
      settingsKey: key,
      practice,
    }
    onFinishRef.current(session, records.current)
  }, [settings, practice])

  useEffect(() => {
    const id = setInterval(() => {
      const left = settings.durationSec * 1000 - (performance.now() - startedAt.current.perf)
      if (left <= 0) {
        clearInterval(id)
        setRemainingMs(0)
        finish()
      } else {
        setRemainingMs(left)
      }
    }, 100)
    return () => clearInterval(id)
  }, [settings.durationSec, finish])

  const onInput = useCallback(
    (raw: string) => {
      if (finished.current) return
      const digits = raw.replace(/\D/g, '')
      // a non-digit key changed nothing, so it doesn't count as a keystroke
      if (digits === attempt.current.typed) {
        setValue(digits)
        return
      }
      const now = performance.now()
      const p = problemRef.current
      const r = applyInput(attempt.current, digits, p.answer, now)
      if (!r.solved) {
        attempt.current = r.attempt
        setValue(digits)
        return
      }
      records.current.push({
        ...p,
        ...finishAttempt(r.attempt, now),
        sessionId: sessionId.current,
        timestamp: shownWall.current,
        index: records.current.length,
        settingsKey: settingsKey(settings),
        practice,
        tags: tagProblem(p),
      })
      const np = next(p)
      problemRef.current = np
      setProblem(np)
      setValue('')
      attempt.current = startAttempt(performance.now())
      shownWall.current = Date.now()
    },
    [next, settings, practice],
  )

  return { problem, value, onInput, remainingMs, score: records.current.length }
}
