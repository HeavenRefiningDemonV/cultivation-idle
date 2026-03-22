import type { ConsumableSpec } from '../../systems/consumables/consumableCatalog.js';
import type { IconId } from '../../ui/icons.js';

export type MetaChip = {
  key: string;
  iconId: IconId;
  text?: string;
  tooltip: string;
};

export type PotionMetaChipArgs = {
  itemId: string;
  usage: 'combat' | 'cultivation' | 'both';
  stackSize?: number;
  spec?: ConsumableSpec | null;
  charges?: number;
  remainingCooldownMs?: number;
};

type EffectKind = 'healing' | 'shield' | 'ki' | 'cleanse' | 'fallback';

type EffectChipConfig = {
  iconId: IconId;
  label?: string;
  tooltip: string;
};

const usageChipMap: Record<PotionMetaChipArgs['usage'], Omit<MetaChip, 'key'>> = {
  combat: { iconId: 'jadeSword', tooltip: 'Combat usable' },
  cultivation: { iconId: 'inkSwirl', tooltip: 'Cultivation usable' },
  both: { iconId: 'inkSparkles', tooltip: 'Usable in combat & cultivation' },
};

const effectIconMap: Record<EffectKind, IconId> = {
  healing: 'inkHeart',
  shield: 'inkShield',
  ki: 'inkBolt',
  cleanse: 'dustBlue',
  fallback: 'herbBundle',
};

const recommendedSlotMap: Record<'healing' | 'utility' | 'specialty', Omit<MetaChip, 'key'>> = {
  healing: { iconId: 'inkHeart', tooltip: 'Recommended slot: Healing' },
  utility: { iconId: 'inkSwirl', tooltip: 'Recommended slot: Utility' },
  specialty: { iconId: 'inkSparkles', tooltip: 'Recommended slot: Specialty' },
};

function inferEffectKind(spec: ConsumableSpec): EffectKind {
  switch (spec.effect.kind) {
    case 'healPct':
      return 'healing';
    case 'shieldPct':
      return 'shield';
    case 'restoreQiPct':
      return 'ki';
    case 'restoreIntentPct':
      return 'cleanse';
    default:
      return 'fallback';
  }
}

function buildEffectChip(itemId: string, spec?: ConsumableSpec | null): EffectChipConfig {
  if (!spec) {
    const fallbackLabel = itemId
      .replace(/^cons_/, '')
      .replace(/_/g, ' ')
      .trim();
    return {
      iconId: effectIconMap.fallback,
      label: fallbackLabel || undefined,
      tooltip: 'Consumable (details in description)',
    };
  }

  const effectKind = inferEffectKind(spec);
  const tooltip = spec.longLabel ?? spec.shortLabel;

  return {
    iconId: effectIconMap[effectKind] ?? effectIconMap.fallback,
    label: spec.shortLabel,
    tooltip,
  };
}

function formatRemainingCooldown(remainingCooldownMs: number): string {
  if (remainingCooldownMs <= 0) {
    return 'Ready';
  }

  return `${Math.ceil(remainingCooldownMs / 1000)}s`;
}

export function buildPotionMetaChips({
  itemId,
  usage,
  stackSize,
  spec,
  charges,
  remainingCooldownMs,
}: PotionMetaChipArgs): MetaChip[] {
  const chips: MetaChip[] = [];

  const usageChip = usageChipMap[usage];
  chips.push({ key: 'usage', ...usageChip });

  const effectChip = buildEffectChip(itemId, spec);
  chips.push({
    key: 'effect',
    iconId: effectChip.iconId,
    text: effectChip.label,
    tooltip: effectChip.tooltip,
  });

  const cooldownSec = spec?.cooldownSec ?? 0;
  if (cooldownSec > 0 || typeof remainingCooldownMs === 'number') {
    const hasRemaining = typeof remainingCooldownMs === 'number';
    const cooldownText = hasRemaining
      ? formatRemainingCooldown(remainingCooldownMs)
      : `${cooldownSec}s`;
    const cooldownTooltip = hasRemaining
      ? `Remaining cooldown: ${formatRemainingCooldown(remainingCooldownMs)}`
      : `Cooldown between uses: ${cooldownSec}s`;

    chips.push({
      key: 'cooldown',
      iconId: 'hourglassProgress',
      text: cooldownText,
      tooltip: cooldownTooltip,
    });
  }

  if (typeof charges === 'number') {
    chips.push({
      key: 'charges',
      iconId: 'artifactBundle',
      text: `${charges}`,
      tooltip: 'Charges in inventory',
    });
  } else if (typeof stackSize === 'number' && stackSize > 1) {
    chips.push({
      key: 'stack',
      iconId: 'artifactBundle',
      text: `x${stackSize}`,
      tooltip: `Max stack size: ${stackSize}`,
    });
  }

  if (spec?.recommendedSlot) {
    const recommendedChip = recommendedSlotMap[spec.recommendedSlot];
    if (recommendedChip) {
      chips.push({ key: 'recommended', ...recommendedChip });
    }
  }

  return chips;
}
