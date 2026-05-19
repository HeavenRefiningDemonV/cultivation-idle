import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

import type { HeartLawsConfig } from '../../src/content/types.js';
import { buildHeartLawCatalogFromDefinitions } from '../../src/systems/doctrine/heartLawCatalog.js';
import { buildHeartLawSelectionPresentation } from '../../src/systems/doctrine/heartLawSelectionPresentation.js';

const heartLawConfig = JSON.parse(
  fs.readFileSync('public/cultivation_idle_content_bible_v1_config/heart_laws.json', 'utf-8'),
) as HeartLawsConfig;

const laws = heartLawConfig.heartLaws;
const catalog = buildHeartLawCatalogFromDefinitions(laws, heartLawConfig.affinityRules);

test('detail presentation provides non-empty title/family/resonance/fantasy/practical fields', () => {
  for (const law of laws) {
    const presentation = buildHeartLawSelectionPresentation(law, {
      profile: catalog[law.id] ?? null,
      unlockInfo: { kind: 'starter' },
      resonanceTier: 'neutral',
      isUnlocked: true,
      isSelected: false,
    });

    assert.ok(presentation.label.trim().length > 0);
    assert.ok(presentation.familyLabel.trim().length > 0);
    assert.ok(presentation.resonanceLabel.trim().length > 0);
    assert.ok(presentation.resonanceDetail.trim().length > 0);
    assert.ok(presentation.roleLine.trim().length > 0);
    assert.ok(presentation.fantasyDescription.trim().length > 0);
    assert.ok(presentation.practicalDescription.trim().length > 0);
    assert.ok(presentation.availabilityLine.trim().length > 0);
    assert.ok(presentation.ctaLabel.trim().length > 0);
    assert.ok(presentation.keyBenefits.length <= 3);
  }
});

test('locked and starter detail states provide explicit unlock lines and cta states', () => {
  const law = laws[0];

  const starter = buildHeartLawSelectionPresentation(law, {
    profile: catalog[law.id] ?? null,
    unlockInfo: { kind: 'starter' },
    resonanceTier: 'partial',
    isUnlocked: true,
    isSelected: true,
  });

  assert.equal(starter.unlockLine, 'Starter scripture available immediately.');
  assert.equal(starter.availabilityLine, 'Chosen for this life.');
  assert.equal(starter.ctaLabel, 'Chosen for This Life');
  assert.equal(starter.ctaDisabledReason, null);

  const locked = buildHeartLawSelectionPresentation(law, {
    profile: catalog[law.id] ?? null,
    unlockInfo: { kind: 'prestige', upgradeId: 'u', upgradeName: 'Astral Threshold', apCost: 18 },
    resonanceTier: 'mismatch',
    isUnlocked: false,
    isSelected: false,
  });

  assert.equal(locked.unlockLine, 'Locked until Astral Threshold (18 AP).');
  assert.equal(locked.availabilityLine, 'Locked until Astral Threshold (18 AP).');
  assert.equal(locked.ctaLabel, 'Locked Scripture');
  assert.equal(locked.ctaDisabledReason, 'Locked until Astral Threshold (18 AP).');
});

test('detail presentation does not require fake progress fields', () => {
  const law = laws[0];
  const presentation = buildHeartLawSelectionPresentation(law, {
    profile: catalog[law.id] ?? null,
    unlockInfo: { kind: 'starter' },
    resonanceTier: 'strong',
    isUnlocked: true,
    isSelected: false,
  }) as unknown as Record<string, unknown>;

  assert.equal('eta' in presentation, false);
  assert.equal('currentChapter' in presentation, false);
  assert.equal('comprehension' in presentation, false);
});
