import { GateTrialBuildingPanel } from '../screens/world/buildings/GateTrialBuildingPanel';

export interface GateTrialModalProps {
  cityId: string;
}

export function GateTrialModal({ cityId }: GateTrialModalProps) {
  return <GateTrialBuildingPanel cityId={cityId} />;
}
