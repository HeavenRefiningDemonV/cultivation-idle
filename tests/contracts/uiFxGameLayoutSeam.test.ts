import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

void test('game layout seam: GameLayout imports seam and wraps active content host', () => {
  const source = read('src/components/GameLayout.tsx');

  assert.match(source, /GameLayoutFxSeam/);
  assert.match(source, /<GameLayoutFxSeam>[\s\S]*gameLayoutContent[\s\S]*\{renderContent\(\)\}[\s\S]*<\/GameLayoutFxSeam>/);
  assert.doesNotMatch(source, /ui\/fx\/pixi\/scenes/);
  assert.doesNotMatch(source, /ui\/fx\/pixi\/emitters/);
});

void test('game layout seam: seam file stamps screen-host contract', () => {
  const source = read('src/app/fx/GameLayoutFxSeam.tsx');
  const style = read('src/app/fx/GameLayoutFxSeam.scss');

  assert.match(source, /data-ui-fx-seam="screen-host"/);
  assert.match(style, /position:\s*relative/);
  assert.match(style, /isolation:\s*isolate/);
});

void test('game layout seam: overlay and modal hosts remain present', () => {
  const source = read('src/components/GameLayout.tsx');

  [
    'BottomTabBar',
    'CombatPresentationHost',
    'NotificationToasts',
    'OnboardingPromptHost',
    'CityArrivalBanner',
    'LifeStartWizardModal',
  ].forEach((token) => {
    assert.match(source, new RegExp(token));
  });
});
