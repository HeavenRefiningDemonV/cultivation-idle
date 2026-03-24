import type { ReactNode } from 'react';
import type { OutskirtsActivityRewardReadModel } from '../../systems/economy/activityRewardReadModel.js';

export function OutskirtsSummaryCard(props: {
  model: OutskirtsActivityRewardReadModel;
  expectedOutputs: string;
  trackedBountyLine?: ReactNode;
  postureHint?: string | null;
}) {
  const { model, expectedOutputs, trackedBountyLine, postureHint } = props;
  return (
    <section className="outskirtsSummaryCard">
      <div className="outskirtsSummaryCard__header">
        <strong>Outskirts</strong>
        <span>{model.roleTag}</span>
      </div>
      <div>{model.bestUsedWhen}</div>
      <div>Expected outputs: {expectedOutputs}</div>
      <div>{model.boundaryLine}</div>
      {trackedBountyLine}
      {postureHint ? <div className="outskirtsSummaryCard__hint">{postureHint}</div> : null}
    </section>
  );
}
