import { useMemo } from 'react';
import type { InsightChoiceId, InsightMomentState } from '../../types/index.js';
import './InsightMomentToast.scss';

interface Props {
  insight: InsightMomentState;
  now: number;
  onChoose: (choiceId: InsightChoiceId) => void;
}

const FLAVOR: Record<InsightChoiceId, string> = {
  contemplate: 'Focus inward for a burst of insight.',
  stabilize: 'Calm your breath to steady your foundation.',
  drawQi: 'Absorb ambient qi for a quick boost.',
};

export function InsightMomentToast({ insight, now, onChoose }: Props) {
  const remainingMs = Math.max(0, insight.expiresAt - now);
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  const choices = useMemo(() => insight.choices ?? [], [insight.choices]);

  return (
    <div className="insightToast">
      <div className="insightToastHeader">
        <div>
          <div className="insightToastTitle">Insight Moment</div>
          <div className="insightToastSub">Your mind brushes against the next verse…</div>
        </div>
        <div className="insightToastCountdown">Auto in {remainingSeconds}s</div>
      </div>
      <div className="insightToastChoices">
        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className="insightToastChoice"
            onClick={() => onChoose(choice.id as InsightChoiceId)}
          >
            <div className="insightChoiceTitle">{choice.title}</div>
            <div className="insightChoiceDesc">{choice.description || FLAVOR[choice.id as InsightChoiceId]}</div>
            {choice.id === insight.defaultChoiceId ? (
              <div className="insightDefault">Default on timeout</div>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
