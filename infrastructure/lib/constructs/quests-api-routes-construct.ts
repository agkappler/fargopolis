import * as cdk from 'aws-cdk-lib';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { bundlingForPythonHandlerInLambdasTree, resolveLambdasRoot } from '../python-lambda-bundling';
import { LAMBDA_PYTHON_RUNTIME } from '../lambda-python';

export interface QuestsApiRoutesProps {
    /** `shared` package + common wheels (`python-lambda-bundling` / `PythonSharedLayerConstruct`). */
    readonly pythonSharedLayer: lambda.LayerVersion;
    /** Shared API — routes are registered here alongside every other vertical. */
    readonly httpApi: apigwv2.HttpApi;
    readonly catalogTable: dynamodb.ITable;
    readonly ledgerTable: dynamodb.ITable;
    readonly balanceTable: dynamodb.ITable;
    readonly rewardsTable: dynamodb.ITable;
}

const QUESTS_ASSET = {
    requiredPaths: ['quests/handler.py', 'shared/lambda_utils.py'] as const,
    layout: { handlerDir: 'quests', shared: 'none' as const },
} as const;

/**
 * Quests Lambda plus HTTP API routes on the shared {@link FargopolisHttpApiConstruct}.
 *
 * Unlike bounties/recipes/dnd, every route here (GET included) requires a signed-in writer —
 * quest data (catalog, balance, history, rewards) is personal, not public reference data. See
 * openspec/changes/add-quests-points-system/design.md's "Auth" decision.
 */
export class QuestsApiRoutesConstruct extends Construct {
    public readonly handler: lambda.Function;

    constructor(scope: Construct, id: string, props: QuestsApiRoutesProps) {
        super(scope, id);

        const assetPath = resolveLambdasRoot([...QUESTS_ASSET.requiredPaths], 'quests + shared/lambda_utils');

        this.handler = new lambda.Function(this, 'QuestHandler', {
            runtime: LAMBDA_PYTHON_RUNTIME,
            handler: 'handler.handler',
            code: lambda.Code.fromAsset(assetPath, {
                bundling: bundlingForPythonHandlerInLambdasTree(assetPath, QUESTS_ASSET.layout),
            }),
            layers: [props.pythonSharedLayer],
            architecture: lambda.Architecture.ARM_64,
            timeout: cdk.Duration.seconds(30),
            memorySize: 256,
            environment: {
                QUEST_CATALOG_TABLE_NAME: props.catalogTable.tableName,
                QUEST_LEDGER_TABLE_NAME: props.ledgerTable.tableName,
                QUEST_BALANCE_TABLE_NAME: props.balanceTable.tableName,
                QUEST_REWARDS_TABLE_NAME: props.rewardsTable.tableName,
            },
        });

        props.catalogTable.grantReadWriteData(this.handler);
        props.ledgerTable.grantReadWriteData(this.handler);
        props.balanceTable.grantReadWriteData(this.handler);
        props.rewardsTable.grantReadWriteData(this.handler);

        const integration = new integrations.HttpLambdaIntegration('QuestLambdaIntegration', this.handler, {
            scopePermissionToRoute: false,
        });

        const routeSpecs: { path: string; methods: apigwv2.HttpMethod[] }[] = [
            { path: '/api/quests', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/createQuest', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/updateQuest', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/completeQuest', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/questBalance', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/questHistory', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/questRewards', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/createQuestReward', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/updateQuestReward', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/redeemQuestReward', methods: [apigwv2.HttpMethod.POST] },
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
