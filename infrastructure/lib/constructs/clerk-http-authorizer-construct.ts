import * as cdk from 'aws-cdk-lib';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaAuthorizer, HttpLambdaResponseType } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { bundlingForPythonHandlerInLambdasTree, resolveLambdasRoot } from '../python-lambda-bundling';

/** Clerk JWT verification for the shared HTTP API default authorizer. CDK context key `clerk`. */
export interface ClerkHttpAuthorizerProps {
    /** `shared.clerk_auth` and PyJWT live on this layer. */
    readonly pythonSharedLayer: lambda.LayerVersion;
    readonly jwtIssuer: string;
}

const CLERK_AUTHORIZER_ASSET = {
    requiredPaths: ['clerk_authorizer/handler.py', 'shared/clerk_auth.py'] as const,
    layout: { handlerDir: 'clerk_authorizer', shared: 'none' as const },
} as const;

/**
 * Lambda authorizer + {@link HttpLambdaAuthorizer} for use as {@link apigwv2.HttpApiProps.defaultAuthorizer}.
 * Attach once on the API so every route inherits it unless a route overrides with `authorizer: undefined`
 * or another authorizer.
 */
export class ClerkHttpAuthorizerConstruct extends Construct {
    public readonly handler: lambda.Function;
    public readonly authorizer: apigwv2.IHttpRouteAuthorizer;

    constructor(scope: Construct, id: string, props: ClerkHttpAuthorizerProps) {
        super(scope, id);

        const assetPath = resolveLambdasRoot(
            [...CLERK_AUTHORIZER_ASSET.requiredPaths],
            'clerk authorizer + shared',
        );

        this.handler = new lambda.Function(this, 'ClerkAuthorizer', {
            runtime: lambda.Runtime.PYTHON_3_12,
            handler: 'handler.handler',
            code: lambda.Code.fromAsset(assetPath, {
                bundling: bundlingForPythonHandlerInLambdasTree(CLERK_AUTHORIZER_ASSET.layout),
            }),
            layers: [props.pythonSharedLayer],
            architecture: lambda.Architecture.ARM_64,
            timeout: cdk.Duration.seconds(10),
            memorySize: 256,
            environment: {
                CLERK_JWT_ISSUER: props.jwtIssuer,
            },
        });

        this.authorizer = new HttpLambdaAuthorizer('ClerkJwtAuthorizer', this.handler, {
            responseTypes: [HttpLambdaResponseType.SIMPLE],
            /** Always invoke authorizer so public GETs work without `Authorization` (see AWS HTTP API docs). */
            identitySource: [],
            resultsCacheTtl: cdk.Duration.seconds(0),
        });
    }
}
