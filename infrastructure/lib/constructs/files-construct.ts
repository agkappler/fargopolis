import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

/**
 * Stable CloudFormation logical ID for the files table.
 * Overrides the default path-derived ID so renaming or moving `FilesConstruct` in the tree
 * does not make CloudFormation replace the table.
 */
const FILES_TABLE_LOGICAL_ID = 'FargopolisFilesTable';

/**
 * Shared file-metadata table used across verticals (recipes today; DnD characters next).
 *
 * Items hold the metadata for objects in the user-uploads S3 bucket: `uuId` is preserved so the
 * existing S3 key shape `{uuId}_{filename}` keeps working without copying objects during the
 * Postgres -> Dynamo backfill. Other recipe/character items reference a row here by `fileId`.
 *
 * No GSI in v1; files are only fetched by id from the SPA. Add an index later if admin tooling
 * ever needs "list all files for role X".
 */
export class FilesConstruct extends Construct {
    public readonly fileTable: dynamodb.Table;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.fileTable = new dynamodb.Table(this, 'Files', {
            partitionKey: { name: 'fileId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        (this.fileTable.node.defaultChild as dynamodb.CfnTable).overrideLogicalId(FILES_TABLE_LOGICAL_ID);
    }
}
