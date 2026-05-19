import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

import type { HeartLawDef, HeartLawsConfig } from '../../src/content/types.js';
import { buildHeartLawCatalogFromDefinitions } from '../../src/systems/doctrine/heartLawCatalog.js';
import { buildHeartLawSelectionPresentation, mapResonanceTierToCardLabel } from '../../src/systems/doctrine/heartLawSelectionPresentation.js';
import { evaluateSpiritRootResonance } from '../../src/systems/doctrine/spiritRootResonance.js';
import { getHeartLawUnlockInfo } from '../../src/systems/heartLaw/heartLawUnlockInfo.js';

const heartLawConfig = JSON.parse(
  fs.readFileSync('public/cultivation_idle_content_bible_v1_config/heart_laws.json', 'utf-8'),
) as HeartLawsConfig;

const laws = heartLawConfig.heartLaws;
const catalog = buildHeartLawCatalogFromDefinitions(laws, heartLawConfig.affinityRules);

function buildPresentation(law: HeartLawDef) {
  const profile = catalog[law.id] ?? null;
  const resonanceTier = evaluateSpiritRootResonance({ element: 'fire', grade: 3, purity: 50 }, profile).tier;

  return buildHeartLawSelectionPresentation(law, {
    profile,
    unlockInfo: getHeartLawUnlockInfo(law.tier),
    resonanceTier,
    isUnlocked: true,
    isSelected: false,
  });
}

test('every live heart law has family, tier, resonance labels, and <= 3 tags', () => {
  for (const law of laws) {
    const presentation = buildPresentation(law);
    assert.ok(presentation.familyLabel.trim().length > 0);
    assert.ok(presentation.tierLabel.trim().length > 0);
    assert.ok(presentation.resonanceLabel.trim().length > 0);
    assert.ok(presentation.roleLine.trim().length > 0);
    assert.ok(presentation.tagLabels.length <= 3);
  }
});

test('resonance tier mapping preserves all four live tiers', () => {
  assert.equal(mapResonanceTierToCardLabel('strong'), 'Strong (+12%)');
  assert.equal(mapResonanceTierToCardLabel('partial'), 'Partial (+6%)');
  assert.equal(mapResonanceTierToCardLabel('neutral'), 'Neutral');
  assert.equal(mapResonanceTierToCardLabel('mismatch'), 'Weak (minor penalty)');
});

test('starter and locked prestige states resolve explicit status and unlock lines', () => {
  const starterLaw = laws.find((law) => (law.tier ?? 'starter') === 'starter');
  assert.ok(starterLaw, 'expected at least one starter law');

  const starterPresentation = buildHeartLawSelectionPresentation(starterLaw!, {
    profile: catalog[starterLaw!.id] ?? null,
    unlockInfo: { kind: 'starter' },
    resonanceTier: 'neutral',
    isUnlocked: true,
    isSelected: true,
  });

  assert.equal(starterPresentation.tierLabel, 'Starter');
  assert.equal(starterPresentation.unlockLine, 'Starter scripture available immediately.');
  assert.equal(starterPresentation.statusLabel, 'Chosen for This Life');
  assert.equal(starterPresentation.availabilityLine, 'Chosen for this life.');

  const lockedPresentation = buildHeartLawSelectionPresentation(starterLaw!, {
    profile: catalog[starterLaw!.id] ?? null,
    unlockInfo: { kind: 'prestige', upgradeId: 'x', upgradeName: 'Seal Breakthrough', apCost: 12 },
    resonanceTier: 'mismatch',
    isUnlocked: false,
    isSelected: false,
  });

  assert.equal(lockedPresentation.statusLabel, 'Locked Scripture');
  assert.equal(lockedPresentation.unlockLine, 'Locked until Seal Breakthrough (12 AP).');
  assert.equal(lockedPresentation.availabilityLine, 'Locked until Seal Breakthrough (12 AP).');
});

test('selected, available, and locked states keep canonical availability grammar', () => {
  const law = laws[0];
  const profile = catalog[law.id] ?? null;

  const selected = buildHeartLawSelectionPresentation(law, {
    profile,
    unlockInfo: { kind: 'starter' },
    resonanceTier: 'strong',
    isUnlocked: true,
    isSelected: true,
  });
  assert.equal(selected.statusLabel, 'Chosen for This Life');
  assert.equal(selected.availabilityLine, 'Chosen for this life.');

  const available = buildHeartLawSelectionPresentation(law, {
    profile,
    unlockInfo: { kind: 'prestige', upgradeId: 'u', upgradeName: 'Sky Ledger', apCost: 10 },
    resonanceTier: 'partial',
    isUnlocked: true,
    isSelected: false,
  });
  assert.equal(available.statusLabel, 'Available');
  assert.equal(available.availabilityLine, 'Unlocked and ready now.');

  const locked = buildHeartLawSelectionPresentation(law, {
    profile,
    unlockInfo: { kind: 'prestige', upgradeId: 'u', upgradeName: 'Sky Ledger', apCost: 10 },
    resonanceTier: 'mismatch',
    isUnlocked: false,
    isSelected: false,
  });
  assert.equal(locked.statusLabel, 'Locked Scripture');
  assert.equal(locked.availabilityLine, 'Locked until Sky Ledger (10 AP).');
});
