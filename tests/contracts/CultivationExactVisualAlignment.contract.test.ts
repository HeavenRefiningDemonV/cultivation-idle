import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function read(relativePath: string) {
  return readFileSync(relativePath, 'utf8');
}

function cssBlock(source: string, selector: string): string {
  const start = source.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `missing CSS selector ${selector}`);
  const end = source.indexOf('\n}', start);
  assert.notEqual(end, -1, `missing CSS close for ${selector}`);
  return source.slice(start, end);
}

void test('Cultivation exact visual repair keeps dantian FX and qi rail on explicit contracts', () => {
  const screen = read('src/features/cultivation/exact/CultivationExactScreen.tsx');
  const styles = read('src/features/cultivation/exact/CultivationExactScreen.scss');
  const fxScene = read('src/ui/fx/scenes/CultivationFxScene.tsx');

  assert.match(screen, /data-testid="cultivation-dantian-anchor"/);
  assert.match(screen, /data-testid="cultivation-qi-lane"/);
  assert.match(screen, /cultivationExactAuraAnchor/);
  assert.match(screen, /cultivationExactRitualStack/);
  assert.match(screen, /cultivationExactLowerAtmosphere/);
  assert.match(screen, /ritualStackRef/);
  assert.match(screen, /heroPlateRef/);
  assert.match(screen, /--cult-exact-dantian-cx/);
  assert.match(screen, /--cult-exact-ritual-top/);
  assert.match(screen, /navTop - stackHeight/);
  assert.doesNotMatch(screen, /cultivationExactCommandButton__ornament/);
  assert.doesNotMatch(screen, /data-region="life-cycle-whisper"/);

  assert.match(styles, /\.cultivationExactRitualStack\s*\{[\s\S]*left:\s*var\(--cult-exact-dantian-cx\)[\s\S]*top:\s*var\(--cult-exact-ritual-top\)/);
  assert.match(styles, /\.cultivationExactHeroPlate\s*\{[\s\S]*left:\s*calc\(50vw - var\(--cult-exact-page-x\) - var\(--cult-exact-left-w\) - var\(--cult-exact-gap\)\)[\s\S]*translateX\(-55\.75%\)/);
  assert.match(styles, /\.cultivationExactAltarTrim\s*\{[\s\S]*left:\s*var\(--dantian-anchor-x\)[\s\S]*transform:\s*translateX\(-50%\)/);
  assert.match(styles, /\.cultivationExactLowerAtmosphere\s*\{[\s\S]*pointer-events:\s*none/);
  assert.doesNotMatch(styles, /--cult-exact-stack-y-lift/);
  assert.doesNotMatch(styles, /--cult-exact-stack-x-nudge/);
  assert.doesNotMatch(styles, /top:\s*clamp\(680px,\s*61vh,\s*760px\)/);

  assert.match(styles, /--qi-rail-track-left/);
  assert.match(styles, /--qi-rail-track-right/);
  assert.match(styles, /\.cultivationExactQiRail__track\s*\{[\s\S]*left:\s*var\(--qi-rail-track-left\)[\s\S]*right:\s*var\(--qi-rail-track-right\)/);
  const trackBlock = cssBlock(styles, '.cultivationExactQiRail__track');
  assert.doesNotMatch(trackBlock, /width:\s*900px/);
  const fillBlock = cssBlock(styles, '.cultivationExactQiRail__fill');
  assert.match(fillBlock, /right:\s*auto/);
  assert.match(fillBlock, /width:\s*min\(var\(--cult-exact-qi-pct\),\s*100%\)/);
  assert.doesNotMatch(fillBlock, /inset:\s*0/);

  assert.match(fxScene, /anchorX\?:\s*number/);
  assert.match(fxScene, /anchorY\?:\s*number/);
  assert.match(fxScene, /resolvedCenterY/);
  assert.doesNotMatch(fxScene, /shortestSide\s*\*\s*0\.12/);
});

void test('Cultivation exact shell removes bottom rail chrome and tiny lotus fixed size', () => {
  const bottomTabBar = read('src/components/BottomTabBar.tsx');
  const bottomNav = read('src/ui/shell/BottomNavDock.scss');
  const gameLayout = read('src/components/GameLayout.scss');
  const lotus = read('src/ui/cultivation/QiLotusIcon.scss');
  const verse = read('src/ui/cultivation/VerseMiniBar.scss');
  const surface = read('src/features/cultivation/exact/buildCultivationExactSurface.ts');

  assert.match(bottomTabBar, /bottomNavDock--cultivationBare/);
  assert.match(bottomNav, /\.bottomNavDock--cultivationBare\s*\{[\s\S]*bottom:\s*clamp\(28px,\s*3\.3vh,\s*42px\)[\s\S]*padding:\s*0/);
  assert.match(bottomNav, /\.bottomNavDock--cultivationBare \.bottomNavDock__rail\s*\{[\s\S]*overflow:\s*visible[\s\S]*background:\s*transparent[\s\S]*box-shadow:\s*none/);
  assert.doesNotMatch(bottomNav, /\.bottomNavDock--cultivationBare[\s\S]*overflow-x:\s*auto/);
  assert.match(gameLayout, /\.gameLayoutRoot--cultivation \.gameLayoutContent\s*\{[\s\S]*height:\s*100vh/);

  assert.match(lotus, /\.qiLotusIcon\[data-fixed="1"\]\s*\{[\s\S]*width:\s*var\(--qi-lotus-size,\s*36px\)/);
  assert.doesNotMatch(lotus, /\.qiLotusIcon\[data-fixed="1"\]\s*\{[\s\S]*width:\s*20px/);
  assert.match(verse, /--qi-lotus-size:\s*clamp\(34px,\s*2\.15vw,\s*42px\)/);

  assert.doesNotMatch(surface, /Life Cycle/);
  assert.match(surface, /visible:\s*false/);
});
