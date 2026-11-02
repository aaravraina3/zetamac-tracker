import { useEffect } from 'react'
import type { SessionRecord } from '../types'

interface Props {
  session: SessionRecord
  onReport: () => void
  onAgain: () => void
  onSettings: () => void
}

export function EndScreen({ session, onReport, onAgain, onSettings }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R' || e.key === 'Enter') onAgain()
      else if (e.key === 'Escape') onSettings()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onAgain, onSettings])

  const ppm = session.score / (session.durationSec / 60)

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 -mt-16">
      {session.practice && <div className="text-amber-400 text-sm">Practice session</div>}
      <div className="text-zinc-400">Score</div>
      <div className="text-7xl text-zinc-100 tabular-nums">{session.score}</div>
      <div className="text-zinc-500 tabular-nums">{ppm.toFixed(1)} problems per minute</div>
      <div className="flex gap-3 mt-4">
        <button onClick={onReport} className="px-5 py-2 rounded bg-zinc-100 text-zinc-900 font-medium">View report</button>
        <button onClick={onAgain} className="px-5 py-2 rounded border border-zinc-700">Play again (r)</button>
        <button onClick={onSettings} className="px-5 py-2 rounded border border-zinc-700 text-zinc-400">Settings</button>
      </div>
    </div>
  )
}
