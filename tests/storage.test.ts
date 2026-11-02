import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { clearHistory, getAllProblems, getAllSessions, importData, loadSettings, saveSession, saveSettings } from '../src/storage/db'
import { parseImport, toCSV, toJSON } from '../src/storage/exportImport'
import { tagProblem } from '../src/generator/tags'
import { DEFAULT_SETTINGS, type ProblemRecord, type SessionRecord } from '../src/types'

const session: SessionRecord = { id: 's1', startedAt: 1, endedAt: 2, durationSec: 120, score: 1, settings: DEFAULT_SETTINGS, settingsKey: 'k', practice: false }
const p = { op: 'add' as const, left: 47, right: 38, answer: 85 }
const problem: ProblemRecord = {
  ...p, sessionId: 's1', timestamp: 1, index: 0, settingsKey: 'k', practice: false, tags: tagProblem(p),
  hesitationMs: 400, solveMs: 900, backspaces: 0, wrongDigitEvents: 0, keystrokes: 2,
}

describe('storage', () => {
  it('saves, exports, resets, and re-imports', async () => {
    await saveSession(session, [problem])
    expect((await getAllSessions()).length).toBe(1)
    const problems = await getAllProblems()
    expect(problems[0].solveMs).toBe(900)

    const json = toJSON(await getAllSessions(), problems)
    const csv = toCSV(await getAllSessions(), problems)
    expect(csv.split('\n')[1]).toContain('add,47,38,85,400,900')

    await clearHistory()
    expect((await getAllProblems()).length).toBe(0)

    const parsed = parseImport(json)
    expect(await importData(parsed.sessions, parsed.problems)).toBe(1)
    expect(await importData(parsed.sessions, parsed.problems)).toBe(0) // same file twice is a no-op
    expect((await getAllProblems()).length).toBe(1)
  })

  it('remembers settings', async () => {
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS)
    await saveSettings({ ...DEFAULT_SETTINGS, durationSec: 30 })
    expect((await loadSettings()).durationSec).toBe(30)
  })
})
