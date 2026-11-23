import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import type { BundlingOptions, ILocalBundling } from 'aws-cdk-lib/core';
import { execFileSync } from 'child_process';
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

const PIP_INSTALL_FLAGS = [
    '--no-cache-dir',
    '--platform',
    'manylinux2014_aarch64',
    '--implementation',
    'cp',
    '--python-version',
    '3.12',
    '--only-binary=:all:',
    // Skip .pyc files: they'd be compiled for the bundling interpreter, not the 3.12 runtime.
    '--no-compile',
];

/**
 * Interpreters to try for local bundling, best match first. 3.12 matches the Lambda runtime, but any
 * Python 3.10+ works: `PIP_INSTALL_FLAGS` pins `--python-version 3.12`, the arm64 manylinux platform
 * and `--only-binary=:all:`, so pip downloads the same prebuilt 3.12 wheels whichever interpreter
 * runs it, and nothing is compiled. (`handler.py` and `shared/` are copied as-is.)
 */
const LOCAL_PYTHON_CANDIDATES = [
    'python3.12',
    ...Array.from({ length: 8 }, (_, i) => `python3.${13 + i}`), // python3.13 … python3.20
    'python3.11',
    'python3.10',
    'python3',
];
const MIN_LOCAL_PYTHON_MINOR = 10;

let cachedLocalPython: string | null | undefined;

/**
 * First Python 3.10+ on PATH that has `pip` (see {@link LOCAL_PYTHON_CANDIDATES}), or `undefined` to fall
 * back to Docker. Requiring `pip` here skips interpreters that would only fail later at install time.
 */
function findLocalPython(): string | undefined {
    if (cachedLocalPython !== undefined) {
        return cachedLocalPython ?? undefined;
    }
    cachedLocalPython = null;
    for (const candidate of LOCAL_PYTHON_CANDIDATES) {
        try {
            const [major, minor] = execFileSync(candidate, ['-c', 'import sys, pip; print(sys.version_info.major, sys.version_info.minor)'], {
                stdio: ['ignore', 'pipe', 'ignore'],
            })
                .toString()
                .trim()
                .split(' ')
                .map(Number);
            if (major === 3 && minor >= MIN_LOCAL_PYTHON_MINOR) {
                cachedLocalPython = candidate;
                break;
            }
        } catch {
            // Not on PATH, or no pip; try the next candidate.
        }
    }
    return cachedLocalPython ?? undefined;
}

function pipInstallLocal(python: string, requirementsFile: string, targetDir: string): void {
    fs.mkdirSync(targetDir, { recursive: true });
    execFileSync(python, ['-m', 'pip', 'install', ...PIP_INSTALL_FLAGS, '-r', requirementsFile, '-t', targetDir], { stdio: 'inherit' });
}

function copySharedInto(lambdasRoot: string, shared: PythonLambdaSharedInBundle, outputDir: string): void {
    if (shared === 'none') {
        return;
    }
    const sharedOut = path.join(outputDir, 'shared');
    if (shared === 'full') {
        fs.cpSync(path.join(lambdasRoot, 'shared'), sharedOut, { recursive: true });
        return;
    }
    fs.mkdirSync(sharedOut, { recursive: true });
    for (const f of shared.copyFiles) {
        fs.copyFileSync(path.join(lambdasRoot, 'shared', f), path.join(sharedOut, f));
    }
}

/**
 * Tries a local Python 3.10+ first (same manylinux-wheel-only `pip install` as Docker — see
 * {@link findLocalPython}); returns `false` on any failure (no suitable Python on PATH, or the
 * install itself failing) so CDK falls back to {@link dockerBundleBashForPythonHandler}.
 */
function localBundlingForPythonHandler(lambdasRoot: string, layout: PythonHandlerInLambdasLayout): ILocalBundling {
    return {
        tryBundle(outputDir: string): boolean {
            const python = findLocalPython();
            if (!python) {
                return false;
            }
            try {
                const handlerDirPath = path.join(lambdasRoot, layout.handlerDir);
                const req = path.join(handlerDirPath, 'requirements.txt');
                if (fs.existsSync(req)) {
                    pipInstallLocal(python, req, outputDir);
                }
                fs.copyFileSync(path.join(handlerDirPath, 'handler.py'), path.join(outputDir, 'handler.py'));
                copySharedInto(lambdasRoot, layout.shared, outputDir);
                return true;
            } catch (err) {
                console.warn(`Local Python bundling failed for ${layout.handlerDir}, falling back to Docker: ${(err as Error).message}`);
                return false;
            }
        },
    };
}

/** Bash for the Docker build container (same `lambdas/` volume as the asset path). */
export function dockerBundleBashForPythonHandler(layout: PythonHandlerInLambdasLayout): string {
    const req = `${layout.handlerDir}/requirements.txt`;
    const steps: string[] = [
        `if [ -f ${req} ]; then python3 -m pip install ${PIP_INSTALL_FLAGS.join(' ')} -r ${req} -t /asset-output; fi`,
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
 * Bundling for `lambda.Code.fromAsset(lambdasRoot, { bundling })`. Tries a local Python 3.10+ first
 * (no Docker needed — see {@link localBundlingForPythonHandler}); falls back to Docker
 * (`Runtime.PYTHON_3_12` + manylinux arm64 wheels) when it's not on `PATH` or fails, so the result
 * is the same either way.
 *
 * **CI:** when Docker fallback is needed, run `cdk synth` / `cdk deploy` with Docker available
 * (e.g. `runs-on: ubuntu-latest` + Docker, or self-hosted runner with Docker).
 */
export function bundlingForPythonHandlerInLambdasTree(lambdasRoot: string, layout: PythonHandlerInLambdasLayout): BundlingOptions {
    return {
        image: lambda.Runtime.PYTHON_3_12.bundlingImage,
        user: 'root',
        bundlingFileAccess: cdk.BundlingFileAccess.VOLUME_COPY,
        command: ['bash', '-c', dockerBundleBashForPythonHandler(layout)],
        local: localBundlingForPythonHandler(lambdasRoot, layout),
    };
}

/**
 * Path inside the layer zip: imports resolve via `/opt` on Lambda. Must match
 * [Runtimes and layout](https://docs.aws.amazon.com/lambda/latest/dg/python-layers.html).
 */
export const PYTHON_312_LAYER_SITE_PACKAGES = 'python/lib/python3.12/site-packages';

function localBundlingForPythonSharedLayer(lambdasRoot: string): ILocalBundling {
    return {
        tryBundle(outputDir: string): boolean {
            const python = findLocalPython();
            if (!python) {
                return false;
            }
            try {
                const targetDir = path.join(outputDir, PYTHON_312_LAYER_SITE_PACKAGES);
                fs.mkdirSync(targetDir, { recursive: true });
                fs.cpSync(path.join(lambdasRoot, 'shared'), path.join(targetDir, 'shared'), { recursive: true });
                const req = path.join(lambdasRoot, 'shared', 'requirements.txt');
                if (fs.existsSync(req)) {
                    pipInstallLocal(python, req, targetDir);
                }
                return true;
            } catch (err) {
                console.warn(`Local Python bundling failed for shared layer, falling back to Docker: ${(err as Error).message}`);
                return false;
            }
        },
    };
}

export function dockerBashForPythonSharedLayer(): string {
    const sp = PYTHON_312_LAYER_SITE_PACKAGES;
    return [
        `mkdir -p /asset-output/${sp}`,
        `cp -R shared /asset-output/${sp}/`,
        `if [ -f shared/requirements.txt ]; then python3 -m pip install ${PIP_INSTALL_FLAGS.join(' ')} -r shared/requirements.txt -t /asset-output/${sp}; fi`,
    ].join(' && ');
}

/**
 * Bundles `lambdas/shared` + `shared/requirements.txt` into a Python 3.12 / ARM64–compatible layer.
 * Tries a local Python 3.10+ first, falls back to Docker — see {@link bundlingForPythonHandlerInLambdasTree}.
 */
export function bundlingForPythonSharedLayer(lambdasRoot: string): BundlingOptions {
    return {
        image: lambda.Runtime.PYTHON_3_12.bundlingImage,
        user: 'root',
        bundlingFileAccess: cdk.BundlingFileAccess.VOLUME_COPY,
        command: ['bash', '-c', dockerBashForPythonSharedLayer()],
        local: localBundlingForPythonSharedLayer(lambdasRoot),
    };
}
