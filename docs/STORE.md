# Logit store contract (offline-first) — read before wiring screens to data

The app now has a persistent store (Context + AsyncStorage, seeded with the design
mock data). Wire screens to it so records/plans persist and reflect live.

## Access
```ts
import { useStore, useSyncState } from '../store/StoreContext';       // screens/  (../store)
const { today, records, plans, customActivities,
        addRecord, addPlan, addActivity, completePlan, getRecord, ready } = useStore();
```
- `today` = '2026-06-30' (design reference date; use instead of real Date).
- `records: StoredRecord[]`, `plans: StoredPlan[]` (types in `../store/types`).
- `addRecord(r: Omit<StoredRecord,'id'|'sync'>) => StoredRecord` — new record starts `sync:'pending'`, auto-flips to `'synced'` after ~1.5s.
- `addPlan(p: Omit<StoredPlan,'id'>)`, `addActivity({name,template})`, `completePlan(id)`, `getRecord(id)`.
- `useSyncState()` → 'synced' | 'pending' | 'offline' for `SyncStatusBadge`.

## Types (summary)
```ts
StoredRecord { id, activity, template, dateISO:'YYYY-MM-DD', timeLabel, meta?, rating?,
               companions?, photos?:string[], memo?, fields?:Record<string,string>, sync }
StoredPlan   { id, activity, template, dateISO, timeLabel, place?, memo?, reminder?, done? }
```

## Selectors (`../store/selectors`)
`dday(dateISO, today) -> number` (0=D-DAY), `recordsOn`, `plansOn`,
`upcomingPlans(plans, today)`, `weekStats(records, today) -> {count, km, streak}`.

## Activity resolution
`activities` registry + `colorsFor(template, c)` + `Icon[activities[name].icon]` from
`../data/activities`. A record/plan's `activity` name resolves icon/template/color there.
For custom activities (not in the registry), fall back to the record's own `template`
via `colorsFor` and a default icon (e.g. `Icon.yoga`).

## Nav
`Detail` route now takes `{ activity: string; recordId?: string }`. Pass `recordId` when
navigating from a stored record so Detail can render the real record.

## Rules
- Keep the faithful design layout. Only swap the DATA SOURCE from inline samples to the store.
- Do NOT edit shared components/theme; work locally. Preserve default exports. TS must compile.
