import bgAdventureMock from '../../assets/Adventure Screen.png';
import bgDungeonMock from '../../assets/Inside Dungeon.png';
import bgCultivationMock from '../../assets/Cultivation Screen.png';
import bgCultivationOldMock from '../../assets/Cultivation Screen (Old).png';
import bgPrestigeShopMock from '../../assets/Prestige Shop (doodle).png';
import barLong from '../../assets/bar_long.png';
import barShort from '../../assets/bar_short.png';
import block from '../../assets/block 1.png';
import blockFancy from '../../assets/block_fancy 1.png';
import common from '../../assets/common.png';
import rare from '../../assets/rare.png';
import epic from '../../assets/epic.png';
import legendary from '../../assets/legendary.png';
import commonRingGroup from '../../assets/common ring group.png';
import rareRingGroup from '../../assets/rare ring group.png';
import epicRingGroup from '../../assets/epic ring group.png';
import legendaryRingGroup from '../../assets/legendary ring group.png';
import frame from '../../assets/frame.png';
import gate from '../../assets/gate 1.png';
import platform from '../../assets/platform 1.png';
import platformBare from '../../assets/platform_bare 1.png';
import qiSign from '../../assets/qisign.png';
import cultivatorFront from '../../assets/cultivator.png';
import cultivatorBack from '../../assets/cultivator_backshots 1.png';
import wolfPup from '../../assets/wolfpup 1.png';
import slime from '../../assets/slime 1.png';
import mountainBig from '../../assets/mountain_big 1.png';
import mountain2 from '../../assets/mountain2 1.png';
import mountainsStyle1 from '../../assets/mountains_style1 1.png';
import mountainsStyle1Gray from '../../assets/mountains_style1_gray 1.png';
import treeMain from '../../assets/tree_main 1.png';
import treeBlack from '../../assets/tree1_black.png';
import treeGray from '../../assets/tree1_gray.png';
import placeholderRing from '../../assets/placeholder_ring 1.png';
import groupOne from '../../assets/Group 1.png';

export const images = {
  backgrounds: {
    // Pure environment backdrops for in-game scenes
    cultivation: mountainsStyle1Gray,
    adventure: mountainBig,
    dungeon: mountainBig,
  },
  sprites: {
    cultivatorFront,
    cultivatorBack,
    wolfPup,
    slime,
  },
  ui: {
    barLong,
    barShort,
    block,
    blockFancy,
    frame,
    gate,
    platform,
    platformBare,
    qiSign,
  },
  rarity: {
    common,
    rare,
    epic,
    legendary,
    commonRingGroup,
    rareRingGroup,
    epicRingGroup,
    legendaryRingGroup,
    placeholderRing,
  },
  environment: {
    mountainBig,
    mountain2,
    mountainsStyle1,
    mountainsStyle1Gray,
    treeMain,
    treeBlack,
    treeGray,
  },
  layouts: {
    // Reference-only mocks; do not use directly in UI
    cultivationMock: bgCultivationMock,
    adventureMock: bgAdventureMock,
    dungeonMock: bgDungeonMock,
    cultivationOldMock: bgCultivationOldMock,
    prestigeShopMock: bgPrestigeShopMock,
  },
  misc: {
    groupOne,
  },
} as const;

export type Images = typeof images;
export type ImageCategory = keyof Images;
export type ImageCategoryMap<T extends ImageCategory> = Images[T];
