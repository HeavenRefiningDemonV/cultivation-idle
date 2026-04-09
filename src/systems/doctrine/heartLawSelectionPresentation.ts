import type { HeartLawDef } from '../../content/index.js';
import { getHeartLawUnlockInfo, type HeartLawUnlockInfo } from '../heartLaw/heartLawUnlockInfo.js';
import { getHeartLawProfile } from './heartLawCatalog.js';
import { evaluateSpiritRootResonance, type ResonanceTier } from './spiritRootResonance.js';
import type { SpiritRoot } from '../../types/index.js';
import type { HeartLawFamily, HeartLawProfile } from './heartLawTypes.js';

export type HeartLawSelectionStatusTone = 'selected' | 'available' | 'locked';

export interface HeartLawSelectionPresentation {
  id: string;
  label: string;
  familyLabel: string;
  archetypeLabel: string | null;
  tierLabel: string;
  statusLabel: string;
  statusTone: HeartLawSelectionStatusTone;
  unlockLine: string;
  resonanceLabel: string;
  resonanceTone: ResonanceTier;
  resonanceDetail: string;
  tagLabels: readonly string[];
  isLocked: boolean;
  isStarter: boolean;
  doctrineSubtitle: string;
  roleLine: string;
  fantasyDescription: string;
  practicalDescription: string;
  signatureSummary: string;
  keyBenefits: readonly string[];
  ctaLabel: string;
  ctaDisabledReason: string | null;
  previewFamilyTone: HeartLawFamily | 'unknown';
}

const RESONANCE_LABELS: Readonly<Record<ResonanceTier, { label: string; detail: string }>> = Object.freeze({
  strong: Object.freeze({ label: 'Strong (+12%)', detail: 'High spirit-root harmony.' }),
  partial: Object.freeze({ label: 'Partial (+6%)', detail: 'Some spirit-root support.' }),
  neutral: Object.freeze({ label: 'Neutral', detail: 'No resonance bonus needed.' }),
  mismatch: Object.freeze({ label: 'Weak (minor penalty)', detail: 'Usable, but less aligned.' }),
});

const FAMILY_COPY: Readonly<Record<HeartLawFamily, { subtitle: string; roleLine: string; fantasy: string; practical: string }>> = Object.freeze({
  circulation: Object.freeze({
    subtitle: 'Breath-circulation scripture.',
    roleLine: 'Role: Smooth cadence and flow control.',
    fantasy: 'A doctrine of turning tides and unbroken inner rhythm.',
    practical: 'Best when you want smooth cultivation flow and consistent momentum.',
  }),
  stability: Object.freeze({
    subtitle: 'Stability scripture.',
    roleLine: 'Role: Defensive discipline and risk control.',
    fantasy: 'A grounded codex that tempers the heart into still stone.',
    practical: 'Best for steady, durable lives that avoid collapse under pressure.',
  }),
  insight: Object.freeze({
    subtitle: 'Insight scripture.',
    roleLine: 'Role: Precision setup and timing clarity.',
    fantasy: 'A lantern doctrine that sharpens perception through quiet focus.',
    practical: 'Best for knowledge-forward lives that value precision and timing.',
  }),
  endurance: Object.freeze({
    subtitle: 'Endurance scripture.',
    roleLine: 'Role: Long-fight composure and sustain.',
    fantasy: 'A deep reservoir path that survives the long trial.',
    practical: 'Best when you favor survivability, composure, and long engagements.',
  }),
  burst: Object.freeze({
    subtitle: 'Burst scripture.',
    roleLine: 'Role: Decisive windows and pressure spikes.',
    fantasy: 'A fierce manual that condenses intent into sudden decisive release.',
    practical: 'Best for aggressive lives that seek sharp windows of advantage.',
  }),
  breakthrough: Object.freeze({
    subtitle: 'Breakthrough scripture.',
    roleLine: 'Role: Milestone pushes and peak transitions.',
    fantasy: 'A threshold doctrine that gathers force for realm-defining leaps.',
    practical: 'Best when you want peak pushes and strong milestone transitions.',
  }),
});

const EFFECT_LABELS: Readonly<Record<string, string>> = Object.freeze({
  cultivation_rate: 'Cultivation rhythm',
  combat_damage: 'Combat pressure',
  offline_efficiency: 'Offline gain',
  stability_cost: 'Stability control',
  profession_yield: 'Profession yield',
  profession_speed: 'Profession speed',
});

function titleCase(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toTierLabel(tier: string | undefined): string {
  if (!tier || tier === 'starter') return 'Starter';
  if (tier.startsWith('tier')) return `Tier ${tier.replace('tier', '')}`;
  return titleCase(tier);
}

function toUnlockLine(unlockInfo: HeartLawUnlockInfo): string {
  if (unlockInfo.kind === 'starter') return 'Starter Heart Law';
  if (unlockInfo.kind === 'prestige') return `Unlock: ${unlockInfo.upgradeName} (${unlockInfo.apCost} AP)`;
  return 'Unlock via Prestige';
}

function resolveStatus(isSelected: boolean, isLocked: boolean): { label: string; tone: HeartLawSelectionStatusTone } {
  if (isLocked) return { label: 'Locked', tone: 'locked' };
  if (isSelected) return { label: 'Chosen', tone: 'selected' };
  return { label: 'Available', tone: 'available' };
}

function resolveTagLabels(law: HeartLawDef, profile: HeartLawProfile | null): readonly string[] {
  const tags = (profile?.daoTags ?? law.daoTags ?? []).slice(0, 3).map((tag) => titleCase(tag));
  return Object.freeze(tags);
}

function summarizeSignature(profile: HeartLawProfile | null): { signatureSummary: string; keyBenefits: readonly string[] } {
  if (!profile) {
    return {
      signatureSummary: 'A doctrine-ready scripture with balanced foundational benefit.',
      keyBenefits: Object.freeze(['Steady doctrine support']),
    };
  }

  const signatureLines = profile.signatureEffects
    .filter((effect) => typeof effect.value === 'number')
    .map((effect) => {
      const label = EFFECT_LABELS[effect.normalizedKey] ?? titleCase(effect.normalizedKey);
      const value = typeof effect.value === 'number' ? Math.round(effect.value * 100) : 0;
      return `${label} ${value >= 0 ? '+' : ''}${value}%`;
    })
    .slice(0, 3);

  if (signatureLines.length === 0) {
    return {
      signatureSummary: 'Signature reinforces doctrine rhythm without excess complexity.',
      keyBenefits: Object.freeze(['Doctrine-focused signature']),
    };
  }

  return {
    signatureSummary: signatureLines[0],
    keyBenefits: Object.freeze(signatureLines.slice(0, 3)),
  };
}

function resolveCta(params: { isLocked: boolean; isSelected: boolean; label: string; unlockLine: string }): { label: string; reason: string | null } {
  if (params.isLocked) {
    return { label: 'Locked Scripture', reason: params.unlockLine };
  }

  if (params.isSelected) {
    return { label: 'Chosen for This Life', reason: null };
  }

  return { label: `Choose ${params.label}`, reason: null };
}

export function buildHeartLawSelectionPresentation(
  law: HeartLawDef,
  input: {
    profile: HeartLawProfile | null;
    unlockInfo: HeartLawUnlockInfo;
    resonanceTier: ResonanceTier;
    isUnlocked: boolean;
    isSelected: boolean;
  },
): HeartLawSelectionPresentation {
  const status = resolveStatus(input.isSelected, !input.isUnlocked);
  const familyTone = input.profile?.family ?? 'unknown';
  const familyCopy = input.profile ? FAMILY_COPY[input.profile.family] : null;
  const unlockLine = toUnlockLine(input.unlockInfo);
  const signature = summarizeSignature(input.profile);
  const cta = resolveCta({ isLocked: !input.isUnlocked, isSelected: input.isSelected, label: law.name, unlockLine });

  return {
    id: law.id,
    label: law.name,
    familyLabel: titleCase(input.profile?.family ?? 'unknown'),
    archetypeLabel: input.profile?.archetype ? titleCase(input.profile.archetype) : null,
    tierLabel: toTierLabel(law.tier),
    statusLabel: status.label,
    statusTone: status.tone,
    unlockLine,
    resonanceLabel: RESONANCE_LABELS[input.resonanceTier].label,
    resonanceTone: input.resonanceTier,
    resonanceDetail: RESONANCE_LABELS[input.resonanceTier].detail,
    tagLabels: resolveTagLabels(law, input.profile),
    isLocked: !input.isUnlocked,
    isStarter: input.unlockInfo.kind === 'starter',
    doctrineSubtitle: familyCopy?.subtitle ?? 'Doctrine scripture.',
    roleLine: familyCopy?.roleLine ?? 'Role: Foundational doctrine support.',
    fantasyDescription: familyCopy?.fantasy ?? 'A scripture carried through quiet inner discipline.',
    practicalDescription: familyCopy?.practical ?? 'Best for reliable doctrine development in early lives.',
    signatureSummary: signature.signatureSummary,
    keyBenefits: signature.keyBenefits,
    ctaLabel: cta.label,
    ctaDisabledReason: cta.reason,
    previewFamilyTone: familyTone,
  };
}

export function getHeartLawSelectionPresentation(
  law: HeartLawDef,
  options: {
    spiritRoot: SpiritRoot | null;
    isUnlocked: boolean;
    isSelected: boolean;
  },
): HeartLawSelectionPresentation {
  const profile = getHeartLawProfile(law.id);
  const resonance = evaluateSpiritRootResonance(options.spiritRoot, profile);
  const unlockInfo = getHeartLawUnlockInfo(law.tier);

  return buildHeartLawSelectionPresentation(law, {
    profile,
    unlockInfo,
    resonanceTier: resonance.tier,
    isUnlocked: options.isUnlocked,
    isSelected: options.isSelected,
  });
}

export function mapResonanceTierToCardLabel(tier: ResonanceTier): string {
  return RESONANCE_LABELS[tier].label;
}
