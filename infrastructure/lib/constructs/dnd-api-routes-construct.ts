import * as cdk from 'aws-cdk-lib';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { bundlingForPythonHandlerInLambdasTree, resolveLambdasRoot } from '../python-lambda-bundling';

export interface DndApiRoutesProps {
    readonly pythonSharedLayer: lambda.LayerVersion;
    readonly httpApi: apigwv2.HttpApi;
    readonly characterTable: dynamodb.ITable;
    readonly fileTable: dynamodb.ITable;
}

const DND_ASSET = {
    requiredPaths: ['dnd/handler.py', 'shared/lambda_utils.py'] as const,
    layout: { handlerDir: 'dnd', shared: 'none' as const },
} as const;

/** DnD character Lambda + HTTP API routes (parity paths from Character/Ability/Weapon/KnownSpell controllers). */
export class DndApiRoutesConstruct extends Construct {
    public readonly handler: lambda.Function;

    constructor(scope: Construct, id: string, props: DndApiRoutesProps) {
        super(scope, id);

        const assetPath = resolveLambdasRoot([...DND_ASSET.requiredPaths], 'dnd handler + shared/lambda_utils');

        this.handler = new lambda.Function(this, 'DndHandler', {
            runtime: lambda.Runtime.PYTHON_3_12,
            handler: 'handler.handler',
            code: lambda.Code.fromAsset(assetPath, {
                bundling: bundlingForPythonHandlerInLambdasTree(DND_ASSET.layout),
            }),
            layers: [props.pythonSharedLayer],
            architecture: lambda.Architecture.ARM_64,
            timeout: cdk.Duration.seconds(30),
            memorySize: 256,
            environment: {
                DND_TABLE_NAME: props.characterTable.tableName,
                FILES_TABLE_NAME: props.fileTable.tableName,
            },
        });

        props.characterTable.grantReadWriteData(this.handler);
        props.fileTable.grantReadData(this.handler);

        const integration = new integrations.HttpLambdaIntegration('DndLambdaIntegration', this.handler, {
            scopePermissionToRoute: false,
        });

        const routeSpecs: { path: string; methods: apigwv2.HttpMethod[] }[] = [
            { path: '/api/characters', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/character/{characterId}', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/createCharacter', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/updateCharacter', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/updateAvatar', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/character/{characterId}/resourceIds', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/character/addResource', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/characterAbilities/{characterId}', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/addAbility/{characterId}', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/updateAbility/{abilityId}', methods: [apigwv2.HttpMethod.PUT] },
            { path: '/api/deleteAbility/{abilityId}', methods: [apigwv2.HttpMethod.DELETE] },
            { path: '/api/characterWeapons/{characterId}', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/addWeapon', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/weapon/{weaponId}', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/updateWeapon/{weaponId}', methods: [apigwv2.HttpMethod.PUT] },
            { path: '/api/deleteWeapon/{weaponId}', methods: [apigwv2.HttpMethod.DELETE] },
            { path: '/api/character/{characterId}/knownSpells', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/character/{characterId}/addKnownSpell', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/character/{characterId}/deleteKnownSpell', methods: [apigwv2.HttpMethod.DELETE] },
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
