import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { BountiesApiRoutesConstruct } from '../constructs/bounties-api-routes-construct';
import { BountiesConstruct } from '../constructs/bounties-construct';
import { CampingApiRoutesConstruct } from '../constructs/camping-api-routes-construct';
import { CampsitesConstruct } from '../constructs/campsites-construct';
import { ClerkHttpAuthorizerConstruct } from '../constructs/clerk-http-authorizer-construct';
import { FilesApiRoutesConstruct } from '../constructs/files-api-routes-construct';
import { FargopolisHttpApiConstruct } from '../constructs/fargopolis-http-api-construct';
import { FilesConstruct } from '../constructs/files-construct';
import { PythonSharedLayerConstruct } from '../constructs/python-shared-layer-construct';
import { QuestsConstruct } from '../constructs/quests-construct';
import { QuestsApiRoutesConstruct } from '../constructs/quests-api-routes-construct';
import { RecipesConstruct } from '../constructs/recipes-construct';
import { RecipesApiRoutesConstruct } from '../constructs/recipes-api-routes-construct';
import { FargopolisBucketConstruct } from '../constructs/fargopolis-bucket-construct';
import { DndConstruct } from '../constructs/dnd-construct';
import { DndGlossaryConstruct } from '../constructs/dnd-glossary-construct';
import { DndGlossaryApiRoutesConstruct } from '../constructs/dnd-glossary-api-routes-construct';
import { DndApiRoutesConstruct } from '../constructs/dnd-api-routes-construct';
import { GithubActionsApiDeployRoleConstruct } from '../constructs/github-actions-api-deploy-role-construct';
import { resolveApiGithubDeployOidcProviderArn } from '../github-actions-oidc';
import { ResolvedDomains } from '../domain-context';

export interface FargopolisApiStackProps extends cdk.StackProps {
    /** Generic stack-tag string (e.g. "dev"); adds a `Stage` tag. Only ever set at the Makefile level. */
    tag?: string;
    /**
     * Custom domains resolved once by `bin/recipes-infra.ts` from the `domain` context (see
     * `lib/domain-context.ts`): the API custom domain (untagged deploys only) and the frontend
     * origins allowed for CORS. Undefined: raw `execute-api` URL and localhost-only CORS.
     */
    domains?: ResolvedDomains;
}

/**
 * Serverless API resources (Lambda, API Gateway, DynamoDB, etc.).
 * Initially contains the bounties vertical; more constructs can be added here later.
 */
export class FargopolisApiStack extends cdk.Stack {
    public readonly bounties: BountiesConstruct;
    public readonly quests: QuestsConstruct;
    public readonly recipes: RecipesConstruct;
    public readonly campsites: CampsitesConstruct;
    /** Shared file-metadata table reused across verticals (recipes today, DnD next). */
    public readonly files: FilesConstruct;
    /** Private S3 bucket for user uploads (presigned GET/PUT); not the static-site bucket. */
    public readonly userUploads: FargopolisBucketConstruct;
    /** Shared `shared` package + common wheels; attach to new Python 3.12 arm64 handlers that import it. */
    public readonly pythonSharedLayer: lambda.LayerVersion;
    public readonly clerkAuthorizer: ClerkHttpAuthorizerConstruct;
    public readonly httpApiGateway: FargopolisHttpApiConstruct;
    public readonly bountiesApi: BountiesApiRoutesConstruct;
    public readonly questsApi: QuestsApiRoutesConstruct;
    public readonly filesApi: FilesApiRoutesConstruct;
    public readonly recipesApi: RecipesApiRoutesConstruct;
    public readonly campingApi: CampingApiRoutesConstruct;
    public readonly dnd: DndConstruct;
    /** Custom DnD races (nested traits) and subclasses (nested features) for glossary + character form. */
    public readonly dndGlossary: DndGlossaryConstruct;
    public readonly dndGlossaryApi: DndGlossaryApiRoutesConstruct;
    public readonly dndApi: DndApiRoutesConstruct;
    public readonly customDomain?: apigwv2.DomainName;

    constructor(scope: Construct, id: string, props?: FargopolisApiStackProps) {
        super(scope, id, props);

        cdk.Tags.of(this).add('Project', 'recipes');
        cdk.Tags.of(this).add('Stage', props?.tag || 'default');

        this.bounties = new BountiesConstruct(this, 'Bounties');
        this.quests = new QuestsConstruct(this, 'Quests');
        this.recipes = new RecipesConstruct(this, 'Recipes');
        this.campsites = new CampsitesConstruct(this, 'Campsites');
        this.files = new FilesConstruct(this, 'Files');
        this.dnd = new DndConstruct(this, 'Dnd');
        this.dndGlossary = new DndGlossaryConstruct(this, 'DndGlossary');
        this.userUploads = new FargopolisBucketConstruct(this, 'UserUploads');

        this.pythonSharedLayer = new PythonSharedLayerConstruct(this, 'PythonShared').layer;

        const clerk = (this.node.tryGetContext('clerk') ?? {}) as {
            jwtIssuer?: string;
        };

        this.clerkAuthorizer = new ClerkHttpAuthorizerConstruct(this, 'ClerkAuthorizer', {
            pythonSharedLayer: this.pythonSharedLayer,
            jwtIssuer: clerk.jwtIssuer ?? '',
        });

        const extraAllowOrigins = props?.domains?.corsOrigins ?? [];

        this.httpApiGateway = new FargopolisHttpApiConstruct(this, 'HttpApiGateway', {
            defaultAuthorizer: this.clerkAuthorizer.authorizer,
            extraAllowOrigins,
        });

        this.bountiesApi = new BountiesApiRoutesConstruct(this, 'BountiesApi', {
            pythonSharedLayer: this.pythonSharedLayer,
            httpApi: this.httpApiGateway.httpApi,
            categoryTable: this.bounties.categoryTable,
            bountyTable: this.bounties.bountyTable,
        });
        this.questsApi = new QuestsApiRoutesConstruct(this, 'QuestsApi', {
            pythonSharedLayer: this.pythonSharedLayer,
            httpApi: this.httpApiGateway.httpApi,
            catalogTable: this.quests.catalogTable,
            ledgerTable: this.quests.ledgerTable,
            balanceTable: this.quests.balanceTable,
            rewardsTable: this.quests.rewardsTable,
        });
        this.filesApi = new FilesApiRoutesConstruct(this, 'FilesApi', {
            pythonSharedLayer: this.pythonSharedLayer,
            httpApi: this.httpApiGateway.httpApi,
            fileTable: this.files.fileTable,
            uploadsBucket: this.userUploads,
        });
        this.recipesApi = new RecipesApiRoutesConstruct(this, 'RecipesApi', {
            pythonSharedLayer: this.pythonSharedLayer,
            httpApi: this.httpApiGateway.httpApi,
            recipeTable: this.recipes.recipeTable,
            fileTable: this.files.fileTable,
        });
        this.campingApi = new CampingApiRoutesConstruct(this, 'CampingApi', {
            pythonSharedLayer: this.pythonSharedLayer,
            httpApi: this.httpApiGateway.httpApi,
            campsiteTable: this.campsites.campsiteTable,
        });
        this.dndApi = new DndApiRoutesConstruct(this, 'DndApi', {
            pythonSharedLayer: this.pythonSharedLayer,
            httpApi: this.httpApiGateway.httpApi,
            characterTable: this.dnd.characterTable,
            fileTable: this.files.fileTable,
        });
        this.dndGlossaryApi = new DndGlossaryApiRoutesConstruct(this, 'DndGlossaryApi', {
            pythonSharedLayer: this.pythonSharedLayer,
            httpApi: this.httpApiGateway.httpApi,
            raceTable: this.dndGlossary.raceTable,
            subclassTable: this.dndGlossary.subclassTable,
        });

        const githubActions = (this.node.tryGetContext('githubActions') ?? {}) as {
            owner?: string;
            repo?: string;
            branch?: string;
            oidcProviderArn?: string;
            createOidcProvider?: boolean | string;
        };
        const githubOwner = githubActions.owner ?? 'agkappler';
        const githubRepo = githubActions.repo ?? 'fargopolis';
        const githubBranch = githubActions.branch ?? 'main';
        const githubOidcProviderArn = resolveApiGithubDeployOidcProviderArn(cdk.Stack.of(this), githubActions);
        const githubApiDeployRole = new GithubActionsApiDeployRoleConstruct(this, 'GithubActionsApiDeploy', {
            owner: githubOwner,
            repo: githubRepo,
            oidcProviderArn: githubOidcProviderArn,
        });

        // Untagged (prod) deploys only: `api.<zone>`. Construct IDs are unchanged from the old
        // `apiDomain` setup so the live domain, mapping and record are updated in place, not replaced.
        const apiDomain = props?.domains?.api;
        if (props?.domains && apiDomain) {
            const certificate = acm.Certificate.fromCertificateArn(
                this,
                'HttpApiCustomDomainCert',
                apiDomain.certificateArn,
            );

            this.customDomain = new apigwv2.DomainName(this, 'HttpApiCustomDomain', {
                domainName: apiDomain.hostname,
                certificate,
            });
            new apigwv2.ApiMapping(this, 'HttpApiCustomDomainMapping', {
                api: this.httpApiGateway.httpApi,
                domainName: this.customDomain,
                stage: this.httpApiGateway.httpApi.defaultStage,
            });

            const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HttpApiHostedZone', {
                hostedZoneId: props.domains.hostedZoneId,
                zoneName: props.domains.zone,
            });
            new route53.ARecord(this, 'HttpApiCustomDomainAliasRecord', {
                zone: hostedZone,
                recordName: apiDomain.hostname,
                target: route53.RecordTarget.fromAlias(
                    new targets.ApiGatewayv2DomainProperties(
                        this.customDomain.regionalDomainName,
                        this.customDomain.regionalHostedZoneId,
                    ),
                ),
            });
        }

        new cdk.CfnOutput(this, 'BountyCategoriesTableName', {
            description: 'DynamoDB table for bounty categories',
            value: this.bounties.categoryTable.tableName,
        });
        new cdk.CfnOutput(this, 'BountiesTableName', {
            description: 'DynamoDB table for bounties',
            value: this.bounties.bountyTable.tableName,
        });
        new cdk.CfnOutput(this, 'QuestCatalogTableName', {
            description: 'DynamoDB table for quest catalog items',
            value: this.quests.catalogTable.tableName,
        });
        new cdk.CfnOutput(this, 'QuestLedgerTableName', {
            description: 'DynamoDB table for quest completion/redemption ledger entries',
            value: this.quests.ledgerTable.tableName,
        });
        new cdk.CfnOutput(this, 'QuestBalanceTableName', {
            description: 'DynamoDB table for the single running quest point balance',
            value: this.quests.balanceTable.tableName,
        });
        new cdk.CfnOutput(this, 'QuestRewardsTableName', {
            description: 'DynamoDB table for quest rewards',
            value: this.quests.rewardsTable.tableName,
        });
        new cdk.CfnOutput(this, 'RecipesTableName', {
            description: 'DynamoDB table for recipes (single item per recipe; ingredients/steps nested)',
            value: this.recipes.recipeTable.tableName,
        });
        new cdk.CfnOutput(this, 'CampsitesTableName', {
            description: 'DynamoDB table for campsites (single item per campsite; visits nested in later changes)',
            value: this.campsites.campsiteTable.tableName,
        });
        new cdk.CfnOutput(this, 'FilesTableName', {
            description: 'DynamoDB table for shared file metadata (recipes + DnD)',
            value: this.files.fileTable.tableName,
        });
        new cdk.CfnOutput(this, 'DndCharactersTableName', {
            description: 'DynamoDB table for DnD character documents (nested resources/spells/weapons/abilities)',
            value: this.dnd.characterTable.tableName,
        });
        new cdk.CfnOutput(this, 'DndGlossaryRacesTableName', {
            description: 'DynamoDB table for custom DnD races (traits nested on each item)',
            value: this.dndGlossary.raceTable.tableName,
        });
        new cdk.CfnOutput(this, 'DndGlossarySubclassesTableName', {
            description: 'DynamoDB table for custom DnD subclasses (features nested on each item)',
            value: this.dndGlossary.subclassTable.tableName,
        });
        new cdk.CfnOutput(this, 'FargopolisBucket', {
            description: 'S3 bucket for user uploads (objects keyed as {uuId}_{filename})',
            value: this.userUploads.bucket.bucketName,
        });
        new cdk.CfnOutput(this, 'HttpApiUrl', {
            description: 'Shared HTTP API base URL (all Lambda routes; use with /api/... paths)',
            value: this.httpApiGateway.httpApi.apiEndpoint,
        });
        new cdk.CfnOutput(this, 'GithubActionsApiDeployRoleArn', {
            description: `Role ARN for GitHub Actions OIDC CDK deploys (${githubOwner}/${githubRepo}@${githubBranch})`,
            value: githubApiDeployRole.role.roleArn,
        });
        if (this.customDomain) {
            new cdk.CfnOutput(this, 'HttpApiCustomDomainOutput', {
                description: 'Custom domain for the shared HTTP API',
                value: this.customDomain.name,
            });
        }
    }
}
