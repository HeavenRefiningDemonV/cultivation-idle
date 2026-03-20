export type ExpeditionRouteModuleKey = 'apothecary' | 'forge' | 'manualPavilion';

export type ExpeditionRoutePurpose = {
  expeditionTypeId: 'forage' | 'mine' | 'scout';
  moduleKey: ExpeditionRouteModuleKey;
  moduleLabel: string;
  ctaLabel: string;
};

const ROUTE_PURPOSES: Record<ExpeditionRoutePurpose['expeditionTypeId'], ExpeditionRoutePurpose> = {
  forage: {
    expeditionTypeId: 'forage',
    moduleKey: 'apothecary',
    moduleLabel: 'Apothecary',
    ctaLabel: 'Open Apothecary',
  },
  mine: {
    expeditionTypeId: 'mine',
    moduleKey: 'forge',
    moduleLabel: 'Forge',
    ctaLabel: 'Open Forge',
  },
  scout: {
    expeditionTypeId: 'scout',
    moduleKey: 'manualPavilion',
    moduleLabel: 'Manual Pavilion',
    ctaLabel: 'Open Manual Pavilion',
  },
};

export function getLiveExpeditionRoutePurpose(expeditionTypeId: string): ExpeditionRoutePurpose | null {
  return ROUTE_PURPOSES[expeditionTypeId as keyof typeof ROUTE_PURPOSES] ?? null;
}

export function getLiveExpeditionRoutePurposes(): ExpeditionRoutePurpose[] {
  return Object.values(ROUTE_PURPOSES);
}
