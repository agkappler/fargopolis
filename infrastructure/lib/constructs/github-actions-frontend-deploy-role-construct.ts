import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export type GithubActionsFrontendDeployRoleConstructProps = {
    owner: string;
    repo: string;
    siteBucket: s3.IBucket;
    distribution: cloudfront.IDistribution;
    /**
     * Optional existing OIDC provider ARN.
     * If omitted, this construct creates the standard GitHub OIDC provider.
     */
    oidcProviderArn?: string;
};

/**
 * IAM role for GitHub Actions OIDC deployments to static frontend infrastructure.
 */
export class GithubActionsFrontendDeployRoleConstruct extends Construct {
    public readonly role: iam.Role;

    constructor(scope: Construct, id: string, props: GithubActionsFrontendDeployRoleConstructProps) {
        super(scope, id);

        // Match any JWT `sub` for this repo (push, workflow_dispatch, etc.) — GitHub emits
        // `repo:OWNER/REPO:ref:...` or env-scoped variants; exact ref-only strings often fail STS.
        const subjectLike = `repo:${props.owner}/${props.repo}:*`;

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
            description: 'GitHub Actions OIDC role for static frontend deploy',
            assumedBy: new iam.WebIdentityPrincipal(oidcProvider.openIdConnectProviderArn, {
                StringEquals: {
                    'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
                },
                StringLike: {
                    'token.actions.githubusercontent.com:sub': subjectLike,
                },
            }),
        });

        props.siteBucket.grantReadWrite(this.role);
        this.role.addToPolicy(
            new iam.PolicyStatement({
                sid: 'AllowBucketList',
                actions: ['s3:ListBucket'],
                resources: [props.siteBucket.bucketArn],
            })
        );
        this.role.addToPolicy(
            new iam.PolicyStatement({
                sid: 'AllowCloudFrontInvalidation',
                actions: ['cloudfront:CreateInvalidation'],
                resources: [props.distribution.distributionArn],
            })
        );
    }
}
