export type GameIconKey =
  | 'manual_neutral'
  | 'manual_combat'
  | 'manual_cultivation'
  | 'technique_generic';

export interface GameIconDefinition {
  key: GameIconKey;
  path: string;
}

export const GAME_ICON_REGISTRY: Record<GameIconKey, GameIconDefinition> = {
  manual_neutral: {
    key: 'manual_neutral',
    path: 'M6 4h10l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm9 1.5V9h3.5',
  },
  manual_combat: {
    key: 'manual_combat',
    path: 'M12 4 7 9l5 11 5-11-5-5Zm0 4.2 2.3 2.2-2.3 5.4-2.3-5.4L12 8.2Z',
  },
  manual_cultivation: {
    key: 'manual_cultivation',
    path: 'M12 4c4.4 0 8 3.6 8 8 0 3.9-2.8 7.2-6.5 7.9V16h-3v3.9C6.8 19.2 4 15.9 4 12c0-4.4 3.6-8 8-8Z',
  },
  technique_generic: {
    key: 'technique_generic',
    path: 'M12 3 9 9l-6 3 6 3 3 6 3-6 6-3-6-3-3-6Z',
  },
};

export const DEFAULT_GAME_ICON: GameIconKey = 'manual_neutral';
