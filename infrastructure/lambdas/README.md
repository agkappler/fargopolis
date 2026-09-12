# Lambda unit tests

Python Lambda handlers in this directory are unit-tested with `pytest` + [`moto`](https://github.com/getmoto/moto)
(mocked DynamoDB and S3 — no AWS credentials or network calls, no deploy required). `bounties/tests/`
is the reference implementation; `camping/`, `dnd/`, `dnd_glossary/`, `files/`, and `recipes/` each
have their own `tests/` built on the same shared fixtures/helpers. Copy any of them as a starting
point for a new vertical (`recipes/` or `dnd_glossary/` if it has a GSI; `files/` if it touches S3).
`clerk_authorizer/` is the one exception — it does JWT/JWKS verification, not DynamoDB access, so
it needs a different test setup (signed test JWTs + a mocked JWKS endpoint) and isn't covered here.

## Running

```bash
./scripts/setup-python-lambdas.sh   # once, or after adding a dependency to requirements-dev.txt
cd infrastructure && npm run test   # runs pytest against infrastructure/lambdas/ via the repo .venv
```

or directly:

```bash
source .venv/bin/activate
cd infrastructure/lambdas
pytest
```

`pytest.ini` sets `pythonpath = .` so `import shared.lambda_utils` resolves the same way CDK's
Python bundling and `pyrightconfig.json` already do, and `import lambda_test_utils` (see below)
resolves the same way. It also sets `addopts = --import-mode=importlib` — every vertical's test
file is named `test_handler.py`, and classic import mode makes pytest resolve same-named test
files to the same `sys.modules` key across sibling directories, which fails collection with an
`import file mismatch` error as soon as a second vertical exists. `--import-mode=importlib` gives
each test file an independent identity regardless of basename, so no `tests/__init__.py` is needed
(and none should be added — combining `__init__.py` packages with `--import-mode=importlib` has a
known pytest issue where fixture discovery from a directory's own `conftest.py` breaks).

## What's shared across every vertical

Two files at this directory's root — visible to every vertical because pytest auto-discovers
`conftest.py` down the whole tree, and `pythonpath = .` puts this directory itself on the path:

- **`conftest.py`** — fixtures: `dynamodb_resource` (a single `boto3.resource("dynamodb")`,
  session-scoped and reused across every test's own `mock_aws()` activation — see its docstring
  for why constructing it fresh per test used to dominate fixture cost), and `make_event` (builds
  a minimal API Gateway HTTP API v2 event; supports `body`, `query`, and `authenticated`/`sub`).
- **`lambda_test_utils.py`** — plain helper functions (not fixtures, since they take
  per-vertical parameters): `load_handler_module(name, path)` (the `importlib` load described
  below) and `create_table(dynamodb, name, partition_key, sort_key=, global_secondary_indexes=)`.

**Both live at the lambdas root, not under `shared/` or any `<vertical>/`, and that placement is
load-bearing, not a style choice — see the next section.**

## Why none of this lives under `shared/`

`shared/` is Python production code, bundled into every deployed Lambda. Critically, the shared
Lambda layer every vertical actually uses in prod (`bundlingForPythonSharedLayer` in
`infrastructure/lib/python-lambda-bundling.ts`) does `cp -R shared` — a **recursive** copy of the
entire `shared/` directory into the layer zip. A `shared/tests/` directory (tried once, briefly)
ends up shipped to production Lambdas: `pytest`, `moto`, and `unittest.mock` imports and all. Test
code for `shared/lambda_utils.py` now lives at `tests/test_lambda_utils.py` (this directory's root)
instead — see that file's docstring.

By contrast, `<vertical>/handler.py` is bundled by explicit, single-file copy
(`cp <handlerDir>/handler.py /asset-output/` in `dockerBundleBashForPythonHandler`), never a
directory copy — so `<vertical>/tests/` was never at risk, and a `conftest.py`/`lambda_test_utils.py`
at the lambdas root (sibling to `shared/`, `bounties/`, etc.) is never referenced by any bundling
command either. If you add a new shared test helper, put it at this root, not inside `shared/`.

## Why handler modules are loaded via `importlib`, not a normal `import`

Each Lambda directory (`bounties/`, `recipes/`, `camping/`, …) has a flat top-level `handler.py` —
CDK bundles it as a zip with `handler.py` at the root, not as an installed package. If two
verticals' tests both tried `import handler`, the second import would shadow or collide with the
first in `sys.modules` depending on test order. `lambda_test_utils.load_handler_module` avoids
this by loading the module explicitly under a unique, per-vertical name:

```python
spec = importlib.util.spec_from_file_location("bounties_handler", BOUNTIES_DIR / "handler.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
```

`shared/lambda_utils.py` binds its DynamoDB resource lazily (cached on first use inside
`table_from_env`, not at import time), and `handler.py` itself has no import-time env-var or AWS
dependency (guarded by `tests/test_lambda_utils.py` and, per-vertical, a
`test_handler_module_imports_without_table_env_vars` test — see `bounties/tests/test_handler.py`).
That's why each vertical's `conftest.py` imports the module once per test session
(`<vertical>_handler_module`, session-scoped) and only does per-test setup — `mock_aws()` + fresh
tables, using the shared `dynamodb_resource` — in the function-scoped `<vertical>_handler` fixture
that wraps it. See
[`openspec/changes/lazy-bind-dynamodb-resource/design.md`](../../openspec/changes/lazy-bind-dynamodb-resource/design.md)
for the rationale.

## Adding tests to another vertical

Copy `recipes/tests/` (uses a GSI + a second table) or `bounties/tests/` (single-table, simpler)
as a starting point — do not add a `tests/__init__.py`:

1. `mkdir <vertical>/tests`.
2. Copy `conftest.py`, then:
   - Rename the `<x>_handler_module`/`<x>_handler` fixtures and the `importlib` module name to
     `<vertical>_handler_module`/`<vertical>_handler`.
   - Update the `*_DIR` constant to point at `<vertical>/`.
   - Use `lambda_test_utils.create_table(...)` for the table(s) that vertical's `handler.py`
     actually reads/writes — match the key schema (and, for any GSI the handler queries, the real
     `Projection`) in the corresponding `infrastructure/lib/constructs/*-construct.ts`, but only
     the tables/indexes the handler's code paths exercise (see
     `add-bounties-pytest-scaffolding/design.md` Decision 4 — mirror concrete access patterns, not
     the full construct). `dynamodb_resource` and `make_event` come from the root `conftest.py` —
     nothing to copy for those. Extend `make_event` (root `conftest.py`) if a vertical needs an
     event shape it doesn't yet support, rather than forking a copy.
3. Write `<vertical>/tests/test_handler.py` covering each route: happy path (+ a direct table
   read to confirm what got persisted), auth failures (401) for writer routes, validation
   failures (400), and any not-found/conflict paths (404).
4. `npm run test` (from `infrastructure/`) picks up new `tests/` directories automatically —
   no config changes needed.

## Non-goals

- These tests call `handler()` directly with hand-built events — they don't exercise API Gateway
  routing or the Clerk authorizer Lambda itself. `require_clerk_writer` is tested through the
  authorizer-context contract it reads (`requestContext.authorizer.lambda.{authenticated,sub}`),
  not real JWT validation.
- No CDK `assertions` tests live here (yet) — this covers Lambda business logic only.
