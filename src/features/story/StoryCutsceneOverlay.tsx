import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SaveService } from '../../services/save/SaveService.js';
import { useUIStore } from '../../stores/uiStore.js';
import { preloadStoryImages } from './storyAssets.js';
import { StoryCaption } from './StoryCaption.js';
import { StoryControls } from './StoryControls.js';
import { StorySlideRenderer } from './StorySlideRenderer.js';
import { selectActiveStoryCutscene, useStoryStore } from './storyStore.js';
import { StoryVfxLayer } from './StoryVfxLayer.js';
import type { StoryFxQuality, StorySlide, StoryTransitionPreset } from './storyTypes.js';
import './StoryCutscene.scss';

function getSystemReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
    .filter((element) => !element.hasAttribute('disabled') && element.offsetParent !== null);
}

export function StoryCutsceneOverlay() {
  const activeCutscene = useStoryStore(selectActiveStoryCutscene);
  const slideIndex = useStoryStore((state) => state.slideIndex);
  const isReplay = useStoryStore((state) => state.isReplay);
  const advanceSlide = useStoryStore((state) => state.advanceSlide);
  const skipCutscene = useStoryStore((state) => state.skipCutscene);
  const completeCutscene = useStoryStore((state) => state.completeCutscene);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const storyMotionMode = useUIStore((state) => state.settings.storyMotionMode);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const previousSlideRef = useRef<StorySlide | null>(null);
  const [canSkip, setCanSkip] = useState(false);
  const [canAdvance, setCanAdvance] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [systemReducedMotion, setSystemReducedMotion] = useState(getSystemReducedMotion);
  const [transition, setTransition] = useState<{
    fromSlide: StorySlide;
    preset: StoryTransitionPreset;
  } | null>(null);

  const reducedMotion = useMemo(() => {
    if (storyMotionMode === 'full') return systemReducedMotion;
    if (storyMotionMode === 'reduced' || storyMotionMode === 'off') return true;
    return systemReducedMotion;
  }, [storyMotionMode, systemReducedMotion]);

  const slide = activeCutscene?.slides[slideIndex] ?? null;
  const isFinalSlide = Boolean(activeCutscene && slideIndex === activeCutscene.slides.length - 1);
  const fxQuality = useMemo<StoryFxQuality>(() => {
    if (storyMotionMode === 'off') return 'off';
    if (reducedMotion) return 'reduced';
    if (storyMotionMode === 'full') return 'high';
    return 'medium';
  }, [reducedMotion, storyMotionMode]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSystemReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!activeCutscene) return undefined;
    void preloadStoryImages(activeCutscene.slides.map((entry) => entry.imageAssetId));
    previousSlideRef.current = null;
    setTransition(null);

    requestAnimationFrame(() => {
      rootRef.current?.focus();
    });

    return () => {
      previousSlideRef.current = null;
      setTransition(null);
    };
  }, [activeCutscene]);

  useEffect(() => {
    if (!slide) {
      previousSlideRef.current = null;
      setTransition(null);
      return undefined;
    }

    const previousSlide = previousSlideRef.current;
    previousSlideRef.current = slide;

    if (!previousSlide || previousSlide.id === slide.id) {
      return undefined;
    }

    setTransition({
      fromSlide: previousSlide,
      preset: previousSlide.transitionPreset,
    });

    const transitionTimer = window.setTimeout(() => {
      setTransition(null);
    }, Math.max(250, previousSlide.transitionOutMs));

    return () => window.clearTimeout(transitionTimer);
  }, [slide]);

  useEffect(() => {
    if (!slide) return undefined;
    setCanSkip(false);
    setCanAdvance(false);
    setIsCompleting(false);

    const timers: number[] = [];
    timers.push(window.setTimeout(() => setCanSkip(true), 500));
    timers.push(window.setTimeout(() => setCanAdvance(true), slide.minHoldMs));

    if (!isFinalSlide && slide.autoAdvanceMs) {
      timers.push(window.setTimeout(() => {
        if (document.hidden) return;
        advanceSlide();
      }, slide.autoAdvanceMs));
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [advanceSlide, isFinalSlide, slide]);

  const routeToPathSelection = useCallback((fromReplay: boolean) => {
    if (!fromReplay) {
      setActiveTab('cultivation');
      SaveService.save();
    }
  }, [setActiveTab]);

  const handleSkip = useCallback(() => {
    if (!canSkip) return;
    const replay = isReplay;
    skipCutscene();
    routeToPathSelection(replay);
  }, [canSkip, isReplay, routeToPathSelection, skipCutscene]);

  const handleNext = useCallback(() => {
    if (!canAdvance || isFinalSlide) return;
    advanceSlide();
  }, [advanceSlide, canAdvance, isFinalSlide]);

  const handleFinalObjective = useCallback(() => {
    if (!canAdvance || !activeCutscene) return;
    const replay = isReplay;
    setIsCompleting(true);
    window.setTimeout(() => {
      completeCutscene();
      routeToPathSelection(replay);
    }, 350);
  }, [activeCutscene, canAdvance, completeCutscene, isReplay, routeToPathSelection]);

  useEffect(() => {
    if (!activeCutscene) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleSkip();
        return;
      }

      if ((event.key === 'Enter' || event.key === ' ') && canAdvance) {
        const target = event.target as HTMLElement | null;
        if (target?.tagName === 'BUTTON') return;
        event.preventDefault();
        if (isFinalSlide) {
          handleFinalObjective();
        } else {
          handleNext();
        }
        return;
      }

      if (event.key === 'Tab' && rootRef.current) {
        const focusable = getFocusableElements(rootRef.current);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeCutscene, canAdvance, handleFinalObjective, handleNext, handleSkip, isFinalSlide]);

  useEffect(() => {
    if (!canAdvance || !isFinalSlide || !rootRef.current) return;
    const objective = rootRef.current.querySelector<HTMLButtonElement>('.storyControls__objective');
    objective?.focus();
  }, [canAdvance, isFinalSlide]);

  if (!activeCutscene || !slide) return null;

  return (
    <div
      ref={rootRef}
      className={`storyCutsceneOverlay${isCompleting ? ' storyCutsceneOverlay--completing' : ''}${reducedMotion ? ' storyCutsceneOverlay--reducedMotion' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Opening story"
      tabIndex={-1}
      data-cutscene-id={activeCutscene.id}
      data-slide-id={slide.id}
      data-story-motion={storyMotionMode}
    >
      <div className={`storySlideStack${transition ? ` storySlideStack--${transition.preset}` : ''}`}>
        {transition ? (
          <StorySlideRenderer
            slide={transition.fromSlide}
            phase="outgoing"
            transitionPreset={transition.preset}
          />
        ) : null}
        <StorySlideRenderer
          slide={slide}
          phase={transition ? 'incoming' : 'active'}
          transitionPreset={transition?.preset}
        />
      </div>
      <StoryVfxLayer
        preset={isCompleting ? 'daoSelectionReveal' : slide.fxPreset}
        quality={fxQuality}
        transitionActive={Boolean(transition) || isCompleting}
        reducedMotion={reducedMotion}
      />
      <StoryCaption caption={slide.captionDefault} hidden={isCompleting} />
      <StoryControls
        canSkip={canSkip}
        canAdvance={canAdvance}
        isFinalSlide={isFinalSlide}
        finalLabel={activeCutscene.finalObjective.label}
        onNext={handleNext}
        onSkip={handleSkip}
        onFinalObjective={handleFinalObjective}
      />
      <div className="storyCutsceneOverlay__progress" aria-hidden>
        {activeCutscene.slides.map((entry, index) => (
          <span key={entry.id} className={index === slideIndex ? 'storyCutsceneOverlay__dot storyCutsceneOverlay__dot--active' : 'storyCutsceneOverlay__dot'} />
        ))}
      </div>
    </div>
  );
}
