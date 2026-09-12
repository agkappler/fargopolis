## 1. Lambda — visit CRUD

- [ ] 1.1 In `infrastructure/lambdas/camping/handler.py`, add a `_visit_from_body` builder that validates `startDate` (parseable ISO date), `endDate` (optional, `>= startDate`), `rating` (optional int 1–5), coerces `people` to a string list, and assigns a ULID `visitId` when absent.
- [ ] 1.2 Add `_recompute_visit_summary(visits)` returning `(visitCount, lastVisitDate | None)`.
- [ ] 1.3 Implement `POST /api/addVisitToCampsite/{campsiteId}` — `require_clerk_writer`; load campsite (404 if absent); append visit; `update_item` `SET visits, visitCount, lastVisitDate ADD version :one` with `ConditionExpression "version = :old"`; return updated campsite.
- [ ] 1.4 Implement `POST /api/updateVisit` — body `campsiteId`, `visitId`, fields; replace the matching visit (404 if campsite or visit absent); same conditional update; return updated campsite.
- [ ] 1.5 Implement `POST /api/deleteVisit` — body `campsiteId`, `visitId`; drop the visit; `REMOVE lastVisitDate` when the list empties; same conditional update; return updated campsite.
- [ ] 1.6 Map `ConditionalCheckFailedException` to 409 (stale `version`) when the campsite exists, 404 when it does not.
- [ ] 1.7 Register the three routes in `infrastructure/lib/constructs/camping-api-routes-construct.ts`.

## 2. Lambda — read responses

- [ ] 2.1 `GET /api/campsite/{campsiteId}` — include `visits` sorted by `startDate` descending.
- [ ] 2.2 `GET /api/campsites` — include `visitCount` (default 0) and `lastVisitDate` (omit when absent) from the projected GSI item.
- [ ] 2.3 Ensure `POST /api/createCampsite` seeds `visits: []`, `visitCount: 0`, and no `lastVisitDate`.

## 3. Frontend — models

- [ ] 3.1 Add `fargopolis-web/src/models/Visit.ts` (`visitId`, `startDate`, `endDate?`, `people: string[]`, `notes`, `weather?`, `rating?`).
- [ ] 3.2 Extend `fargopolis-web/src/models/Campsite.ts` with `visits: Visit[]`, `visitCount: number`, `lastVisitDate?: string`.

## 4. Frontend — visit UI

- [ ] 4.1 Add `fargopolis-web/src/components/camping/VisitForm.tsx` — start/end date inputs, `people` name-chips input, `weather`, `rating` (1–5), `notes`; posts to add/update routes; re-`mutate`s the campsite SWR key; surfaces a 409 as a "reload and retry" toast.
- [ ] 4.2 Add `fargopolis-web/src/components/camping/VisitTimeline.tsx` — visits newest-first with formatted date range ("Sep 1–4, 2025" / "one night"), attendees, weather, rating, notes; edit/delete affordances gated on sign-in.
- [ ] 4.3 Mount `VisitTimeline` + add-visit control on `fargopolis-web/src/pages/CampsiteDetailPage.tsx`.
- [ ] 4.4 Update `fargopolis-web/src/components/camping/CampsiteCard.tsx` to show `"{visitCount} stays · last {Mon YYYY}"` when `visitCount > 0`.

## 5. Verification

- [ ] 5.1 `cd fargopolis-web && pnpm build && pnpm lint` clean.
- [ ] 5.2 `cd infrastructure && npx cdk diff FargopolisApi` shows only Lambda + route changes — no table or GSI diff.
- [ ] 5.3 Manual: add three visits with different dates to one campsite; confirm timeline order (newest first), card shows "3 stays · last <month>", deleting the newest updates `lastVisitDate`, editing attendees persists chips, and an out-of-range rating / reversed date range is rejected.
- [ ] 5.4 Run `openspec validate add-campsite-visits --strict`.
