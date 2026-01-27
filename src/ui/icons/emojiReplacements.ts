import type { IconId } from './iconRegistry';

type EmojiReplacement = {
  emoji: string;
  replacement: IconId;
  notes?: string;
};

export const EMOJI_REPLACEMENTS: EmojiReplacement[] = [
  { emoji: '☁️', replacement: 'bookHeaven', notes: 'Heaven path' },
  { emoji: '⛰️', replacement: 'bookEarth', notes: 'Earth path' },
  { emoji: '⚔️', replacement: 'bookMartial', notes: 'Martial path' },
  { emoji: '⚔', replacement: 'jadeSword', notes: 'Weapon/attack context' },
  { emoji: '💎', replacement: 'placeholderRingSmall', notes: 'Accessory slot placeholder' },
  { emoji: '📦', replacement: 'artifactBundle', notes: 'Loot bundle' },
  { emoji: '💎', replacement: 'artifactShard', notes: 'Shard/gem currency context' },
  { emoji: '💰', replacement: 'dustBrown', notes: 'Gold/money' },
  { emoji: '💫', replacement: 'dustPurple', notes: 'Intent/spirit/essence sparkle' },
  { emoji: '⏱️', replacement: 'hourglassProgress', notes: 'Timer/stopwatch' },
  { emoji: '✅', replacement: 'taskComplete', notes: 'Completion' },
  { emoji: '🔒', replacement: 'inkLock', notes: 'Locked' },
  { emoji: '🔄', replacement: 'inkRefresh', notes: 'Refresh' },
  { emoji: '⚠️', replacement: 'inkWarning', notes: 'Warning' },
  { emoji: '⚠', replacement: 'inkWarning', notes: 'Warning' },
  { emoji: '🚧', replacement: 'inkWip', notes: 'WIP/placeholder' },
  { emoji: '❤', replacement: 'inkHeart', notes: 'HP' },
  { emoji: '❤️', replacement: 'inkHeart', notes: 'HP' },
  { emoji: '🛡', replacement: 'inkShield', notes: 'Defense' },
  { emoji: '⚡', replacement: 'inkBolt', notes: 'Bolt/speed/crit' },
  { emoji: '🌀', replacement: 'inkSwirl', notes: 'Dodge/qi flow' },
  { emoji: '💥', replacement: 'inkBurst', notes: 'Crit/burst' },
  { emoji: '✨', replacement: 'inkSparkles', notes: 'Sparkles' },
  { emoji: '✓', replacement: 'inkCheck', notes: 'Affirmative check' },
  { emoji: '✗', replacement: 'inkX', notes: 'Negative mark' },
  { emoji: '❌', replacement: 'inkX', notes: 'Negative mark' },
];
