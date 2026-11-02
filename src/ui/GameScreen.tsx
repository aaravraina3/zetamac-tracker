import { useEffect, useRef } from 'react'
import { useGame, type GameConfig } from '../engine/useGame'
import type { ProblemRecord, SessionRecord } from '../types'
import { OP_SYMBOL } from '../types'

interface Props {
  config: GameConfig
  drillLabels: string[]
  onFinish: (session: SessionRecord, problems: ProblemRecord[]) => void
  onQuit: () => void
  onRestart: () => void
}

export function GameScreen({ config, drillLabels, onFinish, onQuit, onRestart }: Props) {
  const { problem, value, onInput, remainingMs, score } = useGame(config, onFinish)
  const inputRef = useRef<HTMLInputElement>(null)

  // Esc quits, R restarts. Digits go straight to the input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onQuit()
      else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        onRestart()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onQuit, onRestart])

  // keep focus on the input even if you click elsewhere
  const refocus = () => inputRef.current?.focus()

  return (
    <div className="flex-1 flex flex-col" onClick={refocus}>
      <div className="flex justify-between px-6 py-4 text-zinc-400 tabular-nums">
        <span className="text-xs text-zinc-600">
          {config.practice && <span className="text-amber-400 mr-3">PRACTICE</span>}
          esc quit · r restart
        </span>
        <span>
          Seconds left: {Math.ceil(remainingMs / 1000)}
          <span className="ml-6">Score: {score}</span>
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 -mt-16">
        <div className="text-6xl text-zinc-100 tabular-nums tracking-wide">
          {problem.left} {OP_SYMBOL[problem.op]} {problem.right}
        </div>
        <input
          ref={inputRef}
          autoFocus
          value={value}
          onChange={(e) => onInput(e.target.value)}
          onBlur={refocus}
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          className="w-48 bg-zinc-900 border border-zinc-700 rounded text-4xl text-center py-2 text-zinc-100 outline-none focus:border-zinc-500 tabular-nums"
        />
        {config.practice && (
          <div className="text-xs text-zinc-600 max-w-md text-center">
            {drillLabels.length ? `Drilling: ${drillLabels.join(' · ')}` : 'Not enough history yet to find weak spots, so this drill is fully random.'}
          </div>
        )}
      </div>
    </div>
  )
}
