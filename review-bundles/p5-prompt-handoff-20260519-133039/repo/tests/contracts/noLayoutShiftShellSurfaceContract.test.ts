import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('shared shell primitives keep explicit reserved slot semantics', () => {
  const frameCard = read('src/ui/shell/FrameCard.tsx');
  const plaqueHeader = read('src/ui/shell/PlaqueHeader.tsx');
  const topRibbon = read('src/ui/shell/TopRibbon.tsx');
  const inspectorPanel = read('src/ui/shell/InspectorPanel.tsx');
  const scenicLabel = read('src/ui/shell/ScenicLabel.tsx');

  assert.match(frameCard, /BadgeSlot preset="headerTrailing"/);
  assert.match(plaqueHeader, /BadgeSlot preset="headerTrailing"/);
  assert.match(topRibbon, /BadgeSlot preset="headerTrailing"/);
  assert.match(inspectorPanel, /emptyZoneBehavior = 'reserve'/);
  assert.match(scenicLabel, /reserveStateSlot = true/);
});

test('BottomNavDock keeps reserved indicator-slot policy without resizing nav buttons', () => {
  const dockTsx = read('src/ui/shell/BottomNavDock.tsx');
  const dockScss = read('src/ui/shell/BottomNavDock.scss');

  assert.match(dockTsx, /bottomNavDock__indicatorSlot/);
  assert.ok(dockScss.includes('.bottomNavDock__indicatorSlot'));
  assert.ok(dockScss.includes('inline-size: 0.85rem'));
  assert.ok(dockScss.includes('.bottomNavDock__button'));
  assert.ok(dockScss.includes('min-width: 7.3rem'));
});
