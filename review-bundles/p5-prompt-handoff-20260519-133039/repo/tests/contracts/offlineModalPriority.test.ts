import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('offline progress modal takes priority over life start wizard', () => {
  const source = readFileSync('src/components/GameLayout.tsx', 'utf8');

  assert.match(source, /const shouldShowOfflineProgress =[\s\S]*showOfflineProgressModal[\s\S]*showOfflineModalSetting[\s\S]*!suppressExactCaptureChrome/);
  assert.match(source, /const shouldShowLifeStartWizard =[\s\S]*!shouldDelayLifeStartForStory[\s\S]*!shouldShowOfflineProgress/);
  assert.match(source, /\{shouldShowOfflineProgress && <OfflineProgressModal \/>\}/);
  assert.match(source, /\{shouldShowLifeStartWizard && <LifeStartWizardModal \/>\}/);
});

test('offline progress modal renders above other blocking modal overlays', () => {
  const source = readFileSync('src/components/modals/OfflineProgressModal.scss', 'utf8');

  assert.match(source, /\.offlineProgressModalOverlay \{[\s\S]*z-index: 2400;/);
});

test('offline progress modal trust rows use explicit label value detail columns', () => {
  const modalSource = readFileSync('src/components/modals/OfflineProgressModal.tsx', 'utf8');
  const styleSource = readFileSync('src/components/modals/OfflineProgressModal.scss', 'utf8');

  assert.match(modalSource, /offlineProgressModalTrustLabel/);
  assert.match(modalSource, /offlineProgressModalTrustValue/);
  assert.match(modalSource, /offlineProgressModalTrustDetail/);
  assert.match(styleSource, /\.offlineProgressModalTrustRow \{[\s\S]*grid-template-columns:/);
  assert.doesNotMatch(modalSource, /<span>\{source\.label\}<\/span>\s*<span>\{source\.value\}<\/span>/);
  assert.doesNotMatch(modalSource, /<span>\{reason\.label\}<\/span>\s*<span>\{reason\.detail\}<\/span>/);
});
