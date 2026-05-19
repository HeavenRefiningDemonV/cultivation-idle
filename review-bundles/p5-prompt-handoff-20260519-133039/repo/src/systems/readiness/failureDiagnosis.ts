import type { TrialAttemptSummary } from '../../types/index.js';
import type { BuildAnalysis, BuildGapCode } from '../builds/buildAnalysisTypes.js';
import type {
  GateReadinessResult,
  ReadinessSeverity,
  ReadinessShortfall,
  ReadinessShortfallCode,
} from './readinessScoringTypes.js';
import type {
  FailureDiagnosis,
  FailureDiagnosisCode,
  FailureFix,
  TrialFailureDiagnosisInput,
} from './failureDiagnosisTypes.js';
import { GATE_SUPPORT_LABELS } from '../../ui/text/playerFacingLabels.js';
import { READINESS_CLOSE_CALL_POLICY } from '../balance/readinessOutcomeTargets.js';

type TrialAttemptSummaryTelemetry = TrialAttemptSummary & {
  timeToDieSec?: number | null;
  spikeRatio?: number | null;
  shieldPhaseSeen?: boolean | null;
  auraPressureSeen?: boolean | null;
  ultimatePressureSeen?: boolean | null;
  damageReductionPressureSeen?: boolean | null;
  vulnerabilityWindowSeen?: boolean | null;
  soulDrainPressureSeen?: boolean | null;
  rollingPlayerDps?: number | null;
  rollingEnemyDps?: number | null;
};

const DEFAULT_REASON = 'Review the current build, forge floor, and prep posture before retrying.';
const DEFAULT_FIX: FailureFix = {
  code: 'review_build',
  destination: 'techniques',
  reason: 'Review the current build before retrying this gate.',
};

const BUILT_REASON_BY_CODE: Partial<Record<ReadinessShortfallCode, string>> = {
  build_slots: 'Unlocked technique slots are still empty.',
  build_alignment: 'Selected-path alignment is still below the gate floor.',
  build_mastery: 'Technique mastery is still below the gate floor.',
  build_rank: 'Technique rank investment is still below the gate floor.',
  build_runes: 'Applied technique runes are still below the gate floor.',
};

const PREP_REASON_BY_CODE: Partial<Record<ReadinessShortfallCode, string>> = {
  economic_shortfall: 'Prep shortfalls remain in consumables, reserves, or forge routing.',
  posture_ai: 'Current AI posture is unstable for this gate.',
  posture_casting: 'Current casting policy is unstable for this gate.',
  posture_pouch: 'Medicine pouch setup is unstable for this gate.',
};

const FIX_BY_SHORTFALL_CODE: Partial<Record<ReadinessShortfallCode, FailureFix>> = {
  build_slots: {
    code: 'fill_slots',
    destination: 'techniques',
    reason: 'Fill unlocked technique slots before retrying this gate.',
  },
  build_alignment: {
    code: 'raise_alignment',
    destination: 'techniques',
    reason: 'Swap in stronger same-path techniques to raise path alignment.',
  },
  build_mastery: {
    code: 'raise_mastery',
    destination: 'techniques',
    reason: 'Raise equipped technique mastery to the gate floor.',
  },
  build_rank: {
    code: 'raise_rank',
    destination: 'techniques',
    reason: 'Spend fragments to reach the gate rank floor.',
  },
  build_runes: {
    code: 'socket_runes',
    destination: 'forge',
    reason: 'Socket more runes into the equipped build.',
  },
  forge_floor: {
    code: 'raise_forge_floor',
    destination: 'forge',
    reason: 'Raise weapon, accessory, temper, and rune totals to the gate floor.',
  },
  economic_shortfall: {
    code: 'close_prep_shortfalls',
    destination: 'apothecary',
    reason: 'Resolve consumable, reserve, and route shortfalls before retrying.',
  },
  posture_ai: {
    code: 'fix_ai_posture',
    destination: 'trial',
    reason: 'Switch to a gate-appropriate AI posture before retrying.',
  },
  posture_casting: {
    code: 'fix_casting_posture',
    destination: 'trial',
    reason: 'Switch to a safer gate-appropriate casting policy.',
  },
  posture_pouch: {
    code: 'configure_pouch',
    destination: 'medicine_pouch',
    reason: 'Enable healing and utility auto-use for the gate attempt.',
  },
};

const FIX_BY_BUILD_GAP_CODE: Partial<Record<BuildGapCode, FailureFix>> = {
  missing_survival_tool: {
    code: 'add_survival_tool',
    destination: 'techniques',
    reason: 'Add a guard, heal, or cleanse technique to the live build.',
  },
  missing_setup_tool: {
    code: 'add_setup_tool',
    destination: 'techniques',
    reason: 'Add a setup or control technique to smooth boss phases.',
  },
};

function asTelemetrySummary(summary: TrialAttemptSummary): TrialAttemptSummaryTelemetry {
  return summary as TrialAttemptSummaryTelemetry;
}

function appendUniqueString(target: string[], value: string): void {
  if (!value || target.includes(value) || target.length >= 3) return;
  target.push(value);
}

function dedupeFixes(fixes: readonly FailureFix[]): FailureFix[] {
  const seen = new Set<string>();
  const deduped: FailureFix[] = [];

  fixes.forEach((fix) => {
    if (seen.has(fix.code) || deduped.length >= 3) return;
    seen.add(fix.code);
    deduped.push({ ...fix });
  });

  return deduped;
}

function getShortfallCodes(shortfalls: readonly ReadinessShortfall[]): Set<ReadinessShortfallCode> {
  return new Set(shortfalls.map((shortfall) => shortfall.code));
}

function scoreSeverity(severity: ReadinessSeverity): number {
  switch (severity) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    default: return 1;
  }
}

function buildReasonsForUnderbuilt(input: TrialFailureDiagnosisInput): string[] {
  const reasons: string[] = [];
  const shortfallCodes = getShortfallCodes(input.readiness.shortfalls);

  (['build_slots', 'build_alignment', 'build_mastery', 'build_rank', 'build_runes'] as const).forEach((code) => {
    const reason = BUILT_REASON_BY_CODE[code];
    if (shortfallCodes.has(code) && reason) appendUniqueString(reasons, reason);
  });

  if (reasons.length < 3 && input.summary.bossHpPct >= 40) {
    appendUniqueString(reasons, 'Boss HP remained high after the attempt, so the build did not convert pressure fast enough.');
  }

  return reasons;
}

function buildReasonsForUnderforged(input: TrialFailureDiagnosisInput): string[] {
  const reasons = ['Forge floor is still below the gate target.'];
  const summary = asTelemetrySummary(input.summary);

  if ((summary.spikeRatio ?? 0) >= 0.6) {
    appendUniqueString(reasons, 'Incoming burst exceeded the current defensive forge floor.');
  }
  if (summary.shieldPhaseSeen || summary.damageReductionPressureSeen) {
    appendUniqueString(reasons, 'Shield or reduction phases are overtaxing the current forge floor.');
  }
  if ((summary.timeToDieSec ?? Number.POSITIVE_INFINITY) <= 6) {
    appendUniqueString(reasons, 'The attempt collapsed before the current forge floor stabilized the fight.');
  }

  return reasons;
}

function buildReasonsForUnderprepared(input: TrialFailureDiagnosisInput): string[] {
  const reasons: string[] = [];
  const shortfallCodes = getShortfallCodes(input.readiness.shortfalls);
  const summary = asTelemetrySummary(input.summary);

  (['economic_shortfall', 'posture_ai', 'posture_casting', 'posture_pouch'] as const).forEach((code) => {
    const reason = PREP_REASON_BY_CODE[code];
    if (shortfallCodes.has(code) && reason) appendUniqueString(reasons, reason);
  });

  if (summary.auraPressureSeen || summary.soulDrainPressureSeen) {
    appendUniqueString(reasons, 'Aura/soul pressure suggests sustain prep or pouch posture is missing.');
  }

  return reasons;
}

function buildReasonsForClose(): string[] {
  return [
    'Minimum gate floors are already met.',
    'Boss HP remaining suggests the clear is close.',
    'A cleaner attempt or one targeted fix should be enough.',
  ];
}

function buildReasonsForUndercultivated(input: TrialFailureDiagnosisInput): string[] {
  const reasons = ['Minimum build, forge, prep, and posture floors are met, but raw cultivation power is still short.'];
  const summary = asTelemetrySummary(input.summary);

  if (input.summary.bossHpPct >= 40) {
    appendUniqueString(reasons, 'Boss HP remained too high despite meeting the current structural floors.');
  }
  if ((summary.timeToDieSec ?? Number.POSITIVE_INFINITY) < 8) {
    appendUniqueString(reasons, 'The attempt still collapsed too quickly even after meeting the current structural floors.');
  }

  return reasons;
}

function buildReasons(input: TrialFailureDiagnosisInput, primary: FailureDiagnosisCode, secondary: FailureDiagnosisCode | null): string[] {
  let reasons: string[];

  switch (primary) {
    case 'underbuilt': reasons = buildReasonsForUnderbuilt(input); break;
    case 'underforged': reasons = buildReasonsForUnderforged(input); break;
    case 'underprepared': reasons = buildReasonsForUnderprepared(input); break;
    case 'close': reasons = buildReasonsForClose(); break;
    case 'undercultivated':
    default: reasons = buildReasonsForUndercultivated(input); break;
  }

  if (secondary === 'bypassAvailable' && reasons.length < 3) {
    appendUniqueString(reasons, `${GATE_SUPPORT_LABELS.support} bypass is available right now.`);
  }

  return reasons.length > 0 ? reasons.slice(0, 3) : [DEFAULT_REASON];
}

function appendShortfallFixes(target: FailureFix[], readiness: GateReadinessResult): void {
  readiness.shortfalls.forEach((shortfall) => {
    const fix = FIX_BY_SHORTFALL_CODE[shortfall.code];
    if (fix) target.push(fix);
  });
}

function appendBuildGapFixes(target: FailureFix[], build: BuildAnalysis): void {
  build.gaps.forEach((gap) => {
    const fix = FIX_BY_BUILD_GAP_CODE[gap.code];
    if (fix) target.push(fix);
  });
}

function buildTopFixes(input: TrialFailureDiagnosisInput, primary: FailureDiagnosisCode, secondary: FailureDiagnosisCode | null): FailureFix[] {
  const fixes: FailureFix[] = [];

  if (primary === 'undercultivated') {
    fixes.push({
      code: 'continue_cultivating',
      destination: 'cultivation',
      reason: 'Advance cultivation, Qi, and base power before retrying this gate.',
    });
  }

  if (primary === 'close') {
    fixes.push({
      code: 'retry_clean',
      destination: 'trial',
      reason: 'The attempt is close enough that a cleaner run may clear the gate.',
    });
  }

  appendShortfallFixes(fixes, input.readiness);
  appendBuildGapFixes(fixes, input.build);

  if (secondary === 'bypassAvailable') {
    fixes.push({
      code: 'buy_fail_safe',
      destination: 'trial',
      reason: `${GATE_SUPPORT_LABELS.support} bypass is already available if you want to skip this gate.`,
    });
  }

  const deduped = dedupeFixes(fixes);
  return deduped.length > 0 ? deduped : [{ ...DEFAULT_FIX }];
}

function buildDominanceScores(input: TrialFailureDiagnosisInput): Record<'underbuilt' | 'underforged' | 'underprepared' | 'undercultivated', number> {
  const summary = asTelemetrySummary(input.summary);
  const scores = {
    underbuilt: 0,
    underforged: 0,
    underprepared: 0,
    undercultivated: 0,
  };

  input.readiness.shortfalls.forEach((shortfall) => {
    const weight = scoreSeverity(shortfall.severity);
    if (shortfall.code.startsWith('build_')) scores.underbuilt += weight;
    if (shortfall.code === 'forge_floor') scores.underforged += weight;
    if (shortfall.code === 'economic_shortfall' || shortfall.code.startsWith('posture_')) scores.underprepared += weight;
  });

  if ((summary.spikeRatio ?? 0) >= 0.6) scores.underforged += 2;
  if (summary.shieldPhaseSeen || summary.damageReductionPressureSeen) scores.underforged += 1;
  if (summary.ultimatePressureSeen) scores.underforged += 1;

  if (summary.auraPressureSeen || summary.soulDrainPressureSeen) scores.underprepared += 1;
  if ((summary.timeToDieSec ?? Number.POSITIVE_INFINITY) <= 6) scores.underprepared += 1;

  if ((summary.rollingPlayerDps ?? Number.POSITIVE_INFINITY) < (summary.rollingEnemyDps ?? 0)) scores.underbuilt += 1;
  if (summary.bossHpPct >= 55) scores.underbuilt += 1;

  const allMinimumMet =
    input.readiness.build.minimumMet &&
    input.readiness.forge.minimumMet &&
    input.readiness.economic.minimumMet &&
    input.readiness.posture.minimumMet;

  if (allMinimumMet) {
    scores.undercultivated += 2;
    if (summary.bossHpPct >= 35) scores.undercultivated += 1;
    if ((summary.timeToDieSec ?? Number.POSITIVE_INFINITY) < 8) scores.undercultivated += 1;
  }

  return scores;
}

export function isTrialFailureClose(input: {
  summary: TrialAttemptSummary;
  readiness: GateReadinessResult;
}): boolean {
  const summary = asTelemetrySummary(input.summary);
  const minimumReady =
    input.readiness.build.minimumMet &&
    input.readiness.forge.minimumMet &&
    input.readiness.economic.minimumMet &&
    input.readiness.posture.minimumMet;

  if (!minimumReady) return false;
  if (input.summary.bossHpPct > READINESS_CLOSE_CALL_POLICY.maxBossHpPct) return false;

  const competitiveTime = (summary.timeToDieSec ?? 0) >= READINESS_CLOSE_CALL_POLICY.minCompetitiveTimeToDieSec;
  const stableSpike = (summary.spikeRatio ?? Number.POSITIVE_INFINITY) <= READINESS_CLOSE_CALL_POLICY.maxImmediateMismatchSpikeRatio;
  const meaningfulDuration = input.summary.durationSec >= READINESS_CLOSE_CALL_POLICY.minMeaningfulFightDurationSec;

  return competitiveTime || stableSpike || meaningfulDuration;
}

export function diagnoseTrialFailure(
  input: TrialFailureDiagnosisInput,
): FailureDiagnosis {
  const closeEnough = isTrialFailureClose({
    summary: input.summary,
    readiness: input.readiness,
  });

  const dominance = buildDominanceScores(input);

  const dominantPrimary: 'underbuilt' | 'underforged' | 'underprepared' | 'undercultivated' = (() => {
    let best: 'underbuilt' | 'underforged' | 'underprepared' | 'undercultivated' = 'undercultivated';
    let bestScore = dominance.undercultivated;

    if (dominance.underbuilt > bestScore) {
      best = 'underbuilt';
      bestScore = dominance.underbuilt;
    }
    if (dominance.underforged > bestScore) {
      best = 'underforged';
      bestScore = dominance.underforged;
    }
    if (dominance.underprepared > bestScore) {
      best = 'underprepared';
    }

    return best;
  })();

  const primary: FailureDiagnosisCode = closeEnough ? 'close' : dominantPrimary;

  const secondary: FailureDiagnosisCode | null = input.bypassAvailable === true
    ? 'bypassAvailable'
    : (() => {
      const candidates: Array<[FailureDiagnosisCode, number]> = [
        ['underbuilt', dominance.underbuilt],
        ['underforged', dominance.underforged],
        ['underprepared', dominance.underprepared],
      ];
      const best = candidates
        .filter(([code, score]) => code !== primary && score > 0)
        .sort((a, b) => b[1] - a[1])[0];
      if (best) return best[0];

      if (dominantPrimary === 'underbuilt') return 'underforged';
      if (dominantPrimary !== 'underforged' && input.readiness.forge.band !== 'recommended_met') return 'underforged';
      if (input.readiness.build.band !== 'recommended_met') return 'underbuilt';
      if (
        dominantPrimary !== 'underprepared'
        && (input.readiness.economic.band !== 'recommended_met' || input.readiness.posture.band !== 'recommended_met')
      ) return 'underprepared';

      return null;
    })();

  return {
    primary,
    secondary,
    reasons: buildReasons(input, primary, secondary),
    topFixes: buildTopFixes(input, primary, secondary),
  };
}
