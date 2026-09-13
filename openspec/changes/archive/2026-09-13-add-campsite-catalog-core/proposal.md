## Why

There is no place in Fargopolis to record the campsites we have stayed at. This
change adds the first slice of a place-centric camping catalog: create, browse,
edit, and delete campsites with their location, region, drive time, site
character, and free-form notes. Nested trip history, photos, and interactive
maps ship in follow-on changes.

## What Changes

- New `camping` API vertical: a `FargopolisCampsites` DynamoDB table (one item
  per campsite) plus a Python Lambda and HTTP API routes registered on the
  shared `HttpApi`.
- Campsite fields: `name`, `lat`/`lng` (entered by pasting coordinates),
  `region` (a selectable city/locality such as "Breckenridge" or "Lyons",
  chosen from previously used values or typed fresh), `park` (optional specific
  site name), `travelTimeMinutes` (drive time from home), `dyrtUrl` (link to a
  The Dyrt listing), `firepit` (yes/no/unknown), `views` / `privacy` / `space`
  (optional 1–5 ratings), and `notes` (free-form).
- New frontend section at `/camping` (catalog grid) and `/camping/:id`
  (detail + edit), a `Camping` nav entry, and a `Camping` entry in the
  portfolio `PROJECTS` list.
- Location display is a "View on Google Maps" link built from the stored
  coordinates. No map rendering in this change.
- Reads are public; create/update/delete require a signed-in Clerk user, matching
  the recipes vertical.

## Capabilities

### New Capabilities

- `campsite-catalog`: browsing and managing a catalog of campsites, each
  describing one physical place we have camped — its location, region, drive
  time, site character, and notes.

### Modified Capabilities

<!-- None. This is a new vertical. -->

## Impact

- **New infra**: `infrastructure/lib/constructs/campsites-construct.ts`,
  `infrastructure/lambdas/camping/` (`handler.py`, `requirements.txt`),
  `infrastructure/lib/constructs/camping-api-routes-construct.ts`; wired into
  `infrastructure/lib/stacks/fargopolis-api-stack.ts` with a `CfnOutput` for the
  table name. Deploys via `FargopolisApi`.
- **New frontend**: `src/models/Campsite.ts`, `src/pages/CampingPage.tsx`,
  `src/pages/CampsiteDetailPage.tsx`, `src/components/camping/*`; routes added to
  `src/App.tsx`; nav entry in `src/components/navigation/Navbar.tsx`; portfolio
  entry in `src/constants/Projects.tsx`. All API calls go through
  `RequestManager`.
- **No new dependencies.** Leaflet and mapping arrive in `add-campsite-maps`.
- **Downstream changes build on this**: `add-campsite-visits`,
  `add-campsite-photos`, and `add-campsite-maps` all extend the table item, the
  `camping` Lambda, and `CampsiteDetailPage` created here.
