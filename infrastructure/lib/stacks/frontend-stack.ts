import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { GithubActionsFrontendDeployRoleConstruct } from '../constructs/github-actions-frontend-deploy-role-construct';
import { resolveImportedGithubActionsOidcProviderArn } from '../github-actions-oidc';
import { FrontendDomainContext, resolveHasFrontendDomainConfig, shouldCreateFrontendDomainDnsRecord } from '../frontend-domain-context';

export interface FrontendStackProps extends cdk.StackProps {
    /** Generic stack-tag string (e.g. "dev"); adds a `Stage` tag. Only ever set at the Makefile level. */
    tag?: string;
    /**
     * Already-parsed custom-domain config, resolved once by `bin/recipes-infra.ts` via
     * `parseFrontendDomainContext`/`resolveHasFrontendDomainConfig` — this stack does not
     * re-parse context itself.
     */
    frontendDomain?: FrontendDomainContext;
}

/**
 * Static site hosting: private S3 bucket + CloudFront with Origin Access Control.
 * Upload SPA build output (e.g. Vite `dist/`) to the bucket; invalidate CloudFront after deploy.
 * 403/404 → index.html supports client-side routes on hard refresh.
 */
export class FrontendStack extends cdk.Stack {
    public readonly bucket: s3.Bucket;
    public readonly distribution: cloudfront.Distribution;

    constructor(scope: Construct, id: string, props?: FrontendStackProps) {
        super(scope, id, props);

        cdk.Tags.of(this).add('Project', 'recipes');
        cdk.Tags.of(this).add('Stage', props?.tag || 'default');

        const frontendDomain = props?.frontendDomain ?? {};
        const hasFrontendDomainConfig = resolveHasFrontendDomainConfig(frontendDomain);

        this.bucket = new s3.Bucket(this, 'SiteBucket', {
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            versioned: false,
        });

        const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(this.bucket);

        // This certificate must be issued in us-east-1 regardless of this stack's own deploy
        // region — CloudFront requires it. This is the opposite of `apiDomain`'s certificate,
        // which must be in the same region as the API Gateway. Import by ARN only; never
        // create+validate a cert here. CDK does not enforce the us-east-1 requirement at synth
        // time — this is a doc-only guard.
        const certificate = hasFrontendDomainConfig
            ? acm.Certificate.fromCertificateArn(this, 'FrontendDomainCert', frontendDomain.certificateArn ?? '')
            : undefined;

        this.distribution = new cloudfront.Distribution(this, 'Distribution', {
            comment: 'fargopolis-web',
            defaultRootObject: 'index.html',
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
            httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            defaultBehavior: {
                origin: s3Origin,
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                compress: true,
            },
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.minutes(5),
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.minutes(5),
                },
            ],
            ...(hasFrontendDomainConfig ? { domainNames: [frontendDomain.domainName ?? ''], certificate } : {}),
        });

        if (hasFrontendDomainConfig && shouldCreateFrontendDomainDnsRecord(frontendDomain)) {
            const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'FrontendDomainHostedZone', {
                hostedZoneId: frontendDomain.hostedZoneId ?? '',
                zoneName: frontendDomain.hostedZoneDomain ?? '',
            });
            new route53.ARecord(this, 'FrontendDomainAliasRecord', {
                zone: hostedZone,
                recordName: frontendDomain.domainName ?? '',
                target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this.distribution)),
            });
        }

        const githubActions = (this.node.tryGetContext('githubActions') ?? {}) as {
            owner?: string;
            repo?: string;
            branch?: string;
            oidcProviderArn?: string;
            createOidcProvider?: boolean | string;
        };
        const githubOwner = githubActions.owner ?? 'agkappler';
        const githubRepo = githubActions.repo ?? 'fargopolis';
        const githubBranch = githubActions.branch ?? 'main';
        // Frontend stack never creates IAM OIDC IdP resources (avoid duplicate-provider conflicts); API bootstrap does.
        const githubOidcProviderArn = resolveImportedGithubActionsOidcProviderArn(cdk.Stack.of(this), githubActions);
        const githubDeployRole = new GithubActionsFrontendDeployRoleConstruct(this, 'GithubActionsFrontendDeploy', {
            owner: githubOwner,
            repo: githubRepo,
            siteBucket: this.bucket,
            distribution: this.distribution,
            oidcProviderArn: githubOidcProviderArn,
        });

        new cdk.CfnOutput(this, 'SiteBucketName', {
            description: 'Upload static assets here (e.g. aws s3 sync ./dist s3://...)',
            value: this.bucket.bucketName,
        });
        new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
            description: 'Create invalidation after deploy: aws cloudfront create-invalidation ...',
            value: this.distribution.distributionId,
        });
        new cdk.CfnOutput(this, 'SiteUrl', {
            description: 'CloudFront URL until custom domain is attached',
            value: `https://${this.distribution.distributionDomainName}`,
        });
        new cdk.CfnOutput(this, 'GithubActionsDeployRoleArn', {
            description: `Role ARN for GitHub Actions OIDC deploys (${githubOwner}/${githubRepo}@${githubBranch})`,
            value: githubDeployRole.role.roleArn,
        });
        if (hasFrontendDomainConfig) {
            new cdk.CfnOutput(this, 'FrontendCustomDomainUrl', {
                description: 'Custom domain for the static site',
                value: `https://${frontendDomain.domainName}`,
            });
        }
    }
}
