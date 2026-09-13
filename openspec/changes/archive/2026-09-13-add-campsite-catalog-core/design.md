## Context

Fargopolis grows by adding self-similar "verticals" (recipes, bounties, dnd).
Each is a per-domain DynamoDB table + one Python Lambda + a routes construct on
the shared `HttpApi`, with a matching frontend page/components/model and a
`RequestManager` call family. The recipes vertical is the closest reference:
one item per aggregate, a low-cardinality GSI for the "list all" screen, ULID
ids, a `version` attribute for optimistic concurrency on later nested-list
edits, and public reads / Clerk-gated writes. This change follows that shape for
campsites and deliberately stops before trip history, photos, and maps.

## Goals / Non-Goals

**Goals:**

- One `Campsite` aggregate item that later changes extend in place (visits,
  photo ids, cover photo) without a table migration.
- A single `GET /api/campsites` payload rich enough to render the catalog now
  and map pins later, so the map change needs no new read path.
- Region suggestions with zero new storage — derived from the campsites already
  loaded on the client.
- Coordinate entry by paste, parsed client-side, with server-side range
  validation as the backstop.

**Non-Goals:**

- Rendering any map or geocoding a place name (`add-campsite-maps`).
- Trip history / visits and the denormalized visit summary fields
  (`add-campsite-visits`).
- Photo upload, galleries, and `coverPhotoId` writes (`add-campsite-photos`) —
  the field is only *read* here if already present.
- Multi-user ownership or sharing; this is a single household catalog.

## Decisions

### One item per campsite, extended in place

`FargopolisCampsites` table, partition key `campsiteId` (ULID), on-demand
capacity, `RemovalPolicy.RETAIN`, stable logical id override — identical
scaffolding to `RecipesConstruct`. Character fields live at the top level.
`visits` (list), `photoIds`, `coverPhotoId`, `visitCount`, `lastVisitDate` are
**not written here**; later changes add them to the same item. A `version`
attribute is initialised to `0` on create so the visits change can do
`ADD version :one` + conditional writes without backfilling.

Alternative considered: separate `Campsite` and `Visit` tables. Rejected —
visits are always rendered with their parent and never queried alone, matching
the repo's "nest children under the parent item" guidance; a single `GetItem`
returns the whole page.

### GSI `CampsitesByNameIndex` for the catalog

Mirror `RecipesByNameIndex`: partition key `entityType` (constant
`"CAMPSITE"`), sort key `nameSortKey` (`lower(strip(name)) + "#" + campsiteId`,
rewritten on every name change). `INCLUDE` projection:
`name, lat, lng, region, park, travelTimeMinutes, dyrtUrl, firepit, views,
privacy, space, coverPhotoId, visitCount, lastVisitDate`. This is everything the
catalog card and a map pin need, so listing never triggers per-item `GetItem`s.
`coverPhotoId`, `visitCount`, and `lastVisitDate` are **forward-declared** in the
projection now — items won't carry them until `add-campsite-photos` /
`add-campsite-visits` write them — so those changes never have to recreate the
GSI (DynamoDB cannot alter a projection in place).

Hot-partition note: every campsite shares one GSI partition, exactly like
recipes. Acceptable at personal scale; documented in the construct.

Alternative considered: `Scan` with no GSI. Rejected — the repo standard is
"prefer Query, reserve Scan for admin/batch", and the ordered-by-name
requirement wants a sort key.

### Routes (recipes-style flat paths + one REST delete)

| Method + path | Auth | Purpose |
| --- | --- | --- |
| `GET /api/campsites` | none | catalog list (GSI query) |
| `GET /api/campsite/{campsiteId}` | none | one campsite (`GetItem`) |
| `POST /api/createCampsite` | Clerk writer | create |
| `POST /api/updateCampsite` | Clerk writer | update (id in body) |
| `DELETE /api/campsite/{campsiteId}` | Clerk writer | delete |

`GET`/`POST` names copy the recipes convention. Delete uses `DELETE` because
`RequestManager.delete` already exists and recipes set no precedent either way.
The handler dispatches on `method + rawPath` like the other handlers, calls
`require_clerk_writer` on mutations, and reuses `shared.lambda_utils`
(`generate_ulid`, `json_response`, `parse_body`, `table_from_env`).

### Coordinate parsing lives on the client; server validates range

A `parseCoordinates(text)` helper in the frontend accepts
`"<lat>, <lng>"` / `"<lat> <lng>"`, optional `°` symbols, and an optional
`N/S/E/W` suffix per component (S/W ⇒ negative). It returns `{lat, lng}` or a
parse error; the form blocks submit on error and shows the resolved pair back to
the user. The Lambda independently rejects `lat ∉ [-90, 90]` or
`lng ∉ [-180, 180]` so a bad direct API call can't store garbage. Coordinates
are stored as numbers (DynamoDB `Decimal`); `shared.lambda_utils._json_default`
already serialises `Decimal` back to JSON.

### Region combobox derived from loaded data

The catalog page already fetches every campsite. The form computes
`distinct(campsites.map(c => c.region).filter(Boolean))`, sorts it, and feeds a
free-text combobox (Chakra UI v3 `Combobox` with `allowCustomValue`, matching
the app's `ComboBoxInput`). No `regions` table, no endpoint. New values simply
appear as suggestions once their campsite is saved and the list refetches.

### `travelTimeMinutes` stored as an integer

Stored as whole minutes; the form accepts either a plain number or an
`"<h>h <m>m"` string and normalises to minutes, and the UI renders minutes back
as `"2h 15m"`. Keeping it numeric makes a future "closest sites" sort trivial.

### Frontend surface

- `src/models/Campsite.ts` — typed shape incl. optional `visits?`, `photoIds?`,
  `coverPhotoId?` so later changes don't reshape the model.
- `src/pages/CampingPage.tsx` — SWR `GET /api/campsites`, `AddModelCard` +
  `CampsiteCard` grid (same pattern as `RecipesPage`).
- `src/pages/CampsiteDetailPage.tsx` — SWR `GET /api/campsite/{id}`, field
  display, `CampsiteForm` for edit, delete with confirm, external
  `https://www.google.com/maps?q=<lat>,<lng>` link.
- `src/components/camping/` — `CampsiteCard`, `CampsiteForm`,
  `helpers/parseCoordinates.ts` (+ colocated unit-free assertions kept simple).
- `src/App.tsx` routes `/camping` and `/camping/:id`;
  `Navbar` `NAV_ITEMS` gains `{ label: "Camping", path: "/camping" }`;
  `src/constants/Projects.tsx` gains `Project.Camping = 4` and a `PROJECTS`
  entry (url `/camping`).

## Risks / Trade-offs

- **Single GSI partition for all campsites** → Same trade-off recipes already
  accepts; personal-scale dataset, revisit only if it grows orders of magnitude.
- **Region free-text drift** ("Lyons" vs "lyons, CO") → Suggestions nudge toward
  reuse; acceptable for one editor. A later cleanup/normalise pass is cheap
  because region is just a string.
- **Coordinate paste formats are open-ended** → The helper targets the handful
  of formats Google Maps / GPS apps actually emit; anything else fails closed
  with an inline error rather than silently mis-parsing. `DELETE` verb differs
  from recipes' all-POST style → minor inconsistency, but `RequestManager`
  already supports it and it reads clearer.
- **Later changes edit the same files** (`camping/handler.py`,
  `fargopolis-api-stack.ts`, `CampsiteDetailPage.tsx`) → Expected; the PRs are
  sequenced (`core → visits → photos → maps`) so each rebases on the last.

## Migration Plan

1. Deploy `FargopolisApi` — creates the table + GSI and the new routes
   (additive; no other vertical touched).
2. Deploy `FargopolisFrontend` with the new page, route, nav, and portfolio
   entry.
3. Rollback: `cdk deploy` the previous revision. The table has
   `RemovalPolicy.RETAIN`, so a stack rollback keeps any data already entered;
   re-deploying forward reattaches it.
