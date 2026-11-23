/**
 * `frontendDomain` context resolution for `FrontendStack`'s custom domain
 * (e.g. `dev.fargopolis.com` -> CloudFront `domainNames`/`certificate` + Route 53 alias).
 *
 * Mirrors `api-domain-context.ts`'s shape and defensive parsing 1:1 (kept independent/duplicated
 * rather than imported, so the two contexts can't accidentally couple to each other):
 * - local deploys read a real JSON object out of gitignored `infrastructure/cdk.context.json`;
 * - CI/one-off runs can pass `-c frontendDomain=<json>` as a string.
 *
 * `cdk -c key=value` sets **string** values only — it never parses JSON — so a naive reader would
 * land here with a string whose every property read is `undefined`. Accept both shapes, and treat
 * a config that is present but unusable as a hard error rather than as "no domain".
 *
 * Unlike `apiDomain`, whose certificate must be in the same region as the API Gateway,
 * `frontendDomain`'s certificate must be in **us-east-1** regardless of the stack's deploy region,
 * because CloudFront is a global service. Parse this context exactly once, in
 * `bin/recipes-infra.ts`, and pass the resulting object into `FrontendStack` via props —
 * `FrontendStack` must not re-read or re-parse context itself.
 */
export type FrontendDomainContext = {
    domainName?: string;
    hostedZoneDomain?: string;
    hostedZoneId?: string;
    certificateArn?: string;
    createDnsRecord?: boolean | string;
};

/** `createDnsRecord` defaults to true; only an explicit "false" opts out of the Route 53 record. */
export function shouldCreateFrontendDomainDnsRecord(frontendDomain: FrontendDomainContext): boolean {
    return `${frontendDomain.createDnsRecord ?? true}`.toLowerCase() !== 'false';
}

function isBlank(value: string | undefined): boolean {
    return (value ?? '').trim().length === 0;
}

/**
 * Normalize `frontendDomain` context into an object, tolerating the `-c` string form.
 *
 * Returns `{}` when no custom domain is configured at all (the raw-CloudFront-domain-only deploy,
 * which is a legitimate setup). Throws when config was supplied but can't be used — silently
 * synthesizing without the domain would drop the CloudFront alias/certificate and Route 53 record.
 */
export function parseFrontendDomainContext(raw: unknown): FrontendDomainContext {
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
                `Context "frontendDomain" was supplied as a string that is not valid JSON, so the frontend ` +
                    `custom domain cannot be configured. Deploying past this would silently drop the CloudFront ` +
                    `alias/certificate and Route 53 record. Check the context value (single-line, minified JSON). ` +
                    `Parse error: ${err}`,
            );
        }
    }

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(
            `Context "frontendDomain" must be a JSON object (or a JSON object encoded as a string), got ${typeof value}.`,
        );
    }

    return value as FrontendDomainContext;
}

/**
 * True when the custom domain resources should be synthesized; false only when no domain is
 * configured. A partially-configured domain throws instead of quietly degrading to false.
 */
export function resolveHasFrontendDomainConfig(frontendDomain: FrontendDomainContext): boolean {
    const createDnsRecord = shouldCreateFrontendDomainDnsRecord(frontendDomain);
    const missing: string[] = [];

    if (isBlank(frontendDomain.domainName)) missing.push('domainName');
    if (isBlank(frontendDomain.certificateArn)) missing.push('certificateArn');
    if (createDnsRecord) {
        if (isBlank(frontendDomain.hostedZoneDomain)) missing.push('hostedZoneDomain');
        if (isBlank(frontendDomain.hostedZoneId)) missing.push('hostedZoneId');
    }

    // Nothing at all supplied: raw-CloudFront-domain-only deploy, which is a supported configuration.
    if (missing.length === 4 || (!createDnsRecord && missing.length === 2)) {
        return false;
    }

    if (missing.length > 0) {
        throw new Error(
            `Context "frontendDomain" is partially configured — missing/blank: ${missing.join(', ')}. ` +
                `Refusing to synthesize without the custom domain, because that would deploy the CloudFront ` +
                `distribution without the expected alias/certificate and Route 53 record. Supply the full object ` +
                `(domainName, certificateArn${createDnsRecord ? ', hostedZoneDomain, hostedZoneId' : ''}) ` +
                `or remove "frontendDomain" entirely to deploy on the raw CloudFront domain only.`,
        );
    }

    return true;
}

/**
 * `tagDomain` context: one shared base config that gives every tagged (`-c tag=<tag>`) frontend
 * deploy its own subdomain, `<tag>.<baseDomain>` (e.g. `dev.fargopolis.com`), without a separate
 * `frontendDomain` per tag. `certificateArn` must be a **us-east-1** wildcard certificate for
 * `*.<baseDomain>` (CloudFront only accepts us-east-1 certificates).
 */
export type TagDomainContext = {
    baseDomain?: string;
    hostedZoneId?: string;
    certificateArn?: string;
};

/**
 * Resolve the effective `frontendDomain` for this deploy.
 *
 * An explicit `frontendDomain` always wins. Otherwise, when a `tag` is set and `tagDomain` is fully
 * configured, derive `<tag>.<baseDomain>`. Untagged (prod) deploys never use `tagDomain`. Because
 * both stacks derive the same name from the tag, the API stack's CORS origin matches the frontend's
 * alias with no cross-stack reference.
 */
export function resolveFrontendDomainForTag(
    frontendDomain: FrontendDomainContext,
    tag: string | undefined,
    rawTagDomain: unknown,
): FrontendDomainContext {
    if (Object.keys(frontendDomain).length > 0 || !tag) {
        return frontendDomain;
    }
    if (rawTagDomain === undefined || rawTagDomain === null || rawTagDomain === '') {
        return frontendDomain;
    }

    let value: unknown = rawTagDomain;
    if (typeof rawTagDomain === 'string') {
        try {
            value = JSON.parse(rawTagDomain.trim());
        } catch (err) {
            throw new Error(`Context "tagDomain" was supplied as a string that is not valid JSON. Parse error: ${err}`);
        }
    }
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(`Context "tagDomain" must be a JSON object, got ${typeof value}.`);
    }

    const tagDomain = value as TagDomainContext;
    const missing = (['baseDomain', 'hostedZoneId', 'certificateArn'] as const).filter((k) => isBlank(tagDomain[k]));
    if (missing.length > 0) {
        throw new Error(
            `Context "tagDomain" is partially configured — missing/blank: ${missing.join(', ')}. ` +
                `Supply baseDomain, hostedZoneId and certificateArn, or remove "tagDomain".`,
        );
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(tag)) {
        throw new Error(`Context "tag" ("${tag}") is not a valid DNS label, so it can't be used as a subdomain.`);
    }

    const baseDomain = tagDomain.baseDomain!.trim().replace(/\.$/, '');
    return {
        domainName: `${tag}.${baseDomain}`,
        hostedZoneDomain: baseDomain,
        hostedZoneId: tagDomain.hostedZoneId!.trim(),
        certificateArn: tagDomain.certificateArn!.trim(),
    };
}
