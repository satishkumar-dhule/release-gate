import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  Check,
  Command,
  Copy,
  Globe,
  Keyboard,
  Loader2,
  Moon,
  MoreHorizontal,
  Play,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react';
import { EnvironmentConfig, OverallVerdict, RunRecord } from '../engine/types';
import { GLOBAL_EXECUTION_POPS, resolveExecutionPopOption } from '../config/template.config';
import { SuiteSreTelemetry } from '../engine/sreIntelligence';
import { ActiveRunStreamState } from '../engine/runStreamEngine';
import { buildVerdictBreakdownText } from '../engine/workbenchModel';
import {
  CdnOrOriginProvider,
  ComparisonTopologyModeId,
  ComparisonTopologyPreset,
  PropertyEnvironmentTarget,
  RoutingMechanism,
  TargetEndpointProfile,
  formatHeaderKeyValueLine,
  getComparisonTopologyPresets,
  getPropertyEnvironmentTargets,
  normalizeBaseUrl,
  parseHeaderKeyValueLine,
} from '../engine/targetRoutingModel';

export interface BackgroundJobLite {
  id: string;
  label: string;
  status: 'running' | 'completed';
  progress: string;
}

export interface WorkbenchToolbarProps {
  activeAppId: string;
  activeAppName: string;
  canonicalHost: string;
  alternateStageHost?: string;
  propertyEnvs?: EnvironmentConfig[];
  headlineVerdict: OverallVerdict;
  headerDiffs: number;
  cookieDiffs: number;
  visualDiffs: number;
  totalChecks: number;
  compareMode: 'compare' | 'single';
  onSetCompareMode: (mode: 'compare' | 'single') => void;
  candidateTarget: string;
  baselineTarget: string;
  availableTargets: string[];
  runs: RunRecord[];
  candidateRunKey: string;
  baselineRunKey: string;
  onChangeCandidateTarget: (t: string) => void;
  onChangeBaselineTarget: (t: string) => void;
  onChangeCandidateRunKey: (k: string) => void;
  onChangeBaselineRunKey: (k: string) => void;
  onSwapSides: () => void;
  selectedExecutionPopId: string;
  onChangeExecutionPopId: (id: string) => void;
  sreSummary: SuiteSreTelemetry;
  ignoreAcceptedDiffs: boolean;
  onToggleIgnoreAccepted: () => void;
  onCopyMarkdown: () => void;
  onRerunAllDiffs: () => void;
  onRunSingleTarget: (targetId: string) => void;
  onTogglePropScale?: () => void;
  propCount?: number;
  onToggleSuiteScale?: () => void;
  suiteCount?: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  backgroundJobs: BackgroundJobLite[];
  runStreamState: ActiveRunStreamState | null;
  onOpenSetup?: (tab: 'suite' | 'envs') => void;
  onOpenVsCode?: () => void;
  onOpenSynthetics?: () => void;
  topologyModeId?: ComparisonTopologyModeId;
  candidateProfile?: TargetEndpointProfile;
  baselineProfile?: TargetEndpointProfile;
  onSelectTopologyPreset?: (preset: ComparisonTopologyPreset) => void;
  onUpdateCustomProfiles?: (
    candidate: TargetEndpointProfile,
    baseline: TargetEndpointProfile
  ) => void;
}

function verdictAppearance(verdict: OverallVerdict): {
  badgeClass: string;
  icon: React.ReactNode;
} {
  if (verdict === 'NO-GO') {
    return {
      badgeClass:
        'border-rose-500/35 bg-rose-500/10 text-rose-700 dark:text-rose-300',
      icon: <ShieldAlert className="h-3.5 w-3.5 shrink-0" />,
    };
  }
  if (verdict === 'REVIEW') {
    return {
      badgeClass:
        'border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300',
      icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />,
    };
  }
  if (verdict === 'GO') {
    return {
      badgeClass:
        'border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      icon: <ShieldCheck className="h-3.5 w-3.5 shrink-0" />,
    };
  }
  return {
    badgeClass: 'border-border bg-muted text-foreground',
    icon: null,
  };
}

export const WorkbenchToolbar: React.FC<WorkbenchToolbarProps> = ({
  activeAppId,
  activeAppName,
  canonicalHost,
  alternateStageHost,
  propertyEnvs = [],
  headlineVerdict,
  headerDiffs,
  cookieDiffs,
  visualDiffs,
  totalChecks,
  compareMode,
  onSetCompareMode,
  candidateTarget,
  baselineTarget,
  availableTargets,
  runs,
  candidateRunKey,
  baselineRunKey,
  onChangeCandidateTarget,
  onChangeBaselineTarget,
  onChangeCandidateRunKey,
  onChangeBaselineRunKey,
  onSwapSides,
  selectedExecutionPopId,
  onChangeExecutionPopId,
  sreSummary,
  ignoreAcceptedDiffs,
  onToggleIgnoreAccepted,
  onCopyMarkdown,
  onRerunAllDiffs,
  onRunSingleTarget,
  theme,
  onToggleTheme,
  onOpenCommandPalette,
  onOpenShortcuts,
  backgroundJobs,
  runStreamState,
  onOpenSetup,
  onOpenVsCode,
  onOpenSynthetics,
  topologyModeId = 'prod-stage-akamai',
  candidateProfile,
  baselineProfile,
  onSelectTopologyPreset,
  onUpdateCustomProfiles,
}) => {
  const [openMenu, setOpenMenu] = useState<'compare' | 'sre' | 'more' | null>(null);
  const [routingEditorOpen, setRoutingEditorOpen] = useState(false);
  const [copiedPapi, setCopiedPapi] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  const presets = useMemo(
    () => getComparisonTopologyPresets(canonicalHost, alternateStageHost),
    [canonicalHost, alternateStageHost]
  );

  const envTargets = useMemo(
    () =>
      getPropertyEnvironmentTargets(
        activeAppId,
        canonicalHost,
        propertyEnvs,
        alternateStageHost
      ),
    [activeAppId, canonicalHost, propertyEnvs, alternateStageHost]
  );

  const activePreset =
    presets.find((p) => p.id === topologyModeId) || presets[0];

  const resolvedCand =
    candidateProfile || (envTargets[1] || envTargets[0])?.profile || activePreset.candidate;
  const resolvedBase =
    baselineProfile || envTargets[0]?.profile || activePreset.baseline;
  const activePopOption = useMemo(
    () => resolveExecutionPopOption(selectedExecutionPopId),
    [selectedExecutionPopId]
  );

  // Match active Env A and Env B keys strictly from the property's configured environments (1:1 with 3. Configure -> 2. Environments)
  const matchedEnvA = useMemo(() => {
    const byLabel = envTargets.find((e) => e.profile.label === resolvedCand.label);
    if (byLabel) return byLabel;
    const candEnvId = candidateTarget.split('.')[1];
    const byTargetEnv = envTargets.find((e) => e.envId === candEnvId && e.envId !== 'prod');
    return byTargetEnv || envTargets[1] || envTargets[0];
  }, [envTargets, resolvedCand.label, candidateTarget]);

  const matchedEnvB = useMemo(() => {
    const byLabel = envTargets.find((e) => e.profile.label === resolvedBase.label);
    if (byLabel) return byLabel;
    const baseEnvId = baselineTarget.split('.')[1];
    const byTargetEnv = envTargets.find((e) => e.envId === baseEnvId);
    return byTargetEnv || envTargets[0];
  }, [envTargets, resolvedBase.label, baselineTarget]);

  const handleSelectEnvA = (envKey: string) => {
    const found = envTargets.find((e) => e.envKey === envKey);
    if (!found) return;
    onChangeCandidateTarget(found.targetId);
    const nextCand: TargetEndpointProfile = {
      ...found.profile,
      role: 'candidate',
    };
    const nextBase: TargetEndpointProfile = {
      ...resolvedBase,
      role: 'baseline',
    };
    onUpdateCustomProfiles?.(nextCand, nextBase);
  };

  const handleSelectEnvB = (envKey: string) => {
    const found = envTargets.find((e) => e.envKey === envKey);
    if (!found) return;
    onChangeBaselineTarget(found.targetId);
    const nextCand: TargetEndpointProfile = {
      ...resolvedCand,
      role: 'candidate',
    };
    const nextBase: TargetEndpointProfile = {
      ...found.profile,
      role: 'baseline',
    };
    onUpdateCustomProfiles?.(nextCand, nextBase);
  };

  const handleSwapEnvs = () => {
    onSwapSides();
    const swappedCand: TargetEndpointProfile = {
      ...resolvedBase,
      role: 'candidate',
    };
    const swappedBase: TargetEndpointProfile = {
      ...resolvedCand,
      role: 'baseline',
    };
    onUpdateCustomProfiles?.(swappedCand, swappedBase);
  };

  // Custom Routing Editor Draft State
  const [candTierDraft, setCandTierDraft] = useState<'STAGE' | 'PROD'>(resolvedCand.tier);
  const [candProviderDraft, setCandProviderDraft] = useState<CdnOrOriginProvider>(
    resolvedCand.provider
  );
  const [candMechanismDraft, setCandMechanismDraft] = useState<RoutingMechanism>(
    resolvedCand.routingMechanism
  );
  const [candUrlDraft, setCandUrlDraft] = useState(resolvedCand.baseUrl);
  const [candHeaderDraft, setCandHeaderDraft] = useState(
    formatHeaderKeyValueLine(resolvedCand.customHeaders)
  );
  const [candEdgeIpDraft, setCandEdgeIpDraft] = useState(resolvedCand.edgeIp || '');

  const [baseTierDraft, setBaseTierDraft] = useState<'STAGE' | 'PROD'>(resolvedBase.tier);
  const [baseProviderDraft, setBaseProviderDraft] = useState<CdnOrOriginProvider>(
    resolvedBase.provider
  );
  const [baseUrlDraft, setBaseUrlDraft] = useState(resolvedBase.baseUrl);
  const [baseHeaderDraft, setBaseHeaderDraft] = useState(
    formatHeaderKeyValueLine(resolvedBase.customHeaders)
  );
  const [baseEdgeIpDraft, setBaseEdgeIpDraft] = useState(resolvedBase.edgeIp || '');

  useEffect(() => {
    setCandTierDraft(resolvedCand.tier);
    setCandProviderDraft(resolvedCand.provider);
    setCandMechanismDraft(resolvedCand.routingMechanism);
    setCandUrlDraft(resolvedCand.baseUrl);
    setCandHeaderDraft(formatHeaderKeyValueLine(resolvedCand.customHeaders));
    setCandEdgeIpDraft(resolvedCand.edgeIp || '');

    setBaseTierDraft(resolvedBase.tier);
    setBaseProviderDraft(resolvedBase.provider);
    setBaseUrlDraft(resolvedBase.baseUrl);
    setBaseHeaderDraft(formatHeaderKeyValueLine(resolvedBase.customHeaders));
    setBaseEdgeIpDraft(resolvedBase.edgeIp || '');
  }, [resolvedCand, resolvedBase]);

  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenu]);

  const vApp = verdictAppearance(headlineVerdict);
  const breakdown = buildVerdictBreakdownText({
    headerDiffs,
    cookieDiffs,
    visualDiffs,
    totalChecks,
  });

  const candRuns = runs.filter((r) => r.target === candidateTarget);
  const baseRuns = runs.filter((r) => r.target === baselineTarget);
  const activeCandRun =
    candRuns.find((r) => r.key === candidateRunKey) || candRuns[0];
  const singleRunPassed = activeCandRun?.passedTests ?? totalChecks;
  const singleRunTotal = activeCandRun?.totalTests ?? totalChecks;
  const singleRunAllPassed = singleRunPassed >= singleRunTotal;
  const topDiagnosis = sreSummary.blockerDiagnoses[0] || sreSummary.diagnoses[0];

  const shortTarget = (t: string) => {
    const parts = t.split('.');
    return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : t;
  };

  const totalUnaccepted = headerDiffs + cookieDiffs + visualDiffs;

  const handleApplyCustomRouting = (e: React.FormEvent) => {
    e.preventDefault();
    const cNorm = normalizeBaseUrl(candUrlDraft);
    const bNorm = normalizeBaseUrl(baseUrlDraft);
    const cHeaders = parseHeaderKeyValueLine(candHeaderDraft);
    const bHeaders = parseHeaderKeyValueLine(baseHeaderDraft);

    const nextCandidate: TargetEndpointProfile = {
      role: 'candidate',
      label: `Env A (${candProviderDraft})`,
      tier: candTierDraft,
      provider: candProviderDraft,
      routingMechanism: candMechanismDraft,
      baseUrl: cNorm.baseUrl,
      hostname: cNorm.hostname,
      edgeHost:
        candProviderDraft === 'Akamai Edge'
          ? `${cNorm.hostname}${candTierDraft === 'STAGE' ? '.edgekey-staging.net' : '.edgekey.net'}`
          : candProviderDraft === 'AWS CloudFront'
          ? `d2sfdc-${candTierDraft.toLowerCase()}.cloudfront.net`
          : cNorm.hostname,
      edgeIp: candEdgeIpDraft.trim() || resolvedCand.edgeIp,
      customHeaders: cHeaders,
      summaryNote:
        candMechanismDraft === 'different-url'
          ? `Different URL (${cNorm.baseUrl})`
          : candMechanismDraft === 'custom-header'
          ? `Same URL (${cNorm.hostname}) + Header ${formatHeaderKeyValueLine(cHeaders) || 'custom'}`
          : `Same URL (${cNorm.hostname}) via ${candProviderDraft} (${candEdgeIpDraft || 'edge'})`,
    };

    const nextBaseline: TargetEndpointProfile = {
      role: 'baseline',
      label: `Env B (${baseProviderDraft})`,
      tier: baseTierDraft,
      provider: baseProviderDraft,
      routingMechanism: candMechanismDraft,
      baseUrl: bNorm.baseUrl,
      hostname: bNorm.hostname,
      edgeHost:
        baseProviderDraft === 'Akamai Edge'
          ? `${bNorm.hostname}.edgekey.net`
          : baseProviderDraft === 'AWS CloudFront'
          ? 'd2sfdc-prod.cloudfront.net'
          : bNorm.hostname,
      edgeIp: baseEdgeIpDraft.trim() || resolvedBase.edgeIp,
      customHeaders: bHeaders,
      summaryNote: `Env B (${bNorm.baseUrl}) via ${baseProviderDraft}`,
    };

    onUpdateCustomProfiles?.(nextCandidate, nextBaseline);
    setRoutingEditorOpen(false);
  };

  const candHeaderSummary = formatHeaderKeyValueLine(resolvedCand.customHeaders);
  const baseHeaderSummary = formatHeaderKeyValueLine(resolvedBase.customHeaders);

  return (
    <div className="relative border-b border-border bg-card min-w-0 shrink-0">
      {/* Row 1: Unified 48px Primary Workspace Bar — Compare 2 Envs | Single Run View */}
      <div className="px-4 py-1.5 min-h-12 flex flex-wrap items-center justify-between gap-2 min-w-0">
        {/* Left: Back to Sites + Mode Toggle + Release Verdict / Single Run Status + Site Name + Summary */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {onOpenSynthetics && (
            <button
              type="button"
              onClick={onOpenSynthetics}
              data-testid="btn-back-to-fleet"
              title="Step 1: Back to All Sites"
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">1. All Sites</span>
            </button>
          )}

          {/* First-Class View Mode Switcher: Compare 2 Envs vs Single Run */}
          <div
            data-testid="workbench-mode-toggle"
            className="inline-flex h-7 items-center rounded-md border border-border bg-background p-0.5 shrink-0"
          >
            <button
              type="button"
              onClick={() => onSetCompareMode('compare')}
              data-testid="mode-btn-compare"
              className={`h-6 rounded px-2 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                compareMode === 'compare'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Compare 2 Envs
            </button>
            <button
              type="button"
              onClick={() => onSetCompareMode('single')}
              data-testid="mode-btn-single"
              className={`h-6 rounded px-2 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                compareMode === 'single'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Single Run
            </button>
          </div>

          {compareMode === 'single' ? (
            <span
              data-testid="headline-verdict"
              className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 font-mono text-xs font-bold tracking-tight tabular-nums whitespace-nowrap shrink-0 ${
                singleRunAllPassed
                  ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
                  : 'border-rose-500/40 bg-rose-500/12 text-rose-700 dark:text-rose-300'
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              <span>
                SINGLE RUN · {singleRunPassed}/{singleRunTotal} PASS
              </span>
            </span>
          ) : (
            <span
              data-testid="headline-verdict"
              className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 font-mono text-xs font-bold tracking-tight tabular-nums whitespace-nowrap shrink-0 ${vApp.badgeClass}`}
            >
              {vApp.icon}
              <span>{headlineVerdict}</span>
            </span>
          )}

          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <h1 className="font-display text-sm font-semibold text-foreground truncate max-w-[200px]">
              {activeAppName}
            </h1>
            <span className="hidden 2xl:inline text-border shrink-0" aria-hidden="true">|</span>
            {compareMode === 'single' ? (
              <div className="hidden 2xl:flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground tabular-nums whitespace-nowrap truncate">
                <span className="text-foreground font-medium">
                  {activeCandRun?.label || candidateRunKey}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {totalChecks} {totalChecks === 1 ? 'check' : 'checks'}
                </span>
              </div>
            ) : (
              <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground tabular-nums whitespace-nowrap truncate">
                <span>{breakdown}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {totalChecks} {totalChecks === 1 ? 'check' : 'checks'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Single Run Controls OR Direct Env A ⇄ Env B Selectors + Run Diff + Envs Config + Hide Accepted + More */}
        <div
          ref={menuContainerRef}
          className="relative flex flex-wrap items-center gap-1.5 shrink-0"
        >
          {compareMode === 'single' ? (
            <>
              {/* Single Environment Selector */}
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 h-8">
                <span className="font-mono text-[10px] font-bold uppercase text-primary shrink-0">
                  Env
                </span>
                <select
                  value={matchedEnvA?.envKey || 'stage-akamai'}
                  aria-label="Select Single Run Environment"
                  data-testid="select-single-env"
                  onChange={(e) => handleSelectEnvA(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer max-w-[175px] truncate"
                >
                  {envTargets.map((env) => (
                    <option key={`single-env-${env.envKey}`} value={env.envKey}>
                      {env.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Single Run Snapshot Selector */}
              {candRuns.length > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 h-8">
                  <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground shrink-0">
                    Run
                  </span>
                  <select
                    value={activeCandRun?.key || candidateRunKey}
                    aria-label="Select Single Run Snapshot"
                    data-testid="select-single-run-key"
                    onChange={(e) => onChangeCandidateRunKey(e.target.value)}
                    className="bg-transparent font-mono text-xs font-semibold text-foreground focus:outline-none cursor-pointer max-w-[215px] truncate"
                  >
                    {candRuns.map((r) => (
                      <option key={`single-run-${r.key}`} value={r.key}>
                        {r.label} ({r.passedTests ?? totalChecks}/{r.totalTests ?? totalChecks} pass)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* First-Class Execution PoP Selector */}
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 h-8">
                <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground shrink-0">
                  PoP
                </span>
                <select
                  value={selectedExecutionPopId}
                  onChange={(e) => onChangeExecutionPopId(e.target.value)}
                  aria-label="Select Execution Edge PoP"
                  data-testid="toolbar-select-execution-pop"
                  className="bg-transparent font-mono text-xs font-semibold text-foreground focus:outline-none cursor-pointer max-w-[165px] truncate"
                >
                  <option value="auto">Auto (Default PoP)</option>
                  {GLOBAL_EXECUTION_POPS.map((p) => (
                    <option key={`toolbar-pop-${p.id}`} value={p.id}>
                      {p.popCode} · {p.city} ({p.stagingEdgeIp})
                    </option>
                  ))}
                </select>
              </div>

              {/* Run Single Environment */}
              <button
                type="button"
                onClick={() => onRunSingleTarget(candidateTarget)}
                data-testid="btn-run-single-env"
                title={`Execute live run on ${matchedEnvA?.name || candidateTarget}${
                  activePopOption ? ` from PoP ${activePopOption.popCode}` : ''
                }`}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer transition-opacity"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Run Single Env</span>
              </button>
            </>
          ) : (
            <>
              {/* Env A Selector */}
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 h-8">
                <span className="font-mono text-[10px] font-bold uppercase text-primary shrink-0">
                  Env A
                </span>
                <select
                  value={matchedEnvA?.envKey || 'stage-akamai'}
                  aria-label="Select Environment A"
                  data-testid="select-env-a"
                  onChange={(e) => handleSelectEnvA(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer max-w-[165px] truncate"
                >
                  {envTargets.map((env) => (
                    <option key={`env-a-${env.envKey}`} value={env.envKey}>
                      {env.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Swap Env A ⇄ Env B */}
              <button
                type="button"
                onClick={handleSwapEnvs}
                data-testid="btn-swap-envs"
                title="Swap Env A and Env B"
                aria-label="Swap Env A and Env B"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 cursor-pointer transition-colors"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
              </button>

              {/* Env B Selector */}
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 h-8">
                <span className="font-mono text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 shrink-0">
                  Env B
                </span>
                <select
                  value={matchedEnvB?.envKey || 'prod-akamai'}
                  aria-label="Select Environment B"
                  data-testid="select-env-b"
                  onChange={(e) => handleSelectEnvB(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer max-w-[165px] truncate"
                >
                  {envTargets.map((env) => (
                    <option key={`env-b-${env.envKey}`} value={env.envKey}>
                      {env.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* First-Class Execution PoP Selector */}
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 h-8">
                <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground shrink-0">
                  PoP
                </span>
                <select
                  value={selectedExecutionPopId}
                  onChange={(e) => onChangeExecutionPopId(e.target.value)}
                  aria-label="Select Execution Edge PoP"
                  data-testid="toolbar-select-execution-pop"
                  className="bg-transparent font-mono text-xs font-semibold text-foreground focus:outline-none cursor-pointer max-w-[165px] truncate"
                >
                  <option value="auto">Auto (Default PoP)</option>
                  {GLOBAL_EXECUTION_POPS.map((p) => (
                    <option key={`toolbar-pop-${p.id}`} value={p.id}>
                      {p.popCode} · {p.city} ({p.stagingEdgeIp})
                    </option>
                  ))}
                </select>
              </div>

              {/* Run Diff across Env A and Env B */}
              <button
                type="button"
                onClick={() => onRunSingleTarget(candidateTarget)}
                data-testid="btn-run-env-diff"
                title={`Run diff between ${matchedEnvA?.name || 'Env A'} and ${matchedEnvB?.name || 'Env B'}${
                  activePopOption ? ` from PoP ${activePopOption.popCode}` : ''
                }`}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer transition-opacity"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Run Diff</span>
              </button>
            </>
          )}

          {/* Configure / Edit Environments Routing */}
          <button
            type="button"
            onClick={() => setRoutingEditorOpen((v) => !v)}
            data-testid="btn-customize-routing"
            title="Inspect or customize Env A and Env B URLs, Headers, and Edge routing"
            className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              routingEditorOpen
                ? 'border-primary bg-accent text-accent-foreground'
                : 'border-border bg-background text-foreground hover:bg-muted'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Envs</span>
          </button>

          {compareMode === 'compare' && (
            /* Hide Accepted Toggle */
            <button
              type="button"
              role="switch"
              aria-checked={ignoreAcceptedDiffs}
              onClick={onToggleIgnoreAccepted}
              data-testid="toggle-ignore-accepted"
              title="Hide differences that have already been accepted"
              className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <span
                className={`inline-block h-3 w-5 rounded-full transition-colors relative ${
                  ignoreAcceptedDiffs ? 'bg-primary' : 'bg-muted-foreground/40'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-2 w-2 rounded-full bg-white transition-transform ${
                    ignoreAcceptedDiffs ? 'left-2.5' : 'left-0.5'
                  }`}
                />
              </span>
              <span className="hidden md:inline">Hide Accepted</span>
            </button>
          )}

          {/* Overflow Menu */}
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === 'more' ? null : 'more')}
            data-testid="btn-more-popover"
            aria-label="More options"
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors cursor-pointer ${
              openMenu === 'more' || openMenu === 'sre' || openMenu === 'compare'
                ? 'border-primary bg-accent text-accent-foreground'
                : 'border-border bg-background text-foreground hover:bg-muted'
            }`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {/* Advanced Run Snapshots & Edge PoP Popover (accessible from More menu) */}
          {openMenu === 'compare' && (
            <div className="absolute right-0 top-9.5 z-40 w-84 rounded-md border border-border bg-popover p-3.5 shadow-lg">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="text-xs font-semibold text-foreground">
                  Run Snapshots &amp; Edge PoP ({activeAppId})
                </span>
                <div className="inline-flex rounded border border-border bg-background p-0.5">
                  <button
                    type="button"
                    onClick={() => onSetCompareMode('compare')}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium cursor-pointer ${
                      compareMode === 'compare'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Compare 2 Envs
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetCompareMode('single')}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium cursor-pointer ${
                      compareMode === 'single'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Single Env
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2.5 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                    {compareMode === 'single' ? 'Environment Target' : 'Env A Target & Run Snapshot'}
                  </label>
                  <select
                    value={candidateTarget}
                    onChange={(e) => onChangeCandidateTarget(e.target.value)}
                    className="h-8 w-full rounded border border-border bg-background px-2 font-mono text-xs text-foreground"
                  >
                    {availableTargets.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {candRuns.length > 0 && (
                    <select
                      value={candidateRunKey}
                      onChange={(e) => onChangeCandidateRunKey(e.target.value)}
                      className="mt-1.5 h-7.5 w-full rounded border border-border bg-muted/50 px-2 font-mono text-[11px] text-foreground"
                    >
                      {candRuns.map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {compareMode === 'compare' && (
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Env B Target &amp; Run Snapshot
                    </label>
                    <select
                      value={baselineTarget}
                      onChange={(e) => onChangeBaselineTarget(e.target.value)}
                      className="h-8 w-full rounded border border-border bg-background px-2 font-mono text-xs text-foreground"
                    >
                      {availableTargets.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {baseRuns.length > 0 && (
                      <select
                        value={baselineRunKey}
                        onChange={(e) => onChangeBaselineRunKey(e.target.value)}
                        className="mt-1.5 h-7.5 w-full rounded border border-border bg-muted/50 px-2 font-mono text-[11px] text-foreground"
                      >
                        {baseRuns.map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Edge Execution PoP
                  </label>
                  <select
                    value={selectedExecutionPopId}
                    onChange={(e) => onChangeExecutionPopId(e.target.value)}
                    data-testid="select-execution-pop"
                    className="h-8 w-full rounded border border-border bg-background px-2 font-mono text-xs text-foreground"
                  >
                    <option value="auto">Auto (Property Default)</option>
                    {GLOBAL_EXECUTION_POPS.map((pop) => (
                      <option key={pop.id} value={pop.id}>
                        {pop.popCode} — {pop.city} ({pop.regionGroup})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/70">
                  {compareMode === 'compare' ? (
                    <button
                      type="button"
                      onClick={handleSwapEnvs}
                      className="inline-flex h-7 items-center gap-1 rounded border border-border px-2.5 text-[11px] font-medium hover:bg-muted cursor-pointer"
                    >
                      <ArrowLeftRight className="h-3 w-3" />
                      Swap Envs
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onRunSingleTarget(candidateTarget);
                        setOpenMenu(null);
                      }}
                      className="inline-flex h-7 items-center gap-1 rounded bg-primary px-2.5 text-[11px] font-medium text-primary-foreground cursor-pointer"
                    >
                      Run {shortTarget(candidateTarget)}
                    </button>
                  )}
                  <div className="flex items-center gap-3">
                    {onOpenSetup && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenu(null);
                          onOpenSetup('envs');
                        }}
                        data-testid="btn-popover-manage-envs"
                        className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                      >
                        Manage Envs
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setOpenMenu(null)}
                      className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SRE Performance Detail Popover (launched from More menu) */}
          {openMenu === 'sre' && (
            <div className="absolute right-0 top-9.5 z-40 w-96 max-w-[92vw] rounded-md border border-border bg-popover p-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-semibold text-foreground">
                  Edge SRE &amp; Performance Telemetry
                </span>
                <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                  Risk: {sreSummary.releaseRiskTier}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-[11px] text-muted-foreground">Apdex</div>
                  <div className="font-mono text-sm font-semibold tabular-nums">
                    {sreSummary.apdexCandidate.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">P50 / P95</div>
                  <div className="font-mono text-sm font-semibold tabular-nums">
                    {sreSummary.p50CandidateMs} / {sreSummary.p95CandidateMs}ms
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">Cache Parity</div>
                  <div className="font-mono text-sm font-semibold tabular-nums">
                    {sreSummary.cacheParityPct}%
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">CWV Good</div>
                  <div className="font-mono text-sm font-semibold tabular-nums">
                    {sreSummary.cwvPassRatePct}%
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">SLO Budget</div>
                  <div className="font-mono text-sm font-semibold tabular-nums">
                    {sreSummary.sloErrorBudgetRemainingPct}%
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">Burn Rate</div>
                  <div className="font-mono text-sm font-semibold tabular-nums">
                    {sreSummary.sloBurnRateMultiplier}x
                  </div>
                </div>
              </div>

              {topDiagnosis && (
                <div className="mt-3 border-t border-border pt-3">
                  <div className="text-[11px] font-semibold text-muted-foreground">
                    Top Diagnosis · {topDiagnosis.testId}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-foreground">
                    {topDiagnosis.title}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {topDiagnosis.rootCauseSummary}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground truncate">
                      {topDiagnosis.remediationTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(topDiagnosis.remediationSnippet);
                        setCopiedPapi(true);
                        setTimeout(() => setCopiedPapi(false), 1800);
                      }}
                      className="inline-flex h-7 items-center gap-1 rounded border border-border bg-background px-2 text-[11px] font-medium hover:bg-muted shrink-0 cursor-pointer"
                    >
                      <Copy className="h-3 w-3" />
                      {copiedPapi ? 'Copied' : 'Copy Fix'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Overflow Menu */}
          {openMenu === 'more' && (
            <div className="absolute right-0 top-9.5 z-40 w-64 rounded-md border border-border bg-popover p-1.5 shadow-lg text-xs">
              <button
                type="button"
                onClick={() => setOpenMenu('compare')}
                data-testid="btn-compare-popover"
                className="flex w-full items-center justify-between rounded px-2.5 py-2 text-left hover:bg-muted cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
                  <span>Run Snapshots &amp; Edge PoP</span>
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {selectedExecutionPopId}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOpenMenu('sre')}
                data-testid="btn-sre-popover"
                className="flex w-full items-center justify-between rounded px-2.5 py-2 text-left hover:bg-muted cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  <span>SRE Telemetry</span>
                </span>
                <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                  P95 {sreSummary.p95CandidateMs}ms
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onCopyMarkdown();
                  setOpenMenu(null);
                }}
                data-testid="btn-copy-markdown"
                className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left hover:bg-muted cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Export Markdown Summary</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onRerunAllDiffs();
                  setOpenMenu(null);
                }}
                data-testid="btn-rerun-all-diffs"
                className="flex w-full items-center justify-between rounded px-2.5 py-2 text-left hover:bg-muted cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <RotateCw className="h-3.5 w-3.5 text-primary" />
                  <span>Re-run Diffing Checks</span>
                </span>
                {totalUnaccepted > 0 && (
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                    {totalUnaccepted}
                  </span>
                )}
              </button>

              {(onOpenSetup || onOpenVsCode) && (
                <>
                  <div className="my-1 border-t border-border" />
                  {onOpenSetup && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenSetup('envs');
                        setOpenMenu(null);
                      }}
                      className="flex w-full items-center justify-between rounded px-2.5 py-2 text-left hover:bg-muted cursor-pointer"
                    >
                      <span>Configure Property Envs</span>
                      <span className="font-mono text-[11px] text-primary">Config</span>
                    </button>
                  )}
                  {onOpenVsCode && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenVsCode();
                        setOpenMenu(null);
                      }}
                      className="flex w-full items-center justify-between rounded px-2.5 py-2 text-left hover:bg-muted cursor-pointer"
                    >
                      <span>Open Code Editor</span>
                      <span className="font-mono text-[11px] text-primary">Studio</span>
                    </button>
                  )}
                </>
              )}

              <div className="my-1 border-t border-border" />

              <button
                type="button"
                onClick={() => {
                  onToggleTheme();
                  setOpenMenu(null);
                }}
                className="flex w-full items-center justify-between rounded px-2.5 py-2 text-left hover:bg-muted cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Sun className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </span>
                <kbd className="font-mono text-[11px] text-muted-foreground">T</kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenCommandPalette();
                  setOpenMenu(null);
                }}
                className="flex w-full items-center justify-between rounded px-2.5 py-2 text-left hover:bg-muted cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Command className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Quick Jump</span>
                </span>
                <kbd className="font-mono text-[11px] text-muted-foreground">⌘K</kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenShortcuts();
                  setOpenMenu(null);
                }}
                className="flex w-full items-center justify-between rounded px-2.5 py-2 text-left hover:bg-muted cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Keyboard className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Keyboard Shortcuts</span>
                </span>
                <kbd className="font-mono text-[11px] text-muted-foreground">?</kbd>
              </button>

              {backgroundJobs.length > 0 && (
                <>
                  <div className="my-1 border-t border-border" />
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                    Recent Runs ({backgroundJobs.length})
                  </div>
                  {backgroundJobs.slice(0, 3).map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between px-2.5 py-1 text-[11px] text-muted-foreground"
                    >
                      <span className="truncate pr-2">{job.label}</span>
                      <span className="font-mono shrink-0 tabular-nums">{job.progress}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Slim 1-Line Active Environments Summary Strip (Compare 2 Envs OR Single Run View) */}
      {compareMode === 'single' ? (
        <div
          data-testid="single-run-topology-strip"
          className="border-t border-border/60 bg-primary/[0.04] px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]"
        >
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
              SINGLE RUN VIEW
            </span>
            <span className="font-semibold text-foreground">
              {matchedEnvA?.name || resolvedCand.label}
            </span>
            <span className="text-muted-foreground">·</span>
            <span
              data-testid="topology-candidate-url"
              className="font-mono text-foreground font-medium truncate max-w-[260px]"
            >
              {resolvedCand.baseUrl}
            </span>
            {resolvedCand.routingMechanism === 'custom-header' && candHeaderSummary && (
              <span
                data-testid="topology-candidate-header"
                className="font-mono text-primary truncate max-w-[240px]"
              >
                [Header: {candHeaderSummary}]
              </span>
            )}
            {resolvedCand.routingMechanism === 'edge-dns' && resolvedCand.edgeHost && (
              <span className="hidden md:inline font-mono text-muted-foreground truncate max-w-[220px]">
                ({resolvedCand.edgeHost})
              </span>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-muted-foreground truncate">
              Run: <strong className="text-foreground">{activeCandRun?.key || candidateRunKey}</strong>
            </span>
            <span className="text-muted-foreground">·</span>
            <span
              data-testid="topology-active-pop"
              className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary"
            >
              <span>PoP:</span>
              <span>
                {activeCandRun?.executionPop?.stagingPopCode
                  ? `${activeCandRun.executionPop.stagingPopCode} (${
                      activePopOption?.city ||
                      activeCandRun.executionPop.regionLabel ||
                      activeCandRun.executionPop.awsRegion ||
                      'Edge'
                    } · ${activeCandRun.executionPop.stagingEdgeIp})`
                  : activePopOption
                  ? `${activePopOption.popCode} (${activePopOption.city} · ${activePopOption.stagingEdgeIp})`
                  : 'Auto (Default PoP)'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span
              data-testid="single-run-synthetics-canary-badge"
              className="hidden sm:inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
              title="Executed via AWS CloudWatch Synthetics Canary (syn-nodejs-puppeteer-9.1)"
            >
              <span>AWS Synthetics Canary:</span>
              <span>ak-{activeAppId}-{matchedEnvA?.envKey || 'stg'}</span>
            </span>
            <button
              type="button"
              onClick={() => onSetCompareMode('compare')}
              data-testid="btn-switch-to-compare-mode"
              className="font-semibold text-primary hover:underline cursor-pointer"
            >
              Compare vs Another Env →
            </button>
          </div>
        </div>
      ) : (
        <div
          data-testid="comparison-topology-strip"
          className="border-t border-border/60 bg-muted/20 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px]"
        >
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {/* Env A Routing Summary */}
            <div className="inline-flex items-center gap-1.5 min-w-0">
              <span className="rounded bg-primary/12 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                ENV A
              </span>
              <span className="font-semibold text-foreground">
                {matchedEnvA?.name || resolvedCand.label}
              </span>
              <span className="text-muted-foreground">·</span>
              <span
                data-testid="topology-candidate-url"
                className="font-mono text-foreground font-medium truncate max-w-[230px]"
              >
                {resolvedCand.baseUrl}
              </span>
              {resolvedCand.routingMechanism === 'custom-header' && candHeaderSummary && (
                <span
                  data-testid="topology-candidate-header"
                  className="font-mono text-primary truncate max-w-[220px]"
                >
                  [Header: {candHeaderSummary}]
                </span>
              )}
              {resolvedCand.routingMechanism === 'edge-dns' && resolvedCand.edgeHost && (
                <span className="hidden md:inline font-mono text-muted-foreground truncate max-w-[210px]">
                  ({resolvedCand.edgeHost})
                </span>
              )}
            </div>

            <span className="font-mono font-bold text-muted-foreground px-1">vs</span>

            {/* Env B Routing Summary */}
            <div className="inline-flex items-center gap-1.5 min-w-0">
              <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                ENV B
              </span>
              <span className="font-semibold text-foreground">
                {matchedEnvB?.name || resolvedBase.label}
              </span>
              <span className="text-muted-foreground">·</span>
              <span
                data-testid="topology-baseline-url"
                className="font-mono text-foreground font-medium truncate max-w-[230px]"
              >
                {resolvedBase.baseUrl}
              </span>
              {resolvedBase.routingMechanism === 'custom-header' && baseHeaderSummary && (
                <span className="font-mono text-muted-foreground truncate max-w-[180px]">
                  [Header: {baseHeaderSummary}]
                </span>
              )}
              {resolvedBase.routingMechanism === 'edge-dns' && resolvedBase.edgeHost && (
                <span className="hidden xl:inline font-mono text-muted-foreground truncate max-w-[190px]">
                  ({resolvedBase.edgeHost})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span
              data-testid="topology-active-pop"
              className="hidden sm:inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary"
              title="Active Edge PoP used when executing synthetic probes"
            >
              <span>PoP:</span>
              <span>
                {activePopOption
                  ? `${activePopOption.popCode} (${activePopOption.city} · ${activePopOption.stagingEdgeIp})`
                  : 'Auto (Default PoP)'}
              </span>
            </span>
            <span
              data-testid="compare-synthetics-canary-badge"
              className="hidden sm:inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
              title="All test runs execute via AWS CloudWatch Synthetics Canaries (syn-nodejs-puppeteer-9.1)"
            >
              <span>AWS Synthetics:</span>
              <span>
                ak-{activeAppId}-{matchedEnvA?.envKey || 'env-a'} ↔ ak-{activeAppId}-{matchedEnvB?.envKey || 'env-b'}
              </span>
            </span>
            {onOpenSetup && (
              <button
                type="button"
                onClick={() => onOpenSetup('envs')}
                className="font-medium text-primary hover:underline cursor-pointer"
              >
                Manage Envs ({envTargets.length}) →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Expandable Inline Environment A & Environment B Routing Override Drawer */}
      {routingEditorOpen && (
        <form
          onSubmit={handleApplyCustomRouting}
          data-testid="custom-routing-editor"
          className="border-t border-border bg-muted/35 px-4 py-3 text-xs space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold text-foreground">
                Environment A vs Environment B Routing Configuration
              </span>
              <span className="text-muted-foreground">
                Each environment defines its own URL, Edge DNS/IP (Akamai / CloudFront), and Custom Headers
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRoutingEditorOpen(false)}
              aria-label="Close routing editor"
              className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* Env A Configuration */}
            <div className="rounded-md border border-border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  Env A — {matchedEnvA?.name || 'First Environment'}
                </span>
                <div className="inline-flex items-center gap-1.5">
                  <select
                    value={candProviderDraft}
                    onChange={(e) =>
                      setCandProviderDraft(e.target.value as CdnOrOriginProvider)
                    }
                    aria-label="Env A CDN or origin provider"
                    data-testid="input-candidate-provider"
                    className="h-7 rounded border border-border bg-background px-2 text-[11px] text-foreground"
                  >
                    <option value="Akamai Edge">Akamai Edge</option>
                    <option value="AWS CloudFront">AWS CloudFront</option>
                    <option value="Direct / Custom URL">Direct / Custom URL</option>
                  </select>
                  <select
                    value={candMechanismDraft}
                    onChange={(e) =>
                      setCandMechanismDraft(e.target.value as RoutingMechanism)
                    }
                    aria-label="Env A routing mechanism"
                    data-testid="input-candidate-mechanism"
                    className="h-7 rounded border border-border bg-background px-2 text-[11px] text-foreground"
                  >
                    <option value="edge-dns">Same URL + Edge DNS/IP</option>
                    <option value="custom-header">Same URL + Custom Header</option>
                    <option value="different-url">Completely Different URL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-0.5">
                    Env A Base URL
                  </label>
                  <input
                    type="text"
                    value={candUrlDraft}
                    onChange={(e) => setCandUrlDraft(e.target.value)}
                    placeholder="https://www-uat1.salesforce.com"
                    aria-label="Env A Base URL"
                    data-testid="input-candidate-url"
                    className="h-7.5 w-full rounded border border-border bg-background px-2 font-mono text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-0.5">
                    Env A Routing Headers (Key: Value)
                  </label>
                  <input
                    type="text"
                    value={candHeaderDraft}
                    onChange={(e) => setCandHeaderDraft(e.target.value)}
                    placeholder="aws-cf-cd-staging: true; x-canary: stage"
                    aria-label="Env A Routing Headers"
                    data-testid="input-candidate-headers"
                    className="h-7.5 w-full rounded border border-border bg-background px-2 font-mono text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-0.5">
                    Edge Resolve IP (Optional)
                  </label>
                  <input
                    type="text"
                    value={candEdgeIpDraft}
                    onChange={(e) => setCandEdgeIpDraft(e.target.value)}
                    placeholder="23.48.201.18"
                    aria-label="Env A Edge IP"
                    className="h-7.5 w-full rounded border border-border bg-background px-2 font-mono text-xs text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Env B Configuration */}
            <div className="rounded-md border border-border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  Env B — {matchedEnvB?.name || 'Second Environment'}
                </span>
                <div className="inline-flex items-center gap-1.5">
                  <select
                    value={baseProviderDraft}
                    onChange={(e) =>
                      setBaseProviderDraft(e.target.value as CdnOrOriginProvider)
                    }
                    aria-label="Env B CDN or origin provider"
                    data-testid="input-baseline-provider"
                    className="h-7 rounded border border-border bg-background px-2 text-[11px] text-foreground"
                  >
                    <option value="Akamai Edge">Akamai Edge</option>
                    <option value="AWS CloudFront">AWS CloudFront</option>
                    <option value="Direct / Custom URL">Direct / Custom URL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-0.5">
                    Env B Base URL
                  </label>
                  <input
                    type="text"
                    value={baseUrlDraft}
                    onChange={(e) => setBaseUrlDraft(e.target.value)}
                    placeholder="https://www.salesforce.com"
                    aria-label="Env B Base URL"
                    data-testid="input-baseline-url"
                    className="h-7.5 w-full rounded border border-border bg-background px-2 font-mono text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-0.5">
                    Baseline Routing Headers (Key: Value)
                  </label>
                  <input
                    type="text"
                    value={baseHeaderDraft}
                    onChange={(e) => setBaseHeaderDraft(e.target.value)}
                    placeholder="Pragma: akamai-x-cache-on"
                    aria-label="Baseline Routing Headers"
                    data-testid="input-baseline-headers"
                    className="h-7.5 w-full rounded border border-border bg-background px-2 font-mono text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-muted-foreground mb-0.5">
                    Edge Resolve IP (Optional)
                  </label>
                  <input
                    type="text"
                    value={baseEdgeIpDraft}
                    onChange={(e) => setBaseEdgeIpDraft(e.target.value)}
                    placeholder="23.212.251.15"
                    aria-label="Baseline Edge IP"
                    className="h-7.5 w-full rounded border border-border bg-background px-2 font-mono text-xs text-foreground"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-muted-foreground">
              Location redirect headers and canonical hosts are normalized automatically across different URLs.
            </span>
            <div className="flex items-center gap-2">
              {onOpenSetup && (
                <button
                  type="button"
                  onClick={() => {
                    setRoutingEditorOpen(false);
                    onOpenSetup('envs');
                  }}
                  className="inline-flex h-7 items-center gap-1 rounded border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
                >
                  Save as Permanent Environment →
                </button>
              )}
              <button
                type="submit"
                data-testid="btn-apply-custom-routing"
                className="inline-flex h-7 items-center gap-1 rounded bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Apply Comparison Routing</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {runStreamState && (
        <div
          data-testid="compare-live-run-banner"
          className={`flex flex-wrap items-center justify-between gap-3 border-t px-4 py-1.5 text-xs transition-colors ${
            runStreamState.active
              ? 'border-primary/40 bg-primary/[0.08]'
              : 'border-emerald-500/35 bg-emerald-500/[0.06]'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {runStreamState.active ? (
              <span className="inline-flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary-foreground shrink-0">
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                <span>LIVE RUN</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white shrink-0">
                <Check className="h-2.5 w-2.5" />
                <span>RUN COMPLETED</span>
              </span>
            )}
            <span className="font-semibold text-foreground shrink-0">Where:</span>
            <span className="font-mono text-[11px] font-semibold text-primary truncate">
              Env A ({matchedEnvA?.shortName || runStreamState.targetA}) ↔ Env B ({matchedEnvB?.shortName || runStreamState.targetB})
            </span>
            <span className="text-muted-foreground hidden sm:inline">·</span>
            <span className="font-mono text-[11px] text-muted-foreground hidden sm:inline truncate">
              ak-{activeAppId}-{matchedEnvA?.envKey || 'env-a'} ↔ ak-{activeAppId}-{matchedEnvB?.envKey || 'env-b'}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-[11px] font-semibold text-primary">
              PoP:{' '}
              {activePopOption
                ? `${activePopOption.popCode} (${activePopOption.city} · ${activePopOption.stagingEdgeIp})`
                : 'Auto (Default PoP)'}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-[11px] text-foreground truncate">
              {runStreamState.headlineStatus}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-1.5 w-32 sm:w-44 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all duration-200 ${
                  runStreamState.active ? 'bg-primary' : 'bg-emerald-500'
                }`}
                style={{ width: `${runStreamState.progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-[11px] font-semibold text-foreground tabular-nums shrink-0">
              {runStreamState.completedCount}/{runStreamState.totalCount} ({runStreamState.progressPercent}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
