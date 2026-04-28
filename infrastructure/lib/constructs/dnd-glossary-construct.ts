import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

const DND_GLOSSARY_RACES_TABLE_LOGICAL_ID = 'FargopolisDndGlossaryRacesTable';
const DND_GLOSSARY_SUBCLASSES_TABLE_LOGICAL_ID = 'FargopolisDndGlossarySubclassesTable';

/** GSI partition value for custom race items (matches DnD characters / recipes list pattern). */
export const DND_GLOSSARY_RACE_ENTITY_TYPE = 'RACE';

/**
 * List custom races A→Z. Lambda maintains `nameSortKey` as `lower(name)#${raceId}` on each write.
 */
export const DND_GLOSSARY_RACES_BY_NAME_INDEX = 'DndGlossaryRacesByNameIndex';

/**
 * List custom subclasses for a D&D class index (e.g. `wizard`), ordered by name.
 * Partition key = `classIndex`, sort key = `nameSortKey` (`lower(name)#${subclassId}`).
 */
export const DND_GLOSSARY_SUBCLASSES_BY_CLASS_INDEX = 'DndGlossarySubclassesByClassIndex';

/**
 * DynamoDB for the DnD glossary vertical (custom races + custom subclasses).
 *
 * **Races** — one item per custom race; `traits` stored as a nested list (parity with Postgres
 * `dnd_race_traits` + `rel_dnd_race_traits` without a separate Dynamo table).
 *
 * **Subclasses** — one item per custom subclass; `features` nested (parity with `subclass_features`).
 */
export class DndGlossaryConstruct extends Construct {
    public readonly raceTable: dynamodb.Table;
    public readonly subclassTable: dynamodb.Table;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.raceTable = new dynamodb.Table(this, 'DndGlossaryRaces', {
            partitionKey: { name: 'raceId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        (this.raceTable.node.defaultChild as dynamodb.CfnTable).overrideLogicalId(DND_GLOSSARY_RACES_TABLE_LOGICAL_ID);

        this.raceTable.addGlobalSecondaryIndex({
            indexName: DND_GLOSSARY_RACES_BY_NAME_INDEX,
            partitionKey: { name: 'entityType', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'nameSortKey', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.INCLUDE,
            nonKeyAttributes: ['name', 'description', 'index'],
        });

        this.subclassTable = new dynamodb.Table(this, 'DndGlossarySubclasses', {
            partitionKey: { name: 'subclassId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        (this.subclassTable.node.defaultChild as dynamodb.CfnTable).overrideLogicalId(
            DND_GLOSSARY_SUBCLASSES_TABLE_LOGICAL_ID,
        );

        this.subclassTable.addGlobalSecondaryIndex({
            indexName: DND_GLOSSARY_SUBCLASSES_BY_CLASS_INDEX,
            partitionKey: { name: 'classIndex', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'nameSortKey', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.INCLUDE,
            nonKeyAttributes: ['name', 'index', 'isCustomClass', 'isCustom'],
        });
    }
}
