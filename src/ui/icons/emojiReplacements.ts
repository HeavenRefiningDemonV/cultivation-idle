import type { IconId } from './iconRegistry';

type EmojiReplacement = {
  emoji: string;
  replacement: IconId;
  notes?: string;
};

export const EMOJI_REPLACEMENTS: EmojiReplacement[] = [
  { emoji: '\u2601\uFE0F', replacement: 'bookHeaven', notes: 'Heaven path' },
  { emoji: '\u26F0\uFE0F', replacement: 'bookEarth', notes: 'Earth path' },
  { emoji: '\u2694\uFE0F', replacement: 'bookMartial', notes: 'Martial path' },
  { emoji: '\u2694', replacement: 'jadeSword', notes: 'Weapon/attack context' },
  { emoji: '\u{1F48E}', replacement: 'placeholderRingSmall', notes: 'Accessory slot placeholder' },
  { emoji: '\u{1F4E6}', replacement: 'artifactBundle', notes: 'Loot bundle' },
  { emoji: '\u{1F48E}', replacement: 'artifactShard', notes: 'Shard/gem currency context' },
  { emoji: '\u{1F4B0}', replacement: 'dustBrown', notes: 'Gold/money' },
  { emoji: '\u{1F4AB}', replacement: 'dustPurple', notes: 'Intent/spirit/essence sparkle' },
  { emoji: '\u23F1\uFE0F', replacement: 'hourglassProgress', notes: 'Timer/stopwatch' },
  { emoji: '\u2705', replacement: 'taskComplete', notes: 'Completion' },
  { emoji: '\u{1F512}', replacement: 'inkLock', notes: 'Locked' },
  { emoji: '\u{1F504}', replacement: 'inkRefresh', notes: 'Refresh' },
  { emoji: '\u26A0\uFE0F', replacement: 'inkWarning', notes: 'Warning' },
  { emoji: '\u26A0', replacement: 'inkWarning', notes: 'Warning' },
  { emoji: '\u{1F6A7}', replacement: 'inkWip', notes: 'WIP/placeholder' },
  { emoji: '\u2764', replacement: 'inkHeart', notes: 'HP' },
  { emoji: '\u2764\uFE0F', replacement: 'inkHeart', notes: 'HP' },
  { emoji: '\u{1F6E1}', replacement: 'inkShield', notes: 'Defense' },
  { emoji: '\u26A1', replacement: 'inkBolt', notes: 'Bolt/speed/crit' },
  { emoji: '\u{1F300}', replacement: 'inkSwirl', notes: 'Dodge/qi flow' },
  { emoji: '\u{1F4A5}', replacement: 'inkBurst', notes: 'Crit/burst' },
  { emoji: '\u2728', replacement: 'inkSparkles', notes: 'Sparkles' },
  { emoji: '\u2713', replacement: 'inkCheck', notes: 'Affirmative check' },
  { emoji: '\u2717', replacement: 'inkX', notes: 'Negative mark' },
  { emoji: '\u274C', replacement: 'inkX', notes: 'Negative mark' },
];
