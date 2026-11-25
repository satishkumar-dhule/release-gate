import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QUICK_ENVIRONMENT_TEMPLATES,
  buildTopologyCurlCommand,
  formatHeaderKeyValueLine,
  getComparisonTopologyPresets,
  parseHeaderKeyValueLine,
  resolveEndpointUrlForPath,
} from './targetRoutingModel';

test('getComparisonTopologyPresets covers Prod vs Stage and Prod vs Prod across Akamai, AWS Header, and Different URL', () => {
  const presets = getComparisonTopologyPresets(
    'www.salesforce.com',
    'www-uat1.salesforce.com'
  );
  assert.equal(presets.length, 5);

  const ids = presets.map((p) => p.id);
  assert.deepEqual(ids, [
    'prod-stage-akamai',
    'prod-stage-aws-header',
    'prod-stage-url',
    'prod-prod-multicdn',
    'prod-prod-url',
  ]);

  // 1. Akamai Prod vs Stage (same URL, edge-dns)
  const akamai = presets.find((p) => p.id === 'prod-stage-akamai')!;
  assert.equal(akamai.pairKind, 'prod-stage');
  assert.equal(akamai.candidate.tier, 'STAGE');
  assert.equal(akamai.baseline.tier, 'PROD');
  assert.equal(akamai.candidate.baseUrl, 'https://www.salesforce.com');
  assert.equal(akamai.baseline.baseUrl, 'https://www.salesforce.com');
  assert.equal(akamai.candidate.edgeHost, 'www.salesforce.com.edgekey-staging.net');

  // 2. AWS CloudFront Prod vs Stage (same URL, custom-header)
  const aws = presets.find((p) => p.id === 'prod-stage-aws-header')!;
  assert.equal(aws.pairKind, 'prod-stage');
  assert.equal(aws.routingMechanism, 'custom-header');
  assert.equal(aws.candidate.customHeaders['aws-cf-cd-staging'], 'true');

  // 3. Different URL Prod vs Stage
  const diffUrl = presets.find((p) => p.id === 'prod-stage-url')!;
  assert.equal(diffUrl.pairKind, 'prod-stage');
  assert.equal(diffUrl.routingMechanism, 'different-url');
  assert.equal(diffUrl.candidate.baseUrl, 'https://www-uat1.salesforce.com');
  assert.equal(diffUrl.baseline.baseUrl, 'https://www.salesforce.com');

  // 4. Prod vs Prod Multi-CDN (AWS CloudFront Prod vs Akamai Prod)
  const prodProdCdn = presets.find((p) => p.id === 'prod-prod-multicdn')!;
  assert.equal(prodProdCdn.pairKind, 'prod-prod');
  assert.equal(prodProdCdn.candidate.tier, 'PROD');
  assert.equal(prodProdCdn.baseline.tier, 'PROD');
  assert.equal(prodProdCdn.candidate.provider, 'AWS CloudFront');
  assert.equal(prodProdCdn.baseline.provider, 'Akamai Edge');

  // 5. Prod vs Prod Different URLs
  const prodProdUrl = presets.find((p) => p.id === 'prod-prod-url')!;
  assert.equal(prodProdUrl.pairKind, 'prod-prod');
  assert.equal(prodProdUrl.candidate.baseUrl, 'https://www-green.salesforce.com');
  assert.equal(prodProdUrl.baseline.baseUrl, 'https://www.salesforce.com');
});

test('parseHeaderKeyValueLine and buildTopologyCurlCommand enforce zero-secret invariant', () => {
  const parsed = parseHeaderKeyValueLine(
    'aws-cf-cd-staging: true; Authorization: Bearer secret123; Cookie: sid=abc; x-canary: stage'
  );
  assert.deepEqual(parsed, {
    'aws-cf-cd-staging': 'true',
    'x-canary': 'stage',
  });
  assert.equal(
    formatHeaderKeyValueLine(parsed),
    'aws-cf-cd-staging: true; x-canary: stage'
  );

  const presets = getComparisonTopologyPresets('www.salesforce.com');
  const akamaiCurl = buildTopologyCurlCommand(presets[0].candidate, '/products');
  assert.ok(akamaiCurl.includes('--resolve "www.salesforce.com:443:23.48.201.18"'));
  assert.ok(akamaiCurl.includes('"https://www.salesforce.com/products"'));
  assert.ok(!akamaiCurl.toLowerCase().includes('authorization'));

  const awsCurl = buildTopologyCurlCommand(presets[1].candidate, '/pricing');
  assert.ok(awsCurl.includes('-H "aws-cf-cd-staging: true"'));
  assert.ok(awsCurl.includes('"https://www.salesforce.com/pricing"'));
});

test('resolveEndpointUrlForPath and QUICK_ENVIRONMENT_TEMPLATES produce valid URLs and env configs', () => {
  assert.equal(
    resolveEndpointUrlForPath('www-uat1.salesforce.com', '/form/signup'),
    'https://www-uat1.salesforce.com/form/signup'
  );
  assert.equal(QUICK_ENVIRONMENT_TEMPLATES.length, 4);
  const env = QUICK_ENVIRONMENT_TEMPLATES[2].buildEnv('www.salesforce.com');
  assert.equal(env.hostMap['www.salesforce.com'], 'www-stage.salesforce.com');
});
