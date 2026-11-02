import { useState } from 'react'
import { validateSettings } from '../generator/problems'
import type { GameSettings, Range } from '../types'

const DURATIONS = [30, 60, 120, 180, 300]

interface Props {
  settings: GameSettings
  onChange: (s: GameSettings) => void
  onStart: () => void
  onPractice: () => void
}

export function SettingsScreen({ settings: s, onChange, onStart, onPractice }: Props) {
  const [custom, setCustom] = useState(!DURATIONS.includes(s.durationSec))
  const error = validateSettings(s)

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 space-y-8">
      <h1 className="text-2xl text-zinc-100">Arithmetic Game</h1>

      <div className="space-y-5">
        <OpRow
          label="Addition"
          checked={s.add.enabled}
          onToggle={(v) => onChange({ ...s, add: { ...s.add, enabled: v } })}
        >
          <RangeInput value={s.add.left} onChange={(r) => onChange({ ...s, add: { ...s.add, left: r } })} />
          <span className="text-zinc-500">+</span>
          <RangeInput value={s.add.right} onChange={(r) => onChange({ ...s, add: { ...s.add, right: r } })} />
        </OpRow>

        <OpRow label="Subtraction" checked={s.sub.enabled} onToggle={(v) => onChange({ ...s, sub: { enabled: v } })}>
          <span className="text-zinc-500 text-sm">Addition problems in reverse.</span>
        </OpRow>

        <OpRow
          label="Multiplication"
          checked={s.mul.enabled}
          onToggle={(v) => onChange({ ...s, mul: { ...s.mul, enabled: v } })}
        >
          <RangeInput value={s.mul.left} onChange={(r) => onChange({ ...s, mul: { ...s.mul, left: r } })} />
          <span className="text-zinc-500">×</span>
          <RangeInput value={s.mul.right} onChange={(r) => onChange({ ...s, mul: { ...s.mul, right: r } })} />
        </OpRow>

        <OpRow label="Division" checked={s.div.enabled} onToggle={(v) => onChange({ ...s, div: { enabled: v } })}>
          <span className="text-zinc-500 text-sm">Multiplication problems in reverse.</span>
        </OpRow>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-zinc-400">Duration</span>
        <select
          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
          value={custom ? 'custom' : s.durationSec}
          onChange={(e) => {
            if (e.target.value === 'custom') return setCustom(true)
            setCustom(false)
            onChange({ ...s, durationSec: Number(e.target.value) })
          }}
        >
          {DURATIONS.map((d) => (
            <option key={d} value={d}>{d} seconds</option>
          ))}
          <option value="custom">Custom</option>
        </select>
        {custom && (
          <input
            type="number"
            min={5}
            className="w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
            value={Number.isNaN(s.durationSec) ? '' : s.durationSec}
            onChange={(e) => onChange({ ...s, durationSec: parseInt(e.target.value) })}
          />
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          disabled={!!error}
          onClick={onStart}
          className="px-5 py-2 rounded bg-zinc-100 text-zinc-900 font-medium disabled:opacity-40"
        >
          Start
        </button>
        <button
          disabled={!!error}
          onClick={onPractice}
          className="px-5 py-2 rounded border border-amber-500/60 text-amber-300 disabled:opacity-40"
        >
          Drill weak spots
        </button>
      </div>
      <p className="text-xs text-zinc-500">
        Drill sessions are tagged as practice. About 60% of problems come from your slowest slices, the rest are random.
        They're kept out of the score trend and reports unless you include them.
      </p>
    </div>
  )
}

function OpRow({ label, checked, onToggle, children }: { label: string; checked: boolean; onToggle: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 w-36 cursor-pointer">
        <input type="checkbox" checked={checked} onChange={(e) => onToggle(e.target.checked)} className="accent-zinc-300" />
        <span className={checked ? 'text-zinc-100' : 'text-zinc-500'}>{label}</span>
      </label>
      <div className={`flex items-center gap-2 ${checked ? '' : 'opacity-40'}`}>{children}</div>
    </div>
  )
}

function RangeInput({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  const num = (n: number) => (Number.isNaN(n) ? '' : n)
  const cls = 'w-16 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-center'
  return (
    <span className="flex items-center gap-1 text-zinc-500">
      (
      <input type="number" className={cls} value={num(value.min)} onChange={(e) => onChange({ ...value, min: parseInt(e.target.value) })} />
      to
      <input type="number" className={cls} value={num(value.max)} onChange={(e) => onChange({ ...value, max: parseInt(e.target.value) })} />
      )
    </span>
  )
}
