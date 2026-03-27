export interface LiveSurfaceManifest {
  schemaVersion: '7.5a-live-surface-manifest';
  notes: string[];
  trackedSurfaceIds: string[];
  trackedFiles: string[];
  narrowExceptions: Array<{
    file: string;
    reason: string;
  }>;
}

export const LIVE_SURFACE_MANIFEST: LiveSurfaceManifest = {
  schemaVersion: '7.5a-live-surface-manifest',
  notes: [
    'Audit scope is live/reachable semester player-facing surfaces.',
    'Internal ids and code variable names are not audit targets unless rendered to the player.',
  ],
  trackedSurfaceIds: [
    'cultivation',
    'status',
    'world',
    'gate_trial',
    'techniques',
    'manual_pavilion',
    'apothecary',
    'forge',
    'prestige',
    'current_chapter_exhausted',
    'life_summary',
    'settings',
    'inventory',
    'world_building_modal',
  ],
  trackedFiles: [
    'src/features/prestige/lifeSummarySurface.ts',
    'src/components/modals/WorldBuildingModal.tsx',
    'src/components/screens/InventoryScreen.tsx',
    'src/components/screens/SettingsScreen.tsx',
    'src/components/GameLayout.tsx',
    'src/ui/text/playerFacingLabels.ts',
    'src/ui/text/playerFacingFormatters.ts',
    'src/systems/ui/world/worldCommandSurface.ts',
    'src/systems/world/moduleCardRegistry.ts',
    'src/features/prestige/prestigeAdvisorSurface.ts',
  ],
  narrowExceptions: [
    {
      file: 'src/components/GameLayout.tsx',
      reason: 'Fallback branch is retained as a defensive unknown-tab guard but must stay release-safe.',
    },
  ],
};

export const LIVE_SURFACE_TRACKED_FILES = LIVE_SURFACE_MANIFEST.trackedFiles;
