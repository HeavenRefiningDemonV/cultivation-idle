import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function readSourceFiles(dir: string): Array<{ filePath: string; text: string }> {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return [];
  const entries: Array<{ filePath: string; text: string }> = [];
  for (const name of readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      entries.push(...readSourceFiles(fullPath));
      continue;
    }
    if (/\.(ts|tsx)$/.test(name)) {
      entries.push({ filePath: fullPath, text: readFileSync(fullPath, 'utf8') });
    }
  }
  return entries;
}

function sourceWithoutAllowedLegacyLifePathReads(entries: Array<{ filePath: string; text: string }>): string {
  return entries.map((entry) => {
    if (entry.filePath.endsWith(path.join('src', 'systems', 'onboarding', 'onboardingMigration.ts'))) {
      return entry.text
        .replace(/const legacyLifePath = typeof gameState\.lifePath === 'string' \? gameState\.lifePath : null;/g, '')
        .replace(/selectedPath \|\| legacyLifePath/g, 'selectedPath');
    }
    return entry.text;
  }).join('\n');
}

test('onboarding systems do not own combat, rewards, gate entry, or life path truth', () => {
  const onboardingFiles = readSourceFiles(path.resolve(process.cwd(), 'src/systems/onboarding'));
  const onboardingSource = onboardingFiles.map((entry) => `\n// ${entry.filePath}\n${entry.text}`).join('\n');
  const sourceWithoutLegacyAliasReads = sourceWithoutAllowedLegacyLifePathReads(onboardingFiles);

  assert.equal(/RewardService\.grantRewards|grantRewards\(/.test(onboardingSource), false, 'onboarding must not grant rewards');
  assert.equal(/startCombat\(|resolveCombat\(|completeCombat\(/.test(onboardingSource), false, 'onboarding must not own combat resolution');
  assert.equal(/gateItemId[^\n]*(required|entry|proof)/i.test(onboardingSource), false, 'gateItemId must not become onboarding trial-entry proof');
  assert.equal(/lifePath/.test(sourceWithoutLegacyAliasReads), false, 'lifePath must not reappear as onboarding mechanical truth outside legacy migration input');
});

test('Gate Trial exact screen does not complete M10 or trigger breakthrough directly', () => {
  const gateTrialSource = readSourceFiles(path.resolve(process.cwd(), 'src/features/world/gateTrialExact'))
    .map((entry) => `\n// ${entry.filePath}\n${entry.text}`)
    .join('\n');

  assert.equal(/completeMilestone\(['"]M10_foundation_graduation/.test(gateTrialSource), false);
  assert.equal(/progression\/breakthrough_completed/.test(gateTrialSource), false);
  assert.equal(/breakThrough\(|breakthrough\(/i.test(gateTrialSource), false);
});
