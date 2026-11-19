import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { GithubActionsFrontendDeployRoleConstruct } from '../constructs/github-actions-frontend-deploy-role-construct';
import { resolveImportedGithubActionsOidcProviderArn } from '../github-actions-oidc';

export interface FrontendStackProps extends cdk.StackProps {
    /** Hardcoded dev-environment flag; adds a `Stage` tag and exports the CloudFront domain for cross-stack CORS. */
    dev?: boolean;
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
        cdk.Tags.of(this).add('Stage', props?.dev ? 'dev' : 'default');

        this.bucket = new s3.Bucket(this, 'SiteBucket', {
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            versioned: false,
        });

        const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(this.bucket);

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
        });

        if (props?.dev) {
            // Lets the dev API stack (`FargopolisApi-dev`) import this domain via `Fn::ImportValue`
            // to append it to CORS `allowOrigins` — see fargopolis-api-stack.ts. Only emitted for the
            // dev build so the default/prod template gains no new Outputs/Exports.
            this.exportValue(this.distribution.distributionDomainName, {
                name: `${this.stackName}-DistributionDomain`,
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
    }
}
