## Why

A campsite is a place we return to. `add-campsite-catalog-core` records the
place; this change records each **stay** at it — when we went, who came, the
weather, how it rated, and trip notes — so the catalog becomes a trip history,
not just a directory.

## What Changes

- Add a `visits` list to each campsite item. A visit has: `visitId`,
  `startDate`, optional `endDate` (absent = single night), `people` (list of
  named attendees), `notes` (free-form), optional `weather` (short free-form),
  and optional `rating` (1–5 for that stay).
- New `camping` Lambda routes: `POST /api/addVisitToCampsite/{campsiteId}`,
  `POST /api/updateVisit`, `POST /api/deleteVisit` — all guarded by the existing
  `version` optimistic-concurrency attribute.
- The Lambda maintains denormalized `visitCount` and `lastVisitDate` on the
  campsite item (and its GSI projection) on every visit write, so the catalog
  card can show "3 stays · last Sep 2025" without loading each campsite.
- `GET /api/campsites` gains `visitCount` and `lastVisitDate`;
  `GET /api/campsite/{id}` gains the full `visits` array (newest first).
- `CampsiteDetailPage` gains a visit timeline with add/edit/delete, a people
  chips input, and per-visit rating/weather display. `CampsiteCard` shows the
  visit count and last-visited date.

## Capabilities

### New Capabilities

- `campsite-visits`: recording and displaying the history of stays at a
  campsite — dates, attendees, weather, rating, and notes per visit — including
  the visit-derived summary fields (`visitCount`, `lastVisitDate`) that the
  catalog list and campsite detail responses expose.

### Modified Capabilities

<!-- None. The core `campsite-catalog` spec's list/detail requirements are
     additively extended by the new `campsite-visits` capability rather than
     rewritten; nothing in the core behavior contract is removed or changed. -->

## Impact

- **Depends on `add-campsite-catalog-core`** (table, `camping` Lambda, GSI with
  `visitCount`/`lastVisitDate` already in the projection, `version` attribute,
  `CampsiteDetailPage`, `CampsiteCard`).
- **Infra**: edits `infrastructure/lambdas/camping/handler.py` only. No table or
  GSI change — the projection was forward-declared in the core change.
- **Frontend**: edits `src/pages/CampsiteDetailPage.tsx`,
  `src/components/camping/CampsiteCard.tsx`, `src/models/Campsite.ts`; adds
  `src/models/Visit.ts` and `src/components/camping/VisitForm.tsx` +
  `VisitTimeline.tsx`.
- **No new dependencies.**
- Photos attach to visits in the follow-on `add-campsite-photos` change.
