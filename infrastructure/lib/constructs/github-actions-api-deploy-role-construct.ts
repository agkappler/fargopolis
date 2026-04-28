import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export type GithubActionsApiDeployRoleConstructProps = {
    owner: string;
    repo: string;
    branch?: string;
    /**
     * Optional existing OIDC provider ARN.
     * If omitted, this construct creates the standard GitHub OIDC provider.
     */
    oidcProviderArn?: string;
};

/**
 * IAM role for GitHub Actions OIDC deployments of the API CDK stack.
 */
export class GithubActionsApiDeployRoleConstruct extends Construct {
    public readonly role: iam.Role;

    constructor(scope: Construct, id: string, props: GithubActionsApiDeployRoleConstructProps) {
        super(scope, id);

        const branch = props.branch ?? 'main';
        const subject = `repo:${props.owner}/${props.repo}:ref:refs/heads/${branch}`;

        const oidcProvider = props.oidcProviderArn
            ? iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
                  this,
                  'GithubOidcProviderImported',
                  props.oidcProviderArn
              )
            : new iam.OpenIdConnectProvider(this, 'GithubOidcProvider', {
                  url: 'https://token.actions.githubusercontent.com',
                  clientIds: ['sts.amazonaws.com'],
                  removalPolicy: cdk.RemovalPolicy.RETAIN,
              });

        this.role = new iam.Role(this, 'Role', {
            description: 'GitHub Actions OIDC role for CDK API stack deploy',
            assumedBy: new iam.WebIdentityPrincipal(oidcProvider.openIdConnectProviderArn, {
                StringEquals: {
                    'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
                },
                StringLike: {
                    'token.actions.githubusercontent.com:sub': subject,
                },
            }),
        });

        // Broad permissions are intentionally used for CDK deploy workflows.
        // Tighten to least privilege once deployed resource surface stabilizes.
        this.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));
    }
}
