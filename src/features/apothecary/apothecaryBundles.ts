import type { RewardCurrencyBundle, RewardItemBundle } from '../../services/rewards/types';

export type ApothecaryBundle = {
  id: string;
  name: string;
  description: string;
  cost: RewardCurrencyBundle;
  items: RewardItemBundle[];
};

export const apothecaryBundles: ApothecaryBundle[] = [
  {
    id: 'bundle_combat_starter_t1',
    name: 'Combat Starter Kit',
    description: 'A simple pack of fight-night basics.',
    cost: { gold: '1200' },
    items: [
      { itemId: 'cons_healing_pellet_t1', qty: 25 },
      { itemId: 'cons_ironblood_pellet_t1', qty: 15 },
      { itemId: 'cons_windstep_powder_t1', qty: 10 },
      { itemId: 'cons_ward_salt_t1', qty: 10 },
      { itemId: 'cons_antivenom_pellet_t1', qty: 5 },
    ],
  },
  {
    id: 'bundle_cultivation_starter_t1',
    name: 'Cultivation Starter Kit',
    description: 'Steady breathing, steady progress.',
    cost: { gold: '1000' },
    items: [
      { itemId: 'cons_qi_elixir_t1', qty: 25 },
      { itemId: 'cons_meridian_warmth_draft_t1', qty: 10 },
      { itemId: 'cons_quiet_breath_tea_t1', qty: 10 },
      { itemId: 'cons_purity_elixir_t1', qty: 2 },
    ],
  },
];
