import type { HeartLawDef } from '../../content/index.js';
import { getHeartLawUnlockInfo, type HeartLawUnlockInfo } from '../heartLaw/heartLawUnlockInfo.js';
import { getHeartLawProfile } from './heartLawCatalog.js';
import { evaluateSpiritRootResonance, type ResonanceTier } from './spiritRootResonance.js';
import type { SpiritRoot } from '../../types/index.js';
import type { HeartLawProfile } from './heartLawTypes.js';

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
}

const RESONANCE_LABELS: Readonly<Record<ResonanceTier, { label: string; detail: string }>> = Object.freeze({
  strong: Object.freeze({ label: 'Strong (+12%)', detail: 'High spirit-root harmony.' }),
  partial: Object.freeze({ label: 'Partial (+6%)', detail: 'Some spirit-root support.' }),
  neutral: Object.freeze({ label: 'Neutral', detail: 'No resonance bonus needed.' }),
  mismatch: Object.freeze({ label: 'Weak (minor penalty)', detail: 'Usable, but less aligned.' }),
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
  if (unlockInfo.kind === 'starter') return 'Starter';
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

  return {
    id: law.id,
    label: law.name,
    familyLabel: titleCase(input.profile?.family ?? 'unknown'),
    archetypeLabel: input.profile?.archetype ? titleCase(input.profile.archetype) : null,
    tierLabel: toTierLabel(law.tier),
    statusLabel: status.label,
    statusTone: status.tone,
    unlockLine: toUnlockLine(input.unlockInfo),
    resonanceLabel: RESONANCE_LABELS[input.resonanceTier].label,
    resonanceTone: input.resonanceTier,
    resonanceDetail: RESONANCE_LABELS[input.resonanceTier].detail,
    tagLabels: resolveTagLabels(law, input.profile),
    isLocked: !input.isUnlocked,
    isStarter: input.unlockInfo.kind === 'starter',
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
