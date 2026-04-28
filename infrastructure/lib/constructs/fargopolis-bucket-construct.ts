import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

const FARGOPOLIS_BUCKET_LOGICAL_ID = 'FargopolisBucket';

/**
 * Optional context: `cdk.json` / CLI `-c` under key `uploadsBucket.corsAllowedOrigins` — list of
 * S3 CORS `AllowedOrigins`; default `['*']`. Tighten in production to your CloudFront and local dev URLs.
 */
export class FargopolisBucketConstruct extends Construct {
    public readonly bucket: s3.Bucket;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const ctx = (this.node.tryGetContext('uploadsBucket') ?? {}) as { corsAllowedOrigins?: string[] };
        const corsOrigins = ctx.corsAllowedOrigins?.length ? ctx.corsAllowedOrigins : ['*'];

        this.bucket = new s3.Bucket(this, 'UserUploads', {
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            enforceSSL: true,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            autoDeleteObjects: false,
            cors: [
                {
                    allowedMethods: [
                        s3.HttpMethods.GET,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.HEAD,
                        s3.HttpMethods.POST,
                    ],
                    allowedOrigins: corsOrigins,
                    allowedHeaders: ['*'],
                    exposedHeaders: ['ETag', 'x-amz-request-id', 'x-amz-version-id'],
                    maxAge: 3000,
                },
            ],
        });
        (this.bucket.node.defaultChild as s3.CfnBucket).overrideLogicalId(FARGOPOLIS_BUCKET_LOGICAL_ID);
    }
}
