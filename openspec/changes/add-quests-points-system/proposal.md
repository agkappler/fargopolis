## Why

There's no lightweight way to track recurring personal tasks, accumulate points for doing them, and redeem those points for rewards (including something fun like going out to eat) from a phone. The existing `bounties` vertical is a one-off, deadline-driven task list (`ACTIVE`/`COMPLETE`/`OVERDUE`) with no notion of points or repeatable completions, so it doesn't fit this use case — it stays as-is.

## What Changes

- Add a new `quests` API vertical (DynamoDB tables, Lambda, routes construct) following the existing per-vertical pattern (bounties/recipes/dnd), wired into the shared `HttpApi`.
- Add a **task catalog**: a flat, user-managed list of repeatable task items (name, description, point value, active flag). Items can be completed any number of times; no scheduling/recurrence is implemented or exposed yet, but the item schema reserves optional fields (e.g. cadence, next-due-date) so a later change can add scheduled/recurring tasks without a breaking migration.
- Add a **completion ledger**: an append-only record of each time a catalog item is completed, used both as an audit trail and as the source for a points-over-time history view.
- Add a **point balance**: a single running total (one pool, no multi-currency) updated atomically alongside each completion or redemption.
- Add a **rewards catalog**: user-managed redeemable items (name, point cost, active flag). "Going out to eat" is just a reward entry with a higher cost — no special-casing.
- Add **redemption**: redeeming a reward debits the point balance and records a redemption entry.
- Make `fargopolis-web` installable as a PWA (web app manifest, icons, service worker) so the new quests UI can be used from the phone's home screen. This is app-wide infrastructure, introduced here because it's the primary motivation for this change.
- Add new mobile-first frontend screens for the catalog (tap to complete), point balance/history, and rewards/redeem, under a new `quests` component folder, calling the API through `RequestManager`.

Non-goals (explicitly out of scope for this change):
- Scheduled/recurring tasks (cadence, due dates, overdue tracking) — a future change builds on the reserved schema fields.
- Any changes to the existing `bounties` vertical or its data.
- Multiple point currencies.
- A native app or OS home-screen widget (not feasible for an installed PWA without a native wrapper).

## Capabilities

### New Capabilities
- `quest-catalog`: user-managed catalog of repeatable task items (create/edit/archive, point value), with reserved-but-unused scheduling fields for a future phase.
- `quest-points`: logging a catalog item as completed, maintaining a single running point balance, and viewing completion/point history over time.
- `quest-rewards`: user-managed catalog of redeemable rewards and redeeming a reward against the point balance.
- `pwa-install`: fargopolis-web is installable to a device home screen (manifest, icons, service worker) and launches full-screen from the home-screen icon.

### Modified Capabilities
(none — `bounties` is unchanged, and no existing specs in `openspec/specs/` are affected)

## Impact

- **New DynamoDB tables/constructs**: task catalog, completion ledger, point balance, rewards catalog (and redemptions) under `infrastructure/lib/constructs/`, following `bounties-construct.ts` as the reference.
- **New Lambda**: `infrastructure/lambdas/quests/` (`handler.py` + `requirements.txt`), reading auth via `shared.lambda_utils`.
- **New routes construct**: `quests-api-routes-construct.ts`, registered on the existing shared `HttpApi` (no new API Gateway).
- **Stack wiring**: `infrastructure/lib/stacks/fargopolis-api-stack.ts` gains the new constructs and `CfnOutput`s, mirroring how `BountiesConstruct`/`BountiesApiRoutesConstruct` are wired today.
- **Frontend**: new `fargopolis-web/src/components/quests/` vertical, new `RequestManager` calls, and app-wide PWA assets (manifest, icons, service worker) plus any Vite config needed to generate/register them.
- **No changes** to `infrastructure/lambdas/bounties/`, `bounties-construct.ts`, `bounties-api-routes-construct.ts`, or `fargopolis-web/src/components/bounties/`.
