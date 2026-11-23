#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FargopolisApiStack } from '../lib/stacks/fargopolis-api-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';
import { resolveDomains } from '../lib/domain-context';

const app = new cdk.App();

const tag = app.node.tryGetContext('tag') as string | undefined;
const suffix = tag ? `-${tag}` : '';

// Region and domains are committed in cdk.json, so every machine and CI deploy the same thing; the
// AWS CLI's default region and local context files no longer matter.
const region = app.node.tryGetContext('region') as string | undefined;
if (!region) {
    throw new Error('cdk.json must set context "region" (the region the stacks live in).');
}
const env: cdk.Environment = { account: process.env.CDK_DEFAULT_ACCOUNT, region };

// The one domain config (`lib/domain-context.ts`), resolved exactly once before constructing either
// stack so a bad value throws before any synth work. Both stacks get the same derived hostnames.
const domains = resolveDomains(app.node.tryGetContext('domain'), tag);
if (!tag && !domains) {
    // An untagged (prod) deploy without domains would remove fargopolis.com, www and api.
    throw new Error('Context "domain" is missing; it is committed in cdk.json and required for untagged (prod) stacks.');
}

new FrontendStack(app, `FargopolisFrontend${suffix}`, {
    description: 'Fargopolis frontend: S3 origin + CloudFront',
    env,
    tag,
    domains,
});

new FargopolisApiStack(app, `FargopolisApi${suffix}`, {
    description: 'Fargopolis API: DynamoDB, Lambda, API Gateway (bounties first)',
    env,
    tag,
    domains,
});

app.synth();
