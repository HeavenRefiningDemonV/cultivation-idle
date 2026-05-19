import { useCombatStore } from '../../stores/combatStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useTrialStore } from '../../stores/trialStore.js';
import { buildLiveRunCompassSurfaceV2 } from '../../systems/ui/runCompass/index.js';
import { buildFailureReflectionSurface, useFailureReflectionStore } from '../../systems/failureReflection/index.js';
import { captureRunDeltaSnapshot } from '../../systems/runDeltas/runDeltaStore.js';
import type { RunCausalityDelta } from '../../systems/runDeltas/types.js';
import { findLatestCombatAftermathEvents } from './combatAftermathEventBridge.js';
import {
  createEmptySpoilsGroup,
  formatCurrencyLabel,
  formatItemLabel,
  gradeLabel,
  contextTitle,
  SPOILS_GROUP_ORDER,
  summarizeGroup,
  titleCaseWords,
} from './combatAftermathPresentation.js';
import type {
  BuildLiveCombatAftermathContextHint,
  CombatAftermathBuildSnapshot,
  CombatAftermathDeltaSurface,
  CombatAftermathDiagnosisInput,
  CombatAftermathDiagnosisSurface,
  CombatAftermathOutcomeKind,
  CombatAftermathRouteSurface,
  CombatAftermathSpoilLine,
  CombatAftermathSpoilsGroup,
  CombatAftermathSpoilsGroupId,
  CombatAftermathSurfaceV1,
  CombatAftermathVictoryGrade,
  RunCompassRouteV2,
} from './types.js';

function pushGroupLine(
  groups: Map<CombatAftermathSpoilsGroupId, CombatAftermathSpoilsGroup>,
  groupId: CombatAftermathSpoilsGroupId,
  line: CombatAftermathSpoilLine,
): void {
  const group = groups.get(groupId);
  if (!group) return;
  group.lines.push(line);
}

function lowerText(...parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function classifyItemGroup(itemId: string, label: string, gateProofItemId: string | null | undefined): CombatAftermathSpoilsGroupId {
  const lower = lowerText(itemId, label);
  if (gateProofItemId && itemId === gateProofItemId) return 'gate_proof';
  if (lower.includes('gate_') || lower.includes('proof') || lower.includes('catalyst') || lower.includes('seal')) return 'gate_proof';
  if (lower.includes('manual') || lower.includes('fragment') || lower.includes('technique')) return 'doctrine';
  if (lower.includes('ore') || lower.includes('ingot') || lower.includes('core') || lower.includes('bone') || lower.includes('pelt') || lower.includes('rune')) return 'crafting';
  if (lower.includes('pill') || lower.includes('pellet') || lower.includes('herb') || lower.includes('leaf') || lower.includes('medicine') || lower.includes('elixir') || lower.includes('cons_')) return 'gate_prep';
  return 'gate_prep';
}

function classifyCurrencyGroup(currencyKey: string): CombatAftermathSpoilsGroupId {
  if (currencyKey === 'merit' || /reputation|renown/i.test(currencyKey)) return 'reputation';
  return 'immediate_spend';
}

function buildSpoilsGroups(snapshot: CombatAftermathBuildSnapshot): CombatAftermathSpoilsGroup[] {
  const groups = new Map(SPOILS_GROUP_ORDER.map((id) => [id, createEmptySpoilsGroup(id)] as const));
  const result = snapshot.rewardResult;

  for (const [currencyKey, amount] of Object.entries(result?.appliedCurrencies ?? {})) {
    if (amount == null || String(amount) === '0') continue;
    const label = formatCurrencyLabel(currencyKey, snapshot.currencyLabelsByKey);
    const groupId = classifyCurrencyGroup(currencyKey);
    pushGroupLine(groups, groupId, {
      id: `currency:${currencyKey}`,
      label,
      value: `+${amount} ${label}`,
      detail: groupId === 'immediate_spend' ? 'Spendable reserve improved for the current route.' : 'City standing reserve improved.',
      currencyKey,
      source: 'reward_result',
    });
  }

  for (const item of result?.appliedItems ?? []) {
    if (!item.itemId || item.qty <= 0) continue;
    const label = formatItemLabel(item.itemId, snapshot.itemNamesById);
    const groupId = classifyItemGroup(item.itemId, label, snapshot.context.gateProofItemId);
    pushGroupLine(groups, groupId, {
      id: `item:${item.itemId}`,
      label,
      value: `+${item.qty} ${label}`,
      detail: groupId === 'gate_proof'
        ? 'Gate proof acquired for breakthrough.'
        : groupId === 'crafting'
          ? 'Crafting stock moved toward a support floor.'
          : 'Prep stock improved conservatively.',
      itemId: item.itemId,
      source: 'reward_result',
    });
  }

  for (const fragment of result?.appliedTechniqueFragments ?? []) {
    if (!fragment.techId || fragment.qty <= 0) continue;
    pushGroupLine(groups, 'doctrine', {
      id: `fragment:${fragment.techId}`,
      label: titleCaseWords(fragment.techId),
      value: `+${fragment.qty} fragment`,
      detail: 'Technique doctrine deepened.',
      source: 'reward_result',
    });
  }

  for (const manual of result?.appliedManuals ?? []) {
    if (!manual.manualId || manual.qty <= 0) continue;
    pushGroupLine(groups, 'doctrine', {
      id: `manual:${manual.manualId}`,
      label: titleCaseWords(manual.manualId),
      value: `+${manual.qty} manual`,
      detail: `${titleCaseWords(manual.grade)} doctrine entered the satchel.`,
      source: 'reward_result',
    });
  }

  const comprehension = result?.appliedComprehension;
  if (comprehension) {
    const groupId = comprehension.applied ? 'rare_signs' : 'doctrine';
    pushGroupLine(groups, groupId, {
      id: 'comprehension',
      label: 'Heart Law comprehension',
      value: comprehension.applied ? `+${comprehension.amount} Comprehension` : 'Comprehension skipped',
      detail: comprehension.applied
        ? 'A rare sign refined doctrine.'
        : `Not applied: ${comprehension.skippedReason ?? 'unavailable'}.`,
      source: 'reward_result',
    });
  }

  for (const dropped of result?.droppedItems ?? []) {
    if (!dropped.itemId || dropped.qty <= 0) continue;
    const label = formatItemLabel(dropped.itemId, snapshot.itemNamesById);
    pushGroupLine(groups, 'gate_prep', {
      id: `dropped:${dropped.itemId}`,
      label,
      value: `${dropped.qty} ${label} dropped`,
      detail: 'Inventory capacity blocked part of the bundle.',
      itemId: dropped.itemId,
      source: 'reward_result',
    });
  }

  for (const delta of snapshot.recentDeltas ?? []) {
    if (!delta.rewardSummary) continue;
    const groupId = delta.source === 'dao_impression'
      ? 'rare_signs'
      : delta.source === 'trial'
        ? 'gate_prep'
        : 'immediate_spend';
    pushGroupLine(groups, groupId, {
      id: `delta:${delta.id}`,
      label: delta.label,
      value: delta.rewardSummary,
      detail: delta.memoryLine,
      source: 'run_delta',
    });
  }

  return SPOILS_GROUP_ORDER.map((id) => summarizeGroup(groups.get(id) ?? createEmptySpoilsGroup(id)));
}

function routeFromRunCompass(route: RunCompassRouteV2 | null | undefined, source: CombatAftermathRouteSurface['source']): CombatAftermathRouteSurface | null {
  if (!route) return null;
  return {
    id: route.id,
    label: route.actionLabel || route.label,
    detail: route.detail,
    target: route.target,
    source,
    enabled: !route.blocked && route.target !== null,
    disabledReason: route.blockedReason,
  };
}

function resolveOutcomeKind(snapshot: CombatAftermathBuildSnapshot): CombatAftermathOutcomeKind {
  const trialOutcome = snapshot.trialAttempt?.outcome;
  if (trialOutcome === 'cleared') return 'cleared';
  if (trialOutcome === 'bypassed') return 'bypassed';
  if (trialOutcome === 'defeated' || trialOutcome === 'defeat') return 'defeat';
  if (snapshot.context.kind === 'ruins' && snapshot.combatResolved?.outcome === 'victory') return 'support_complete';
  if (snapshot.combatResolved?.outcome === 'victory') return 'victory';
  if (snapshot.combatResolved?.outcome === 'defeat') return 'defeat';
  return 'unknown';
}

function normalizedPct(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return value > 1 ? Math.max(0, Math.min(1, value / 100)) : Math.max(0, Math.min(1, value));
}

function medicineUseCount(snapshot: CombatAftermathBuildSnapshot): number | null {
  const explicit = snapshot.combatSummary?.medicineUses;
  if (typeof explicit === 'number' && Number.isFinite(explicit)) return Math.max(0, explicit);
  const healingEvents = snapshot.combatSummary?.healingEvents;
  if (typeof healingEvents === 'number' && Number.isFinite(healingEvents)) return Math.max(0, healingEvents);
  const payloadHealing = snapshot.combatResolved?.healingEvents;
  if (typeof payloadHealing === 'number' && Number.isFinite(payloadHealing)) return Math.max(0, payloadHealing);
  const payloadMedicine = snapshot.combatResolved?.medicineUses;
  if (typeof payloadMedicine === 'number' && Number.isFinite(payloadMedicine)) return Math.max(0, payloadMedicine);
  return null;
}

function playerHpPctRemaining(snapshot: CombatAftermathBuildSnapshot): number | null {
  return normalizedPct(
    snapshot.combatSummary?.playerHpPctRemaining
      ?? snapshot.combatResolved?.playerHpPctRemaining
      ?? null,
  );
}

function hasSurvivalGradeData(snapshot: CombatAftermathBuildSnapshot): boolean {
  return playerHpPctRemaining(snapshot) !== null || medicineUseCount(snapshot) !== null;
}

function resolveVictoryGrade(snapshot: CombatAftermathBuildSnapshot, outcome: CombatAftermathOutcomeKind): CombatAftermathVictoryGrade {
  if (outcome === 'defeat') return 'not_applicable';
  if (outcome === 'cleared' || outcome === 'bypassed') return 'breakthrough_worthy';
  const hpPct = playerHpPctRemaining(snapshot);
  const medicineUses = medicineUseCount(snapshot);
  if (hpPct === null && medicineUses === null) return 'unknown';
  if (hpPct !== null && hpPct <= 0.2) return 'overmatched';
  if ((hpPct !== null && hpPct <= 0.45) || (medicineUses !== null && medicineUses >= 2)) return 'strained';
  if ((hpPct === null || hpPct >= 0.7) && (medicineUses === null || medicineUses === 0)) return 'clean';
  return 'strained';
}

function victoryGradeReason(
  snapshot: CombatAftermathBuildSnapshot,
  grade: CombatAftermathVictoryGrade,
  fallback: string,
): string {
  if (grade === 'unknown' && !hasSurvivalGradeData(snapshot)) {
    return 'Survival grade unavailable: no HP or medicine summary surfaced.';
  }
  const hpPct = playerHpPctRemaining(snapshot);
  const medicineUses = medicineUseCount(snapshot);
  if (hpPct !== null || medicineUses !== null) {
    const hpLabel = hpPct !== null ? `${Math.round(hpPct * 100)}% HP remaining` : 'HP summary unavailable';
    const medicineLabel = medicineUses !== null ? `${medicineUses} healing events` : 'medicine summary unavailable';
    return `${hpLabel}; ${medicineLabel}.`;
  }
  return fallback;
}

function resolveOutcome(snapshot: CombatAftermathBuildSnapshot) {
  const kind = resolveOutcomeKind(snapshot);
  const grade = resolveVictoryGrade(snapshot, kind);
  const gateLabel = snapshot.context.gateLabel ?? 'the gate';

  if (kind === 'cleared') {
    return {
      kind,
      title: 'The gate opened.',
      subtitle: 'Proof acquired. Return to Cultivation and break through.',
      tone: 'ceremonial' as const,
      victoryGrade: grade,
      gradeLabel: gradeLabel(grade, kind),
      gradeReason: 'The guardian threshold was resolved through combat.',
    };
  }
  if (kind === 'bypassed') {
    return {
      kind,
      title: 'Safety Net secured the proof.',
      subtitle: 'Earned fallback resolved the gate without another duel.',
      tone: 'ceremonial' as const,
      victoryGrade: grade,
      gradeLabel: gradeLabel(grade, kind),
      gradeReason: 'The proof came through the existing fail-safe path.',
    };
  }
  if (kind === 'defeat') {
    return {
      kind,
      title: snapshot.context.kind === 'gate_trial' ? 'The guardian rejected the attempt.' : 'The route collapsed.',
      subtitle: snapshot.context.kind === 'gate_trial' ? `Failure diagnosis should guide the next ${gateLabel} fix.` : 'Recover before pushing this route again.',
      tone: 'warning' as const,
      victoryGrade: grade,
      gradeLabel: gradeLabel(grade, kind),
      gradeReason: 'Defeat is a diagnosis surface, not a reward score.',
    };
  }
  if (kind === 'support_complete') {
    return {
      kind,
      title: 'A material drought loosened.',
      subtitle: 'Ruins support improved prep stock conservatively.',
      tone: 'success' as const,
      victoryGrade: grade,
      gradeLabel: gradeLabel(grade, kind),
      gradeReason: victoryGradeReason(snapshot, grade, 'The support route produced targeted materials.'),
    };
  }
  if (kind === 'victory') {
    return {
      kind,
      title: `${contextTitle(snapshot.context.kind)} recorded.`,
      subtitle: 'Spoils and route pressure changed.',
      tone: 'success' as const,
      victoryGrade: grade,
      gradeLabel: gradeLabel(grade, kind),
      gradeReason: victoryGradeReason(snapshot, grade, 'Combat resolved successfully.'),
    };
  }
  return {
    kind,
    title: `${contextTitle(snapshot.context.kind)} pending.`,
    subtitle: 'No recent matching result surfaced.',
    tone: 'neutral' as const,
    victoryGrade: grade,
    gradeLabel: gradeLabel(grade, kind),
    gradeReason: 'The surface has insufficient result data.',
  };
}

function diagnosisDefaults(code: string): { label: string; explanation: string; topFixLabel: string } {
  switch (code) {
    case 'undercultivated':
      return { label: 'Undercultivated', explanation: 'Qi or Heart Law comprehension is below the threshold.', topFixLabel: 'Return to Cultivation' };
    case 'underbuilt':
      return { label: 'Underbuilt', explanation: 'Technique loadout or manual depth is the exposed weakness.', topFixLabel: 'Review Techniques' };
    case 'underforged':
      return { label: 'Underforged', explanation: 'Forge floor is behind the guardian pressure.', topFixLabel: 'Return to Forge' };
    case 'underprepared':
      return { label: 'Underprepared', explanation: 'The guardian exposed an underprepared pouch.', topFixLabel: 'Stock medicine pouch' };
    case 'close':
      return { label: 'Close', explanation: 'The attempt was near enough that one top fix or retry may resolve it.', topFixLabel: 'Retry Gate Trial' };
    case 'bypassAvailable':
    case 'bypass_available':
      return { label: 'Safety Net Available', explanation: 'Earned fallback can secure the proof.', topFixLabel: 'Use Safety Net' };
    default:
      return { label: titleCaseWords(code), explanation: 'No precise diagnosis surfaced.', topFixLabel: 'Follow Run Compass' };
  }
}

function resolveDiagnosis(
  input: CombatAftermathDiagnosisInput | null | undefined,
  primaryRoute: CombatAftermathRouteSurface | null,
): CombatAftermathDiagnosisSurface | null {
  if (!input?.code) return null;
  const defaults = diagnosisDefaults(input.code);
  return {
    code: input.code,
    label: input.label ?? defaults.label,
    explanation: input.explanation ?? defaults.explanation,
    topFixLabel: input.topFixLabel ?? defaults.topFixLabel,
    topFixRoute: primaryRoute,
    confidence: input.confidence ?? 'derived',
  };
}

function firstNonEmptyGroup(groups: CombatAftermathSpoilsGroup[], ids: CombatAftermathSpoilsGroupId[]): CombatAftermathSpoilsGroup | null {
  return ids.map((id) => groups.find((group) => group.id === id) ?? null).find((group) => group && !group.empty) ?? null;
}

function buildEconomyDelta(snapshot: CombatAftermathBuildSnapshot, groups: CombatAftermathSpoilsGroup[]): CombatAftermathDeltaSurface | null {
  if (snapshot.economyDelta) return snapshot.economyDelta;
  const economyGroup = firstNonEmptyGroup(groups, ['immediate_spend', 'reputation', 'gate_prep']);
  if (!economyGroup) return null;
  return {
    title: 'Reserve Shift',
    deltaLabel: economyGroup.lines[0]?.value,
    explanation: snapshot.runCompass?.primaryRoute
      ? `This improves prep reserve for ${snapshot.runCompass.primaryRoute.destinationLabel}.`
      : 'This improves your prep reserve, but the exact gate-package delta is unavailable.',
    confidence: 'conservative',
  };
}

function buildDoctrineDelta(snapshot: CombatAftermathBuildSnapshot, groups: CombatAftermathSpoilsGroup[]): CombatAftermathDeltaSurface | null {
  if (snapshot.doctrineDelta) return snapshot.doctrineDelta;
  const doctrineGroup = firstNonEmptyGroup(groups, ['doctrine', 'rare_signs']);
  if (!doctrineGroup) return null;
  return {
    title: 'Doctrine Deepened',
    deltaLabel: doctrineGroup.lines[0]?.value,
    explanation: 'Doctrine, manuals, fragments, or Heart Law comprehension changed.',
    confidence: 'exact',
  };
}

function buildReadinessDelta(snapshot: CombatAftermathBuildSnapshot): CombatAftermathDeltaSurface | null {
  if (snapshot.readinessDelta) return snapshot.readinessDelta;
  const delta = (snapshot.recentDeltas ?? []).find((entry) => entry.readinessDelta);
  if (delta?.readinessDelta) {
    return {
      title: 'Readiness Shift',
      beforeLabel: delta.readinessDelta.beforeLabel ?? undefined,
      afterLabel: delta.readinessDelta.afterLabel ?? undefined,
      deltaLabel: delta.readinessDelta.deltaLabel ?? undefined,
      explanation: delta.memoryLine,
      confidence: 'derived',
    };
  }
  if (snapshot.context.kind === 'gate_trial' && snapshot.trialAttempt?.outcome === 'defeated') {
    return {
      title: 'Readiness Exposed',
      explanation: 'The gate attempt produced a diagnosis, but exact readiness delta is unavailable.',
      confidence: 'conservative',
    };
  }
  return null;
}

function buildMemoryLine(snapshot: CombatAftermathBuildSnapshot, outcome: CombatAftermathOutcomeKind, diagnosis: CombatAftermathDiagnosisSurface | null): string {
  const recentLine = (snapshot.recentDeltas ?? []).find((delta) => delta.memoryLine)?.memoryLine;
  if (outcome === 'cleared') return 'The gate opened; the proof now points back to Cultivation.';
  if (outcome === 'bypassed') return 'Earned fallback secured the proof without another duel.';
  if (outcome === 'defeat') return diagnosis?.explanation ?? 'The guardian exposed the next weakness.';
  if (outcome === 'support_complete') return 'A shortage loosened; the gate package is less brittle.';
  if (snapshot.context.kind === 'outskirts') return 'The outskirts yielded spendable prep and a steadier route.';
  return recentLine ?? 'The result entered this life record.';
}

function buildSourceEventIds(snapshot: CombatAftermathBuildSnapshot): string[] {
  const ids = [...(snapshot.sourceEventIds ?? [])];
  if (snapshot.combatResolved?.timestamp) ids.push(`combat:${snapshot.combatResolved.timestamp}`);
  if (snapshot.trialAttempt?.attemptId) ids.push(`trial:${snapshot.trialAttempt.attemptId}`);
  return [...new Set(ids)];
}

function buildDebugNotes(snapshot: CombatAftermathBuildSnapshot, outcome: ReturnType<typeof resolveOutcome>): string[] {
  const notes = [...(snapshot.debugNotes ?? []), ...(snapshot.runCompass?.debugNotes ?? [])];
  if (
    (outcome.kind === 'victory' || outcome.kind === 'support_complete') &&
    outcome.victoryGrade === 'unknown' &&
    !hasSurvivalGradeData(snapshot)
  ) {
    notes.push('Victory grade stayed unknown because HP and medicine summaries were unavailable.');
  }
  return [...new Set(notes)];
}

export function buildCombatAftermathSurfaceFromSnapshot(snapshot: CombatAftermathBuildSnapshot): CombatAftermathSurfaceV1 {
  const createdAt = snapshot.createdAt ?? Date.now();
  const outcome = resolveOutcome(snapshot);
  const spoilsGroups = buildSpoilsGroups(snapshot);
  const primaryRoute = routeFromRunCompass(snapshot.runCompass?.primaryRoute ?? null, 'run_compass');
  const diagnosis = resolveDiagnosis(snapshot.diagnosis, primaryRoute);
  const secondaryRoutes = (snapshot.runCompass?.secondaryRoutes ?? [])
    .map((route) => routeFromRunCompass(route, 'run_compass'))
    .filter((route): route is CombatAftermathRouteSurface => Boolean(route))
    .slice(0, 3);

  return {
    version: 1,
    id: snapshot.id ?? `${snapshot.context.kind}:${createdAt}`,
    createdAt,
    context: {
      kind: snapshot.context.kind,
      cityId: snapshot.context.cityId ?? null,
      sourceId: snapshot.context.sourceId ?? null,
      trialId: snapshot.context.trialId ?? null,
      ruinId: snapshot.context.ruinId ?? null,
      enemyId: snapshot.context.enemyId ?? snapshot.combatResolved?.enemyId ?? null,
      enemyName: snapshot.context.enemyName ?? null,
      gateLabel: snapshot.context.gateLabel ?? null,
    },
    outcome,
    spoilsGroups,
    readinessDelta: buildReadinessDelta(snapshot),
    economyDelta: buildEconomyDelta(snapshot, spoilsGroups),
    doctrineDelta: buildDoctrineDelta(snapshot, spoilsGroups),
    diagnosis,
    failureReflection: snapshot.failureReflection ?? null,
    memoryLine: buildMemoryLine(snapshot, outcome.kind, diagnosis),
    primaryRoute,
    secondaryRoutes,
    sourceEventIds: buildSourceEventIds(snapshot),
    recentDeltaIds: (snapshot.recentDeltas ?? []).map((delta) => delta.id),
    debugNotes: buildDebugNotes(snapshot, outcome),
  };
}

function matchesContext(delta: RunCausalityDelta, hint: BuildLiveCombatAftermathContextHint): boolean {
  if (delta.source === 'dao_impression') return true;
  if (hint.kind === 'gate_trial') return delta.source === 'trial' || /gate|trial/i.test(delta.detail);
  if (hint.kind === 'ruins') return delta.source === 'combat' || /ruin|material|craft/i.test(delta.detail);
  return delta.source === 'rewards' || delta.source === 'combat' || /outskirts|gold/i.test(delta.detail);
}

function diagnosisFromTrialSummary(trialId: string | null | undefined): CombatAftermathDiagnosisInput | null {
  if (!trialId) return null;
  const summary = useTrialStore.getState().getProgress(trialId).lastAttemptSummary;
  if (!summary) return null;
  const suggestion = summary.suggestions[0] ?? 'Follow Run Compass.';
  let code = 'close';
  if (/medicine|pouch|healing|apothecary/i.test(suggestion)) code = 'underprepared';
  if (/forge|weapon|gear/i.test(suggestion)) code = 'underforged';
  if (/technique|manual|loadout/i.test(suggestion)) code = 'underbuilt';
  return {
    code,
    explanation: suggestion,
    topFixLabel: suggestion,
    confidence: 'derived',
  };
}

export function buildLiveCombatAftermathSurface(
  contextHint: BuildLiveCombatAftermathContextHint,
): CombatAftermathSurfaceV1 | null {
  const runCompass = buildLiveRunCompassSurfaceV2();
  const recentDeltas = captureRunDeltaSnapshot().filter((delta) => matchesContext(delta, contextHint)).slice(0, 3);
  const eventMemory = findLatestCombatAftermathEvents(contextHint);
  const combat = useCombatStore.getState();
  const content = useContentStore.getState();
  const trialProgress = contextHint.trialId ? useTrialStore.getState().getProgress(contextHint.trialId) : null;
  const failureReflection = contextHint.trialId
    ? useFailureReflectionStore.getState().getActiveReflectionForTrial(contextHint.trialId)
    : null;
  const hasResultSignal =
    recentDeltas.length > 0 ||
    combat.combatResolved ||
    Boolean(eventMemory.rewardPayload || eventMemory.combatPayload || eventMemory.trialPayload) ||
    Boolean(trialProgress?.lastAttemptSummary) ||
    trialProgress?.resolution === 'cleared' ||
    trialProgress?.resolution === 'bypassed';

  if (!hasResultSignal) return null;

  const trialAttempt = contextHint.kind === 'gate_trial'
    ? {
        outcome: eventMemory.trialPayload?.outcome
          ?? (trialProgress?.resolution === 'cleared'
          ? 'cleared'
          : trialProgress?.resolution === 'bypassed'
            ? 'bypassed'
            : trialProgress?.lastAttemptSummary
              ? 'defeated'
              : undefined as 'cleared' | 'bypassed' | 'defeated' | undefined),
        eligibleFailCountAfterAttempt: eventMemory.trialPayload?.eligibleFailCountAfterAttempt ?? trialProgress?.eligibleFailures,
      }
    : null;
  const combatOutcome: 'victory' | 'defeat' | undefined = !combat.combatResolved
    ? undefined
    : Number(combat.playerHP) <= 0
      ? 'defeat'
      : Number(combat.enemyHP) <= 0
      ? 'victory'
        : undefined;
  const fallbackCombatResolved = eventMemory.combatPayload
    ?? (eventMemory.rewardPayload
      ? {
          outcome: 'victory' as const,
          source: contextHint.kind === 'gate_trial' ? 'trial' : contextHint.kind,
          trialId: contextHint.trialId ?? undefined,
          timestamp: eventMemory.rewardPayload.timestamp,
        }
      : null);

  return buildCombatAftermathSurfaceFromSnapshot({
    context: contextHint,
    runCompass,
    recentDeltas,
    rewardResult: eventMemory.rewardPayload?.result ?? null,
    combatResolved: fallbackCombatResolved
      ? fallbackCombatResolved
      : combat.combatResolved
      ? {
          outcome: combatOutcome,
          source: contextHint.kind === 'gate_trial' ? 'trial' : contextHint.kind,
          trialId: contextHint.trialId ?? undefined,
        }
      : null,
    trialAttempt,
    diagnosis: diagnosisFromTrialSummary(contextHint.trialId),
    failureReflection: failureReflection ? buildFailureReflectionSurface(failureReflection) : null,
    itemNamesById: content.maps.itemsById,
    sourceEventIds: eventMemory.sourceEventIds,
    debugNotes: [
      ...(recentDeltas.length === 0 ? ['No matching recent P1 delta; aftermath is conservative.'] : []),
      ...eventMemory.debugNotes,
    ],
  });
}
