import { useEffect, useMemo, useState } from 'react';
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
  debugInitialSelectedHeartLawId?: string | null;
  debugCanAffordOverride?: boolean;
}

interface DoctrineReadingCardProps {
  title: string;
  presentation: ReturnType<typeof getHeartLawSelectionPresentation> | null;
  locked: boolean;
  current: boolean;
}

function DoctrineReadingCard({ title, presentation, locked, current }: DoctrineReadingCardProps) {
  if (!presentation) {
    return (
      <article className="changeHeartLawModal__readingCard">
        <p className="changeHeartLawModal__readingLabel">{title}</p>
        <p className="changeHeartLawModal__readingTitle">No doctrine selected</p>
        <p className="changeHeartLawModal__readingLine">Choose a Heart Law to review doctrinal outcome.</p>
      </article>
    );
  }

  return (
    <article className="changeHeartLawModal__readingCard">
      <p className="changeHeartLawModal__readingLabel">{title}</p>
      <h3 className="changeHeartLawModal__readingTitle">{presentation.label}</h3>
      <p className="changeHeartLawModal__readingMeta">
        {presentation.familyLabel} • {presentation.tierLabel} • {presentation.resonanceLabel}
      </p>
      <p className="changeHeartLawModal__readingLine">{presentation.signatureSummary}</p>
      <p className="changeHeartLawModal__readingLine">{presentation.doctrineSubtitle}</p>
      <p className={`changeHeartLawModal__readingStatus ${locked ? 'is-warning' : 'is-ok'}`}>
        {current ? 'Current doctrine in this life.' : presentation.availabilityLine}
      </p>
    </article>
  );
}

export function ChangeHeartLawModal({
  currentHeartLawId,
  canChange,
  onClose,
  onChanged,
  debugInitialSelectedHeartLawId,
  debugCanAffordOverride,
}: ChangeHeartLawModalProps) {
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

  const [selected, setSelected] = useState<string | null>(debugInitialSelectedHeartLawId ?? currentHeartLawId);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setSelected(debugInitialSelectedHeartLawId ?? currentHeartLawId);
    setStatus(null);
  }, [currentHeartLawId, debugInitialSelectedHeartLawId]);

  const cost = useMemo(() => ({ gold: CHANGE_COST }), []);
  const canAfford = canAffordCurrency(cost);
  const effectiveCanAfford = debugCanAffordOverride ?? canAfford;
  const currentLaw = currentHeartLawId ? heartLaws.find((law) => law.id === currentHeartLawId) ?? null : null;
  const selectedLaw = selected ? heartLaws.find((law) => law.id === selected) ?? null : null;
  const selectedUnlocked = selected ? isUnlocked(selected) : false;

  const currentPresentation = currentLaw
    ? getHeartLawSelectionPresentation(currentLaw, {
      spiritRoot,
      isUnlocked: true,
      isSelected: currentLaw.id === selected,
    })
    : null;

  const selectedPresentation = selectedLaw
    ? getHeartLawSelectionPresentation(selectedLaw, {
      spiritRoot,
      isUnlocked: selectedUnlocked,
      isSelected: true,
    })
    : null;

  const actionState = resolveChangeHeartLawActionState({
    canAfford: effectiveCanAfford,
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
    if (!effectiveCanAfford) {
      setStatus('Insufficient Gold.');
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

  const isKeepCurrentAction = actionState.primaryLabel === 'Keep Current Law';

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
        <div className="changeHeartLawModal__actionLane" data-ui="change-heart-law-action-lane">
          <p id="change-heart-law-status" className="changeHeartLawModal__status" role="status" aria-live="polite">
            {status ?? actionState.disabledReason ?? '\u00A0'}
          </p>
          <div className="changeHeartLawModal__footerActions">
            <button type="button" className="changeHeartLawModal__button changeHeartLawModal__button--ghost uiNoShift" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={[
                'changeHeartLawModal__button',
                'changeHeartLawModal__button--primary',
                isKeepCurrentAction ? 'changeHeartLawModal__button--settled' : '',
                'uiNoShift',
              ].join(' ').trim()}
              disabled={actionState.primaryDisabled}
              onClick={handleConfirm}
              aria-describedby="change-heart-law-status"
            >
              {actionState.primaryLabel}
            </button>
          </div>
        </div>
      )}
      ariaLabel="Rewrite Heart Law"
    >
      <section className="changeHeartLawModal__decree" aria-label="Rewrite consequence decree">
        <p className="changeHeartLawModal__decreeEyebrow">Consequences of rewriting</p>
        <p className="changeHeartLawModal__decreeLead">
          Rewriting your Heart Law restarts doctrine progression in this life.
        </p>
        <div className="changeHeartLawModal__decreeFacts" role="list" aria-label="Rewrite consequences">
          <p className="changeHeartLawModal__decreeFact" role="listitem">Verse progress returns to <strong>Verse I</strong>.</p>
          <p className="changeHeartLawModal__decreeFact" role="listitem">Comprehension progress is cleared.</p>
          <p className="changeHeartLawModal__decreeFact" role="listitem">Cost: <strong>{CHANGE_COST} Gold</strong>.</p>
          <p className="changeHeartLawModal__decreeFact" role="listitem">Permission: <strong>{canChange ? 'Rewrite available now' : 'Cannot rewrite now'}</strong>.</p>
        </div>
      </section>

      <section className="changeHeartLawModal__readingPlane" aria-label="Current and selected doctrine reading">
        <DoctrineReadingCard
          title="Current Law"
          presentation={currentPresentation}
          locked={false}
          current
        />
        <DoctrineReadingCard
          title="Selected Law"
          presentation={selectedPresentation}
          locked={selected ? !selectedUnlocked : false}
          current={selected !== null && selected === currentHeartLawId}
        />
      </section>

      <section className="changeHeartLawModal__list" aria-label="Scripture selection list" data-ui="change-heart-law-scripture-list">
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
    </RitualModalFrame>
  );
}
