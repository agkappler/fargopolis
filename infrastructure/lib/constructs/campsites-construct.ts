import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

/**
 * Stable CloudFormation logical ID for the campsites table.
 * Overrides the default path-derived ID so renaming or moving `CampsitesConstruct` in the tree
 * does not make CloudFormation replace the table.
 */
const CAMPSITES_TABLE_LOGICAL_ID = 'FargopolisCampsitesTable';

/**
 * GSI driving `GET /campsites`. Items arrive A->Z by `nameSortKey`, which the Lambda maintains as
 * `lower(strip(name)) + "#" + campsiteId` on every write that touches `name`. INCLUDE projection
 * keeps the GSI item small (just the catalog-card + map-pin fields).
 *
 * `coverPhotoId`, `visitCount`, and `lastVisitDate` are forward-declared here: items will not carry
 * them until `add-campsite-visits` / `add-campsite-photos` write them, but listing them in the
 * projection now means those later changes never have to recreate the GSI (DynamoDB cannot alter a
 * projection in place).
 *
 * Hot-partition note: every campsite shares the same GSI partition (`entityType="CAMPSITE"`).
 * Fine for a personal-scale catalog; revisit if the dataset ever grows by orders of magnitude.
 */
export const CAMPSITES_BY_NAME_INDEX = 'CampsitesByNameIndex';

/**
 * DynamoDB data for the camping vertical.
 *
 * One item per campsite: the catalog-card fields live at the top level. Later changes nest a
 * `visits` list on the same item (always rendered with the parent, never queried in isolation)
 * and guard concurrent list mutations with a `version` attribute the Lambda increments via
 * `ADD version :one` + `ConditionExpression "version = :oldVersion"`.
 */
export class CampsitesConstruct extends Construct {
    public readonly campsiteTable: dynamodb.Table;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.campsiteTable = new dynamodb.Table(this, 'Campsites', {
            partitionKey: { name: 'campsiteId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        (this.campsiteTable.node.defaultChild as dynamodb.CfnTable).overrideLogicalId(CAMPSITES_TABLE_LOGICAL_ID);

        this.campsiteTable.addGlobalSecondaryIndex({
            indexName: CAMPSITES_BY_NAME_INDEX,
            partitionKey: { name: 'entityType', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'nameSortKey', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.INCLUDE,
            nonKeyAttributes: [
                'name',
                'lat',
                'lng',
                'region',
                'park',
                'travelTimeMinutes',
                'dyrtUrl',
                'firepit',
                'views',
                'privacy',
                'space',
                'coverPhotoId',
                'visitCount',
                'lastVisitDate',
            ],
        });
    }
}
