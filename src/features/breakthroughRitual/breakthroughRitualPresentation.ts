export function formatRealmLesson(toRealmName: string): { lessonTitle: string; lessonDetail: string; primaryModuleLabel: string } {
  if (/Foundation/i.test(toRealmName)) {
    return {
      lessonTitle: 'Vessel stabilized',
      lessonDetail: 'The body becomes a floor for Forge and medicine preparation.',
      primaryModuleLabel: 'Forge',
    };
  }
  if (/Core/i.test(toRealmName)) {
    return {
      lessonTitle: 'Core condensed',
      lessonDetail: 'Build identity, mastery, and manual depth now carry more weight.',
      primaryModuleLabel: 'Manual Pavilion',
    };
  }
  if (/Nascent/i.test(toRealmName)) {
    return {
      lessonTitle: 'Nascent Soul awakened',
      lessonDetail: 'Doctrine and survival pressure become the main lesson.',
      primaryModuleLabel: 'Apothecary',
    };
  }
  if (/Soul Formation/i.test(toRealmName)) {
    return {
      lessonTitle: 'Soul structure formed',
      lessonDetail: 'The path now tests broad support rather than one repair.',
      primaryModuleLabel: 'Ruins',
    };
  }
  if (/Spirit Severing/i.test(toRealmName)) {
    return {
      lessonTitle: 'Limitation severed',
      lessonDetail: 'The current authored chapter is complete; Reincarnation is the honest handoff.',
      primaryModuleLabel: 'Reincarnation',
    };
  }
  return {
    lessonTitle: 'Realm crossed',
    lessonDetail: 'The world phase updated around the new realm.',
    primaryModuleLabel: 'Mandate Route',
  };
}

export function statLabel(statId: string): string {
  const explicit: Record<string, string> = {
    hp: 'Current HP',
    maxHp: 'Max HP',
    atk: 'Attack',
    def: 'Defense',
    regen: 'Regeneration',
    crit: 'Crit',
    critDmg: 'Crit Damage',
    dodge: 'Dodge',
    speed: 'Speed',
  };
  return explicit[statId] ?? statId.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase());
}
