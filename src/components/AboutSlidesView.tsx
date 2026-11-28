import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Cpu,
  GitCompareArrows,
  Globe,
  LayoutGrid,
  Layers,
  Play,
  Presentation,
  Search,
  SlidersHorizontal,
  Terminal,
} from 'lucide-react';
import {
  ABOUT_SLIDES,
  AboutSlideDefinition,
  SlideCategory,
  SlideInteractiveCta,
  filterAboutSlides,
  resolveSlideStepIndex,
} from '../engine/aboutSlidesModel';
import { InspectorDimensionTab, WorkbenchViewMode } from '../engine/workbenchModel';

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
  const [displayMode, setDisplayMode] = useState<'deck' | 'storyboard'>('deck');
  const [selectedDiagramStepIdx, setSelectedDiagramStepIdx] = useState<number>(0);

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

  useEffect(() => {
    setSelectedDiagramStepIdx(0);
  }, [currentSlide?.id]);

  const handleStepSlide = (delta: -1 | 1) => {
    if (filteredSlides.length === 0) return;
    const nextIdx = resolveSlideStepIndex(activeSlideIndex, filteredSlides.length, delta);
    setActiveSlideId(filteredSlides[nextIdx].id);
  };

  // Support Left / Right arrow keys when viewing the slide deck (unless focused inside an input)
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

  const activeDiagramStep =
    currentSlide?.diagramSteps[selectedDiagramStepIdx] ||
    currentSlide?.diagramSteps[0];

  return (
    <div
      data-testid="about-slides-view"
      className="flex flex-1 flex-col min-w-0 min-h-0 bg-background text-foreground lg:h-screen lg:max-h-screen lg:overflow-hidden"
    >
      {/* Top Workspace Header Bar */}
      <header className="border-b border-border bg-card px-5 py-2.5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-primary shrink-0">
              <BookOpen className="h-3.5 w-3.5" />
            </div>
            <h1 className="font-display text-sm font-semibold text-foreground whitespace-nowrap">
              5. About &amp; Interactive Architecture Slides
            </h1>
            <span className="hidden sm:inline text-border" aria-hidden="true">
              |
            </span>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-mono tabular-nums">
              <span>{totalProperties} properties</span>
              <span aria-hidden="true">·</span>
              <span>{totalChecks} checks</span>
              <span aria-hidden="true">·</span>
              <span>{totalPops} global Edge PoPs</span>
              <span aria-hidden="true">·</span>
              <span>Active site: {activeAppId}</span>
            </div>
          </div>

          {/* Right Controls: Search + Category Filter + Deck vs Storyboard Switch + Quick Launch */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search slides, journeys, internals…"
                aria-label="Search about slides"
                data-testid="about-search-input"
                className="h-7.5 w-48 sm:w-56 rounded-md border border-border bg-background pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div
              data-testid="about-display-mode-toggle"
              className="inline-flex h-7.5 items-center rounded-md border border-border bg-background p-0.5 text-xs"
            >
              <button
                type="button"
                onClick={() => setDisplayMode('deck')}
                data-testid="btn-about-mode-deck"
                className={`inline-flex h-6.5 items-center gap-1.5 rounded px-2.5 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  displayMode === 'deck'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Presentation className="h-3.5 w-3.5" />
                <span>Slide Deck</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('storyboard')}
                data-testid="btn-about-mode-storyboard"
                className={`inline-flex h-6.5 items-center gap-1.5 rounded px-2.5 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  displayMode === 'storyboard'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>All 6 Slides</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Category Filter Bar & 1-Click Quick-Jump User Journey Strip */}
        <div className="mt-2.5 pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div
            role="tablist"
            aria-label="Slide categories"
            className="inline-flex flex-wrap items-center gap-1 rounded-md border border-border bg-background p-0.5"
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
                  className={`h-6.5 rounded px-2.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
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

          {/* 1-Click Interactive Journey Jumpers */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground mr-1 hidden xl:inline">
              Quick Jump to Live Screens:
            </span>
            <button
              type="button"
              onClick={() => onNavigateCta({ targetView: 'synthetics' })}
              data-testid="about-jump-sites"
              className="inline-flex h-6.5 items-center gap-1 rounded border border-border bg-background px-2 text-[11px] font-medium text-foreground hover:bg-muted cursor-pointer whitespace-nowrap"
            >
              <Globe className="h-3 w-3 text-primary" />
              <span>1. Sites &amp; Canaries</span>
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
              className="inline-flex h-6.5 items-center gap-1 rounded border border-border bg-background px-2 text-[11px] font-medium text-foreground hover:bg-muted cursor-pointer whitespace-nowrap"
            >
              <Play className="h-3 w-3 text-primary" />
              <span>Single Run View</span>
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
              className="inline-flex h-6.5 items-center gap-1 rounded border border-border bg-background px-2 text-[11px] font-medium text-foreground hover:bg-muted cursor-pointer whitespace-nowrap"
            >
              <GitCompareArrows className="h-3 w-3 text-primary" />
              <span>2. Compare 2 Envs</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onNavigateCta({ targetView: 'config', setupTab: 'envs' })
              }
              data-testid="about-jump-configure"
              className="inline-flex h-6.5 items-center gap-1 rounded border border-border bg-background px-2 text-[11px] font-medium text-foreground hover:bg-muted cursor-pointer whitespace-nowrap"
            >
              <SlidersHorizontal className="h-3 w-3 text-primary" />
              <span>3. Configure</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateCta({ targetView: 'studio' })}
              data-testid="about-jump-automate"
              className="inline-flex h-6.5 items-center gap-1 rounded border border-border bg-background px-2 text-[11px] font-medium text-foreground hover:bg-muted cursor-pointer whitespace-nowrap"
            >
              <Terminal className="h-3 w-3 text-primary" />
              <span>4. Automate (MCP)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
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
        ) : displayMode === 'storyboard' ? (
          /* All 6 Slides Storyboard Grid View */
          <div
            data-testid="about-storyboard-grid"
            className="mx-auto max-w-[1400px] p-5 space-y-6"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredSlides.map((slide) => (
                <article
                  key={slide.id}
                  data-testid={`storyboard-card-${slide.number}`}
                  className="flex flex-col justify-between rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono tabular-nums">
                      <span>
                        Slide {slide.number} · {slide.categoryLabel}
                      </span>
                      <span>{slide.diagramSteps.length} stages</span>
                    </div>

                    <h2 className="font-display text-base font-semibold text-foreground leading-snug">
                      {slide.number}. {slide.title}
                    </h2>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {slide.executiveSummary}
                    </p>

                    <div className="pt-2 border-t border-border/60 space-y-1.5">
                      <div className="text-[11px] font-semibold text-foreground">
                        Pipeline &amp; Journey Flow:
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
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSlideId(slide.id);
                        setDisplayMode('deck');
                      }}
                      data-testid={`open-slide-deck-${slide.number}`}
                      className="inline-flex h-7.5 items-center gap-1 rounded border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
                    >
                      <span>Open Full Slide</span>
                    </button>
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
              ))}
            </div>
          </div>
        ) : (
          /* Interactive Presentation Slide Deck Mode */
          currentSlide && (
            <div className="mx-auto max-w-[1400px] p-5 grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-5 items-start">
              {/* Left Slide Chapter Navigator Rail */}
              <aside
                aria-label="Slide deck chapters"
                className="rounded-lg border border-border bg-card p-3 space-y-2"
              >
                <div className="flex items-center justify-between px-1.5 pb-1.5 border-b border-border/60 text-xs">
                  <span className="font-semibold text-foreground">
                    Presentation Slides
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                    {activeSlideIndex + 1} / {filteredSlides.length}
                  </span>
                </div>

                <div className="space-y-1">
                  {filteredSlides.map((slide, idx) => {
                    const isCurrent = slide.id === currentSlide.id;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setActiveSlideId(slide.id)}
                        data-testid={`slide-nav-btn-${slide.number}`}
                        className={`w-full rounded-md px-2.5 py-2 text-left transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted/70 text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                          <span
                            className={
                              isCurrent
                                ? 'text-primary-foreground/90 font-semibold'
                                : 'text-primary font-semibold'
                            }
                          >
                            Slide {slide.number}
                          </span>
                          <span
                            className={
                              isCurrent
                                ? 'text-primary-foreground/80'
                                : 'text-muted-foreground'
                            }
                          >
                            {idx + 1} of {filteredSlides.length}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs font-semibold leading-snug line-clamp-2">
                          {slide.title}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-border/60 px-1.5 text-[11px] text-muted-foreground">
                  Tip: Use <kbd className="font-mono text-foreground">←</kbd> and{' '}
                  <kbd className="font-mono text-foreground">→</kbd> arrow keys to step
                  through slides.
                </div>
              </aside>

              {/* Active Slide Canvas */}
              <section
                aria-label={`Slide ${currentSlide.number}: ${currentSlide.title}`}
                data-testid={`active-slide-${currentSlide.number}`}
                className="rounded-lg border border-border bg-card p-6 space-y-6 min-w-0"
              >
                {/* Slide Top Header & Prev / Next Step Controls */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-4">
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono tabular-nums">
                      <span className="font-semibold text-primary">
                        Slide {currentSlide.number} of{' '}
                        {String(ABOUT_SLIDES.length).padStart(2, '0')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{currentSlide.categoryLabel}</span>
                    </div>
                    <h2
                      data-testid="active-slide-title"
                      className="font-display text-xl sm:text-2xl font-semibold text-foreground tracking-tight"
                    >
                      {currentSlide.number}. {currentSlide.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {currentSlide.subtitle}
                    </p>
                  </div>

                  {/* Slide Deck Prev / Next Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStepSlide(-1)}
                      data-testid="btn-prev-slide"
                      aria-label="Previous slide"
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span>Prev</span>
                    </button>
                    <span
                      data-testid="slide-counter-indicator"
                      className="px-2 font-mono text-xs font-semibold text-foreground tabular-nums"
                    >
                      {activeSlideIndex + 1} / {filteredSlides.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStepSlide(1)}
                      data-testid="btn-next-slide"
                      aria-label="Next slide"
                      className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
                    >
                      <span>Next Slide</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Executive Summary & Key Takeaway Strip */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
                  <div className="rounded-md border border-border bg-background p-4 space-y-1.5">
                    <div className="text-xs font-semibold text-foreground">
                      How It Works in Plain Language
                    </div>
                    <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                      {currentSlide.executiveSummary}
                    </p>
                  </div>

                  <div className="rounded-md border border-primary/30 bg-primary/[0.04] p-4 space-y-1.5">
                    <div className="text-xs font-semibold text-primary">
                      Key Takeaway
                    </div>
                    <p className="text-xs sm:text-[13px] text-foreground leading-relaxed">
                      {currentSlide.keyTakeaway}
                    </p>
                  </div>
                </div>

                {/* Interactive 4-Stage Architecture / User Journey Diagram */}
                <div className="rounded-md border border-border bg-background p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                        {currentSlide.diagramTitle}
                      </h3>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Click any stage below to inspect its internal mechanism
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                    {currentSlide.diagramSteps.map((step, idx) => {
                      const isSelected = idx === selectedDiagramStepIdx;
                      return (
                        <button
                          key={`${currentSlide.id}-step-${step.stepNumber}`}
                          type="button"
                          onClick={() => setSelectedDiagramStepIdx(idx)}
                          data-testid={`diagram-step-${idx}`}
                          className={`flex flex-col justify-between rounded-md border p-3.5 text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'border-primary bg-primary/[0.06]'
                              : 'border-border bg-card hover:border-primary/40'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
                              <span className="font-bold text-primary">
                                {step.stepNumber}
                              </span>
                              <span className="text-muted-foreground">
                                {step.metricOrBadge}
                              </span>
                            </div>
                            <div className="text-xs sm:text-[13px] font-semibold text-foreground">
                              {step.title}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {step.subtitle}
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted-foreground leading-snug">
                            {step.technicalDetail}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Stage Inspector Callout */}
                  {activeDiagramStep && (
                    <div
                      data-testid="active-diagram-step-detail"
                      className="flex flex-wrap items-center justify-between gap-3 rounded border border-border/80 bg-card px-3.5 py-2.5 text-xs"
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

                {/* 3 Deep-Dive Pillar Cards (Internal Mechanics / User Journeys / Code Formulas) */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {currentSlide.highlights.map((card, idx) => (
                    <div
                      key={`${currentSlide.id}-hl-${idx}`}
                      className="flex flex-col justify-between rounded-md border border-border bg-background p-4 space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="font-mono text-[11px] font-semibold text-primary">
                          {card.kicker}
                        </div>
                        <h4 className="text-sm font-semibold text-foreground leading-snug">
                          {card.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {card.body}
                        </p>
                      </div>

                      {card.codeOrFormula && (
                        <div className="rounded border border-border/80 bg-card px-2.5 py-2 font-mono text-[11px] text-foreground overflow-x-auto">
                          {card.codeOrFormula}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Slide Footer Action Bar: Interactive Live Launchers */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                  <div className="text-xs text-muted-foreground">
                    <span>Ready to try this workflow?</span>{' '}
                    <span className="text-foreground font-medium">
                      {currentSlide.primaryCta.description}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentSlide.secondaryCta && (
                      <button
                        type="button"
                        onClick={() =>
                          currentSlide.secondaryCta &&
                          handleTriggerCta(currentSlide.secondaryCta)
                        }
                        data-testid="slide-secondary-cta"
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
                      >
                        <span>{currentSlide.secondaryCta.label}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleTriggerCta(currentSlide.primaryCta)}
                      data-testid="slide-primary-cta"
                      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3.5 text-xs font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
                    >
                      <span>{currentSlide.primaryCta.label}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )
        )}
      </div>
    </div>
  );
};
