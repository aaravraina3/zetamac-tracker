import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TrendPoint } from '../../analytics/report'

// One line per settings group. A dropdown picks the group so different
// durations or ranges are never drawn on the same axis.
export function TrendChart({ series }: { series: Map<string, TrendPoint[]> }) {
  const keys = [...series.keys()].sort((a, b) => series.get(b)!.length - series.get(a)!.length)
  const [picked, setPicked] = useState<string | null>(null)
  const key = picked && series.has(picked) ? picked : keys[0]

  if (!key) return <p className="text-zinc-600 text-sm">No sessions yet.</p>

  const data = series.get(key)!.map((p, i) => ({ n: i + 1, score: p.score, date: new Date(p.startedAt).toLocaleString(), practice: p.practice }))

  return (
    <div className="space-y-2">
      <select className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm max-w-full" value={key} onChange={(e) => setPicked(e.target.value)}>
        {keys.map((k) => (
          <option key={k} value={k}>{k} ({series.get(k)!.length} sessions)</option>
        ))}
      </select>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="#27272a" vertical={false} />
            <XAxis dataKey="n" stroke="#52525b" tick={{ fontSize: 12 }} tickLine={false} />
            <YAxis stroke="#52525b" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 4, fontSize: 12 }}
              labelFormatter={(_, payload) => (payload?.[0] ? `${payload[0].payload.date}${payload[0].payload.practice ? ' (practice)' : ''}` : '')}
              formatter={(v) => [v, 'Score']}
              cursor={{ stroke: '#52525b' }}
            />
            <Line type="linear" dataKey="score" stroke="#60a5fa" strokeWidth={2} dot={{ r: 4, fill: '#60a5fa', stroke: '#111214', strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
