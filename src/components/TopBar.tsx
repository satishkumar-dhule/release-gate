import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Command,
  GitCompareArrows,
  Globe,
  Loader2,
  Moon,
  Play,
  Search,
  SlidersHorizontal,
  Sun,
  Terminal,
} from 'lucide-react';
import { OverallVerdict } from '../engine/types';
import { PropertyGateSummary, WorkbenchViewMode } from '../engine/workbenchModel';

export interface TopBarProps {
  viewMode: WorkbenchViewMode;
  onSelectView: (mode: WorkbenchViewMode) => void;
  onRunLiveGate: () => void;
  isRunningGate: boolean;
  runningProgressText?: string;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  activeAppId?: string;
  propertySummaries?: PropertyGateSummary[];
  onSelectProperty?: (appId: string) => void;
  propertySwitcherOpen?: boolean;
  onSetPropertySwitcherOpen?: (open: boolean) => void;
  onOpenManageProperties?: () => void;
  onOpenCommandPalette?: () => void;
}

const NAV_ITEMS: Array<{
  id: WorkbenchViewMode;
  step: string;
  label: string;
  tooltip: string;
  icon: React.FC<{ className?: string }>;
}> = [
  {
    id: 'synthetics',
    step: '1',
    label: 'Sites',
    tooltip: '1. Sites — All Monitored Properties & Release Status',
    icon: Globe,
  },
  {
    id: 'workbench',
    step: '2',
    label: 'Compare',
    tooltip: '2. Compare — Prod vs Stage & Prod vs Prod Diff Gate',
    icon: GitCompareArrows,
  },
  {
    id: 'config',
    step: '3',
    label: 'Settings',
    tooltip: '3. Configure — Pages, URLs/Headers & Accepted Rules',
    icon: SlidersHorizontal,
  },
  {
    id: 'studio',
    step: '4',
    label: 'Developer',
    tooltip: '4. Automate — CI/CD REST API & MCP Agent Tools',
    icon: Terminal,
  },
];

function verdictColor(verdict: OverallVerdict): string {
  if (verdict === 'NO-GO') return 'text-rose-700 dark:text-rose-400';
  if (verdict === 'REVIEW') return 'text-amber-700 dark:text-amber-400';
  if (verdict === 'GO') return 'text-emerald-700 dark:text-emerald-400';
  return 'text-muted-foreground';
}

function verdictDotColor(verdict?: OverallVerdict): string {
  if (verdict === 'NO-GO') return 'bg-rose-500';
  if (verdict === 'REVIEW') return 'bg-amber-500';
  if (verdict === 'GO') return 'bg-emerald-500';
  return 'bg-muted-foreground';
}

export const TopBar: React.FC<TopBarProps> = ({
  viewMode,
  onSelectView,
  onRunLiveGate,
  isRunningGate,
  runningProgressText,
  theme = 'light',
  onToggleTheme,
  activeAppId,
  propertySummaries = [],
  onSelectProperty,
  propertySwitcherOpen,
  onSetPropertySwitcherOpen,
  onOpenManageProperties,
  onOpenCommandPalette,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suppressedTooltipId, setSuppressedTooltipId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isOpen =
    typeof propertySwitcherOpen === 'boolean' ? propertySwitcherOpen : internalOpen;

  const setOpen = (next: boolean) => {
    if (onSetPropertySwitcherOpen) onSetPropertySwitcherOpen(next);
    else setInternalOpen(next);
  };

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    const t = setTimeout(() => searchInputRef.current?.focus(), 15);
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const filteredProps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return propertySummaries;
    return propertySummaries.filter(
      (p) =>
        p.appId.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.canonicalHost.toLowerCase().includes(q)
    );
  }, [propertySummaries, query]);

  const activePropSummary = propertySummaries.find((p) => p.appId === activeAppId);

  return (
    <aside
      aria-label="Application navigation rail"
      className="sticky top-0 z-30 flex h-12 w-full shrink-0 items-center justify-between border-b border-border bg-card px-2.5 md:h-screen md:w-14 md:flex-col md:border-b-0 md:border-r md:px-0 md:py-2.5"
    >
      {/* Top Group: Brand Mark, Active Site Switcher Icon, and Icon-Only Primary Navigation */}
      <div className="flex items-center gap-1.5 md:flex-col md:gap-2" ref={containerRef}>
        <div className="relative group">
          <button
            type="button"
            onClick={() => onSelectView('synthetics')}
            data-testid="topbar-brand-home"
            aria-label="Synthetic Release Gate Home"
            title="Synthetic Release Gate"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background text-primary hover:border-primary/50 hover:bg-muted/60 transition-colors cursor-pointer"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="text-primary shrink-0"
            >
              <path d="M4 5H10V19H4V5Z" stroke="currentColor" strokeWidth="2.2" />
              <path d="M14 5H20V19H14V5Z" stroke="currentColor" strokeWidth="2.2" />
              <path
                d="M10 12H14"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="square"
              />
            </svg>
          </button>
          <span
            role="tooltip"
            className="pointer-events-none hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-2.5 rounded-md border border-border bg-popover px-2.5 py-1 text-xs font-semibold text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
          >
            Synthetic Release Gate
          </span>
        </div>

        {/* Active Site Switcher Trigger (Compact Monogram + Verdict Dot) */}
        {activeAppId && onSelectProperty && (
          <div className="relative group">
            <button
              type="button"
              onClick={() => setOpen(!isOpen)}
              data-testid="property-switcher-trigger"
              aria-expanded={isOpen}
              aria-label={`Active site ${activeAppId}. Click to switch site`}
              title={`Active site: ${activeAppId} (Press / to switch)`}
              className={`relative inline-flex h-9 w-9 items-center justify-center rounded-md border font-mono text-[10px] font-bold uppercase tracking-tight transition-colors cursor-pointer ${
                isOpen
                  ? 'border-primary bg-accent text-primary'
                  : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/70'
              }`}
            >
              <span className="truncate max-w-[30px]">
                {activeAppId.slice(0, 3)}
              </span>
              {activePropSummary && (
                <span
                  aria-hidden="true"
                  className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card ${verdictDotColor(
                    activePropSummary.verdict
                  )}`}
                />
              )}
            </button>

            {!isOpen && (
              <span
                role="tooltip"
                className="pointer-events-none hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-2.5 rounded-md border border-border bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
              >
                Site: <span className="font-mono font-semibold">{activeAppId}</span>{' '}
                <span className="text-muted-foreground">({activePropSummary?.verdict || 'Switch /'})</span>
              </span>
            )}

            {isOpen && (
              <div
                data-testid="property-switcher-popover"
                className="absolute left-0 top-11 md:left-full md:top-0 md:ml-2.5 z-50 w-80 sm:w-96 rounded-md border border-border bg-popover shadow-xl overflow-hidden"
              >
                <div className="border-b border-border p-2.5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && filteredProps[0]) {
                          e.preventDefault();
                          onSelectProperty(filteredProps[0].appId);
                          setOpen(false);
                        }
                      }}
                      placeholder="Filter properties by ID, name, or host…"
                      aria-label="Search properties"
                      data-testid="property-switcher-search"
                      className="h-8 w-full rounded border border-border bg-background pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
                  {filteredProps.map((item) => {
                    const active = item.appId === activeAppId;
                    return (
                      <button
                        key={item.appId}
                        type="button"
                        onClick={() => {
                          onSelectProperty(item.appId);
                          setOpen(false);
                        }}
                        data-testid={`switcher-prop-${item.appId}`}
                        className={`flex w-full items-center justify-between gap-2.5 px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                          active
                            ? 'bg-accent/70 text-foreground'
                            : 'hover:bg-muted/60 text-foreground'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono font-semibold ${
                                active ? 'text-primary' : 'text-foreground'
                              }`}
                            >
                              {item.appId}
                            </span>
                            {active && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                            <span className="text-[11px] text-muted-foreground truncate">
                              {item.canonicalHost}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {item.name}
                          </div>
                        </div>
                        <span
                          className={`font-mono text-[11px] font-semibold tabular-nums shrink-0 ${verdictColor(
                            item.verdict
                          )}`}
                        >
                          {item.verdict}
                        </span>
                      </button>
                    );
                  })}

                  {filteredProps.length === 0 && (
                    <div className="px-3 py-5 text-center text-xs text-muted-foreground">
                      No properties match "{query}"
                    </div>
                  )}
                </div>

                {onOpenManageProperties && (
                  <div className="border-t border-border bg-muted/30 px-3 py-2 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                      {propertySummaries.length} properties configured
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        onOpenManageProperties();
                      }}
                      className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                    >
                      Manage Properties →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="hidden md:block h-px w-7 bg-border my-0.5" aria-hidden="true" />

        {/* Primary Icon-Only Navigation */}
        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-1 md:flex-col md:gap-1.5"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              viewMode === item.id || (item.id === 'studio' && viewMode === 'vscode');
            const isTooltipSuppressed = suppressedTooltipId === item.id;
            return (
              <div
                key={item.id}
                className="relative group"
                onMouseLeave={() => {
                  if (suppressedTooltipId === item.id) {
                    setSuppressedTooltipId(null);
                  }
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    setSuppressedTooltipId(item.id);
                    e.currentTarget.blur();
                    onSelectView(item.id);
                  }}
                  data-testid={`nav-${item.id}`}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  title={item.tooltip}
                  className={`relative inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors cursor-pointer ${
                    active
                      ? 'bg-primary/12 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span
                    aria-hidden="true"
                    className="absolute right-0.5 bottom-0.5 font-mono text-[8px] font-bold leading-none opacity-65"
                  >
                    {item.step}
                  </span>
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 inset-x-2 h-0.5 md:inset-x-auto md:left-0 md:inset-y-1.5 md:w-0.5 md:h-auto bg-primary rounded-full"
                    />
                  )}
                </button>
                {!isTooltipSuppressed && (
                  <span
                    role="tooltip"
                    className="pointer-events-none hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-2.5 rounded-md border border-border bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
                  >
                    {item.tooltip}
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Group: Run Gate Icon, Quick Jump Icon, Theme Toggle Icon */}
      <div className="flex items-center gap-1.5 md:flex-col md:gap-2">
        <div className="relative group">
          <button
            type="button"
            onClick={onRunLiveGate}
            disabled={isRunningGate}
            data-testid="run-live-gate-cta"
            aria-label={
              isRunningGate && runningProgressText ? runningProgressText : 'Run Check'
            }
            title={
              isRunningGate && runningProgressText
                ? runningProgressText
                : 'Run Check: Test Staging vs Production for the active site'
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity cursor-pointer shadow-xs"
          >
            {isRunningGate ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
            )}
          </button>
          <span
            role="tooltip"
            className="pointer-events-none hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-2.5 rounded-md border border-border bg-popover px-2.5 py-1 text-xs font-semibold text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
          >
            {isRunningGate && runningProgressText
              ? runningProgressText
              : `Run Check (${activeAppId || 'active site'})`}
          </span>
        </div>

        {onOpenCommandPalette && (
          <div className="relative group">
            <button
              type="button"
              onClick={onOpenCommandPalette}
              data-testid="topbar-command-palette"
              aria-label="Open command palette"
              title="Command Palette (⌘K)"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Command className="h-4 w-4" />
            </button>
            <span
              role="tooltip"
              className="pointer-events-none hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-2.5 rounded-md border border-border bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
            >
              Quick Jump <kbd className="ml-1 font-mono text-[10px] text-muted-foreground">⌘K</kbd>
            </span>
          </div>
        )}

        {onToggleTheme && (
          <div className="relative group">
            <button
              type="button"
              onClick={onToggleTheme}
              data-testid="topbar-theme-toggle"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme (T)`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <span
              role="tooltip"
              className="pointer-events-none hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-2.5 rounded-md border border-border bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
            >
              {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}{' '}
              <kbd className="ml-1 font-mono text-[10px] text-muted-foreground">T</kbd>
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
