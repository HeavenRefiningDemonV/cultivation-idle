import type { ReactNode } from 'react';

import type { CraftStep } from '../../systems/crafting/craftingTypes';
import forgeBackground from '../../assets/background/forgewide_empty.png';
import './ForgeWorkbenchScene.scss';

export type ForgePhaseKind = 'HEAT' | 'STRIKE' | 'SPECIAL' | 'FINISH';

type ForgeWorkbenchSceneProps = {
  stepType: CraftStep['type'] | undefined;
  heatSetting: number;
  hideWorkpiece?: boolean;
  phaseKind?: ForgePhaseKind;
  workpieceMoving?: boolean;
  workpieceCooling?: boolean;
  children?: ReactNode;
};

type WorkpieceStation = 'furnace' | 'anvil';

const getStationForStep = (stepType: CraftStep['type'] | undefined): WorkpieceStation => {
  switch (stepType) {
    case 'HEAT_MATERIAL':
    case 'TEMPER':
    case 'HEAT_TO':
      return 'furnace';
    case 'HAMMER_PATTERN':
    case 'ENGRAVE_RUNE':
    case 'CAST_OR_SHAPE':
    case 'ALLOY_MIX':
    case 'FINISH':
    case 'QUENCH':
    default:
      return 'anvil';
  }
};

const getStationForPhase = (phaseKind: ForgePhaseKind | undefined, stepType: CraftStep['type'] | undefined): WorkpieceStation => {
  if (!phaseKind) return getStationForStep(stepType);
  return phaseKind === 'HEAT' ? 'furnace' : 'anvil';
};

const getHeatLevel = (heatSetting: number): 'low' | 'mid' | 'high' => {
  if (heatSetting >= 800) return 'high';
  if (heatSetting >= 450) return 'mid';
  return 'low';
};

export function ForgeWorkbenchScene({
  stepType,
  heatSetting,
  hideWorkpiece = false,
  phaseKind,
  workpieceMoving = false,
  workpieceCooling = false,
  children,
}: ForgeWorkbenchSceneProps) {
  const station = getStationForPhase(phaseKind, stepType);
  const heatLevel = getHeatLevel(heatSetting);

  const workpieceClass = [
    'forgeWorkbenchScene__workpiece',
    `forgeWorkbenchScene__workpiece--${station}`,
    `forgeWorkbenchScene__workpiece--${heatLevel}`,
    workpieceMoving ? 'forgeWorkbenchScene__workpiece--moving' : '',
    workpieceCooling ? 'forgeWorkbenchScene__workpiece--cooling' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="forgeWorkbenchScene">
      <div
        className="forgeWorkbenchScene__background"
        style={{ backgroundImage: `url(${forgeBackground})` }}
      />
      <div className="forgeWorkbenchScene__overlay">
        <div className="forgeWorkbenchScene__anchor forgeWorkbenchScene__anchor--furnace" aria-hidden="true" />
        <div className="forgeWorkbenchScene__anchor forgeWorkbenchScene__anchor--anvil" aria-hidden="true" />
        {!hideWorkpiece && (
          <div className={workpieceClass} aria-hidden="true" />
        )}
        {children && <div className="forgeWorkbenchScene__content">{children}</div>}
      </div>
    </div>
  );
}
