import * as cdk from 'aws-cdk-lib';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { Construct } from 'constructs';

export interface FargopolisHttpApiConstructProps {
    /**
     * Applied to all routes unless overridden per route (e.g. `authorizer: new apigwv2.HttpNoneAuthorizer()` to skip auth).
     */
    readonly defaultAuthorizer?: apigwv2.IHttpRouteAuthorizer;
}

/**
 * Single API Gateway HTTP API for all Fargopolis Lambdas. Add routes from feature constructs
 * (bounties, recipes, …) so the app exposes one base URL, one CORS config, and one custom domain later.
 *
 */
export class FargopolisHttpApiConstruct extends Construct {
    public readonly httpApi: apigwv2.HttpApi;

    constructor(scope: Construct, id: string, props?: FargopolisHttpApiConstructProps) {
        super(scope, id);

        this.httpApi = new apigwv2.HttpApi(this, 'HttpApi', {
            apiName: 'fargopolis-api',
            description: 'Shared HTTP API for Fargopolis Lambda integrations',
            defaultAuthorizer: props?.defaultAuthorizer,
            corsPreflight: {
                allowHeaders: ['Content-Type', 'Authorization'],
                allowMethods: [
                    apigwv2.CorsHttpMethod.GET,
                    apigwv2.CorsHttpMethod.POST,
                    apigwv2.CorsHttpMethod.PUT,
                    apigwv2.CorsHttpMethod.PATCH,
                    apigwv2.CorsHttpMethod.DELETE,
                    apigwv2.CorsHttpMethod.OPTIONS,
                ],
                allowOrigins: [
                    'http://localhost:3000',
                    'https://localhost:3000',
                    'https://fargopolis.com',
                    'https://www.fargopolis.com',
                    'https://d19091yi7btsr0.cloudfront.net',
                ],
                // Required if the browser sends credentialed requests (`credentials: 'include'`).
                allowCredentials: true,
                maxAge: cdk.Duration.hours(24),
            },
        });
    }
}
