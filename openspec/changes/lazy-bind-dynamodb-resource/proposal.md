## Why

`shared/lambda_utils.py` binds its DynamoDB resource as a module-level global — `dynamodb: Any = boto3.resource("dynamodb")` — executed the moment the module is imported, not when a table is actually accessed. This forces `bounties/tests/conftest.py` to import the handler module *inside* an active `moto.mock_aws()` context and evict `sys.modules` entries (`bounties_handler`, `shared.lambda_utils`, `shared`) before every single test, re-importing fresh each time, purely so the import-time `boto3.resource()` call binds to that test's mock account instead of a stale one. That workaround (documented as Decision 3 in `openspec/changes/add-bounties-pytest-scaffolding/design.md`) is copy-paste boilerplate every future vertical's `tests/conftest.py` will inherit. Making the binding lazy removes the need for it entirely, with no change to runtime behavior.

## What Changes

- `shared/lambda_utils.py`: replace the module-level `dynamodb = boto3.resource("dynamodb")` global with a lazily-initialized accessor (cached on first call) used internally by `table_from_env`. No change to `table_from_env`'s public signature or behavior.
- `bounties/tests/conftest.py`: simplify the `bounties_handler` fixture — drop the `sys.modules` eviction loop and the requirement that module import happen inside `mock_aws()`; import once, keep `mock_aws()` active for the fixture's lifetime, set table env vars via `monkeypatch`.
- `infrastructure/lambdas/README.md`: update the "Why handler modules are loaded via `importlib`" section to reflect that only the module-name-collision workaround (Decision 2, unchanged) remains — the import-time-binding workaround is gone.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
(none — internal implementation/test-scaffolding change only; no API request/response behavior, schema, or contract changes)

## Impact

- `infrastructure/lambdas/shared/lambda_utils.py` — internal change, used by every Lambda vertical; `table_from_env` behavior and all callers are unaffected (DynamoDB resource still resolves once per cold start, just lazily instead of at import).
- `infrastructure/lambdas/bounties/tests/conftest.py`, `infrastructure/lambdas/bounties/tests/test_handler.py` (if fixture shape changes) — test-only.
- `infrastructure/lambdas/README.md` — doc update.
- No CDK/infra changes, no deploy required beyond the normal `FargopolisApi` Lambda code update.
