import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

const DND_TABLE_LOGICAL_ID = 'FargopolisDndCharactersTable';
export const DND_CHARACTERS_BY_NAME_INDEX = 'DndCharactersByNameIndex';

/**
 * DynamoDB backing the DnD character vertical.
 *
 * One item per character document with nested arrays for resources, known spells, weapons, and
 * abilities so detail routes can read the full profile with a single GetItem.
 */
export class DndConstruct extends Construct {
    public readonly characterTable: dynamodb.Table;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.characterTable = new dynamodb.Table(this, 'DndCharacters', {
            partitionKey: { name: 'characterId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        (this.characterTable.node.defaultChild as dynamodb.CfnTable).overrideLogicalId(DND_TABLE_LOGICAL_ID);

        this.characterTable.addGlobalSecondaryIndex({
            indexName: DND_CHARACTERS_BY_NAME_INDEX,
            partitionKey: { name: 'entityType', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'nameSortKey', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.INCLUDE,
            nonKeyAttributes: ['name', 'race', 'subrace', 'className', 'subclassName', 'level', 'avatarFileId'],
        });
    }
}
