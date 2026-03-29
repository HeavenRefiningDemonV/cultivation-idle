import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_UI_FX_SETTINGS,
  UI_FX_SETTINGS_STORAGE_KEY,
  readPersistedUiFxSettings,
  sanitizeUiFxSettingsLike,
  writePersistedUiFxSettings,
  type StorageLike,
} from '../../src/app/fx/uiFxSettingsStorage.js';

class MemoryStorage implements StorageLike {
  private readonly map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

void test('ui fx settings persistence: valid stored json round-trips', () => {
  const storage = new MemoryStorage();
  storage.setItem(UI_FX_SETTINGS_STORAGE_KEY, JSON.stringify({
    enabled: false,
    quality: 'low',
    allowAtmosphere: true,
    allowHeroFx: false,
  }));

  const result = readPersistedUiFxSettings(storage);
  assert.deepEqual(result, {
    enabled: false,
    quality: 'low',
    allowAtmosphere: true,
    allowHeroFx: false,
  });
});

void test('ui fx settings persistence: invalid json falls back to defaults', () => {
  const storage = new MemoryStorage();
  storage.setItem(UI_FX_SETTINGS_STORAGE_KEY, '{bad json}');

  assert.deepEqual(readPersistedUiFxSettings(storage), DEFAULT_UI_FX_SETTINGS);
});

void test('ui fx settings persistence: invalid values sanitize to defaults', () => {
  const result = sanitizeUiFxSettingsLike({
    enabled: 'yes',
    quality: 'ultra',
    allowAtmosphere: 1,
    allowHeroFx: null,
  });

  assert.deepEqual(result, DEFAULT_UI_FX_SETTINGS);
});

void test('ui fx settings persistence: missing storage returns defaults', () => {
  assert.deepEqual(readPersistedUiFxSettings(null), DEFAULT_UI_FX_SETTINGS);
});

void test('ui fx settings persistence: write persists only uiFx subgroup shape', () => {
  const storage = new MemoryStorage();
  writePersistedUiFxSettings({
    enabled: false,
    quality: 'high',
    allowAtmosphere: false,
    allowHeroFx: true,
  }, storage);

  const raw = storage.getItem(UI_FX_SETTINGS_STORAGE_KEY);
  assert.notEqual(raw, null);
  assert.deepEqual(JSON.parse(raw ?? '{}'), {
    enabled: false,
    quality: 'high',
    allowAtmosphere: false,
    allowHeroFx: true,
  });
});

void test('ui fx settings persistence: write does not throw when storage is unavailable', () => {
  assert.doesNotThrow(() => {
    writePersistedUiFxSettings(DEFAULT_UI_FX_SETTINGS, null);
  });
});
