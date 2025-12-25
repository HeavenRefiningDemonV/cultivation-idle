import { useEffect, useMemo, useState } from 'react';
import './RankUpgradeRitualModal.scss';
import { useContentStore } from '../../stores/contentStore';
import { rankMultiplier, useTechCollectionStore } from '../../stores/techCollectionStore';

interface RankUpgradeRitualModalProps {
  techId: string;
  onClose: () => void;
}

type RitualStage = 'idle' | 'animating' | 'result';

const RUNE_DUST_ITEM_ID = 'mat_rune_dust';

export function RankUpgradeRitualModal({ techId, onClose }: RankUpgradeRitualModalProps) {
  const techniquesById = useContentStore((state) => state.maps.techniquesById);
  const itemsById = useContentStore((state) => state.maps.itemsById);
  const entry = useTechCollectionStore((state) => state.unlockedTechs[techId]);
  const fragmentsMap = useTechCollectionStore((state) => state.fragments);
  const getNextRankCost = useTechCollectionStore((state) => state.getNextRankCost);
  const upgradeRank = useTechCollectionStore((state) => state.upgradeRank);

  const [stage, setStage] = useState<RitualStage>('idle');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setStage('idle');
    setProgress(0);
    setStatus(null);
  }, [techId]);

  const fragmentsOwned = fragmentsMap[techId] ?? 0;
  const nextRankInfo = useMemo(
    () => getNextRankCost(techId),
    [getNextRankCost, techId, entry?.rank, entry?.manualGrade, fragmentsOwned],
  );
  const cost = nextRankInfo?.cost;
  const name = techniquesById[techId]?.name ?? techId;
  const currentRank = entry?.rank ?? 1;
  const nextRank = nextRankInfo?.nextRank ?? currentRank + 1;
  const powerDeltaPct = nextRankInfo ? (rankMultiplier(nextRank) / rankMultiplier(currentRank) - 1) * 100 : 0;
  const runeDustName = itemsById[RUNE_DUST_ITEM_ID]?.name ?? 'Rune Dust';
  const soulInkName = cost ? itemsById[cost.soulInkItemId]?.name ?? cost.soulInkItemId : 'Soul Ink';
  const ritualDisabledReason = !nextRankInfo ? 'Rank cap reached for current grade.' : null;

  const playRitual = () => {
    if (!nextRankInfo || stage === 'animating') return;
    setStage('animating');
    setStatus(null);
    const start = performance.now();
    const duration = 850;

    const step = (now: number) => {
      const pct = Math.min(1, (now - start) / duration);
      setProgress(pct);
      if (pct < 1) {
        window.requestAnimationFrame(step);
        return;
      }

      const result = upgradeRank(techId);
      if (result.ok) {
        setStatus({ type: 'success', text: `Power increased: +${powerDeltaPct.toFixed(0)}%` });
      } else {
        setStatus({ type: 'error', text: result.reason ?? 'Upgrade failed. Check materials.' });
      }
      setStage('result');
      setProgress(1);
    };

    window.requestAnimationFrame(step);
  };

  return (
    <div className="rankRitualOverlay">
      <div className="rankRitualModal">
        <div className="rankRitualHeader">
          <div>
            <div className="rankRitualTitle">Condense Fragments</div>
            <div className="rankRitualSubtitle">Forge a stronger art by advancing its rank.</div>
          </div>
          <button className="rankRitualClose" onClick={onClose} aria-label="Close Rank Upgrade">
            ✕
          </button>
        </div>

        <div className="rankRitualBody">
          <div className="rankRitualName">{name}</div>
          <div className="rankRitualRanks">
            <span className="rankRitualBadge">Rank {currentRank}</span>
            <span className="rankRitualArrow">→</span>
            <span className="rankRitualBadge rankRitualBadgeNext">Rank {nextRank}</span>
          </div>

          <div className="rankRitualPower">Power increase: +{powerDeltaPct.toFixed(0)}%</div>

          {cost ? (
            <div className="rankRitualCosts">
              <div>
                Technique Fragments: {fragmentsOwned}/{cost.fragmentsRequired}
              </div>
              <div>
                {runeDustName}: {cost.runeDustRequired}
              </div>
              <div>
                {soulInkName}: {cost.soulInkRequired}
              </div>
            </div>
          ) : (
            <div className="rankRitualCosts">Rank cap reached for current grade.</div>
          )}

          <div className="rankRitualProgress">
            <div className="rankRitualProgressBar">
              <div className="rankRitualProgressFill" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <div className="rankRitualProgressText">
              {stage === 'animating' ? 'Condensing fragments...' : 'Ready to condense fragments'}
            </div>
          </div>

          {status && (
            <div className={`rankRitualStatus ${status.type === 'success' ? 'is-success' : 'is-error'}`}>
              {status.text}
            </div>
          )}
        </div>

        <div className="rankRitualActions">
          <button className="rankRitualButton rankRitualButtonSecondary" onClick={onClose}>
            Close
          </button>
          <button
            className="rankRitualButton"
            onClick={playRitual}
            disabled={Boolean(ritualDisabledReason) || stage === 'animating'}
            title={ritualDisabledReason ?? undefined}
          >
            Condense Fragments
          </button>
        </div>
      </div>
    </div>
  );
}
