import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { GameSettings, ProblemRecord, SessionRecord } from '../types'
import { DEFAULT_SETTINGS } from '../types'

interface ArithmeticDB extends DBSchema {
  sessions: { key: string; value: SessionRecord; indexes: { startedAt: number } }
  problems: { key: number; value: ProblemRecord; indexes: { sessionId: string } }
  meta: { key: string; value: unknown }
}

let dbPromise: Promise<IDBPDatabase<ArithmeticDB>> | null = null

function db() {
  dbPromise ??= openDB<ArithmeticDB>('arithmetic-tracker', 1, {
    upgrade(d) {
      const sessions = d.createObjectStore('sessions', { keyPath: 'id' })
      sessions.createIndex('startedAt', 'startedAt')
      const problems = d.createObjectStore('problems', { keyPath: 'id', autoIncrement: true })
      problems.createIndex('sessionId', 'sessionId')
      d.createObjectStore('meta')
    },
  })
  return dbPromise
}

// Write a finished session and all its problems in one transaction.
export async function saveSession(session: SessionRecord, problems: ProblemRecord[]) {
  const d = await db()
  const tx = d.transaction(['sessions', 'problems'], 'readwrite')
  await tx.objectStore('sessions').put(session)
  for (const p of problems) await tx.objectStore('problems').add(p)
  await tx.done
}

export async function getAllSessions(): Promise<SessionRecord[]> {
  return (await db()).getAllFromIndex('sessions', 'startedAt')
}

export async function getAllProblems(): Promise<ProblemRecord[]> {
  return (await db()).getAll('problems')
}

export async function getSessionProblems(sessionId: string): Promise<ProblemRecord[]> {
  return (await db()).getAllFromIndex('problems', 'sessionId', sessionId)
}

export async function loadSettings(): Promise<GameSettings> {
  const saved = (await (await db()).get('meta', 'settings')) as GameSettings | undefined
  return saved ?? DEFAULT_SETTINGS
}

export async function saveSettings(s: GameSettings) {
  await (await db()).put('meta', s, 'settings')
}

export async function clearHistory() {
  const d = await db()
  const tx = d.transaction(['sessions', 'problems'], 'readwrite')
  await tx.objectStore('sessions').clear()
  await tx.objectStore('problems').clear()
  await tx.done
}

// Merge imported data. Sessions are keyed by id so re-importing the same file
// is harmless; problems for a session that already exists are skipped.
export async function importData(sessions: SessionRecord[], problems: ProblemRecord[]) {
  const d = await db()
  const existing = new Set(await d.getAllKeys('sessions'))
  const tx = d.transaction(['sessions', 'problems'], 'readwrite')
  let added = 0
  for (const s of sessions) {
    if (existing.has(s.id)) continue
    await tx.objectStore('sessions').put(s)
    added++
  }
  for (const p of problems) {
    if (existing.has(p.sessionId)) continue
    const { id: _ignored, ...rest } = p
    await tx.objectStore('problems').add(rest as ProblemRecord)
  }
  await tx.done
  return added
}
