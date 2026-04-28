import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

/**
 * Stable CloudFormation logical IDs for DynamoDB tables.
 * Override the default path-derived IDs so renaming or moving `BountiesConstruct` in the tree
 * does not make CloudFormation replace the tables.
 */
const BOUNTY_CATEGORIES_TABLE_LOGICAL_ID = 'FargopolisBountyCategoriesTable';
const BOUNTIES_TABLE_LOGICAL_ID = 'FargopolisBountiesTable';

/**
 * DynamoDB data for the bounties vertical: categories and bounties (FK via categoryId on each bounty).
 * Optional GSI supports listing bounties by category without a table scan.
 */
export class BountiesConstruct extends Construct {
    public readonly categoryTable: dynamodb.Table;
    public readonly bountyTable: dynamodb.Table;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.categoryTable = new dynamodb.Table(this, 'BountyCategories', {
            partitionKey: { name: 'categoryId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        (this.categoryTable.node.defaultChild as dynamodb.CfnTable).overrideLogicalId(
            BOUNTY_CATEGORIES_TABLE_LOGICAL_ID,
        );

        this.bountyTable = new dynamodb.Table(this, 'Bounties', {
            partitionKey: { name: 'bountyId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        (this.bountyTable.node.defaultChild as dynamodb.CfnTable).overrideLogicalId(BOUNTIES_TABLE_LOGICAL_ID);

        this.bountyTable.addGlobalSecondaryIndex({
            indexName: 'CategoryIndex',
            partitionKey: { name: 'categoryId', type: dynamodb.AttributeType.STRING },
        });
    }
}
