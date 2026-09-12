import * as cdk from 'aws-cdk-lib';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { bundlingForPythonHandlerInLambdasTree, resolveLambdasRoot } from '../python-lambda-bundling';

export interface CampingApiRoutesProps {
    /** `shared` package + common wheels (`python-lambda-bundling` / `PythonSharedLayerConstruct`). */
    readonly pythonSharedLayer: lambda.LayerVersion;
    /** Shared API — routes are registered here alongside the other verticals. */
    readonly httpApi: apigwv2.HttpApi;
    readonly campsiteTable: dynamodb.ITable;
}

const CAMPING_ASSET = {
    requiredPaths: ['camping/handler.py', 'shared/lambda_utils.py'] as const,
    layout: { handlerDir: 'camping', shared: 'none' as const },
} as const;

/**
 * Camping Lambda plus HTTP API routes on the shared {@link FargopolisHttpApiConstruct}.
 * Uses the API-level default Clerk authorizer; writes require a signed-in user (validated JWT).
 */
export class CampingApiRoutesConstruct extends Construct {
    public readonly handler: lambda.Function;

    constructor(scope: Construct, id: string, props: CampingApiRoutesProps) {
        super(scope, id);

        const assetPath = resolveLambdasRoot(
            [...CAMPING_ASSET.requiredPaths],
            'camping handler + shared/lambda_utils',
        );

        this.handler = new lambda.Function(this, 'CampingHandler', {
            runtime: lambda.Runtime.PYTHON_3_12,
            handler: 'handler.handler',
            code: lambda.Code.fromAsset(assetPath, {
                bundling: bundlingForPythonHandlerInLambdasTree(CAMPING_ASSET.layout),
            }),
            layers: [props.pythonSharedLayer],
            architecture: lambda.Architecture.ARM_64,
            timeout: cdk.Duration.seconds(30),
            memorySize: 256,
            environment: {
                CAMPSITES_TABLE_NAME: props.campsiteTable.tableName,
            },
        });

        props.campsiteTable.grantReadWriteData(this.handler);

        const integration = new integrations.HttpLambdaIntegration('CampingLambdaIntegration', this.handler, {
            scopePermissionToRoute: false,
        });

        const routeSpecs: { path: string; methods: apigwv2.HttpMethod[] }[] = [
            { path: '/api/campsites', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/campsite/{campsiteId}', methods: [apigwv2.HttpMethod.GET, apigwv2.HttpMethod.DELETE] },
            { path: '/api/createCampsite', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/updateCampsite', methods: [apigwv2.HttpMethod.POST] },
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
