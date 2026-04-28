import * as cdk from 'aws-cdk-lib';

export type GithubActionsContextSubset = {
    oidcProviderArn?: string;
    /** When true, the deploy role constructs create `/token.actions.githubusercontent.com` resources. Omit or false uses import-only (default ARN). */
    createOidcProvider?: boolean;
};

/**
 * Matches both stacks so only one OIDC creator is needed across the app (everything else imports the account provider ARN).
 *
 * Greenfield bootstrap: deploy one stack once with `{ createOidcProvider: true }`, then omit it (defaults to importing the standard ARN).
 */
export function resolveGithubActionsOidcProviderArn(
    stack: cdk.Stack,
    githubActions: GithubActionsContextSubset | undefined,
): string | undefined {
    if (githubActions?.createOidcProvider === true) {
        return undefined;
    }
    return (
        githubActions?.oidcProviderArn ??
        `arn:${stack.partition}:iam::${stack.account}:oidc-provider/token.actions.githubusercontent.com`
    );
}
