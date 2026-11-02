# Arithmetic tracker

Zetamac-style arithmetic game with per-problem tracking and reports. Everything is stored locally in IndexedDB.

```
npm install
npm run dev     # http://localhost:5199 (fixed port so history stays in one place)
npm test        # vitest
```

## Keys

- In game: type the answer, it advances on its own. `Esc` quits (nothing saved), `r` restarts.
- End screen: `r` or `Enter` plays again, `Esc` goes to settings.

## Layout

```
src/
  types.ts                 shared types and default settings
  lib/random.ts            crypto-backed uniform ints (rejection sampling), weighted pick
  generator/problems.ts    problem generation, settings validation, settings key
  generator/tags.ts        carry/borrow counting and per-problem tags
  generator/practice.ts    drill generator that oversamples weak slices
  engine/attempt.ts        pure keystroke tracking for one problem
  engine/useGame.ts        React hook that runs a timed game
  storage/db.ts            IndexedDB (idb): sessions, problems, saved settings
  storage/exportImport.ts  JSON/CSV export and JSON import
  analytics/stats.ts       median, mean, MIN_SAMPLES gate
  analytics/slices.ts      slice definitions ("×7 with big factor above 50", ...)
  analytics/weakSpots.ts   weak spot ranking
  analytics/report.ts      everything the report screens show
  ui/                      screens and chart components
tests/                     vitest unit tests
```

## Notes

- Problems are written to the database only when the timer runs out. Quitting with `Esc` discards the game.
- The full settings snapshot is stored on the session; each problem stores its session id and a settings key.
- Small/big factor: for multiplication it's the operand from the first/second range. For division `c ÷ a = b`, the divisor `a` is the small factor and the answer `b` is the big one.
- Weak spots compare a slice's median solve time to your overall median, require 5+ samples, and show one slice per family.
- Practice sessions draw about 60% of problems from your top weak slices (weighted by how slow they are) and are excluded from reports and the trend unless you tick "Include practice".
