export interface BuildOutskirtsActionStripStateArgs {
  isOutskirtsActive: boolean;
  killsSinceBoss: number;
  killsToBoss: number;
  autoContinue: boolean;
  stopAtBoss: boolean;
}

export interface OutskirtsActionStripState {
  primaryActionLabel: 'Start' | 'Stop';
  primaryActionTone: 'start' | 'stop';
  progressLabel: string;
  bossStatusLabel: string;
  loopToggleLines: [string, string];
}

export function buildOutskirtsActionStripState(args: BuildOutskirtsActionStripStateArgs): OutskirtsActionStripState {
  const targetKills = Math.max(1, args.killsToBoss);
  const currentKills = Math.max(0, args.killsSinceBoss);
  const remainingKills = Math.max(0, targetKills - currentKills);
  return {
    primaryActionLabel: args.isOutskirtsActive ? 'Stop' : 'Start',
    primaryActionTone: args.isOutskirtsActive ? 'stop' : 'start',
    progressLabel: `Hunt Progress ${Math.min(currentKills, targetKills)} / ${targetKills}`,
    bossStatusLabel: remainingKills === 0
      ? 'Boss available now'
      : `Boss in ${remainingKills} ${remainingKills === 1 ? 'kill' : 'kills'}`,
    loopToggleLines: [
      `Auto-continue: ${args.autoContinue ? 'On' : 'Off'}`,
      `Stop at boss: ${args.stopAtBoss ? 'On' : 'Off'}`,
    ],
  };
}
