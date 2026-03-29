import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { EXISTING_UI_ASSET_REUSE_MAP } from '../../src/assets/ui/reuse/existingUiAssetReuseMap.js';

const root = process.cwd();

void test('ui asset reuse map: required logical reuse categories are represented', () => {
  const hasFramePlaqueRibbon = EXISTING_UI_ASSET_REUSE_MAP.some(
    (asset) => asset.family === 'chrome' && ['frame', 'plaque', 'ribbon'].includes(asset.subfamily),
  );
  const hasPathBanner = EXISTING_UI_ASSET_REUSE_MAP.some(
    (asset) => asset.logicalName.includes('path_') || asset.intendedUse.toLowerCase().includes('path selection banner'),
  );
  const hasLotusSupport = EXISTING_UI_ASSET_REUSE_MAP.some(
    (asset) => asset.logicalName.includes('lotus') || asset.intendedUse.toLowerCase().includes('state indicator'),
  );
  const hasWorldModuleBackdrop = EXISTING_UI_ASSET_REUSE_MAP.some(
    (asset) => asset.subfamily === 'background' && asset.screenFamilies.some((family) => family === 'world' || family === 'module'),
  );

  assert.equal(hasFramePlaqueRibbon, true, 'frame/plaque/ribbon reuse should be represented');
  assert.equal(hasPathBanner, true, 'path/banner reuse should be represented');
  assert.equal(hasLotusSupport, true, 'lotus/support-indicator reuse should be represented');
  assert.equal(hasWorldModuleBackdrop, true, 'world/module background reuse should be represented');
});

void test('ui asset reuse map: source paths are real and statuses/notes are honest', () => {
  EXISTING_UI_ASSET_REUSE_MAP.forEach((asset) => {
    assert.equal(asset.status, 'existing-reused', `${asset.id} should be existing-reused`);
    assert.equal(typeof asset.sourcePath, 'string', `${asset.id} should define sourcePath`);
    const sourcePath = path.join(root, asset.sourcePath as string);
    assert.equal(fs.existsSync(sourcePath), true, `${asset.id} source path must exist: ${asset.sourcePath}`);

    assert.equal(asset.notes.length > 0, true, `${asset.id} should include notes`);
    assert.equal(asset.notes.join(' ').trim().length > 10, true, `${asset.id} notes should be meaningful`);

    if (asset.sourcePath?.startsWith('src/assets/ui/')) {
      assert.equal(fs.existsSync(path.join(root, asset.sourcePath)), true, `${asset.id} ui source path must be real`);
    }

    assert.equal(asset.sourcePath?.includes('fake'), false, `${asset.id} should not use fake source paths`);
    assert.equal(asset.sourcePath?.includes('placeholder'), false, `${asset.id} should not use fake placeholder source paths`);
  });
});
