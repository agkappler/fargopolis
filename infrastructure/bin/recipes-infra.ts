#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FargopolisApiStack } from '../lib/stacks/fargopolis-api-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';

const app = new cdk.App();

new FrontendStack(app, 'FargopolisFrontend', {
    description: 'Fargopolis frontend: S3 origin + CloudFront',
});

new FargopolisApiStack(app, 'FargopolisApi', {
    description: 'Fargopolis API: DynamoDB, Lambda, API Gateway (bounties first)',
});

app.synth();
