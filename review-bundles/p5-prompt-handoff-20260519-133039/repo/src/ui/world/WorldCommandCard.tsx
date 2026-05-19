import type { ReactNode } from 'react';

export function WorldCommandCard(props: {
  label: string;
  roleTag: string;
  bestUsedWhen: string;
  outputHint?: string | null;
  recommendedNow?: boolean;
  cta: ReactNode;
}) {
  const { label, roleTag, bestUsedWhen, outputHint, recommendedNow = false, cta } = props;
  return (
    <article className={`worldCommandCard ${recommendedNow ? 'worldCommandCard--recommended' : ''}`}>
      <div className="worldCommandCardHeader">
        <div className="worldCommandCardLabel">{label}</div>
        {recommendedNow ? <div className="worldCommandCardChip">Recommended now</div> : null}
      </div>
      <div className="worldCommandCardTag">{roleTag}</div>
      <div className="worldCommandCardLine">{bestUsedWhen}</div>
      {outputHint ? <div className="worldCommandCardHint">{outputHint}</div> : null}
      <div className="worldCommandCardCta">{cta}</div>
    </article>
  );
}
