import type { ProblemRecord, SessionRecord } from '../types'
import { ReportView } from './ReportView'
import { Stat } from './components/bits'

export function SessionReport({ session, problems, onBack }: { session: SessionRecord; problems: ProblemRecord[]; onBack: () => void }) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 space-y-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl text-zinc-100">
          Session report {session.practice && <span className="text-amber-400 text-sm ml-2">practice</span>}
        </h1>
        <button onClick={onBack} className="text-sm text-zinc-400 hover:text-zinc-200">Back</button>
      </div>
      <p className="text-xs text-zinc-500">{new Date(session.startedAt).toLocaleString()} · {session.settingsKey}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Score" value={session.score} />
        <Stat label="Problems per minute" value={(session.score / (session.durationSec / 60)).toFixed(1)} />
        <Stat label="Duration" value={`${session.durationSec}s`} />
      </div>
      <ReportView problems={problems} />
    </div>
  )
}
