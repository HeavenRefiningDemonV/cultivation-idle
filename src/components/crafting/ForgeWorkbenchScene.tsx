import type { ReactNode } from 'react';

import type { CraftStep } from '../../systems/crafting/craftingTypes';
import forgeBackground from '../../assets/background/forgewide_empty.png';
import './ForgeWorkbenchScene.scss';

type ForgeWorkbenchSceneProps = {
  stepType: CraftStep['type'] | undefined;
  heatSetting: number;
  hideWorkpiece?: boolean;
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

const getHeatLevel = (heatSetting: number): 'low' | 'mid' | 'high' => {
  if (heatSetting >= 800) return 'high';
  if (heatSetting >= 450) return 'mid';
  return 'low';
};

export function ForgeWorkbenchScene({ stepType, heatSetting, hideWorkpiece = false, children }: ForgeWorkbenchSceneProps) {
  const station = getStationForStep(stepType);
  const heatLevel = getHeatLevel(heatSetting);

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
          <div
            className={`forgeWorkbenchScene__workpiece forgeWorkbenchScene__workpiece--${station} forgeWorkbenchScene__workpiece--${heatLevel}`}
            aria-hidden="true"
          />
        )}
        {children && <div className="forgeWorkbenchScene__content">{children}</div>}
      </div>
    </div>
  );
}
