import * as cdk from 'aws-cdk-lib';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { bundlingForPythonHandlerInLambdasTree, resolveLambdasRoot } from '../python-lambda-bundling';

export interface RecipesApiRoutesProps {
    readonly pythonSharedLayer: lambda.LayerVersion;
    readonly httpApi: apigwv2.HttpApi;
    readonly recipeTable: dynamodb.ITable;
    readonly fileTable: dynamodb.ITable;
}

const RECIPES_ASSET = {
    requiredPaths: ['recipes/handler.py', 'shared/lambda_utils.py'] as const,
    layout: { handlerDir: 'recipes', shared: 'none' as const },
} as const;

/** Recipes Lambda and HTTP API routes (parity path names from legacy Java controllers). */
export class RecipesApiRoutesConstruct extends Construct {
    public readonly handler: lambda.Function;

    constructor(scope: Construct, id: string, props: RecipesApiRoutesProps) {
        super(scope, id);

        const assetPath = resolveLambdasRoot([...RECIPES_ASSET.requiredPaths], 'recipes handler + shared/lambda_utils');

        this.handler = new lambda.Function(this, 'RecipesHandler', {
            runtime: lambda.Runtime.PYTHON_3_12,
            handler: 'handler.handler',
            code: lambda.Code.fromAsset(assetPath, {
                bundling: bundlingForPythonHandlerInLambdasTree(RECIPES_ASSET.layout),
            }),
            layers: [props.pythonSharedLayer],
            architecture: lambda.Architecture.ARM_64,
            timeout: cdk.Duration.seconds(30),
            memorySize: 256,
            environment: {
                RECIPES_TABLE_NAME: props.recipeTable.tableName,
                FILES_TABLE_NAME: props.fileTable.tableName,
            },
        });

        props.recipeTable.grantReadWriteData(this.handler);
        props.fileTable.grantReadData(this.handler);

        const integration = new integrations.HttpLambdaIntegration('RecipesLambdaIntegration', this.handler, {
            scopePermissionToRoute: false,
        });

        const routeSpecs: { path: string; methods: apigwv2.HttpMethod[] }[] = [
            { path: '/api/recipes', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/recipe/{recipeId}', methods: [apigwv2.HttpMethod.GET] },
            { path: '/api/createRecipe', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/updateRecipe', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/addIngredientToRecipe/{recipeId}', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/updateIngredient', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/updateStepsForRecipe/{recipeId}', methods: [apigwv2.HttpMethod.POST] },
            { path: '/api/updateRecipeAvatar', methods: [apigwv2.HttpMethod.POST] },
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
