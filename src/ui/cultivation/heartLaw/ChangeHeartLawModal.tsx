import { useMemo, useState } from 'react';
import { useContentStore } from '../../../stores/contentStore.js';
import { useCultivationStore } from '../../../stores/cultivationStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { usePrestigeStore } from '../../../stores/prestigeStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import type { HeartLawDef } from '../../../content/index.js';
import { RitualModalFrame } from '../../../ui/shell/index.js';
import { getHeartLawSelectionPresentation } from '../../../systems/doctrine/heartLawSelectionPresentation.js';
import { resolveChangeHeartLawActionState } from './changeHeartLawModalState.js';
import './ChangeHeartLawModal.scss';

import { CHANGE_HEART_LAW_COST } from '../../../systems/economy/meritRoleAudit.js';

const CHANGE_COST = CHANGE_HEART_LAW_COST.gold;

interface ChangeHeartLawModalProps {
  currentHeartLawId: string | null;
  canChange: boolean;
  onClose: () => void;
  onChanged?: (id: string) => void;
}

export function ChangeHeartLawModal({ currentHeartLawId, canChange, onClose, onChanged }: ChangeHeartLawModalProps) {
  const listHeartLaws = useContentStore((state) => state.listHeartLaws);
  const isLoaded = useContentStore((state) => state.isLoaded);
  const isUnlocked = useCultivationStore((state) => state.isUnlocked);
  const selectHeartLaw = useCultivationStore((state) => state.selectHeartLaw);
  const spiritRoot = usePrestigeStore((state) => state.spiritRoot);
  const canAffordCurrency = useInventoryStore((state) => state.canAffordCurrency);
  const spendCurrencies = useInventoryStore((state) => state.spendCurrencies);
  const addNotification = useUIStore((state) => state.addNotification);

  const heartLaws = useMemo<HeartLawDef[]>(() => {
    if (!isLoaded) return [];
    try {
      return listHeartLaws();
    } catch (error) {
      console.warn('Heart laws not ready', error);
      return [];
    }
  }, [isLoaded, listHeartLaws]);

  const [selected, setSelected] = useState<string | null>(currentHeartLawId);
  const [status, setStatus] = useState<string | null>(null);

  const cost = useMemo(() => ({ gold: CHANGE_COST }), []);
  const canAfford = canAffordCurrency(cost);
  const selectedLaw = selected ? heartLaws.find((law) => law.id === selected) ?? null : null;
  const selectedUnlocked = selected ? isUnlocked(selected) : false;

  const selectedPresentation = selectedLaw
    ? getHeartLawSelectionPresentation(selectedLaw, {
      spiritRoot,
      isUnlocked: selectedUnlocked,
      isSelected: true,
    })
    : null;

  const actionState = resolveChangeHeartLawActionState({
    canAfford,
    canChange,
    selectedHeartLawId: selected,
    currentHeartLawId,
    selectedUnlocked,
    selectedUnlockLine: selectedPresentation?.unlockLine ?? null,
  });

  const handleConfirm = () => {
    if (!canChange) {
      setStatus('Heart Law rewriting is unavailable right now.');
      return;
    }
    if (!selected) {
      setStatus('Select a Heart Law first.');
      return;
    }
    if (!isUnlocked(selected)) {
      setStatus(selectedPresentation?.unlockLine ?? 'This Heart Law is locked.');
      return;
    }
    if (selected === currentHeartLawId) {
      onClose();
      return;
    }
    const success = spendCurrencies(cost);
    if (!success) {
      setStatus('Insufficient Gold.');
      return;
    }
    selectHeartLaw(selected);
    addNotification('success', 'Heart Law rewritten. Verse progress reset.', 4000);
    onChanged?.(selected);
    onClose();
  };

  return (
    <RitualModalFrame
      open
      onClose={onClose}
      title="Rewrite Heart Law"
      subtitle="Rewriting your foundation is perilous."
      variant="ritual"
      size="md"
      className="changeHeartLawModal"
      bodyClassName="changeHeartLawModal__body"
      footer={(
        <div className="changeHeartLawModal__footerActions">
          <button type="button" className="changeHeartLawModal__button changeHeartLawModal__button--ghost uiNoShift" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="changeHeartLawModal__button changeHeartLawModal__button--primary uiNoShift"
            disabled={actionState.primaryDisabled}
            onClick={handleConfirm}
            aria-describedby={actionState.primaryDisabled ? 'change-heart-law-status' : undefined}
          >
            {actionState.primaryLabel}
          </button>
        </div>
      )}
      ariaLabel="Rewrite Heart Law"
    >
      <section className="changeHeartLawModal__warning" aria-label="Rewrite warning">
        <p>
          Changing your Heart Law resets you to <strong>Verse I</strong> and clears comprehension progress.
        </p>
      </section>

      <section className="changeHeartLawModal__supportRail" aria-label="Cost and restriction">
        <div className="changeHeartLawModal__railItem">
          <span className="changeHeartLawModal__railLabel">Cost</span>
          <span className="changeHeartLawModal__railValue">{CHANGE_COST} Gold</span>
        </div>
        <div className="changeHeartLawModal__railItem">
          <span className="changeHeartLawModal__railLabel">Affordability</span>
          <span className={`changeHeartLawModal__railValue ${canAfford ? 'is-ok' : 'is-warning'}`}>
            {canAfford ? 'Ready' : 'Not enough Gold'}
          </span>
        </div>
        <div className="changeHeartLawModal__railItem">
          <span className="changeHeartLawModal__railLabel">Permission</span>
          <span className={`changeHeartLawModal__railValue ${canChange ? 'is-ok' : 'is-warning'}`}>
            {canChange ? 'Rewrite available' : 'Cannot rewrite now'}
          </span>
        </div>
      </section>

      <section className="changeHeartLawModal__summary" aria-label="Selected scripture summary">
        {selectedPresentation ? (
          <>
            <div className="changeHeartLawModal__summaryHeader">
              <h3>{selectedPresentation.label}</h3>
              <div className="changeHeartLawModal__summaryBadges">
                <span className="changeHeartLawModal__badge">{selectedPresentation.familyLabel}</span>
                <span className="changeHeartLawModal__badge">{selectedPresentation.tierLabel}</span>
                <span className={`changeHeartLawModal__badge is-resonance-${selectedPresentation.resonanceTone}`}>
                  {selectedPresentation.resonanceLabel}
                </span>
              </div>
            </div>
            <p className="changeHeartLawModal__summaryLine">{selectedPresentation.signatureSummary}</p>
            {selectedPresentation.isLocked ? (
              <p className="changeHeartLawModal__summaryLock">{selectedPresentation.availabilityLine}</p>
            ) : null}
          </>
        ) : (
          <p className="changeHeartLawModal__summaryPlaceholder">Select a Heart Law to review rewrite details.</p>
        )}
      </section>

      <section className="changeHeartLawModal__list" aria-label="Heart Law selection list">
        {heartLaws.map((law) => {
          const unlocked = isUnlocked(law.id);
          const isSelected = selected === law.id;
          const isCurrent = currentHeartLawId === law.id;
          const presentation = getHeartLawSelectionPresentation(law, {
            spiritRoot,
            isUnlocked: unlocked,
            isSelected,
          });

          return (
            <button
              type="button"
              key={law.id}
              className={[
                'changeHeartLawModal__row',
                isSelected ? 'is-selected' : '',
                isCurrent ? 'is-current' : '',
                unlocked ? '' : 'is-locked',
              ].join(' ').trim()}
              onClick={() => {
                setSelected(law.id);
                setStatus(null);
              }}
              aria-pressed={isSelected}
              aria-current={isCurrent ? 'true' : undefined}
            >
              <div className="changeHeartLawModal__rowMain">
                <div className="changeHeartLawModal__rowTitle">{presentation.label}</div>
                <div className="changeHeartLawModal__rowMeta">
                  <span>{presentation.familyLabel}</span>
                  <span>{presentation.tierLabel}</span>
                  <span>{presentation.resonanceLabel}</span>
                </div>
                <div className="changeHeartLawModal__rowHint">
                  {unlocked ? presentation.signatureSummary : presentation.availabilityLine}
                </div>
              </div>
              <div className="changeHeartLawModal__rowFlags" aria-hidden="true">
                <span className="changeHeartLawModal__flag">{isCurrent ? 'Current' : '\u00A0'}</span>
                <span className="changeHeartLawModal__flag">{isSelected ? 'Selected' : '\u00A0'}</span>
                <span className="changeHeartLawModal__flag">{unlocked ? 'Unlocked' : 'Locked'}</span>
              </div>
            </button>
          );
        })}
      </section>

      <div id="change-heart-law-status" className="changeHeartLawModal__status" role="status" aria-live="polite">
        {status ?? actionState.disabledReason ?? '\u00A0'}
      </div>
    </RitualModalFrame>
  );
}
