import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

/**
 * Stable CloudFormation logical IDs for DynamoDB tables.
 * Override the default path-derived IDs so renaming or moving `QuestsConstruct` in the tree does
 * not make CloudFormation replace the tables.
 */
const QUEST_CATALOG_TABLE_LOGICAL_ID = 'FargopolisQuestCatalogTable';
const QUEST_LEDGER_TABLE_LOGICAL_ID = 'FargopolisQuestLedgerTable';
const QUEST_BALANCE_TABLE_LOGICAL_ID = 'FargopolisQuestBalanceTable';
const QUEST_REWARDS_TABLE_LOGICAL_ID = 'FargopolisQuestRewardsTable';

/**
 * GSI driving `GET /questHistory`. Every ledger item shares the same partition (`entityType =
 * "QUEST_LEDGER"`), sorted by `occurredAt` so a single `Query` returns the full chronological
 * history without a `Scan`.
 *
 * Hot-partition note: a constant partition key is a known anti-pattern at scale, but this is a
 * single-user, low-write-volume personal tool (see design.md's "Ledger GSI uses a constant
 * partition key" risk) — accepted trade-off, same pattern as `RecipesConstruct`'s
 * `RecipesByNameIndex`. Projection is `ALL` because history reads need every ledger attribute
 * (`type`, `pointsDelta`, `questId`/`rewardId`, `occurredAt`), unlike the narrower `INCLUDE`
 * projection recipes uses for its card-only GSI.
 */
const QUEST_LEDGER_CHRONOLOGICAL_INDEX = 'ChronologicalIndex';

/**
 * DynamoDB data for the quests vertical: a task catalog, an append-only completion/redemption
 * ledger, a single running point balance, and a rewards catalog. See
 * openspec/changes/add-quests-points-system/design.md "Data model: four tables, one ledger" for
 * why these are four separate tables rather than one.
 */
export class QuestsConstruct extends Construct {
    public readonly catalogTable: dynamodb.Table;
    public readonly ledgerTable: dynamodb.Table;
    public readonly balanceTable: dynamodb.Table;
    public readonly rewardsTable: dynamodb.Table;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.catalogTable = new dynamodb.Table(this, 'QuestCatalog', {
            partitionKey: { name: 'questId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        (this.catalogTable.node.defaultChild as dynamodb.CfnTable).overrideLogicalId(
            QUEST_CATALOG_TABLE_LOGICAL_ID,
        );

        this.ledgerTable = new dynamodb.Table(this, 'QuestLedger', {
            partitionKey: { name: 'ledgerId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        (this.ledgerTable.node.defaultChild as dynamodb.CfnTable).overrideLogicalId(QUEST_LEDGER_TABLE_LOGICAL_ID);

        this.ledgerTable.addGlobalSecondaryIndex({
            indexName: QUEST_LEDGER_CHRONOLOGICAL_INDEX,
            partitionKey: { name: 'entityType', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'occurredAt', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });

        // Single item (balanceId = "BALANCE"), lazily created by the first TransactWriteItems
        // `Update` (`ADD` against a missing key creates the item) — no seed/migration step needed.
        this.balanceTable = new dynamodb.Table(this, 'QuestBalance', {
            partitionKey: { name: 'balanceId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        (this.balanceTable.node.defaultChild as dynamodb.CfnTable).overrideLogicalId(
            QUEST_BALANCE_TABLE_LOGICAL_ID,
        );

        this.rewardsTable = new dynamodb.Table(this, 'QuestRewards', {
            partitionKey: { name: 'rewardId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        (this.rewardsTable.node.defaultChild as dynamodb.CfnTable).overrideLogicalId(
            QUEST_REWARDS_TABLE_LOGICAL_ID,
        );
    }
}
