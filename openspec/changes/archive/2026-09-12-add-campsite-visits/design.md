## Context

See `add-campsite-catalog-core` — proposal.md and design.md. That change creates
the `FargopolisCampsites` table with one item per campsite, a `version`
attribute initialised to `0`, and a `CampsitesByNameIndex` GSI whose `INCLUDE`
projection already lists `visitCount` and `lastVisitDate`. This change only
edits `infrastructure/lambdas/camping/handler.py` and the frontend detail
view/card; there is no table or GSI change.

The recipes vertical already nests a mutable list (`ingredients`) on its
aggregate item and guards it with `ADD version :one` + a conditional write.
Visits follow that exact pattern.

## Goals / Non-Goals

**Goals:**

- Visits stored as a nested list on the campsite item; one `GetItem` returns the
  whole detail page.
- `visitCount` / `lastVisitDate` recomputed from the list on every visit write
  so the catalog card never loads individual campsites.
- Optimistic-concurrency safety equal to recipes' ingredient edits.

**Non-Goals:**

- Photos on visits — `add-campsite-photos` adds `photoIds` to the visit shape.
- Querying visits independently of their campsite, or a "all visits across all
  campsites" feed.
- People as first-class entities — attendees are plain strings (there is no
  people table anywhere in the repo).

## Decisions

### Visit shape

```
visitId    ULID
startDate  "YYYY-MM-DD"        (required)
endDate    "YYYY-MM-DD" | absent   (>= startDate; absent = single night)
people     string[]            (attendee names; may be empty)
notes      string              (free-form; may be empty)
weather    string | absent     (short free-form, e.g. "clear, 40s at night")
rating     1..5 | absent       (overall feel of that stay)
```

Dates are ISO date strings, not timestamps — nights camped, not moments.
Validation in the Lambda: `startDate` parseable; `endDate` (if present) `>=`
`startDate`; `rating` (if present) an integer in `1..5`. Client mirrors this and
also renders a friendly range ("Sep 1–4, 2025" / "one night").

### Routes and concurrency (recipes ingredient pattern)

| Method + path | Body | Effect |
| --- | --- | --- |
| `POST /api/addVisitToCampsite/{campsiteId}` | visit fields | append visit, bump `version`, recompute summary |
| `POST /api/updateVisit` | `campsiteId`, `visitId`, changed fields | replace that visit in the list, bump `version`, recompute summary |
| `POST /api/deleteVisit` | `campsiteId`, `visitId` | drop that visit, bump `version`, recompute summary |

Each mutation: read the item (or accept a client-supplied `version`), modify the
`visits` list in the handler, then `update_item` with
`ConditionExpression "version = :oldVersion"` and
`UpdateExpression "SET visits = :visits, visitCount = :vc, lastVisitDate = :lvd
ADD version :one"` (removing `lastVisitDate` via `REMOVE` when the list becomes
empty). `ConditionalCheckFailedException` → 409 for a stale write, 404 when the
campsite is absent — the handler distinguishes by first checking existence.

Alternative considered: child items (`PK = campsiteId`, `SK = VISIT#<ulid>`) with
a transactional counter. Rejected — visits are always shown with the parent,
never alone; the nested list matches recipes and needs no transactions at this
scale.

### Summary fields recomputed, never incremented

`visitCount = len(visits)` and `lastVisitDate = max(v.startDate for v in
visits)` are derived from the post-mutation list on every write, not adjusted
by deltas. This is self-healing (a manual data fix can't drift the counter) and
trivially correct for a handful of visits per site. Both are written into the
top-level item, so the GSI projection picks them up automatically.

### API responses

- `GET /api/campsites`: add `visitCount` (default 0) and `lastVisitDate`
  (optional) to each list entry, read straight from the projected GSI item.
- `GET /api/campsite/{id}`: add `visits`, sorted `startDate` descending in the
  handler before returning.
- Create-campsite (from the core change) continues to start with `visits: []`,
  `visitCount: 0`, no `lastVisitDate`.

### Frontend

- `src/models/Visit.ts`; extend `src/models/Campsite.ts` `visits: Visit[]`,
  `visitCount`, `lastVisitDate`.
- `src/components/camping/VisitForm.tsx` — date range inputs, a name-chips
  input for `people` (Chakra `Combobox` with `multiple` + `allowCustomValue`, or
  a simple tag-input), `weather`, `rating` (1–5), `notes`. Calls
  `RequestManager.post` to the three routes, then `mutate()` the SWR campsite key.
- `src/components/camping/VisitTimeline.tsx` — renders the sorted visits with
  edit/delete affordances (sign-in gated), mounted on `CampsiteDetailPage`.
- `CampsiteCard.tsx` — show `{visitCount} stays · last {formatMonthYear(lastVisitDate)}`
  when `visitCount > 0`.

## Risks / Trade-offs

- **Whole `visits` list rewritten per edit** → Fine for realistic visit counts
  (tens at most); same characteristic as recipes ingredients. Item stays far
  under 400 KB until photos, and photo *ids* (not blobs) are all that get added
  later.
- **Client must pass a fresh `version`** → `VisitForm` always operates on the
  SWR-fetched campsite and re-`mutate`s after writes; a 409 surfaces a "reload
  and retry" toast rather than corrupting the list.
- **Summary consistency depends on the handler** → Because it is recomputed from
  the list every write, the only way to drift is a write that bypasses the
  handler; there is none.

## Migration Plan

1. Deploy `FargopolisApi` — Lambda code change only; existing campsites keep
   working and simply report `visitCount: 0`.
2. Deploy `FargopolisFrontend` with the timeline UI.
3. Rollback: redeploy the previous Lambda + frontend. Any `visits` already
   written stay on the items harmlessly (the pre-change handler just ignores
   the field); `GET /api/campsite/{id}` from the old code omits them.
