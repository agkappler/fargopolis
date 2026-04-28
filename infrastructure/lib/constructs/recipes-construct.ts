import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

/**
 * Stable CloudFormation logical ID for the recipes table.
 * Overrides the default path-derived ID so renaming or moving `RecipesConstruct` in the tree
 * does not make CloudFormation replace the table.
 */
const RECIPES_TABLE_LOGICAL_ID = 'FargopolisRecipesTable';

/**
 * GSI driving `GET /recipes`. Items arrive A->Z by `nameSortKey`, which the Lambda maintains as
 * `lower(strip(name)) + "#" + recipeId` on every write that touches `name`. INCLUDE projection
 * keeps the GSI item small (just the recipe-card fields).
 *
 * Hot-partition note: every recipe shares the same GSI partition (`entityType="RECIPE"`).
 * Fine for a personal-scale catalog; revisit if the dataset ever grows by orders of magnitude.
 */
const RECIPES_BY_NAME_INDEX = 'RecipesByNameIndex';

/**
 * DynamoDB data for the recipes vertical.
 *
 * One item per recipe: the recipe-card fields live at the top level, and `ingredients` and `steps`
 * are nested lists on the same item (always rendered together with the parent in the SPA, never
 * queried in isolation). Concurrent list mutations are guarded by a `version` attribute that the
 * Lambda increments via `ADD version :one` + `ConditionExpression "version = :oldVersion"`.
 */
export class RecipesConstruct extends Construct {
    public readonly recipeTable: dynamodb.Table;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.recipeTable = new dynamodb.Table(this, 'Recipes', {
            partitionKey: { name: 'recipeId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        (this.recipeTable.node.defaultChild as dynamodb.CfnTable).overrideLogicalId(RECIPES_TABLE_LOGICAL_ID);

        this.recipeTable.addGlobalSecondaryIndex({
            indexName: RECIPES_BY_NAME_INDEX,
            partitionKey: { name: 'entityType', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'nameSortKey', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.INCLUDE,
            nonKeyAttributes: [
                'name',
                'prepTimeMinutes',
                'cookTimeMinutes',
                'totalCalories',
                'quantity',
                'avatarFileId',
            ],
        });
    }
}
