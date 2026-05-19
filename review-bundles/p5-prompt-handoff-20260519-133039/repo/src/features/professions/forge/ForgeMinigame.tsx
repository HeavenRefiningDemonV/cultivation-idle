import type { CraftSession, ForgeHandsOnBonus, ForgeSessionOutcome } from '../../../systems/crafting/craftingTypes.js';
import { ForgeHandsOnSession } from '../../../components/crafting/ForgeHandsOnSession.js';

export type ForgeMinigameProps = {
  session: CraftSession;
  now: number;
  blueprintName?: string;
  bonus?: ForgeHandsOnBonus;
  onOutcome?: (outcome: ForgeSessionOutcome) => void;
};

export function ForgeMinigame({ session, now, blueprintName, bonus, onOutcome }: ForgeMinigameProps) {
  return (
    <ForgeHandsOnSession
      session={session}
      now={now}
      blueprintName={blueprintName}
      bonus={bonus}
      onOutcome={onOutcome}
    />
  );
}
