## 1. Infrastructure: data layer

- [ ] 1.1 Add `infrastructure/lib/constructs/quests-construct.ts` defining `QuestCatalog`, `QuestLedger` (with a `ChronologicalIndex` GSI), `QuestBalance`, and `QuestRewards` tables, following `bounties-construct.ts` conventions (stable override logical IDs, `PAY_PER_REQUEST`, PITR enabled, `RemovalPolicy.RETAIN`)

## 2. Backend: quests Lambda

- [ ] 2.1 Create `infrastructure/lambdas/quests/` with `handler.py` + `requirements.txt`; read auth via `shared.lambda_utils.authorizer_lambda_context()` / `require_clerk_writer()`
- [ ] 2.2 Implement catalog endpoints: create, edit, archive, list active items (reject non-positive point values)
- [ ] 2.3 Implement "complete catalog item" endpoint: reject archived items; write a `QuestLedger` COMPLETION item and increment `QuestBalance` via one `TransactWriteItems` call
- [ ] 2.4 Implement "get balance" endpoint
- [ ] 2.5 Implement "get history" endpoint (query `ChronologicalIndex`, ordered by `occurredAt`)
- [ ] 2.6 Implement rewards endpoints: create, edit, archive, list active rewards (reject non-positive point costs)
- [ ] 2.7 Implement "redeem reward" endpoint: reject archived rewards and insufficient balance; write a `QuestLedger` REDEMPTION item and decrement `QuestBalance` via one `TransactWriteItems` call with a condition guarding against a negative balance
- [ ] 2.8 Add pytest coverage (mirroring `infrastructure/lambdas/bounties/tests`) for: validation errors, archived items hidden from active lists, insufficient-balance redemption rejection, and balance-matches-history consistency

## 3. Infrastructure: routes + stack wiring

- [ ] 3.1 Create `infrastructure/lib/constructs/quests-api-routes-construct.ts` registering integrations on the existing shared `HttpApi` (mirror `bounties-api-routes-construct.ts`)
- [ ] 3.2 Wire `QuestsConstruct` + `QuestsApiRoutesConstruct` into `infrastructure/lib/stacks/fargopolis-api-stack.ts`, and add `CfnOutput`s for the new table names

## 4. Frontend: API client

- [ ] 4.1 Add `RequestManager` methods for the quests endpoints (catalog CRUD, complete, balance, history, rewards CRUD, redeem), using the authenticated call family throughout

## 5. Frontend: UI

- [ ] 5.1 Add `fargopolis-web/src/components/quests/` with a catalog list + tap-to-complete card
- [ ] 5.2 Add a points balance / history view (list or simple chart of events over time)
- [ ] 5.3 Add a rewards list + redeem action
- [ ] 5.4 Add catalog item and reward create/edit/archive forms, mirroring `BountyForm`/`BountyCategoryForm`
- [ ] 5.5 Add quests route(s) and a navigation entry
- [ ] 5.6 Add Vitest + Testing Library coverage for the new components

## 6. PWA

- [ ] 6.1 Add `vite-plugin-pwa` and configure the `generateSW` strategy in `fargopolis-web/vite.config.ts`
- [ ] 6.2 Add placeholder app icons (192px/512px) and manifest metadata (name, theme colors, `start_url`, standalone display)
- [ ] 6.3 Manually verify: install prompt appears, installed app launches standalone, and the cached app shell loads with no network connectivity

## 7. Verification

- [ ] 7.1 Run `pnpm build`, `pnpm lint`, and `pnpm test` in `fargopolis-web`
- [ ] 7.2 Run `ruff check` and `pytest` for `infrastructure/lambdas/quests`
- [ ] 7.3 Run `npx cdk synth` / `npx cdk diff FargopolisApi` to confirm the new constructs synthesize cleanly alongside the existing stack
