import type { PavilionElderNoteSurface, PavilionRuntimeSnapshot } from './pavilionTypes.js';
import { PAVILION_FIXTURE_ELDER_NOTE } from './pavilionPresentation.js';

export function createFallbackPavilionRuntimeSnapshot(): PavilionRuntimeSnapshot {
  return {
    realm: 'Qi Condensation',
    path: 'No Path Selected',
    heartLaw: 'No Heart Law Selected',
    city: 'No City Available',
    milestone: 'Current Milestone Unknown',
    currentCityId: null,
    cityModules: [],
    recommendedEntryIds: [],
    medicineWeak: false,
    weaponFloorClose: false,
    loadoutComplete: false,
    priorLifeNotes: {},
    missingRuntimeData: [],
  };
}

export function buildPavilionElderNote(runtime: PavilionRuntimeSnapshot, mode: 'fixture' | 'live'): PavilionElderNoteSurface {
  if (mode === 'fixture') return PAVILION_FIXTURE_ELDER_NOTE;

  if (runtime.milestone.toLowerCase().includes('foundation') && runtime.medicineWeak) {
    return {
      title: 'Elder Note',
      body: 'Your foundation is close. Stock healing pills before challenging the gate.',
      checklist: [
        { id: 'medicine', label: 'Medicine weak', status: 'warning' },
        { id: 'weapon', label: runtime.weaponFloorClose ? 'Weapon floor close' : 'Weapon floor low', status: runtime.weaponFloorClose ? 'complete' : 'open' },
        { id: 'loadout', label: runtime.loadoutComplete ? 'Loadout complete' : 'Loadout incomplete', status: runtime.loadoutComplete ? 'complete' : 'open' },
      ],
    };
  }

  if (runtime.heartLaw === 'No Heart Law Selected') {
    return {
      title: 'Elder Note',
      body: 'Choose a Heart Law before judging the shape of this life.',
      checklist: [
        { id: 'doctrine', label: 'Doctrine incomplete', status: 'warning' },
        { id: 'path', label: runtime.path === 'No Path Selected' ? 'Path missing' : runtime.path, status: runtime.path === 'No Path Selected' ? 'warning' : 'complete' },
        { id: 'city', label: runtime.city, status: runtime.currentCityId ? 'complete' : 'open' },
      ],
    };
  }

  return {
    title: 'Elder Note',
    body: `${runtime.milestone}. Follow the strongest live route rather than chasing sealed records.`,
    checklist: [
      { id: 'milestone', label: runtime.milestone, status: 'complete' },
      { id: 'records', label: 'Records aligned', status: 'complete' },
      { id: 'route', label: runtime.currentCityId ? 'Route available' : 'Route missing', status: runtime.currentCityId ? 'complete' : 'warning' },
    ],
  };
}

