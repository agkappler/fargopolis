import * as cdk from 'aws-cdk-lib';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { bundlingForPythonHandlerInLambdasTree, resolveLambdasRoot } from '../python-lambda-bundling';

export interface BountiesApiRoutesProps {
    /** `shared` package + common wheels (`python-lambda-bundling` / `PythonSharedLayerConstruct`). */
    readonly pythonSharedLayer: lambda.LayerVersion;
    /** Shared API — routes are registered here alongside future verticals. */
    readonly httpApi: apigwv2.HttpApi;
    readonly categoryTable: dynamodb.ITable;
    readonly bountyTable: dynamodb.ITable;
}

const BOUNTIES_ASSET = {
    requiredPaths: ['bounties/handler.py', 'shared/lambda_utils.py'] as const,
    layout: { handlerDir: 'bounties', shared: 'none' as const },
} as const;

/**
 * Bounties Lambda plus HTTP API routes on the shared {@link FargopolisHttpApiConstruct}.
 * Uses the API-level default Clerk authorizer; writes require a signed-in user (validated JWT).
 */
export class BountiesApiRoutesConstruct extends Construct {
    public readonly handler: lambda.Function;

    constructor(scope: Construct, id: string, props: BountiesApiRoutesProps) {
        super(scope, id);

        const assetPath = resolveLambdasRoot(
            [...BOUNTIES_ASSET.requiredPaths],
            'bounties + shared/lambda_utils',
        );

        this.handler = new lambda.Function(this, 'BountyHandler', {
            runtime: lambda.Runtime.PYTHON_3_12,
            handler: 'handler.handler',
            code: lambda.Code.fromAsset(assetPath, {
                bundling: bundlingForPythonHandlerInLambdasTree(BOUNTIES_ASSET.layout),
            }),
            layers: [props.pythonSharedLayer],
            architecture: lambda.Architecture.ARM_64,
            timeout: cdk.Duration.seconds(30),
            memorySize: 256,
            environment: {
                BOUNTY_CATEGORIES_TABLE_NAME: props.categoryTable.tableName,
                BOUNTIES_TABLE_NAME: props.bountyTable.tableName,
            },
        });

        props.categoryTable.grantReadWriteData(this.handler);
        props.bountyTable.grantReadWriteData(this.handler);

        const integration = new integrations.HttpLambdaIntegration('BountyLambdaIntegration', this.handler, {
            scopePermissionToRoute: false,
        });

        const routeSpecs: { path: string; methods: apigwv2.HttpMethod[] }[] = [
            { path: '/api/bounties', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/bountyCategories', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/createBounty', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/updateBounty', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/createBountyCategory', methods: [apigwv2.HttpMethod.POST] },
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
