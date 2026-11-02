import { useEffect, useState } from 'react'
import { rankWeakSpots } from './analytics/weakSpots'
import type { GameConfig } from './engine/useGame'
import { enabledOps } from './generator/problems'
import type { DrillTarget } from './generator/practice'
import { getAllProblems, loadSettings, saveSession, saveSettings } from './storage/db'
import type { GameSettings, ProblemRecord, SessionRecord } from './types'
import { DataScreen } from './ui/DataScreen'
import { EndScreen } from './ui/EndScreen'
import { GameScreen } from './ui/GameScreen'
import { HistoryScreen } from './ui/HistoryScreen'
import { SessionReport } from './ui/SessionReport'
import { SettingsScreen } from './ui/SettingsScreen'

type View =
  | { name: 'settings' }
  | { name: 'game'; config: GameConfig; key: number }
  | { name: 'end'; session: SessionRecord; problems: ProblemRecord[]; config: GameConfig }
  | { name: 'report'; session: SessionRecord; problems: ProblemRecord[]; back: View }
  | { name: 'history' }
  | { name: 'data' }

// Practice targets come from your normal (non-practice) history only.
async function drillTargets(settings: GameSettings): Promise<{ targets: DrillTarget[]; labels: string[] }> {
  const history = (await getAllProblems()).filter((p) => !p.practice)
  const ops = enabledOps(settings)
  const spots = rankWeakSpots(history, 8).filter((s) => ops.includes(s.slice.op))
  return {
    targets: spots.map((s) => ({ match: s.slice.match, weight: s.ratio })),
    labels: spots.map((s) => s.slice.label),
  }
}

export default function App() {
  const [settings, setSettings] = useState<GameSettings | null>(null)
  const [view, setView] = useState<View>({ name: 'settings' })
  const [drillLabels, setDrillLabels] = useState<string[]>([])

  useEffect(() => {
    loadSettings().then(setSettings)
  }, [])

  if (!settings) return null

  const updateSettings = (s: GameSettings) => {
    setSettings(s)
    saveSettings(s)
  }

  const start = async (practice: boolean) => {
    let targets: DrillTarget[] = []
    if (practice) {
      const d = await drillTargets(settings)
      targets = d.targets
      setDrillLabels(d.labels)
    }
    setView({ name: 'game', config: { settings, practice, targets }, key: Date.now() })
  }

  const finishGame = async (config: GameConfig, session: SessionRecord, problems: ProblemRecord[]) => {
    await saveSession(session, problems)
    setView({ name: 'end', session, problems, config })
  }

  const inGame = view.name === 'game'

  return (
    <div className="min-h-full flex flex-col">
      {!inGame && (
        <nav className="flex gap-6 px-6 py-4 text-sm text-zinc-500">
          <NavLink active={view.name === 'settings' || view.name === 'end'} onClick={() => setView({ name: 'settings' })}>Play</NavLink>
          <NavLink active={view.name === 'history' || view.name === 'report'} onClick={() => setView({ name: 'history' })}>Reports</NavLink>
          <NavLink active={view.name === 'data'} onClick={() => setView({ name: 'data' })}>Data</NavLink>
        </nav>
      )}

      <main className="flex-1 flex flex-col">
        {view.name === 'settings' && (
          <SettingsScreen settings={settings} onChange={updateSettings} onStart={() => start(false)} onPractice={() => start(true)} />
        )}

        {view.name === 'game' && (
          <GameScreen
            key={view.key}
            config={view.config}
            drillLabels={view.config.practice ? drillLabels : []}
            onFinish={(s, p) => finishGame(view.config, s, p)}
            onQuit={() => setView({ name: 'settings' })}
            onRestart={() => setView({ ...view, key: Date.now() })}
          />
        )}

        {view.name === 'end' && (
          <EndScreen
            session={view.session}
            onReport={() => setView({ name: 'report', session: view.session, problems: view.problems, back: view })}
            onAgain={() => setView({ name: 'game', config: view.config, key: Date.now() })}
            onSettings={() => setView({ name: 'settings' })}
          />
        )}

        {view.name === 'report' && (
          <SessionReport session={view.session} problems={view.problems} onBack={() => setView(view.back)} />
        )}

        {view.name === 'history' && (
          <HistoryScreen onOpenSession={(session, problems) => setView({ name: 'report', session, problems, back: { name: 'history' } })} />
        )}

        {view.name === 'data' && <DataScreen />}
      </main>
    </div>
  )
}

function NavLink({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={active ? 'text-zinc-100' : 'hover:text-zinc-300'}>
      {children}
    </button>
  )
}
