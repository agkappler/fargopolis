import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

/**
 * Stable CloudFormation logical ID for the files table.
 * Overrides the default path-derived ID so renaming or moving `FilesConstruct` in the tree
 * does not make CloudFormation replace the table.
 */
const FILES_TABLE_LOGICAL_ID = 'FargopolisFilesTable';

export const FILE_ROLE_INDEX = 'FileRoleIndex';

/**
 * Shared file-metadata table used across verticals (recipes today; DnD characters next).
 *
 * Items hold the metadata for objects in the user-uploads S3 bucket: `uuId` is preserved so the
 * existing S3 key shape `{uuId}_{filename}` keeps working without copying objects during the
 * Postgres -> Dynamo backfill. Other recipe/character items reference a row here by `fileId`.
 *
 * `FileRoleIndex` supports "list all files for role X" (e.g. the latest RESUME) with a `Query`
 * instead of a table-wide `Scan`. Only string-typed `fileRole` values are indexed by it -- a
 * handful of pre-migration Postgres rows may still carry a DynamoDB Number `fileRole` and won't
 * show up in the index (see `files/handler.py`'s `_get_latest_resume_url`; normalizing those rows
 * is the `migration-leftovers` cleanup item in `post_migration_cleanup.plan.md`).
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

        this.fileTable.addGlobalSecondaryIndex({
            indexName: FILE_ROLE_INDEX,
            partitionKey: { name: 'fileRole', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.INCLUDE,
            nonKeyAttributes: ['fileId', 'uuId', 'filename'],
        });
    }
}
