import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import type { BundlingOptions } from 'aws-cdk-lib/core';
import * as fs from 'fs';
import * as path from 'path';

const LAMBDAS_ROOT_CANDIDATES = (cwd: string) => [path.join(cwd, 'lambdas'), path.join(cwd, 'infrastructure', 'lambdas')];

/**
 * Resolves the repo’s `lambdas/` root (or `infrastructure/lambdas/` from monorepo cwd).
 * Pass paths that must exist under that root to prove the tree (e.g. `bounties/handler.py`).
 */
export function resolveLambdasRoot(requiredRelativePaths: string[], errorHint: string): string {
    for (const root of LAMBDAS_ROOT_CANDIDATES(process.cwd())) {
        if (requiredRelativePaths.every((p) => fs.existsSync(path.join(root, p)))) {
            return root;
        }
    }
    const tried = LAMBDAS_ROOT_CANDIDATES(process.cwd()).join(' | ');
    throw new Error(
        `Could not find infrastructure lambdas tree (${errorHint}). Tried: ${tried} (cwd=${process.cwd()})`,
    );
}

/**
 * **Layout:** one folder per function under `lambdas/<handlerDir>/` (`handler.py`, `requirements.txt`) plus
 * optional code under `lambdas/shared/`. `pip install -t` runs first; `shared` is copied after so a PyPI
 * `shared` package cannot win over our package. Use **`'none'`** when the function uses a
 * {@link bundlingForPythonSharedLayer | shared Lambda layer} instead of inlining `shared/`.
 */
export type PythonLambdaSharedInBundle = 'full' | { readonly copyFiles: readonly string[] } | 'none';

export interface PythonHandlerInLambdasLayout {
    /**
     * Subdirectory of `lambdas/` (e.g. `bounties`, `clerk_authorizer`, future `widgets`).
     * Expects `handler.py` and optionally `requirements.txt` there.
     */
    readonly handlerDir: string;
    /** What to copy from `lambdas/shared/` into the zip root. */
    readonly shared: PythonLambdaSharedInBundle;
}

/** Bash for the Docker build container (same `lambdas/` volume as the asset path). */
export function dockerBundleBashForPythonHandler(layout: PythonHandlerInLambdasLayout): string {
    const req = `${layout.handlerDir}/requirements.txt`;
    const steps: string[] = [
        `if [ -f ${req} ]; then python3 -m pip install --no-cache-dir --platform manylinux2014_aarch64 --implementation cp --python-version 3.12 --only-binary=:all: -r ${req} -t /asset-output; fi`,
        `cp ${layout.handlerDir}/handler.py /asset-output/`,
    ];
    if (layout.shared === 'none') {
        return steps.join(' && ');
    }
    if (layout.shared === 'full') {
        steps.push('cp -R shared /asset-output/');
    } else {
        steps.push('mkdir -p /asset-output/shared');
        for (const f of layout.shared.copyFiles) {
            steps.push(`cp shared/${f} /asset-output/shared/`);
        }
    }
    return steps.join(' && ');
}

/**
 * Bundling for `lambda.Code.fromAsset(lambdasRoot, { bundling })` — **Docker only** (same on every machine
 * and in GitHub Actions). No `local` bundler: one path, `Runtime.PYTHON_3_12` + manylinux arm64 wheels.
 *
 * **CI:** Run `cdk synth` / `cdk deploy` with Docker available (e.g. `runs-on: ubuntu-latest` + Docker,
 * or self-hosted runner with Docker).
 */
export function bundlingForPythonHandlerInLambdasTree(layout: PythonHandlerInLambdasLayout): BundlingOptions {
    return {
        image: lambda.Runtime.PYTHON_3_12.bundlingImage,
        user: 'root',
        bundlingFileAccess: cdk.BundlingFileAccess.VOLUME_COPY,
        command: ['bash', '-c', dockerBundleBashForPythonHandler(layout)],
    };
}

/**
 * Path inside the layer zip: imports resolve via `/opt` on Lambda. Must match
 * [Runtimes and layout](https://docs.aws.amazon.com/lambda/latest/dg/python-layers.html).
 */
export const PYTHON_312_LAYER_SITE_PACKAGES = 'python/lib/python3.12/site-packages';

export function dockerBashForPythonSharedLayer(): string {
    const sp = PYTHON_312_LAYER_SITE_PACKAGES;
    return [
        `mkdir -p /asset-output/${sp}`,
        `cp -R shared /asset-output/${sp}/`,
        `if [ -f shared/requirements.txt ]; then python3 -m pip install --no-cache-dir --platform manylinux2014_aarch64 --implementation cp --python-version 3.12 --only-binary=:all: -r shared/requirements.txt -t /asset-output/${sp}; fi`,
    ].join(' && ');
}

/**
 * Bundles `lambdas/shared` + `shared/requirements.txt` into a Python 3.12 / ARM64–compatible layer.
 * **Docker only** — see {@link bundlingForPythonHandlerInLambdasTree}.
 */
export function bundlingForPythonSharedLayer(): BundlingOptions {
    return {
        image: lambda.Runtime.PYTHON_3_12.bundlingImage,
        user: 'root',
        bundlingFileAccess: cdk.BundlingFileAccess.VOLUME_COPY,
        command: ['bash', '-c', dockerBashForPythonSharedLayer()],
    };
}
