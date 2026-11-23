#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FargopolisApiStack } from '../lib/stacks/fargopolis-api-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';
import { resolveDomains } from '../lib/domain-context';

const app = new cdk.App();

const tag = app.node.tryGetContext('tag') as string | undefined;
const suffix = tag ? `-${tag}` : '';

// The one domain config (`lib/domain-context.ts`), resolved exactly once before constructing either
// stack so a bad value throws before any synth work. Both stacks get the same derived hostnames.
const domains = resolveDomains(app.node.tryGetContext('domain'), tag);

new FrontendStack(app, `FargopolisFrontend${suffix}`, {
    description: 'Fargopolis frontend: S3 origin + CloudFront',
    tag,
    domains,
});

new FargopolisApiStack(app, `FargopolisApi${suffix}`, {
    description: 'Fargopolis API: DynamoDB, Lambda, API Gateway (bounties first)',
    tag,
    domains,
});

app.synth();
