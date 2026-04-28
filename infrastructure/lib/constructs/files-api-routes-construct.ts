import * as cdk from 'aws-cdk-lib';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { FargopolisBucketConstruct } from './fargopolis-bucket-construct';
import { bundlingForPythonHandlerInLambdasTree, resolveLambdasRoot } from '../python-lambda-bundling';

export interface FilesApiRoutesProps {
    readonly pythonSharedLayer: lambda.LayerVersion;
    readonly httpApi: apigwv2.HttpApi;
    readonly fileTable: dynamodb.ITable;
    readonly uploadsBucket: FargopolisBucketConstruct;
}

const FILES_ASSET = {
    requiredPaths: ['files/handler.py', 'shared/lambda_utils.py'] as const,
    layout: { handlerDir: 'files', shared: 'none' as const },
} as const;
const UPLOADS_BUCKET_ENV = 'FARGOPOLIS_UPLOADS_BUCKET_NAME';

/**
 * Files Lambda for upload presigns and file-url reads.
 * Keeps S3 permissions scoped to this function instead of broad vertical handlers.
 */
export class FilesApiRoutesConstruct extends Construct {
    public readonly handler: lambda.Function;

    constructor(scope: Construct, id: string, props: FilesApiRoutesProps) {
        super(scope, id);

        const assetPath = resolveLambdasRoot([...FILES_ASSET.requiredPaths], 'files handler + shared/lambda_utils');

        this.handler = new lambda.Function(this, 'FilesHandler', {
            runtime: lambda.Runtime.PYTHON_3_12,
            handler: 'handler.handler',
            code: lambda.Code.fromAsset(assetPath, {
                bundling: bundlingForPythonHandlerInLambdasTree(FILES_ASSET.layout),
            }),
            layers: [props.pythonSharedLayer],
            architecture: lambda.Architecture.ARM_64,
            timeout: cdk.Duration.seconds(30),
            memorySize: 256,
            environment: {
                FILES_TABLE_NAME: props.fileTable.tableName,
                [UPLOADS_BUCKET_ENV]: props.uploadsBucket.bucket.bucketName,
            },
        });

        props.fileTable.grantReadWriteData(this.handler);
        props.uploadsBucket.bucket.grantReadWrite(this.handler);

        const integration = new integrations.HttpLambdaIntegration('FilesLambdaIntegration', this.handler, {
            scopePermissionToRoute: false,
        });

        const routeSpecs: { path: string; methods: apigwv2.HttpMethod[] }[] = [
            { path: '/api/fileUrl/{fileId}', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/getLatestResumeUrl', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/files/presignPut', methods: [apigwv2.HttpMethod.POST] },
        ];

        for (const spec of routeSpecs) {
            props.httpApi.addRoutes({
                path: spec.path,
                methods: spec.methods,
                integration,
            });
        }
    }
}
