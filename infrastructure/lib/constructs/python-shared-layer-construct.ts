import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { bundlingForPythonSharedLayer, resolveLambdasRoot } from '../python-lambda-bundling';
import { LAMBDA_PYTHON_RUNTIME } from '../lambda-python';

/**
 * Lambda layer: `shared` package under `python/lib/python<pinned>/site-packages` plus wheels from
 * `shared/requirements.txt` (e.g. `python-ulid`, `PyJWT`). Attach to any Python (pinned in /.python-version) / arm64 handler that
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
                bundling: bundlingForPythonSharedLayer(assetPath),
            }),
            description: 'Fargopolis shared Python: lambda_utils, clerk_auth, PyJWT, python-ulid',
            compatibleRuntimes: [LAMBDA_PYTHON_RUNTIME],
            compatibleArchitectures: [lambda.Architecture.ARM_64],
        });
    }
}
