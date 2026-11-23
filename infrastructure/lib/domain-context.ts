/**
 * The single source of custom-domain config for both stacks: CDK context **`domain`**.
 *
 * Every hostname is derived from the zone and the deploy's `tag`, so there is nothing per-stage to
 * configure and no way for two stages to claim the same name:
 *
 * | Deploy           | Frontend (CloudFront aliases)            | API custom domain   |
 * | ---------------- | ---------------------------------------- | ------------------- |
 * | untagged (prod)  | `<zone>`, `www.<zone>`                   | `api.<zone>`        |
 * | `-c tag=<tag>`   | `<tag>.<zone>`                           | none (raw URL)      |
 *
 * The API's CORS origins are derived from the same frontend hostnames (plus localhost), so they
 * always match the site that calls it. No cross-stack references: both stacks compute the same
 * names from the same context.
 *
 * Delivered like any other context value and deliberately not committed: gitignored
 * `cdk.context.json` for local deploys, or `-c domain=<json>` (the `CDK_DOMAIN_JSON` secret) in CI.
 * Omitting it entirely is supported: both stacks deploy on their raw AWS URLs.
 */
export type DomainContext = {
    /** Route 53 public zone root, e.g. `fargopolis.com`. */
    zone?: string;
    /** That zone's ID. */
    hostedZoneId?: string;
    /**
     * **us-east-1** certificate covering `<zone>` and `*.<zone>` (CloudFront only accepts
     * us-east-1). One certificate serves prod (`<zone>`, `www.<zone>`) and every tag.
     */
    frontendCertificateArn?: string;
    /** Certificate for `api.<zone>` in the **API's own region** (API Gateway regional endpoint). */
    apiCertificateArn?: string;
};

export type ResolvedDomains = {
    zone: string;
    hostedZoneId: string;
    frontend: { hostnames: string[]; certificateArn: string };
    /** Undefined for tagged deploys: they use the raw `execute-api` URL. */
    api?: { hostname: string; certificateArn: string };
    /** Full origins (`https://…`) the API must allow for CORS, derived from the frontend hostnames. */
    corsOrigins: string[];
};

const REQUIRED_KEYS = ['zone', 'hostedZoneId', 'frontendCertificateArn', 'apiCertificateArn'] as const;
const DNS_LABEL = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

function isBlank(value: string | undefined): boolean {
    return (value ?? '').trim().length === 0;
}

/**
 * Parse and validate `domain` context, then derive this deploy's hostnames.
 *
 * Returns `undefined` when no domain is configured (raw-URL-only deploy). Throws when config was
 * supplied but is unusable: silently synthesizing without it would delete live aliases, the API
 * custom domain and their Route 53 records.
 */
export function resolveDomains(raw: unknown, tag: string | undefined): ResolvedDomains | undefined {
    if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
        return undefined;
    }

    let value: unknown = raw;
    if (typeof raw === 'string') {
        try {
            value = JSON.parse(raw.trim());
        } catch (err) {
            throw new Error(
                `Context "domain" was supplied as a string that is not valid JSON (use single-line, minified ` +
                    `JSON). Deploying past this would drop the custom domains. Parse error: ${err}`,
            );
        }
    }
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(`Context "domain" must be a JSON object (or one encoded as a string), got ${typeof value}.`);
    }

    const domain = value as DomainContext;
    const missing = REQUIRED_KEYS.filter((k) => isBlank(domain[k]));
    if (missing.length > 0) {
        throw new Error(
            `Context "domain" is partially configured — missing/blank: ${missing.join(', ')}. Supply all of ` +
                `${REQUIRED_KEYS.join(', ')}, or remove "domain" to deploy on raw AWS URLs only.`,
        );
    }
    if (tag !== undefined && !DNS_LABEL.test(tag)) {
        throw new Error(`Context "tag" ("${tag}") must be a DNS label (lowercase letters, digits, hyphens).`);
    }

    const zone = domain.zone!.trim().replace(/\.$/, '').toLowerCase();
    const frontendHostnames = tag ? [`${tag}.${zone}`] : [zone, `www.${zone}`];

    return {
        zone,
        hostedZoneId: domain.hostedZoneId!.trim(),
        frontend: { hostnames: frontendHostnames, certificateArn: domain.frontendCertificateArn!.trim() },
        api: tag ? undefined : { hostname: `api.${zone}`, certificateArn: domain.apiCertificateArn!.trim() },
        corsOrigins: frontendHostnames.map((h) => `https://${h}`),
    };
}
