import { useState } from 'react'
import { clearHistory, getAllProblems, getAllSessions, importData } from '../storage/db'
import { downloadText, parseImport, toCSV, toJSON } from '../storage/exportImport'

export function DataScreen() {
  const [msg, setMsg] = useState('')
  const stamp = () => new Date().toISOString().slice(0, 10)
  const btn = 'px-4 py-2 rounded border border-zinc-700 hover:border-zinc-500 text-sm'

  const exportAs = async (kind: 'json' | 'csv') => {
    const [s, p] = await Promise.all([getAllSessions(), getAllProblems()])
    if (kind === 'json') downloadText(`arithmetic-${stamp()}.json`, toJSON(s, p), 'application/json')
    else downloadText(`arithmetic-${stamp()}.csv`, toCSV(s, p), 'text/csv')
    setMsg(`Exported ${s.length} sessions, ${p.length} problems.`)
  }

  const onImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const { sessions, problems } = parseImport(await file.text())
      const added = await importData(sessions, problems)
      setMsg(`Imported ${added} new sessions (${sessions.length - added} already existed).`)
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`)
    }
  }

  const onReset = async () => {
    if (!confirm('Delete all sessions and problems? This cannot be undone. Export first if you want a backup.')) return
    await clearHistory()
    setMsg('All history deleted.')
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 space-y-8">
      <h1 className="text-xl text-zinc-100">Data</h1>
      <p className="text-sm text-zinc-500">Everything lives in this browser's IndexedDB. Export regularly if you care about it.</p>
      <div className="flex flex-wrap gap-3">
        <button className={btn} onClick={() => exportAs('json')}>Export JSON</button>
        <button className={btn} onClick={() => exportAs('csv')}>Export CSV</button>
        <label className={`${btn} cursor-pointer`}>
          Import JSON
          <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />
        </label>
      </div>
      <button className="px-4 py-2 rounded border border-red-900 text-red-400 hover:border-red-700 text-sm" onClick={onReset}>
        Reset all data
      </button>
      {msg && <p className="text-sm text-zinc-300">{msg}</p>}
    </div>
  )
}
