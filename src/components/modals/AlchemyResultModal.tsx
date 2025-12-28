import classNames from 'classnames';
import { getItemDef } from '../../stores/contentStore';
import type { AlchemyHandsOnResult } from '../../systems/crafting/craftingTypes';
import './AlchemyResultModal.scss';

interface AlchemyResultModalProps {
  result: AlchemyHandsOnResult;
  recipeName: string;
  onClose: () => void;
  onCraftAgain?: () => void;
  onQueueIdle?: () => void;
}

const masteryThresholds: Array<{ value: 25 | 50 | 75 | 100; label: string }> = [
  { value: 25, label: 'Assisted prompts improve yield more.' },
  { value: 50, label: 'Batch crafting unlocked (x5 options).' },
  { value: 75, label: 'Alchemy time reduced slightly.' },
  { value: 100, label: 'Idle: higher baseline quality.' },
];

function getThresholdLabel(value: number): string {
  const match = masteryThresholds.find((entry) => entry.value === value);
  return match?.label ?? '';
}

function formatSeconds(sec: number): string {
  const clamped = Math.max(0, Math.floor(sec));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function AlchemyResultModal({ result, recipeName, onClose, onCraftAgain, onQueueIdle }: AlchemyResultModalProps) {
  const gradeLabel = result.grade.charAt(0).toUpperCase() + result.grade.slice(1);
  const masteryPercent = Math.min(100, Math.max(0, result.masteryAfter));
  const nextThreshold = masteryThresholds.find((entry) => entry.value > masteryPercent) ?? null;

  return (
    <div className="modalOverlay alchemyResultModal">
      <div className="modalCard">
        <div className="modalHeader">
          <div>
            <div className="modalTitle">Hands-on Result</div>
            <div className="modalSubtitle">{recipeName}</div>
          </div>
          <div className={classNames('alchemyResultGrade', `alchemyResultGrade--${result.grade}`)}>{gradeLabel}</div>
        </div>

        <div className="modalBody">
          <div className="alchemyResultGrid">
            <div className="alchemyResultSection">
              <div className="sectionLabel">Outputs</div>
              {result.outputsGranted.map((entry) => {
                const def = getItemDef(entry.itemId);
                return (
                  <div key={entry.itemId} className="resultRow">
                    <div>{def?.name ?? entry.itemId}</div>
                    <div className="resultQty">x{entry.qty}</div>
                  </div>
                );
              })}
              {result.byproductsGranted.length > 0 && (
                <div className="alchemyResultSub">
                  Byproducts:
                  {result.byproductsGranted.map((entry) => {
                    const def = getItemDef(entry.itemId);
                    return (
                      <div key={entry.itemId} className="resultRow">
                        <div>{def?.name ?? entry.itemId}</div>
                        <div className="resultQty">x{entry.qty}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="alchemyResultSection">
              <div className="sectionLabel">Scores</div>
              <div className="resultRow">Heat: {result.scoreBreakdown.heat}</div>
              <div className="resultRow">Stability: {result.scoreBreakdown.stability}</div>
              <div className="resultRow">Order: {result.scoreBreakdown.order}</div>
              <div className="resultRow">QTE: {result.scoreBreakdown.qte}</div>
              <div className="resultRow resultTotal">Total: {result.scoreBreakdown.total}</div>
              <div className="resultRow">Yield multiplier: {result.yieldMultiplier.toFixed(2)}x</div>
              <div className="resultRow">Impurities: {result.impurities}</div>
            </div>

            <div className="alchemyResultSection">
              <div className="sectionLabel">Timing</div>
              <div className="resultRow">Baseline: {formatSeconds(result.baselineTimeSec)}</div>
              <div className="resultRow">Elapsed: {formatSeconds(result.elapsedSec)}</div>
              <div className="resultRow">Time saved: {formatSeconds(result.timeSavedSec)}</div>
            </div>
          </div>

          <div className="alchemyResultSection">
            <div className="sectionLabel">Mastery</div>
            <div className="masteryRow">
              <div className="masteryBar">
                <div className="masteryFill" style={{ width: `${masteryPercent}%` }} />
              </div>
              <div className="masteryText">
                {result.masteryBefore} ➜ {result.masteryAfter} (+{result.masteryGain})
              </div>
            </div>
            <div className="masterySub">
              Next unlock: {nextThreshold ? `${nextThreshold.value} — ${getThresholdLabel(nextThreshold.value)}` : 'All reached'}
            </div>
          </div>
        </div>

        <div className="modalActions">
          <button type="button" className="worldScreenModuleButton" onClick={onQueueIdle}>
            Queue Idle
          </button>
          <button
            type="button"
            className="worldScreenModuleButton worldScreenModuleButton--active"
            onClick={onCraftAgain}
          >
            Craft Again (Hands-on)
          </button>
          <button type="button" className="worldScreenModuleButton" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
