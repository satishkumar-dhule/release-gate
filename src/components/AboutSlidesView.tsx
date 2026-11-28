import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Film,
  GitCompareArrows,
  Globe,
  LayoutGrid,
  Layers,
  Maximize2,
  Pause,
  Play,
  Presentation,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Terminal,
  Video,
} from 'lucide-react';
import {
  ABOUT_SLIDES,
  APP_WALKTHROUGH_VIDEOS,
  AboutSlideDefinition,
  AppWalkthroughVideo,
  SlideCategory,
  SlideInteractiveCta,
  filterAboutSlides,
  getWalkthroughVideoForSlide,
  resolveSlideStepIndex,
} from '../engine/aboutSlidesModel';
import { InspectorDimensionTab, WorkbenchViewMode } from '../engine/workbenchModel';
import { GLOBAL_EXECUTION_POPS } from '../config/template.config';

export interface AboutSlidesViewProps {
  activeAppId: string;
  totalProperties: number;
  totalChecks: number;
  totalPops: number;
  onNavigateCta: (cta: {
    targetView: WorkbenchViewMode;
    compareMode?: 'compare' | 'single';
    inspectorTab?: InspectorDimensionTab;
    setupTab?: 'suite' | 'envs' | 'policies';
  }) => void;
}

const CATEGORY_TABS: Array<{ id: SlideCategory; label: string }> = [
  { id: 'all', label: 'All Slides (6)' },
  { id: 'journey', label: 'User Journeys (2)' },
  { id: 'architecture', label: 'Internal Workings (2)' },
  { id: 'features', label: 'Features & Automation (2)' },
];

export const AboutSlidesView: React.FC<AboutSlidesViewProps> = ({
  activeAppId,
  totalProperties,
  totalChecks,
  totalPops,
  onNavigateCta,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SlideCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSlideId, setActiveSlideId] = useState<string>(ABOUT_SLIDES[0].id);
  const [displayMode, setDisplayMode] = useState<'deck' | 'videos' | 'storyboard'>('deck');
  const [selectedDiagramStepIdx, setSelectedDiagramStepIdx] = useState<number>(0);
  const [mediaStageTab, setMediaStageTab] = useState<'video' | 'sandbox'>('video');
  const [autoPlayDeck, setAutoPlayDeck] = useState<boolean>(false);

  // Video cinema state
  const [selectedVideoId, setSelectedVideoId] = useState<string>(
    APP_WALKTHROUGH_VIDEOS[0].id
  );
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);
  const [videoTimeSec, setVideoTimeSec] = useState<number>(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(true);
  const slideVideoRef = useRef<HTMLVideoElement | null>(null);
  const cinemaVideoRef = useRef<HTMLVideoElement | null>(null);

  // Interactive Sandbox states
  const [sandboxPopId, setSandboxPopId] = useState<string>('nrt');
  const [sandboxTopology, setSandboxTopology] = useState<
    'akamai-edge' | 'cloudfront-header' | 'uat-hostmap'
  >('akamai-edge');
  const [sandboxPixelDelta, setSandboxPixelDelta] = useState<number>(0.04);
  const [sandboxHeaderWaived, setSandboxHeaderWaived] = useState<boolean>(false);
  const [sandboxCookieWaived, setSandboxCookieWaived] = useState<boolean>(true);
  const [sandboxStreamPhase, setSandboxStreamPhase] = useState<1 | 2 | 3>(3);
  const [sandboxMcpMethod, setSandboxMcpMethod] = useState<
    'tools/list' | 'evaluate_release_gate' | 'list_synthetics_canaries'
  >('tools/list');
  const [sandboxMcpOutput, setSandboxMcpOutput] = useState<string>(
    '{\n  "jsonrpc": "2.0",\n  "status": "Ready — click Execute Live RPC to query /api/v1/mcp/rpc",\n  "toolsRegistered": 20,\n  "resourcesRegistered": 11\n}'
  );
  const [isRunningMcp, setIsRunningMcp] = useState<boolean>(false);

  const filteredSlides = useMemo(
    () => filterAboutSlides(ABOUT_SLIDES, selectedCategory, searchQuery),
    [selectedCategory, searchQuery]
  );

  const activeSlideIndex = useMemo(() => {
    const idx = filteredSlides.findIndex((s) => s.id === activeSlideId);
    return idx >= 0 ? idx : 0;
  }, [filteredSlides, activeSlideId]);

  const currentSlide: AboutSlideDefinition | undefined =
    filteredSlides[activeSlideIndex] || filteredSlides[0];

  const currentSlideVideo: AppWalkthroughVideo = useMemo(
    () =>
      currentSlide
        ? getWalkthroughVideoForSlide(currentSlide)
        : APP_WALKTHROUGH_VIDEOS[0],
    [currentSlide]
  );

  const activeCinemaVideo: AppWalkthroughVideo = useMemo(
    () =>
      APP_WALKTHROUGH_VIDEOS.find((v) => v.id === selectedVideoId) ||
      APP_WALKTHROUGH_VIDEOS[0],
    [selectedVideoId]
  );

  useEffect(() => {
    setSelectedDiagramStepIdx(0);
    setActiveChapterIdx(0);
  }, [currentSlide?.id]);

  const handleStepSlide = (delta: -1 | 1) => {
    if (filteredSlides.length === 0) return;
    const nextIdx = resolveSlideStepIndex(activeSlideIndex, filteredSlides.length, delta);
    setActiveSlideId(filteredSlides[nextIdx].id);
  };

  // Optional Keynote Auto-Advance timer
  useEffect(() => {
    if (!autoPlayDeck || displayMode !== 'deck' || filteredSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveSlideId((prevId) => {
        const idx = filteredSlides.findIndex((s) => s.id === prevId);
        const nextIdx = resolveSlideStepIndex(idx >= 0 ? idx : 0, filteredSlides.length, 1);
        return filteredSlides[nextIdx].id;
      });
    }, 6500);
    return () => window.clearInterval(timer);
  }, [autoPlayDeck, displayMode, filteredSlides]);

  // Support Left / Right arrow keys when viewing the slide deck
  useEffect(() => {
    if (displayMode !== 'deck') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleStepSlide(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleStepSlide(-1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handleTriggerCta = (cta: SlideInteractiveCta) => {
    onNavigateCta({
      targetView: cta.targetView,
      compareMode: cta.compareMode,
      inspectorTab: cta.inspectorTab,
      setupTab: cta.setupTab,
    });
  };

  const handleSeekVideo = (
    videoEl: HTMLVideoElement | null,
    timestampSec: number,
    chapterIdx: number
  ) => {
    setActiveChapterIdx(chapterIdx);
    if (!videoEl) return;
    try {
      videoEl.currentTime = timestampSec;
      void videoEl.play().catch(() => {});
      setIsPlayingVideo(true);
    } catch {
      // Ignore seek errors before metadata is loaded
    }
  };

  const handleChangePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (slideVideoRef.current) slideVideoRef.current.playbackRate = rate;
    if (cinemaVideoRef.current) cinemaVideoRef.current.playbackRate = rate;
  };

  const handleRunLiveMcpSandbox = async () => {
    setIsRunningMcp(true);
    try {
      const rpcBody =
        sandboxMcpMethod === 'tools/list'
          ? { jsonrpc: '2.0', id: 101, method: 'tools/list', params: {} }
          : sandboxMcpMethod === 'list_synthetics_canaries'
          ? {
              jsonrpc: '2.0',
              id: 102,
              method: 'tools/call',
              params: {
                name: 'list_synthetics_canaries',
                arguments: { appId: activeAppId || 'www' },
              },
            }
          : {
              jsonrpc: '2.0',
              id: 103,
              method: 'tools/call',
              params: {
                name: 'evaluate_release_gate',
                arguments: {
                  appId: activeAppId || 'www',
                  candidateTarget: `${activeAppId || 'www'}.prod.staging`,
                  baselineTarget: `${activeAppId || 'www'}.prod.prod`,
                },
              },
            };

      const res = await fetch('/api/v1/mcp/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rpcBody),
      });
      const data = await res.json();
      setSandboxMcpOutput(JSON.stringify(data, null, 2).slice(0, 900));
    } catch (err) {
      setSandboxMcpOutput(
        JSON.stringify(
          {
            jsonrpc: '2.0',
            error: err instanceof Error ? err.message : 'RPC call failed',
          },
          null,
          2
        )
      );
    } finally {
      setIsRunningMcp(false);
    }
  };

  const activeDiagramStep =
    currentSlide?.diagramSteps[selectedDiagramStepIdx] ||
    currentSlide?.diagramSteps[0];

  const selectedSandboxPop =
    GLOBAL_EXECUTION_POPS.find((p) => p.id === sandboxPopId) ||
    GLOBAL_EXECUTION_POPS[2];

  const renderInteractiveSandbox = (slide: AboutSlideDefinition) => {
    if (
      slide.simulatorType === 'edge-pop-router' ||
      slide.simulatorType === 'hostmap-normalizer'
    ) {
      const resolvedUrl =
        sandboxTopology === 'uat-hostmap'
          ? `https://${activeAppId}-uat1.salesforce.com/crm`
          : `https://${activeAppId}.salesforce.com/crm`;
      const resolvedEdgeHost =
        sandboxTopology === 'akamai-edge'
          ? `${activeAppId}.salesforce.com.edgekey-staging.net`
          : sandboxTopology === 'cloudfront-header'
          ? `d2${activeAppId}-sfdc.cloudfront.net`
          : `${activeAppId}-uat1.salesforce.com`;
      const normalizedRedirect = `https://${activeAppId}.salesforce.com/crm/`;

      return (
        <div
          data-testid="about-interactive-sandbox"
          className="space-y-3 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <div>
              <div className="font-semibold text-foreground">
                Interactive Global PoP &amp; Routing Simulator
              </div>
              <div className="text-[11px] text-muted-foreground">
                Select any Edge PoP and routing topology to inspect the synthesized probe
              </div>
            </div>
            <span className="font-mono text-[11px] text-primary tabular-nums">
              {selectedSandboxPop.popCode} · {selectedSandboxPop.city}
            </span>
          </div>

          {/* PoP Selector Buttons */}
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-muted-foreground">
              1. Pick Execution Edge PoP ({GLOBAL_EXECUTION_POPS.length} Global Locations):
            </div>
            <div className="flex flex-wrap gap-1">
              {GLOBAL_EXECUTION_POPS.slice(0, 6).map((pop) => {
                const active = pop.id === sandboxPopId;
                return (
                  <button
                    key={pop.id}
                    type="button"
                    onClick={() => setSandboxPopId(pop.id)}
                    data-testid={`sandbox-pop-${pop.id}`}
                    className={`h-6.5 rounded border px-2 font-mono text-[11px] transition-colors cursor-pointer ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground font-semibold'
                        : 'border-border bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    {pop.popCode} · {pop.city.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topology Mechanism Selector */}
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-muted-foreground">
              2. Pick Self-Contained Environment Routing Mechanism:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {(
                [
                  {
                    id: 'akamai-edge',
                    label: 'Akamai Staging Edge IP',
                    sub: 'Same URL + --resolve IP',
                  },
                  {
                    id: 'cloudfront-header',
                    label: 'CloudFront CD Header',
                    sub: 'Same URL + aws-cf-cd-staging',
                  },
                  {
                    id: 'uat-hostmap',
                    label: 'Separate UAT + hostMap',
                    sub: 'Rewrites Location redirects',
                  },
                ] as const
              ).map((top) => {
                const active = sandboxTopology === top.id;
                return (
                  <button
                    key={top.id}
                    type="button"
                    onClick={() => setSandboxTopology(top.id)}
                    data-testid={`sandbox-topology-${top.id}`}
                    className={`rounded border p-2 text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-primary bg-primary/[0.06]'
                        : 'border-border bg-background hover:bg-muted/60'
                    }`}
                  >
                    <div className="font-semibold text-foreground text-[11px]">
                      {top.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {top.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Synthesized Output Terminal */}
          <div className="rounded border border-border bg-background p-3 font-mono text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground border-b border-border/60 pb-1">
              <span>Resolved Zero-Secret Probe &amp; hostMap Output</span>
              <span className="tabular-nums">
                Staging IP {selectedSandboxPop.stagingEdgeIp} ↔ Prod IP{' '}
                {selectedSandboxPop.prodEdgeIp}
              </span>
            </div>
            <div className="text-foreground break-all">
              curl -sS -D - -o /dev/null --resolve{' '}
              <span className="text-primary font-semibold">
                {activeAppId}.salesforce.com:443:{selectedSandboxPop.stagingEdgeIp}
              </span>{' '}
              {sandboxTopology === 'cloudfront-header'
                ? '-H "aws-cf-cd-staging: true" '
                : '-H "Pragma: akamai-x-cache-on, akamai-x-get-cache-key" '}
              "{resolvedUrl}"
            </div>
            <div className="pt-1 border-t border-border/50 text-[10px] text-muted-foreground flex flex-wrap items-center justify-between gap-2">
              <span>Edge Host: {resolvedEdgeHost}</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                Normalized 301 Location → {normalizedRedirect}
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (slide.simulatorType === 'cost-gate-sandbox') {
      const shortCircuited = sandboxPixelDelta < 0.1;
      const visualStatus =
        sandboxPixelDelta < 0.1
          ? 'SAME ($0 Local Short-Circuit)'
          : sandboxPixelDelta < 2.0
          ? 'MINOR (Nova Lite Evaluated)'
          : 'DIFFERENT (Nova Lite Flagged)';
      const finalVerdict =
        !sandboxHeaderWaived || (!shortCircuited && sandboxPixelDelta >= 2.0)
          ? 'NO-GO'
          : !sandboxCookieWaived || (!shortCircuited && sandboxPixelDelta >= 0.1)
          ? 'REVIEW'
          : 'GO';

      return (
        <div
          data-testid="about-interactive-sandbox"
          className="space-y-3 text-xs"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
            <div>
              <div className="font-semibold text-foreground">
                Interactive 3-Dim Verdict &amp; 0.1% Cost-Gate Calculator
              </div>
              <div className="text-[11px] text-muted-foreground">
                Scrub the pixel delta slider and toggle waivers to test rules.ts logic live
              </div>
            </div>
            <span
              data-testid="sandbox-computed-verdict"
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded border tabular-nums ${
                finalVerdict === 'GO'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : finalVerdict === 'REVIEW'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                  : 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
              }`}
            >
              Verdict: {finalVerdict}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-foreground">
                1280×760 RGBA Pixel Delta:
              </span>
              <span className="font-mono font-semibold text-primary tabular-nums">
                {sandboxPixelDelta.toFixed(2)}% (Threshold: 0.10%)
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={15}
              step={0.02}
              value={sandboxPixelDelta}
              onChange={(e) => setSandboxPixelDelta(Number(e.target.value))}
              aria-label="Simulated RGBA pixel diff percentage"
              data-testid="sandbox-pixel-delta-slider"
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>0.00% (Identical · $0)</span>
              <span>0.10% Cost Gate</span>
              <span>15.0% Major Layout Drift</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSandboxHeaderWaived((v) => !v)}
              data-testid="sandbox-toggle-header-waiver"
              className={`rounded border p-2 text-left transition-colors cursor-pointer ${
                sandboxHeaderWaived
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-rose-500/40 bg-rose-500/10'
              }`}
            >
              <div className="font-mono text-[10px] font-semibold">
                Dim 1 · Header Gate (x-check-cacheable)
              </div>
              <div className="mt-0.5 font-semibold text-foreground">
                {sandboxHeaderWaived ? '✓ Waived by Accepted Rule' : '✕ Unaccepted Drift (NO-GO)'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSandboxCookieWaived((v) => !v)}
              data-testid="sandbox-toggle-cookie-waiver"
              className={`rounded border p-2 text-left transition-colors cursor-pointer ${
                sandboxCookieWaived
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-amber-500/40 bg-amber-500/10'
              }`}
            >
              <div className="font-mono text-[10px] font-semibold">
                Dim 2 · Set-Cookie Gate (_abck)
              </div>
              <div className="mt-0.5 font-semibold text-foreground">
                {sandboxCookieWaived ? '✓ Allowlisted Bot Cookie' : '! Unaccepted Cookie Drift'}
              </div>
            </button>
          </div>

          <div className="rounded border border-border bg-background p-2.5 font-mono text-[11px] flex flex-wrap items-center justify-between gap-2">
            <span>Dim 3 Visual Engine: {visualStatus}</span>
            <span className="font-semibold text-primary tabular-nums">
              {shortCircuited
                ? '0 AI Tokens · $0.00 Cost'
                : 'amazon.nova-lite-v1:0 Invoked'}
            </span>
          </div>
        </div>
      );
    }

    if (slide.simulatorType === 'mcp-rpc-console') {
      return (
        <div
          data-testid="about-interactive-sandbox"
          className="space-y-2.5 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <div>
              <div className="font-semibold text-foreground">
                Live MCP JSON-RPC 2.0 Sandbox (/api/v1/mcp/rpc)
              </div>
              <div className="text-[11px] text-muted-foreground">
                Dispatch a real JSON-RPC 2.0 request to the running Express + MCP server
              </div>
            </div>
            <button
              type="button"
              onClick={handleRunLiveMcpSandbox}
              disabled={isRunningMcp}
              data-testid="sandbox-btn-execute-mcp"
              className="inline-flex h-7 items-center gap-1.5 rounded bg-primary px-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              <Terminal className="h-3 w-3" />
              <span>{isRunningMcp ? 'Calling /api/v1/mcp/rpc…' : 'Execute Live RPC'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'tools/list', label: '1. tools/list (20 Tools)' },
                {
                  id: 'list_synthetics_canaries',
                  label: `2. list_synthetics_canaries (${activeAppId})`,
                },
                {
                  id: 'evaluate_release_gate',
                  label: `3. evaluate_release_gate (${activeAppId})`,
                },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSandboxMcpMethod(m.id)}
                className={`h-6.5 rounded border px-2 font-mono text-[11px] cursor-pointer ${
                  sandboxMcpMethod === m.id
                    ? 'border-primary bg-primary text-primary-foreground font-semibold'
                    : 'border-border bg-background text-foreground hover:bg-muted'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <pre
            data-testid="sandbox-mcp-response-pre"
            className="max-h-40 overflow-y-auto rounded border border-border bg-background p-2.5 font-mono text-[10px] leading-relaxed text-foreground"
          >
            {sandboxMcpOutput}
          </pre>
        </div>
      );
    }

    // Default: Journey & 3-Phase Live Run Stream Simulator (Slides 02 & 05)
    return (
      <div
        data-testid="about-interactive-sandbox"
        className="space-y-3 text-xs"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
          <div>
            <div className="font-semibold text-foreground">
              Interactive 3-Phase Canary Execution Streamer
            </div>
            <div className="text-[11px] text-muted-foreground">
              Click any execution phase to inspect what happens during a live canary check
            </div>
          </div>
          <span className="font-mono text-[11px] text-primary tabular-nums">
            Site: {activeAppId} · PoP {selectedSandboxPop.popCode}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              {
                phase: 1 as const,
                title: 'Phase 1/3 · HTTP Probe',
                sub: 'DNS → TCP → TLS → TTFB',
                detail: `Probing https://${activeAppId}.salesforce.com/ via Edge IP ${selectedSandboxPop.stagingEdgeIp} (${selectedSandboxPop.popCode}). Captured 39 HTTP response headers & 13 Set-Cookie attributes in 142ms.`,
              },
              {
                phase: 2 as const,
                title: 'Phase 2/3 · DOM Capture',
                sub: '1280×760 Chromium JPEG',
                detail: `Headless Chromium (syn-nodejs-puppeteer-9.1) renders unmodified 1280×760 viewport, records Core Web Vitals (LCP 1.1s, CLS 0.01), and streams JPEG artifact to S3.`,
              },
              {
                phase: 3 as const,
                title: 'Phase 3/3 · Gate Verdict',
                sub: '3-Dim Rules + 0.1% AI Gate',
                detail: `Evaluates Header Parity, Set-Cookie Parity, and RGBA Pixel Delta. Updates both Single Run View and Compare 2 Envs immediately with zero page reload.`,
              },
            ] as const
          ).map((item) => {
            const active = sandboxStreamPhase === item.phase;
            return (
              <button
                key={item.phase}
                type="button"
                onClick={() => setSandboxStreamPhase(item.phase)}
                data-testid={`sandbox-stream-phase-${item.phase}`}
                className={`rounded border p-2 text-left transition-colors cursor-pointer ${
                  active
                    ? 'border-primary bg-primary/[0.07]'
                    : 'border-border bg-background hover:bg-muted/60'
                }`}
              >
                <div className="font-mono text-[10px] font-bold text-primary">
                  {item.title}
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-foreground">
                  {item.sub}
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded border border-border bg-background p-3 font-mono text-[11px] text-foreground leading-relaxed">
          {sandboxStreamPhase === 1 &&
            `[Phase 1/3] GET https://${activeAppId}.salesforce.com/ -> HTTP 200 OK (142ms) · Edge IP ${selectedSandboxPop.stagingEdgeIp} (${selectedSandboxPop.popCode} · ${selectedSandboxPop.city}) · x-check-cacheable: YES`}
          {sandboxStreamPhase === 2 &&
            `[Phase 2/3] Captured 1280×760 JPEG DOM Snapshot -> s3://srg-artifacts/${activeAppId}/T01-staging.jpg · CWV LCP: 1120ms · CLS: 0.01 · TTFB: 84ms`}
          {sandboxStreamPhase === 3 &&
            `[Phase 3/3] 3-Dim Gate Complete -> Functional Headers: Verified · Set-Cookie: Verified · Visual RGBA Delta: 0.04% (< 0.1% Cost Gate -> $0 Local Pass)`}
        </div>
      </div>
    );
  };

  return (
    <div
      data-testid="about-slides-view"
      className="flex flex-1 flex-col min-w-0 min-h-0 bg-background text-foreground lg:h-screen lg:max-h-screen lg:overflow-hidden"
    >
      {/* Condensed 38px 1-Line Workspace Header Bar */}
      <header className="border-b border-border bg-card px-3 py-1 shrink-0">
        <div className="flex min-h-7.5 flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <div className="inline-flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-primary shrink-0">
              <BookOpen className="h-3 w-3" />
            </div>
            <h1
              className="font-display text-xs font-semibold text-foreground whitespace-nowrap"
              title={`${totalProperties} properties · ${totalChecks} checks · ${totalPops} global Edge PoPs · Active site: ${activeAppId}`}
            >
              5. About &amp; Architecture
            </h1>

            <span className="hidden sm:inline text-border/70" aria-hidden="true">|</span>

            <div
              role="tablist"
              aria-label="Slide categories"
              className="inline-flex flex-wrap items-center gap-0.5 rounded border border-border bg-background p-0.5"
            >
              {CATEGORY_TABS.map((tab) => {
                const active = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    data-testid={`about-category-${tab.id}`}
                    onClick={() => {
                      setSelectedCategory(tab.id);
                      const nextList = filterAboutSlides(ABOUT_SLIDES, tab.id, searchQuery);
                      if (nextList[0]) {
                        setActiveSlideId(nextList[0].id);
                      }
                    }}
                    className={`h-6 rounded px-2 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Controls: Search + 3-Way View Switch (Slide Deck | App Videos | All 6) + Quick Jump */}
          <div className="flex flex-wrap items-center gap-1 shrink-0">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search slides & videos…"
                aria-label="Search about slides"
                data-testid="about-search-input"
                className="h-6.5 w-36 sm:w-44 rounded border border-border bg-background pl-6.5 pr-2 text-[11px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div
              data-testid="about-display-mode-toggle"
              className="inline-flex h-6.5 items-center rounded border border-border bg-background p-0.5 text-[11px]"
            >
              <button
                type="button"
                onClick={() => setDisplayMode('deck')}
                data-testid="btn-about-mode-deck"
                className={`inline-flex h-5.5 items-center gap-1 rounded px-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  displayMode === 'deck'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Presentation className="h-3 w-3" />
                <span>Slide Deck</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('videos')}
                data-testid="btn-about-mode-videos"
                className={`inline-flex h-5.5 items-center gap-1 rounded px-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  displayMode === 'videos'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Film className="h-3 w-3" />
                <span>App Videos ({APP_WALKTHROUGH_VIDEOS.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('storyboard')}
                data-testid="btn-about-mode-storyboard"
                className={`inline-flex h-5.5 items-center gap-1 rounded px-2 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  displayMode === 'storyboard'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="h-3 w-3" />
                <span>All 6</span>
              </button>
            </div>

            <div className="hidden xl:flex items-center gap-1">
              <button
                type="button"
                onClick={() => onNavigateCta({ targetView: 'synthetics' })}
                data-testid="about-jump-sites"
                className="inline-flex h-6.5 items-center gap-1 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-foreground hover:bg-muted cursor-pointer whitespace-nowrap"
              >
                <Globe className="h-2.5 w-2.5 text-primary" />
                <span>1. Sites</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onNavigateCta({
                    targetView: 'workbench',
                    compareMode: 'single',
                    inspectorTab: 'headers',
                  })
                }
                data-testid="about-jump-single-run"
                className="inline-flex h-6.5 items-center gap-1 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-foreground hover:bg-muted cursor-pointer whitespace-nowrap"
              >
                <Play className="h-2.5 w-2.5 text-primary" />
                <span>Single Run</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onNavigateCta({
                    targetView: 'workbench',
                    compareMode: 'compare',
                    inspectorTab: 'image',
                  })
                }
                data-testid="about-jump-compare"
                className="inline-flex h-6.5 items-center gap-1 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-foreground hover:bg-muted cursor-pointer whitespace-nowrap"
              >
                <GitCompareArrows className="h-2.5 w-2.5 text-primary" />
                <span>2. Compare</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onNavigateCta({ targetView: 'config', setupTab: 'envs' })
                }
                data-testid="about-jump-configure"
                className="inline-flex h-6.5 items-center gap-1 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-foreground hover:bg-muted cursor-pointer whitespace-nowrap"
              >
                <SlidersHorizontal className="h-2.5 w-2.5 text-primary" />
                <span>3. Config</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateCta({ targetView: 'studio' })}
                data-testid="about-jump-automate"
                className="inline-flex h-6.5 items-center gap-1 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-foreground hover:bg-muted cursor-pointer whitespace-nowrap"
              >
                <Terminal className="h-2.5 w-2.5 text-primary" />
                <span>4. MCP</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filteredSlides.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <p className="text-sm font-semibold text-foreground">
              No slides match "{searchQuery}"
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Clear the search filter or switch back to All Slides.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-3 inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
            >
              Reset Slide Filters
            </button>
          </div>
        ) : displayMode === 'videos' ? (
          /* Dedicated App Walkthrough Video Cinema Mode */
          <div
            data-testid="about-video-cinema-view"
            className="mx-auto max-w-[1440px] border-b border-border bg-card"
          >
            {/* Top Video Selector Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 border-b border-border divide-y md:divide-y-0 md:divide-x divide-border">
              {APP_WALKTHROUGH_VIDEOS.map((vid) => {
                const active = vid.id === activeCinemaVideo.id;
                return (
                  <button
                    key={vid.id}
                    type="button"
                    onClick={() => {
                      setSelectedVideoId(vid.id);
                      setActiveChapterIdx(0);
                    }}
                    data-testid={`cinema-select-video-${vid.number}`}
                    className={`p-4 text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-primary/[0.06]'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums text-muted-foreground">
                      <span className={active ? 'text-primary font-semibold' : ''}>
                        Walkthrough {vid.number}
                      </span>
                      <span>{vid.durationLabel}</span>
                    </div>
                    <div className="mt-1 font-display text-sm font-semibold text-foreground">
                      {vid.title}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {vid.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Cinema Split Stage: HTML5 Video Player + Interactive Timestamp Chapters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
              <div className="lg:col-span-8 p-5 space-y-3 bg-background/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono text-muted-foreground">
                      Walkthrough {activeCinemaVideo.number} · Recorded Live from Synthetic Release Gate
                    </div>
                    <h2 className="font-display text-lg font-semibold text-foreground">
                      {activeCinemaVideo.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="inline-flex items-center rounded border border-border bg-background p-0.5 font-mono text-[11px]">
                      {[1, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => handleChangePlaybackRate(rate)}
                          className={`px-2 py-0.5 rounded cursor-pointer ${
                            playbackRate === rate
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {rate}×
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTriggerCta(activeCinemaVideo.primaryCta)}
                      className="inline-flex h-7.5 items-center gap-1 rounded bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
                    >
                      <span>{activeCinemaVideo.primaryCta.label}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border border-border bg-black shadow-sm">
                  <video
                    ref={cinemaVideoRef}
                    key={activeCinemaVideo.src}
                    src={activeCinemaVideo.src}
                    data-testid="cinema-walkthrough-video-player"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    onTimeUpdate={(e) =>
                      setVideoTimeSec(e.currentTarget.currentTime)
                    }
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>

              {/* Right Column: Interactive Timestamp Chapters & Deep-Link */}
              <div className="lg:col-span-4 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="font-display text-xs font-semibold text-foreground">
                      Interactive Video Chapters
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                      Time: {videoTimeSec.toFixed(1)}s
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {activeCinemaVideo.subtitle}
                  </p>

                  <div className="space-y-2">
                    {activeCinemaVideo.chapters.map((ch, idx) => {
                      const isCurrent = activeChapterIdx === idx;
                      return (
                        <button
                          key={`${activeCinemaVideo.id}-ch-${idx}`}
                          type="button"
                          onClick={() =>
                            handleSeekVideo(
                              cinemaVideoRef.current,
                              ch.timestampSec,
                              idx
                            )
                          }
                          data-testid={`cinema-chapter-${idx}`}
                          className={`w-full rounded border p-3 text-left transition-colors cursor-pointer ${
                            isCurrent
                              ? 'border-primary bg-primary/[0.06]'
                              : 'border-border bg-background hover:border-primary/40'
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
                            <span className="font-semibold text-primary">
                              Chapter {idx + 1}
                            </span>
                            <span className="text-muted-foreground">
                              Jump to {ch.timeLabel}
                            </span>
                          </div>
                          <div className="mt-1 text-xs font-semibold text-foreground">
                            {ch.title}
                          </div>
                          <div className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                            {ch.detail}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-border pt-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSlideId(activeCinemaVideo.relatedSlideId);
                      setDisplayMode('deck');
                    }}
                    className="w-full inline-flex h-8 items-center justify-center gap-1.5 rounded border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
                  >
                    <Presentation className="h-3.5 w-3.5 text-primary" />
                    <span>Open Companion Architecture Slide</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerCta(activeCinemaVideo.primaryCta)}
                    className="w-full inline-flex h-8 items-center justify-center gap-1.5 rounded bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
                  >
                    <span>{activeCinemaVideo.primaryCta.label}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : displayMode === 'storyboard' ? (
          /* All 6 Slides Architectural Blueprint Matrix */
          <div
            data-testid="about-storyboard-grid"
            className="mx-auto max-w-[1440px] p-5 space-y-5"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredSlides.map((slide) => {
                const slideVid = getWalkthroughVideoForSlide(slide);
                return (
                  <article
                    key={slide.id}
                    data-testid={`storyboard-card-${slide.number}`}
                    className="flex flex-col justify-between rounded-md border border-border bg-card p-5 transition-colors hover:border-primary/50"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono tabular-nums">
                        <span>
                          {slide.number} · {slide.categoryLabel}
                        </span>
                        <span>{slide.diagramSteps.length} stages · Video included</span>
                      </div>

                      <h2 className="font-display text-base font-semibold text-foreground leading-snug">
                        {slide.number}. {slide.title}
                      </h2>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {slide.executiveSummary}
                      </p>

                      {/* Clean Unboxed Quantitative Metrics Row */}
                      <div className="grid grid-cols-3 gap-2 border-y border-border/70 py-2">
                        {slide.metrics.map((m, mIdx) => (
                          <div key={`${slide.id}-m-${mIdx}`} className="min-w-0">
                            <div className="font-mono text-xs font-bold text-foreground tabular-nums truncate">
                              {m.value}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {m.label}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-foreground">
                          Architecture Stages:
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {slide.diagramSteps.map((st) => (
                            <div
                              key={`${slide.id}-${st.stepNumber}`}
                              className="rounded border border-border/80 bg-background px-2.5 py-1.5 text-[11px]"
                            >
                              <div className="font-mono text-[10px] text-primary font-semibold">
                                {st.stepNumber} · {st.metricOrBadge}
                              </div>
                              <div className="font-medium text-foreground truncate">
                                {st.title}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSlideId(slide.id);
                            setDisplayMode('deck');
                          }}
                          data-testid={`open-slide-deck-${slide.number}`}
                          className="inline-flex h-7.5 items-center gap-1 rounded border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
                        >
                          <span>Open Slide</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVideoId(slideVid.id);
                            setDisplayMode('videos');
                          }}
                          className="inline-flex h-7.5 items-center gap-1 rounded border border-border bg-background px-2 text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
                          title={`Watch ${slideVid.title}`}
                        >
                          <Film className="h-3 w-3 text-primary" />
                          <span>Video</span>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTriggerCta(slide.primaryCta)}
                        className="inline-flex h-7.5 items-center gap-1 rounded bg-primary px-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
                      >
                        <span>{slide.primaryCta.label}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          /* Interactive Editorial Keynote Slide Deck Mode (Split Stage: Narrative + Live Video / Interactive Sandbox) */
          currentSlide && (
            <div className="mx-auto max-w-[1440px]">
              {/* Top 1-Line Horizontal Filmstrip Chapter Navigator + Keynote Transport Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card/70 px-4 py-1.5">
                <nav
                  aria-label="Slide deck chapters"
                  className="flex items-center gap-1 overflow-x-auto"
                >
                  {filteredSlides.map((slide) => {
                    const isCurrent = slide.id === currentSlide.id;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setActiveSlideId(slide.id)}
                        data-testid={`slide-nav-btn-${slide.number}`}
                        className={`group relative inline-flex h-7 items-center gap-1.5 rounded px-2.5 text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground font-semibold'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium'
                        }`}
                      >
                        <span
                          className={`font-mono text-[11px] tabular-nums ${
                            isCurrent ? 'text-primary-foreground' : 'text-primary font-semibold'
                          }`}
                        >
                          {slide.number}
                        </span>
                        <span className="truncate max-w-[165px]">
                          {slide.categoryLabel.replace('Internal Workings · ', '').replace('Features · ', '')}
                        </span>
                      </button>
                    );
                  })}
                </nav>

                {/* Keynote Transport Controls: Auto-Play + Prev / Counter / Next */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAutoPlayDeck((v) => !v)}
                    data-testid="btn-about-autoplay"
                    className={`inline-flex h-7 items-center gap-1 rounded border px-2 text-[11px] font-medium cursor-pointer whitespace-nowrap ${
                      autoPlayDeck
                        ? 'border-primary bg-primary/15 text-primary font-semibold'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {autoPlayDeck ? (
                      <>
                        <Pause className="h-3 w-3" />
                        <span>Auto-Play On</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" />
                        <span>Auto-Play Deck</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStepSlide(-1)}
                    data-testid="btn-prev-slide"
                    aria-label="Previous slide"
                    className="inline-flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Prev</span>
                  </button>
                  <span
                    data-testid="slide-counter-indicator"
                    className="px-1.5 font-mono text-xs font-semibold text-foreground tabular-nums"
                  >
                    {activeSlideIndex + 1} / {filteredSlides.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStepSlide(1)}
                    data-testid="btn-next-slide"
                    aria-label="Next slide"
                    className="inline-flex h-7 items-center gap-1 rounded bg-primary px-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
                  >
                    <span>Next Slide</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Active Slide Architectural Split Stage (Zero Nested Card-Within-Card Clutter) */}
              <section
                aria-label={`Slide ${currentSlide.number}: ${currentSlide.title}`}
                data-testid={`active-slide-${currentSlide.number}`}
                className="border-b border-border bg-card"
              >
                {/* Upper Split Stage: Left Editorial Narrative + Right Interactive Video & Live Sandbox */}
                <div className="grid grid-cols-1 xl:grid-cols-12 divide-y xl:divide-y-0 xl:divide-x divide-border">
                  {/* Left Editorial Column (7 cols) */}
                  <div className="xl:col-span-7 p-6 space-y-5 min-w-0">
                    <div className="space-y-2">
                      {/* Clean Unboxed Metadata Line (Zero Pill Enclosures) */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono tabular-nums">
                        <span className="font-semibold text-primary">
                          Chapter {currentSlide.number} of{' '}
                          {String(ABOUT_SLIDES.length).padStart(2, '0')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{currentSlide.categoryLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>Active Property: {activeAppId}</span>
                      </div>

                      <h2
                        data-testid="active-slide-title"
                        className="font-display text-2xl sm:text-[26px] font-bold text-foreground tracking-tight leading-tight [text-wrap:balance]"
                      >
                        {currentSlide.number}. {currentSlide.title}
                      </h2>

                      <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                        {currentSlide.subtitle}
                      </p>
                    </div>

                    {/* Quantitative Proof Strip (Claim-to-Proof Adjacency, Tabular Numerals, 1px Hairline Dividers) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-border py-3.5">
                      {currentSlide.metrics.map((metric, mIdx) => (
                        <div key={`${currentSlide.id}-metric-${mIdx}`} className="space-y-0.5">
                          <div className="font-mono text-base font-bold text-foreground tabular-nums">
                            {metric.value}
                          </div>
                          <div className="text-xs font-semibold text-foreground">
                            {metric.label}
                          </div>
                          <div className="text-[11px] text-muted-foreground leading-snug">
                            {metric.context}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Plain-Language Architecture Explanation & Core Takeaway */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-foreground">
                          How It Works in Plain Language
                        </div>
                        <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                          {currentSlide.executiveSummary}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-primary">
                          Architectural Takeaway
                        </div>
                        <p className="text-xs sm:text-[13px] text-foreground leading-relaxed">
                          {currentSlide.keyTakeaway}
                        </p>
                      </div>
                    </div>

                    {/* Interactive 4-Stage Pipeline Stepper */}
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" />
                          <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                            {currentSlide.diagramTitle}
                          </h3>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          Click any stage to inspect its internal mechanism
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {currentSlide.diagramSteps.map((step, idx) => {
                          const isSelected = idx === selectedDiagramStepIdx;
                          return (
                            <button
                              key={`${currentSlide.id}-step-${step.stepNumber}`}
                              type="button"
                              onClick={() => setSelectedDiagramStepIdx(idx)}
                              data-testid={`diagram-step-${idx}`}
                              className={`flex flex-col justify-between rounded border p-3 text-left transition-colors cursor-pointer ${
                                isSelected
                                  ? 'border-primary bg-primary/[0.06]'
                                  : 'border-border bg-background hover:border-primary/40'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
                                  <span className="font-bold text-primary">
                                    {step.stepNumber}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {step.metricOrBadge}
                                  </span>
                                </div>
                                <div className="text-xs font-semibold text-foreground">
                                  {step.title}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {step.subtitle}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {activeDiagramStep && (
                        <div
                          data-testid="active-diagram-step-detail"
                          className="flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-background px-3.5 py-2 text-xs"
                        >
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <span className="font-mono font-bold text-primary">
                              Stage {activeDiagramStep.stepNumber}:
                            </span>
                            <span className="font-semibold text-foreground">
                              {activeDiagramStep.title}
                            </span>
                            <span aria-hidden="true" className="text-muted-foreground">
                              ·
                            </span>
                            <span className="text-muted-foreground">
                              {activeDiagramStep.technicalDetail}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-primary font-semibold shrink-0">
                            {activeDiagramStep.metricOrBadge}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Interactive Media & Live Sandbox Stage (5 cols) */}
                  <div className="xl:col-span-5 p-6 bg-background/40 flex flex-col justify-between space-y-4 min-w-0">
                    <div className="space-y-3">
                      {/* Media Stage Switcher: Live App Video (.webm) vs Interactive Live Sandbox */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
                        <div className="inline-flex h-7 items-center rounded border border-border bg-background p-0.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setMediaStageTab('video')}
                            data-testid="slide-media-tab-video"
                            className={`inline-flex h-6 items-center gap-1.5 rounded px-2.5 font-medium cursor-pointer transition-colors ${
                              mediaStageTab === 'video'
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Video className="h-3.5 w-3.5" />
                            <span>Live App Video</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMediaStageTab('sandbox')}
                            data-testid="slide-media-tab-sandbox"
                            className={`inline-flex h-6 items-center gap-1.5 rounded px-2.5 font-medium cursor-pointer transition-colors ${
                              mediaStageTab === 'sandbox'
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Cpu className="h-3.5 w-3.5" />
                            <span>Interactive Sandbox</span>
                          </button>
                        </div>

                        {mediaStageTab === 'video' && (
                          <div className="flex items-center gap-1">
                            {[1, 1.5, 2].map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => handleChangePlaybackRate(rate)}
                                className={`h-6 rounded border px-1.5 font-mono text-[10px] cursor-pointer ${
                                  playbackRate === rate
                                    ? 'border-primary bg-primary/15 text-primary font-semibold'
                                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                {rate}×
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVideoId(currentSlideVideo.id);
                                setDisplayMode('videos');
                              }}
                              title="Expand in Full Video Cinema"
                              className="inline-flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <Maximize2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {mediaStageTab === 'video' ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground truncate">
                              {currentSlideVideo.title}
                            </span>
                            <span className="font-mono text-[11px] text-muted-foreground tabular-nums shrink-0">
                              {currentSlideVideo.durationLabel}
                            </span>
                          </div>

                          {/* Embedded Real App Walkthrough Video (.webm) */}
                          <div className="relative aspect-[16/10] w-full overflow-hidden rounded border border-border bg-black">
                            <video
                              ref={slideVideoRef}
                              key={currentSlideVideo.src}
                              src={currentSlideVideo.src}
                              data-testid="about-walkthrough-video"
                              controls
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="h-full w-full object-contain"
                            />
                          </div>

                          {/* Clickable Video Timestamp Chapter Jumpers */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>Click any chapter to seek video:</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleSeekVideo(slideVideoRef.current, 0, 0)
                                }
                                className="inline-flex items-center gap-1 font-mono text-[10px] text-primary hover:underline cursor-pointer"
                              >
                                <RotateCcw className="h-2.5 w-2.5" />
                                <span>Replay from 0:00</span>
                              </button>
                            </div>
                            <div className="grid grid-cols-1 gap-1.5">
                              {currentSlideVideo.chapters.map((ch, cIdx) => {
                                const active = activeChapterIdx === cIdx;
                                return (
                                  <button
                                    key={`${currentSlideVideo.id}-slide-ch-${cIdx}`}
                                    type="button"
                                    onClick={() =>
                                      handleSeekVideo(
                                        slideVideoRef.current,
                                        ch.timestampSec,
                                        cIdx
                                      )
                                    }
                                    data-testid={`slide-video-chapter-${cIdx}`}
                                    className={`flex items-start justify-between gap-2 rounded border px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                                      active
                                        ? 'border-primary bg-primary/[0.07]'
                                        : 'border-border bg-card hover:border-primary/40'
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      <div className="font-semibold text-foreground truncate">
                                        {ch.title}
                                      </div>
                                      <div className="text-[11px] text-muted-foreground truncate">
                                        {ch.detail}
                                      </div>
                                    </div>
                                    <span className="font-mono text-[10px] font-semibold text-primary tabular-nums shrink-0 mt-0.5">
                                      {ch.timeLabel}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        renderInteractiveSandbox(currentSlide)
                      )}
                    </div>

                    {/* Direct Action Launchers */}
                    <div className="border-t border-border pt-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {currentSlide.primaryCta.description}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {currentSlide.secondaryCta && (
                          <button
                            type="button"
                            onClick={() =>
                              currentSlide.secondaryCta &&
                              handleTriggerCta(currentSlide.secondaryCta)
                            }
                            data-testid="slide-secondary-cta"
                            className="inline-flex h-7.5 items-center gap-1 rounded border border-border bg-card px-2.5 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
                          >
                            <span>{currentSlide.secondaryCta.label}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleTriggerCta(currentSlide.primaryCta)}
                          data-testid="slide-primary-cta"
                          className="inline-flex h-7.5 items-center gap-1 rounded bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
                        >
                          <span>{currentSlide.primaryCta.label}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lower 3-Column Deep-Dive Engineering Pillars (Separated by 1px Architectural Hairlines) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 border-t border-border divide-y lg:divide-y-0 lg:divide-x divide-border">
                  {currentSlide.highlights.map((card, idx) => (
                    <div
                      key={`${currentSlide.id}-hl-${idx}`}
                      className="flex flex-col justify-between p-5 space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="font-mono text-[11px] font-semibold text-primary">
                          {card.kicker}
                        </div>
                        <h4 className="font-display text-sm font-semibold text-foreground leading-snug">
                          {card.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {card.body}
                        </p>
                      </div>

                      {card.codeOrFormula && (
                        <div className="rounded border border-border bg-background px-2.5 py-2 font-mono text-[11px] text-foreground overflow-x-auto">
                          {card.codeOrFormula}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )
        )}
      </div>
    </div>
  );
};
