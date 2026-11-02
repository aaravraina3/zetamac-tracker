import type { Heatmap as HeatmapData } from '../../analytics/report'
import { fmtSec } from '../../analytics/stats'

// Cell color runs green (your fastest cell) to red (your slowest cell),
// scaled within this heatmap so the contrast is always useful.
function color(t: number) {
  const hue = 130 - 130 * t
  return `hsl(${hue} 55% 32%)`
}

export function Heatmap({ data, rowLabel, colLabel }: { data: HeatmapData; rowLabel: string; colLabel: string }) {
  const medians = data.cells.flat().flatMap((c) => (c.median === null ? [] : [c.median]))
  const lo = Math.min(...medians)
  const hi = Math.max(...medians)

  return (
    <div className="overflow-x-auto">
      <table className="text-sm tabular-nums border-separate" style={{ borderSpacing: 2 }}>
        <thead>
          <tr>
            <th className="text-xs font-normal text-zinc-500 pr-2 text-left">{rowLabel} \ {colLabel}</th>
            {data.cols.map((c) => (
              <th key={c} className="text-xs font-normal text-zinc-500 px-2 w-20">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((k, i) => (
            <tr key={k}>
              <td className="text-zinc-400 pr-2 text-right">{k}</td>
              {data.cells[i].map((cell, j) => {
                const tip = `${k}, ${data.cols[j]}: ${cell.n} problems${cell.median === null ? '' : `, median ${fmtSec(cell.median)}`}`
                if (cell.median === null) {
                  return (
                    <td key={j} title={tip} className="text-center text-zinc-600 bg-zinc-900 rounded h-8 text-xs">
                      {cell.n ? `n=${cell.n}` : '·'}
                    </td>
                  )
                }
                const t = hi > lo ? (cell.median - lo) / (hi - lo) : 0
                return (
                  <td key={j} title={tip} className="text-center text-white rounded h-8" style={{ background: color(t) }}>
                    {fmtSec(cell.median)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-zinc-600 mt-1">Median solve time. Grey cells have fewer than 5 problems (n shown). Hover a cell for details.</p>
    </div>
  )
}
