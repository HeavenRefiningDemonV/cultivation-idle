import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import type { SpiritRootProgressionDef, TechniqueDef } from '../../src/content/types.js';
import {
  CANONICAL_SPIRIT_ROOT_ELEMENTS,
  buildSpiritRootProgressionSnapshot,
  getSpiritRootPairKey,
  resolveRootHeartFit,
  resolveSpiritRootCombatProc,
} from '../../src/systems/spiritRoots/index.js';
import {
  MP4_TECHNIQUE_ROLE_CAPS,
  resolveTechniqueScalingSnapshot,
} from '../../src/systems/techniques/techniqueScalingResolver.js';
import { resolveTrainingSupportMultipliers, type TrainingReadOnlySnapshot } from '../../src/systems/training/index.js';
import type { SpiritRoot } from '../../src/types/index.js';

const contentPath = (...parts: string[]) =>
  path.resolve(process.cwd(), 'public/cultivation_idle_content_bible_v1_config', ...parts);

async function readJson<T>(fileName: string): Promise<T> {
  return JSON.parse(await readFile(contentPath(fileName), 'utf8')) as T;
}

function makeTrainingSnapshot(overrides: Record<string, number>) {
  const rows = Object.entries(overrides).map(([statId, rating]) => ({
    statId,
    displayName: statId,
    rating,
    xp: 0,
    xpToNext: 0,
    grade: 'transcendent' as const,
    cap: 100,
    capPct: 100,
    capState: 'capped' as const,
    category: 'path' as const,
    tier: 'core' as const,
  }));
  return {
    path: 'heaven',
    pathLabel: 'Heaven Path',
    roomTitle: 'Test Room',
    realmCap: 100,
    fatigue: 0,
    fatigueTier: 'fresh',
    fatigueDampening: 1,
    pathStats: rows,
    futureStats: [],
    regimensForPath: [],
    lockedRegimensForPath: [],
    activeRegimen: null,
    activeIntensity: null,
    currentBottleneck: rows[0] ?? null,
    pathFoundation: {
      label: 'Path Foundation',
      valueLabel: '100',
      averageRating: 100,
      grade: 'transcendent',
      progressPct: 100,
    },
    nextUnlock: null,
    supportMultipliers: resolveTrainingSupportMultipliers(),
    offlineSummary: null,
  } satisfies TrainingReadOnlySnapshot;
}

test('mp4 canonical spirit roots cover all live elements with bounded proc math', async () => {
  const roots = await readJson<{ roots: SpiritRootProgressionDef[] }>('spirit_roots.json');

  assert.deepEqual(CANONICAL_SPIRIT_ROOT_ELEMENTS, [
    'wood',
    'fire',
    'earth',
    'metal',
    'water',
    'wind',
    'lightning',
    'ice',
    'light',
    'shadow',
    'soul',
    'void',
    'time',
    'astral',
  ]);
  assert.deepEqual(roots.roots.map((root) => root.elementId).sort(), [...CANONICAL_SPIRIT_ROOT_ELEMENTS].sort());
  roots.roots.forEach((root) => {
    assert.equal(root.internalCooldownSec, 10, `${root.elementId} must use MP4 10s ICD`);
    assert.equal(root.procChanceCapPct, 18, `${root.elementId} must use MP4 18% cap`);
  });

  const fireRoot = roots.roots.find((root) => root.elementId === 'fire')!;
  const snapshot = buildSpiritRootProgressionSnapshot({
    root: { element: 'fire', grade: 5, purity: 92 } satisfies SpiritRoot,
    rootDef: fireRoot,
    selectedHeartLawId: 'heart_heaven_flame_manual',
    heartLawLevel: 16,
    rootResonance: 86,
    shape: 'single',
    unlockedVariantIds: [],
    trainingRatingsById: {},
    daoHeartClarity: 80,
    verseMastery: 80,
  });

  assert.equal(snapshot.elementId, 'fire');
  assert.equal(snapshot.awakening.state, 'radiant');
  assert.equal(snapshot.proc.cooldownSec, 10);
  assert.equal(snapshot.proc.chancePct, 18);
  assert.equal(snapshot.shape.effectPeakBonusPct, 18);
  assert.ok(snapshot.proc.effectStrength > 0);
  assert.equal(getSpiritRootPairKey('fire', 'heart_heaven_flame_manual'), 'fire::heart_heaven_flame_manual');
});

test('mp4 root combat proc is deterministic under forced roll and stays pure', () => {
  const proc = resolveSpiritRootCombatProc({
    now: 20_000,
    trigger: 'technique_damage',
    rollPct: 0,
    lastProcAtByElementId: {},
    snapshot: {
      elementId: 'metal',
      displayName: 'Metal Root',
      awakening: { state: 'open', procMultiplier: 1 },
      proc: {
        effectId: 'metal_keen_edge',
        procName: 'Keen Edge',
        chancePct: 12,
        cooldownSec: 10,
        effectStrength: 0.08,
      },
      variant: null,
      fit: resolveRootHeartFit({
        root: { grade: 3, element: 'metal', purity: 100 },
        heartLaw: null,
        currentRootResonance: 40,
        unlockedVariantIds: [],
      }),
      shape: { kind: 'single', effectPeakBonusPct: 18, offAffinityPenaltyPct: 8 },
      rows: [],
      hardLocksMismatchRoutes: false,
    },
  });

  assert.equal(proc.didProc, true);
  assert.equal(proc.effectId, 'metal_keen_edge');
  assert.equal(proc.nextLastProcAtByElementId.metal, 20_000);
  assert.ok(proc.modifiers.armorPenPct > 0);
  assert.match(proc.logLine ?? '', /Keen Edge/);
});

test('mp4 technique content has full scaling metadata and resolver caps bonuses', async () => {
  const techniques = await readJson<{ techniques: TechniqueDef[] }>('techniques.json');
  assert.equal(techniques.techniques.length, 60);
  assert.equal(techniques.techniques.filter((tech) => tech.scalingVersion === 'mp4_v1').length, 60);

  const cataclysm = techniques.techniques.find((tech) => tech.id === 'tech_heaven_heavenly_cataclysm')!;
  assert.equal(cataclysm.primaryScalingStatId, 'dao_resonance');
  assert.equal(cataclysm.secondaryScalingStatId, 'divine_sense');
  assert.equal(cataclysm.scalingRole, 'ultimate');
  assert.deepEqual(cataclysm.rootAffinityIds, ['fire', 'lightning']);

  const snapshot = makeTrainingSnapshot({
    dao_resonance: 200,
    divine_sense: 200,
  });
  const scaling = resolveTechniqueScalingSnapshot({
    technique: cataclysm,
    trainingSnapshot: snapshot,
    rootElementId: 'fire',
    rootResonance: 100,
    heartLawTags: ['fire'],
    heartLawLevel: 45,
  });

  assert.equal(MP4_TECHNIQUE_ROLE_CAPS.ultimate.maxTotalBonusPct, 34);
  assert.equal(scaling.cappedBonusPct, 34);
  assert.equal(scaling.totalMultiplier, 1.34);
  assert.equal(scaling.combatEffectActive, true);
});

test('mp4 adapters keep combat/reward/progression owners out of pure resolver modules', async () => {
  const checkedFiles = [
    'src/systems/spiritRoots/spiritRootCombatAdapter.ts',
    'src/systems/spiritRoots/spiritRootProgressionResolver.ts',
    'src/systems/spiritRoots/spiritRootVariantResolver.ts',
    'src/systems/techniques/techniqueScalingResolver.ts',
    'src/systems/equipment/equipmentHandlingResolver.ts',
    'src/systems/consumables/medicineHandlingResolver.ts',
  ];

  const source = (
    await Promise.all(checkedFiles.map((file) => readFile(path.resolve(process.cwd(), file), 'utf8')))
  ).join('\n');

  assert.doesNotMatch(source, /RewardService|grantRewards|useCombatStore|create<|startCombat|markCleared|recordFailure/);
});

test('mp4 CombatStore owns adapter application and root proc cooldown state', async () => {
  const source = await readFile(path.resolve(process.cwd(), 'src/stores/combatStore.ts'), 'utf8');

  assert.match(source, /resolveSpiritRootCombatProc/);
  assert.match(source, /resolveTechniqueScalingSnapshot/);
  assert.match(source, /resolveEquipmentHandlingSnapshot/);
  assert.match(source, /resolveMedicineHandlingSnapshot/);
  assert.match(source, /rootProcLastAtByElementId:\s*\{\}/);
  assert.match(source, /nextLastProcAtByElementId/);
  assert.match(source, /getEffectivePlayerCombatStats[\s\S]*resolveEquipmentHandlingSnapshot/);
  assert.match(source, /getTechniqueScaling[\s\S]*resolveTechniqueScalingSnapshot/);
  assert.match(source, /consumeCombatConsumable[\s\S]*resolveMedicineHandlingSnapshot/);
  assert.match(source, /resolveRootProcForCombat\('basic_attack'/);
  assert.match(source, /resolveRootProcForCombat\('technique_damage'/);
  assert.match(source, /resolveRootProcForCombat\('technique_heal'/);
  assert.match(source, /resolveRootProcForCombat\('technique_shield'/);
  assert.match(source, /resolveRootProcForCombat\('technique_buff'/);
  assert.match(source, /resolveRootProcForCombat\('incoming_damage'/);
  assert.match(source, /resolveRootProcForCombat\('medicine'/);
});
