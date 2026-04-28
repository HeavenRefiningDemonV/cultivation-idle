import type { AiProfile } from '../../../types/index.js';
import type {
  OutskirtsCombatStageChip,
  OutskirtsSurfaceValueSource,
} from './types.js';

export interface OutskirtsCombatChipsInput {
  aiProfileLabel: string;
  autoUseEnabled: boolean;
  isBossFight: boolean;
  killsToBoss: number;
  killsSinceBoss: number;
  activeTechniques: Array<{
    id: string;
    name: string;
    readyAt: number | null;
  }>;
  now: number;
  source?: OutskirtsSurfaceValueSource;
}

const AI_PROFILE_LABELS: Readonly<Record<AiProfile, string>> = Object.freeze({
  balanced: 'Balanced',
  survivor: 'Survivor',
  burst: 'Burst',
  farmer: 'Farmer',
});

function normalizeCombatChipId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function toSafeRemainingMs(readyAt: number | null, now: number): number {
  if (readyAt === null) return 0;
  if (!Number.isFinite(readyAt) || !Number.isFinite(now)) return 0;
  return Math.max(0, readyAt - now);
}

function toAiProfileLabel(value: string): string {
  const normalized = value.trim().toLowerCase() as AiProfile;
  if (normalized in AI_PROFILE_LABELS) return AI_PROFILE_LABELS[normalized];
  if (value.trim().length === 0) return 'Balanced';
  return value[0].toUpperCase() + value.slice(1).toLowerCase();
}

export function formatOutskirtsTechniqueCooldownChipLabel(
  name: string,
  readyAt: number | null,
  now: number,
): { label: string; tone: OutskirtsCombatStageChip['tone'] } {
  const remainingMs = toSafeRemainingMs(readyAt, now);
  if (readyAt === null || remainingMs <= 0) {
    return { label: `${name} Ready`, tone: 'ready' };
  }
  const remainingSeconds = remainingMs / 1000;
  const formatted = remainingSeconds < 10
    ? `${remainingSeconds.toFixed(1)}s`
    : `${Math.round(remainingSeconds)}s`;
  return { label: `${name} ${formatted}`, tone: 'cooldown' };
}

export function formatOutskirtsBossChipLabel(
  killsToBoss: number,
  killsSinceBoss: number,
  isBossFight: boolean,
): { label: string; tone: OutskirtsCombatStageChip['tone'] } {
  if (isBossFight) return { label: 'Boss fight', tone: 'warning' };
  const remaining = Math.max(0, Math.round(killsToBoss) - Math.round(killsSinceBoss));
  return { label: `Boss in ${remaining}`, tone: 'neutral' };
}

export function buildOutskirtsCombatStageChips(
  input: OutskirtsCombatChipsInput,
): OutskirtsCombatStageChip[] {
  const source = input.source ?? 'live';
  const aiProfileLabel = toAiProfileLabel(input.aiProfileLabel);
  const chips: OutskirtsCombatStageChip[] = [
    { id: 'ai-profile', label: `AI: ${aiProfileLabel}`, tone: 'neutral', source },
    { id: 'auto-use', label: input.autoUseEnabled ? 'Auto-use On' : 'Auto-use Off', tone: input.autoUseEnabled ? 'ready' : 'warning', source },
    (() => {
      const boss = formatOutskirtsBossChipLabel(input.killsToBoss, input.killsSinceBoss, input.isBossFight);
      return {
        id: 'boss-countdown',
        label: boss.label,
        tone: boss.tone,
        source: source === 'manifest' ? 'manifest' : 'derived',
      };
    })(),
  ];

  const techniqueSource: OutskirtsSurfaceValueSource = source === 'manifest' ? 'manifest' : 'live';
  for (const entry of input.activeTechniques) {
    if (chips.length >= 5) break;
    const techId = normalizeCombatChipId(entry.id);
    const techName = entry.name.trim();
    if (!techId || !techName) continue;
    const formatted = formatOutskirtsTechniqueCooldownChipLabel(techName, entry.readyAt, input.now);
    chips.push({
      id: `${formatted.tone === 'ready' ? 'tech-ready' : 'tech-cooldown'}-${techId}`,
      label: formatted.label,
      tone: formatted.tone,
      source: techniqueSource,
    });
  }

  return chips.slice(0, 5);
}
