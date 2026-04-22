function assetUrl(relativePath: string): string {
  return new URL(relativePath, import.meta.url).href;
}

export const OUTSKIRTS_ASSETS = {
  scenic: {
    approvedMockup: assetUrl('../../../assets/mockups/ChatGPT Image Apr 17, 2026, 04_24_04 PM.png'),
    cityOutskirtsBackdrop: assetUrl('../../../assets/background/citystates/city_outskirts.png'),
    wolfEnemy: assetUrl('../../../assets/enemies/wolfpup.png'),
  },
  stripArt: {
    wolfEnemy: assetUrl('../../../assets/enemies/wolfpup.png'),
    boarEnemy: assetUrl('../../../assets/enemies/widboar.png'),
    slimeEnemy: assetUrl('../../../assets/enemies/slime.png'),
    forestRabbitEnemy: assetUrl('../../../assets/enemies/forestrabbit.png'),
    spiritDeerEnemy: assetUrl('../../../assets/enemies/spiritdeer.png'),
    cityOutskirtsBackdrop: assetUrl('../../../assets/background/citystates/city_outskirts.png'),
  },
  icons: {
    tactical: {
      hp: assetUrl('../../../assets/icons/foundationpill.png'),
      danger: assetUrl('../../../assets/icons/dust_green.png'),
      loadout: assetUrl('../../../assets/icons/rustysword.png'),
      aiProfile: assetUrl('../../../assets/icons/book_martial.png'),
      healing: assetUrl('../../../assets/icons/hourglass_progress.png'),
      bounty: assetUrl('../../../assets/menus/scroll.png'),
      expedition: assetUrl('../../../assets/icons/task_complete.png'),
    },
    setupPrimary: {
      loadoutSet: assetUrl('../../../assets/icons/foundationpill.png'),
      aiProfile: assetUrl('../../../assets/icons/book_martial.png'),
      attackFocus: assetUrl('../../../assets/icons/rustysword.png'),
    },
    setupStats: {
      atk: assetUrl('../../../assets/icons/rustysword.png'),
      acc: assetUrl('../../../assets/icons/foundationpill.png'),
      crit: assetUrl('../../../assets/icons/dust_brown.png'),
      hp: assetUrl('../../../assets/icons/foundationpill.png'),
      eva: assetUrl('../../../assets/icons/spiritgrass.png'),
      res: assetUrl('../../../assets/icons/metalchunk.png'),
    },
    setupEquipment: {
      weapon: assetUrl('../../../assets/icons/rustysword.png'),
      armor: assetUrl('../../../assets/icons/book_heaven.png'),
      ring: assetUrl('../../../assets/icons/placeholder_ring_small.png'),
      talisman: assetUrl('../../../assets/icons/prayerbeads.png'),
      boots: assetUrl('../../../assets/icons/spiritgrass.png'),
      charm: assetUrl('../../../assets/icons/jadesword.png'),
    },
    setupPouch: assetUrl('../../../assets/icons/hourglass_empty.png'),
    rewards: {
      goldHeadline: assetUrl('../../../assets/icons/artifactbundle.png'),
      materials: {
        'wolf-pelt': assetUrl('../../../assets/icons/beastblood.png'),
        'beast-bone': assetUrl('../../../assets/icons/metalchunk.png'),
        'green-herb': assetUrl('../../../assets/icons/herbbundle.png'),
        'spirit-stone': assetUrl('../../../assets/icons/artifactshard.png'),
      },
      materialsFallback: assetUrl('../../../assets/icons/dust_brown.png'),
    },
    grindSummary: {
      runs: assetUrl('../../../assets/icons/task_complete.png'),
      gold: assetUrl('../../../assets/icons/artifactbundle.png'),
      drop: assetUrl('../../../assets/icons/beastblood.png'),
    },
  },
} as const;

export type OutskirtsAssetRegistry = typeof OUTSKIRTS_ASSETS;
