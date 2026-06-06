import type { DaoHeartActivityId } from '../../content/types.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { useUIStore } from '../../stores/uiStore.js';

export function useDaoHeartSanctuaryActionController() {
  const startDaoHeartPractice = useCultivationStore((state) => state.startDaoHeartPractice);
  const stopDaoHeartPractice = useCultivationStore((state) => state.stopDaoHeartPractice);

  return {
    startPractice: (practiceId: DaoHeartActivityId) => startDaoHeartPractice(practiceId),
    stopPractice: () => stopDaoHeartPractice('daoHeart:sanctuary-stop'),
    openSpiritRootObservation: () => useUIStore.getState().openSpiritRootObservation('fit'),
  };
}
