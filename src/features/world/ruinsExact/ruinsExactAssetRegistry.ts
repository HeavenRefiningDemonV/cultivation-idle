export const RUINS_EXACT_SCENIC_ART_CONTRACT = {
  hollowLogDen: {
    status: 'deferred',
    reservedApprovedSourcePath: 'docs/release/qa/ui-cutover/ruins-exact/approved-mockup/ruins-hollow-log-den-approved-exact.png',
    reservedApprovedPlatePath: 'src/assets/world/ruins/hollow-log-den-scene-approved-plate.png',
    crop: {
      sourceWidth: 2048,
      sourceHeight: 1152,
      x: 362,
      y: 270,
      width: 1315,
      height: 595,
    },
    finalVisualAnchors: [
      'cultivator lower-left with lantern',
      'giant hollow root mouth',
      'mossy broken stone steps',
      'teal spirit-leaf glows',
      'right-side carved stonework',
      'distant final chest glint',
    ],
  },
} as const;

export const RUINS_EXACT_ASSETS = {
  chrome: {
    barShort: '/src/assets/menus/bar_short.png',
    barLong: '/src/assets/menus/bar_long.png',
    blockFancy: '/src/assets/menus/block_fancy.png',
  },
  icons: {
    tactical: {
      hp: '/src/assets/icons/foundationpill.png',
      depth: '/src/assets/icons/metalchunk.png',
      loadout: '/src/assets/icons/rustysword.png',
      aiProfile: '/src/assets/icons/book_martial.png',
      healing: '/src/assets/icons/hourglass_progress.png',
      bounty: '/src/assets/menus/scroll.png',
      expedition: '/src/assets/icons/task_complete.png',
    },

    targetedMaterials: {
      spiritLeaf: '/src/assets/icons/spiritgrass.png',
      beastMaterials: '/src/assets/icons/beastblood.png',
      coreFragmentAnchor: '/src/assets/icons/artifactshard.png',
      anchorChest: '/src/assets/icons/artifactbundle.png',
      genericMaterial: '/src/assets/icons/metalchunk.png',
    },

    summary: {
      rooms: '/src/assets/icons/task_complete.png',
      anchorChest: '/src/assets/icons/artifactbundle.png',
      pitySeal: '/src/assets/icons/artifactshard.png',
      spiritLeaf: '/src/assets/icons/spiritgrass.png',
    },
    kit: {
      loadoutSet: '/src/assets/icons/rustysword.png',
      aiProfile: '/src/assets/icons/book_martial.png',
      explorationFocus: '/src/assets/icons/spiritgrass.png',
      hp: '/src/assets/icons/foundationpill.png',
      eva: '/src/assets/icons/spiritgrass.png',
      res: '/src/assets/icons/metalchunk.png',
      medicinePouch: '/src/assets/icons/hourglass_empty.png',
      weapon: '/src/assets/icons/rustysword.png',
      manual: '/src/assets/icons/book_earth.png',
      ring: '/src/assets/icons/placeholder_ring_small.png',
      boots: '/src/assets/icons/task_complete.png',
      charm: '/src/assets/icons/prayerbeads.png',
      talisman: '/src/assets/icons/metalchunk.png',
    },
  },
} as const;
