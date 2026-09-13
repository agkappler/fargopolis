## 1. Lazy-bind the DynamoDB resource

- [x] 1.1 In `infrastructure/lambdas/shared/lambda_utils.py`, replace the module-level `dynamodb: Any = boto3.resource("dynamodb")` global with a private `@lru_cache(maxsize=1)`-decorated `_dynamodb_resource()` function.
- [x] 1.2 Update `table_from_env` to call `_dynamodb_resource().Table(table_name)` instead of `dynamodb.Table(table_name)`, keeping the existing missing-env-var `RuntimeError` check before that call.

## 2. Simplify the bounties test fixture

- [x] 2.1 In `infrastructure/lambdas/bounties/tests/conftest.py`, drop the `sys.modules` eviction loop (both occurrences) and the requirement that the `importlib` module load happen inside `mock_aws()` — import the handler module once per test, with `mock_aws()` wrapping the full fixture body (setup, yield, and any handler calls the test makes).
- [x] 2.2 Update the fixture's docstring to describe the simplified rationale (name-collision-only, not import-time-binding).

## 3. Update docs

- [x] 3.1 In `infrastructure/lambdas/README.md`, edit the "Why handler modules are loaded via `importlib`" section to remove the import-time DynamoDB-binding rationale, keeping only the module-name-collision rationale for the `importlib` load pattern.

## 4. Verify

- [x] 4.1 Run `pytest` from `infrastructure/lambdas/` (via the repo `.venv`) and confirm all `bounties/tests/` pass.
- [x] 4.2 Grep `infrastructure/lambdas` for any other reference to `lambda_utils.dynamodb` to confirm nothing outside `table_from_env` needed updating.
