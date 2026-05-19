import { useEffect, useState } from 'react';
import { resolveStoryImageAsset } from './storyAssets.js';
import type { StorySlide, StoryTransitionPreset } from './storyTypes.js';

type StorySlidePhase = 'active' | 'incoming' | 'outgoing';

type StorySlideRendererProps = {
  slide: StorySlide;
  phase?: StorySlidePhase;
  transitionPreset?: StoryTransitionPreset;
};

export function StorySlideRenderer({ slide, phase = 'active', transitionPreset }: StorySlideRendererProps) {
  const asset = resolveStoryImageAsset(slide.imageAssetId);
  const [src, setSrc] = useState(asset.src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(asset.src);
    setFailed(false);
  }, [asset.src]);

  const className = [
    'storySlide',
    `storySlide--${slide.id}`,
    `storySlide--${phase}`,
    transitionPreset ? `storySlide--transition-${transitionPreset}` : '',
  ].filter(Boolean).join(' ');

  if (failed) {
    return (
      <div className={`${className} storySlide--fallback`}>
        <div className="storySlide__fallbackPaper" aria-hidden />
      </div>
    );
  }

  return (
    <div className={className} data-story-slide-phase={phase}>
      <img
        key={src}
        className="storySlide__image"
        src={src}
        alt=""
        width={asset.width}
        height={asset.height}
        decoding="async"
        loading="eager"
        draggable={false}
        onLoad={(event) => {
          if (!import.meta.env.DEV || typeof window === 'undefined') return;
          const image = event.currentTarget;
          const renderedWidth = image.getBoundingClientRect().width;
          const scaleBudget = renderedWidth * (window.devicePixelRatio || 1) * 0.75;
          if (image.naturalWidth < scaleBudget) {
            console.warn('[Story] S00 image may be upscaled beyond ideal crispness', {
              assetId: asset.id,
              sourcePath: asset.sourcePath,
              naturalWidth: image.naturalWidth,
              renderedWidth,
              devicePixelRatio: window.devicePixelRatio || 1,
            });
          }
        }}
        onError={() => {
          if (asset.fallbackSrc && src !== asset.fallbackSrc) {
            setSrc(asset.fallbackSrc);
            return;
          }
          setFailed(true);
        }}
      />
      <div className="storySlide__lowerGradient" aria-hidden />
      <div className="storySlide__edgeVignette" aria-hidden />
      <div className="storySlide__staticTexture" aria-hidden />
    </div>
  );
}
