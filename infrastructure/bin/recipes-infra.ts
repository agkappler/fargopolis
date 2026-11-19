#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FargopolisApiStack } from '../lib/stacks/fargopolis-api-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';

const app = new cdk.App();

const isDevContext = app.node.tryGetContext('dev');
const dev = isDevContext === true || isDevContext === 'true';

new FrontendStack(app, dev ? 'FargopolisFrontend-dev' : 'FargopolisFrontend', {
    description: 'Fargopolis frontend: S3 origin + CloudFront',
    dev,
});

new FargopolisApiStack(app, dev ? 'FargopolisApi-dev' : 'FargopolisApi', {
    description: 'Fargopolis API: DynamoDB, Lambda, API Gateway (bounties first)',
    dev,
});

app.synth();
