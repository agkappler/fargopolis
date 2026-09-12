## Context

`infrastructure/lambdas/shared/lambda_utils.py:13` binds `dynamodb: Any = boto3.resource("dynamodb")` at module scope. `dynamodb` is referenced in exactly one place in production code — `table_from_env` (`lambda_utils.py:16-20`) — confirmed by grep; no handler touches `lambda_utils.dynamodb` directly. See proposal.md - Why for the test-scaffolding cost this imposes.

## Goals / Non-Goals

**Goals:**
- `boto3.resource("dynamodb")` is created on first actual use, not at import time.
- Exactly one resource is created per process/cold-start (not re-created per call) — same cost profile as today, just deferred.
- `table_from_env`'s signature and behavior are unchanged; every existing caller across all verticals keeps working with no edits.

**Non-Goals:**
- Not touching the `importlib.util.spec_from_file_location` per-vertical module-name-collision workaround (Decision 2 of `add-bounties-pytest-scaffolding/design.md`) — that solves a different problem (name collisions across verticals sharing the flat `handler.py` filename) and stays as-is.
- Not packageifying Lambda directories or touching any CDK construct's `handler:` prop — out of scope, rejected separately as a deploy-risk change disproportionate to this fix.
- Not changing `table_from_env`'s error behavior (missing env var still raises `RuntimeError` before any AWS call, same as today).

## Decisions

**1. `functools.lru_cache(maxsize=1)` on a private `_dynamodb_resource()` function, rather than a manually-managed `_dynamodb = None` global + `if` check.**
`lru_cache` gives "compute once, cache forever" with no hand-rolled None-check/assignment boilerplate, and is stdlib-idiomatic for exactly this shape (lazy singleton). `table_from_env` calls `_dynamodb_resource().Table(table_name)` instead of `dynamodb.Table(table_name)`. Alternative considered: a manual `global` cache variable — rejected as more code for the same guarantee, with no benefit here (no need to ever invalidate/reset the cache in production; tests get a fresh cache via module reimport, same as today).

**2. Keep the function private (`_dynamodb_resource`), don't expose a public accessor.**
Nothing outside `table_from_env` needs the DynamoDB resource directly today (confirmed by grep across `infrastructure/lambdas`). Exposing a public name would invite direct `lambda_utils.dynamodb`-style access again, reintroducing the exact coupling this change removes. If a future handler needs raw resource access, it can call `table_from_env` or a new helper can be added then.

**3. `bounties/tests/conftest.py`: drop the `sys.modules` eviction loop and the "import inside `mock_aws()`" requirement; keep the per-vertical `importlib` load (Decision 2, unchanged).**
With lazy binding, `_dynamodb_resource()` isn't called until a handler route actually touches a table — so `mock_aws()` only needs to be active when the test *calls* `bounties_handler.handler(...)`, not when the module is imported. The fixture can import the handler module once (still via `importlib.util.spec_from_file_location`, still for the name-collision reason), and just needs `mock_aws()` active for the duration handler calls happen — which is naturally satisfied by keeping `mock_aws()` as the fixture's context manager wrapping the `yield`. No `sys.modules` eviction is needed since a stale cached resource can no longer exist (nothing is bound until first call, and each test still gets a fresh module object from `importlib`, so each test's `_dynamodb_resource` cache is naturally per-test-fresh).

**4. `table_from_env`'s `RuntimeError` for missing env var still raises before touching AWS.**
`table_from_env` checks `os.environ.get(name_env)` and raises before calling `_dynamodb_resource()`, same order as today — no change to that validation path.

## Risks / Trade-offs

- **[Risk] `lru_cache` on a module-level function is process-global state, same category of "hidden global" as the thing being removed.** → Acceptable: the goal isn't to eliminate caching (a single boto3 resource per cold start is desired and correct), only to defer *when* it's created from import-time to first-use-time. The cache still lives for the life of the module object, matching current production behavior exactly.
- **[Risk] Existing `bounties/tests/conftest.py` behavior changes; other verticals haven't copied the pattern yet, so no other test file needs updating.** → Confirmed: `bounties/` is the only vertical with a `tests/` directory today (per `infrastructure/lambdas/README.md`), so this change only touches one conftest.py.
- **[Risk] Tests that rely on `mock_aws()` still being active must keep it active across all `handler()` calls within a test, not just at import.** → Already true of the current fixture design (it wraps the whole test in `mock_aws()`), so no new test-authoring burden.

## Migration Plan

1. Change `shared/lambda_utils.py`: replace the module-level `dynamodb` global with `@lru_cache(maxsize=1)`-decorated `_dynamodb_resource()`; update `table_from_env` to call it.
2. Simplify `bounties/tests/conftest.py`'s `bounties_handler` fixture per Decision 3.
3. Update `infrastructure/lambdas/README.md`'s "Why handler modules are loaded via `importlib`" section to drop the import-time-binding rationale, keeping only the name-collision rationale.
4. Run `pytest` from `infrastructure/lambdas/` (via `.venv`) and confirm the full `bounties/tests/` suite still passes.
No deploy required for tests to pass locally; the `shared/lambda_utils.py` change ships to production on the next normal `FargopolisApi` deploy (no behavior change expected — same resource, created once, just later).
