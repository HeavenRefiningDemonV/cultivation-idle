import type { FxEffectiveQuality } from '../fx/types.js';

export interface BuildOutskirtsFxProfileArgs {
  effectiveQuality: FxEffectiveQuality;
  prefersReducedMotion: boolean;
  isCombatActive: boolean;
  isBossReady: boolean;
  cityId: string;
}

export interface OutskirtsFxProfile {
  quality: FxEffectiveQuality;
  animateContinuously: boolean;
  hazeOpacity: number;
  moteCount: number;
  leafCount: number;
  glintCount: number;
  families: {
    ambientHaze: true;
    dustDrift: boolean;
    leafAccent: boolean;
    panelGlint: boolean;
    ritualGlow: false;
    ruinFog: false;
    gateAura: false;
  };
}

function resolveLeafBias(cityId: string) {
  return cityId.includes('pinewind') || cityId.includes('lotusford');
}

export function buildOutskirtsFxProfile(args: BuildOutskirtsFxProfileArgs): OutskirtsFxProfile {
  if (args.prefersReducedMotion || args.effectiveQuality === 'reducedMotion') {
    return {
      quality: 'reducedMotion',
      animateContinuously: false,
      hazeOpacity: args.isCombatActive ? 0.14 : 0.11,
      moteCount: 0,
      leafCount: 0,
      glintCount: 0,
      families: {
        ambientHaze: true,
        dustDrift: false,
        leafAccent: false,
        panelGlint: false,
        ritualGlow: false,
        ruinFog: false,
        gateAura: false,
      },
    };
  }

  const leafBias = resolveLeafBias(args.cityId);
  if (args.effectiveQuality === 'high') {
    return {
      quality: 'high',
      animateContinuously: true,
      hazeOpacity: args.isCombatActive ? 0.24 : 0.2,
      moteCount: 6,
      leafCount: leafBias ? 2 : 0,
      glintCount: args.isCombatActive || args.isBossReady ? 1 : 0,
      families: {
        ambientHaze: true,
        dustDrift: true,
        leafAccent: leafBias,
        panelGlint: args.isCombatActive || args.isBossReady,
        ritualGlow: false,
        ruinFog: false,
        gateAura: false,
      },
    };
  }

  if (args.effectiveQuality === 'medium') {
    return {
      quality: 'medium',
      animateContinuously: true,
      hazeOpacity: args.isCombatActive ? 0.19 : 0.16,
      moteCount: 3,
      leafCount: leafBias ? 1 : 0,
      glintCount: args.isBossReady ? 1 : 0,
      families: {
        ambientHaze: true,
        dustDrift: true,
        leafAccent: leafBias,
        panelGlint: args.isBossReady,
        ritualGlow: false,
        ruinFog: false,
        gateAura: false,
      },
    };
  }

  return {
    quality: 'low',
    animateContinuously: false,
    hazeOpacity: args.isCombatActive ? 0.14 : 0.12,
    moteCount: 1,
    leafCount: 0,
    glintCount: 0,
    families: {
      ambientHaze: true,
      dustDrift: true,
      leafAccent: false,
      panelGlint: false,
      ritualGlow: false,
      ruinFog: false,
      gateAura: false,
    },
  };
}
