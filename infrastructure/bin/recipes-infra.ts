#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FargopolisApiStack } from '../lib/stacks/fargopolis-api-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';
import { parseFrontendDomainContext, resolveHasFrontendDomainConfig } from '../lib/frontend-domain-context';

const app = new cdk.App();

const tag = app.node.tryGetContext('tag') as string | undefined;
const suffix = tag ? `-${tag}` : '';

// Parsed exactly once, here, before constructing either stack, so a partially-configured value
// throws before any synth work. `FrontendStack` receives the already-parsed object via props and
// never re-parses context itself.
const frontendDomain = parseFrontendDomainContext(app.node.tryGetContext('frontendDomain'));
const hasFrontendDomainConfig = resolveHasFrontendDomainConfig(frontendDomain); // throws on partial config

// Optional extra CORS origins for the API, as a comma-separated string or JSON array of full origins
// (e.g. `-c extraCorsOrigins=https://dxxxx.cloudfront.net`). `make deploy-dev-api` uses it to allow the
// dev frontend's raw CloudFront domain, which has no custom `frontendDomain`.
function parseExtraCorsOrigins(raw: unknown): string[] {
    if (raw === undefined || raw === null || raw === '') return [];
    const list = Array.isArray(raw)
        ? raw
        : String(raw).trim().startsWith('[')
          ? (JSON.parse(String(raw)) as unknown[])
          : String(raw).split(',');
    return list.map((o) => String(o).trim().replace(/\/+$/, '')).filter((o) => o.length > 0);
}
const extraCorsOrigins = parseExtraCorsOrigins(app.node.tryGetContext('extraCorsOrigins'));

new FrontendStack(app, `FargopolisFrontend${suffix}`, {
    description: 'Fargopolis frontend: S3 origin + CloudFront',
    tag,
    frontendDomain,
});

new FargopolisApiStack(app, `FargopolisApi${suffix}`, {
    description: 'Fargopolis API: DynamoDB, Lambda, API Gateway (bounties first)',
    tag,
    frontendDomainName: hasFrontendDomainConfig ? frontendDomain.domainName : undefined,
    extraCorsOrigins,
});

app.synth();
