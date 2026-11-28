import { InspectorDimensionTab, WorkbenchViewMode } from './workbenchModel';

export type SlideCategory = 'all' | 'journey' | 'architecture' | 'features';

export type SlideSimulatorType =
  | 'edge-pop-router'
  | 'journey-timeline'
  | 'hostmap-normalizer'
  | 'cost-gate-sandbox'
  | 'single-run-stream'
  | 'mcp-rpc-console';

export interface SlideInteractiveCta {
  label: string;
  targetView: WorkbenchViewMode;
  compareMode?: 'compare' | 'single';
  inspectorTab?: InspectorDimensionTab;
  setupTab?: 'suite' | 'envs' | 'policies';
  description: string;
}

export interface SlideDiagramStep {
  stepNumber: string;
  title: string;
  subtitle: string;
  technicalDetail: string;
  metricOrBadge: string;
}

export interface SlideHighlightCard {
  kicker: string;
  title: string;
  body: string;
  codeOrFormula?: string;
}

export interface SlideQuantMetric {
  value: string;
  label: string;
  context: string;
}

export interface VideoChapterMarker {
  timestampSec: number;
  timeLabel: string;
  title: string;
  detail: string;
}

export interface AppWalkthroughVideo {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  durationLabel: string;
  src: string;
  relatedSlideId: string;
  chapters: VideoChapterMarker[];
  primaryCta: SlideInteractiveCta;
}

export interface AboutSlideDefinition {
  id: string;
  number: string;
  category: Exclude<SlideCategory, 'all'>;
  categoryLabel: string;
  title: string;
  subtitle: string;
  executiveSummary: string;
  keyTakeaway: string;
  diagramTitle: string;
  simulatorType: SlideSimulatorType;
  videoId: string;
  metrics: SlideQuantMetric[];
  diagramSteps: SlideDiagramStep[];
  highlights: SlideHighlightCard[];
  primaryCta: SlideInteractiveCta;
  secondaryCta?: SlideInteractiveCta;
}

export const APP_WALKTHROUGH_VIDEOS: AppWalkthroughVideo[] = [
  {
    id: 'video-fleet-canary-pop',
    number: '01',
    title: 'Global Fleet & PoP-Targeted Canary Execution',
    subtitle:
      'Watch how an operator selects a specific global Edge PoP (NRT — Tokyo), opens the AWS CloudWatch Synthetics Canary Drawer, and streams a live multi-check probe.',
    durationLabel: '0:06 HD Walkthrough',
    src: '/assets/videos/walkthrough-1-fleet-canary-pop.webm',
    relatedSlideId: 'slide-overview',
    chapters: [
      {
        timestampSec: 0,
        timeLabel: '0:00',
        title: 'Select Global Edge PoP (NRT · Tokyo)',
        detail: 'Overrides the property default PoP to route canary checks through Tokyo Edge IP 23.54.18.92.',
      },
      {
        timestampSec: 1.5,
        timeLabel: '0:02',
        title: 'Inspect Canary Deep-Dive Drawer',
        detail: 'Opens ak-americas-prod-stg with 12 synthetic checks, historical runs, and AWS CLI reproduction.',
      },
      {
        timestampSec: 3.0,
        timeLabel: '0:03',
        title: 'Trigger Live Canary Probe & Telemetry Stream',
        detail: 'Executes live HTTP flow, 1280×760 DOM capture, and 3-Dim gate evaluation with real-time progress.',
      },
    ],
    primaryCta: {
      label: 'Launch 1. Sites & Canaries Live',
      targetView: 'synthetics',
      description: 'Open the fleet table and trigger a PoP-targeted canary run',
    },
  },
  {
    id: 'video-compare-visual-gate',
    number: '02',
    title: '2-Environment Diff Gate & Visual Bounding-Box Waiver',
    subtitle:
      'See how Candidate (Env A) vs Baseline (Env B) diffs are inspected across Side-by-Side, Wipe Slider, and RGBA Pixel Heatmap modes—with 1-click region acceptance.',
    durationLabel: '0:07 HD Walkthrough',
    src: '/assets/videos/walkthrough-2-compare-visual-gate.webm',
    relatedSlideId: 'slide-3dim-gate-engine',
    chapters: [
      {
        timestampSec: 0,
        timeLabel: '0:00',
        title: 'Open 2. Compare Release Gate Workbench',
        detail: 'Displays side-by-side HTTP headers, Set-Cookie parity, and visual drift percentages.',
      },
      {
        timestampSec: 1.5,
        timeLabel: '0:02',
        title: 'Pin & Accept Visual Diff Region',
        detail: 'Clicks a bounding box to pin its inspection card and accepts the region via the persistent Diff Regions bar.',
      },
      {
        timestampSec: 3.5,
        timeLabel: '0:04',
        title: 'Wipe Slider & RGBA Pixel Heatmap Modes',
        detail: 'Interactive 50/50 split wipe comparison and zone-grounded RGBA diff heatmap overlay.',
      },
    ],
    primaryCta: {
      label: 'Open 2. Compare Visual Gate Live',
      targetView: 'workbench',
      compareMode: 'compare',
      inspectorTab: 'image',
      description: 'Jump directly to the Visual Diff inspector in 2. Compare',
    },
  },
  {
    id: 'video-single-run-and-mcp',
    number: '03',
    title: 'Full Single-Run Inspector & Headless MCP JSON-RPC Studio',
    subtitle:
      'Explore dedicated Single Run inspection (all captured headers, cookies, 1280×760 DOM snapshot, and multi-hop waterfall) plus live MCP JSON-RPC 2.0 agent calls.',
    durationLabel: '0:06 HD Walkthrough',
    src: '/assets/videos/walkthrough-3-single-run-and-mcp.webm',
    relatedSlideId: 'slide-automation-mcp-iac',
    chapters: [
      {
        timestampSec: 0,
        timeLabel: '0:00',
        title: 'Switch to Dedicated Single Run View',
        detail: 'Inspects 100% of captured headers, cookies, SLA assertions, and 1280×760 DOM capture for one target.',
      },
      {
        timestampSec: 1.6,
        timeLabel: '0:02',
        title: 'Multi-Hop HTTP Redirect & Timing Waterfall',
        detail: 'Traces DNS, TCP, TLS, TTFB, and content transfer timings per hop with zero-secret curl --resolve.',
      },
      {
        timestampSec: 3.2,
        timeLabel: '0:04',
        title: '4. Automate · Live MCP JSON-RPC 2.0 Handshake',
        detail: 'Pings /api/v1/mcp/rpc and executes headless synthetic gate tools for Cursor, Claude, and CI/CD.',
      },
    ],
    primaryCta: {
      label: 'Open 4. Automate (MCP Studio) Live',
      targetView: 'studio',
      description: 'Execute live JSON-RPC 2.0 calls against the built-in MCP server',
    },
  },
];

export const ABOUT_SLIDES: AboutSlideDefinition[] = [
  {
    id: 'slide-overview',
    number: '01',
    category: 'journey',
    categoryLabel: 'Executive Overview',
    title: 'What is Synthetic Release Gate & Why It Exists',
    subtitle:
      'A deterministic pre-cutover verification gate for CDN Edge, CloudFront, and multi-region web properties.',
    executiveSummary:
      'Modern enterprise web releases fail silently at the CDN edge—missing cache keys, leaked staging redirects, dropped security cookies, or broken layout regressions. Synthetic Release Gate probes your environments from 9 global Edge PoPs and gives an objective GO, REVIEW, or NO-GO verdict in seconds.',
    keyTakeaway:
      'Replace manual curl scripts and eyeball screenshot checks with an automated, evidence-backed release decision across every site.',
    diagramTitle: 'End-to-End Release Gate Pipeline',
    simulatorType: 'edge-pop-router',
    videoId: 'video-fleet-canary-pop',
    metrics: [
      {
        value: '14 Sites · 352 Checks',
        label: 'Global Fleet Coverage',
        context: 'Scales up to 50 properties × 64 checks per suite',
      },
      {
        value: '9 Global Edge PoPs',
        label: 'Geo-Targeted Routing',
        context: 'AMER, EMEA, and APAC Akamai & CloudFront edges',
      },
      {
        value: '0.1% Pixel Gate',
        label: '$0 Zero-Token Short-Circuit',
        context: 'Identical DOM captures bypass LLM calls at $0 cost',
      },
    ],
    diagramSteps: [
      {
        stepNumber: '01',
        title: '14+ Monitored Properties',
        subtitle: 'Global & Regional Sites',
        technicalDetail: 'www, help, trailhead, login, developer, apac, emea, japan, uk, germany',
        metricOrBadge: '352+ Checks',
      },
      {
        stepNumber: '02',
        title: '9 Global Edge PoPs',
        subtitle: 'Akamai & CloudFront Edges',
        technicalDetail: 'IAD, SFO, NRT, SIN, SYD, FRA, LHR, AMS, GRU with real Edge IP resolution',
        metricOrBadge: '9 Global PoPs',
      },
      {
        stepNumber: '03',
        title: '3-Dimension Gate Engine',
        subtitle: 'Headers · Cookies · Visual AI',
        technicalDetail: 'Functional HTTP headers, Set-Cookie parity, and 0.1% cost-gated Visual AI',
        metricOrBadge: '0.1% Cost Gate',
      },
      {
        stepNumber: '04',
        title: 'Deterministic Verdict',
        subtitle: 'GO · REVIEW · NO-GO',
        technicalDetail: '1-click diff waivers, zero-secret curl reproduction, and Markdown ticket export',
        metricOrBadge: '100% Auditable',
      },
    ],
    highlights: [
      {
        kicker: '01 · Problem Solved',
        title: 'Catch Edge Drift Before Production Traffic Hits It',
        body: 'Traditional synthetic monitors only check if a single URL returns HTTP 200. Synthetic Release Gate compares Candidate vs Baseline (or inspects a Single Run) across edge headers, cookies, redirects, and rendered 1280×760 DOM layouts.',
        codeOrFormula: 'Verdict = f(HTTP Status, Header Parity, Set-Cookie Parity, Visual Layout)',
      },
      {
        kicker: '02 · Real-Time Visibility',
        title: 'Always Know Where & How Every Check Runs',
        body: 'Every canary or environment test streams live step-by-step progress (1/3 HTTP Probe → 2/3 DOM Capture → 3/3 Gate Evaluation) while showing the exact Canary name, Target environment, Edge IP, and PoP location.',
        codeOrFormula: 'Where: ak-www-prod-stg · Edge 23.54.18.92 (NRT · Tokyo, JP)',
      },
      {
        kicker: '03 · Zero-Secret Safety',
        title: 'Reproduce Any Check Locally in One Second',
        body: 'Every check automatically generates a copy-ready curl --resolve command that pins the exact Akamai or CloudFront Edge IP while stripping Authorization, Cookie, and x-api-key secrets.',
        codeOrFormula: 'curl -sS -D - -o /dev/null --resolve www.salesforce.com:443:23.48.201.18',
      },
    ],
    primaryCta: {
      label: 'Explore 1. Sites Fleet Overview',
      targetView: 'synthetics',
      description: 'View all monitored properties, AWS Synthetics canaries, and release verdicts',
    },
    secondaryCta: {
      label: 'Open 2. Compare Workbench',
      targetView: 'workbench',
      compareMode: 'compare',
      description: 'Jump directly into the Env A vs Env B Release Diff Gate',
    },
  },
  {
    id: 'slide-user-journeys',
    number: '02',
    category: 'journey',
    categoryLabel: 'User Journeys',
    title: 'Three Simple User Journeys in 60 Seconds',
    subtitle:
      'Whether you are validating a single canary run, comparing Stage vs Prod, or onboarding a new site, every workflow follows a predictable 3-step path.',
    executiveSummary:
      'The left navigation rail is numbered 1 through 5 to mirror the natural operator workflow: 1. Sites (Fleet & Canaries) → 2. Compare / Single Run (Evidence Workbench) → 3. Configure (Checks, Envs & Rules) → 4. Automate (REST & MCP API).',
    keyTakeaway:
      'You can inspect a single environment run in isolation (Single Run View) or diff any two environments side-by-side (Compare 2 Envs).',
    diagramTitle: 'Operator Workflow: From Canary Trigger to Release Sign-Off',
    simulatorType: 'journey-timeline',
    videoId: 'video-fleet-canary-pop',
    metrics: [
      {
        value: '3 Clicks',
        label: 'Canary Trigger to Evidence',
        context: 'Pick PoP → Run Canary → Inspect Single Run or Diff',
      },
      {
        value: '2 Modes',
        label: 'Single Run & Compare 2 Envs',
        context: 'Switch freely in the top bar without re-running probes',
      },
      {
        value: '1-Click Waivers',
        label: 'Instant Verdict Recalculation',
        context: 'Accept expected header, cookie, or visual region diffs',
      },
    ],
    diagramSteps: [
      {
        stepNumber: 'Step 1',
        title: 'Select Site & Edge PoP',
        subtitle: 'Screen 1: Sites Overview',
        technicalDetail: 'Pick any property (e.g. www) and choose Auto or a specific PoP (e.g. NRT Tokyo)',
        metricOrBadge: '1. Sites',
      },
      {
        stepNumber: 'Step 2',
        title: 'Run Canary or Env Diff',
        subtitle: 'Watch Real-Time Progress',
        technicalDetail: 'Click Canary → Run Now, or open 2. Compare and click Run Single Env / Run Diff',
        metricOrBadge: 'Live Stream',
      },
      {
        stepNumber: 'Step 3',
        title: 'Inspect Single Run or Diff',
        subtitle: 'Screen 2: Workbench',
        technicalDetail: 'Switch freely between Single Run View (100% captured telemetry) and Compare 2 Envs',
        metricOrBadge: '2. Compare',
      },
      {
        stepNumber: 'Step 4',
        title: 'Accept Expected Drift',
        subtitle: 'Turn NO-GO into GO',
        technicalDetail: 'Click Accept on expected header/cookie/visual variances and copy Markdown summary',
        metricOrBadge: 'Release GO',
      },
    ],
    highlights: [
      {
        kicker: 'Journey A · Single Canary Inspection',
        title: 'Run & Inspect a Single Environment Run',
        body: 'In 1. Sites, pick a PoP (e.g. NRT Tokyo), click Canary → Run Now, watch the live check-by-check execution monitor, and click View Single Run to inspect all captured headers, cookies, 1280×760 screenshot, and HTTP flow waterfall.',
        codeOrFormula: '1. Sites → Select PoP → Canary Drawer → Run Now → View Single Run',
      },
      {
        kicker: 'Journey B · Any 2-Environment Release Gate',
        title: 'Compare Stage vs Prod (or AWS vs Akamai)',
        body: 'In 2. Compare, select Env A (Candidate) and Env B (Baseline) from the top bar, choose an Execution PoP, and click Run Diff. Review mismatches across Headers, Cookies, Visual UI, and Flow.',
        codeOrFormula: '2. Compare → Pick Env A & Env B → Select PoP → Run Diff → Accept Expected Drift',
      },
      {
        kicker: 'Journey C · Add a Site or Environment',
        title: 'Configure Self-Contained Environments in 1 Click',
        body: 'In 3. Configure → 2. Environments, click any 1-Click Environment Template (Akamai Edge, AWS CloudFront Header, Separate UAT URL, or Prod vs Prod). It immediately appears in 2. Compare with 1:1 parity.',
        codeOrFormula: '3. Configure → 2. Environments → + 1-Click Template → Ready in 2. Compare',
      },
    ],
    primaryCta: {
      label: 'Try Single Run View Live',
      targetView: 'workbench',
      compareMode: 'single',
      inspectorTab: 'headers',
      description: 'Open the Single Run Inspector for the active property',
    },
    secondaryCta: {
      label: 'Try 2-Environment Diff Gate',
      targetView: 'workbench',
      compareMode: 'compare',
      inspectorTab: 'image',
      description: 'Compare Env A vs Env B side-by-side with Visual Diff',
    },
  },
  {
    id: 'slide-routing-architecture',
    number: '03',
    category: 'architecture',
    categoryLabel: 'Internal Workings · Edge Routing',
    title: 'How Self-Contained Environments & Global PoP Routing Work',
    subtitle:
      'Every environment encapsulates its own URL, Edge DNS/IP override, and custom routing headers—eliminating separate "mode" switches.',
    executiveSummary:
      'Under the hood (/src/engine/targetRoutingModel.ts and /src/engine/httpFlowProber.ts), each environment is a self-contained routing profile. When you trigger a probe from a specific PoP, the prober resolves that PoP’s staging/prod Edge IP and injects PoP-authentic edge headers.',
    keyTakeaway:
      'Cross-domain redirects (e.g. www-uat1.salesforce.com → www.salesforce.com) are automatically normalized via hostMap so expected hostname differences never trigger false NO-GO alerts.',
    diagramTitle: 'Internal Request Resolution & Host Normalization Flow',
    simulatorType: 'hostmap-normalizer',
    videoId: 'video-fleet-canary-pop',
    metrics: [
      {
        value: '4 Topologies',
        label: 'Self-Contained Env Profiles',
        context: 'Akamai Edge IP, CloudFront CD Header, Separate UAT URL, Origin',
      },
      {
        value: '100% hostMap',
        label: 'Redirect Hostname Parity',
        context: 'Rewrites UAT/Stage 301/302 Location headers before diffing',
      },
      {
        value: '0 Secrets Leaked',
        label: 'Sanitized Reproduction',
        context: 'Strips Authorization, Cookie, and x-api-key from curl output',
      },
    ],
    diagramSteps: [
      {
        stepNumber: '1. Input',
        title: 'Environment Profile + PoP',
        subtitle: 'targetRoutingModel.ts',
        technicalDetail: 'Combines baseUrl + edgeHost + customHeaders with selected PoP override (e.g. FRA-56)',
        metricOrBadge: 'Profile Resolution',
      },
      {
        stepNumber: '2. Edge Pin',
        title: 'DNS / Edge IP Binding',
        subtitle: 'httpFlowProber.ts',
        technicalDetail: 'Routes via .edgekey-staging.net, d2sfdc.cloudfront.net, or custom header aws-cf-cd-staging',
        metricOrBadge: '--resolve IP:443',
      },
      {
        stepNumber: '3. Capture',
        title: 'Multi-Hop HTTP & DOM',
        subtitle: 'Playwright Canary Runner',
        technicalDetail: 'Captures DNS/TCP/TLS/TTFB waterfall, response headers, Set-Cookie, and 1280×760 JPEG',
        metricOrBadge: 'Full Telemetry',
      },
      {
        stepNumber: '4. Normalize',
        title: 'hostMap Redirect Rewrite',
        subtitle: 'rules.ts Engine',
        technicalDetail: 'Normalizes Location headers across UAT/Blue-Green URLs back to canonical host before diffing',
        metricOrBadge: 'Zero False Positives',
      },
    ],
    highlights: [
      {
        kicker: 'Mechanism 1 · Same URL + Edge DNS/IP',
        title: 'Akamai Staging vs Production Edge',
        body: 'Sends identical https://www.salesforce.com requests to Akamai Staging (.edgekey-staging.net / staging Edge IP) vs Akamai Production (.edgekey.net / prod Edge IP) with Pragma debug headers.',
        codeOrFormula: 'Pragma: akamai-x-cache-on, akamai-x-get-cache-key, akamai-x-get-true-cache-key',
      },
      {
        kicker: 'Mechanism 2 · Same URL + Custom Header',
        title: 'AWS CloudFront Continuous Deployment Header',
        body: 'Routes traffic to the same canonical URL while injecting continuous deployment headers so CloudFront routes Env A to the staging distribution and Env B to production.',
        codeOrFormula: 'aws-cf-cd-staging: true; x-canary-stage: candidate',
      },
      {
        kicker: 'Mechanism 3 · Separate URL + hostMap',
        title: 'UAT / Blue-Green Hostname Normalization',
        body: 'Maps https://www-uat1.salesforce.com against https://www.salesforce.com and automatically normalizes Location redirect headers so 301/302 redirect chains compare apples-to-apples.',
        codeOrFormula: 'normalizeLocation("https://www-uat1.salesforce.com/crm/") -> "https://www.salesforce.com/crm/"',
      },
    ],
    primaryCta: {
      label: 'Configure Environments & Routing',
      targetView: 'config',
      setupTab: 'envs',
      description: 'Open 3. Configure → 2. Environments to inspect or add environment profiles',
    },
    secondaryCta: {
      label: 'Inspect HTTP Flow Waterfall',
      targetView: 'workbench',
      compareMode: 'compare',
      inspectorTab: 'flow',
      description: 'View multi-hop redirects, DNS/TLS/TTFB timings, and curl --resolve commands',
    },
  },
  {
    id: 'slide-3dim-gate-engine',
    number: '04',
    category: 'architecture',
    categoryLabel: 'Internal Workings · 3-Dim Gate Engine',
    title: 'Inside the 3-Dimensional Gate & Cost-Gated Visual AI Judge',
    subtitle:
      'Pure deterministic evaluation functions (/src/engine/rules.ts) combined with a 0.1% pixel-diff cost gate for Amazon Bedrock Nova Lite.',
    executiveSummary:
      'Every check is evaluated across three orthogonal dimensions: (1) Functional HTTP & Cache/Security Headers, (2) Set-Cookie Attributes & Drift, and (3) Visual DOM Layout. A single unaccepted functional or visual regression yields NO-GO; accepted rules immediately recalculate the verdict to GO.',
    keyTakeaway:
      'Identical screenshots (< 0.1% RGBA pixel delta) short-circuit locally at $0 AI cost and 0 tokens. Only novel visual diffs invoke Bedrock Nova Lite.',
    diagramTitle: '3-Tier Zero-Token Visual AI & Gate Verdict Architecture',
    simulatorType: 'cost-gate-sandbox',
    videoId: 'video-compare-visual-gate',
    metrics: [
      {
        value: '< 0.1% Delta',
        label: 'Tier 1 Local RGBA Math',
        context: '$0 cost · 0 LLM tokens · < 4ms execution',
      },
      {
        value: 'SHA-256 Cache',
        label: 'Tier 2 Verdict Dedup',
        context: 'Reuses prior AI opinions on recurring diff signatures at 0 tokens',
      },
      {
        value: 'Nova Lite v1:0',
        label: 'Tier 3 Multimodal Judge',
        context: 'Invoked strictly on novel visual diffs ≥ 0.1% pixel delta',
      },
    ],
    diagramSteps: [
      {
        stepNumber: 'Dim 1',
        title: 'Functional Headers Gate',
        subtitle: 'Status · Cache · Security',
        technicalDetail: 'Normalizes Cache-Control max-age, Content-Type, Location redirects, HSTS, CSP, and x-check-cacheable',
        metricOrBadge: 'Header Parity',
      },
      {
        stepNumber: 'Dim 2',
        title: 'Set-Cookie Parity Gate',
        subtitle: 'Domain · Flags · TTL',
        technicalDetail: 'Verifies cookie presence, Secure, HttpOnly, SameSite, Domain, and allowlisted bot/session cookies',
        metricOrBadge: 'Cookie Parity',
      },
      {
        stepNumber: 'Dim 3A',
        title: '0.1% RGBA Pixel Gate',
        subtitle: 'Pure Local Math ($0)',
        technicalDetail: 'Compares 1280×760 Side A & Side B buffers; < 0.1% diff auto-passes as SAME with 0 AI tokens',
        metricOrBadge: '$0 Short-Circuit',
      },
      {
        stepNumber: 'Dim 3B',
        title: 'Bedrock Nova Lite Judge',
        subtitle: 'amazon.nova-lite-v1:0',
        technicalDetail: 'Evaluates bounding-box regions ≥ 0.1% diff and caches SHA-256 verdicts for instant reuse',
        metricOrBadge: 'SHA-256 Cached',
      },
    ],
    highlights: [
      {
        kicker: 'Dimension 1 · HTTP & Cache Physics',
        title: 'Semantic Header Normalization',
        body: 'Instead of naive string equality, rules.ts normalizes Cache-Control directives (treating max-age=83858 and max-age=86400 both as positive TTLs) while flagging dangerous cache-to-no-store regressions.',
        codeOrFormula: 'normalizeCacheControl("public, max-age=3600") === "max-age=N, public"',
      },
      {
        kicker: 'Dimension 2 · Set-Cookie Security',
        title: 'Cookie Attribute & Policy Allowlisting',
        body: 'Parses raw Set-Cookie headers into structured cookie names and attributes. Dynamic Akamai bot cookies (_abck, bm_sz) can be allowlisted by policy so they never block releases.',
        codeOrFormula: 'Accepted Cookies Policy: _abck, bm_sz, ak_bmsc -> Auto-Waived',
      },
      {
        kicker: 'Dimension 3 · Visual Diff Canvas',
        title: 'Pin-to-Inspect & 1-Click Region Accept',
        body: 'Visual regressions are highlighted directly on the 1280×760 screenshots. Click any diff region chip in the toolbar, click the corner badge, or click a box to pin its popup and accept it.',
        codeOrFormula: 'Pixel Delta < 0.1% -> $0 Cost Gate | Delta >= 0.1% -> Zone Grounded Diff',
      },
    ],
    primaryCta: {
      label: 'Inspect Visual Diff Canvas',
      targetView: 'workbench',
      compareMode: 'compare',
      inspectorTab: 'image',
      description: 'Open the Visual UI Diff tab in 2. Compare to test bounding-box inspection',
    },
    secondaryCta: {
      label: 'Manage Accepted Diff Rules',
      targetView: 'config',
      setupTab: 'policies',
      description: 'Open 3. Configure → 3. Accepted Diff Rules to view or toggle waivers',
    },
  },
  {
    id: 'slide-single-run-and-streaming',
    number: '05',
    category: 'features',
    categoryLabel: 'Features · Single Run & Live Stream',
    title: 'Real-Time Canary Streaming & Full Single Run Inspector',
    subtitle:
      'Watch synthetic checks execute step-by-step in real time and inspect any single environment run in full-screen detail.',
    executiveSummary:
      'You don’t always want to compare two environments—sometimes you want to trigger a single AWS Synthetics Canary from a specific PoP (like NRT Tokyo or FRA Frankfurt), watch each check execute live, and inspect the complete captured headers, cookies, screenshot, and SLA assertions for that single run.',
    keyTakeaway:
      'Toggle between "Compare 2 Envs" and "Single Run" at any time using the top-left mode switcher in Screen 2, or click "Single Run" directly on any site or canary in Screen 1.',
    diagramTitle: 'Real-Time Execution Stream & Single Run Inspection',
    simulatorType: 'single-run-stream',
    videoId: 'video-single-run-and-mcp',
    metrics: [
      {
        value: '3 Live Phases',
        label: 'Synchronous Run Stream',
        context: '1/3 HTTP Flow Probe → 2/3 1280×760 DOM Capture → 3/3 Gate Verdict',
      },
      {
        value: '39+ Headers',
        label: 'Full Single-Run Telemetry',
        context: 'Inspect all captured headers, 13+ cookies, and SLA assertions',
      },
      {
        value: '1280×760 JPEG',
        label: 'Unmodified DOM Snapshot',
        context: 'Real Chromium capture stored in S3 & served via CloudFront',
      },
    ],
    diagramSteps: [
      {
        stepNumber: 'Phase 1',
        title: 'Trigger with PoP Override',
        subtitle: 'Sites or Compare Toolbar',
        technicalDetail: 'POST /api/v1/synthetics/canaries/:name/start with { popId: "nrt" }',
        metricOrBadge: 'PoP Selected',
      },
      {
        stepNumber: 'Phase 2',
        title: '3-Step Check Streaming',
        subtitle: 'Live Location Banner',
        technicalDetail: 'Shows Where (Canary, Target, Edge IP, PoP, Host) + live per-check progress bar',
        metricOrBadge: 'Step 1/3 → 3/3',
      },
      {
        stepNumber: 'Phase 3',
        title: 'Full Single Run View',
        subtitle: '100% Captured Evidence',
        technicalDetail: 'All 39+ HTTP headers, 13+ cookies, full-width 1280×760 DOM capture, and SLA gates',
        metricOrBadge: 'Single Run Mode',
      },
      {
        stepNumber: 'Phase 4',
        title: '1-Click Compare Switch',
        subtitle: 'Instant Mode Toggle',
        technicalDetail: 'Click "Compare vs Another Env →" to diff that exact run against any baseline environment',
        metricOrBadge: 'Seamless Pivot',
      },
    ],
    highlights: [
      {
        kicker: 'Live Execution Transparency',
        title: 'Never Wonder Where a Run is Happening',
        body: 'Clicking Run on any canary opens the Live Canary Execution Monitor showing the exact Canary ID, Target Environment, Edge IP & PoP city, Canonical Host, and real-time check status.',
        codeOrFormula: 'T05 (5/12) — Step 1/3: Probing HTTP flow & headers @ PoP NRT · Tokyo, JP',
      },
      {
        kicker: 'Dedicated Single Run Mode',
        title: 'Full-Width Screenshot & Complete Header/Cookie Tables',
        body: 'In Single Run mode, the workbench hides two-column diff noise and displays every captured response header, every Set-Cookie attribute, SLA assertion results, and a full-width 1280×760 DOM screenshot.',
        codeOrFormula: 'SINGLE RUN · 12/12 PASS · All Captured Headers (39) · All Captured Cookies (13)',
      },
      {
        kicker: 'Historical Run Snapshots',
        title: 'Switch Between Historical Runs & PoP Executions',
        body: 'Use the Run dropdown in Single Run view (or the History tab in the Canary Drawer) to inspect previous runs and compare how different Edge PoPs responded.',
        codeOrFormula: 'Run Selector: aws-syn #4 · PoP NRT · 11:43:05 AM (12/12 pass)',
      },
    ],
    primaryCta: {
      label: 'Open Single Run View Now',
      targetView: 'workbench',
      compareMode: 'single',
      inspectorTab: 'headers',
      description: 'Inspect the active property in full Single Run mode',
    },
    secondaryCta: {
      label: 'Open 1. Sites Canary Control Plane',
      targetView: 'synthetics',
      description: 'Trigger a live canary run from any of the 9 Global Edge PoPs',
    },
  },
  {
    id: 'slide-automation-mcp-iac',
    number: '06',
    category: 'features',
    categoryLabel: 'Features · CI/CD, MCP & Terraform IaC',
    title: 'Headless Automation: MCP JSON-RPC 2.0, REST API & Terraform IaC',
    subtitle:
      '100% parity between the web UI and headless automation for AI agents (Cursor, Claude, Windsurf), GitHub Actions, and AWS CloudWatch Synthetics.',
    executiveSummary:
      'Everything you can do in the UI—creating properties, adding checks, running PoP-targeted canaries, evaluating 3-Dim diffs, accepting drift rules, or exporting Terraform HCL—is exposed via the built-in MCP JSON-RPC 2.0 server (/api/v1/mcp/rpc) and OpenAPI 3.1 REST endpoints.',
    keyTakeaway:
      'Screen 4 (Automate) provides a live interactive MCP & REST API playground where you can execute real JSON-RPC calls and copy production Terraform stacks.',
    diagramTitle: 'Headless CI/CD & AI Agent Integration Stack',
    simulatorType: 'mcp-rpc-console',
    videoId: 'video-single-run-and-mcp',
    metrics: [
      {
        value: '20 MCP Tools',
        label: 'JSON-RPC 2.0 Server',
        context: '/api/v1/mcp/rpc with 11 resources & 6 SRE prompts',
      },
      {
        value: 'OpenAPI 3.1.0',
        label: '12+ REST Endpoints',
        context: 'Full CI/CD webhook, fan-out batch, and canary control plane',
      },
      {
        value: '100% Terraform',
        label: 'Clone-and-Apply HCL',
        context: 'S3, SSM, DynamoDB, CloudFront, Synthetics & Bedrock IAM',
      },
    ],
    diagramSteps: [
      {
        stepNumber: 'Layer 1',
        title: '20 MCP Agent Tools',
        subtitle: 'POST /api/v1/mcp/rpc',
        technicalDetail: 'JSON-RPC 2.0 tools, 11 resources, and 6 prompts for AI coding & SRE agents',
        metricOrBadge: 'MCP 2024-11-05',
      },
      {
        stepNumber: 'Layer 2',
        title: 'OpenAPI 3.1 REST API',
        subtitle: '/api/v1/openapi.json',
        technicalDetail: 'Trigger fan-out batches, query verdicts, manage suites, and stream probes from CI/CD',
        metricOrBadge: '12+ Endpoints',
      },
      {
        stepNumber: 'Layer 3',
        title: 'AWS CloudWatch Canaries',
        subtitle: 'syn-nodejs-puppeteer-9.1',
        technicalDetail: 'Zero-Docker Sparticuz Chromium Lambda & Synthetics Canary scripts capturing 1280×760 JPEGs',
        metricOrBadge: 'AWS Native',
      },
      {
        stepNumber: 'Layer 4',
        title: '100% Terraform IaC',
        subtitle: 'infra/terraform/*.tf',
        technicalDetail: 'Provisions S3, SSM, DynamoDB, Canaries, Bedrock Nova Lite IAM, CloudFront, and Alarms',
        metricOrBadge: 'Config-as-Code',
      },
    ],
    highlights: [
      {
        kicker: 'AI Agent Native (MCP)',
        title: '20 Tools, 11 Resources & 6 Guided Prompts',
        body: 'Connect Claude Code, Cursor, or Gemini CLI directly to /api/v1/mcp/rpc. Agents can list properties, run synthetic gates, diagnose root causes, and propose remediation snippets autonomously.',
        codeOrFormula: '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"evaluate_release_gate"}}',
      },
      {
        kicker: 'Cascading Lifecycle & Recovery',
        title: 'Atomic Property CRUD & 1-Click Fleet Restore',
        body: 'Deleting a property atomically purges its runs, suites, and policies across UI and MCP. Clicking Restore 14 Default Sites re-seeds the entire Salesforce global fleet in one click.',
        codeOrFormula: 'POST /api/v1/properties/restore-defaults -> 14 Properties Restored',
      },
      {
        kicker: 'Enterprise Scale Ready',
        title: 'Tested at 50 Properties × 64 Checks per Suite',
        body: 'Built-in scale simulators in 3. Configure let you stress-test the UI and priority work-stealing concurrency engine at 50 properties and 64 checks per property.',
        codeOrFormula: 'Priority Work-Stealing Queue + Bounded S3 Retry Pool',
      },
    ],
    primaryCta: {
      label: 'Open 4. Automate (MCP & REST Studio)',
      targetView: 'studio',
      description: 'Execute live MCP JSON-RPC 2.0 tools and inspect OpenAPI 3.1 endpoints',
    },
    secondaryCta: {
      label: 'Open 3. Configure (Suites & Policies)',
      targetView: 'config',
      setupTab: 'suite',
      description: 'Manage properties, synthetic checks, and production scale simulations',
    },
  },
];

export function getWalkthroughVideoForSlide(
  slide: AboutSlideDefinition
): AppWalkthroughVideo {
  return (
    APP_WALKTHROUGH_VIDEOS.find((v) => v.id === slide.videoId) ||
    APP_WALKTHROUGH_VIDEOS[0]
  );
}

export function filterAboutSlides(
  slides: AboutSlideDefinition[],
  category: SlideCategory,
  searchQuery = ''
): AboutSlideDefinition[] {
  const q = searchQuery.trim().toLowerCase();
  return slides.filter((slide) => {
    if (category !== 'all' && slide.category !== category) {
      return false;
    }
    if (!q) return true;
    const haystack = [
      slide.number,
      slide.title,
      slide.subtitle,
      slide.categoryLabel,
      slide.executiveSummary,
      slide.keyTakeaway,
      ...slide.diagramSteps.map((s) => `${s.title} ${s.subtitle} ${s.technicalDetail}`),
      ...slide.highlights.map((h) => `${h.kicker} ${h.title} ${h.body} ${h.codeOrFormula || ''}`),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function resolveSlideStepIndex(
  currentIndex: number,
  totalSlides: number,
  delta: -1 | 1
): number {
  if (totalSlides <= 0) return 0;
  const next = (currentIndex + delta + totalSlides) % totalSlides;
  return next;
}
