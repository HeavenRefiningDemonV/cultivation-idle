import type { RuinsSupportExitHint } from './buildRuinsSupportContextSurface.js';

export interface BuildRuinsAcceptanceAuditArgs {
  ruinName: string;
  roomCountLine: string;
  roleTag: string;
  bestUsedWhen: string;
  anchorLine: string;
  leadMaterialsLine: string;
  rarePityLine: string;
  trackedBountyVisible: boolean;
  primaryExitHint: RuinsSupportExitHint | null;
}

export interface RuinsAcceptanceAudit {
  passed: boolean;
  blockers: string[];
  checklist: {
    roleClarity: boolean;
    cityIdentityVisible: boolean;
    deterministicTrioVisible: boolean;
    supportSecondary: boolean;
  };
}

function includesToken(value: string, token: string): boolean {
  return value.toLowerCase().includes(token.toLowerCase());
}

export function buildRuinsAcceptanceAudit(args: BuildRuinsAcceptanceAuditArgs): RuinsAcceptanceAudit {
  const roleClarity = includesToken(args.roleTag, 'targeted')
    && includesToken(args.bestUsedWhen, 'targeted local materials')
    && includesToken(args.bestUsedWhen, 'deterministic');

  const cityIdentityVisible = args.ruinName.trim().length > 0
    && includesToken(args.roomCountLine, 'Rooms');

  const deterministicTrioVisible = includesToken(args.anchorLine, 'Guaranteed anchor')
    && includesToken(args.leadMaterialsLine, 'Lead materials')
    && includesToken(args.rarePityLine, 'Rare pity');

  const supportSecondary = (args.primaryExitHint == null
    || args.primaryExitHint.label.toLowerCase() !== 'deterministic value preview')
    && (args.trackedBountyVisible ? deterministicTrioVisible : true);

  const blockers: string[] = [];
  if (!roleClarity) blockers.push('Role clarity is missing targeted deterministic support truth.');
  if (!cityIdentityVisible) blockers.push('City-specific ruin identity is not visible.');
  if (!deterministicTrioVisible) blockers.push('Deterministic trio is not fully visible.');
  if (!supportSecondary) blockers.push('Support hint appears to override deterministic identity.');

  return {
    passed: blockers.length === 0,
    blockers,
    checklist: {
      roleClarity,
      cityIdentityVisible,
      deterministicTrioVisible,
      supportSecondary,
    },
  };
}
