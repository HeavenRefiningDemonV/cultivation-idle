import type { CraftSession, ForgeHandsOnBonus, ForgeSessionOutcome } from '../../../systems/crafting/craftingTypes';
import { ForgeHandsOnSession } from '../../../components/crafting/ForgeHandsOnSession';

export type ForgeMinigameProps = {
  session: CraftSession;
  now: number;
  blueprintName?: string;
  bonus?: ForgeHandsOnBonus;
  onOutcome?: (outcome: ForgeSessionOutcome) => void;
  onOpenDetails?: () => void;
};

export function ForgeMinigame({ session, now, blueprintName, bonus, onOutcome, onOpenDetails }: ForgeMinigameProps) {
  return (
    <ForgeHandsOnSession
      session={session}
      now={now}
      blueprintName={blueprintName}
      bonus={bonus}
      onOutcome={onOutcome}
      onOpenDetails={onOpenDetails}
    />
  );
}
