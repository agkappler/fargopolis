import * as cdk from 'aws-cdk-lib';

export type GithubActionsContextSubset = {
    oidcProviderArn?: string;
    /** When true, `FargopolisApiStack` constructs create the GitHub OIDC IdP (`/token.actions.githubusercontent.com`). Frontend always imports ARN only — never duplicate creation. */
    createOidcProvider?: boolean | string;
};

/**
 * Canonical IAM ARN for GitHub Actions OIDC (`/token.actions.githubusercontent.com`).
 */
export function defaultGithubActionsOidcProviderArn(stack: cdk.Stack): string {
    return `arn:${stack.partition}:iam::${stack.account}:oidc-provider/token.actions.githubusercontent.com`;
}

function contextTruthy(value: unknown): boolean {
    return value === true || value === 'true';
}

/**
 * API stack only: bootstrap by creating IAM OIDC IdP vs import existing ARN into trust.
 *
 * Controlled by `githubActions.createOidcProvider`, or reliably:
 * `-c bootstrapGithubActionsOidcProvider=true` (recommended for CLI shells that mangle nested JSON).
 */
function wantBootstrapGithubActionsOidcInApi(stack: cdk.Stack, githubActions: GithubActionsContextSubset | undefined): boolean {
    const fromNested = contextTruthy(githubActions?.createOidcProvider);
    const dedicated = stack.node.tryGetContext('bootstrapGithubActionsOidcProvider');
    return fromNested || contextTruthy(dedicated);
}

/**
 * `FargopolisFrontend`: always resolves to an ARN string (`import`/`fromOpenIdConnectProviderArn` path only).
 */
export function resolveImportedGithubActionsOidcProviderArn(
    stack: cdk.Stack,
    githubActions: GithubActionsContextSubset | undefined,
): string {
    return githubActions?.oidcProviderArn ?? defaultGithubActionsOidcProviderArn(stack);
}

/**
 * `FargopolisApiStack`: returns `undefined` when this deploy should **`new OpenIdConnectProvider`**; otherwise ARN to import.
 */
export function resolveApiGithubDeployOidcProviderArn(
    stack: cdk.Stack,
    githubActions: GithubActionsContextSubset | undefined,
): string | undefined {
    if (wantBootstrapGithubActionsOidcInApi(stack, githubActions)) {
        return undefined;
    }
    return githubActions?.oidcProviderArn ?? defaultGithubActionsOidcProviderArn(stack);
}
