import { OutskirtsBuildingPanel } from '../screens/world/buildings/OutskirtsBuildingPanel';

export interface OutskirtsModalProps {
  cityId: string;
}

export function OutskirtsModal({ cityId }: OutskirtsModalProps) {
  return <OutskirtsBuildingPanel cityId={cityId} />;
}
