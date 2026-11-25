/**
 * ============================================================================
 * UNIVERSAL TARGET ROUTING & COMPARISON TOPOLOGY ENGINE
 * ============================================================================
 * Pure, zero-dependency domain model supporting both:
 *   1. Prod vs Stage (Candidate = Stage, Baseline = Prod)
 *   2. Prod vs Prod  (Candidate = Prod B / Multi-CDN / Blue-Green, Baseline = Prod A)
 *
 * Across all three real-world routing mechanisms:
 *   A. Same URL + Edge DNS / IP Override (Akamai .edgekey-staging.net vs .edgekey.net)
 *   B. Same URL + Custom Routing Header (AWS CloudFront Continuous Deployment
 *      `x-aws-cf-cd-staging: true`, ALB weighted header, or Envoy canary header)
 *   C. Completely Different URL / Hostname (`https://www-uat1.example.com` vs
 *      `https://www.example.com`, or `https://prod-green.example.com` vs `https://www.example.com`)
 * ============================================================================
 */

import { EnvironmentConfig } from './types';

export type ComparisonPairKind = 'prod-stage' | 'prod-prod';

export type RoutingMechanism = 'edge-dns' | 'custom-header' | 'different-url';

export type CdnOrOriginProvider =
  | 'Akamai Edge'
  | 'AWS CloudFront'
  | 'Direct / Custom URL';

export type ComparisonTopologyModeId =
  | 'prod-stage-akamai'
  | 'prod-stage-aws-header'
  | 'prod-stage-url'
  | 'prod-prod-multicdn'
  | 'prod-prod-url';

export interface TargetEndpointProfile {
  role: 'candidate' | 'baseline';
  label: string;
  tier: 'STAGE' | 'PROD';
  provider: CdnOrOriginProvider;
  routingMechanism: RoutingMechanism;
  baseUrl: string;
  hostname: string;
  edgeHost?: string;
  edgeIp?: string;
  edgeIpOrHost?: string;
  customHeaders: Record<string, string>;
  summaryNote: string;
}

export interface ComparisonTopologyPreset {
  id: ComparisonTopologyModeId;
  shortLabel: string;
  title: string;
  pairKind: ComparisonPairKind;
  routingMechanism: RoutingMechanism;
  providerBadge: string;
  description: string;
  candidateTargetSuffix: 'staging' | 'prod';
  baselineTargetSuffix: 'prod';
  preferredCandidateEnvId?: 'prod' | 'uat';
  preferredBaselineEnvId?: 'prod';
  candidate: TargetEndpointProfile;
  baseline: TargetEndpointProfile;
}

const SECRET_HEADER_KEYS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'proxy-authorization',
]);

export function sanitizePublicHeaders(
  headers: Record<string, string> | undefined
): Record<string, string> {
  if (!headers) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    const cleanKey = k.trim();
    const cleanVal = String(v ?? '').trim();
    if (!cleanKey || !cleanVal) continue;
    if (SECRET_HEADER_KEYS.has(cleanKey.toLowerCase())) continue;
    out[cleanKey] = cleanVal;
  }
  return out;
}

export function parseHeaderKeyValueLine(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!raw || !raw.trim()) return result;
  const parts = raw
    .split(/[;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx <= 0) continue;
    const key = part.slice(0, colonIdx).trim();
    const val = part.slice(colonIdx + 1).trim();
    if (!key || !val) continue;
    if (SECRET_HEADER_KEYS.has(key.toLowerCase())) continue;
    result[key] = val;
  }
  return result;
}

export function formatHeaderKeyValueLine(
  headers: Record<string, string> | undefined
): string {
  const clean = sanitizePublicHeaders(headers);
  return Object.entries(clean)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');
}

export function normalizeBaseUrl(
  rawHostOrUrl: string | TargetEndpointProfile | undefined | null
): {
  baseUrl: string;
  hostname: string;
} {
  const strValue =
    typeof rawHostOrUrl === 'string'
      ? rawHostOrUrl
      : rawHostOrUrl && typeof rawHostOrUrl === 'object'
      ? rawHostOrUrl.baseUrl || rawHostOrUrl.hostname || ''
      : '';
  const trimmed = strValue.trim().replace(/\/+$/, '');
  if (!trimmed) {
    return {
      baseUrl: 'https://www.salesforce.com',
      hostname: 'www.salesforce.com',
    };
  }
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      return {
        baseUrl: `${parsed.protocol}//${parsed.host}`,
        hostname: parsed.hostname,
      };
    } catch {
      const fallbackHost = trimmed.replace(/^https?:\/\//i, '').split('/')[0];
      return {
        baseUrl: `https://${fallbackHost}`,
        hostname: fallbackHost,
      };
    }
  }
  const hostOnly = trimmed.split('/')[0];
  return {
    baseUrl: `https://${hostOnly}`,
    hostname: hostOnly,
  };
}

export function resolveEndpointUrlForPath(
  baseUrlOrProfile: string | TargetEndpointProfile,
  path: string
): string {
  const { baseUrl: normalizedBase } = normalizeBaseUrl(baseUrlOrProfile);
  if (!path) return `${normalizedBase}/`;
  if (/^https?:\/\//i.test(path)) {
    try {
      const parsed = new URL(path);
      return `${normalizedBase}${parsed.pathname || '/'}${parsed.search || ''}`;
    } catch {
      return `${normalizedBase}/`;
    }
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${cleanPath}`;
}

/**
 * Builds the 5 canonical comparison topology presets for any property,
 * covering both Prod vs Stage and Prod vs Prod across Akamai Edge,
 * AWS CloudFront Header Canary, and Completely Different URLs.
 */
export function getComparisonTopologyPresets(
  canonicalHost: string,
  alternateStageHost?: string
): ComparisonTopologyPreset[] {
  const prodNorm = normalizeBaseUrl(canonicalHost || 'www.salesforce.com');
  const stageHostRaw =
    alternateStageHost && alternateStageHost !== prodNorm.hostname
      ? alternateStageHost
      : prodNorm.hostname.startsWith('www.')
      ? prodNorm.hostname.replace(/^www\./, 'www-uat1.')
      : `stage.${prodNorm.hostname}`;
  const stageNorm = normalizeBaseUrl(stageHostRaw);
  const greenProdHostRaw = prodNorm.hostname.startsWith('www.')
    ? prodNorm.hostname.replace(/^www\./, 'www-green.')
    : `prod-b.${prodNorm.hostname}`;
  const greenProdNorm = normalizeBaseUrl(greenProdHostRaw);

  return [
    {
      id: 'prod-stage-akamai',
      shortLabel: 'Prod vs Stage · Akamai Edge',
      title: 'Prod vs Stage — Same URL via Akamai Staging vs Prod Edge',
      pairKind: 'prod-stage',
      routingMechanism: 'edge-dns',
      providerBadge: 'Akamai Case',
      description:
        'Same public URL on both sides. Candidate resolves via Akamai Staging Edge (.edgekey-staging.net) with Pragma debug headers; Baseline resolves via Akamai Production Edge (.edgekey.net).',
      candidateTargetSuffix: 'staging',
      baselineTargetSuffix: 'prod',
      preferredCandidateEnvId: 'prod',
      preferredBaselineEnvId: 'prod',
      candidate: {
        role: 'candidate',
        label: 'Candidate (Akamai Stage Edge)',
        tier: 'STAGE',
        provider: 'Akamai Edge',
        routingMechanism: 'edge-dns',
        baseUrl: prodNorm.baseUrl,
        hostname: prodNorm.hostname,
        edgeHost: `${prodNorm.hostname}.edgekey-staging.net`,
        edgeIp: '23.48.201.18',
        customHeaders: {
          Pragma: 'akamai-x-cache-on, akamai-x-check-cacheable, akamai-x-get-cache-key',
          'x-edge-network': 'akamai-staging',
        },
        summaryNote: `Same URL (${prodNorm.hostname}) routed to .edgekey-staging.net (23.48.201.18)`,
      },
      baseline: {
        role: 'baseline',
        label: 'Baseline (Akamai Prod Edge)',
        tier: 'PROD',
        provider: 'Akamai Edge',
        routingMechanism: 'edge-dns',
        baseUrl: prodNorm.baseUrl,
        hostname: prodNorm.hostname,
        edgeHost: `${prodNorm.hostname}.edgekey.net`,
        edgeIp: '23.212.251.15',
        customHeaders: {
          Pragma: 'akamai-x-cache-on, akamai-x-check-cacheable, akamai-x-get-cache-key',
          'x-edge-network': 'akamai-prod',
        },
        summaryNote: `Same URL (${prodNorm.hostname}) routed to .edgekey.net (23.212.251.15)`,
      },
    },
    {
      id: 'prod-stage-aws-header',
      shortLabel: 'Prod vs Stage · AWS Header',
      title: 'Prod vs Stage — Same URL via AWS CloudFront / ALB Stage Header',
      pairKind: 'prod-stage',
      routingMechanism: 'custom-header',
      providerBadge: 'AWS Case',
      description:
        'Same public URL on both sides. Candidate sends AWS CloudFront Continuous Deployment header (aws-cf-cd-staging: true) to hit staging distribution; Baseline hits live Production.',
      candidateTargetSuffix: 'staging',
      baselineTargetSuffix: 'prod',
      preferredCandidateEnvId: 'prod',
      preferredBaselineEnvId: 'prod',
      candidate: {
        role: 'candidate',
        label: 'Candidate (AWS Stage Header)',
        tier: 'STAGE',
        provider: 'AWS CloudFront',
        routingMechanism: 'custom-header',
        baseUrl: prodNorm.baseUrl,
        hostname: prodNorm.hostname,
        edgeHost: 'd2sfdc-stage.cloudfront.net',
        edgeIp: '18.165.83.19',
        customHeaders: {
          'aws-cf-cd-staging': 'true',
          'x-canary-stage': 'candidate',
        },
        summaryNote: `Same URL (${prodNorm.hostname}) + Header aws-cf-cd-staging: true`,
      },
      baseline: {
        role: 'baseline',
        label: 'Baseline (AWS Prod Live)',
        tier: 'PROD',
        provider: 'AWS CloudFront',
        routingMechanism: 'custom-header',
        baseUrl: prodNorm.baseUrl,
        hostname: prodNorm.hostname,
        edgeHost: 'd2sfdc-prod.cloudfront.net',
        edgeIp: '18.165.83.42',
        customHeaders: {
          'aws-cf-cd-staging': 'false',
        },
        summaryNote: `Same URL (${prodNorm.hostname}) on AWS CloudFront Production`,
      },
    },
    {
      id: 'prod-stage-url',
      shortLabel: 'Prod vs Stage · Different URL',
      title: 'Prod vs Stage — Completely Different Stage URL vs Production URL',
      pairKind: 'prod-stage',
      routingMechanism: 'different-url',
      providerBadge: 'Different URL',
      description:
        'Candidate uses a dedicated Stage/UAT hostname or origin URL while Baseline uses the live Production URL. Redirects and Location headers are normalized automatically.',
      candidateTargetSuffix: 'staging',
      baselineTargetSuffix: 'prod',
      preferredCandidateEnvId: 'uat',
      preferredBaselineEnvId: 'prod',
      candidate: {
        role: 'candidate',
        label: 'Candidate (Stage / UAT URL)',
        tier: 'STAGE',
        provider: 'Direct / Custom URL',
        routingMechanism: 'different-url',
        baseUrl: stageNorm.baseUrl,
        hostname: stageNorm.hostname,
        edgeHost: stageNorm.hostname,
        edgeIp: '23.48.201.18',
        customHeaders: {
          'x-env-target': 'stage-url',
        },
        summaryNote: `Stage URL ${stageNorm.baseUrl} (Location headers normalized to ${prodNorm.hostname})`,
      },
      baseline: {
        role: 'baseline',
        label: 'Baseline (Production URL)',
        tier: 'PROD',
        provider: 'Direct / Custom URL',
        routingMechanism: 'different-url',
        baseUrl: prodNorm.baseUrl,
        hostname: prodNorm.hostname,
        edgeHost: prodNorm.hostname,
        edgeIp: '23.212.251.15',
        customHeaders: {
          'x-env-target': 'prod-url',
        },
        summaryNote: `Live Production URL ${prodNorm.baseUrl}`,
      },
    },
    {
      id: 'prod-prod-multicdn',
      shortLabel: 'Prod vs Prod · Akamai vs AWS',
      title: 'Prod vs Prod — Active-Active Multi-CDN Parity (AWS CloudFront vs Akamai)',
      pairKind: 'prod-prod',
      routingMechanism: 'edge-dns',
      providerBadge: 'Prod vs Prod',
      description:
        'Compares two live Production edges serving the same production site: Candidate on AWS CloudFront Production vs Baseline on Akamai Production Edge.',
      candidateTargetSuffix: 'prod',
      baselineTargetSuffix: 'prod',
      preferredCandidateEnvId: 'prod',
      preferredBaselineEnvId: 'prod',
      candidate: {
        role: 'candidate',
        label: 'Prod B (AWS CloudFront Prod)',
        tier: 'PROD',
        provider: 'AWS CloudFront',
        routingMechanism: 'edge-dns',
        baseUrl: prodNorm.baseUrl,
        hostname: prodNorm.hostname,
        edgeHost: 'd2sfdc-prod.cloudfront.net',
        edgeIp: '18.165.83.42',
        customHeaders: {
          'x-cdn-provider': 'aws-cloudfront-prod',
        },
        summaryNote: `Production on AWS CloudFront (d2sfdc-prod.cloudfront.net · 18.165.83.42)`,
      },
      baseline: {
        role: 'baseline',
        label: 'Prod A (Akamai Prod Edge)',
        tier: 'PROD',
        provider: 'Akamai Edge',
        routingMechanism: 'edge-dns',
        baseUrl: prodNorm.baseUrl,
        hostname: prodNorm.hostname,
        edgeHost: `${prodNorm.hostname}.edgekey.net`,
        edgeIp: '23.212.251.15',
        customHeaders: {
          Pragma: 'akamai-x-cache-on, akamai-x-check-cacheable',
          'x-cdn-provider': 'akamai-prod',
        },
        summaryNote: `Production on Akamai Edge (${prodNorm.hostname}.edgekey.net · 23.212.251.15)`,
      },
    },
    {
      id: 'prod-prod-url',
      shortLabel: 'Prod vs Prod · Different URLs',
      title: 'Prod vs Prod — Blue/Green or Regional Production URLs & Headers',
      pairKind: 'prod-prod',
      routingMechanism: 'different-url',
      providerBadge: 'Prod vs Prod URL',
      description:
        'Compares two distinct Production URLs or Blue/Green production origins (e.g. prod-green URL vs live prod URL) with optional custom headers.',
      candidateTargetSuffix: 'prod',
      baselineTargetSuffix: 'prod',
      preferredCandidateEnvId: 'prod',
      preferredBaselineEnvId: 'prod',
      candidate: {
        role: 'candidate',
        label: 'Prod B (Green / Secondary URL)',
        tier: 'PROD',
        provider: 'Direct / Custom URL',
        routingMechanism: 'different-url',
        baseUrl: greenProdNorm.baseUrl,
        hostname: greenProdNorm.hostname,
        edgeHost: greenProdNorm.hostname,
        edgeIp: '18.165.83.42',
        customHeaders: {
          'x-prod-slice': 'green',
        },
        summaryNote: `Production Green URL ${greenProdNorm.baseUrl}`,
      },
      baseline: {
        role: 'baseline',
        label: 'Prod A (Primary Live URL)',
        tier: 'PROD',
        provider: 'Direct / Custom URL',
        routingMechanism: 'different-url',
        baseUrl: prodNorm.baseUrl,
        hostname: prodNorm.hostname,
        edgeHost: prodNorm.hostname,
        edgeIp: '23.212.251.15',
        customHeaders: {
          'x-prod-slice': 'blue',
        },
        summaryNote: `Production Blue URL ${prodNorm.baseUrl}`,
      },
    },
  ];
}

/**
 * Generates a zero-secret, copy-pasteable cURL command for a target endpoint
 * profile and path, honoring edge-dns (--resolve), custom-header (-H), or
 * different-url routing.
 */
export function buildTopologyCurlCommand(
  profile: TargetEndpointProfile,
  path: string
): string {
  const fullUrl = resolveEndpointUrlForPath(profile.baseUrl, path);
  const { hostname } = normalizeBaseUrl(profile.baseUrl);
  const parts: string[] = ['curl -sS -D - -o /dev/null'];

  if (
    profile.routingMechanism === 'edge-dns' &&
    profile.edgeIp &&
    hostname
  ) {
    parts.push(`--resolve "${hostname}:443:${profile.edgeIp}"`);
  }

  const safeHeaders = sanitizePublicHeaders(profile.customHeaders);
  for (const [k, v] of Object.entries(safeHeaders)) {
    parts.push(`-H "${k}: ${v.replace(/"/g, '\\"')}"`);
  }

  parts.push(`"${fullUrl}"`);
  return parts.join(' ');
}

export interface QuickEnvironmentTemplate {
  id: string;
  badge: string;
  title: string;
  description: string;
  buildEnv: (canonicalHost: string) => EnvironmentConfig;
}

export const QUICK_ENVIRONMENT_TEMPLATES: QuickEnvironmentTemplate[] = [
  {
    id: 'tpl-akamai-stage-prod',
    badge: 'Akamai Case',
    title: 'Akamai Same-URL Stage & Prod Edge',
    description:
      'Same canonical URL routed to .edgekey-staging.net (23.48.201.18) vs .edgekey.net (23.212.251.15) with Akamai Pragma headers.',
    buildEnv: (canonicalHost: string) => ({
      id: 'akamai-edge',
      name: 'Akamai Stage vs Prod Edge',
      tier: 'staging',
      description: 'Same URL with Akamai Staging vs Production Edge IP & Pragma headers',
      hostMap: { [canonicalHost]: canonicalHost },
      networks: ['staging', 'prod'],
      edgeIps: {
        staging: '23.48.201.18',
        prod: '23.212.251.15',
      },
      headers: {
        Pragma: 'akamai-x-cache-on, akamai-x-check-cacheable, akamai-x-get-cache-key',
      },
    }),
  },
  {
    id: 'tpl-aws-cf-header',
    badge: 'AWS Case',
    title: 'AWS CloudFront Header-Routed Stage',
    description:
      'Same URL routed via AWS CloudFront Continuous Deployment header (aws-cf-cd-staging: true) vs Production.',
    buildEnv: (canonicalHost: string) => ({
      id: 'aws-cf-stage',
      name: 'AWS CloudFront Continuous Deploy',
      tier: 'canary',
      description: 'Same URL with aws-cf-cd-staging: true header routing',
      hostMap: { [canonicalHost]: canonicalHost },
      networks: ['staging', 'prod'],
      edgeIps: {
        staging: '18.165.83.19',
        prod: '18.165.83.42',
      },
      headers: {
        'aws-cf-cd-staging': 'true',
        'x-aws-cdn-tier': 'staging-distribution',
      },
    }),
  },
  {
    id: 'tpl-different-url-stage',
    badge: 'Different URL',
    title: 'Completely Different Stage / UAT URL',
    description:
      'Maps canonical production host to a separate staging/UAT URL (e.g. www-uat1.*) with automatic redirect host normalization.',
    buildEnv: (canonicalHost: string) => {
      const stageHost = canonicalHost.startsWith('www.')
        ? canonicalHost.replace(/^www\./, 'www-stage.')
        : `stage-${canonicalHost}`;
      return {
        id: 'stage-url',
        name: 'Dedicated Stage URL',
        tier: 'uat',
        description: `Separate URL (${stageHost}) compared against Production (${canonicalHost})`,
        hostMap: { [canonicalHost]: stageHost },
        networks: ['staging', 'prod'],
        headers: {
          'x-target-origin': stageHost,
        },
      };
    },
  },
  {
    id: 'tpl-prod-prod-multicdn',
    badge: 'Prod vs Prod',
    title: 'Prod vs Prod (AWS CloudFront vs Akamai / Blue-Green)',
    description:
      'Active-active Production comparison between AWS CloudFront Prod and Akamai Prod or Blue/Green production URLs.',
    buildEnv: (canonicalHost: string) => {
      const greenHost = canonicalHost.startsWith('www.')
        ? canonicalHost.replace(/^www\./, 'www-green.')
        : `prod-green.${canonicalHost}`;
      return {
        id: 'prod-green',
        name: 'Prod B (AWS CloudFront / Green Prod)',
        tier: 'prod',
        description: 'Secondary Production target for Prod-vs-Prod multi-CDN or Blue/Green parity',
        hostMap: { [canonicalHost]: greenHost },
        networks: ['prod'],
        edgeIps: {
          prod: '18.165.83.42',
        },
        headers: {
          'x-cdn-provider': 'aws-cloudfront-prod',
          'x-prod-slice': 'green',
        },
      };
    },
  },
];

export type ComparisonTopologyId = ComparisonTopologyModeId;

export const COMPARISON_TOPOLOGY_PRESETS: ComparisonTopologyPreset[] =
  getComparisonTopologyPresets('www.salesforce.com');

export const ENVIRONMENT_PRESET_TEMPLATES: QuickEnvironmentTemplate[] =
  QUICK_ENVIRONMENT_TEMPLATES;

export function getComparisonTopologyPreset(
  presetId: ComparisonTopologyModeId | string,
  canonicalHost = 'www.salesforce.com',
  alternateStageHost?: string
): ComparisonTopologyPreset {
  const presets = getComparisonTopologyPresets(canonicalHost, alternateStageHost);
  return presets.find((p) => p.id === presetId) || presets[0];
}

export function buildTargetProfilesFromPreset(params: {
  presetId: ComparisonTopologyModeId | string;
  canonicalHost: string;
  stagingEdgeIp?: string;
  prodEdgeIp?: string;
  stagingEdgeSuffix?: string;
  prodEdgeSuffix?: string;
}): {
  sideA: TargetEndpointProfile;
  sideB: TargetEndpointProfile;
  candidate: TargetEndpointProfile;
  baseline: TargetEndpointProfile;
} {
  const preset = getComparisonTopologyPreset(params.presetId, params.canonicalHost);
  const sideA: TargetEndpointProfile = {
    ...preset.candidate,
    ...(params.stagingEdgeIp && preset.candidate.routingMechanism === 'edge-dns'
      ? { edgeIp: params.stagingEdgeIp }
      : {}),
  };
  const sideB: TargetEndpointProfile = {
    ...preset.baseline,
    ...(params.prodEdgeIp && preset.baseline.routingMechanism === 'edge-dns'
      ? { edgeIp: params.prodEdgeIp }
      : {}),
  };
  return {
    sideA,
    sideB,
    candidate: sideA,
    baseline: sideB,
  };
}

export function applyEnvironmentTemplate<
  T extends { id: string; name: string; envs: EnvironmentConfig[] }
>(app: T, templateId: string, canonicalHost: string): T {
  const normalizedId =
    templateId === 'tpl-akamai-same-url'
      ? 'tpl-akamai-stage-prod'
      : templateId === 'tpl-different-stage-url'
      ? 'tpl-different-url-stage'
      : templateId === 'tpl-prod-vs-prod-multicdn'
      ? 'tpl-prod-prod-multicdn'
      : templateId;
  const tpl =
    QUICK_ENVIRONMENT_TEMPLATES.find((t) => t.id === normalizedId) ||
    QUICK_ENVIRONMENT_TEMPLATES[0];
  const newEnv = tpl.buildEnv(canonicalHost);
  const exists = app.envs.some((e) => e.id === newEnv.id);
  const nextEnvs = exists
    ? app.envs.map((e) => (e.id === newEnv.id ? newEnv : e))
    : [...app.envs, newEnv];
  return {
    ...app,
    envs: nextEnvs,
  };
}

