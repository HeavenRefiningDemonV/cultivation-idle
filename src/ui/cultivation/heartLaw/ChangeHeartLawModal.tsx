import { useMemo, useState } from 'react';
import { getHeartLawUnlockInfo } from '../../../systems/heartLaw/heartLawUnlockInfo.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useCultivationStore } from '../../../stores/cultivationStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import type { HeartLawDef } from '../../../content/index.js';
import './HeartLawPanel.scss';

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

  const handleConfirm = () => {
    if (!canChange) {
      setStatus('You may only change Heart Laws at the start of a new life or special moments.');
      return;
    }
    if (!selected) {
      setStatus('Select a Heart Law first.');
      return;
    }
    if (!isUnlocked(selected)) {
      setStatus('This Heart Law is locked.');
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

  const renderUnlockInfo = (law: HeartLawDef) => {
    const unlockInfo = getHeartLawUnlockInfo(law.tier);
    if (unlockInfo.kind === 'prestige') {
      return `Unlock: ${unlockInfo.upgradeName} (${unlockInfo.apCost} AP)`;
    }
    if (unlockInfo.kind === 'starter') return 'Starter Heart Law';
    return 'Locked — Unlock via Prestige';
  };

  return (
    <div className="heartLawChangeOverlay" role="dialog" aria-modal="true">
      <div className="heartLawChangeModal">
        <div className="modalHeader">
          <div>
            <div className="modalTitle">Change Heart Law</div>
            <div className="modalSub">Rewriting your foundation is perilous.</div>
          </div>
          <button type="button" className="ghostButton" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="modalBody">
          <div className="inlineMessage inlineMessage--warning">
            Changing your Heart Law resets you to Verse I and clears comprehension.
          </div>
          <div className="modalCost">Cost: {CHANGE_COST} Gold</div>
          {!canAfford ? <div className="inlineMessage inlineMessage--error">Not enough Gold to rewrite.</div> : null}

          <div className="heartLawList">
            {heartLaws.map((law) => {
              const unlocked = isUnlocked(law.id);
              const isActive = selected === law.id;
              return (
                <button
                  type="button"
                  key={law.id}
                  className={`heartLawOption ${isActive ? 'heartLawOption--active' : ''} ${unlocked ? '' : 'heartLawOption--locked'}`}
                  disabled={!canChange || !unlocked}
                  onClick={() => setSelected(law.id)}
                  title={!unlocked ? renderUnlockInfo(law) : undefined}
                >
                  <div className="heartLawOptionName">{law.name}</div>
                  <div className="heartLawOptionMeta">
                    <span className="pill">{law.tier ?? 'unknown tier'}</span>
                    <span className="pill">{law.archetype ?? 'pattern'}</span>
                  </div>
                  <div className="heartLawOptionUnlock">{renderUnlockInfo(law)}</div>
                </button>
              );
            })}
          </div>
        </div>

        {status ? <div className="modalStatus">{status}</div> : null}

        <div className="modalActions">
          <button type="button" className="ghostButton" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primaryButton"
            disabled={!canChange || !selected || !canAfford}
            onClick={handleConfirm}
            title={!canChange ? 'You may only change Heart Laws at the start of a new life.' : undefined}
          >
            Confirm Change
          </button>
        </div>
      </div>
    </div>
  );
}
