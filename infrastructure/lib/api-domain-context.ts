/**
 * `apiDomain` context resolution for `FargopolisApiStack`'s custom domain
 * (`api.fargopolis.com` -> API Gateway `DomainName` + `ApiMapping` + Route 53 alias).
 *
 * Two delivery paths have to agree on the same shape:
 * - local deploys read a real JSON object out of gitignored `infrastructure/cdk.context.json`;
 * - CI passes the `CDK_API_DOMAIN_JSON` secret as `-c apiDomain=<json>`.
 *
 * `cdk -c key=value` sets **string** values only — it never parses JSON — so the CI path used to
 * land here as a string whose every property read was `undefined`. That silently failed the
 * "is the domain configured?" test, dropped the three domain resources from the template, and
 * CloudFormation deleted a live production domain on the next deploy. Accept both shapes, and
 * treat a config that is present but unusable as a hard error rather than as "no domain".
 */
export type ApiDomainContext = {
    domainName?: string;
    hostedZoneDomain?: string;
    hostedZoneId?: string;
    certificateArn?: string;
    createDnsRecord?: boolean | string;
};

/** `createDnsRecord` defaults to true; only an explicit "false" opts out of the Route 53 record. */
export function shouldCreateApiDomainDnsRecord(apiDomain: ApiDomainContext): boolean {
    return `${apiDomain.createDnsRecord ?? true}`.toLowerCase() !== 'false';
}

function isBlank(value: string | undefined): boolean {
    return (value ?? '').trim().length === 0;
}

/**
 * Normalize `apiDomain` context into an object, tolerating the `-c` string form.
 *
 * Returns `{}` when no custom domain is configured at all (the execute-api-only deploy, which is
 * a legitimate setup). Throws when config was supplied but can't be used — silently synthesizing
 * without the domain is what tore down `api.fargopolis.com`.
 */
export function parseApiDomainContext(raw: unknown): ApiDomainContext {
    if (raw === undefined || raw === null) {
        return {};
    }

    let value: unknown = raw;

    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (trimmed.length === 0) {
            return {};
        }
        try {
            value = JSON.parse(trimmed);
        } catch (err) {
            throw new Error(
                `Context "apiDomain" was supplied as a string that is not valid JSON, so the API custom domain ` +
                    `cannot be configured. Deploying past this would delete the live custom domain and its Route 53 ` +
                    `record. Check the CDK_API_DOMAIN_JSON secret (single-line, minified JSON). Parse error: ${err}`,
            );
        }
    }

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(
            `Context "apiDomain" must be a JSON object (or a JSON object encoded as a string), got ${typeof value}.`,
        );
    }

    return value as ApiDomainContext;
}

/**
 * True when the custom domain resources should be synthesized; false only when no domain is
 * configured. A partially-configured domain throws instead of quietly degrading to false.
 */
export function resolveHasApiDomainConfig(apiDomain: ApiDomainContext): boolean {
    const createDnsRecord = shouldCreateApiDomainDnsRecord(apiDomain);
    const missing: string[] = [];

    if (isBlank(apiDomain.domainName)) missing.push('domainName');
    if (isBlank(apiDomain.certificateArn)) missing.push('certificateArn');
    if (createDnsRecord) {
        if (isBlank(apiDomain.hostedZoneDomain)) missing.push('hostedZoneDomain');
        if (isBlank(apiDomain.hostedZoneId)) missing.push('hostedZoneId');
    }

    // Nothing at all supplied: execute-api-only deploy, which is a supported configuration.
    if (missing.length === 4 || (!createDnsRecord && missing.length === 2)) {
        return false;
    }

    if (missing.length > 0) {
        throw new Error(
            `Context "apiDomain" is partially configured — missing/blank: ${missing.join(', ')}. ` +
                `Refusing to synthesize without the custom domain, because that would delete the live ` +
                `API Gateway domain and its Route 53 alias record. Supply the full object ` +
                `(domainName, certificateArn${createDnsRecord ? ', hostedZoneDomain, hostedZoneId' : ''}) ` +
                `or remove "apiDomain" entirely to deploy execute-api URLs only.`,
        );
    }

    return true;
}
