import { useMemo } from 'react';

export type PrestigeLedgerActionControllerArgs = {
  canPrestigeNow: boolean;
  requirePrestigeConfirm: boolean;
  setShowConfirmation: (open: boolean) => void;
  setSellBeforePrestige: (sell: boolean) => void;
  setRitualError: (message: string | null) => void;
  setLibraryOpen: (open: boolean) => void;
  setApBreakdownOpen: (open: boolean) => void;
  setSelectedUpgradeId: (upgradeId: string | null) => void;
  openLifeSummaryModal: () => void;
  performImmediatePrestige: (sellBeforePrestige: boolean) => void;
};

export type PrestigeLedgerActionController = {
  reviewAndReincarnate: (sellBeforePrestige?: boolean) => void;
  openDecreeLibrary: () => void;
  closeDecreeLibrary: () => void;
  openApBreakdown: () => void;
  viewLifeSummary: () => void;
  inspectUpgrade: (upgradeId: string) => void;
};

export function createPrestigeLedgerActionController({
  canPrestigeNow,
  requirePrestigeConfirm,
  setShowConfirmation,
  setSellBeforePrestige,
  setRitualError,
  setLibraryOpen,
  setApBreakdownOpen,
  setSelectedUpgradeId,
  openLifeSummaryModal,
  performImmediatePrestige,
}: PrestigeLedgerActionControllerArgs): PrestigeLedgerActionController {
  return {
    reviewAndReincarnate: (sellBeforePrestige = false) => {
      if (!canPrestigeNow) return;
      setSellBeforePrestige(sellBeforePrestige);
      setRitualError(null);

      if (requirePrestigeConfirm) {
        setShowConfirmation(true);
        return;
      }

      performImmediatePrestige(sellBeforePrestige);
    },
    openDecreeLibrary: () => setLibraryOpen(true),
    closeDecreeLibrary: () => setLibraryOpen(false),
    openApBreakdown: () => setApBreakdownOpen(true),
    viewLifeSummary: () => openLifeSummaryModal(),
    inspectUpgrade: (upgradeId: string) => setSelectedUpgradeId(upgradeId),
  };
}

export function usePrestigeLedgerActionController(args: PrestigeLedgerActionControllerArgs): PrestigeLedgerActionController {
  return useMemo(
    () => createPrestigeLedgerActionController(args),
    [
      args,
    ],
  );
}
