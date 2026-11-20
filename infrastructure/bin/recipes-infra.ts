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

new FrontendStack(app, `FargopolisFrontend${suffix}`, {
    description: 'Fargopolis frontend: S3 origin + CloudFront',
    tag,
    frontendDomain,
});

new FargopolisApiStack(app, `FargopolisApi${suffix}`, {
    description: 'Fargopolis API: DynamoDB, Lambda, API Gateway (bounties first)',
    tag,
    frontendDomainName: hasFrontendDomainConfig ? frontendDomain.domainName : undefined,
});

app.synth();
