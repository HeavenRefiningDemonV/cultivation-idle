import { LIVE_SURFACE_MANIFEST } from './liveSurfaceManifest.js';

export interface LiveSurfaceVisualManifest {
  schemaVersion: '7.5d-live-surface-visual-manifest';
  trackedSurfaces: string[];
  trackedStyleFiles: string[];
  trackedIconFiles: string[];
  noShiftControlTargets: Array<{
    file: string;
    selector: string;
    requiresUiNoShift: boolean;
  }>;
  bannedBlueRemnants: Array<{
    key: string;
    pattern: RegExp;
  }>;
  disallowedLayoutShiftProperties: string[];
  narrowExceptions: Array<{
    file: string;
    pattern: RegExp;
    reason: string;
  }>;
}

export const LIVE_SURFACE_VISUAL_MANIFEST: LiveSurfaceVisualManifest = {
  schemaVersion: '7.5d-live-surface-visual-manifest',
  trackedSurfaces: [...LIVE_SURFACE_MANIFEST.trackedSurfaceIds],
  trackedStyleFiles: [
    'src/components/BottomTabBar.scss',
    'src/ui/chrome/BottomNavDock.scss',
    'src/ui/chrome/NavDockButton.scss',
    'src/components/modals/OfflineProgressModal.scss',
    'src/components/modals/ManualSatchelModal.scss',
    'src/components/screens/CultivateScreen.scss',
    'src/components/screens/InventoryScreen.scss',
    'src/components/screens/ManualPavilionPanel.scss',
    'src/components/screens/world/buildings/CombatStyles.scss',
  ],
  trackedIconFiles: [
    'src/components/BottomTabBar.tsx',
    'src/ui/chrome/BottomNavDock.tsx',
    'src/ui/chrome/NavDockButton.tsx',
    'src/components/modals/ManualSatchelModal.tsx',
    'src/components/modals/OfflineProgressModal.tsx',
    'src/components/screens/InventoryScreen.tsx',
    'src/components/inventory/InventorySlotTile.tsx',
  ],
  noShiftControlTargets: [
    { file: 'src/ui/chrome/NavDockButton.tsx', selector: 'bottomTabBarButton', requiresUiNoShift: true },
    { file: 'src/components/modals/OfflineProgressModal.tsx', selector: 'offlineProgressModalContinueButton', requiresUiNoShift: true },
    { file: 'src/components/screens/InventoryScreen.tsx', selector: 'inventoryHeaderIconButton', requiresUiNoShift: true },
    { file: 'src/components/screens/InventoryScreen.tsx', selector: 'inventoryPocketButton', requiresUiNoShift: true },
    { file: 'src/components/inventory/InventorySlotTile.tsx', selector: 'inventorySlotTile', requiresUiNoShift: true },
  ],
  bannedBlueRemnants: [
    { key: 'dashboard_blue_500', pattern: /#0ea5e9|#0284c7|#3b82f6|#2563eb/i },
    { key: 'dashboard_blue_rgba', pattern: /rgba\(\s*59\s*,\s*130\s*,\s*246\s*,/i },
    { key: 'sky_blue_rgba', pattern: /rgba\(\s*125\s*,\s*211\s*,\s*252\s*,/i },
    { key: 'dark_blue_panels', pattern: /rgba\(\s*12\s*,\s*18\s*,\s*30\s*,|rgba\(\s*15\s*,\s*23\s*,\s*42\s*,/i },
  ],
  disallowedLayoutShiftProperties: [
    'border-width',
    'padding',
    'min-width',
    'min-height',
    'width',
    'height',
  ],
  narrowExceptions: [
    {
      file: 'src/components/screens/CultivateScreen.scss',
      pattern: /rgba\(\s*15\s*,\s*23\s*,\s*42\s*,\s*0\.28\s*\)/i,
      reason: 'Cultivation action button base border keeps a subtle neutral ink edge, not dashboard-blue chrome.',
    },
  ],
};
