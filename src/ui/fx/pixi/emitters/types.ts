export type UiFxEmitterFamily = 'mist' | 'dust' | 'sparks' | 'glints' | 'fireflies';

export type UiFxEmitterIntendedLayer = 'underlay' | 'hero' | 'overlay';

export type UiFxSpawnSpace = 'screen' | 'local' | 'ring' | 'edge' | 'area';

export type UiFxMotionProfile = 'still' | 'drift' | 'float' | 'burst' | 'flicker';

export type UiFxDensityTier = 'off' | 'low' | 'medium' | 'high';

export interface UiFxEmitterDescriptor {
  id: string;
  family: UiFxEmitterFamily;
  intendedLayer: UiFxEmitterIntendedLayer;
  spawnSpace: UiFxSpawnSpace;
  motionProfile: UiFxMotionProfile;
  suitableForReducedMotion: boolean;
  continuous: boolean;
  baseCount: number;
  countByQuality: Record<'low' | 'medium' | 'high', number>;
  lifetimeMs: { min: number; max: number };
  alpha: { start: number; end: number };
  speedPxPerSec: { min: number; max: number };
  sizePx: { min: number; max: number };
  spawnArea: {
    widthPct?: number;
    heightPct?: number;
    insetPct?: number;
    ringThicknessPct?: number;
    edge?: 'top' | 'bottom' | 'left' | 'right';
  };
  notes: string[];
}

export interface UiFxResolvedEmitterSpec {
  id: string;
  family: UiFxEmitterFamily;
  enabled: boolean;
  layer: UiFxEmitterIntendedLayer;
  spawnSpace: UiFxSpawnSpace;
  motionProfile: UiFxMotionProfile;
  count: number;
  lifetimeMs: { min: number; max: number };
  alpha: { start: number; end: number };
  speedPxPerSec: { min: number; max: number };
  sizePx: { min: number; max: number };
  spawnArea: UiFxEmitterDescriptor['spawnArea'];
  reasons: string[];
}

export interface UiFxEmitterResolveInput {
  descriptor: UiFxEmitterDescriptor;
  resolvedQuality: 'off' | 'low' | 'medium' | 'high';
  renderMode: 'off' | 'static' | 'full';
  reducedMotion: boolean;
  allowAtmosphere: boolean;
  allowHeroFx: boolean;
  countScale?: number;
}
