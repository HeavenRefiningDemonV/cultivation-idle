import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('persistent shell selector hygiene', () => {
  it('Sidebar uses atomic store selectors for persistent state', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/Sidebar.tsx'), 'utf8');

    assert.equal(source.includes('useUIStore()'), false);
    assert.equal(source.includes('useGameStore()'), false);
    assert.match(source, /useUIStore\(\(state\) => state\.activeTab\)/);
    assert.match(source, /useGameStore\(\(state\) => state\.totalAuras\)/);
  });

  it('Header selects current-city bounty data instead of whole bounty/content maps', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/Header.tsx'), 'utf8');

    assert.equal(source.includes('state.trackedByCityId);'), false);
    assert.equal(source.includes('state.activeByCityId);'), false);
    assert.equal(source.includes('state.maps.citiesById);'), false);
    assert.match(source, /state\.trackedByCityId\[currentCityId\]/);
    assert.match(source, /state\.activeByCityId\[currentCityId\]/);
    assert.match(source, /state\.maps\.citiesById\[currentCityId\]/);
  });
});
