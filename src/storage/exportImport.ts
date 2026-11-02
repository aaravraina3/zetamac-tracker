import type { ProblemRecord, SessionRecord } from '../types'

export interface ExportFile {
  app: 'arithmetic-tracker'
  version: 1
  exportedAt: string
  sessions: SessionRecord[]
  problems: ProblemRecord[]
}

export function toJSON(sessions: SessionRecord[], problems: ProblemRecord[]): string {
  const file: ExportFile = { app: 'arithmetic-tracker', version: 1, exportedAt: new Date().toISOString(), sessions, problems }
  return JSON.stringify(file, null, 2)
}

export function parseImport(text: string): { sessions: SessionRecord[]; problems: ProblemRecord[] } {
  const data = JSON.parse(text)
  if (!data || !Array.isArray(data.sessions) || !Array.isArray(data.problems)) {
    throw new Error('File does not look like an export from this app.')
  }
  return { sessions: data.sessions, problems: data.problems }
}

const CSV_COLUMNS = [
  'session_id', 'session_started', 'duration_sec', 'session_score', 'practice', 'settings',
  'index', 'timestamp', 'op', 'left', 'right', 'answer',
  'hesitation_ms', 'solve_ms', 'backspaces', 'wrong_digit_events', 'keystrokes',
  'answer_digits', 'carries', 'borrows', 'small_factor', 'big_factor', 'big_above_20', 'div_answer_above_12',
] as const

function cell(v: unknown): string {
  if (v === undefined || v === null) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// One row per problem, with session info joined in so the CSV stands alone.
export function toCSV(sessions: SessionRecord[], problems: ProblemRecord[]): string {
  const byId = new Map(sessions.map((s) => [s.id, s]))
  const rows = problems.map((p) => {
    const s = byId.get(p.sessionId)
    return [
      p.sessionId, s ? new Date(s.startedAt).toISOString() : '', s?.durationSec, s?.score, p.practice, p.settingsKey,
      p.index, new Date(p.timestamp).toISOString(), p.op, p.left, p.right, p.answer,
      p.hesitationMs, p.solveMs, p.backspaces, p.wrongDigitEvents, p.keystrokes,
      p.tags.answerDigits, p.tags.carries, p.tags.borrows, p.tags.small, p.tags.big, p.tags.bigAbove20, p.tags.divAnswerAbove12,
    ].map(cell).join(',')
  })
  return [CSV_COLUMNS.join(','), ...rows].join('\n')
}

export function downloadText(filename: string, text: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
