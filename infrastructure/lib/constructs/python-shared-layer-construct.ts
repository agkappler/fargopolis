import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { bundlingForPythonSharedLayer, resolveLambdasRoot } from '../python-lambda-bundling';

/**
 * Lambda layer: `shared` package under `python/lib/python3.12/site-packages` plus wheels from
 * `shared/requirements.txt` (e.g. `python-ulid`, `PyJWT`). Attach to any Python 3.12 / arm64 handler that
 * imports from `shared`.
 */
export class PythonSharedLayerConstruct extends Construct {
    public readonly layer: lambda.LayerVersion;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const assetPath = resolveLambdasRoot(
            ['shared/lambda_utils.py', 'shared/requirements.txt', 'shared/clerk_auth.py'],
            'shared package for Lambda layer',
        );

        this.layer = new lambda.LayerVersion(this, 'Layer', {
            code: lambda.Code.fromAsset(assetPath, {
                bundling: bundlingForPythonSharedLayer(),
            }),
            description: 'Fargopolis shared Python: lambda_utils, clerk_auth, PyJWT, python-ulid',
            compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
            compatibleArchitectures: [lambda.Architecture.ARM_64],
        });
    }
}
