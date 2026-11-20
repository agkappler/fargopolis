## Context

See `proposal.md` - Why / What Changes for motivation and scope. This is a single-user, low-write-volume personal tool (not a multi-tenant product), which relaxes some of the DynamoDB hot-partition concerns in `CLAUDE.md` that matter at higher scale. The existing `bounties` vertical (`infrastructure/lib/constructs/bounties-construct.ts`, `infrastructure/lambdas/bounties/handler.py`, `infrastructure/lib/constructs/bounties-api-routes-construct.ts`) is the reference pattern for how a new vertical plugs into the shared `HttpApi` and stack.

## Goals / Non-Goals

**Goals:**
- Land a new `quests` vertical (catalog, points ledger/balance, rewards, redemption) using the established per-vertical pattern.
- Keep the data model additive-friendly so a later change can introduce cadence/due-date scheduling on catalog items without migrating existing data.
- Make `fargopolis-web` installable as a PWA.

**Non-Goals:**
- Scheduling/recurrence logic itself (future change).
- Any multi-user or high-throughput concerns — this is built for one user.
- Full offline support for data (only the static app shell is cached; API calls still need network).

## Decisions

### Data model: four tables, one ledger
- **`QuestCatalog`** — PK `questId`. Attributes: `name`, `description`, `pointValue`, `active`, `createdAt`, `updatedAt`. No `cadence`/`nextDueAt` attributes are written or read in this phase. Because DynamoDB is schemaless, "reserving" these fields requires no table change now — a future change can simply start writing/reading them on items that have none (treated as "not scheduled"), with no backfill or migration needed.
- **`QuestLedger`** — PK `ledgerId` (generated id). Attributes: `type` (`COMPLETION` | `REDEMPTION`), `pointsDelta` (positive for a completion, negative for a redemption), `occurredAt` (ISO 8601), and a reference to the source (`questId` or `rewardId`). A GSI (`ChronologicalIndex`) with a constant partition key and `occurredAt` as sort key supports the "history over time" query via `Query` instead of `Scan` — acceptable at this write volume (one user, a handful of events/day), called out as a scale limitation below rather than designed away.
- **`QuestBalance`** — a single-item table (PK `balanceId`, fixed value), attribute `total`. Kept separate from summing the ledger on every read, per the proposal.
- **`QuestRewards`** — PK `rewardId`. Attributes: `name`, `description`, `pointCost`, `active`.

One ledger table (not two) for completions and redemptions: both are "point events" and the history view needs one chronological feed of both, so a single table with a `type` discriminator avoids a merge-and-sort across two tables on every history read.

### Atomicity: balance + ledger via TransactWriteItems
Each completion or redemption writes a new `QuestLedger` item and updates `QuestBalance.total` in one `TransactWriteItems` call (ledger write is a `Put`, balance update is an `Update` with `ADD`/`ConditionExpression` guarding against a negative balance on redemption). This matches `CLAUDE.md`'s guidance to use transactions only for small, well-defined atomic updates — exactly this case — and is what keeps `quest-points`' "balance stays consistent with history" requirement true by construction rather than by reconciliation.

### Auth: all quest routes require a signed-in writer
Unlike reference-data verticals (recipes, dnd) that allow optionally-authenticated reads, quest data (catalog, balance, history, rewards) is personal — every route, reads included, goes through `require_clerk_writer()`. The frontend calls these exclusively via `RequestManager`'s `post`/`put`/`delete`/authenticated-`get` family (never the token-optional `get`).

### PWA: `vite-plugin-pwa` with `generateSW`
Rather than hand-writing a manifest and service worker, use `vite-plugin-pwa`'s `generateSW` strategy: it generates a versioned manifest and a Workbox service worker that precaches the build's static assets, with cache-busting and `skipWaiting`/`clientsClaim` handled by the plugin on every build. This avoids maintaining a hand-rolled cache list that silently goes stale after a deploy. App icons start as a simple placeholder asset (192px/512px) generated as part of this change; swapping in real artwork later is a non-breaking asset replacement.

## Risks / Trade-offs

- **Ledger GSI uses a constant partition key** → fine for one user's write volume, but would be a hot-partition anti-pattern at any real scale. Mitigation: explicitly out of scope to design around; revisit if this vertical ever needs more than one user.
- **Service worker can serve a stale app shell right after a deploy** → mitigated by `vite-plugin-pwa`'s automatic precache manifest versioning plus `skipWaiting`/`clientsClaim`, so the new shell takes over on next load instead of being stuck behind an old cache.
- **Reserved-but-unused scheduling fields invite scope creep into this change** → mitigated by not implementing any read/write path for `cadence`/`nextDueAt` here; they're a documented intent for the next change, not code in this one.

## Migration Plan

Purely additive: new DynamoDB tables/constructs, a new Lambda, a new routes construct registered on the existing shared `HttpApi`, and new frontend routes/components. No existing `bounties` table, Lambda, route, or component is touched. Deploy order follows the existing pattern: `FargopolisApi` (new constructs + `CfnOutput`s) then `FargopolisFrontend` (new PWA assets + quests UI, pointed at the already-deployed API). Rollback is a straightforward redeploy of the previous stack versions; new tables use `RemovalPolicy.RETAIN` per convention, so a stack rollback never silently drops quest data.
