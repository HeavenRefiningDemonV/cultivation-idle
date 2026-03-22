import { ForgeWorkshop } from '../../features/professions/forge/ForgeWorkshop.js';

interface ForgePanelProps {
  cityId: string | null;
}

/**
 * Legacy wrapper kept only so any stale imports inherit the semester-safe live Forge surface.
 */
export function ForgePanel({ cityId }: ForgePanelProps) {
  return <ForgeWorkshop cityId={cityId} />;
}
