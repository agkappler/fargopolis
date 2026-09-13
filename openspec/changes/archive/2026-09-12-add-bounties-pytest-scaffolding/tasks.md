## 1. Dependencies

- [x] 1.1 Add `pytest==8.3.4` and `moto[dynamodb]==5.0.28` to `infrastructure/lambdas/requirements-dev.txt`.
- [x] 1.2 Rerun `./scripts/setup-python-lambdas.sh` to refresh the repo `.venv` with the new deps.

## 2. Pytest configuration

- [x] 2.1 Add `infrastructure/lambdas/pytest.ini` with `testpaths = .` and `pythonpath = .` so `shared` imports the same way CDK bundling and `pyrightconfig.json` already resolve it.

## 3. Bounties test fixtures

- [x] 3.1 Create `infrastructure/lambdas/bounties/tests/__init__.py` (empty).
- [x] 3.2 Create `infrastructure/lambdas/bounties/tests/conftest.py`:
  - Set dummy AWS credential/region env vars (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`) before any AWS SDK usage.
  - A function-scoped fixture that starts `moto.mock_aws()`, creates the `BOUNTIES_TABLE_NAME` (`bountyId` partition key) and `BOUNTY_CATEGORIES_TABLE_NAME` (`categoryId` partition key) tables via a moto-mocked `boto3.resource("dynamodb")`, sets those two env vars to the created table names, then loads `bounties/handler.py` via `importlib.util.spec_from_file_location(..., module_name="bounties_handler")` *inside* the active mock context and yields the loaded module (per design.md Decision 2 & 3).
  - A helper `make_event(method, path, body=None, authenticated=False, sub=None)` building an API Gateway HTTP API v2 (payload format 2.0) event dict matching what `handler.py` reads: `requestContext.http.method`, `rawPath`, `body`/`isBase64Encoded`, and `requestContext.authorizer.lambda` (`authenticated`, `sub`) when `authenticated=True`.

## 4. Bounties handler tests

- [x] 4.1 `infrastructure/lambdas/bounties/tests/test_handler.py` — `GET /api/bounties`: empty list on empty table; returns items sorted by `bountyId` after seeding via the fixture's table resource; status defaults to `ACTIVE` when stored status is missing/invalid.
- [x] 4.2 `GET /api/bountyCategories`: empty list; returns seeded categories sorted by `categoryId`.
- [x] 4.3 `POST /api/createBounty`: 401 when `authenticated=False`; 400 when `categoryId` missing; 200 + persisted item (verify via a direct table `get_item`) when authenticated and valid, including `expirationDate` passthrough and status normalization/validation (`ValueError` → 400 for an invalid status string).
- [x] 4.4 `POST /api/updateBounty`: 401 unauthenticated; 400 when `bountyId`/`categoryId` missing; 404 when updating a non-existent `bountyId` (`ConditionalCheckFailedException` path); 200 + updated fields on success.
- [x] 4.5 `POST /api/createBountyCategory`: 401 unauthenticated; 200 + persisted category when authenticated.
- [x] 4.6 Routing edge cases: unknown `route_key` → 404 with `routeKey` in the body; `OPTIONS` → 200 empty body; malformed JSON body on a POST route → 400 (`json.JSONDecodeError` path).

## 5. Documentation & convenience script

- [x] 5.1 Add `infrastructure/lambdas/README.md` documenting: how to run `pytest` from `.venv`, the moto/import pattern from design.md (with the collision-avoidance rationale for `importlib.util.spec_from_file_location`), and the copy-paste steps for adding `tests/` to another vertical (`camping`, `recipes`, `dnd`, `dnd_glossary`, `files`, `clerk_authorizer`).
- [x] 5.2 Add a `test` script to `infrastructure/package.json` (or equivalent) that runs `pytest` against `infrastructure/lambdas/` using the repo `.venv`, so the gate is one command alongside `synth`/`deploy`.

## 6. Verification

- [x] 6.1 Run the new suite (`pytest` from `infrastructure/lambdas/` inside `.venv`) and confirm all tests pass with no network calls (moto-only). 17/17 passed via `npm run test`.
- [x] 6.2 Confirm `pyrightconfig.json`-based type checking still passes on the new test files (or add narrow excludes if test-only patterns trip it, e.g. dynamic `importlib` loading). `npx pyright infrastructure/lambdas/bounties/tests` → 0 errors after annotating the two moto `boto3.resource("dynamodb")` call sites as `Any` (matching `shared/lambda_utils.py`'s existing pattern).
- [x] 6.3 Confirm no changes touched deployed infra. `npx cdk diff --all` can't produce a real diff in this sandbox (no credentials to assume the CDK lookup/deploy roles — it falls back to comparing against an empty template). Verified instead via `git status`: this change touches only `infrastructure/lambdas/requirements-dev.txt` (dev-only deps, never bundled) and `infrastructure/package.json` (new npm script) — no file under `infrastructure/lib/`, `infrastructure/bin/`, or any construct, so the CDK synth output is unaffected. Re-run `cdk diff --all` with real deploy credentials before merging if you want a first-hand confirmation.
