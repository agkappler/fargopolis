## 1. Infrastructure — DynamoDB

- [x] 1.1 Add `infrastructure/lib/constructs/campsites-construct.ts` modeled on `recipes-construct.ts`: table `partitionKey campsiteId` (STRING), `PAY_PER_REQUEST`, PITR on, `RemovalPolicy.RETAIN`, stable logical id override (`FargopolisCampsitesTable`).
- [x] 1.2 Add GSI `CampsitesByNameIndex`: PK `entityType` (STRING), SK `nameSortKey` (STRING), `INCLUDE` projection `name, lat, lng, region, park, travelTimeMinutes, dyrtUrl, firepit, views, privacy, space, coverPhotoId, visitCount, lastVisitDate` (last three forward-declared for later changes so the GSI is never recreated). Document the single-partition hot-key note in a comment.

## 2. Infrastructure — Lambda + routes

- [x] 2.1 Create `infrastructure/lambdas/camping/handler.py` and `requirements.txt` (mirror `recipes`: `boto3.dynamodb.conditions`, `botocore.exceptions`, `shared.lambda_utils`).
- [x] 2.2 Implement `GET /api/campsites` — query `CampsitesByNameIndex` on `entityType = "CAMPSITE"`, map items to the catalog shape, return ordered by `nameSortKey`.
- [x] 2.3 Implement `GET /api/campsite/{campsiteId}` — `GetItem`, 404 when absent, return full campsite shape.
- [x] 2.4 Implement `POST /api/createCampsite` — `require_clerk_writer`; validate non-empty `name` and `lat ∈ [-90,90]` / `lng ∈ [-180,180]`; assign ULID `campsiteId`; set `entityType`, `nameSortKey`, `version = 0`; `put_item` with `attribute_not_exists(campsiteId)`; return created item.
- [x] 2.5 Implement `POST /api/updateCampsite` — `require_clerk_writer`; `campsiteId` from body; same validation; `update_item` with `attribute_exists(campsiteId)`; rewrite `nameSortKey` when `name` changes; 404 on `ConditionalCheckFailedException`.
- [x] 2.6 Implement `DELETE /api/campsite/{campsiteId}` — `require_clerk_writer`; `delete_item`; return success (idempotent) or 404.
- [x] 2.7 Add shared error handling mirroring `recipes/handler.py` (`json.JSONDecodeError` → 400, `ValueError` → 400, `ClientError` conditional → 404, else 500) and an `OPTIONS` short-circuit.
- [x] 2.8 Add `infrastructure/lib/constructs/camping-api-routes-construct.ts` modeled on `recipes-api-routes-construct.ts`: Python 3.12 arm64 Lambda, shared layer, `CAMPSITES_TABLE_NAME` env, `grantReadWriteData`, `HttpLambdaIntegration`, register the five routes.
- [x] 2.9 Wire into `infrastructure/lib/stacks/fargopolis-api-stack.ts`: instantiate `CampsitesConstruct` and `CampingApiRoutesConstruct`, add `CfnOutput` `CampsitesTableName`.
- [x] 2.10 `./scripts/setup-python-lambdas.sh` run (venv rebuilt); `infrastructure` `npm run build` (tsc) passes; `handler.py` compiles + helper smoke tests pass; `npx cdk synth FargopolisApi` exits 0 with the camping Lambda bundled via Docker.

## 3. Frontend — model + API wiring

- [x] 3.1 Add `fargopolis-web/src/models/Campsite.ts` with all core fields plus optional `visits?`, `photoIds?`, `coverPhotoId?`, `visitCount?`, `lastVisitDate?` placeholders.
- [x] 3.2 Add `fargopolis-web/src/components/camping/helpers/parseCoordinates.ts` — parse `"lat, lng"` / `"lat lng"`, optional `°` and `N/S/E/W` suffixes; return `{ lat, lng }` or an error; reject out-of-range.
- [x] 3.3 Add a `travelTime` helper: parse `"2h 15m"` or a bare number to minutes, and format minutes back to `"2h 15m"`.

## 4. Frontend — catalog + detail pages

- [x] 4.1 Add `fargopolis-web/src/components/camping/CampsiteCard.tsx` — name, region, drive time, firepit/ratings badges; navigates to `/camping/:id`.
- [x] 4.2 Add `fargopolis-web/src/components/camping/CampsiteForm.tsx` — fields for name, coordinate paste (uses `parseCoordinates`, shows resolved pair + inline error), region (Chakra `Combobox` with `allowCustomValue` fed by distinct existing regions), park, drive time, dyrt URL, firepit (yes/no/unknown), views/privacy/space (1–5), notes. Calls `RequestManager.post` create/update.
- [x] 4.3 Add `fargopolis-web/src/pages/CampingPage.tsx` — SWR `GET /api/campsites`, `PageHeader`, `AddModelCard` + `CampsiteCard` grid, mount `CampsiteForm` for create (pattern from `RecipesPage`).
- [x] 4.4 Add `fargopolis-web/src/pages/CampsiteDetailPage.tsx` — SWR `GET /api/campsite/{id}`, render all fields, "View on Google Maps" link (`https://www.google.com/maps?q=lat,lng`), edit via `CampsiteForm`, delete via `RequestManager.delete` with a confirm dialog, `ErrorMessage` on 404.
- [x] 4.5 Register routes `/camping` and `/camping/:id` in `fargopolis-web/src/App.tsx`.
- [x] 4.6 Add `{ label: "Camping", path: "/camping" }` to `NAV_ITEMS` in `fargopolis-web/src/components/navigation/Navbar.tsx`.
- [x] 4.7 Add `Project.Camping = 4` and a `PROJECTS` entry (name, description, icon, `url: "/camping"`, status) in `fargopolis-web/src/constants/Projects.tsx`.

## 5. Verification

- [x] 5.1 `fargopolis-web` `pnpm build` (tsc --noEmit + vite build) passes after the MUI→Chakra rebase onto `origin/main` #4. `pnpm lint` reports 5 errors, all pre-existing and in unrelated `components/dnd/*` + `api/dnd5eapi.ts` files (`no-explicit-any`). All new `src/components/camping/*`, `src/pages/Camping*`, and `src/models/Campsite.ts` files lint clean.
- [x] 5.2 `cd infrastructure && npx cdk synth FargopolisApi` exits 0; template contains `FargopolisCampsitesTable` + `CampsitesByNameIndex` GSI, `CampingApi/CampingHandler` Lambda, all five routes (`GET /api/campsites`, `GET|DELETE /api/campsite/{campsiteId}`, `POST /api/createCampsite`, `POST /api/updateCampsite`), scoped IAM, and the `CampsitesTableName` output. `npx cdk diff` against the deployed stack still pending — this environment's credentials can't assume the CDK lookup/deploy roles, so diff falls back to a full-template comparison; re-run with deploy creds before shipping.
- [ ] 5.3 Manual smoke test against a deployed API + running app + Clerk sign-in — deferred to the user. Paste `44.63, -110.72`, confirm list/open/edit/delete, the Google Maps link, region suggestions reuse, and that signed-out users can read but not mutate.
- [x] 5.4 Run `openspec validate add-campsite-catalog-core --strict`.
