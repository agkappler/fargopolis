## Context

See [proposal.md](proposal.md) for motivation. Relevant constraints from the current codebase:

- `infrastructure/lambdas/bounties/` has no `__init__.py` — CDK bundles each Lambda directory as a flat zip (`handler.py` at the root), not as an installed package. `pyrightconfig.json` resolves `shared` via `extraPaths: ["infrastructure/lambdas", "infrastructure/lambdas/shared"]`, i.e. it's on `sys.path`, not imported as a subpackage of anything.
- `shared/lambda_utils.py` builds its DynamoDB resource **at module import time**: `dynamodb: Any = boto3.resource("dynamodb")` (module-level global, not inside a function). Any test that imports `bounties.handler` (which imports `shared.lambda_utils`) triggers this before a test body runs.
- `infrastructure/lambdas/requirements-dev.txt` already aggregates per-lambda `requirements.txt` files plus local-only extras (`boto3`) — this is the established place for test-only deps too.
- `scripts/setup-python-lambdas.sh` provisions a repo-root `.venv` from `requirements-dev.txt` using `python3.12`. Tests should run inside that same venv, not a separate one.

## Goals / Non-Goals

**Goals:**
- Deterministic, no-network Lambda handler tests (moto-mocked DynamoDB) runnable in seconds from `.venv`.
- An import/fixture pattern that scales to more verticals adding their own `tests/` directory later without module-name collisions between e.g. `bounties/handler.py` and `camping/handler.py`.
- Fixtures that mirror the real table schema (`infrastructure/lib/constructs/bounties-construct.ts`) closely enough that a schema change in CDK would plausibly break the corresponding test fixture too.

**Non-Goals:**
- Testing through API Gateway or the Clerk authorizer Lambda itself — tests call `handler()` directly with hand-built events; `require_clerk_writer` is exercised via its authorizer-context contract, not real JWT validation.
- CDK `assertions` tests or any coverage for `camping`/`recipes`/`dnd`/`dnd_glossary`/`files`/`clerk_authorizer` (tracked as follow-on work, not this change).
- CI wiring (running `pytest` in GitHub Actions) — out of scope here; can be added once the local pattern is proven.

## Decisions

**1. `pytest.ini` at `infrastructure/lambdas/pytest.ini` with `pythonpath = .`, not a `conftest.py` `sys.path` hack.**
Pytest's built-in `pythonpath` ini option (pytest ≥ 7, already satisfied — repo has no pinned pytest yet, will pin `pytest==8.x`) inserts `infrastructure/lambdas` onto `sys.path` for the test run, making `import shared.lambda_utils` work exactly like it does for CDK's Python bundling and `pyrightconfig.json`. This avoids a hand-rolled `sys.path.insert` in every vertical's `conftest.py`.

**2. Load each vertical's `handler.py` via `importlib.util.spec_from_file_location` with a per-vertical module name, not by putting `bounties/` on `pythonpath`.**
Every Lambda directory has a flat top-level `handler.py`. If a future `camping/tests/` also did `pythonpath = . camping` and `import handler`, the second import would either shadow or collide with `bounties`'s `handler` module in `sys.modules` depending on import order — a real risk given the proposal explicitly wants this pattern reused. Instead, `bounties/tests/conftest.py` loads the module explicitly:
```python
spec = importlib.util.spec_from_file_location("bounties_handler", BOUNTIES_DIR / "handler.py")
bounties_handler = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bounties_handler)
```
giving it the collision-proof name `bounties_handler`. Alternative considered: add `__init__.py` to every Lambda dir and import as `bounties.handler` — rejected because it changes the CDK bundling unit's shape (extra file shipped in every Lambda zip) for a test-only concern.

**3. Import (and therefore the module-level `boto3.resource("dynamodb")` call) happens *inside* an active `moto.mock_aws()` context, per test.**
`shared.lambda_utils` binds its DynamoDB resource at import time, so the fixture must: (a) set dummy credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`) before anything touches boto3, and (b) start `mock_aws()` *before* the first import of `shared.lambda_utils`/`bounties_handler` in the test process, then do the `importlib` load described above inside that same context, function-scoped, so each test gets an isolated mock account and a fresh import. This costs a re-import per test (module caching is deliberately bypassed via a fresh `module_from_spec` each time) but removes any ordering hazard between "mock started" and "resource created" — correctness over micro-speed for a suite this small.

**4. Fixture creates only the tables/keys `handler.py` actually reads: partition-key-only `BOUNTIES_TABLE_NAME` (`bountyId`) and `BOUNTY_CATEGORIES_TABLE_NAME` (`categoryId`).**
The real `BountiesConstruct` also defines a `CategoryIndex` GSI, but `handler.py` only ever calls `scan_all_items`/`put_item`/`update_item`/`get_item` — no GSI `Query`. Per this repo's own DynamoDB conventions ("design from concrete access patterns"), the test fixture mirrors what's actually exercised; adding the GSI to the fixture is a one-line follow-up if/when a handler route starts querying it.

**5. Deps: pin `pytest==8.3.4` and `moto[dynamodb]==5.0.28` in `requirements-dev.txt`, matching this repo's existing exact-pin convention** (`PyJWT[crypto]==2.9.0`, `python-ulid==1.1.0`). `moto[dynamodb]` (not the megabyte-heavier bare `moto[all]`) keeps the dev install narrow, consistent with per-lambda `requirements.txt` minimalism.

**6. Test-only helper code lives in `bounties/tests/`, not `shared/`.**
`shared/` is bundled into the deployed Python Lambda layer via `PythonSharedLayerConstruct`. Test helpers (event builders, the `importlib` loader) must not ship in that layer, so they stay local to `bounties/tests/conftest.py` even though this means a few lines are duplicated when a future vertical copies the pattern — documented explicitly in the new `infrastructure/lambdas/README.md` as the copy-paste starting point.

## Risks / Trade-offs

- **[Risk] Per-test re-import (`importlib.util.module_from_spec`) is slower than a cached module import.** → Acceptable: this suite is small (~5 routes) and correctness (no cross-test/module-level AWS-resource leakage) matters more than shaving milliseconds.
- **[Risk] The moto-mocked table schema can drift from the real CDK construct** (e.g. someone adds a required attribute in `bounties-construct.ts` without updating the test fixture) **→** Mitigation is documentation only in this change (README calls out the construct as the source of truth to mirror); a stronger guarantee (e.g. a shared schema fixture generated from CDK) is an explicit non-goal here to avoid scope creep.
- **[Risk] `moto[dynamodb]==5.0.28` pin goes stale.** → Same maintenance model as every other exact-pinned dependency in this repo (`shared/requirements.txt`); no special handling needed.

## Migration Plan

1. Add deps to `requirements-dev.txt`, rerun `./scripts/setup-python-lambdas.sh` to refresh `.venv`.
2. Add `pytest.ini`, `bounties/tests/__init__.py`, `conftest.py`, `test_handler.py`.
3. Run `pytest` from `infrastructure/lambdas/` (via `.venv`) and iterate until green.
4. Add the `infrastructure/lambdas/README.md` pattern doc and a convenience script/`package.json` entry.
No deploy, no rollback needed — nothing touches deployed infrastructure or runtime code.
