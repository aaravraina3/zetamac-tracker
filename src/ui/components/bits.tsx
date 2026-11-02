// Small shared presentational pieces for the report screens.

export const NOT_ENOUGH = 'not enough data'

export function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-zinc-100 text-lg">{title}</h2>
        {hint && <p className="text-xs text-zinc-500">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-zinc-800 px-4 py-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-2xl text-zinc-100 tabular-nums">{value}</div>
    </div>
  )
}

// Renders a value or the "not enough data" placeholder.
export function Val({ v, fmt }: { v: number | null | undefined; fmt: (n: number) => string }) {
  return v === null || v === undefined ? <span className="text-zinc-600 text-xs">{NOT_ENOUGH}</span> : <>{fmt(v)}</>
}

export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="text-zinc-500 text-left">
            {head.map((h) => (
              <th key={h} className="font-normal py-1 pr-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-zinc-800/70">
              {r.map((c, j) => (
                <td key={j} className="py-1.5 pr-4">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
