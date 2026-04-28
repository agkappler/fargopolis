import * as cdk from 'aws-cdk-lib';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { bundlingForPythonHandlerInLambdasTree, resolveLambdasRoot } from '../python-lambda-bundling';

export interface DndGlossaryApiRoutesProps {
    readonly pythonSharedLayer: lambda.LayerVersion;
    readonly httpApi: apigwv2.HttpApi;
    readonly raceTable: dynamodb.ITable;
    readonly subclassTable: dynamodb.ITable;
}

const DND_GLOSSARY_ASSET = {
    requiredPaths: ['dnd_glossary/handler.py', 'shared/lambda_utils.py'] as const,
    layout: { handlerDir: 'dnd_glossary', shared: 'none' as const },
} as const;

/** DnD glossary Lambda + HTTP API routes (Java DndRaceController + DndSubclassController parity). */
export class DndGlossaryApiRoutesConstruct extends Construct {
    public readonly handler: lambda.Function;

    constructor(scope: Construct, id: string, props: DndGlossaryApiRoutesProps) {
        super(scope, id);

        const assetPath = resolveLambdasRoot(
            [...DND_GLOSSARY_ASSET.requiredPaths],
            'dnd_glossary handler + shared/lambda_utils',
        );

        this.handler = new lambda.Function(this, 'DndGlossaryHandler', {
            runtime: lambda.Runtime.PYTHON_3_12,
            handler: 'handler.handler',
            code: lambda.Code.fromAsset(assetPath, {
                bundling: bundlingForPythonHandlerInLambdasTree(DND_GLOSSARY_ASSET.layout),
            }),
            layers: [props.pythonSharedLayer],
            architecture: lambda.Architecture.ARM_64,
            timeout: cdk.Duration.seconds(30),
            memorySize: 256,
            environment: {
                DND_GLOSSARY_RACES_TABLE_NAME: props.raceTable.tableName,
                DND_GLOSSARY_SUBCLASSES_TABLE_NAME: props.subclassTable.tableName,
            },
        });

        props.raceTable.grantReadWriteData(this.handler);
        props.subclassTable.grantReadWriteData(this.handler);

        const integration = new integrations.HttpLambdaIntegration('DndGlossaryLambdaIntegration', this.handler, {
            scopePermissionToRoute: false,
        });

        const routeSpecs: { path: string; methods: apigwv2.HttpMethod[] }[] = [
            { path: '/api/races', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/races/{raceId}/traits', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/races/{raceId}/updateTraits', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/races/{raceId}', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/createRace', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/subclasses/class/{classIndex}', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/subclasses/createSubclass', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/subclasses/updateSubclass/{subclassId}', methods: [apigwv2.HttpMethod.PUT] },
            { path: '/api/subclasses/deleteSubclass/{subclassId}', methods: [apigwv2.HttpMethod.DELETE] },
            { path: '/api/subclasses/{subclassId}/features', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/subclasses/{subclassId}/updateFeatures', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/subclasses/{subclassId}', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/createSubclass', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/updateSubclass', methods: [apigwv2.HttpMethod.POST] },
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
