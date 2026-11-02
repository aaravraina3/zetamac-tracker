// Small numeric helpers shared by the report and weak spot code.

// A stat is only shown once it has at least this many samples.
export const MIN_SAMPLES = 5

export function mean(xs: number[]): number {
  return xs.reduce((s, x) => s + x, 0) / xs.length
}

export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

export interface Summary {
  n: number
  mean: number
  median: number
}

// Returns null when there isn't enough data, so the UI shows "not enough data".
export function summarize(xs: number[]): Summary | null {
  if (xs.length < MIN_SAMPLES) return null
  return { n: xs.length, mean: mean(xs), median: median(xs) }
}

export function groupBy<T, K>(items: T[], key: (t: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>()
  for (const it of items) {
    const k = key(it)
    const arr = m.get(k)
    if (arr) arr.push(it)
    else m.set(k, [it])
  }
  return m
}

export const fmtSec = (ms: number) => `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)}s`
