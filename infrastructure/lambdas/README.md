# Lambda unit tests

Python Lambda handlers in this directory are unit-tested with `pytest` + [`moto`](https://github.com/getmoto/moto)
(mocked DynamoDB) — no AWS credentials or network calls, no deploy required. `bounties/tests/` is
the reference implementation; copy its pattern for other verticals.

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
Python bundling and `pyrightconfig.json` already do — no path hacks needed in individual test files.

## Why handler modules are loaded via `importlib`, not a normal `import`

Each Lambda directory (`bounties/`, `camping/`, …) has a flat top-level `handler.py` — CDK bundles
it as a zip with `handler.py` at the root, not as an installed package. If two verticals' tests both
tried `import handler`, the second import would shadow or collide with the first in `sys.modules`
depending on test order. `bounties/tests/conftest.py` avoids this by loading the module explicitly
under a unique, per-vertical name:

```python
spec = importlib.util.spec_from_file_location("bounties_handler", BOUNTIES_DIR / "handler.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
```

`shared/lambda_utils.py` also binds its DynamoDB resource **at import time**
(`dynamodb = boto3.resource("dynamodb")` as a module-level global). That means the handler module
import — and therefore `shared.lambda_utils`'s import — must happen *inside* an active
`moto.mock_aws()` context, with any previously-cached `shared`/`<vertical>_handler` modules evicted
from `sys.modules` first. Otherwise a later test's import would silently reuse a DynamoDB resource
bound to an earlier (or no) mock. See `bounties/tests/conftest.py`'s `bounties_handler` fixture for
the full sequence, and
[`openspec/changes/add-bounties-pytest-scaffolding/design.md`](../../openspec/changes/add-bounties-pytest-scaffolding/design.md)
for the fuller rationale.

## Adding tests to another vertical

Copy `bounties/tests/` as a starting point:

1. `mkdir <vertical>/tests && touch <vertical>/tests/__init__.py`.
2. Copy `bounties/tests/conftest.py`, then:
   - Rename the `bounties_handler` fixture/module name to `<vertical>_handler`.
   - Update `BOUNTIES_DIR` to point at `<vertical>/`.
   - Create the table(s) that vertical's `handler.py` actually reads/writes — match the key
     schema in the corresponding `infrastructure/lib/constructs/*-construct.ts`, but only the
     tables and indexes the handler's code paths exercise (see design.md Decision 4 — mirror
     concrete access patterns, not the full construct).
   - Adjust or drop `make_event` if the vertical's routes need a different event shape.
3. Write `<vertical>/tests/test_handler.py` covering each route: happy path (+ a direct table
   read to confirm what got persisted), auth failures (401) for writer routes, validation
   failures (400), and any not-found/conflict paths (404).
4. `npm run test` (from `infrastructure/`) picks up new `tests/` directories automatically —
   no config changes needed.

Test helpers stay local to each vertical's `tests/` directory rather than living in `shared/`,
because `shared/` is bundled into the deployed Lambda layer (`PythonSharedLayerConstruct`) and
test-only code must not ship there.

## Non-goals

- These tests call `handler()` directly with hand-built events — they don't exercise API Gateway
  routing or the Clerk authorizer Lambda itself. `require_clerk_writer` is tested through the
  authorizer-context contract it reads (`requestContext.authorizer.lambda.{authenticated,sub}`),
  not real JWT validation.
- No CDK `assertions` tests live here (yet) — this covers Lambda business logic only.
