import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as fs from 'fs';
import * as path from 'path';

/**
 * The repo's single Python pin: `/.python-version` (e.g. `3.12`). It sets the Lambda runtime of every
 * Python function and layer, the version pip targets when bundling, the Docker fallback image, the
 * local `.venv` (`scripts/setup-python-lambdas.sh`) and `actions/setup-python` in CI. To move to a new
 * Lambda Python, change that one file (and `target-version` in `lambdas/ruff.toml`).
 */
function findRepoFile(name: string): string {
    let dir = __dirname;
    for (;;) {
        const candidate = path.join(dir, name);
        if (fs.existsSync(candidate)) {
            return candidate;
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            throw new Error(`Could not find ${name} above ${__dirname}; it pins the Lambda Python version.`);
        }
        dir = parent;
    }
}

const PYTHON_VERSION_FILE = findRepoFile('.python-version');

/** Repo root: the directory holding `.python-version`. */
export const REPO_ROOT = path.dirname(PYTHON_VERSION_FILE);

function readPinnedPythonVersion(): string {
    const file = PYTHON_VERSION_FILE;
    const version = fs.readFileSync(file, 'utf8').trim();
    if (!/^3\.\d+$/.test(version)) {
        throw new Error(`${file} must contain a Python minor version like "3.12", got "${version}".`);
    }
    return version;
}

/** Pinned Lambda Python version, e.g. `3.12`. */
export const LAMBDA_PYTHON_VERSION = readPinnedPythonVersion();

/** The CDK `Runtime` for {@link LAMBDA_PYTHON_VERSION}; throws if this aws-cdk-lib doesn't know it. */
export const LAMBDA_PYTHON_RUNTIME: lambda.Runtime = (() => {
    const name = `python${LAMBDA_PYTHON_VERSION}`;
    const runtime = lambda.Runtime.ALL.find((r) => r.name === name);
    if (!runtime) {
        throw new Error(`aws-cdk-lib has no Lambda runtime "${name}" (from .python-version); upgrade aws-cdk-lib or pick a supported version.`);
    }
    return runtime;
})();
