import { useMemo } from 'react'
import { buildReport, type CarryRow, type FactorErrorRow } from '../analytics/report'
import { fmtSec } from '../analytics/stats'
import type { ProblemRecord } from '../types'
import { OP_NAME, OP_SYMBOL } from '../types'
import { Heatmap } from './components/Heatmap'
import { NOT_ENOUGH, Section, Table, Val } from './components/bits'

// The detailed breakdown shared by the post-game report and the history report.
export function ReportView({ problems }: { problems: ProblemRecord[] }) {
  const r = useMemo(() => buildReport(problems), [problems])
  const sec = (n: number) => fmtSec(n)
  const rate = (n: number) => n.toFixed(2)

  if (problems.length === 0) return <p className="text-zinc-500">No problems in this selection.</p>

  return (
    <div className="space-y-10">
      <Section title="Weak spots" hint="Slices where your median is furthest above your overall median. Needs 5+ problems per slice.">
        {r.weakSpots.length === 0 ? (
          <p className="text-zinc-600 text-sm">{NOT_ENOUGH}</p>
        ) : (
          <ol className="space-y-1.5 text-sm list-decimal list-inside">
            {r.weakSpots.map((w) => (
              <li key={w.slice.key} className="text-zinc-300">{w.text}</li>
            ))}
          </ol>
        )}
      </Section>

      <Section title="By operation">
        <Table
          head={['Operation', 'Solved', 'Mean', 'Median', 'Wrong digits / problem']}
          rows={r.byOp.map((o) => [
            OP_NAME[o.op],
            o.n,
            <Val v={o.solve?.mean} fmt={sec} />,
            <Val v={o.solve?.median} fmt={sec} />,
            <Val v={o.errorRate} fmt={rate} />,
          ])}
        />
      </Section>

      <Section title="Thinking vs typing" hint="Median time before your first keystroke (thinking) and after it (typing).">
        <div className="space-y-2">
          {r.byOp.map((o) => (
            <div key={o.op} className="flex items-center gap-3 text-sm">
              <span className="w-28 text-zinc-400">{OP_NAME[o.op]}</span>
              {o.hesitation === null || o.typing === null ? (
                <span className="text-zinc-600 text-xs">{NOT_ENOUGH}</span>
              ) : (
                <SplitBar think={o.hesitation} type={o.typing} />
              )}
            </div>
          ))}
          <div className="flex gap-4 text-xs text-zinc-500 pl-31">
            <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-violet-400 mr-1" />thinking</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-teal-400 mr-1" />typing</span>
          </div>
        </div>
      </Section>

      <Section title="Multiplication heatmap">
        <Heatmap data={r.mulHeatmap} rowLabel="small" colLabel="big" />
      </Section>

      <Section title="Division heatmap" hint="Rows are the divisor, columns the answer.">
        <Heatmap data={r.divHeatmap} rowLabel="divisor" colLabel="answer" />
      </Section>

      <div className="grid gap-8 sm:grid-cols-2">
        <Section title="Addition carries">
          <CarryTable rows={r.addCarry} />
        </Section>
        <Section title="Subtraction borrows">
          <CarryTable rows={r.subBorrow} />
        </Section>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <Section title="Multiplication errors by factor">
          <FactorTable rows={r.mulErrors} />
        </Section>
        <Section title="Division errors by divisor">
          <FactorTable rows={r.divErrors} />
        </Section>
      </div>

      <Section title="Slowest 15 problems">
        <Table
          head={['Problem', 'Answer', 'Total', 'Thinking', 'Wrong digits']}
          rows={r.slowest.map((p) => [
            `${p.left} ${OP_SYMBOL[p.op]} ${p.right}`,
            p.answer,
            fmtSec(p.solveMs),
            fmtSec(p.hesitationMs),
            p.wrongDigitEvents,
          ])}
        />
      </Section>
    </div>
  )
}

function SplitBar({ think, type }: { think: number; type: number }) {
  const total = think + type
  // bar length is scaled so 5s of total time spans the full width
  const width = Math.min(100, (total / 5000) * 100)
  return (
    <div className="flex-1 flex items-center gap-3">
      <div className="flex h-4 gap-0.5" style={{ width: `${width}%`, minWidth: 40 }}>
        <div className="bg-violet-400 rounded-l" style={{ flex: think }} title={`thinking ${fmtSec(think)}`} />
        <div className="bg-teal-400 rounded-r" style={{ flex: type }} title={`typing ${fmtSec(type)}`} />
      </div>
      <span className="text-xs text-zinc-400 tabular-nums whitespace-nowrap">
        {fmtSec(think)} + {fmtSec(type)} ({Math.round((think / total) * 100)}% thinking)
      </span>
    </div>
  )
}

function CarryTable({ rows }: { rows: CarryRow[] }) {
  return <Table head={['', 'n', 'Median']} rows={rows.map((c) => [c.label, c.n, <Val v={c.median} fmt={fmtSec} />])} />
}

function FactorTable({ rows }: { rows: FactorErrorRow[] }) {
  if (rows.length === 0) return <p className="text-zinc-600 text-sm">{NOT_ENOUGH}</p>
  return <Table head={['Factor', 'n', 'Wrong digits / problem']} rows={rows.map((f) => [f.factor, f.n, <Val v={f.errorRate} fmt={(n) => n.toFixed(2)} />])} />
}
