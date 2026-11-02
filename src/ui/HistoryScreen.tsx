import { useEffect, useMemo, useState } from 'react'
import { scoreTrend, summarizeSessions } from '../analytics/report'
import { getAllProblems, getAllSessions } from '../storage/db'
import type { ProblemRecord, SessionRecord } from '../types'
import { ReportView } from './ReportView'
import { Section, Stat, Table } from './components/bits'
import { TrendChart } from './components/TrendChart'

const LAST_N = [0, 5, 10, 25, 50] // 0 = all

interface Props {
  onOpenSession: (session: SessionRecord, problems: ProblemRecord[]) => void
}

export function HistoryScreen({ onOpenSession }: Props) {
  const [sessions, setSessions] = useState<SessionRecord[] | null>(null)
  const [problems, setProblems] = useState<ProblemRecord[]>([])
  const [lastN, setLastN] = useState(0)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [includePractice, setIncludePractice] = useState(false)

  useEffect(() => {
    Promise.all([getAllSessions(), getAllProblems()]).then(([s, p]) => {
      setSessions(s)
      setProblems(p)
    })
  }, [])

  // Date filter applies to everything, including the trend chart.
  const dated = useMemo(() => {
    const lo = from ? new Date(from + 'T00:00').getTime() : -Infinity
    const hi = to ? new Date(to + 'T23:59:59.999').getTime() : Infinity
    return (sessions ?? []).filter((s) => s.startedAt >= lo && s.startedAt <= hi)
  }, [sessions, from, to])

  // "Last N" and the practice toggle narrow the detailed report.
  const selected = useMemo(() => {
    const kept = dated.filter((s) => includePractice || !s.practice).sort((a, b) => b.startedAt - a.startedAt)
    return lastN ? kept.slice(0, lastN) : kept
  }, [dated, includePractice, lastN])

  const selectedProblems = useMemo(() => {
    const ids = new Set(selected.map((s) => s.id))
    return problems.filter((p) => ids.has(p.sessionId))
  }, [selected, problems])

  if (!sessions) return null
  if (sessions.length === 0) return <p className="mx-auto max-w-4xl px-4 py-6 text-zinc-500">No sessions yet. Play a game first.</p>

  const summary = summarizeSessions(selected)
  const input = 'bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm'

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 space-y-10">
      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
        <label className="flex items-center gap-2">
          Sessions
          <select className={input} value={lastN} onChange={(e) => setLastN(Number(e.target.value))}>
            {LAST_N.map((n) => (
              <option key={n} value={n}>{n ? `Last ${n}` : 'All time'}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          From <input type="date" className={input} value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="flex items-center gap-2">
          To <input type="date" className={input} value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={includePractice} onChange={(e) => setIncludePractice(e.target.checked)} />
          Include practice
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Sessions" value={summary.count} />
        <Stat label="Avg score" value={summary.avgScore?.toFixed(1) ?? '–'} />
        <Stat label="Best score" value={summary.bestScore ?? '–'} />
        <Stat label="Problems per minute" value={summary.ppm?.toFixed(1) ?? '–'} />
      </div>

      <Section title="Score trend" hint="One line per settings combination, so different durations never mix.">
        <TrendChart series={scoreTrend(dated, includePractice)} />
      </Section>

      <Section title="Recent sessions" hint="Click one to open its report.">
        <Table
          head={['When', 'Score', 'Settings', '']}
          rows={selected.slice(0, 10).map((s) => [
            <button className="text-left hover:text-zinc-100" onClick={() => onOpenSession(s, problems.filter((p) => p.sessionId === s.id))}>
              {new Date(s.startedAt).toLocaleString()}
            </button>,
            s.score,
            <span className="text-xs text-zinc-500">{s.settingsKey}</span>,
            s.practice ? <span className="text-xs text-amber-400">practice</span> : '',
          ])}
        />
      </Section>

      <ReportView problems={selectedProblems} />
    </div>
  )
}
